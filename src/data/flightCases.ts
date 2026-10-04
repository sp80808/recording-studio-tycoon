// flightCases.ts
// Central catalogue for loot containers ("flight cases").
// Covers chore-streak crates, S-grade takes, yard-sale boxes and future
// auction/dealer drops. Art is sourced from CC0 packs (see ART_SOURCING_LOG.md);
// the 3D unboxing modal renders these tiers with pure CSS/SVG so no binary
// download is required at runtime.
//
// Source packs (all CC0 unless noted):
// - Kenney "Generic Items" (CC0) — https://opengameart.org/content/generic-items
// - OGA "Pixel Wooden Crate" / "Boxes and crates - svg and pngs" (CC0)
// - OGA "Crate and barrel (no pun intended)" (CC0, 3D .blend)
// - OGA "Sci-Fi Shipping Crate" (CC0, PBR .glb + .blend)
// - OGA "Freight" pallet set (CC0)

import type { Rarity, Era } from '@/features/boxDrops/lootGenerator';

export type FlightCaseTier =
  | 'cardboard_box'
  | 'road_case'
  | 'tour_trunk'
  | 'vintage_flight_case'
  | 'holy_grail_vault';

/** Legacy tier used in GameState.pendingCrates — maps to the new catalogue. */
export type LegacyCrateTier = 'standard' | 'vintage_flight_case';

export interface ArtSource {
  pack: string;
  url: string;
  license: 'CC0' | 'CC-BY' | 'CC-BY-SA' | 'original';
  author: string;
  notes?: string;
}

export interface FlightCaseLootConfig {
  /** How many loot rolls this case grants. */
  itemCount: [min: number, max: number];
  /** Rarity weight multipliers applied on top of the era loot table. */
  rarityWeights: Record<Rarity, number>;
  minCondition: number;
  maxCondition: number;
  /** Multiplies appraised baseValue of rolled items. */
  valueMultiplier: number;
  /** If set, biases era rolls toward these eras (e.g. vintage cases). */
  eraBias?: Era[];
}

export interface FlightCaseDef {
  id: FlightCaseTier;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  /** Sprite path under public/assets/crates/. File may not exist yet — UI falls back to CSS render. */
  sprite: string;
  /** CSS theme used by CrateUnboxingModal when sprite is missing. */
  cssTheme: {
    gradient: string;
    border: string;
    accent: string;
    stencil: string;
  };
  source: ArtSource;
  loot: FlightCaseLootConfig;
  dropSources: Array<'chore_streak' | 's_grade_take' | 'yard_sale' | 'auction' | 'dealer' | 'level_reward'>;
  /** Game day this tier unlocks (0 = from start). */
  unlockDay: number;
}

export const FLIGHT_CASE_SOURCE_PACKS: ArtSource[] = [
  {
    pack: 'Kenney Generic Items',
    url: 'https://opengameart.org/content/generic-items',
    license: 'CC0',
    author: 'Kenney (kenney.nl)',
    notes: '160 generic item PNGs + spritesheet + vector. Instruments: guitar, electric guitar, keyboard, drum, tambourine.',
  },
  {
    pack: 'OGA Boxes and crates (svg + pngs)',
    url: 'https://opengameart.org/content/cc0-resources',
    license: 'CC0',
    author: 'OpenGameArt community (CC0 collection)',
    notes: 'SVG + PNG crate/box set. Used as stencil reference for cardboard_box + road_case CSS themes.',
  },
  {
    pack: 'OGA Crates (32x32 pixel sheet, 6 variants)',
    url: 'https://opengameart.org/content/crates-3',
    license: 'CC0',
    author: 'OpenGameArt contributor',
    notes: 'Normal / big / tall / wide / explosive / gas crates. Reference for tour_trunk variant silhouettes.',
  },
  {
    pack: 'OGA Sci-Fi Shipping Crate (PBR .glb + .blend)',
    url: 'https://opengameart.org/content/sci-fi-shipping-crate',
    license: 'CC0',
    author: 'OpenGameArt contributor (textures from ambientCG, CC0)',
    notes: 'Game-ready PBR crate with colour mask. ROADMAP: base mesh for holy_grail_vault 3D view — not bundled yet.',
  },
  {
    pack: 'OGA Crate and barrel (.blend, tiled wood)',
    url: 'https://opengameart.org/content/crate-and-barrel-no-pun-intended',
    license: 'CC0',
    author: 'OpenGameArt contributor',
    notes: 'Wooden shipping crate + barrel Blender sessions. ROADMAP: 3D model source for vintage_flight_case.',
  },
];

export const FLIGHT_CASES: Record<FlightCaseTier, FlightCaseDef> = {
  cardboard_box: {
    id: 'cardboard_box',
    name: 'Yard-Sale Cardboard Box',
    tagline: 'SMELLS LIKE BASEMENT',
    description:
      'A soggy cardboard box from a yard sale. Mostly cables and hope — but every legend starts somewhere.',
    icon: '📦',
    sprite: 'assets/crates/cardboard_box.png',
    cssTheme: {
      gradient: 'from-amber-900 via-stone-900 to-black',
      border: 'border-amber-700',
      accent: '#d6a35c',
      stencil: 'YARD SALE · AS-IS',
    },
    source: {
      pack: 'OGA Boxes and crates (svg + pngs)',
      url: 'https://opengameart.org/content/cc0-resources',
      license: 'CC0',
      author: 'OpenGameArt community',
      notes: 'CSS/SVG rendition; swap in PNG when asset pipeline lands.',
    },
    loot: {
      itemCount: [1, 1],
      rarityWeights: { common: 10, uncommon: 3, rare: 1, vintage: 0.2, legendary: 0.05 },
      minCondition: 30,
      maxCondition: 75,
      valueMultiplier: 0.8,
    },
    dropSources: ['yard_sale', 'level_reward'],
    unlockDay: 0,
  },
  road_case: {
    id: 'road_case',
    name: 'Roadworn Flight Case',
    tagline: 'TOUR-TESTED · STICKERED UP',
    description:
      'Standard 19" rack road case with aluminium edges. The workhorse drop: solid mid-tier studio gear.',
    icon: '🧳',
    sprite: 'assets/crates/road_case.png',
    cssTheme: {
      gradient: 'from-stone-800 via-stone-950 to-black',
      border: 'border-stone-500',
      accent: '#94a3b8',
      stencil: 'ROAD CASE · 19" RACK',
    },
    source: {
      pack: 'OGA Crates (32x32 pixel sheet, 6 variants)',
      url: 'https://opengameart.org/content/crates-3',
      license: 'CC0',
      author: 'OpenGameArt contributor',
      notes: 'Silhouette reference for normal/big/tall/wide case variants.',
    },
    loot: {
      itemCount: [1, 2],
      rarityWeights: { common: 6, uncommon: 5, rare: 3, vintage: 1, legendary: 0.2 },
      minCondition: 50,
      maxCondition: 90,
      valueMultiplier: 1.0,
    },
    dropSources: ['s_grade_take', 'yard_sale', 'dealer'],
    unlockDay: 0,
  },
  tour_trunk: {
    id: 'tour_trunk',
    name: 'Tour Trunk',
    tagline: 'ARENA CREW · HEAVY LIFT',
    description:
      'Full-size tour trunk with caster wheels and crew stencils. Drops 2–3 items with a rare-or-better guarantee slot.',
    icon: '🗄️',
    sprite: 'assets/crates/tour_trunk.png',
    cssTheme: {
      gradient: 'from-cyan-950 via-slate-900 to-black',
      border: 'border-cyan-500',
      accent: '#06b6d4',
      stencil: 'TOUR TRUNK · CREW ONLY',
    },
    source: {
      pack: 'Kenney Generic Items',
      url: 'https://opengameart.org/content/generic-items',
      license: 'CC0',
      author: 'Kenney (kenney.nl)',
      notes: 'Tool/transport props used as trunk side-stencil iconography.',
    },
    loot: {
      itemCount: [2, 3],
      rarityWeights: { common: 3, uncommon: 5, rare: 5, vintage: 2, legendary: 0.5 },
      minCondition: 60,
      maxCondition: 95,
      valueMultiplier: 1.15,
    },
    dropSources: ['s_grade_take', 'auction', 'dealer'],
    unlockDay: 30,
  },
  vintage_flight_case: {
    id: 'vintage_flight_case',
    name: 'Vintage Flight Crate',
    tagline: 'FRAGILE · TUBE GEAR',
    description:
      'The classic chore-streak reward. Stencilled aluminium case sealed with spring latches — leans heavily vintage analog.',
    icon: '🎛️',
    sprite: 'assets/crates/vintage_flight_case.png',
    cssTheme: {
      gradient: 'from-stone-900 via-stone-950 to-black',
      border: 'border-stone-700',
      accent: '#f59e0b',
      stencil: 'VINTAGE FLIGHT CRATE',
    },
    source: {
      pack: 'OGA Crate and barrel (.blend, tiled wood)',
      url: 'https://opengameart.org/content/crate-and-barrel-no-pun-intended',
      license: 'CC0',
      author: 'OpenGameArt contributor',
      notes: 'Current modal CSS matches this tier. 3D .blend mesh logged for roadmap (see collectibles.ts).',
    },
    loot: {
      itemCount: [1, 2],
      rarityWeights: { common: 2, uncommon: 3, rare: 4, vintage: 6, legendary: 1 },
      minCondition: 50,
      maxCondition: 99,
      valueMultiplier: 1.25,
      eraBias: ['1960s', '1970s', '1980s'],
    },
    dropSources: ['chore_streak', 's_grade_take'],
    unlockDay: 0,
  },
  holy_grail_vault: {
    id: 'holy_grail_vault',
    name: 'Holy Grail Vault',
    tagline: 'DO NOT DROP · SERIOUSLY',
    description:
      'Climate-controlled vault case with foam inlays and a gold seal. Endgame container: vintage-or-legendary only.',
    icon: '🏆',
    sprite: 'assets/crates/holy_grail_vault.png',
    cssTheme: {
      gradient: 'from-amber-950 via-stone-950 to-black',
      border: 'border-amber-400',
      accent: '#fbbf24',
      stencil: 'HOLY GRAIL VAULT · SEALED',
    },
    source: {
      pack: 'OGA Sci-Fi Shipping Crate (PBR .glb + .blend)',
      url: 'https://opengameart.org/content/sci-fi-shipping-crate',
      license: 'CC0',
      author: 'OpenGameArt contributor (ambientCG textures, CC0)',
      notes: 'PBR .glb + colour mask is the designated 3D source for this tier (roadmap, not yet bundled).',
    },
    loot: {
      itemCount: [2, 3],
      rarityWeights: { common: 0, uncommon: 1, rare: 4, vintage: 6, legendary: 3 },
      minCondition: 75,
      maxCondition: 100,
      valueMultiplier: 1.5,
      eraBias: ['1960s', '1970s'],
    },
    dropSources: ['auction', 'level_reward'],
    unlockDay: 120,
  },
};

export const FLIGHT_CASE_TIER_ORDER: FlightCaseTier[] = [
  'cardboard_box',
  'road_case',
  'tour_trunk',
  'vintage_flight_case',
  'holy_grail_vault',
];

/**
 * Producer level that unlocks the flight-case system (Depot, floor stack,
 * dealer shop). Below this the system stays hidden; level-up case rewards
 * start here (bead fec).
 */
export const FLIGHT_CASE_UNLOCK_LEVEL = 3;

/** Map the legacy 2-tier crate system onto the 5-tier catalogue (back-compat). */
export function legacyTierToFlightCase(tier: LegacyCrateTier): FlightCaseTier {
  return tier === 'vintage_flight_case' ? 'vintage_flight_case' : 'road_case';
}

export function getFlightCaseDef(tier: FlightCaseTier): FlightCaseDef {
  return FLIGHT_CASES[tier];
}

/** Streak day → flight case tier (3-day cycle, escalates monthly). */
export function streakDayToTier(streakDays: number): FlightCaseTier {
  if (streakDays >= 30) return 'holy_grail_vault';
  if (streakDays >= 12) return 'tour_trunk';
  if (streakDays >= 6) return 'road_case';
  return 'vintage_flight_case';
}
