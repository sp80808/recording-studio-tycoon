/**
 * Seeded staff portraits built from create-a-character / npc-parts piece IDs.
 *
 * Integration with `cursor/finish-character-creator`:
 * - Character creator saves slot indices on `NpcVisualIdentity.parts`
 *   (`NpcPartPicks`: body / hair / clothing / accessories) via
 *   `characterCreatorParts.ts`, then `resolveNpcAppearance` applies them.
 * - This module still exposes frame-stem `CreatorPieceIds` (`hair_afro`, …) for
 *   atlas-level overrides used by recruitment portraits today.
 * - Merge bridge (when both land): prefer identity.parts when present; map
 *   creator slot picks → piece stems through `creatorOptionsForEra` +
 *   `applyPartPicks`, and keep `StaffMember.pieceIds` as a derived cache only.
 * - Until that merge, piece IDs are derived from the modular appearance seed.
 * - Staff identity is saved as `NpcVisualIdentity` (+ optional piece overrides);
 *   never bake ephemeral render state into saves.
 */
import type { ModularNpcDefinition, NpcEra, StudioRole } from './spriteTypes';
import {
  identityFromSeed,
  LATEST_APPEARANCE_VERSION,
  resolveNpcAppearance,
  type NpcVisualIdentity,
} from './npcAppearance';

/** Frame-stem IDs from npc-parts / character-creator piece catalogues. */
export interface CreatorPieceIds {
  hair?: string;
  face?: string;
  top?: string;
  lower?: string;
  shoes?: string;
  outerwear?: string;
  glasses?: string;
  jewellery?: string;
  facialHair?: string;
}

export interface StaffPortraitSpec {
  seed: number;
  role: StudioRole;
  era: NpcEra;
  name?: string;
  appearanceVersion?: number;
  /** Optional creator piece overrides (character-creator branch). */
  pieces?: CreatorPieceIds;
}

const PIECE_PREFIX: Record<keyof CreatorPieceIds, string> = {
  hair: 'hair_',
  face: 'face_',
  top: 'top_',
  lower: 'lower_',
  shoes: 'shoes_',
  outerwear: 'outerwear_',
  glasses: 'glasses_',
  jewellery: 'jewellery_',
  facialHair: 'facial_hair_',
};

const stripPrefix = (value: string, prefix: string): string =>
  value.startsWith(prefix) ? value.slice(prefix.length) : value;

/** Serialize a modular look into creator piece IDs for UI / future creator sync. */
export const pieceIdsFromAppearance = (npc: ModularNpcDefinition): CreatorPieceIds => ({
  hair: `${PIECE_PREFIX.hair}${npc.hair.shape}`,
  face: `${PIECE_PREFIX.face}${npc.body.face}`,
  top: `${PIECE_PREFIX.top}${npc.clothes.top}`,
  lower: `${PIECE_PREFIX.lower}${npc.clothes.lower}`,
  shoes: `${PIECE_PREFIX.shoes}${npc.clothes.shoes}`,
  outerwear: `${PIECE_PREFIX.outerwear}${npc.clothes.outerwear}`,
  glasses: `${PIECE_PREFIX.glasses}${npc.details.glasses}`,
  jewellery: `${PIECE_PREFIX.jewellery}${npc.details.jewellery}`,
  facialHair: `${PIECE_PREFIX.facialHair}${npc.hair.facialHair}`,
});

/** Apply creator piece IDs onto a resolved appearance (unknown IDs are ignored). */
export const applyCreatorPieceIds = (
  npc: ModularNpcDefinition,
  pieces?: CreatorPieceIds,
): ModularNpcDefinition => {
  if (!pieces) return npc;
  const next: ModularNpcDefinition = {
    ...npc,
    body: { ...npc.body },
    hair: { ...npc.hair },
    clothes: { ...npc.clothes },
    details: { ...npc.details },
  };

  if (pieces.face) next.body.face = stripPrefix(pieces.face, PIECE_PREFIX.face) as ModularNpcDefinition['body']['face'];
  if (pieces.hair) next.hair.shape = stripPrefix(pieces.hair, PIECE_PREFIX.hair) as ModularNpcDefinition['hair']['shape'];
  if (pieces.facialHair) {
    next.hair.facialHair = stripPrefix(pieces.facialHair, PIECE_PREFIX.facialHair) as ModularNpcDefinition['hair']['facialHair'];
  }
  if (pieces.top) next.clothes.top = stripPrefix(pieces.top, PIECE_PREFIX.top) as ModularNpcDefinition['clothes']['top'];
  if (pieces.lower) next.clothes.lower = stripPrefix(pieces.lower, PIECE_PREFIX.lower) as ModularNpcDefinition['clothes']['lower'];
  if (pieces.shoes) next.clothes.shoes = stripPrefix(pieces.shoes, PIECE_PREFIX.shoes) as ModularNpcDefinition['clothes']['shoes'];
  if (pieces.outerwear) {
    next.clothes.outerwear = stripPrefix(pieces.outerwear, PIECE_PREFIX.outerwear) as ModularNpcDefinition['clothes']['outerwear'];
  }
  if (pieces.glasses) {
    next.details.glasses = stripPrefix(pieces.glasses, PIECE_PREFIX.glasses) as ModularNpcDefinition['details']['glasses'];
  }
  if (pieces.jewellery) {
    next.details.jewellery = stripPrefix(pieces.jewellery, PIECE_PREFIX.jewellery) as ModularNpcDefinition['details']['jewellery'];
  }
  return next;
};

export const staffRoleToStudioRole = (role: 'Engineer' | 'Producer' | 'Songwriter'): StudioRole => {
  if (role === 'Engineer') return 'engineer';
  if (role === 'Producer') return 'producer';
  return 'artist';
};

/** Map career / progression era ids onto npc visual eras. */
export const eraIdToNpcEra = (eraId?: string, year?: number): NpcEra => {
  const id = (eraId ?? '').toLowerCase();
  if (id.includes('classic') || id.includes('analog') || id === 'vintage-warmth') return '1960s';
  if (id.includes('golden') || id.includes('digital80') || id.includes('80')) return '1980s';
  if (id.includes('digital_age') || id.includes('internet') || id.includes('2000')) return '2000s';
  if (id.includes('modern') || id.includes('streaming') || id.includes('2020')) return 'modern';
  if (typeof year === 'number' && Number.isFinite(year)) {
    if (year < 1970) return '1960s';
    if (year < 1980) return '1970s';
    if (year < 1990) return '1980s';
    if (year < 2000) return '1990s';
    if (year < 2015) return '2000s';
    return 'modern';
  }
  return 'modern';
};

export const identityFromStaffSeed = (
  seed: number,
  options: { role?: StudioRole; era?: NpcEra; appearanceVersion?: number } = {},
): NpcVisualIdentity =>
  identityFromSeed(seed, {
    role: options.role,
    era: options.era,
    appearanceVersion: options.appearanceVersion ?? LATEST_APPEARANCE_VERSION,
  });

/** Resolve a deterministic staff portrait, optionally applying creator piece IDs. */
export const resolveStaffPortrait = (spec: StaffPortraitSpec): ModularNpcDefinition => {
  const identity = identityFromStaffSeed(spec.seed, {
    role: spec.role,
    era: spec.era,
    appearanceVersion: spec.appearanceVersion,
  });
  const base = resolveNpcAppearance(identity, spec.name);
  return applyCreatorPieceIds(base, spec.pieces);
};

/** Stable numeric seed for a candidate slot within a recruitment batch. */
export const staffPortraitSeed = (
  saveSeed: number | string,
  day: number,
  batchKey: string,
  index: number,
): number => {
  const input = `staff-portrait:${saveSeed}:${day}:${batchKey}:${index}`;
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};
