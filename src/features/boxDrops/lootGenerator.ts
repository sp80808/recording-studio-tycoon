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

// Simple era-aware loot table. In a real game this would be data-driven.
// Kept for the flight-case economy (odds display + weighted picks).
export const LOOT_TABLE: Record<Era, Array<{ item: Omit<EquipmentItem, 'id' | 'condition'> & { weight: number }}>> = {
  '1960s': [
    { item: { name: 'Tube Microphone', era: '1960s', rarity: 'vintage', baseValue: 1200, weight: 1 } },
    { item: { name: 'Reel-to-Reel Tape Machine', era: '1960s', rarity: 'vintage', baseValue: 3000, weight: 1 } },
    { item: { name: 'Patch Bay', era: '1960s', rarity: 'common', baseValue: 150, weight: 6 } },
  ],
  '1970s': [
    { item: { name: 'Analog Console', era: '1970s', rarity: 'rare', baseValue: 5000, weight: 2 } },
    { item: { name: 'Vintage Microphone', era: '1970s', rarity: 'vintage', baseValue: 1800, weight: 2 } },
    { item: { name: 'Guitar Amp', era: '1970s', rarity: 'common', baseValue: 400, weight: 6 } },
  ],
  '1980s': [
    { item: { name: 'Digital Reverb Unit', era: '1980s', rarity: 'rare', baseValue: 2500, weight: 2 } },
    { item: { name: 'Synthesizer', era: '1980s', rarity: 'rare', baseValue: 2200, weight: 2 } },
    { item: { name: 'Studio Headphones', era: '1980s', rarity: 'common', baseValue: 120, weight: 6 } },
  ],
  '1990s': [
    { item: { name: 'AD/DA Converter', era: '1990s', rarity: 'uncommon', baseValue: 900, weight: 4 } },
    { item: { name: 'Outboard Compressor', era: '1990s', rarity: 'rare', baseValue: 1600, weight: 2 } },
    { item: { name: 'Microphone Stand', era: '1990s', rarity: 'common', baseValue: 50, weight: 6 } },
  ],
  '2000s': [
    { item: { name: 'Plugin Bundle License (used key)', era: '2000s', rarity: 'uncommon', baseValue: 300, weight: 4 } },
    { item: { name: 'Modern Condenser Mic', era: '2000s', rarity: 'rare', baseValue: 800, weight: 2 } },
    { item: { name: 'MIDI Controller', era: '2000s', rarity: 'common', baseValue: 120, weight: 6 } },
  ],
  '2010s': [
    { item: { name: 'Audio Interface', era: '2010s', rarity: 'common', baseValue: 300, weight: 6 } },
    { item: { name: 'Boutique Preamp', era: '2010s', rarity: 'rare', baseValue: 1500, weight: 2 } },
  ],
  '2020s': [
    { item: { name: 'Hybrid DSP Rack', era: '2020s', rarity: 'rare', baseValue: 2000, weight: 2 } },
    { item: { name: 'Portable Field Recorder', era: '2020s', rarity: 'uncommon', baseValue: 250, weight: 4 } },
  ],
};

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
