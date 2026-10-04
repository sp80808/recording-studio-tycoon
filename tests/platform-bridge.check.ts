/**
 * PlatformBridge web-fallback checks (bead 84a.1).
 * Node has no window/navigator: every surface must degrade without throwing.
 */
import assert from 'node:assert/strict';
import {
  detectPlatformKind,
  getPlatform,
  resetPlatformForTests,
  setBillboardAdapter,
  setCloudAdapter,
} from '../src/platform/index';

console.log('platform-bridge checks…');

const run = async () => {
  resetPlatformForTests();

  // Node host probes as web.
  assert.equal(detectPlatformKind(), 'web');

  const p = getPlatform();
  assert.equal(p.kind, 'web');
  // Singleton identity (zero-overhead facade).
  assert.equal(getPlatform(), p);

  // Capabilities all report disabled on a bare Node host.
  assert.equal(p.capabilities.haptics, false);
  assert.equal(p.capabilities.presence, false);
  assert.equal(p.capabilities.cloudSave, false);
  assert.equal(p.capabilities.billboard, false);
  assert.equal(p.capabilities.nativeShare, false);

  // Haptics: safe no-op, toggle round-trips.
  p.haptics.tick();
  p.haptics.tick([20, 30, 20]);
  assert.equal(p.haptics.enabled, true);
  p.haptics.setEnabled(false);
  assert.equal(p.haptics.enabled, false);
  p.haptics.tick();
  p.haptics.setEnabled(true);

  // Presence: no-op, never throws.
  p.presence.setActivity({ details: 'Tracking', state: 'Studio A' });
  p.presence.clearActivity();

  // Cloud without adapter: typed unavailable, never rejects.
  assert.equal(p.cloud.available, false);
  assert.equal(p.cloud.providerId, 'none');
  assert.deepEqual(await p.cloud.upload('slot1', '{}'), { ok: false, reason: 'unavailable' });
  assert.deepEqual(await p.cloud.download('slot1'), { ok: false, reason: 'unavailable' });
  assert.deepEqual(await p.cloud.listSlots(), { ok: false, reason: 'unavailable' });

  // Billboard without adapter: same contract.
  assert.equal(p.billboard.available, false);
  const entry = { title: 'T', artist: 'A', genre: 'rock', score: 92 };
  assert.deepEqual(await p.billboard.submitTopHit(entry), { ok: false, reason: 'unavailable' });
  assert.deepEqual(await p.billboard.fetchGlobalTop(10), { ok: false, reason: 'unavailable' });

  // Sharing without navigator: typed unavailable, never rejects.
  assert.deepEqual(
    await p.sharing.share({ title: 'T', text: 'X' }),
    { ok: false, reason: 'unavailable' },
  );

  // Adapter seam: registering adapters flips availability + provider.
  setCloudAdapter({
    providerId: 'supabase',
    upload: async () => ({ ok: true }),
    download: async () => ({ ok: true, payload: '{}' }),
    listSlots: async () => ({ ok: true, slots: [{ slot: 'slot1', updatedAt: 1 }] }),
  });
  const withCloud = getPlatform();
  assert.notEqual(withCloud, p);
  assert.equal(withCloud.cloud.available, true);
  assert.equal(withCloud.cloud.providerId, 'supabase');
  assert.equal(withCloud.capabilities.cloudSave, true);
  assert.deepEqual(await withCloud.cloud.upload('slot1', '{}'), { ok: true });
  const dl = await withCloud.cloud.download('slot1');
  assert.equal(dl.payload, '{}');

  setBillboardAdapter({
    submitTopHit: async () => ({ ok: true }),
    fetchGlobalTop: async (limit: number) => ({ ok: true, rows: limit > 0 ? [entry] : [] }),
  });
  const withBoth = getPlatform();
  assert.equal(withBoth.billboard.available, true);
  assert.equal(withBoth.capabilities.billboard, true);
  assert.deepEqual(await withBoth.billboard.submitTopHit(entry), { ok: true });
  const top = await withBoth.billboard.fetchGlobalTop(10);
  assert.equal(top.rows?.length, 1);

  resetPlatformForTests();
  assert.equal(getPlatform().cloud.available, false);
};

run().then(
  () => console.log('✓ platform-bridge checks passed'),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
