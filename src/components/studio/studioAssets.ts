/**
 * Optional sprite/texture dressing layer for the living studio (pixi-presentation-audit
 * §4 "Assets vs procedural Graphics"; GitHub issue #58).
 *
 * Architecture: authoritative GameState -> StudioSceneState (presentation model) ->
 * procedural Pixi room (WebGLCanvas) -> this optional dressing layer. Nothing here may
 * ever be required for simulation state or first-frame rendering: every lookup either
 * resolves instantly (no asset needed) or resolves asynchronously and is expected to be
 * layered *on top of* Graphics the room already drew, never gating it.
 *
 * No PNGs are committed under public/assets/items/ yet (see assets/README.md) — every
 * texture load below is expected to reject today and fall back silently. That is the
 * point: dropping a real file in later lights this up with zero code changes.
 */
import { Assets, Texture } from 'pixi.js';
import { getEquipmentArt } from '@/data/equipmentArt';

const textureCache = new Map<string, Promise<Texture | null>>();

/**
 * Loads a texture from `public/` if present, else resolves to null. Never throws,
 * never blocks the caller's synchronous Graphics fallback, and only fetches a given
 * path once (in-flight/failed lookups are cached for the session).
 */
export function loadOptionalTexture(publicPath: string): Promise<Texture | null> {
  const cached = textureCache.get(publicPath);
  if (cached) return cached;

  const promise = Assets.load(publicPath).catch(() => null) as Promise<Texture | null>;
  textureCache.set(publicPath, promise);
  return promise;
}

/** Resolves an owned equipment id to its target sprite path, or null if unmapped. */
export function resolveEquipmentSpritePath(equipmentId: string): string | null {
  const art = getEquipmentArt(equipmentId);
  if (!art?.sprite) return null;
  return art.sprite.startsWith('/') ? art.sprite : `/${art.sprite}`;
}

/** Test/dev helper: drop cached results so a freshly-dropped asset can be retried. */
export function clearStudioAssetCache(): void {
  textureCache.clear();
}
