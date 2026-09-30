/**
 * Pixi adapter for built atlases. Uses Pixi's own Spritesheet/Assets; no second texture loader.
 * Static single-frame props still go through the prop loader in src/components/studio/propSprites.ts;
 * this is for multi-frame characters, gear and FX.
 */
import { AnimatedSprite, Assets, Spritesheet, Texture, type SpritesheetData } from 'pixi.js';
import type { PixiTextureAtlasSchema } from './assetAtlasTypes';
import { framePivot, resolveAnimation } from './atlasResolver';

export interface LoadedAtlas {
  atlas: PixiTextureAtlasSchema;
  sheet: Spritesheet;
}

/** Build a Spritesheet from already-loaded data + base texture (testable without network). */
export const buildSpritesheet = async (atlas: PixiTextureAtlasSchema, texture: Texture): Promise<LoadedAtlas> => {
  const sheet = new Spritesheet(texture, atlas as unknown as SpritesheetData);
  await sheet.parse();
  return { atlas, sheet };
};

/** Load `<base>.json` + its image from a URL; returns null (caller falls back) on any failure. */
export const loadAtlas = async (jsonUrl: string): Promise<LoadedAtlas | null> => {
  try {
    const atlas = (await (await fetch(jsonUrl)).json()) as PixiTextureAtlasSchema;
    const imageUrl = new URL(atlas.meta.image, new URL(jsonUrl, globalThis.location?.href ?? 'http://localhost/')).toString();
    const texture = await Assets.load<Texture>(imageUrl);
    return await buildSpritesheet(atlas, texture);
  } catch {
    return null;
  }
};

/**
 * An AnimatedSprite for `tag` (falling back through `fallbackChain`), pivoted per the atlas.
 * Returns null if nothing resolves, so the caller can draw its procedural fallback.
 */
export const createAtlasAnimation = (
  loaded: LoadedAtlas,
  tag: string,
  fallbackChain: readonly string[] = ['idle'],
  fps = 8,
): AnimatedSprite | null => {
  const resolved = resolveAnimation(loaded.atlas, tag, fallbackChain);
  if (!resolved) return null;
  const textures = resolved.frames.map((f) => loaded.sheet.textures[f]).filter((t): t is Texture => !!t);
  if (!textures.length) return null;
  const sprite = new AnimatedSprite(textures);
  const pivot = framePivot(loaded.atlas, resolved.frames[0]);
  sprite.anchor.set(pivot.x, pivot.y);
  sprite.animationSpeed = fps / 60;
  return sprite;
};
