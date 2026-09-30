// Sprite textures for the signature studio props (door, wall clock, mic stand, mug, notepad, stool, music stand, rug, era lamps).
// Sources are in-house CC0 SVG/PNG under public/assets/props (see docs/ART_SOURCING_LOG.md).
// Scene builders call getPropTexture(); when a texture is missing they fall back
// to the original procedural Graphics drawing, so nothing breaks if a load fails.

import { Assets, Texture } from 'pixi.js';

export type PropSpriteId = 'door' | 'wallClock' | 'micStand' | 'mug' | 'notepad' | 'stool' | 'musicStand' | 'rug' | 'brassLamp' | 'lavaLamp' | 'ringLight';

const PROP_PATHS: Record<PropSpriteId, string> = {
  door: 'assets/props/door.png',
  wallClock: 'assets/props/wall-clock.png',
  micStand: 'assets/props/mic-stand.png',
  mug: 'assets/props/mug.png',
  notepad: 'assets/props/notepad.png',
  stool: 'assets/props/stool.png',
  musicStand: 'assets/props/music-stand.png',
  rug: 'assets/props/rug.png',
  brassLamp: 'assets/props/brass-lamp.png',
  lavaLamp: 'assets/props/lava-lamp.png',
  ringLight: 'assets/props/ring-light.png',
};

const loaded: Partial<Record<PropSpriteId, Texture>> = {};

const assetUrl = (path: string) => `${import.meta.env?.BASE_URL ?? '/'}${path}`;

export const loadPropSprites = async (): Promise<void> => {
  await Promise.all(
    (Object.keys(PROP_PATHS) as PropSpriteId[]).map(async (id) => {
      if (loaded[id]) return;
      try {
        loaded[id] = await Assets.load<Texture>(assetUrl(PROP_PATHS[id]));
      } catch {
        // Missing or blocked asset: keep the procedural fallback.
      }
    })
  );
};

export const getPropTexture = (id: PropSpriteId): Texture | null => loaded[id] ?? null;
