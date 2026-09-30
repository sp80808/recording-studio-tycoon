// Compatibility adapter for the existing flight-case reveal. Gameplay owns Equipment.
import type { EquipmentInstance } from '@/features/usedGear/types';
import { eraYear, gearCatalogue, generateGear, resaleValue } from '@/features/usedGear/generation';
import { createSeededRandom, pickWithRandom } from '@/simulation/seededRandom';

export type Era = '1960s' | '1970s' | '1980s' | '1990s' | '2000s' | '2010s' | '2020s';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'vintage' | 'legendary';
export interface EquipmentItem {
  id: string;
  name: string;
  era: Era;
  rarity: Rarity;
  condition: number;
  baseValue: number;
  equipment?: EquipmentInstance;
}

export const toBoxEquipmentItem = (equipment: EquipmentInstance, era: Era): EquipmentItem => ({
  id: equipment.id, name: equipment.name, era, condition: equipment.condition,
  baseValue: resaleValue(equipment), equipment,
  rarity: ({ standard: 'common', roadworn: 'uncommon', 'studio-classic': 'vintage', 'rare-mod': 'rare', 'holy-grail': 'legendary' } as const)[equipment.rarity],
});

export function pickLootForEra(era: Era, seed = 0, index = 0): EquipmentItem {
  const year = eraYear(era);
  const template = pickWithRandom(createSeededRandom(`${seed}:${era}:${index}:template`), gearCatalogue(year));
  return toBoxEquipmentItem(generateGear(template, { saveSeed: seed, day: 0, year, source: 'box_drop', eventId: era, index }), era);
}

export function generateBoxLoot(era: Era, count = 1, seed = 0): EquipmentItem[] {
  return Array.from({ length: Math.min(100, Math.max(0, Math.floor(Number.isFinite(count) ? count : 0))) }, (_, index) => pickLootForEra(era, seed, index));
}
