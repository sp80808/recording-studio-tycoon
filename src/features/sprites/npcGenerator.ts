import {
  ModularNpcDefinition,
  StudioRole,
  NpcEra,
  SkinTone,
  BodyBuild,
  FaceExpression,
  HairShape,
  HairColour,
  FacialHair,
  ClothesTop,
  ClothesLower,
  ShoesType,
  Outerwear,
  GlassesStyle,
  Jewellery,
} from './spriteTypes';

// Seeded pseudorandom number generator (Linear Congruential Generator / Mulberry32)
function createRng(seed: number) {
  let s = Math.abs(seed | 0) + 1;
  return function next(): number {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(list: readonly T[], rand: () => number): T {
  const index = Math.floor(rand() * list.length);
  return list[Math.min(index, list.length - 1)];
}

// Authentic skin tone color pairs (base + shading)
const SKIN_PALETTES: Record<SkinTone, { base: string; shadow: string }> = {
  fair: { base: '#fed7aa', shadow: '#fb923c' },
  warm: { base: '#fde047', shadow: '#eab308' },
  olive: { base: '#d4b996', shadow: '#a6825c' },
  tan: { base: '#c28b5b', shadow: '#945b2f' },
  deep: { base: '#8d5524', shadow: '#5c3311' },
  rich: { base: '#4a2c11', shadow: '#271404' },
};

// Hair color palettes
const HAIR_COLORS: Record<HairColour, string> = {
  jet_black: '#171717',
  dark_brown: '#3f2212',
  chestnut: '#5c2c16',
  auburn: '#853216',
  bleached_blonde: '#fef08a',
  silver_grey: '#94a3b8',
  neon_pink: '#f43f5e',
  electric_blue: '#06b6d4',
};

// Era-specific top clothes preferences
const ERA_TOPS: Record<NpcEra, ClothesTop[]> = {
  '1960s': ['turtleneck', 'vintage_cardigan', 'flannel_shirt'],
  '1970s': ['flannel_shirt', 'leather_jacket', 'denim_vest', 'band_tee'],
  '1980s': ['tracksuit_jacket', 'leather_jacket', 'band_tee'],
  '1990s': ['flannel_shirt', 'oversized_hoodie', 'band_tee'],
  '2000s': ['oversized_hoodie', 'tracksuit_jacket', 'band_tee'],
  'modern': ['turtleneck', 'vintage_cardigan', 'oversized_hoodie', 'flannel_shirt'],
};

// Era-specific lower clothes preferences
const ERA_LOWERS: Record<NpcEra, ClothesLower[]> = {
  '1960s': ['corduroy_trousers', 'denim_jeans'],
  '1970s': ['bell_bottoms', 'corduroy_trousers', 'denim_jeans'],
  '1980s': ['denim_jeans', 'joggers', 'ripped_jeans'],
  '1990s': ['ripped_jeans', 'cargo_pants', 'denim_jeans'],
  '2000s': ['cargo_pants', 'joggers', 'ripped_jeans'],
  'modern': ['denim_jeans', 'joggers', 'corduroy_trousers'],
};

// Era-specific hair styles
const ERA_HAIR: Record<NpcEra, HairShape[]> = {
  '1960s': ['bob', 'pompadour', 'slicked', 'buzzcut'],
  '1970s': ['afro', 'long_wavy', 'messy_curly', 'pompadour'],
  '1980s': ['slicked', 'pompadour', 'messy_curly', 'bleached_blonde' as any],
  '1990s': ['messy_curly', 'buzzcut', 'dreads', 'bob'],
  '2000s': ['buzzcut', 'topknot', 'dreads', 'messy_curly'],
  'modern': ['topknot', 'buzzcut', 'afro', 'dreads', 'slicked', 'bald'],
};

// Top palettes
const CLOTHING_PALETTES = [
  { primary: '#b91c1c', secondary: '#450a0a' }, // Ruby Red
  { primary: '#c2410c', secondary: '#431407' }, // Vintage Orange
  { primary: '#d97706', secondary: '#451a03' }, // Amber Gold
  { primary: '#15803d', secondary: '#052e16' }, // Forest Green
  { primary: '#0f766e', secondary: '#042f2e' }, // Deep Teal
  { primary: '#1d4ed8', secondary: '#172554' }, // Studio Cobalt
  { primary: '#6d28d9', secondary: '#2e1065' }, // Velvet Purple
  { primary: '#334155', secondary: '#0f172a' }, // Charcoal Slate
  { primary: '#e2e8f0', secondary: '#64748b' }, // Off-white Oxford
];

const JEANS_COLORS = ['#1e3a8a', '#1e293b', '#334155', '#475569', '#172554', '#713f12'];
const SHOE_COLORS = ['#0f172a', '#451a03', '#ffffff', '#dc2626', '#d97706'];

export interface GenerateNpcOptions {
  role?: StudioRole;
  era?: NpcEra;
  name?: string;
}

export function generateModularNpc(
  seed: number,
  options: GenerateNpcOptions = {}
): ModularNpcDefinition {
  const rand = createRng(seed);

  const era: NpcEra = options.era ?? pick(['1960s', '1970s', '1980s', '1990s', '2000s', 'modern'], rand);
  const role: StudioRole = options.role ?? pick(['engineer', 'producer', 'artist', 'manager', 'tech'], rand);

  const build: BodyBuild = pick(['slim', 'average', 'stocky'], rand);
  const skinTone: SkinTone = pick(['fair', 'warm', 'olive', 'tan', 'deep', 'rich'], rand);
  const skin = SKIN_PALETTES[skinTone];

  const face: FaceExpression = pick(['focused', 'eager', 'chill', 'stern', 'ecstatic', 'vintage_shades'], rand);

  const hairPool = ERA_HAIR[era].filter(h => typeof h === 'string') as HairShape[];
  const hairShape: HairShape = pick(hairPool.length > 0 ? hairPool : ['afro', 'slicked', 'bob'], rand);

  const hairColourPool: HairColour[] =
    era === '1980s'
      ? ['bleached_blonde', 'neon_pink', 'jet_black', 'auburn']
      : ['jet_black', 'dark_brown', 'chestnut', 'auburn', 'silver_grey'];
  const hairColour: HairColour = pick(hairColourPool, rand);
  const hairHex = HAIR_COLORS[hairColour];

  const facialHairPool: FacialHair[] =
    era === '1970s'
      ? ['vintage_mustache', 'full_beard', 'sideburns', 'clean_stubble']
      : ['none', 'clean_stubble', 'vintage_mustache', 'goatee'];
  const facialHair: FacialHair = pick(facialHairPool, rand);

  // Clothes
  const topsPool = ERA_TOPS[era];
  const top: ClothesTop = pick(topsPool, rand);
  const topPalette = pick(CLOTHING_PALETTES, rand);

  const lowersPool = ERA_LOWERS[era];
  const lower: ClothesLower = pick(lowersPool, rand);
  const lowerHex = pick(JEANS_COLORS, rand);

  const shoes: ShoesType = pick(['vintage_sneakers', 'leather_boots', 'creepers', 'hi_tops', 'loafers'], rand);
  const shoesHex = pick(SHOE_COLORS, rand);

  const outerwearPool: Outerwear[] = ['none', 'none', 'trenchcoat', 'bomber', 'chore_jacket'];
  const outerwear: Outerwear = pick(outerwearPool, rand);
  const outerwearHex = outerwear !== 'none' ? pick(CLOTHING_PALETTES, rand).secondary : undefined;

  // Personality Details
  const glassesPool: GlassesStyle[] =
    era === '1960s'
      ? ['horn_rim', 'wire_round', 'none']
      : era === '1970s'
      ? ['tinted_aviator', 'wire_round', 'none']
      : era === '1980s'
      ? ['cyber_visor', 'wayfarer', 'none']
      : ['wayfarer', 'wire_round', 'none'];
  const glasses: GlassesStyle = pick(glassesPool, rand);

  const jewellery: Jewellery = pick(['none', 'gold_chain', 'silver_hoops', 'cassette_pendant'], rand);
  const headphoneColor = pick(['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#111827', '#e2e8f0'], rand);

  // Studio Role Props
  const roleProps = getRoleProps(role, rand);

  return {
    id: `npc-${seed}-${role}-${era}`,
    seed,
    name: options.name ?? generateNpcName(role, rand),
    role,
    era,
    body: {
      build,
      skinTone,
      skinHex: skin.base,
      shadowHex: skin.shadow,
      face,
    },
    hair: {
      shape: hairShape,
      colour: hairColour,
      hairHex,
      facialHair,
    },
    clothes: {
      top,
      topPrimaryHex: topPalette.primary,
      topSecondaryHex: topPalette.secondary,
      lower,
      lowerHex,
      shoes,
      shoesHex,
      outerwear,
      outerwearHex,
    },
    details: {
      glasses,
      jewellery,
      patches: rand() > 0.6,
      pins: rand() > 0.5 ? ['synth', 'tape'] : [],
      headphoneColor,
    },
    roleProps,
  };
}

function getRoleProps(role: StudioRole, rand: () => number) {
  switch (role) {
    case 'engineer':
      return {
        accessoryName: 'Reference Monitor Cans',
        renderProp: 'headphones' as const,
        accentColor: '#3b82f6',
      };
    case 'producer':
      return {
        accessoryName: 'Groove Controller & Cap',
        renderProp: 'synth_controller' as const,
        accentColor: '#f59e0b',
      };
    case 'artist':
      return {
        accessoryName: 'Vintage Gold Condenser',
        renderProp: 'mic' as const,
        accentColor: '#ec4899',
      };
    case 'manager':
      return {
        accessoryName: 'Session Contract & Lanyard',
        renderProp: 'clipboard' as const,
        accentColor: '#10b981',
      };
    case 'tech':
      return {
        accessoryName: 'Pro Audio Toolbelt & Calibrator',
        renderProp: 'toolbelt' as const,
        accentColor: '#e11d48',
      };
  }
}

const FIRST_NAMES = [
  'Miles', 'Stevie', 'Quincy', 'Alan', 'Jimi', 'Debbie', 'Rick', 'Kate',
  'George', 'Brian', 'Eno', 'Sly', 'Nile', 'Wendy', 'Trevor', 'Sylvia',
  'Giorgio', 'Leon', 'Carole', 'Todd', 'Mitch', 'Lee', 'Klaus', 'Toni'
];

const LAST_NAMES = [
  'Vance', 'Sterling', 'Blackwood', 'Rhodes', 'Marley', 'Holt', 'Cross',
  'Wexler', 'Alpert', 'Rodgers', 'Moroder', 'Masser', 'Parsons', 'Kramer',
  'Swedien', 'Horn', 'Bell', 'King', 'Rundgren', 'Perry', 'Schulze'
];

function generateNpcName(role: StudioRole, rand: () => number): string {
  const first = pick(FIRST_NAMES, rand);
  const last = pick(LAST_NAMES, rand);
  return `${first} ${last}`;
}
