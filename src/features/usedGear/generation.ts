import { availableEquipment, getEraAdjustedPrice, type EraAvailableEquipment } from '@/data/eraEquipment';
import type { Equipment, EquipmentCategory, GameState } from '@/types/game';
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
  /** 0–1 bias toward better rarities from studio/premises progression. */
  progressionBoost?: number;
}

/** Marketplace + loot categories. Wear/repair still only apply to maintenanceCategories. */
export const marketCategories: readonly EquipmentCategory[] = [
  ...maintenanceCategories,
  'recorder',
  'instrument',
];

export const gearCatalogue = (year: number): EraAvailableEquipment[] => availableEquipment.filter(item =>
  marketCategories.includes(item.category) && item.price > 0 && item.availableFrom <= year &&
  (item.isVintage || item.availableUntil === undefined || item.availableUntil >= year)
);

/** Pure progression snapshot used to size stock and bias rolls without reshuffling day seed. */
export const resolveEconomyProgression = (state: Pick<GameState, 'premisesTier' | 'studioLevel' | 'studioTier'>): {
  premises: 0 | 1;
  studio: 1 | 2 | 3 | 4 | 5;
  boost: number;
  listingBonus: number;
  workhorseCeiling: number;
} => {
  // Tier 2 (commercial) keeps the Tier 1 stock bonus; it must not fall back to the borrowed room's.
  const premises: 0 | 1 = (state.premisesTier ?? 0) >= 1 ? 1 : 0;
  const raw = Math.floor(state.studioLevel ?? state.studioTier ?? 1);
  const studio = (Math.max(1, Math.min(5, Number.isFinite(raw) ? raw : 1))) as 1 | 2 | 3 | 4 | 5;
  const listingBonus = (premises >= 1 ? 1 : 0) + (studio >= 3 ? 1 : 0);
  const boost = Math.min(1, (studio - 1) * 0.12 + premises * 0.15);
  // Tier-0 new studios stay near the existing ~$3500 workhorse ceiling in early eras.
  const workhorseCeiling = Math.round(3500 * (1 + (studio - 1) * 0.25 + premises * 0.15));
  return { premises, studio, boost, listingBonus, workhorseCeiling };
};

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
  const boost = Math.max(0, Math.min(1, context.progressionBoost ?? 0));
  const rarityRoll = rng();
  const tRoad = 0.5 - boost * 0.12;
  const tClassic = 0.85 - boost * 0.08;
  const tRare = 0.97 - boost * 0.03;
  const rarity: GearRarity = rarityRoll < tRoad ? 'roadworn' : rarityRoll < tClassic ? 'studio-classic' : rarityRoll < tRare ? 'rare-mod' : 'holy-grail';
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

/** Brand-new retail purchase: full condition, standard rarity, stable instance id. */
export const generateRetailGear = (
  template: EraAvailableEquipment,
  state: Pick<GameState, 'saveSeed' | 'currentDay' | 'currentYear' | 'equipmentMultiplier'>,
): EquipmentInstance => {
  const base = generateGear(template, {
    saveSeed: state.saveSeed ?? 4242,
    day: state.currentDay,
    year: state.currentYear,
    source: 'retail',
    index: 0,
    priceMultiplier: state.equipmentMultiplier,
  });
  return {
    ...base,
    condition: 100,
    rarity: 'standard',
    traits: [],
    quirks: [],
    restorationState: 'serviced',
    resaleValueMultiplier: 1,
    inspected: true,
    sellerLore: 'Bought new from the equipment shop.',
  };
};

export type CaseFind = NonNullable<GameState['caseFinds']>[number];

/** Turn a stashed/opened case find into a real EquipmentInstance (deterministic). */
export const materializeCaseFind = (state: GameState, find: CaseFind): EquipmentInstance | undefined => {
  if (find.equipment) {
    return {
      ...find.equipment,
      condition: clampCondition(find.condition ?? find.equipment.condition),
      name: find.name || find.equipment.name,
    };
  }
  const year = eraYear(find.era, state.currentYear);
  const pool = gearCatalogue(year);
  if (!pool.length) return undefined;
  const template = pickWithRandom(createSeededRandom(`${state.saveSeed ?? 4242}:find:${find.id}`), pool);
  const gear = generateGear(template, {
    saveSeed: state.saveSeed ?? 4242,
    day: state.currentDay,
    year,
    source: 'box_drop',
    eventId: find.id,
    index: 0,
    priceMultiplier: state.equipmentMultiplier,
  });
  return {
    ...gear,
    name: find.name || gear.name,
    condition: clampCondition(find.condition),
    price: Math.max(1, find.baseValue || gear.price),
  };
};

export const generateDailyClassifieds = (
  state: Pick<GameState, 'saveSeed' | 'currentDay' | 'currentYear' | 'equipmentMultiplier' | 'premisesTier' | 'studioLevel' | 'studioTier'>,
): DailyClassifiedListing[] => {
  const progression = resolveEconomyProgression(state);
  // Day + save seed alone form stock identity so upgrading mid-day never reshuffles listings.
  const rng = createSeededRandom(`${state.saveSeed ?? 4242}:classifieds:${state.currentDay}`);
  const pool = [...gearCatalogue(state.currentYear)];
  const count = Math.min(pool.length, Math.min(5, randomInt(rng, 3, 4) + progression.listingBonus));
  return Array.from({ length: count }, (_, index) => {
    // Slot 0 stays a workhorse; higher-tier studios get a signature recorder/instrument bias in slot 1.
    let choices = pool;
    if (index === 0) {
      choices = [...pool]
        .sort((a, b) => getEraAdjustedPrice(a, state.currentYear, state.equipmentMultiplier) - getEraAdjustedPrice(b, state.currentYear, state.equipmentMultiplier))
        .filter(item => getEraAdjustedPrice(item, state.currentYear, state.equipmentMultiplier) <= progression.workhorseCeiling)
        .slice(0, 3);
      if (!choices.length) {
        choices = [...pool]
          .sort((a, b) => getEraAdjustedPrice(a, state.currentYear, state.equipmentMultiplier) - getEraAdjustedPrice(b, state.currentYear, state.equipmentMultiplier))
          .slice(0, 3);
      }
    } else if (index === 1 && progression.studio >= 2) {
      const signature = pool.filter(item => item.category === 'recorder' || item.category === 'instrument');
      if (signature.length) choices = signature;
    }
    const template = pickWithRandom(rng, choices);
    pool.splice(pool.indexOf(template), 1);
    const equipment = generateGear(template, {
      saveSeed: state.saveSeed ?? 4242,
      day: state.currentDay,
      year: state.currentYear,
      source: 'classifieds',
      index,
      priceMultiplier: state.equipmentMultiplier,
      progressionBoost: progression.boost,
    });
    const estimatedValue = resaleValue(equipment);
    // Scarce bargains: at most $20 per listing. Cap listings via count above.
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
  const progression = resolveEconomyProgression(state);
  return generateGear(template, {
    saveSeed: state.saveSeed ?? 4242,
    day: crate.generatedDay ?? 0,
    year,
    source: crate.source === 's_grade_take' ? 'project_drop' : 'box_drop',
    eventId: crate.id,
    index: 0,
    priceMultiplier: crate.generatedPriceMultiplier ?? 1,
    progressionBoost: progression.boost,
  });
};

export const eraYear = (era: string, fallback = 1970): number => {
  const decade = Number(era.match(/(196|197|198|199|200|201|202)0/)?.[0]);
  if (decade) return decade + 9;
  return ({ analog60s: 1969, classic70s: 1979, digital80s: 1989, modern90s: 1999, computer2000s: 2009, modern: 2024 } as Record<string, number>)[era] ?? fallback;
};
