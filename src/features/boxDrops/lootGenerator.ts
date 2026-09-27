// lootGenerator.ts
// Small, deterministic loot generator for Box / Yard Sale Drops

export type Era = '1960s' | '1970s' | '1980s' | '1990s' | '2000s' | '2010s' | '2020s'

export type Rarity = 'common' | 'uncommon' | 'rare' | 'vintage' | 'legendary'

export interface EquipmentItem {
  id: string
  name: string
  era: Era
  rarity: Rarity
  condition: number // 0-100
  baseValue: number
}

// Simple era-aware loot table. In a real game this would be data-driven.
const LOOT_TABLE: Record<Era, Array<{ item: Omit<EquipmentItem, 'id' | 'condition'> & { weight: number }}>> = {
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
}

function seededRandom(seed: number) {
  // xorshift32
  let x = seed || 88675123
  return function () {
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    return (x >>> 0) / 4294967295
  }
}

export function pickLootForEra(era: Era, seed?: number): EquipmentItem {
  const entries = LOOT_TABLE[era]
  const totalWeight = entries.reduce((s, e) => s + (e.item as any).weight, 0)
  const rnd = seed == null ? Math.random() : seededRandom(seed)()
  let target = rnd * totalWeight
  for (const e of entries) {
    target -= (e.item as any).weight
    if (target <= 0) {
      const condition = Math.floor(50 + Math.random() * 50) // 50-99 condition
      return {
        id: `${era}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        name: e.item.name,
        era: e.item.era,
        rarity: e.item.rarity,
        condition,
        baseValue: e.item.baseValue,
      }
    }
  }
  // Fallback
  const fallback = entries[0].item
  return {
    id: `${era}-${Date.now()}-fallback`,
    name: fallback.name,
    era: fallback.era,
    rarity: fallback.rarity,
    condition: 75,
    baseValue: fallback.baseValue,
  }
}

export function generateBoxLoot(era: Era, count = 1, seed?: number): EquipmentItem[] {
  const items: EquipmentItem[] = []
  for (let i = 0; i < count; i++) {
    items.push(pickLootForEra(era, seed == null ? undefined : seed + i))
  }
  return items
}
