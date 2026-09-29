// Entitlement ledger — Flight Case Monetisation (beads 89o.4 / 89o.8).
// Purchased ownership lives HERE, never in GameState saves: resetting,
// exporting or importing a save cannot mint or destroy purchases.
// localStorage is an offline/read-only CACHE of this ledger, not the
// authority — the provider receipt is. The ledger is a pure, serializable
// class so tests drive it without a browser.

import type { EntitlementId, EntitlementKind, PurchaseReceipt, TransactionId } from './types';

export interface OwnedEntitlement {
  entitlementId: EntitlementId;
  kind: EntitlementKind;
  /** Resolved ref (for choose-1-of-3: the chosen preview ref). */
  ref: string;
  grantedByTransaction: TransactionId;
  grantedAt: number;
  revoked?: boolean;
  revokeReason?: string;
}

export interface LedgerSnapshot {
  version: 1;
  entitlements: OwnedEntitlement[];
  /** Idempotency keys: `${transactionId}:${entitlementId}` already granted. */
  processedGrants: string[];
}

/** Where the current in-memory ownership view came from. */
export type LedgerAuthority = 'empty' | 'offline_cache' | 'provider_verified';

export const grantKey = (transactionId: TransactionId, entitlementId: EntitlementId): string =>
  `${transactionId}:${entitlementId}`;

export class EntitlementLedger {
  private entitlements = new Map<EntitlementId, OwnedEntitlement>();
  private processedGrants = new Set<string>();
  private authority: LedgerAuthority = 'empty';

  getAuthority(): LedgerAuthority {
    return this.authority;
  }

  /** Mark that ownership was last confirmed by verified provider receipts. */
  markProviderVerified(): void {
    this.authority = 'provider_verified';
  }

  /** Mark that ownership is from the read-only offline cache only. */
  markOfflineCache(): void {
    this.authority = 'offline_cache';
  }

  has(entitlementId: EntitlementId): boolean {
    const e = this.entitlements.get(entitlementId);
    return !!e && !e.revoked;
  }

  get(entitlementId: EntitlementId): OwnedEntitlement | undefined {
    return this.entitlements.get(entitlementId);
  }

  list(): OwnedEntitlement[] {
    return [...this.entitlements.values()].filter((e) => !e.revoked);
  }

  /** Include revoked rows (needed for audit / graceful unequip). */
  listAll(): OwnedEntitlement[] {
    return [...this.entitlements.values()];
  }

  wasProcessed(transactionId: TransactionId, entitlementId: EntitlementId): boolean {
    return this.processedGrants.has(grantKey(transactionId, entitlementId));
  }

  /** Idempotent grant. Duplicate keys return the existing entitlement.
   * First purchase wins ownership lineage: a later transaction for an
   * already-owned entitlement is recorded as processed but never
   * overwrites the original grantor (keeps refund semantics honest). */
  grant(entry: OwnedEntitlement): { result: 'granted' | 'already_granted'; entitlement: OwnedEntitlement } {
    const key = grantKey(entry.grantedByTransaction, entry.entitlementId);
    const existing = this.entitlements.get(entry.entitlementId);
    if (existing && !existing.revoked) {
      this.processedGrants.add(key);
      return { result: 'already_granted', entitlement: existing };
    }
    // Same transaction after a revoke (e.g. provider still lists verified): re-activate.
    if (existing?.revoked && this.processedGrants.has(key)) {
      const reactivated: OwnedEntitlement = {
        ...entry,
        grantedByTransaction: existing.grantedByTransaction,
        grantedAt: existing.grantedAt,
      };
      this.entitlements.set(entry.entitlementId, reactivated);
      this.authority = 'provider_verified';
      return { result: 'granted', entitlement: reactivated };
    }
    if (this.processedGrants.has(key) && existing) return { result: 'already_granted', entitlement: existing };
    this.processedGrants.add(key);
    this.entitlements.set(entry.entitlementId, entry);
    this.authority = 'provider_verified';
    return { result: 'granted', entitlement: entry };
  }

  revoke(entitlementId: EntitlementId, reason: string): boolean {
    const existing = this.entitlements.get(entitlementId);
    if (!existing || existing.revoked) return false;
    this.entitlements.set(entitlementId, { ...existing, revoked: true, revokeReason: reason });
    return true;
  }

  snapshot(): LedgerSnapshot {
    return {
      version: 1,
      entitlements: [...this.entitlements.values()],
      processedGrants: [...this.processedGrants],
    };
  }

  restore(snapshot: LedgerSnapshot): void {
    if (snapshot.version !== 1) throw new Error(`unsupported ledger snapshot v${snapshot.version}`);
    this.entitlements = new Map(snapshot.entitlements.map((e) => [e.entitlementId, e]));
    this.processedGrants = new Set(snapshot.processedGrants);
  }

  /** Drop active grants whose transaction is not in the verified receipt set. */
  revokeUnbackedByReceipts(verifiedReceipts: PurchaseReceipt[], reason = 'not_in_provider'): OwnedEntitlement[] {
    const verifiedTx = new Set(
      verifiedReceipts.filter((r) => r.status === 'verified').map((r) => r.transactionId),
    );
    const revoked: OwnedEntitlement[] = [];
    for (const e of this.list()) {
      if (!verifiedTx.has(e.grantedByTransaction) && this.revoke(e.entitlementId, reason)) {
        const updated = this.entitlements.get(e.entitlementId);
        if (updated) revoked.push(updated);
      }
    }
    this.authority = 'provider_verified';
    return revoked;
  }
}

// --- Offline/read-only cache adapter (cache only — never authority) ---

export const LEDGER_CACHE_KEY = 'rst.monetisation.entitlements.v1';

type CacheStorage = Pick<Storage, 'setItem' | 'getItem' | 'removeItem'>;

const defaultStorage = (): CacheStorage | undefined =>
  typeof localStorage !== 'undefined' ? localStorage : undefined;

/**
 * Persist a read-only ownership mirror for offline display.
 * Writing the cache never grants — only `FulfillmentService` + verified
 * receipts do. Callers must not treat cache presence as purchase proof
 * once the provider is reachable again (see reconcileOfflineCache).
 */
export function saveLedgerCache(ledger: EntitlementLedger, storage: CacheStorage | undefined = defaultStorage()): void {
  if (!storage) return;
  storage.setItem(LEDGER_CACHE_KEY, JSON.stringify(ledger.snapshot()));
}

/**
 * Hydrate the ledger from the offline cache for read-only UI.
 * Marks authority as `offline_cache` — never `provider_verified`.
 */
export function loadLedgerCache(
  ledger: EntitlementLedger,
  storage: CacheStorage | undefined = defaultStorage(),
): boolean {
  try {
    const raw = storage?.getItem(LEDGER_CACHE_KEY);
    if (!raw) return false;
    ledger.restore(JSON.parse(raw) as LedgerSnapshot);
    ledger.markOfflineCache();
    return true;
  } catch {
    return false;
  }
}

/**
 * After the provider returns verified receipts, drop any cache-only grants
 * that the provider does not corroborate, then rewrite the cache mirror.
 * Returns entitlements revoked by this reconcile (for cosmetic unequip).
 */
export function reconcileOfflineCacheWithProvider(
  ledger: EntitlementLedger,
  verifiedReceipts: PurchaseReceipt[],
  storage: CacheStorage | undefined = defaultStorage(),
): OwnedEntitlement[] {
  const revoked = ledger.revokeUnbackedByReceipts(verifiedReceipts);
  ledger.markProviderVerified();
  saveLedgerCache(ledger, storage);
  return revoked;
}

/** Clear only the offline mirror (e.g. after full reinstall before restore). */
export function clearLedgerCache(storage: CacheStorage | undefined = defaultStorage()): void {
  storage?.removeItem(LEDGER_CACHE_KEY);
}
