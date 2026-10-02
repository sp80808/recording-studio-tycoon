import type { GameState } from '@/types/game';
import { applyUpkeepDiscount, NEUTRAL_ORIGIN_EFFECTS, type OriginEffects } from '@/narrative/originPerks';

/** Daily equipment upkeep: 0.1% of item price per day, minimum $2/item */
export const calculateEquipmentUpkeep = (
  equipment: GameState['ownedEquipment'],
  effects: OriginEffects = NEUTRAL_ORIGIN_EFFECTS,
): number => {
  if (!equipment || equipment.length === 0) return 0;
  const base = equipment.reduce((sum, item) => sum + Math.max(2, Math.round(item.price * 0.001)), 0);
  return applyUpkeepDiscount(base, effects);
};
