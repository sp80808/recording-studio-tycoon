// Blender-rendered isometric sprites for the studio (console tiers, booth, clock face).
// Sources and render scripts: tools/blender/*.py -> public/assets/studio (see docs/ART_SOURCING_LOG.md).
// Every getter returns null until its texture has loaded, and the scene builders fall back
// to the original procedural Graphics, so a missing or blocked file never breaks the room.

import { Assets, Texture } from 'pixi.js';

export type StudioSpriteId =
  | 'console1' | 'console2' | 'console3' | 'console4' | 'console5'
  | 'boothBack' | 'boothFront' | 'clockFace';

const PATHS: Record<StudioSpriteId, string> = {
  console1: 'assets/studio/console_t1.png',
  console2: 'assets/studio/console_t2.png',
  console3: 'assets/studio/console_t3.png',
  console4: 'assets/studio/console_t4.png',
  console5: 'assets/studio/console_t5.png',
  boothBack: 'assets/studio/booth_back.png',
  boothFront: 'assets/studio/booth_front.png',
  clockFace: 'assets/studio/clock_face.png',
};

/** Offsets are 1x pixels relative to the sprite origin (the object's floor point). */
export interface ConsoleAnchors {
  faders: { x: number; y0: number; y1: number }[];
  meters: { x: number; yBottom: number; yTop: number; w: number }[];
}

export interface ConsoleSpriteData {
  /** Pixel inside the PNG that sits on the sprite origin (2x pixels). */
  anchor: [number, number];
  /** Game tile the sprite origin is placed on. */
  originGame: [number, number];
  tiers: Record<string, ConsoleAnchors>;
}

const loaded: Partial<Record<StudioSpriteId, Texture>> = {};
let consoleData: ConsoleSpriteData | null = null;

export const studioAssetUrl = (path: string) => `${import.meta.env?.BASE_URL ?? '/'}${path}`;

export const loadStudioSprites = async (): Promise<void> => {
  await Promise.all([
    ...(Object.keys(PATHS) as StudioSpriteId[]).map(async (id) => {
      if (loaded[id]) return;
      try {
        loaded[id] = await Assets.load<Texture>(studioAssetUrl(PATHS[id]));
      } catch {
        // Keep the procedural fallback.
      }
    }),
    (async () => {
      if (consoleData) return;
      try {
        const res = await fetch(studioAssetUrl('assets/studio/console.json'));
        if (res.ok) consoleData = (await res.json()) as ConsoleSpriteData;
      } catch {
        // Anchors missing: console falls back to the procedural desk.
      }
    })(),
  ]);
};

export const getStudioTexture = (id: StudioSpriteId): Texture | null => loaded[id] ?? null;

export const getConsoleSprite = (tier: number): { texture: Texture; data: ConsoleSpriteData; anchors: ConsoleAnchors } | null => {
  const texture = loaded[`console${Math.max(1, Math.min(5, Math.round(tier)))}` as StudioSpriteId];
  const anchors = consoleData?.tiers[String(Math.max(1, Math.min(5, Math.round(tier))))];
  if (!texture || !consoleData || !anchors) return null;
  return { texture, data: consoleData, anchors };
};
