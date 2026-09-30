/**
 * Data tables for the deterministic NPC appearance generator (appearance version 1).
 *
 * Everything here is plain data typed against spriteTypes, so an out-of-range value
 * (e.g. a colour used as a hair shape) is a compile error rather than a runtime surprise.
 * Pools are weighted: a bare value has weight 1, `[value, weight]` sets it explicitly.
 * Changing any pool changes what a seed produces, so edits belong in a NEW appearance
 * version (see npcAppearance.ts), never in place once saves exist.
 */
import type {
  BodyBuild,
  ClothesLower,
  ClothesTop,
  FaceExpression,
  FacialHair,
  GlassesStyle,
  HairColour,
  HairShape,
  Jewellery,
  NpcEra,
  Outerwear,
  ShoesType,
  SkinTone,
  StudioRole,
} from './spriteTypes';

export type Weighted<T> = T | readonly [T, number];

export const NPC_ERAS: readonly NpcEra[] = ['1960s', '1970s', '1980s', '1990s', '2000s', 'modern'];
export const STUDIO_ROLES: readonly StudioRole[] = ['engineer', 'producer', 'artist', 'manager', 'tech'];

export const BUILDS: readonly Weighted<BodyBuild>[] = ['slim', 'average', 'stocky'];
export const SKIN_TONES: readonly SkinTone[] = ['fair', 'warm', 'olive', 'tan', 'deep', 'rich'];
export const FACES: readonly Weighted<FaceExpression>[] = [
  'focused', 'eager', 'chill', 'stern', 'ecstatic', ['vintage_shades', 0.5],
];

export const SKIN_PALETTES: Record<SkinTone, { base: string; shadow: string }> = {
  fair: { base: '#fed7aa', shadow: '#fb923c' },
  warm: { base: '#fde047', shadow: '#eab308' },
  olive: { base: '#d4b996', shadow: '#a6825c' },
  tan: { base: '#c28b5b', shadow: '#945b2f' },
  deep: { base: '#8d5524', shadow: '#5c3311' },
  rich: { base: '#4a2c11', shadow: '#271404' },
};

export const HAIR_HEX: Record<HairColour, string> = {
  jet_black: '#171717',
  dark_brown: '#3f2212',
  chestnut: '#5c2c16',
  auburn: '#853216',
  bleached_blonde: '#fef08a',
  silver_grey: '#94a3b8',
  neon_pink: '#f43f5e',
  electric_blue: '#06b6d4',
};

export const ERA_HAIR_SHAPES: Record<NpcEra, readonly Weighted<HairShape>[]> = {
  '1960s': ['bob', 'pompadour', 'slicked', 'buzzcut', ['bald', 0.3]],
  '1970s': ['afro', 'long_wavy', 'messy_curly', 'pompadour', ['bald', 0.3]],
  '1980s': ['slicked', 'pompadour', 'messy_curly', 'long_wavy', ['bald', 0.3]],
  '1990s': ['messy_curly', 'buzzcut', 'dreads', 'bob', 'long_wavy', ['bald', 0.3]],
  '2000s': ['buzzcut', 'topknot', 'dreads', 'messy_curly', 'slicked', ['bald', 0.3]],
  modern: ['topknot', 'buzzcut', 'afro', 'dreads', 'slicked', 'bob', 'long_wavy', ['bald', 0.5]],
};

export const ERA_HAIR_COLOURS: Record<NpcEra, readonly Weighted<HairColour>[]> = {
  '1960s': ['jet_black', 'dark_brown', 'chestnut', 'auburn', ['silver_grey', 0.5], ['bleached_blonde', 0.5]],
  '1970s': ['jet_black', 'dark_brown', 'chestnut', 'auburn', ['silver_grey', 0.5]],
  '1980s': ['bleached_blonde', 'neon_pink', 'jet_black', 'auburn', ['electric_blue', 0.5], ['dark_brown', 0.5]],
  '1990s': ['jet_black', 'dark_brown', 'chestnut', ['bleached_blonde', 0.7], ['electric_blue', 0.4]],
  '2000s': ['jet_black', 'dark_brown', 'chestnut', ['bleached_blonde', 0.7], ['neon_pink', 0.3], ['auburn', 0.6]],
  modern: ['jet_black', 'dark_brown', 'chestnut', 'auburn', 'silver_grey', ['neon_pink', 0.4], ['electric_blue', 0.4]],
};

export const ERA_FACIAL_HAIR: Record<NpcEra, readonly Weighted<FacialHair>[]> = {
  '1960s': [['none', 3], 'clean_stubble', 'sideburns', ['vintage_mustache', 0.7]],
  '1970s': ['vintage_mustache', 'full_beard', 'sideburns', 'clean_stubble', ['none', 1.5]],
  '1980s': [['none', 3], 'clean_stubble', 'vintage_mustache', 'goatee'],
  '1990s': [['none', 3], 'clean_stubble', 'goatee', ['full_beard', 0.5]],
  '2000s': [['none', 3], 'clean_stubble', 'goatee', ['full_beard', 0.7]],
  modern: [['none', 3], 'clean_stubble', 'full_beard', 'goatee', ['vintage_mustache', 0.4]],
};

export const ERA_TOPS: Record<NpcEra, readonly Weighted<ClothesTop>[]> = {
  '1960s': ['turtleneck', 'vintage_cardigan', 'flannel_shirt', ['denim_vest', 0.4]],
  '1970s': ['flannel_shirt', 'leather_jacket', 'denim_vest', 'band_tee', ['turtleneck', 0.6]],
  '1980s': ['tracksuit_jacket', 'leather_jacket', 'band_tee', ['denim_vest', 0.7]],
  '1990s': ['flannel_shirt', 'oversized_hoodie', 'band_tee', ['vintage_cardigan', 0.4]],
  '2000s': ['oversized_hoodie', 'tracksuit_jacket', 'band_tee', ['flannel_shirt', 0.6]],
  modern: ['turtleneck', 'vintage_cardigan', 'oversized_hoodie', 'flannel_shirt', ['band_tee', 0.8]],
};

export const ERA_LOWERS: Record<NpcEra, readonly Weighted<ClothesLower>[]> = {
  '1960s': ['corduroy_trousers', 'denim_jeans'],
  '1970s': ['bell_bottoms', 'corduroy_trousers', 'denim_jeans'],
  '1980s': ['denim_jeans', 'joggers', 'ripped_jeans'],
  '1990s': ['ripped_jeans', 'cargo_pants', 'denim_jeans'],
  '2000s': ['cargo_pants', 'joggers', 'ripped_jeans', ['denim_jeans', 0.6]],
  modern: ['denim_jeans', 'joggers', 'corduroy_trousers', ['cargo_pants', 0.6]],
};

export const ERA_SHOES: Record<NpcEra, readonly Weighted<ShoesType>[]> = {
  '1960s': ['loafers', 'leather_boots', ['creepers', 0.6]],
  '1970s': ['leather_boots', 'loafers', 'vintage_sneakers'],
  '1980s': ['hi_tops', 'vintage_sneakers', ['creepers', 0.8], 'leather_boots'],
  '1990s': ['hi_tops', 'canvas_skaters', 'leather_boots', 'vintage_sneakers'],
  '2000s': ['canvas_skaters', 'hi_tops', 'vintage_sneakers'],
  modern: ['vintage_sneakers', 'canvas_skaters', 'leather_boots', ['loafers', 0.6]],
};

export const ERA_OUTERWEAR: Record<NpcEra, readonly Weighted<Outerwear>[]> = {
  '1960s': [['none', 3], 'trenchcoat', 'chore_jacket'],
  '1970s': [['none', 3], 'trenchcoat', 'chore_jacket', ['bomber', 0.6]],
  '1980s': [['none', 3], 'bomber', 'trenchcoat'],
  '1990s': [['none', 3], 'bomber', 'chore_jacket', 'fleece'],
  '2000s': [['none', 3], 'bomber', 'fleece', ['chore_jacket', 0.6]],
  modern: [['none', 3], 'chore_jacket', 'fleece', 'bomber', ['trenchcoat', 0.6]],
};

export const ERA_GLASSES: Record<NpcEra, readonly Weighted<GlassesStyle>[]> = {
  '1960s': ['horn_rim', 'wire_round', ['none', 3]],
  '1970s': ['tinted_aviator', 'wire_round', ['none', 3]],
  '1980s': [['cyber_visor', 0.6], 'wayfarer', ['none', 3]],
  '1990s': ['wire_round', 'wayfarer', ['none', 3]],
  '2000s': ['wayfarer', ['tinted_aviator', 0.6], ['none', 3]],
  modern: ['wayfarer', 'wire_round', 'horn_rim', ['none', 3]],
};

export const ERA_JEWELLERY: Record<NpcEra, readonly Weighted<Jewellery>[]> = {
  '1960s': [['none', 4], ['silver_hoops', 0.4]],
  '1970s': [['none', 3], 'gold_chain', 'silver_hoops'],
  '1980s': [['none', 3], 'gold_chain', 'cassette_pendant', 'silver_hoops'],
  '1990s': [['none', 3], 'choker', 'silver_hoops', 'cassette_pendant'],
  '2000s': [['none', 3], 'gold_chain', 'choker', 'silver_hoops'],
  modern: [['none', 3], 'silver_hoops', 'choker', 'gold_chain', ['cassette_pendant', 0.6]],
};

export const CLOTHING_PALETTES: readonly { primary: string; secondary: string }[] = [
  { primary: '#b91c1c', secondary: '#450a0a' }, // Ruby Red
  { primary: '#c2410c', secondary: '#431407' }, // Vintage Orange
  { primary: '#d97706', secondary: '#451a03' }, // Amber Gold
  { primary: '#15803d', secondary: '#052e16' }, // Forest Green
  { primary: '#0f766e', secondary: '#042f2e' }, // Deep Teal
  { primary: '#1d4ed8', secondary: '#172554' }, // Studio Cobalt
  { primary: '#6d28d9', secondary: '#2e1065' }, // Velvet Purple
  { primary: '#334155', secondary: '#0f172a' }, // Charcoal Slate
  { primary: '#e2e8f0', secondary: '#64748b' }, // Off-white Oxford
  { primary: '#a16207', secondary: '#422006' }, // Mustard
  { primary: '#be185d', secondary: '#500724' }, // Magenta
  { primary: '#57534e', secondary: '#1c1917' }, // Stone
];

export const LOWER_COLOURS: readonly string[] = ['#1e3a8a', '#1e293b', '#334155', '#475569', '#172554', '#713f12', '#3f3f46', '#365314'];
export const SHOE_COLOURS: readonly string[] = ['#0f172a', '#451a03', '#ffffff', '#dc2626', '#d97706', '#1d4ed8'];
export const HEADPHONE_COLOURS: readonly string[] = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#111827', '#e2e8f0'];
export const PIN_OPTIONS: readonly (readonly string[])[] = [[], [], ['synth', 'tape'], ['peace'], ['fire', 'tape']];

export interface RolePropSpec {
  accessoryName: string;
  renderProp: 'headphones' | 'clipboard' | 'mic' | 'toolbelt' | 'synth_controller';
  accentColor: string;
}

export const ROLE_PROPS: Record<StudioRole, RolePropSpec> = {
  engineer: { accessoryName: 'Reference Monitor Cans', renderProp: 'headphones', accentColor: '#3b82f6' },
  producer: { accessoryName: 'Groove Controller & Cap', renderProp: 'synth_controller', accentColor: '#f59e0b' },
  artist: { accessoryName: 'Vintage Gold Condenser', renderProp: 'mic', accentColor: '#ec4899' },
  manager: { accessoryName: 'Session Contract & Lanyard', renderProp: 'clipboard', accentColor: '#10b981' },
  tech: { accessoryName: 'Pro Audio Toolbelt & Calibrator', renderProp: 'toolbelt', accentColor: '#e11d48' },
};

export const FIRST_NAMES: readonly string[] = [
  'Miles', 'Stevie', 'Quincy', 'Alan', 'Jimi', 'Debbie', 'Rick', 'Kate',
  'George', 'Brian', 'Eno', 'Sly', 'Nile', 'Wendy', 'Trevor', 'Sylvia',
  'Giorgio', 'Leon', 'Carole', 'Todd', 'Mitch', 'Lee', 'Klaus', 'Toni',
];

export const LAST_NAMES: readonly string[] = [
  'Vance', 'Sterling', 'Blackwood', 'Rhodes', 'Marley', 'Holt', 'Cross',
  'Wexler', 'Alpert', 'Rodgers', 'Moroder', 'Masser', 'Parsons', 'Kramer',
  'Swedien', 'Horn', 'Bell', 'King', 'Rundgren', 'Perry', 'Schulze',
];
