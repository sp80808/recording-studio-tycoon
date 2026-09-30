/**
 * Canonical deterministic NPC visual identity + versioned appearance generation.
 *
 * The identity (seed, role, era, appearanceVersion) is the only thing that needs saving:
 * `resolveNpcAppearance(identity)` always rebuilds the same visual definition. New looks
 * ship as a new appearance version; saved identities keep the version they were created
 * with, so existing NPCs never silently change.
 */
import { createSeededRandom, pickWithRandom, type RandomSource } from '@/simulation/seededRandom';
import type { ModularNpcDefinition, NpcEra, StudioRole } from './spriteTypes';
import * as data from './npcAppearanceData';

export interface NpcVisualIdentity {
  seed: number;
  role: StudioRole;
  era: NpcEra;
  appearanceVersion: number;
}

export const LATEST_APPEARANCE_VERSION = 1;

const pickWeighted = <T,>(rng: RandomSource, pool: readonly data.Weighted<T>[]): T => {
  const entries = pool.map((entry) => (Array.isArray(entry) ? (entry as readonly [T, number]) : ([entry as T, 1] as const)));
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = rng() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll < 0) return value;
  }
  return entries[entries.length - 1][0];
};

export const isNpcEra = (value: unknown): value is NpcEra => data.NPC_ERAS.includes(value as NpcEra);
export const isStudioRole = (value: unknown): value is StudioRole => data.STUDIO_ROLES.includes(value as StudioRole);

/** Parse an untrusted (e.g. save-file) identity; returns null when any field is invalid. */
export const parseNpcVisualIdentity = (value: unknown): NpcVisualIdentity | null => {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (typeof v.seed !== 'number' || !Number.isFinite(v.seed)) return null;
  if (!isStudioRole(v.role) || !isNpcEra(v.era)) return null;
  const version = v.appearanceVersion === undefined ? 1 : v.appearanceVersion;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) return null;
  return { seed: v.seed, role: v.role, era: v.era, appearanceVersion: version };
};

/** Seed stream for one identity. Role/era/version are hashed in so they decorrelate. */
const identityRng = (id: NpcVisualIdentity): RandomSource =>
  createSeededRandom(`npc:v${id.appearanceVersion}:${id.seed}:${id.role}:${id.era}`);

const generateV1 = (id: NpcVisualIdentity, name?: string): ModularNpcDefinition => {
  const rng = identityRng(id);
  const { role, era } = id;

  const build = pickWeighted(rng, data.BUILDS);
  const skinTone = pickWithRandom(rng, data.SKIN_TONES);
  const skin = data.SKIN_PALETTES[skinTone];
  const face = pickWeighted(rng, data.FACES);
  const hairShape = pickWeighted(rng, data.ERA_HAIR_SHAPES[era]);
  const hairColour = pickWeighted(rng, data.ERA_HAIR_COLOURS[era]);
  const facialHair = hairShape === 'bald' && rng() < 0.5 ? 'full_beard' : pickWeighted(rng, data.ERA_FACIAL_HAIR[era]);

  const top = pickWeighted(rng, data.ERA_TOPS[era]);
  const topPalette = pickWithRandom(rng, data.CLOTHING_PALETTES);
  const lower = pickWeighted(rng, data.ERA_LOWERS[era]);
  const lowerHex = pickWithRandom(rng, data.LOWER_COLOURS);
  const shoes = pickWeighted(rng, data.ERA_SHOES[era]);
  const shoesHex = pickWithRandom(rng, data.SHOE_COLOURS);
  const outerwear = pickWeighted(rng, data.ERA_OUTERWEAR[era]);
  const outerwearPalette = pickWithRandom(rng, data.CLOTHING_PALETTES);

  const glasses = pickWeighted(rng, data.ERA_GLASSES[era]);
  const jewellery = pickWeighted(rng, data.ERA_JEWELLERY[era]);
  const headphoneColor = pickWithRandom(rng, data.HEADPHONE_COLOURS);
  const patches = rng() > 0.6;
  const pins = [...pickWithRandom(rng, data.PIN_OPTIONS)];
  const fullName = `${pickWithRandom(rng, data.FIRST_NAMES)} ${pickWithRandom(rng, data.LAST_NAMES)}`;

  return {
    id: `npc-${id.seed}-${role}-${era}`,
    seed: id.seed,
    appearanceVersion: id.appearanceVersion,
    name: name ?? fullName,
    role,
    era,
    body: { build, skinTone, skinHex: skin.base, shadowHex: skin.shadow, face },
    hair: { shape: hairShape, colour: hairColour, hairHex: data.HAIR_HEX[hairColour], facialHair },
    clothes: {
      top,
      topPrimaryHex: topPalette.primary,
      topSecondaryHex: topPalette.secondary,
      lower,
      lowerHex,
      shoes,
      shoesHex,
      outerwear,
      ...(outerwear !== 'none' ? { outerwearHex: outerwearPalette.secondary } : {}), // omit key (not undefined) so JSON round trips are exact
    },
    details: { glasses, jewellery, patches, pins, headphoneColor },
    roleProps: { ...data.ROLE_PROPS[role] },
  };
};

const GENERATORS: Record<number, (id: NpcVisualIdentity, name?: string) => ModularNpcDefinition> = {
  1: generateV1,
};

/** Rebuild the visual definition for a saved identity. Unknown future versions fall back to the newest known one <= requested. */
export const resolveNpcAppearance = (id: NpcVisualIdentity, name?: string): ModularNpcDefinition => {
  const known = Object.keys(GENERATORS).map(Number).filter((v) => v <= id.appearanceVersion);
  const version = known.length ? Math.max(...known) : LATEST_APPEARANCE_VERSION;
  return GENERATORS[version]({ ...id, appearanceVersion: version }, name);
};

export const identityOf = (npc: Pick<ModularNpcDefinition, 'seed' | 'role' | 'era' | 'appearanceVersion'>): NpcVisualIdentity => ({
  seed: npc.seed,
  role: npc.role,
  era: npc.era,
  appearanceVersion: npc.appearanceVersion ?? 1,
});

/** Serialise a definition losslessly (plain JSON data; no renderer objects). */
export const serializeNpc = (npc: ModularNpcDefinition): string => JSON.stringify(npc);
export const deserializeNpc = (json: string): ModularNpcDefinition | null => {
  try {
    const parsed = JSON.parse(json) as ModularNpcDefinition;
    const id = parseNpcVisualIdentity(parsed);
    return id && parsed.body && parsed.hair && parsed.clothes && parsed.details && parsed.roleProps ? parsed : null;
  } catch {
    return null;
  }
};

/** Deterministic role/era choice for a bare seed (used when the caller supplies neither). */
export const identityFromSeed = (
  seed: number,
  options: { role?: StudioRole; era?: NpcEra; appearanceVersion?: number } = {},
): NpcVisualIdentity => {
  const rng = createSeededRandom(`npc-identity:${seed}`);
  const era = options.era ?? pickWithRandom(rng, data.NPC_ERAS);
  const role = options.role ?? pickWithRandom(rng, data.STUDIO_ROLES);
  return { seed, role, era, appearanceVersion: options.appearanceVersion ?? LATEST_APPEARANCE_VERSION };
};
