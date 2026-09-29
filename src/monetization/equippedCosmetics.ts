// Equipped premium cosmetic state — Flight Case Monetisation (bead 89o.8).
// Lives outside GameState so refund/reversal can unequip to default without
// corrupting career saves. No store/telemetry imports (avoids cycles).

import type { OwnedEntitlement } from './entitlements';
import type { EntitlementId, EntitlementKind } from './types';

export interface EquippedPremiumCosmetic {
  entitlementId: EntitlementId;
  entitlementKind: EntitlementKind;
  source: string;
}

/** In-memory equip map — intentionally outside GameState authority. */
const equipped = new Map<EntitlementId, EquippedPremiumCosmetic>();

export function clearEquippedPremiumItems(): void {
  equipped.clear();
}

export function listEquippedPremiumItems(): EquippedPremiumCosmetic[] {
  return [...equipped.values()];
}

export function getEquippedPremiumItem(entitlementId: EntitlementId): EquippedPremiumCosmetic | undefined {
  return equipped.get(entitlementId);
}

export function setEquippedPremiumItem(entry: EquippedPremiumCosmetic): void {
  equipped.set(entry.entitlementId, entry);
}

/** Unequip a single cosmetic back to default. Safe if not equipped. */
export function unequipPremiumItem(entitlementId: EntitlementId): boolean {
  return equipped.delete(entitlementId);
}

/**
 * After refund/reversal or provider reconcile: drop equip for revoked ids.
 * Returns the unequipped entitlement ids (default cosmetics apply).
 */
export function applyReversalCosmeticSideEffects(
  revoked: ReadonlyArray<Pick<OwnedEntitlement, 'entitlementId'>>,
): EntitlementId[] {
  const unequipped: EntitlementId[] = [];
  for (const entry of revoked) {
    if (unequipPremiumItem(entry.entitlementId)) {
      unequipped.push(entry.entitlementId);
    }
  }
  return unequipped;
}
