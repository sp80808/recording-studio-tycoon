/**
 * Renderer-independent atlas lookups: resolve an animation tag to frame names with fallbacks.
 * The Pixi adapter (pixiAtlasLoader.ts) and tests both use this, so "missing frame / missing tag"
 * behaviour is defined once.
 */
import type { PixiTextureAtlasSchema } from './assetAtlasTypes';

export interface ResolvedAnimation {
  /** The tag that was actually used (may differ from the one requested). */
  tag: string;
  frames: string[];
  fellBack: boolean;
}

export const atlasTags = (atlas: PixiTextureAtlasSchema): string[] => {
  const names = new Set<string>(Object.keys(atlas.animations ?? {}));
  for (const t of atlas.meta?.tags ?? []) names.add(t.name);
  return [...names];
};

/** Frame names for a tag: `animations[tag]`, else the meta.tags range over sorted frame names. */
export const framesForTag = (atlas: PixiTextureAtlasSchema, tag: string): string[] => {
  const explicit = atlas.animations?.[tag];
  const pick = (list: string[]) => list.filter((f) => atlas.frames[f]);
  if (explicit?.length) return pick(explicit);
  const range = atlas.meta?.tags?.find((t) => t.name === tag);
  if (!range) return [];
  const ordered = Object.keys(atlas.frames);
  const slice = ordered.slice(range.from, range.to + 1);
  return range.direction === 'reverse' ? slice.reverse() : slice;
};

/**
 * Resolve `requested` through `fallbackChain` (e.g. record -> work -> idle). Returns null only when
 * nothing in the chain resolves to at least one existing frame - the caller then draws its
 * procedural/DOM fallback rather than crashing.
 */
export const resolveAnimation = (
  atlas: PixiTextureAtlasSchema,
  requested: string,
  fallbackChain: readonly string[] = ['idle'],
): ResolvedAnimation | null => {
  for (const [i, tag] of [requested, ...fallbackChain.filter((t) => t !== requested)].entries()) {
    const frames = framesForTag(atlas, tag);
    if (frames.length) return { tag, frames, fellBack: i > 0 };
  }
  return null;
};

/** Normalised pivot for a frame (default: feet-centre for characters). */
export const framePivot = (atlas: PixiTextureAtlasSchema, frame: string, fallback = { x: 0.5, y: 1 }) =>
  atlas.frames[frame]?.pivot ?? fallback;
