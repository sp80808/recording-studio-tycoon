/**
 * Granular character-creator catalogs: body / hair / clothing / accessories.
 *
 * Indices are saved on NpcVisualIdentity.parts and applied as overrides after
 * the seed-based generator fills palette + leftover slots. Crew portal and
 * career onboarding share these lists so a produced look stays consistent.
 */
import type {
  ClothesLower,
  ClothesTop,
  FacialHair,
  GlassesStyle,
  HairColour,
  HairShape,
  Jewellery,
  ModularNpcDefinition,
  NpcEra,
  Outerwear,
  SkinTone,
  BodyBuild,
} from './spriteTypes';
import * as data from './npcAppearanceData';

export type CreatorPartSlot = 'body' | 'build' | 'hair' | 'clothing' | 'accessories';

export interface NpcPartPicks {
  body: number;
  /** Independent physique pick (slim / average / stocky). Optional on old saves — defaults to 0. */
  build?: number;
  hair: number;
  clothing: number;
  accessories: number;
}

export interface CreatorPartOption {
  index: number;
  id: string;
  label: string;
}

export const DEFAULT_PART_PICKS: NpcPartPicks = {
  body: 0,
  build: 0,
  hair: 0,
  clothing: 0,
  accessories: 0,
};

/** Slots persisted to saves (build rides along when present; old saves omit it). */
export const CREATOR_PART_SLOTS: readonly CreatorPartSlot[] = ['body', 'build', 'hair', 'clothing', 'accessories'];

const unwrap = <T,>(pool: readonly data.Weighted<T>[]): T[] => {
  const out: T[] = [];
  for (const entry of pool) {
    const value = Array.isArray(entry) ? entry[0] : entry;
    if (!out.includes(value)) out.push(value);
  }
  return out;
};

const labelize = (id: string): string =>
  id
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const optionsFrom = (ids: readonly string[]): CreatorPartOption[] =>
  ids.map((id, index) => ({ index, id, label: labelize(id) }));

export const bodyOptions = (): CreatorPartOption[] => optionsFrom(data.SKIN_TONES);

export const buildOptions = (): CreatorPartOption[] => optionsFrom(unwrap(data.BUILDS) as readonly string[]);

export const hairOptionsForEra = (era: NpcEra): CreatorPartOption[] =>
  optionsFrom(unwrap(data.ERA_HAIR_SHAPES[era]));

export const clothingOptionsForEra = (era: NpcEra): CreatorPartOption[] =>
  optionsFrom(unwrap(data.ERA_TOPS[era]));

export const accessoryOptionsForEra = (era: NpcEra): CreatorPartOption[] =>
  optionsFrom(unwrap(data.ERA_GLASSES[era]));

export const creatorOptionsForEra = (era: NpcEra): Record<CreatorPartSlot, CreatorPartOption[]> => ({
  body: bodyOptions(),
  build: buildOptions(),
  hair: hairOptionsForEra(era),
  clothing: clothingOptionsForEra(era),
  accessories: accessoryOptionsForEra(era),
});

export const normalizePartPicks = (
  era: NpcEra,
  picks?: Partial<NpcPartPicks> | null,
): NpcPartPicks => {
  const opts = creatorOptionsForEra(era);
  const clamp = (value: number | undefined, length: number): number => {
    if (typeof value !== 'number' || !Number.isInteger(value)) return 0;
    return ((value % length) + length) % length;
  };
  return {
    body: clamp(picks?.body, opts.body.length),
    build: clamp(picks?.build, opts.build.length),
    hair: clamp(picks?.hair, opts.hair.length),
    clothing: clamp(picks?.clothing, opts.clothing.length),
    accessories: clamp(picks?.accessories, opts.accessories.length),
  };
};

export const cyclePart = (
  picks: NpcPartPicks,
  slot: CreatorPartSlot,
  delta: number,
  era: NpcEra,
): NpcPartPicks => {
  const length = creatorOptionsForEra(era)[slot].length;
  const next = ((picks[slot] + delta) % length + length) % length;
  return { ...picks, [slot]: next };
};

export const partLabel = (era: NpcEra, slot: CreatorPartSlot, index: number): string => {
  const option = creatorOptionsForEra(era)[slot][index];
  return option?.label ?? '—';
};

/** Parse untrusted part picks from a save; returns null when incomplete or invalid. */
export const parseNpcPartPicks = (value: unknown): NpcPartPicks | null => {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const out: Partial<NpcPartPicks> = {};
  // Core slots are required; build is optional so pre-split saves still load.
  for (const key of ['body', 'hair', 'clothing', 'accessories'] as const) {
    const raw = record[key];
    if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < 0) return null;
    out[key] = raw;
  }
  const buildRaw = record.build;
  if (buildRaw !== undefined) {
    if (typeof buildRaw !== 'number' || !Number.isInteger(buildRaw) || buildRaw < 0) return null;
    out.build = buildRaw;
  }
  return out as NpcPartPicks;
};

/**
 * Apply creator indices onto a seed-generated NPC. Palette/hex leftovers stay from
 * the seed so arrowing shape/slots keeps colourway stable until the player reshuffles.
 */
export const applyPartPicks = (
  npc: ModularNpcDefinition,
  picksInput: NpcPartPicks,
): ModularNpcDefinition => {
  const picks = normalizePartPicks(npc.era, picksInput);
  const builds = unwrap(data.BUILDS) as BodyBuild[];
  const skins = data.SKIN_TONES as readonly SkinTone[];
  const hairShapes = unwrap(data.ERA_HAIR_SHAPES[npc.era]) as HairShape[];
  const hairColours = unwrap(data.ERA_HAIR_COLOURS[npc.era]) as HairColour[];
  const facial = unwrap(data.ERA_FACIAL_HAIR[npc.era]) as FacialHair[];
  const tops = unwrap(data.ERA_TOPS[npc.era]) as ClothesTop[];
  const lowers = unwrap(data.ERA_LOWERS[npc.era]) as ClothesLower[];
  const outerwear = unwrap(data.ERA_OUTERWEAR[npc.era]) as Outerwear[];
  const glasses = unwrap(data.ERA_GLASSES[npc.era]) as GlassesStyle[];
  const jewellery = unwrap(data.ERA_JEWELLERY[npc.era]) as Jewellery[];

  const skinTone = skins[picks.body % skins.length];
  const build = builds[(picks.build ?? picks.body) % builds.length];
  const skin = data.SKIN_PALETTES[skinTone];

  const hairShape = hairShapes[picks.hair % hairShapes.length];
  const hairColour = hairColours[picks.hair % hairColours.length];
  const facialHair: FacialHair =
    hairShape === 'bald'
      ? picks.hair % 2 === 0
        ? 'full_beard'
        : 'none'
      : facial[picks.hair % facial.length];

  const top = tops[picks.clothing % tops.length];
  const lower = lowers[picks.clothing % lowers.length];
  const outer = outerwear[picks.clothing % outerwear.length];
  const glass = glasses[picks.accessories % glasses.length];
  const jewel = jewellery[picks.accessories % jewellery.length];

  return {
    ...npc,
    body: {
      ...npc.body,
      build,
      skinTone,
      skinHex: skin.base,
      shadowHex: skin.shadow,
    },
    hair: {
      shape: hairShape,
      colour: hairColour,
      hairHex: data.HAIR_HEX[hairColour],
      facialHair,
    },
    clothes: {
      top,
      topPrimaryHex: npc.clothes.topPrimaryHex,
      topSecondaryHex: npc.clothes.topSecondaryHex,
      lower,
      lowerHex: npc.clothes.lowerHex,
      shoes: npc.clothes.shoes,
      shoesHex: npc.clothes.shoesHex,
      outerwear: outer,
      ...(outer !== 'none'
        ? { outerwearHex: npc.clothes.outerwearHex ?? npc.clothes.topSecondaryHex }
        : {}),
    },
    details: {
      ...npc.details,
      glasses: glass,
      jewellery: jewel,
    },
  };
};
