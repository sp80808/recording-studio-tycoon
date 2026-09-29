// Premium reveal bridge — Flight Case Monetisation (bead 89o.6).
// Maps a fulfilled celebration (sku + refs) onto display items for the
// CrateUnboxingModal premium branch. Pure resolution against the catalogue:
// unknown refs fall back to a generic gift row, and this module can never
// create rewards — ownership already exists in the ledger before mount.

import { getProductBySku } from './catalog';
import type { PremiumDisplayItem } from '@/features/boxDrops/CrateUnboxingModal';
import type { Sku } from './types';

export function celebrationToDisplay(sku: Sku, refs: string[]): PremiumDisplayItem[] {
  const product = getProductBySku(sku);
  const byRef = new Map((product?.preview.items ?? []).map((i) => [i.ref, i]));
  return refs.map((ref) => {
    const known = byRef.get(ref);
    return known ? { ref, label: known.label, icon: known.icon } : { ref, label: ref, icon: '🎁' };
  });
}
