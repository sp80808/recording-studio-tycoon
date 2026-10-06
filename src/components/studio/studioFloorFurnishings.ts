// Extra floor furnishings for the Living Studio (in-house proprietary original, drawn in Pixi Graphics, no image files).
// A small catalogue of free-standing props gated by studio tier, plus the studio cat: a seeded
// animated resident that follows the studio clock (stretches in the morning, naps in the sun, watches
// the room in the evening, curls up at night).
//
// Pure data + builders only. WebGLCanvas places the container and calls `update` every frame.

import { Container, Graphics } from 'pixi.js';
import { iso } from './isoMath';
import type { DayPhase } from './studioDecorConfig';

export interface FurnishingDef {
  id: string;
  label: string;
  /** Tile coordinates of the item's ground origin. */
  x: number;
  y: number;
  /** Studio tier (1-5) at which the item appears. */
  minTier: number;
  build: (palette: FurnishingPalette) => Container;
}

export interface FurnishingPalette {
  /** Era accent used for small trim (amp grille cloth, bean bag, crate labels). */
  accent: number;
  /** Warm light colour used for lamp-ish details. */
  glow: number;
}

const shadow = (g: Graphics, rx: number, ry: number, alpha = 0.3) => {
  g.ellipse(0, 0, rx, ry).fill({ color: 0x000000, alpha });
};

/** Acoustic guitar leaning on a folding stand. */
const buildGuitarStand = (): Container => {
  const c = new Container();
  const g = new Graphics();
  shadow(g, 13, 5);
  // A-frame stand legs
  g.moveTo(-9, 1).lineTo(0, -12).stroke({ width: 1.6, color: 0x1d1d22 });
  g.moveTo(9, 1).lineTo(0, -12).stroke({ width: 1.6, color: 0x1d1d22 });
  // Guitar body (two lobes), neck, headstock
  g.ellipse(0, -17, 8.5, 6.5).fill(0xb9773a);
  g.ellipse(0, -26, 6.4, 5.2).fill(0xc88540);
  g.ellipse(0, -21.5, 3, 3).fill(0x2a1a10);
  g.rect(-1.2, -44, 2.4, 20).fill(0x5a3a22);
  g.roundRect(-2.4, -49, 4.8, 6, 1).fill(0x3a2616);
  // Strings
  g.moveTo(0, -43).lineTo(0, -16).stroke({ width: 0.5, color: 0xe8e0c8, alpha: 0.7 });
  c.addChild(g);
  return c;
};

/** Keyboard on an X-frame stand with a little glow on the display. */
const buildKeyboardStand = (p: FurnishingPalette): Container => {
  const c = new Container();
  const g = new Graphics();
  shadow(g, 17, 6);
  g.moveTo(-11, 2).lineTo(10, -18).stroke({ width: 1.6, color: 0x1d1d22 });
  g.moveTo(11, 2).lineTo(-10, -18).stroke({ width: 1.6, color: 0x1d1d22 });
  // Slab (iso parallelogram) + keys
  g.poly([-20, -22, 14, -29, 22, -24, -12, -17]).fill(0x24262e);
  g.poly([-20, -22, 14, -29, 14, -27, -20, -20]).fill(0x14151a);
  for (let i = 0; i < 9; i++) {
    const t = i / 9;
    const x = -17 + t * 32;
    const y = -22.2 - t * 5.4;
    g.poly([x, y, x + 2.6, y - 0.6, x + 4.4, y + 1.2, x + 1.8, y + 1.8]).fill(i % 3 === 1 ? 0x1b1b1f : 0xf1ecde);
  }
  g.circle(10, -26, 1.2).fill({ color: p.glow, alpha: 0.9 });
  c.addChild(g);
  return c;
};

/** Combo guitar amp with an accent grille cloth. */
const buildAmp = (p: FurnishingPalette): Container => {
  const c = new Container();
  const g = new Graphics();
  shadow(g, 15, 6);
  // Cabinet: right face, left face, top
  g.poly([0, -2, 13, -8, 13, -32, 0, -26]).fill(0x14151a);
  g.poly([0, -2, -13, -8, -13, -32, 0, -26]).fill(0x1d1f27);
  g.poly([0, -26, 13, -32, 0, -38, -13, -32]).fill(0x2a2c36);
  // Grille cloth
  g.poly([-2, -7, -11, -11.5, -11, -26, -2, -21.5]).fill(p.accent);
  g.poly([-2, -7, -11, -11.5, -11, -26, -2, -21.5]).fill({ color: 0x000000, alpha: 0.35 });
  for (let i = 0; i < 4; i++) g.moveTo(-3, -9 - i * 4).lineTo(-10, -12.8 - i * 4).stroke({ width: 0.5, color: 0x000000, alpha: 0.35 });
  // Knobs + pilot light
  for (let i = 0; i < 4; i++) g.circle(3 + i * 2.4, -30.5 - i * 1.2, 0.9).fill(0xe8e0c8);
  g.circle(11, -33.5, 0.8).fill(0xff5a3c);
  c.addChild(g);
  return c;
};

/** Milk crate of records with sleeve edges in era-friendly colours. */
const buildVinylCrate = (p: FurnishingPalette): Container => {
  const c = new Container();
  const g = new Graphics();
  shadow(g, 14, 5.5);
  const sleeves = [p.accent, 0xe8d8a8, 0xc9553d, 0x5aa9e6, 0xf2f2f2, 0x7bd389, 0xe08fa8];
  // Back sleeves poke out of the crate
  for (let i = 0; i < sleeves.length; i++) {
    g.poly([-9 + i * 2.4, -13, -7 + i * 2.4, -14, -7 + i * 2.4, -23 - (i % 3), -9 + i * 2.4, -22 - (i % 3)]).fill(sleeves[i]);
  }
  // Crate faces
  g.poly([0, -1, 12, -7, 12, -16, 0, -10]).fill(0x4a3a2a);
  g.poly([0, -1, -12, -7, -12, -16, 0, -10]).fill(0x5e4a36);
  g.poly([0, -10, 12, -16, 0, -22, -12, -16]).fill({ color: 0x000000, alpha: 0.28 });
  g.poly([-12, -16, 0, -22, 0, -20, -12, -14]).fill(0x6e5840);
  c.addChild(g);
  return c;
};

/** Floor bean bag in the era accent. */
const buildBeanBag = (p: FurnishingPalette): Container => {
  const c = new Container();
  const g = new Graphics();
  shadow(g, 17, 6.5);
  g.ellipse(0, -7, 15, 8.5).fill(p.accent);
  g.ellipse(0, -13, 11, 8.5).fill(p.accent);
  g.ellipse(0, -7, 15, 8.5).fill({ color: 0x000000, alpha: 0.28 });
  g.ellipse(0, -14, 10, 7.5).fill(p.accent);
  g.ellipse(-3, -17, 4.2, 2.3).fill({ color: 0xffffff, alpha: 0.18 });
  c.addChild(g);
  return c;
};

/** Heavy-duty floor cable run: a loose loop of snake cable and a tape strip. */
const buildCableRun = (): Container => {
  const c = new Container();
  const g = new Graphics();
  g.moveTo(-24, 6).bezierCurveTo(-12, 12, -4, -2, 6, 3).bezierCurveTo(14, 7, 20, 0, 28, 4).stroke({ width: 2.4, color: 0x14151a });
  g.moveTo(-24, 5.2).bezierCurveTo(-12, 11.2, -4, -2.8, 6, 2.2).bezierCurveTo(14, 6.2, 20, -0.8, 28, 3.2).stroke({ width: 0.7, color: 0x4a4d5a, alpha: 0.7 });
  g.poly([-6, -2, 2, -5, 3, -3, -5, 0]).fill({ color: 0xf2c14e, alpha: 0.75 });
  c.addChild(g);
  return c;
};

/** Flight-case style road trunk with latches. */
const buildRoadCase = (p: FurnishingPalette): Container => {
  const c = new Container();
  const g = new Graphics();
  shadow(g, 15, 6);
  g.poly([0, -1, 13, -7, 13, -22, 0, -16]).fill(0x20222b);
  g.poly([0, -1, -13, -7, -13, -22, 0, -16]).fill(0x2b2e3a);
  g.poly([0, -16, 13, -22, 0, -28, -13, -22]).fill(0x3a3e4d);
  // Corner caps + latch
  g.rect(-13, -9, 2, 2).fill(0xbdc3cf);
  g.rect(11, -9, 2, 2).fill(0xbdc3cf);
  g.roundRect(3.5, -15, 5, 3, 0.8).fill(0xbdc3cf);
  g.roundRect(-9, -13, 5, 3, 0.8).fill(0xbdc3cf);
  g.rect(-12.2, -22, 0.9, 12).fill({ color: p.accent, alpha: 0.8 });
  c.addChild(g);
  return c;
};

/**
 * Catalogue. Positions avoid the kit props (`studioKit.ts`), the console, the booth and the
 * door lane, so every tier can show every item it has unlocked without overlap.
 */
export const FURNISHINGS: FurnishingDef[] = [
  { id: 'cableRun', label: 'Snake cable run', x: 2.3, y: 5.4, minTier: 1, build: buildCableRun },
  { id: 'guitarStand', label: 'Guitar stand', x: 0.6, y: 2.4, minTier: 1, build: buildGuitarStand },
  { id: 'vinylCrate', label: 'Vinyl crate', x: 7.2, y: 4.45, minTier: 2, build: buildVinylCrate },
  { id: 'amp', label: 'Combo amp', x: 2.9, y: 6.7, minTier: 2, build: buildAmp },
  { id: 'beanBag', label: 'Bean bag', x: 4.05, y: 6.85, minTier: 3, build: buildBeanBag },
  { id: 'roadCase', label: 'Road case', x: 0.55, y: 2.9, minTier: 4, build: buildRoadCase },
  { id: 'keyboardStand', label: 'Keyboard stand', x: 4.9, y: 6.25, minTier: 5, build: buildKeyboardStand },
];

export const getFurnishings = (tier: number): FurnishingDef[] => FURNISHINGS.filter((f) => f.minTier <= tier);

/* ------------------------------------------------------------- studio cat */

export const CAT_COATS = [
  { id: 'ginger', body: 0xd9863f, belly: 0xf2c892, stripe: 0xb56a2c },
  { id: 'tabby', body: 0x8a8d96, belly: 0xc9ccd4, stripe: 0x5d606a },
  { id: 'black', body: 0x24252c, belly: 0x3a3c46, stripe: 0x1a1b20 },
  { id: 'tuxedo', body: 0x1d1e24, belly: 0xf2f2f2, stripe: 0x1d1e24 },
  { id: 'calico', body: 0xe8dcc4, belly: 0xf6efe0, stripe: 0xc9783a },
] as const;
export type CatCoat = (typeof CAT_COATS)[number];

/** Stable coat for a run seed (same seed -> same cat across rebuilds and reloads). */
export const pickCatCoat = (seed: string | number | undefined): CatCoat => {
  const s = String(seed ?? 'studio-cat');
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return CAT_COATS[(h >>> 0) % CAT_COATS.length];
};

export type CatMood = 'stretch' | 'nap' | 'watch' | 'curl';

/** Where the cat likes to be at each part of the day (tile coordinates). */
export const CAT_SPOTS: Record<DayPhase, { x: number; y: number; mood: CatMood }> = {
  morning: { x: 6.3, y: 2.7, mood: 'stretch' }, // under the window shaft
  day: { x: 5.8, y: 1.9, mood: 'nap' }, // sun patch on the rug
  evening: { x: 3.9, y: 6.2, mood: 'watch' }, // by the lounge, watching the session
  night: { x: 4.0, y: 5.95, mood: 'curl' }, // curled in the warm console glow
};

export interface StudioCat {
  container: Container;
  /** Advance the cat. `dt` is seconds since the last frame. */
  update: (dt: number, tSeconds: number, phase: DayPhase, reduceMotion: boolean) => void;
  /** Current ground position in tile coordinates (for depth sorting). */
  tile: () => { x: number; y: number };
}

const drawCat = (g: Graphics, coat: CatCoat, mood: CatMood, t: number, walking: boolean, facing: 1 | -1) => {
  g.clear();
  const breathe = Math.sin(t * 1.6) * 0.6;
  g.ellipse(0, 0, 11, 4).fill({ color: 0x000000, alpha: 0.28 });
  const tailFlick = Math.sin(t * (mood === 'watch' || walking ? 3.2 : 1.2)) * (mood === 'curl' ? 1.5 : 4);
  const sx = facing;
  if (mood === 'nap' || mood === 'curl') {
    // Loaf / curled ball
    g.ellipse(0, -5 - breathe * 0.4, 10, 6 + breathe * 0.3).fill(coat.body);
    g.ellipse(-2 * sx, -4, 7, 3.2).fill({ color: coat.stripe, alpha: 0.35 });
    // Head tucked at the front, ears
    g.circle(8 * sx, -5, 4.6).fill(coat.body);
    g.poly([5.6 * sx, -8, 6.6 * sx, -12.5, 8.8 * sx, -9]).fill(coat.body);
    g.poly([9.2 * sx, -9, 11.2 * sx, -12, 11.4 * sx, -7.6]).fill(coat.body);
    // Closed eyes
    g.moveTo(7 * sx, -5).lineTo(9 * sx, -5).stroke({ width: 0.8, color: 0x14151a });
    // Tail wraps the front
    g.moveTo(-9 * sx, -4).bezierCurveTo(-12 * sx, 1, 0, 3, 7 * sx, 1 + tailFlick * 0.1).stroke({ width: 2.6, color: coat.body, cap: 'round' });
    if (mood === 'nap') {
      // Floating z
      const zy = -16 - ((t * 5) % 8);
      g.moveTo(11 * sx, zy).lineTo(14 * sx, zy).lineTo(11 * sx, zy + 3).lineTo(14 * sx, zy + 3).stroke({ width: 0.8, color: 0xffffff, alpha: 0.6 - ((t * 5) % 8) / 16 });
    }
    return;
  }
  if (mood === 'stretch') {
    // Front-down stretch: low front, raised rump
    g.ellipse(-1 * sx, -8, 9, 4.6).fill(coat.body);
    g.ellipse(-1 * sx, -7, 6, 2.4).fill({ color: coat.stripe, alpha: 0.35 });
    g.poly([-9 * sx, -9, -13 * sx, -14, -10 * sx, -4]).fill(coat.body);
    g.circle(10 * sx, -3, 4.2).fill(coat.body);
    g.poly([8 * sx, -6, 9 * sx, -10, 11 * sx, -6.4]).fill(coat.body);
    g.poly([11.6 * sx, -6, 13.4 * sx, -9, 13.6 * sx, -4.8]).fill(coat.body);
    g.circle(11.6 * sx, -3.6, 0.7).fill(0xe8f27a);
    g.moveTo(-12 * sx, -13).lineTo(-15 * sx, -19 + tailFlick * 0.3).stroke({ width: 2.4, color: coat.body, cap: 'round' });
    return;
  }
  // 'watch': sitting upright, tail flicking
  g.ellipse(0, -7, 6.5, 8).fill(coat.body);
  g.ellipse(1 * sx, -6, 3.4, 5.4).fill(coat.belly);
  g.circle(2 * sx, -17, 5).fill(coat.body);
  g.poly([-1.6 * sx, -20, -0.8 * sx, -25.5, 2.2 * sx, -21]).fill(coat.body);
  g.poly([3.6 * sx, -21.4, 6.4 * sx, -25.5, 6.8 * sx, -19.8]).fill(coat.body);
  g.circle(3.6 * sx, -17.4, 0.9).fill(0xe8f27a);
  g.circle(0.4 * sx, -17.4, 0.9).fill(0xe8f27a);
  g.rect(3.2 * sx, -18.2, 0.8, 1.7).fill(0x14151a);
  g.moveTo(-6 * sx, -3).bezierCurveTo(-13 * sx, -3, -12 * sx, -13, -9 * sx + tailFlick, -15).stroke({ width: 2.4, color: coat.body, cap: 'round' });
};

/**
 * The studio cat. Walks between the phase spots at a stroll, then settles into the mood for that
 * phase. Under reduced motion it stays in its midday nap, still.
 */
export const buildStudioCat = (seed?: string | number): StudioCat => {
  const coat = pickCatCoat(seed);
  const container = new Container();
  container.eventMode = 'none';
  const g = new Graphics();
  container.addChild(g);

  let pos = { x: CAT_SPOTS.day.x, y: CAT_SPOTS.day.y };
  let target = { x: CAT_SPOTS.day.x, y: CAT_SPOTS.day.y };
  let mood: CatMood = CAT_SPOTS.day.mood;
  let walking = false;
  let facing: 1 | -1 = 1;
  let lastPhase: DayPhase | null = null;
  const WALK_SPEED = 0.55; // tiles per second

  const place = () => {
    const p = iso(pos.x, pos.y);
    container.position.set(p.x, p.y);
  };
  place();

  return {
    container,
    tile: () => ({ x: pos.x, y: pos.y }),
    update: (dt, t, phase, reduceMotion) => {
      if (reduceMotion) {
        pos = { x: CAT_SPOTS.day.x, y: CAT_SPOTS.day.y };
        mood = 'nap';
        walking = false;
        place();
        drawCat(g, coat, 'nap', 0, false, facing);
        return;
      }
      if (phase !== lastPhase) {
        const first = lastPhase === null;
        lastPhase = phase;
        target = { x: CAT_SPOTS[phase].x, y: CAT_SPOTS[phase].y };
        // First frame after a (re)build: already be where the clock says, no cross-room commute.
        if (first) pos = { ...target };
      }
      const dx = target.x - pos.x;
      const dy = target.y - pos.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0.04) {
        const step = Math.min(dist, WALK_SPEED * Math.max(0, Math.min(dt, 0.1)));
        pos.x += (dx / dist) * step;
        pos.y += (dy / dist) * step;
        walking = true;
        // Screen-space x of motion decides which way the cat looks.
        facing = dx - dy >= 0 ? 1 : -1;
        mood = 'watch';
      } else {
        walking = false;
        mood = CAT_SPOTS[phase].mood;
      }
      place();
      // Walking bob so the stroll reads even with the static pose.
      container.y += walking ? -Math.abs(Math.sin(t * 9)) * 1.2 : 0;
      drawCat(g, coat, mood, t, walking, facing);
    },
  };
};

export interface FurnishingLayer {
  items: { def: FurnishingDef; container: Container }[];
  cat: StudioCat;
}

/** Build every unlocked furnishing plus the cat. Caller adds containers to the scene and sets zIndex. */
export const buildFurnishingLayer = (tier: number, palette: FurnishingPalette, seed?: string | number): FurnishingLayer => {
  const items = getFurnishings(tier).map((def) => {
    const container = def.build(palette);
    container.eventMode = 'none';
    const p = iso(def.x, def.y);
    container.position.set(p.x, p.y);
    container.label = `floor-prop:${def.id}`;
    return { def, container };
  });
  return { items, cat: buildStudioCat(seed) };
};
