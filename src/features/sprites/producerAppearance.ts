/**
 * Producer (player) character customisation -> ModularNpcDefinition.
 *
 * The career-start screen stores a tiny, serialisable `ProducerAppearance` (hair shape, hair
 * colour, clothes colour, accessory + a body seed). `buildProducerNpc` is the single pure
 * bridge that turns it into the same `ModularNpcDefinition` the studio/play-mode renderers
 * draw, so the player sprite is always derived data and never a second source of truth.
 */
import { hashSeed, pickWithRandom, randomInt, type RandomSource } from '@/simulation/seededRandom';
import type { BodyBuild, ClothesLower, ClothesTop, GlassesStyle, HairColour, HairShape, Headwear, Jewellery, ModularNpcDefinition, NpcEra, ShoesType, SkinTone } from './spriteTypes';
import { resolveNpcAppearance } from './npcAppearance';
import { CLOTHING_PALETTES, HAIR_HEX, LOWER_COLOURS, SKIN_PALETTES, SKIN_TONES, SHOE_COLOURS } from './npcAppearanceData';

export const PRODUCER_SKIN_TONES = SKIN_TONES;
export const PRODUCER_SHIRTS: readonly ClothesTop[] = ['flannel_shirt', 'band_tee', 'turtleneck', 'leather_jacket', 'tracksuit_jacket', 'oversized_hoodie', 'denim_vest', 'vintage_cardigan'];
export const PRODUCER_PANTS: readonly ClothesLower[] = ['denim_jeans', 'corduroy_trousers', 'bell_bottoms', 'cargo_pants', 'joggers', 'ripped_jeans'];
export const PRODUCER_SHOES: readonly ShoesType[] = ['vintage_sneakers', 'leather_boots', 'creepers', 'hi_tops', 'loafers', 'canvas_skaters'];
export const APPEARANCE_LABELS: Record<string, string> = {
  fair: 'Fair', warm: 'Warm', olive: 'Olive', tan: 'Tan', deep: 'Deep', rich: 'Rich',
  flannel_shirt: 'Flannel', band_tee: 'Band tee', turtleneck: 'Turtleneck', leather_jacket: 'Leather jacket', tracksuit_jacket: 'Tracksuit', oversized_hoodie: 'Oversized hoodie', denim_vest: 'Denim vest', vintage_cardigan: 'Cardigan',
  denim_jeans: 'Denim jeans', corduroy_trousers: 'Corduroy', bell_bottoms: 'Bell bottoms', cargo_pants: 'Cargo pants', joggers: 'Joggers', ripped_jeans: 'Ripped jeans',
  vintage_sneakers: 'Sneakers', leather_boots: 'Leather boots', creepers: 'Creepers', hi_tops: 'Hi-tops', loafers: 'Loafers', canvas_skaters: 'Canvas skaters',
};

export const PRODUCER_HAIR_SHAPES: readonly HairShape[] = [
  'pompadour', 'slicked', 'bob', 'messy_curly', 'long_wavy', 'afro', 'dreads', 'topknot', 'buzzcut', 'bald',
];
export const PRODUCER_HAIR_COLOURS: readonly HairColour[] = [
  'jet_black', 'dark_brown', 'chestnut', 'auburn', 'bleached_blonde', 'silver_grey', 'neon_pink', 'electric_blue',
];

/** Warm, analog-console-friendly shirt colours (indexes into the shared clothing palettes). */
export const PRODUCER_CLOTHES_COLOURS = [
  { id: 'ruby', label: 'Ruby', palette: 0 },
  { id: 'amber', label: 'Amber', palette: 2 },
  { id: 'mustard', label: 'Mustard', palette: 9 },
  { id: 'forest', label: 'Forest', palette: 3 },
  { id: 'teal', label: 'Teal', palette: 4 },
  { id: 'cobalt', label: 'Cobalt', palette: 5 },
  { id: 'plum', label: 'Plum', palette: 6 },
  { id: 'oxford', label: 'Oxford', palette: 8 },
] as const;
export type ProducerClothesColourId = (typeof PRODUCER_CLOTHES_COLOURS)[number]['id'];

export const PRODUCER_ACCESSORIES = [
  'none', 'headphones', 'round_glasses', 'wayfarers', 'flat_cap', 'beanie', 'gold_chain',
  'aviators', 'horn_rims', 'visor', 'bucket_hat', 'bandana', 'headband', 'hoops', 'choker', 'cassette_pendant',
] as const;
export type ProducerAccessory = (typeof PRODUCER_ACCESSORIES)[number];

/** Explicit physique picker (slim / average / stocky). Seed still drives skin and face. */
export const PRODUCER_BUILDS: readonly BodyBuild[] = ['slim', 'average', 'stocky'];
export const BUILD_LABELS: Record<BodyBuild, string> = { slim: 'Slim', average: 'Average', stocky: 'Stocky' };

export const ACCESSORY_LABELS: Record<ProducerAccessory, string> = {
  none: 'Nothing',
  headphones: 'Cans',
  round_glasses: 'Round specs',
  wayfarers: 'Wayfarers',
  flat_cap: 'Flat cap',
  beanie: 'Beanie',
  gold_chain: 'Gold chain',
  aviators: 'Aviators',
  horn_rims: 'Horn-rims',
  visor: 'Cyber visor',
  bucket_hat: 'Bucket hat',
  bandana: 'Bandana',
  headband: 'Headband',
  hoops: 'Silver hoops',
  choker: 'Choker',
  cassette_pendant: 'Tape pendant',
};

const ACCESSORY_HEADWEAR: Partial<Record<ProducerAccessory, Headwear>> = {
  flat_cap: 'flat_cap', beanie: 'beanie', bucket_hat: 'bucket_hat', bandana: 'bandana', headband: 'headband',
};
const ACCESSORY_GLASSES: Partial<Record<ProducerAccessory, GlassesStyle>> = {
  round_glasses: 'wire_round', wayfarers: 'wayfarer', aviators: 'tinted_aviator', horn_rims: 'horn_rim', visor: 'cyber_visor',
};
const ACCESSORY_JEWELLERY: Partial<Record<ProducerAccessory, Jewellery>> = {
  gold_chain: 'gold_chain', hoops: 'silver_hoops', choker: 'choker', cassette_pendant: 'cassette_pendant',
};

export interface ProducerAppearance {
  /** Seeds the face details. Stable per career. */
  seed: number;
  skinTone?: SkinTone;
  shirt?: ClothesTop;
  pants?: ClothesLower;
  shoes?: ShoesType;
  /** Explicit physique. Optional so older saves keep loading (defaults to average). */
  build?: BodyBuild;
  hair: HairShape;
  hairColour: HairColour;
  clothesColour: ProducerClothesColourId;
  accessory: ProducerAccessory;
}

export const DEFAULT_PRODUCER_APPEARANCE: ResolvedProducerAppearance = {
  seed: 1960,
  skinTone: 'tan',
  shirt: 'band_tee',
  pants: 'denim_jeans',
  shoes: 'vintage_sneakers',
  build: 'average',
  hair: 'pompadour',
  hairColour: 'dark_brown',
  clothesColour: 'amber',
  accessory: 'headphones',
};

/** A fully populated appearance: what `sanitizeProducerAppearance` always returns. */
export type ResolvedProducerAppearance = Required<ProducerAppearance>;

const oneOf = <T extends string>(list: readonly T[], value: unknown, fallback: T): T =>
  list.includes(value as T) ? (value as T) : fallback;

/** Repair an untrusted (save-file) blob: every field falls back to the default individually. */
export const sanitizeProducerAppearance = (value: unknown): ResolvedProducerAppearance => {
  const v = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const d = DEFAULT_PRODUCER_APPEARANCE;
  return {
    seed: typeof v.seed === 'number' && Number.isFinite(v.seed) ? Math.trunc(v.seed) : d.seed,
    skinTone: oneOf(PRODUCER_SKIN_TONES, v.skinTone, d.skinTone),
    shirt: oneOf(PRODUCER_SHIRTS, v.shirt, d.shirt),
    pants: oneOf(PRODUCER_PANTS, v.pants, d.pants),
    shoes: oneOf(PRODUCER_SHOES, v.shoes, d.shoes),
    build: oneOf(PRODUCER_BUILDS, v.build, d.build),
    hair: oneOf(PRODUCER_HAIR_SHAPES, v.hair, d.hair),
    hairColour: oneOf(PRODUCER_HAIR_COLOURS, v.hairColour, d.hairColour),
    clothesColour: oneOf(PRODUCER_CLOTHES_COLOURS.map((c) => c.id), v.clothesColour, d.clothesColour),
    accessory: oneOf(PRODUCER_ACCESSORIES, v.accessory, d.accessory),
  };
};

/** Era id (selected or visual) -> sprite era, so the base wardrobe matches the studio's decade. */
export const npcEraForGameEra = (eraId: string | undefined): NpcEra =>
  (({
    analog60s: '1960s', classic_rock: '1970s', digital80s: '1980s', golden_age: '1980s',
    internet2000s: '2000s', digital_age: '1990s', streaming2020s: 'modern', modern: 'modern',
  }) as Record<string, NpcEra>)[eraId ?? ''] ?? 'modern';

/**
 * Every user-editable field (plus the face seed). Equality and randomisation are both driven from
 * this list so a newly added field cannot be forgotten by either.
 */
export const PRODUCER_APPEARANCE_KEYS = [
  'seed', 'build', 'skinTone', 'hair', 'hairColour', 'shirt', 'pants', 'shoes', 'clothesColour', 'accessory',
] as const satisfies readonly (keyof ProducerAppearance)[];

/** Semantic equality: both sides are sanitised first, so missing legacy fields never read as dirty. */
export const sameProducerAppearance = (a: ProducerAppearance | undefined, b: ProducerAppearance | undefined): boolean => {
  const x = sanitizeProducerAppearance(a);
  const y = sanitizeProducerAppearance(b);
  return PRODUCER_APPEARANCE_KEYS.every((key) => x[key] === y[key]);
};

/**
 * "Surprise me": a complete, legal appearance drawn only from the allowed-value sets. Pure given
 * the injected RNG, so tests (and replays) can seed it; UI code supplies the entropy.
 */
export const randomiseProducerAppearance = (rng: RandomSource): ResolvedProducerAppearance => ({
  build: pickWithRandom(rng, PRODUCER_BUILDS),
  skinTone: pickWithRandom(rng, PRODUCER_SKIN_TONES),
  shirt: pickWithRandom(rng, PRODUCER_SHIRTS),
  pants: pickWithRandom(rng, PRODUCER_PANTS),
  shoes: pickWithRandom(rng, PRODUCER_SHOES),
  hair: pickWithRandom(rng, PRODUCER_HAIR_SHAPES),
  hairColour: pickWithRandom(rng, PRODUCER_HAIR_COLOURS),
  clothesColour: pickWithRandom(rng, PRODUCER_CLOTHES_COLOURS).id,
  accessory: pickWithRandom(rng, PRODUCER_ACCESSORIES),
  seed: randomInt(rng, 0, 99999),
});

/** Pure: the full sprite definition for a producer. Same inputs always give the same NPC. */
export const buildProducerNpc = (
  appearance: ProducerAppearance,
  name: string,
  eraId?: string,
): ModularNpcDefinition => {
  const a = sanitizeProducerAppearance(appearance);
  const base = resolveNpcAppearance(
    { seed: hashSeed(`producer:${a.seed}`), role: 'producer', era: npcEraForGameEra(eraId), appearanceVersion: 1 },
    name.trim() || 'Producer',
  );
  const palette = CLOTHING_PALETTES[PRODUCER_CLOTHES_COLOURS.find((c) => c.id === a.clothesColour)!.palette];
  const headwear: Headwear = ACCESSORY_HEADWEAR[a.accessory] ?? 'none';
  const { outerwearHex: _outerwearHex, ...clothesRest } = base.clothes;
  return {
    ...base,
    id: 'player-producer',
    hair: { ...base.hair, shape: a.hair, colour: a.hairColour, hairHex: HAIR_HEX[a.hairColour] },
    clothes: {
      ...clothesRest,
      top: a.shirt,
      topPrimaryHex: palette.primary,
      topSecondaryHex: palette.secondary,
      lower: a.pants,
      lowerHex: LOWER_COLOURS[PRODUCER_PANTS.indexOf(a.pants) % LOWER_COLOURS.length],
      shoes: a.shoes,
      shoesHex: SHOE_COLOURS[PRODUCER_SHOES.indexOf(a.shoes) % SHOE_COLOURS.length],
      outerwear: 'none',
    },
    details: {
      ...base.details,
      headwear,
      headphones: a.accessory === 'headphones',
      glasses: ACCESSORY_GLASSES[a.accessory] ?? 'none',
      jewellery: ACCESSORY_JEWELLERY[a.accessory] ?? 'none',
    },
    // The player's face shows (shades only come from an explicit glasses pick).
    // Physique is an explicit picker; the seed keeps driving skin and face.
    body: { ...base.body, build: a.build, skinTone: a.skinTone, skinHex: SKIN_PALETTES[a.skinTone].base, shadowHex: SKIN_PALETTES[a.skinTone].shadow, face: base.body.face === 'vintage_shades' ? 'focused' : base.body.face },
  };
};
