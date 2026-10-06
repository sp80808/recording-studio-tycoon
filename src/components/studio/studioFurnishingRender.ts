// Equipped furnishings in the room (#258). In-house Pixi Graphics only (logged in docs/ART_SOURCING_LOG.md).
// `mapFurnishingsToRender` is pure (no Pixi use): customisation + premises tier -> render list. Presentation only.
import { Container, Graphics } from 'pixi.js';
import { iso } from './isoMath';
import {
  STUDIO_FURNISHINGS, getAnchorsForTier, isItemUnlocked, type FurnishingAnchorId, type StudioCustomizationState,
} from '@/rpg/studioCustomization';

export type FurnishingSurface = 'floor' | 'right-wall' | 'left-wall';
export type FurnishingShape = 'lamp' | 'plant' | 'rug' | 'sofa' | 'panel' | 'frame' | 'poster' | 'mug' | 'keys' | 'reel' | 'disc';

export interface FurnishingRenderItem {
  anchorId: FurnishingAnchorId;
  itemId: string;
  surface: FurnishingSurface;
  /** Tile coordinate (floor: x,y; right wall: x along the wall; left wall: y along the wall). */
  tile: { x: number; y: number };
  /** Pixels up the wall, or off the floor for small tabletop pieces. */
  lift: number;
  shape: FurnishingShape;
  color: number;
}

interface AnchorSpot { surface: FurnishingSurface; x: number; y: number; lift: number }

/** Authored spots, kept to small pieces in corners and wall gaps so they never cover a hotspot. */
export const ANCHOR_SPOTS: Record<FurnishingAnchorId, AnchorSpot> = {
  rug: { surface: 'floor', x: 5.0, y: 4.5, lift: 0 },
  lamp: { surface: 'floor', x: 7.4, y: 1.0, lift: 0 },
  plant: { surface: 'floor', x: 0.5, y: 6.4, lift: 0 },
  sofa: { surface: 'floor', x: 1.6, y: 6.3, lift: 0 },
  'desk-accessory': { surface: 'floor', x: 4.4, y: 5.6, lift: 22 },
  shelf: { surface: 'right-wall', x: 6.9, y: 0, lift: 46 },
  'trophy-shelf': { surface: 'right-wall', x: 5.7, y: 0, lift: 78 },
  'wall-art': { surface: 'left-wall', x: 0, y: 5.2, lift: 84 },
  poster: { surface: 'left-wall', x: 0, y: 2.4, lift: 84 },
  'console-ornament': { surface: 'floor', x: 4.0, y: 4.9, lift: 28 },
  'rack-side': { surface: 'left-wall', x: 0, y: 3.7, lift: 40 },
  'acoustic-panel': { surface: 'left-wall', x: 0, y: 1.2, lift: 70 },
};

const LOOKS: Record<string, { shape: FurnishingShape; color: number }> = {
  'brass-lamp': { shape: 'lamp', color: 0xd9a441 },
  'floor-fern': { shape: 'plant', color: 0x3f8f4a },
  'worn-rug': { shape: 'rug', color: 0x9c4a3a },
  'corduroy-sofa': { shape: 'sofa', color: 0xb5793f },
  'foam-panel-skin': { shape: 'panel', color: 0x2b2d33 },
  'first-cheque-frame': { shape: 'frame', color: 0xe9e2c8 },
  'rebook-polaroid': { shape: 'frame', color: 0xf1efe8 },
  'signed-tour-poster': { shape: 'poster', color: 0xd35b4a },
  'studio-plaque': { shape: 'frame', color: 0xc9a24a },
  'crew-mug': { shape: 'mug', color: 0xe0e0e0 },
  'second-room-keys': { shape: 'keys', color: 0xc0c4cc },
  'tape-reel-display': { shape: 'reel', color: 0x8a8d96 },
  'gold-reference-disc': { shape: 'disc', color: 0xf2c84b },
  'bad-day-ticket': { shape: 'frame', color: 0xcfc6a8 },
};

/** Pure: what to draw for equipped, unlocked furnishings whose anchor exists at this premises tier. */
export const mapFurnishingsToRender = (c: StudioCustomizationState, premisesTier: number | undefined): FurnishingRenderItem[] => {
  const out: FurnishingRenderItem[] = [];
  for (const anchorId of getAnchorsForTier(premisesTier)) {
    const itemId = c.equippedByAnchor[anchorId];
    const def = itemId ? STUDIO_FURNISHINGS.find((f) => f.id === itemId) : undefined;
    const look = itemId ? LOOKS[itemId] : undefined;
    if (!def || !look || !isItemUnlocked(c, def.id) || !(def.compatibleAnchors as readonly string[]).includes(anchorId)) continue;
    const spot = ANCHOR_SPOTS[anchorId];
    out.push({ anchorId, itemId: def.id, surface: spot.surface, tile: { x: spot.x, y: spot.y }, lift: spot.lift, shape: look.shape, color: look.color });
  }
  return out;
};

/** Stable key for the scene's structural rebuild check. */
export const furnishingRenderKey = (c: StudioCustomizationState | undefined, premisesTier: number | undefined): string =>
  c ? mapFurnishingsToRender(c, premisesTier).map((i) => `${i.anchorId}=${i.itemId}`).join(',') : '';

const shade = (color: number, f: number): number => {
  const ch = (shift: number) => Math.min(255, Math.round(((color >> shift) & 255) * f));
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
};

/** Flat rectangle on a wall plane: rises 14px per 28px along the right wall (+x), falls along the left wall (+y). */
const wallRect = (g: Graphics, dir: 1 | -1, w: number, h: number, color: number) => {
  const k = w / 2, s = w / 4;
  g.poly([-k, -dir * s, k, dir * s, k, dir * s - h, -k, -dir * s - h]).fill(color);
};

const draw = (item: FurnishingRenderItem): Graphics => {
  const g = new Graphics();
  const c = item.color;
  const dir: 1 | -1 = item.surface === 'right-wall' ? 1 : -1;
  switch (item.shape) {
    case 'lamp':
      g.ellipse(0, 3, 12, 5).fill({ color: 0x000000, alpha: 0.28 });
      g.rect(-1.2, -44, 2.4, 46).fill(0x2a2a30);
      g.poly([-9, -44, 9, -44, 5, -58, -5, -58]).fill(c);
      g.circle(0, -42, 4).fill({ color: 0xffe9a8, alpha: 0.8 });
      break;
    case 'plant':
      g.ellipse(0, 3, 14, 6).fill({ color: 0x000000, alpha: 0.28 });
      g.poly([-8, 0, 8, 0, 6, -14, -6, -14]).fill(0x7a4a32);
      for (let i = -3; i <= 3; i++) g.poly([0, -14, i * 6 - 3, -38 + Math.abs(i) * 4, i * 6 + 3, -36 + Math.abs(i) * 4]).fill(i % 2 ? c : shade(c, 0.8));
      break;
    case 'rug':
      g.poly([-50, 0, 0, -25, 50, 0, 0, 25]).fill({ color: c, alpha: 0.9 });
      g.poly([-38, 0, 0, -19, 38, 0, 0, 19]).stroke({ width: 2, color: 0xe8d2a0, alpha: 0.8 });
      break;
    case 'sofa':
      g.ellipse(0, 4, 34, 9).fill({ color: 0x000000, alpha: 0.28 });
      g.poly([-30, 0, 0, 14, 30, 0, 30, -14, 0, 0, -30, -14]).fill(shade(c, 0.7));
      g.poly([-30, -14, 0, 0, 30, -14, 30, -30, 0, -16, -30, -30]).fill(c);
      g.poly([-30, -30, 0, -16, 30, -30, 0, -44]).fill(shade(c, 1.15));
      break;
    case 'panel':
      wallRect(g, dir, 44, 36, c);
      g.circle(0, -18, 3).fill(shade(c, 1.6));
      break;
    case 'frame':
      wallRect(g, dir, 22, 17, 0x2a2118);
      wallRect(g, dir, 16, 11, c);
      break;
    case 'poster':
      wallRect(g, dir, 22, 30, c);
      g.circle(0, -15, 4).fill(0xf5e9c8);
      break;
    case 'mug':
      g.ellipse(0, 2, 6, 3).fill({ color: 0x000000, alpha: 0.28 });
      g.rect(-4, -9, 8, 9).fill(c);
      g.ellipse(0, -9, 4, 2).fill(shade(c, 0.6));
      g.circle(5, -5, 2.4).stroke({ width: 1.2, color: c });
      break;
    case 'keys':
      g.circle(0, -2, 3).stroke({ width: 1.4, color: c });
      g.rect(-1, 0, 2, 8).fill(c);
      g.rect(1, 5, 3, 1.6).fill(c);
      break;
    case 'reel':
      wallRect(g, dir, 22, 22, 0x1d1d22);
      g.circle(0, -11, 8).fill(c);
      g.circle(0, -11, 2.4).fill(0x1d1d22);
      break;
    case 'disc':
      g.circle(0, -10, 9).fill(c);
      g.circle(0, -10, 2.4).fill(0x3a2f12);
      break;
  }
  return g;
};

/** Containers positioned in iso space; the caller adds them to the room root with `zIndex = depth + y`. */
export const buildFurnishingRenderLayer = (items: FurnishingRenderItem[]): { id: string; y: number; container: Container }[] =>
  items.map((item) => {
    const p = iso(item.tile.x, item.tile.y);
    const container = new Container();
    container.eventMode = 'none';
    container.label = `equipped-furnishing:${item.itemId}`;
    container.addChild(draw(item));
    container.position.set(p.x, p.y - item.lift);
    return { id: item.itemId, y: p.y, container };
  });
