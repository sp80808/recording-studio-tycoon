/**
 * Lazy Pixi texture cache for equipment shelf sprites.
 * Missing files resolve to null so callers can keep the procedural bar fallback.
 */

import { Assets, Texture } from 'pixi.js';
import { getEquipmentSprite } from '@/data/equipmentArt';

const cache = new Map<string, Texture | null>();
const inflight = new Map<string, Promise<Texture | null>>();

const assetUrl = (path: string) => {
  const clean = path.replace(/^\//, '');
  return `${import.meta.env?.BASE_URL ?? '/'}${clean}`;
};

/** Synchronous lookup — returns null until a successful load has finished. */
export function getEquipmentTexture(equipmentId: string): Texture | null {
  const path = getEquipmentSprite(equipmentId);
  if (cache.has(path)) return cache.get(path) ?? null;
  return null;
}

/** Kick off a load for one equipment id. Safe to call repeatedly. */
export function ensureEquipmentTexture(equipmentId: string): Promise<Texture | null> {
  const path = getEquipmentSprite(equipmentId);
  if (cache.has(path)) return Promise.resolve(cache.get(path) ?? null);
  const existing = inflight.get(path);
  if (existing) return existing;

  const job = Assets.load<Texture>(assetUrl(path))
    .then((tex) => {
      cache.set(path, tex);
      inflight.delete(path);
      return tex;
    })
    .catch(() => {
      cache.set(path, null);
      inflight.delete(path);
      return null;
    });
  inflight.set(path, job);
  return job;
}

/** Prefetch textures for the shelf set; failures are cached as null (bar fallback). */
export async function prefetchEquipmentTextures(equipmentIds: string[]): Promise<void> {
  const unique = [...new Set(equipmentIds.filter(Boolean))];
  await Promise.all(unique.map((id) => ensureEquipmentTexture(id)));
}

/** Test helper — clears the in-memory cache. */
export function resetEquipmentTextureCache(): void {
  cache.clear();
  inflight.clear();
}
