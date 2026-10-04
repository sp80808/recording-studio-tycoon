/**
 * Descriptor table for the producer appearance editor (#212).
 *
 * One entry per editable property. The career-start creator and the in-game customisation modal both
 * render from `APPEARANCE_FIELDS`, so there is exactly one control surface per property and one place
 * to add a new one. Player-facing names resolve through the content i18n overlay (`tc`) using the
 * stable ids below; the English here is the fallback and is mirrored in `public/locales/en/appearance.json`
 * (a check keeps the two in sync).
 */
import { tc } from '@/i18n/content';
import { CLOTHING_PALETTES, HAIR_HEX, SKIN_PALETTES } from './npcAppearanceData';
import {
  PRODUCER_ACCESSORIES,
  PRODUCER_BUILDS,
  PRODUCER_CLOTHES_COLOURS,
  PRODUCER_HAIR_COLOURS,
  PRODUCER_HAIR_SHAPES,
  PRODUCER_PANTS,
  PRODUCER_SHIRTS,
  PRODUCER_SHOES,
  PRODUCER_SKIN_TONES,
  sanitizeProducerAppearance,
  type ProducerAppearance,
  type ResolvedProducerAppearance,
} from './producerAppearance';

export type AppearanceFieldId = 'build' | 'skinTone' | 'hair' | 'hairColour' | 'shirt' | 'clothesColour' | 'pants' | 'shoes' | 'accessory';

export interface AppearanceOption {
  /** The value stored in `ProducerAppearance`. Never shown to players. */
  value: string;
  /** Stable i18n id, e.g. `appearance.hair.messy_curly`. */
  labelKey: string;
  /** English fallback for `labelKey`. */
  label: string;
  /** CSS background for swatch fields. */
  swatch?: string;
}

export interface AppearanceField {
  id: AppearanceFieldId;
  /** Stable i18n id, e.g. `appearance.field.hair`. */
  labelKey: string;
  /** English fallback for `labelKey`. */
  label: string;
  /** `choice` = previous / value / next row; `swatch` = named colour dots with the value as text. */
  kind: 'choice' | 'swatch';
  options: readonly AppearanceOption[];
  get: (appearance: ResolvedProducerAppearance) => string;
  set: (appearance: ResolvedProducerAppearance, value: string) => ResolvedProducerAppearance;
}

const titleCase = (id: string) => id.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

const options = (field: AppearanceFieldId, values: readonly string[], labels: Record<string, string> = {}, swatch?: (value: string) => string): AppearanceOption[] =>
  values.map((value) => ({ value, labelKey: `appearance.${field}.${value}`, label: labels[value] ?? titleCase(value), swatch: swatch?.(value) }));

const field = (
  id: AppearanceFieldId,
  label: string,
  kind: AppearanceField['kind'],
  opts: AppearanceOption[],
): AppearanceField => ({
  id,
  labelKey: `appearance.field.${id}`,
  label,
  kind,
  options: opts,
  get: (a) => a[id] as string,
  // Sanitising here means a descriptor can never push an unknown value into the saved appearance.
  set: (a, value) => sanitizeProducerAppearance({ ...a, [id]: value }),
});

const clothesSwatch = (id: string) => {
  const palette = CLOTHING_PALETTES[PRODUCER_CLOTHES_COLOURS.find((c) => c.id === id)!.palette];
  return `linear-gradient(135deg, ${palette.primary} 60%, ${palette.secondary} 60%)`;
};

/** Rows in display order. Six cycling rows, three swatch rows. */
export const APPEARANCE_FIELDS: readonly AppearanceField[] = [
  field('build', 'Build', 'choice', options('build', PRODUCER_BUILDS)),
  field('skinTone', 'Skin tone', 'swatch', options('skinTone', PRODUCER_SKIN_TONES, {}, (v) => SKIN_PALETTES[v as keyof typeof SKIN_PALETTES].base)),
  field('hair', 'Hair', 'choice', options('hair', PRODUCER_HAIR_SHAPES, {
    pompadour: 'Pompadour', slicked: 'Slicked back', bob: 'Bob', messy_curly: 'Messy curls', long_wavy: 'Long waves',
    afro: 'Afro', dreads: 'Dreadlocks', topknot: 'Top knot', buzzcut: 'Buzz cut', bald: 'Bald',
  })),
  field('hairColour', 'Hair colour', 'swatch', options('hairColour', PRODUCER_HAIR_COLOURS, {
    jet_black: 'Jet black', dark_brown: 'Dark brown', chestnut: 'Chestnut', auburn: 'Auburn', bleached_blonde: 'Bleached blonde',
    silver_grey: 'Silver grey', neon_pink: 'Neon pink', electric_blue: 'Electric blue',
  }, (v) => HAIR_HEX[v as keyof typeof HAIR_HEX])),
  field('shirt', 'Top', 'choice', options('shirt', PRODUCER_SHIRTS, {
    flannel_shirt: 'Flannel shirt', band_tee: 'Band tee', turtleneck: 'Turtleneck', leather_jacket: 'Leather jacket',
    tracksuit_jacket: 'Tracksuit jacket', oversized_hoodie: 'Oversized hoodie', denim_vest: 'Denim vest', vintage_cardigan: 'Vintage cardigan',
  })),
  field('clothesColour', 'Clothing colour', 'swatch', options('clothesColour', PRODUCER_CLOTHES_COLOURS.map((c) => c.id), {}, clothesSwatch)),
  field('pants', 'Trousers', 'choice', options('pants', PRODUCER_PANTS, {
    denim_jeans: 'Denim jeans', corduroy_trousers: 'Corduroy trousers', bell_bottoms: 'Bell bottoms', cargo_pants: 'Cargo trousers',
    joggers: 'Joggers', ripped_jeans: 'Ripped jeans',
  })),
  field('shoes', 'Shoes', 'choice', options('shoes', PRODUCER_SHOES, {
    vintage_sneakers: 'Vintage sneakers', leather_boots: 'Leather boots', creepers: 'Creepers', hi_tops: 'Hi-tops',
    loafers: 'Loafers', canvas_skaters: 'Canvas skaters',
  })),
  field('accessory', 'Accessory', 'choice', options('accessory', PRODUCER_ACCESSORIES, {
    none: 'None', headphones: 'Headphones', round_glasses: 'Round glasses', wayfarers: 'Wayfarers', flat_cap: 'Flat cap', beanie: 'Beanie',
    gold_chain: 'Gold chain', aviators: 'Aviators', horn_rims: 'Horn-rims', visor: 'Cyber visor', bucket_hat: 'Bucket hat', bandana: 'Bandana',
    headband: 'Headband', hoops: 'Silver hoops', choker: 'Choker', cassette_pendant: 'Tape pendant',
  })),
];

export const getAppearanceField = (id: AppearanceFieldId): AppearanceField => APPEARANCE_FIELDS.find((f) => f.id === id)!;

export const appearanceFieldLabel = (f: AppearanceField): string => tc(f.labelKey, f.label);

export const findAppearanceOption = (f: AppearanceField, value: string): AppearanceOption =>
  f.options.find((o) => o.value === value) ?? f.options[0];

/** The player-facing name of the option currently selected in `appearance`. */
export const appearanceValueLabel = (f: AppearanceField, appearance: ProducerAppearance): string => {
  const option = findAppearanceOption(f, f.get(sanitizeProducerAppearance(appearance)));
  return tc(option.labelKey, option.label);
};

export const appearanceOptionLabel = (o: AppearanceOption): string => tc(o.labelKey, o.label);

/** Move `delta` options along the field (wrapping) and return the new, sanitised appearance. */
export const cycleAppearanceField = (f: AppearanceField, appearance: ProducerAppearance, delta: number): ResolvedProducerAppearance => {
  const current = sanitizeProducerAppearance(appearance);
  const index = Math.max(0, f.options.findIndex((o) => o.value === f.get(current)));
  const next = f.options[(((index + delta) % f.options.length) + f.options.length) % f.options.length];
  return f.set(current, next.value);
};

/** Direct selection (swatches). Unknown values leave the field at its sanitised default. */
export const setAppearanceField = (f: AppearanceField, appearance: ProducerAppearance, value: string): ResolvedProducerAppearance =>
  f.set(sanitizeProducerAppearance(appearance), value);

/** Editor chrome (not per-field). Same id + English-fallback convention as the field copy. */
export const APPEARANCE_UI = {
  'appearance.ui.name': 'Producer name',
  'appearance.ui.name_placeholder': 'The Architect',
  'appearance.ui.editor': 'Producer appearance',
  'appearance.ui.preview': 'Preview of {{name}}',
  'appearance.ui.preview_fallback': 'your producer',
  'appearance.ui.surprise': 'Surprise me',
  'appearance.ui.undo': 'Undo',
  'appearance.ui.undo_aria': 'Undo last appearance change',
  'appearance.ui.previous': 'Previous {{label}}',
  'appearance.ui.next': 'Next {{label}}',
  'appearance.ui.position': '{{index}} of {{total}}',
} as const;
export type AppearanceUiKey = keyof typeof APPEARANCE_UI;
export const appearanceUi = (key: AppearanceUiKey, vars?: Record<string, string | number>): string => tc(key, APPEARANCE_UI[key], vars);

/** Every i18n id the descriptors use with its English fallback (drives the en/appearance.json drift check). */
export const appearanceCopy = (): Record<string, string> => {
  const copy: Record<string, string> = { ...APPEARANCE_UI };
  for (const f of APPEARANCE_FIELDS) {
    copy[f.labelKey] = f.label;
    for (const o of f.options) copy[o.labelKey] = o.label;
  }
  return copy;
};
