// Entitlement ledger — Flight Case Monetisation (bead 89o.4).
// Purchased ownership lives HERE, never in GameState saves: resetting,
// exporting or importing a save cannot mint or destroy purchases.
// localStorage is an offline/read-only CACHE of this ledger, not the
// authority — the provider receipt is. The ledger is a pure, serializable
// class so tests drive it without a browser.

import type { EntitlementId, EntitlementKind, TransactionId } from './types';

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

export const grantKey = (transactionId: TransactionId, entitlementId: EntitlementId): string =>
  `${transactionId}:${entitlementId}`;

export class EntitlementLedger {
  private entitlements = new Map<EntitlementId, OwnedEntitlement>();
  private processedGrants = new Set<string>();

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
    if (this.processedGrants.has(key) && existing) return { result: 'already_granted', entitlement: existing };
    this.processedGrants.add(key);
    this.entitlements.set(entry.entitlementId, entry);
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
}

// --- Offline/read-only cache adapter (cache only — never authority) ---

export const LEDGER_CACHE_KEY = 'rst.monetisation.entitlements.v1';

type CacheStorage = Pick<Storage, 'setItem' | 'getItem'>;

const defaultStorage = (): CacheStorage | undefined =>
  typeof localStorage !== 'undefined' ? localStorage : undefined;

export function saveLedgerCache(ledger: EntitlementLedger, storage: CacheStorage | undefined = defaultStorage()): void {
  if (!storage) return;
  storage.setItem(LEDGER_CACHE_KEY, JSON.stringify(ledger.snapshot()));
}

export function loadLedgerCache(
  ledger: EntitlementLedger,
  storage: CacheStorage | undefined = defaultStorage(),
): boolean {
  try {
    const raw = storage?.getItem(LEDGER_CACHE_KEY);
    if (!raw) return false;
    ledger.restore(JSON.parse(raw) as LedgerSnapshot);
    return true;
  } catch {
    return false;
  }
}
