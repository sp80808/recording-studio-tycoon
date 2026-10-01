import { availableEquipment, getEraAdjustedPrice, type EraAvailableEquipment } from '@/data/eraEquipment';
import type { Equipment, GameState } from '@/types/game';
import { createSeededRandom, hashSeed, pickWithRandom, randomInt } from '@/simulation/seededRandom';
import { clampCondition, maintenanceCategories } from './condition';
import type { EquipmentInstance, GearRarity, DailyClassifiedListing } from './types';

export interface GearGenerationContext {
  saveSeed: string | number;
  day: number;
  year: number;
  source: EquipmentInstance['origin'];
  eventId?: string;
  index: number;
  priceMultiplier?: number;
}

export const gearCatalogue = (year: number): EraAvailableEquipment[] => availableEquipment.filter(item =>
  maintenanceCategories.includes(item.category) && item.price > 0 && item.availableFrom <= year &&
  (item.isVintage || item.availableUntil === undefined || item.availableUntil >= year)
);

export const resaleValue = (item: Equipment): number => {
  const basis = Math.max(0, Number.isFinite(item.price) ? item.price : 0);
  const rarity = Math.max(1, Math.min(1.2, item.resaleValueMultiplier || 1));
  return Math.max(0, Math.floor(basis * rarity * (0.2 + clampCondition(item.condition) * 0.004)));
};

export const generateGear = (template: EraAvailableEquipment, context: GearGenerationContext): EquipmentInstance => {
  // Include the full coordinates in identity; hash only the flavour/RNG seed.
  const coordinates = JSON.stringify([context.saveSeed, context.day, context.source, context.eventId ?? '', template.id, context.index]);
  const id = `gear:${encodeURIComponent(coordinates)}`;
  const rng = createSeededRandom(coordinates);
  const rarityRoll = rng();
  const rarity: GearRarity = rarityRoll < 0.5 ? 'roadworn' : rarityRoll < 0.85 ? 'studio-classic' : rarityRoll < 0.97 ? 'rare-mod' : 'holy-grail';
  const condition = randomInt(rng, 20, 95);
  const hasQuirk = condition < 60 && rng() < 0.65;
  const hasTrait = rng() < 0.5;
  const provenanceSeed = hashSeed(`${coordinates}:history`);
  const multiplier = Number.isFinite(context.priceMultiplier) ? Math.max(0.01, context.priceMultiplier!) : 1;
  return {
    ...template,
    id,
    instanceId: id,
    templateId: template.id,
    price: Math.max(1, getEraAdjustedPrice(template, context.year, multiplier)),
    condition,
    rarity,
    traits: hasTrait ? [{ id: 'sweet-spot', name: 'Sweet spot', description: '+2 equipment quality points; combined character effects cap at ±3.', qualityBonus: 2 }] : [],
    quirks: hasQuirk ? [{ id: 'dirty-contacts', name: 'Dirty contacts', description: '−2 equipment quality points; 25% more wear. Service clears this.', severity: 'minor', qualityPenalty: -2 }] : [],
    restorationState: 'barn-find',
    origin: context.source,
    resaleValueMultiplier: rarity === 'holy-grail' ? 1.2 : rarity === 'rare-mod' ? 1.1 : 1,
    provenanceSeed,
    vintageYearEstimate: template.availableFrom,
    sellerLore: pickWithRandom(createSeededRandom(provenanceSeed), ['Retired from a local rehearsal room.', 'One careful owner; plenty of late nights.', 'Found during a studio clear-out.', 'Touring spare, finally off the road.']),
    usageSessions: 0,
    inspected: false,
  };
};

export const generateDailyClassifieds = (state: Pick<GameState, 'saveSeed' | 'currentDay' | 'currentYear' | 'equipmentMultiplier'>): DailyClassifiedListing[] => {
  const rng = createSeededRandom(`${state.saveSeed ?? 4242}:classifieds:${state.currentDay}`);
  const pool = [...gearCatalogue(state.currentYear)];
  const count = Math.min(pool.length, randomInt(rng, 3, 4));
  return Array.from({ length: count }, (_, index) => {
    // Keep one workhorse within reach of a new studio; the other finds range freely.
    const choices = index === 0
      ? [...pool].sort((a, b) => getEraAdjustedPrice(a, state.currentYear, state.equipmentMultiplier) - getEraAdjustedPrice(b, state.currentYear, state.equipmentMultiplier)).slice(0, 3)
      : pool;
    const template = pickWithRandom(rng, choices);
    pool.splice(pool.indexOf(template), 1);
    const equipment = generateGear(template, { saveSeed: state.saveSeed ?? 4242, day: state.currentDay, year: state.currentYear, source: 'classifieds', index, priceMultiplier: state.equipmentMultiplier });
    const estimatedValue = resaleValue(equipment);
    // Scarce bargains: at most $20 per listing, four listings/day. No stock rerolls.
    const askingPrice = Math.max(1, Math.round(estimatedValue + (rng() < 0.2 ? -Math.min(20, estimatedValue * 0.08) : equipment.price * (0.03 + rng() * 0.12))));
    return {
      id: `listing:${equipment.id}`, equipment, askingPrice, estimatedValue,
      retailComparisonPrice: equipment.price,
      location: pickWithRandom(rng, ['Studio clear-out', 'Local classifieds', 'Rehearsal warehouse']),
      sellerNotes: equipment.sellerLore!, purchased: false,
    };
  });
};

export const generateCrateGear = (state: GameState, crate: NonNullable<GameState['pendingCrates']>[number]): EquipmentInstance | undefined => {
  const year = crate.generatedYear ?? eraYear(crate.era);
  const pool = gearCatalogue(year);
  if (!pool.length) return undefined;
  const seed = `${state.saveSeed ?? 4242}:crate:${crate.id}`;
  const template = pickWithRandom(createSeededRandom(seed), pool);
  return generateGear(template, { saveSeed: state.saveSeed ?? 4242, day: crate.generatedDay ?? 0, year, source: crate.source === 's_grade_take' ? 'project_drop' : 'box_drop', eventId: crate.id, index: 0, priceMultiplier: crate.generatedPriceMultiplier ?? 1 });
};

export const eraYear = (era: string, fallback = 1970): number => {
  const decade = Number(era.match(/(196|197|198|199|200|201|202)0/)?.[0]);
  if (decade) return decade + 9;
  return ({ analog60s: 1969, classic70s: 1979, digital80s: 1989, modern90s: 1999, computer2000s: 2009, modern: 2024 } as Record<string, number>)[era] ?? fallback;
};
