// Supabase cloud-save adapter (anonymous guest sync + slot management) — bead 84a.2.
//
// Offline-first contract: local saves are the source of truth; every method
// here is best-effort and returns a typed CloudResult instead of throwing.
// Requires the `cloud_saves` table (see supabase/migrations/*_cloud_saves.sql)
// with RLS owner-policies, and Anonymous sign-ins enabled in the Supabase
// dashboard for guest sync.
//
// The adapter depends on a minimal structural client (not the full
// SupabaseClient type) so node checks can inject a fake without bundling
// supabase-js.

import type { BillboardAdapter, BillboardEntry, BillboardResult, CloudAdapter, CloudResult, CloudSlotSummary } from './types';
import { setBillboardAdapter, setCloudAdapter } from './platformBridge';

export const CLOUD_SAVES_TABLE = 'cloud_saves';
/** Local slot mirrored to the cloud for the active career. */
export const CAREER_CLOUD_SLOT = 'career';

interface GuestUser {
  id: string;
}

interface AuthLike {
  signInAnonymously(): Promise<{ data: { user: GuestUser | null }; error: { message: string } | null }>;
  getUser(): Promise<{ data: { user: GuestUser | null } }>;
}

interface QueryLike {
  eq(col: string, val: string): QueryLike;
  order(col: string, opts?: { ascending?: boolean }): QueryLike;
  maybeSingle<T>(): Promise<{ data: T | null; error: { message: string; code?: string } | null }>;
}

interface TableLike {
  upsert(row: Record<string, unknown>, opts?: { onConflict?: string }): Promise<{ error: { message: string } | null }>;
  select(cols: string): QueryLike;
}

/** Minimal surface of SupabaseClient used here. */
export interface SupabaseLike {
  auth: AuthLike;
  from(table: string): TableLike;
}

interface CloudRow {
  user_id: string;
  slot: string;
  payload: string;
  updated_at: string;
}

const isOffline = (): boolean => {
  try {
    return typeof navigator !== 'undefined' && navigator.onLine === false;
  } catch {
    return false;
  }
};

const OFFLINE: CloudResult = { ok: false, reason: 'offline' };

let cachedGuestId: string | null = null;

/** Test seam: forget the cached guest identity. */
export const resetCloudAuthForTests = (): void => {
  cachedGuestId = null;
};

/** Resolve (and cache) the anonymous guest user id. Null when unavailable. */
export const ensureGuestUserId = async (client: SupabaseLike): Promise<string | null> => {
  if (cachedGuestId) return cachedGuestId;
  if (isOffline()) return null;
  try {
    const existing = await client.auth.getUser();
    if (existing.data.user?.id) {
      cachedGuestId = existing.data.user.id;
      return cachedGuestId;
    }
    const anon = await client.auth.signInAnonymously();
    if (anon.error || !anon.data.user?.id) return null;
    cachedGuestId = anon.data.user.id;
    return cachedGuestId;
  } catch {
    return null;
  }
};

export const createSupabaseCloudAdapter = (client: SupabaseLike): CloudAdapter => {
  const guard = async (): Promise<{ uid: string } | CloudResult> => {
    if (isOffline()) return OFFLINE;
    const uid = await ensureGuestUserId(client);
    if (!uid) {
      // Offline and auth failure share no path: auth failed while online.
      return { ok: false, reason: isOffline() ? 'offline' : 'auth' };
    }
    return { uid };
  };

  return {
    providerId: 'supabase',

    async upload(slot: string, payload: string): Promise<CloudResult> {
      const g = await guard();
      if (!('uid' in g)) return g;
      try {
        const { error } = await client.from(CLOUD_SAVES_TABLE).upsert(
          { user_id: g.uid, slot, payload, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,slot' },
        );
        if (error) return { ok: false, reason: 'error', detail: error.message };
        return { ok: true };
      } catch (e) {
        return { ok: false, reason: 'error', detail: e instanceof Error ? e.message : 'upload' };
      }
    },

    async download(slot: string): Promise<CloudResult & { payload?: string }> {
      const g = await guard();
      if (!('uid' in g)) return g;
      try {
        const { data, error } = await client
          .from(CLOUD_SAVES_TABLE)
          .select('payload,updated_at')
          .eq('user_id', g.uid)
          .eq('slot', slot)
          .maybeSingle<{ payload: string; updated_at: string }>();
        if (error) return { ok: false, reason: 'error', detail: error.message };
        if (!data) return { ok: false, reason: 'error', detail: 'slot-empty' };
        return { ok: true, payload: data.payload };
      } catch (e) {
        return { ok: false, reason: 'error', detail: e instanceof Error ? e.message : 'download' };
      }
    },

    async listSlots(): Promise<CloudResult & { slots?: CloudSlotSummary[] }> {
      const g = await guard();
      if (!('uid' in g)) return g;
      try {
        // PostgREST builders are awaitable; the terminal resolves { data, error }.
        const { data, error } = (await client
          .from(CLOUD_SAVES_TABLE)
          .select('slot,updated_at')
          .eq('user_id', g.uid)
          .order('updated_at', { ascending: false })) as unknown as {
          data: CloudRow[] | null;
          error: { message: string } | null;
        };
        if (error) return { ok: false, reason: 'error', detail: error.message };
        return {
          ok: true,
          slots: (data ?? []).map((r) => ({ slot: r.slot, updatedAt: Date.parse(r.updated_at) || 0 })),
        };
      } catch (e) {
        return { ok: false, reason: 'error', detail: e instanceof Error ? e.message : 'list' };
      }
    },
  };
};

/**
 * Best-effort startup hook: anonymous sign-in, then register the cloud adapter
 * on the PlatformBridge. Returns true when cloud save is live. Never throws.
 * Call sites decide when (e.g. after first save, behind a settings toggle).
 */
export const initCloudSave = async (client: SupabaseLike): Promise<boolean> => {
  try {
    if (isOffline()) return false;
    const uid = await ensureGuestUserId(client);
    if (!uid) return false;
    setCloudAdapter(createSupabaseCloudAdapter(client));
    return true;
  } catch {
    return false;
  }
};

/** Placeholder global-charts adapter surface for bead 84a.3 (registered, disabled until wired). */
export const disabledBillboard: BillboardAdapter = {
  submitTopHit: (_entry: BillboardEntry) =>
    Promise.resolve<BillboardResult>({ ok: false, reason: 'unavailable' }),
  fetchGlobalTop: (_limit: number) =>
    Promise.resolve<BillboardResult>({ ok: false, reason: 'unavailable' }),
};

export const registerDisabledBillboard = (): void => {
  setBillboardAdapter(disabledBillboard);
};
