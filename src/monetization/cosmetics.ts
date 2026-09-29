// Premium cosmetic equip surface — Flight Case Monetisation (beads 89o.7 / 89o.8).
// Equipping is ownership-gated and cosmetic-only. Equip state lives outside
// GameState (`equippedCosmetics.ts`) so refund/reversal unequips without
// corrupting career saves. Emits premium_item_equipped telemetry.

import {
  setEquippedPremiumItem,
  unequipPremiumItem,
  applyReversalCosmeticSideEffects,
  clearEquippedPremiumItems,
  listEquippedPremiumItems,
  getEquippedPremiumItem,
} from './equippedCosmetics';
import type { EquippedPremiumCosmetic } from './equippedCosmetics';
import { getActiveExperimentId } from './experiments';
import { useDealerStore } from './store';
import { trackPremiumItemEquipped } from './telemetry';
import type { EntitlementId, EntitlementKind } from './types';

export type { EquippedPremiumCosmetic };
export {
  unequipPremiumItem,
  applyReversalCosmeticSideEffects,
  clearEquippedPremiumItems,
  listEquippedPremiumItems,
  getEquippedPremiumItem,
};

export interface EquipPremiumItemRequest {
  entitlementId: EntitlementId;
  entitlementKind: EntitlementKind;
  /** Optional studio slot / surface label (not a payment field). */
  source?: string;
}

export type EquipPremiumItemResult =
  | { ok: true }
  | { ok: false; reason: 'not_owned' };

/** Equip a owned premium cosmetic and record telemetry. */
export function equipPremiumItem(req: EquipPremiumItemRequest): EquipPremiumItemResult {
  const owned = useDealerStore.getState().isOwned(req.entitlementId);
  if (!owned) return { ok: false, reason: 'not_owned' };
  const source = req.source ?? 'studio';
  setEquippedPremiumItem({
    entitlementId: req.entitlementId,
    entitlementKind: req.entitlementKind,
    source,
  });
  trackPremiumItemEquipped({
    entitlementId: req.entitlementId,
    entitlementKind: req.entitlementKind,
    experimentId: getActiveExperimentId(),
    source,
  });
  return { ok: true };
}
