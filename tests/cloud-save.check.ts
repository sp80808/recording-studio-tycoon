/**
 * Cloud-save checks (bead 84a.2): IndexedDB local slots (in-memory fallback
 * in node) + Supabase guest adapter against a fake client. Nothing here hits
 * the network.
 */
import assert from 'node:assert/strict';
import {
  deleteLocalSaveSlot,
  listLocalSaveSlots,
  readLocalSaveSlot,
  resetLocalSaveStoreForTests,
  writeLocalSaveSlot,
} from '../src/platform/localSaveStore';
import {
  createSupabaseCloudAdapter,
  ensureGuestUserId,
  initCloudSave,
  resetCloudAuthForTests,
  resetPlatformForTests,
  type SupabaseLike,
} from '../src/platform/index';
import { getPlatform } from '../src/platform/index';

console.log('cloud-save checks…');

interface FakeOpts {
  user?: { id: string } | null;
  anonError?: boolean;
  upsertError?: string | null;
  row?: { payload: string; updated_at: string } | null;
  rows?: { slot: string; updated_at: string }[];
  listError?: string | null;
  calls?: { upserts: unknown[] };
}

const makeFakeClient = (opts: FakeOpts = {}): SupabaseLike => {
  const chain: Record<string, unknown> = {};
  chain['eq'] = () => chain;
  chain['order'] = () => chain;
  chain['maybeSingle'] = async () => ({ data: opts.row ?? null, error: null });
  // PostgREST builders are awaitable — resolve the list payload here.
  chain['then'] = (resolve: (v: unknown) => void) => {
    resolve({ data: opts.rows ?? [], error: opts.listError ? { message: opts.listError } : null });
  };
  return {
    auth: {
      getUser: async () => ({ data: { user: opts.user === undefined ? { id: 'guest-1' } : opts.user } }),
      signInAnonymously: async () =>
        opts.anonError
          ? { data: { user: null }, error: { message: 'anon-disabled' } }
          : { data: { user: { id: 'guest-1' } }, error: null },
    },
    from: (_table: string) => ({
      upsert: async (row: Record<string, unknown>) => {
        opts.calls?.upserts.push(row);
        return { error: opts.upsertError ? { message: opts.upsertError } : null };
      },
      select: (_cols: string) => chain,
    }),
  } as unknown as SupabaseLike;
};

const run = async () => {
  /* -------------------------------------------- local slots */
  resetLocalSaveStoreForTests();
  assert.equal(await readLocalSaveSlot('career'), null);
  assert.equal(await writeLocalSaveSlot('career', '{"a":1}'), true);
  assert.deepEqual(await readLocalSaveSlot('career'), {
    slot: 'career',
    payload: '{"a":1}',
    updatedAt: (await readLocalSaveSlot('career'))?.updatedAt,
  });
  await writeLocalSaveSlot('career-2', '{}');
  const slots = await listLocalSaveSlots();
  assert.equal(slots.length, 2);
  assert.ok(slots[0].updatedAt >= slots[1].updatedAt);
  assert.equal(await deleteLocalSaveSlot('career-2'), true);
  assert.equal(await readLocalSaveSlot('career-2'), null);
  resetLocalSaveStoreForTests();

  /* -------------------------------------------- guest auth */
  resetCloudAuthForTests();
  assert.equal(await ensureGuestUserId(makeFakeClient()), 'guest-1');
  // Cached: second call resolves without touching the client again.
  let authCalls = 0;
  const counting = makeFakeClient();
  const origGetUser = counting.auth.getUser;
  counting.auth.getUser = async () => {
    authCalls += 1;
    return origGetUser();
  };
  assert.equal(await ensureGuestUserId(counting), 'guest-1');
  assert.equal(authCalls, 0);

  resetCloudAuthForTests();
  assert.equal(await ensureGuestUserId(makeFakeClient({ user: null, anonError: true })), null);

  /* -------------------------------------------- adapter CRUD */
  resetCloudAuthForTests();
  const calls: { upserts: unknown[] } = { upserts: [] };
  const adapter = createSupabaseCloudAdapter(
    makeFakeClient({ row: { payload: '{"a":1}', updated_at: '2026-10-04T00:00:00.000Z' }, rows: [{ slot: 'career', updated_at: '2026-10-04T00:00:00.000Z' }], calls }),
  );
  const up = await adapter.upload('career', '{"a":1}');
  assert.equal(up.ok, true);
  assert.equal((calls.upserts[0] as Record<string, unknown>)['slot'], 'career');

  const dl = await adapter.download('career');
  assert.equal(dl.ok, true);
  assert.equal(dl.payload, '{"a":1}');

  resetCloudAuthForTests();
  const missing = createSupabaseCloudAdapter(makeFakeClient({ row: null }));
  const miss = await missing.download('career');
  assert.equal(miss.ok, false);
  assert.equal(miss.detail, 'slot-empty');

  const listed = await adapter.listSlots();
  assert.equal(listed.ok, true);
  assert.equal(listed.slots?.length, 1);
  assert.equal(listed.slots?.[0].slot, 'career');
  assert.ok((listed.slots?.[0].updatedAt ?? 0) > 0);

  resetCloudAuthForTests();
  const failing = createSupabaseCloudAdapter(makeFakeClient({ upsertError: 'denied', listError: 'denied' }));
  const fUp = await failing.upload('career', '{}');
  assert.equal(fUp.ok, false);
  assert.equal(fUp.reason, 'error');
  const fList = await failing.listSlots();
  assert.equal(fList.ok, false);

  /* -------------------------------------------- offline */
  // Node exposes navigator as a getter-only global, so stub via defineProperty.
  const navDesc = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', { value: { onLine: false }, configurable: true });
  try {
    resetCloudAuthForTests();
    const offlineAdapter = createSupabaseCloudAdapter(makeFakeClient());
    assert.deepEqual(await offlineAdapter.upload('career', '{}'), { ok: false, reason: 'offline' });
    assert.equal(await initCloudSave(makeFakeClient()), false);
  } finally {
    if (navDesc) Object.defineProperty(globalThis, 'navigator', navDesc);
    else delete (globalThis as Record<string, unknown>)['navigator'];
  }

  /* -------------------------------------------- init wiring */
  resetCloudAuthForTests();
  resetPlatformForTests();
  assert.equal(await initCloudSave(makeFakeClient()), true);
  assert.equal(getPlatform().cloud.available, true);
  assert.equal(getPlatform().cloud.providerId, 'supabase');
  assert.equal(getPlatform().capabilities.cloudSave, true);
  resetCloudAuthForTests();
  resetPlatformForTests();
  assert.equal(getPlatform().cloud.available, false);
};

run().then(
  () => console.log('✓ cloud-save checks passed'),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
