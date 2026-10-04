/**
 * Studio decor renderer (Pixi). Draws the room's dressing — plank floor, slab,
 * wainscot, diffusers, album-cover wall, era signature props — plus an additive
 * lighting layer with a window shaft, dust motes, lamp pools, candle flicker,
 * and a candle-table mug that steams after espresso is brewed.
 *
 * All decisions (which covers, which era prop, plank/mote layout) come from
 * studioDecorConfig.ts so this file only draws. Every animated element honours
 * `reduceMotion` by freezing to a pleasant static pose.
 */
import { Container, Graphics, Matrix, Sprite, Texture } from 'pixi.js';
import { getPropTexture } from '@/components/studio/propSprites';
import { getStudioTexture } from '@/components/studio/studioSprites';
import {
  candleFlicker,
  clockRimGlowAlpha,
  coffeeSteamStrength,
} from '@/components/studio/studioFloorLife';
import {
  ROOM_D,
  ROOM_W,
  WALL_H,
  iso,
  isoQuad,
  leftWallPt,
  leftWallQuad,
  rightWallPt,
  rightWallQuad,
} from './isoMath';
import {
  advanceMote,
  getDaynessFromClockMinutes,
  getEraLightingKit,
  getInteriorLightBoost,
  getMoteSeeds,
  getPlankLayout,
  getTrophyWall,
  REDUCED_MOTION_DAYNESS,
  type AlbumCoverEntry,
  type DayPhase,
  type EraDecorSpec,
  type EraLightingKit,
  type TrophyInput,
} from './studioDecorConfig';

const WALL_TRIM = 0x1d2433;
const BRASS = 0xe6b866;

/* --------------------------------------------------------------- helpers */

/** Soft radial glow faked with stacked ellipses (use in an additive layer).
 * Uses many thin steps with a smooth cosine falloff so no concentric ring edges read.
 * Total integrated alpha stays ≈ `alpha`; outer steps fade to ~0 instead of a hard rim. */
const radialGlow = (
  g: Graphics,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: number,
  alpha: number,
  steps = 16,
) => {
  const n = Math.max(10, Math.floor(steps));
  // Cosine weights sum-normalised so callers' alpha semantics are preserved.
  let wSum = 0;
  const weights: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1); // 0 outer → 1 centre
    const w = 0.5 - 0.5 * Math.cos(t * Math.PI);
    weights.push(w);
    wSum += w;
  }
  const scale = wSum > 0 ? alpha / wSum : 0;
  for (let i = 0; i < n; i++) {
    const k = 1 - i / n;
    g.ellipse(x, y, Math.max(0.5, rx * k), Math.max(0.5, ry * k)).fill({ color, alpha: weights[i] * scale });
  }
};

/* ---------------------------------------------------- album cover textures */

type CoverPalette = { a: string; b: string; accent: string };

const genrePalette = (genre?: string): CoverPalette => {
  const g = (genre || '').toLowerCase();
  if (/rock|metal|punk/.test(g)) return { a: '#1c0a0a', b: '#7f1d1d', accent: '#fb923c' };
  if (/electronic|techno|synth|edm/.test(g)) return { a: '#0c1222', b: '#4c1d95', accent: '#22d3ee' };
  if (/hip.?hop|rap|trap/.test(g)) return { a: '#0a0a0a', b: '#78350f', accent: '#fbbf24' };
  if (/jazz|blues/.test(g)) return { a: '#0b1226', b: '#1e3a8a', accent: '#fcd34d' };
  if (/acoustic|folk|country/.test(g)) return { a: '#0f1a12', b: '#365314', accent: '#6ee7b7' };
  return { a: '#1e1033', b: '#4c1d95', accent: '#f9a8d4' };
};

const coverTextureCache = new Map<string, Texture>();

/** Procedural sleeve art (mirrors AlbumCoverArt genre themes) for the booth wall. */
const getAlbumCoverTexture = (cover: AlbumCoverEntry): Texture => {
  const key = `${cover.projectId}|${cover.title}|${cover.genre ?? ''}|${cover.score}`;
  const hit = coverTextureCache.get(key);
  if (hit) return hit;

  const size = 96;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    const empty = Texture.EMPTY;
    coverTextureCache.set(key, empty);
    return empty;
  }

  const pal = genrePalette(cover.genre);
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, pal.a);
  grad.addColorStop(1, pal.b);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  ctx.beginPath();
  ctx.arc(size * 0.55, size * 0.42, 28, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(size * 0.55, size * 0.42, 10, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fill();

  ctx.fillStyle = pal.accent;
  ctx.globalAlpha = 0.85;
  ctx.fillRect(6, size - 22, size - 12, 3);
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText((cover.title || 'Session').slice(0, 14), 7, size - 8);

  if (cover.score >= 80) {
    ctx.fillStyle = cover.score >= 90 ? 'rgba(226,232,240,0.92)' : 'rgba(230,184,102,0.92)';
    ctx.fillRect(size - 28, 6, 22, 12);
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 8px system-ui, sans-serif';
    ctx.fillText(String(Math.round(cover.score)), size - 24, 15);
  }

  const tex = Texture.from(canvas);
  coverTextureCache.set(key, tex);
  return tex;
};

/* ----------------------------------------------------------- room shell */

/** Floor slab (visible front thickness) + a soft ground shadow so the room reads as a diorama. */
export const buildRoomShell = (): Container => {
  const shell = new Container();
  const slab = new Graphics();
  const thick = 12;
  const L = iso(0, ROOM_D);
  const B = iso(ROOM_W, ROOM_D);
  const R = iso(ROOM_W, 0);

  // Ground shadow (a few soft ellipses beneath the whole room)
  const cx = (L.x + R.x) / 2;
  const cy = B.y + thick - 22;
  for (let i = 0; i < 6; i++) {
    const k = 1 - i * 0.12;
    slab.ellipse(cx, cy, 250 * k, 92 * k).fill({ color: 0x000000, alpha: 0.10 });
  }
  // Front-left face
  slab.poly([L.x, L.y, B.x, B.y, B.x, B.y + thick, L.x, L.y + thick]).fill(0x3a281b);
  // Front-right face (in shade)
  slab.poly([B.x, B.y, R.x, R.y, R.x, R.y + thick, B.x, B.y + thick]).fill(0x2a1c13);
  // Brass edge line on the slab lip
  slab.poly([L.x, L.y, B.x, B.y, R.x, R.y]).stroke({ width: 1.5, color: BRASS, alpha: 0.5 });
  shell.addChild(slab);
  return shell;
};

/* ---------------------------------------------------------------- floor */

export const buildPlankFloor = (spec: EraDecorSpec, seed: string | number): Graphics => {
  const g = new Graphics();
  const planks = getPlankLayout(seed, ROOM_W, ROOM_D);
  for (const p of planks) {
    isoQuad(g, p.x0, p.y0, p.x1, p.y1);
    g.fill(spec.planks[p.tone]);
    isoQuad(g, p.x0, p.y0, p.x1, p.y1);
    g.stroke({ width: 0.8, color: 0x000000, alpha: 0.32 });
  }
  // Fine highlight along the back edge of each board
  for (const p of planks) {
    const a = iso(p.x0, p.y0);
    const b = iso(p.x1, p.y0);
    g.moveTo(a.x, a.y + 0.6).lineTo(b.x, b.y + 0.6).stroke({ width: 0.6, color: 0xffe6b8, alpha: 0.07 });
  }
  return g;
};

/** A patterned rug: dark field, gold border, inner medallion. Replaces the flat two-tone rug. */
/** Bottom-centre anchored prop sprite, sized to `height` world px. `anchorY` is the feet row as a fraction of the texture. */
const addPropSprite = (parent: Container, tex: Texture, x: number, y: number, anchorYFromBottom: number, height: number) => {
  const sp = new Sprite(tex);
  sp.anchor.set(0.5, 1 - anchorYFromBottom);
  sp.scale.set(height / tex.height);
  sp.position.set(x, y);
  parent.addChild(sp);
};

export const buildRug = (): Graphics => {
  const g = new Graphics();
  const rugTex = getPropTexture('rug');
  if (rugTex) {
    // Flat rug art sheared onto the floor plane: u along iso x (3..6), v along iso y (3.5..5).
    const o = iso(3, 3.5);
    const ux = iso(6, 3.5);
    const vy = iso(3, 5);
    const rug = new Sprite(rugTex);
    rug.setFromMatrix(new Matrix(
      (ux.x - o.x) / rugTex.width, (ux.y - o.y) / rugTex.width,
      (vy.x - o.x) / rugTex.height, (vy.y - o.y) / rugTex.height,
      o.x, o.y,
    ));
    g.addChild(rug);
    return g;
  }
  isoQuad(g, 3, 3.5, 6, 5);
  g.fill(0x6e2c2c);
  isoQuad(g, 3.08, 3.58, 5.92, 4.92);
  g.stroke({ width: 1.4, color: BRASS, alpha: 0.7 });
  isoQuad(g, 3.2, 3.7, 5.8, 4.8);
  g.fill(0x86393a);
  isoQuad(g, 3.2, 3.7, 5.8, 4.8);
  g.stroke({ width: 0.8, color: 0xf0c9a0, alpha: 0.45 });
  // Diamond medallion
  const c = iso(4.5, 4.25);
  g.poly([c.x, c.y - 9, c.x + 26, c.y, c.x, c.y + 9, c.x - 26, c.y]).fill({ color: 0xb85b4a, alpha: 0.55 });
  g.poly([c.x, c.y - 9, c.x + 26, c.y, c.x, c.y + 9, c.x - 26, c.y]).stroke({ width: 0.8, color: 0xf0c9a0, alpha: 0.5 });
  // Fringe
  for (let i = 0; i < 12; i++) {
    const t = i / 11;
    const a = iso(3 + t * 3, 5);
    g.moveTo(a.x, a.y).lineTo(a.x - 1, a.y + 3).stroke({ width: 0.8, color: 0xe8d3a8, alpha: 0.5 });
  }
  return g;
};

/* --------------------------------------------------------- wall dressing */

export interface WallDressing {
  /** Wall-mounted dressing: draw right after the walls (behind the floor). */
  container: Container;
  /** Free-standing era props (lamps, ring light): must be added AFTER the floor or it paints over their bases. */
  props: Container;
}

export const buildWallDressing = (
  spec: EraDecorSpec,
  trophies: TrophyInput,
  tier: number,
): WallDressing => {
  const container = new Container();
  const g = new Graphics();

  // Wainscot band + chair rail + baseboard, both walls
  const wains: Array<[number[], number[], number[], number[]]> = [
    [rightWallQuad(0, ROOM_W, 0, 38), rightWallQuad(0, ROOM_W, 38, 42), rightWallQuad(0, ROOM_W, 0, 6), rightWallQuad(0, ROOM_W, WALL_H - 7, WALL_H)],
    [leftWallQuad(0, ROOM_D, 0, 38), leftWallQuad(0, ROOM_D, 38, 42), leftWallQuad(0, ROOM_D, 0, 6), leftWallQuad(0, ROOM_D, WALL_H - 7, WALL_H)],
  ];
  for (const [band, rail, base, crown] of wains) {
    g.poly(band).fill({ color: spec.wainscot, alpha: 0.94 });
    g.poly(rail).fill({ color: BRASS, alpha: 0.55 });
    g.poly(base).fill({ color: 0x140e0a, alpha: 0.85 });
    g.poly(crown).fill({ color: 0xffffff, alpha: 0.06 });
  }
  // Top-light wash: three stacked bands make each wall glow softly toward the ceiling line
  for (let i = 0; i < 3; i++) {
    const lift0 = 42 + i * 26;
    g.poly(rightWallQuad(0, ROOM_W, lift0, WALL_H)).fill({ color: 0xffe2b0, alpha: 0.018 });
    g.poly(leftWallQuad(0, ROOM_D, lift0, WALL_H)).fill({ color: 0xffe2b0, alpha: 0.012 });
  }
  // Wainscot panel seams (one per tile)
  for (let i = 1; i < ROOM_W; i++) {
    const a = rightWallPt(i, 8);
    const b = rightWallPt(i, 36);
    g.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ width: 1, color: 0x000000, alpha: 0.28 });
  }
  for (let i = 1; i < ROOM_D; i++) {
    const a = leftWallPt(i, 8);
    const b = leftWallPt(i, 36);
    g.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ width: 1, color: 0x000000, alpha: 0.28 });
  }

  // Slatted wooden diffusers (skip the left-wall slot for the neon-sign era)
  const diffuser = (quadFn: (a: number, b: number, l0: number, l1: number) => number[], at: (n: number, l: number) => { x: number; y: number }, from: number, to: number) => {
    g.poly(quadFn(from, to, 46, 108)).fill({ color: 0x241810, alpha: 0.92 });
    const slats = 7;
    for (let i = 0; i < slats; i++) {
      const t0 = from + ((to - from) * (i + 0.12)) / slats;
      const t1 = from + ((to - from) * (i + 0.78)) / slats;
      g.poly(quadFn(t0, t1, 50, 104)).fill({ color: i % 2 ? 0x8a6543 : 0x9c7550, alpha: 0.95 });
    }
    const a = at(from, 46);
    const b = at(to, 46);
    g.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ width: 1, color: 0x000000, alpha: 0.4 });
  };
  diffuser(rightWallQuad, rightWallPt, 7.1, 7.85);
  if (spec.prop !== 'neon-sign') diffuser(leftWallQuad, leftWallPt, 0.35, 1.3);

  // Album-cover wall above the booth (completed projects — never stars)
  const coverSprites: Sprite[] = [];
  const slots = getTrophyWall(trophies);
  for (const slot of slots) {
    const x0 = slot.x - 0.24;
    const x1 = slot.x + 0.24;
    const frame = rightWallQuad(x0, x1, 94, 126);
    if (slot.kind === 'empty' || !slot.cover) {
      // Subtle empty hanger — brass nail + faint frame, no star plaque
      g.poly(frame).stroke({ width: 1, color: BRASS, alpha: 0.16 });
      const nail = rightWallPt(slot.x, 132);
      g.circle(nail.x, nail.y, 1.1).fill({ color: BRASS, alpha: 0.3 });
      continue;
    }
    g.poly(frame).fill(0x1a1410);
    g.poly(frame).stroke({ width: 1.4, color: BRASS, alpha: 0.75 });
    const coverTex = getAlbumCoverTexture(slot.cover);
    if (coverTex && coverTex !== Texture.EMPTY) {
      const inset = 0.03;
      const tl = rightWallPt(x0 + inset, 124);
      const tr = rightWallPt(x1 - inset, 124);
      const bl = rightWallPt(x0 + inset, 96);
      const sleeve = new Sprite(coverTex);
      sleeve.setFromMatrix(new Matrix(
        (tr.x - tl.x) / coverTex.width, (tr.y - tl.y) / coverTex.width,
        (bl.x - tl.x) / coverTex.height, (bl.y - tl.y) / coverTex.height,
        tl.x, tl.y,
      ));
      coverSprites.push(sleeve);
    }
  }
  container.addChild(g);
  for (const sp of coverSprites) container.addChild(sp);

  // Era signature prop (physical parts)
  const propG = new Graphics();
  const prop = propG;
  if (spec.prop === 'brass-lamp') {
    const b = iso(7.55, 2.3);
    const lampTex = getPropTexture('brassLamp');
    if (lampTex) {
      addPropSprite(prop, lampTex, b.x, b.y + 2, 28 / 98, 86);
    } else {
      prop.ellipse(b.x, b.y, 9, 4).fill(0x2a1c10);
      prop.rect(b.x - 1.2, b.y - 58, 2.4, 58).fill(0xc9974a);
      prop.poly([b.x - 13, b.y - 60, b.x + 13, b.y - 60, b.x + 8, b.y - 76, b.x - 8, b.y - 76]).fill(0xf0cf95);
      prop.poly([b.x - 13, b.y - 60, b.x + 13, b.y - 60, b.x + 8, b.y - 76, b.x - 8, b.y - 76]).stroke({ width: 1, color: 0x8a6531 });
    }
  } else if (spec.prop === 'lava-lamp') {
    const t = iso(7.45, 1.1);
    const lavaTex = getPropTexture('lavaLamp');
    if (lavaTex) {
      addPropSprite(prop, lavaTex, t.x, t.y, 24 / 99, 62);
    } else {
      prop.poly([t.x - 15, t.y - 20, t.x + 15, t.y - 20, t.x + 15, t.y - 12, t.x - 15, t.y - 12]).fill(0x2c2a27);
      prop.rect(t.x - 12, t.y - 12, 3, 12).fill(0x1c1a18);
      prop.rect(t.x + 9, t.y - 12, 3, 12).fill(0x1c1a18);
      prop.roundRect(t.x - 5, t.y - 52, 10, 32, 4).fill({ color: 0xff7a45, alpha: 0.22 });
      prop.roundRect(t.x - 5, t.y - 52, 10, 32, 4).stroke({ width: 1, color: 0xffb08a, alpha: 0.8 });
      prop.rect(t.x - 6, t.y - 22, 12, 4).fill(0x8d8478);
      prop.rect(t.x - 4, t.y - 56, 8, 4).fill(0x8d8478);
    }
  } else if (spec.prop === 'neon-sign') {
    // Backing plate for the neon bolt on the left wall
    g.poly(leftWallQuad(0.25, 1.2, 76, 122)).fill({ color: 0x0d0a12, alpha: 0.95 });
    g.poly(leftWallQuad(0.25, 1.2, 76, 122)).stroke({ width: 1.2, color: 0x2a2233 });
  } else if (spec.prop === 'led-strip') {
    // Ring light on a stand, front-right corner of the window side
    const s = iso(7.3, 1.6);
    const ringTex = getPropTexture('ringLight');
    if (ringTex) {
      addPropSprite(prop, ringTex, s.x, s.y + 2, 36 / 113, 88);
    } else {
      prop.ellipse(s.x, s.y, 8, 3.5).fill(0x1a1a1f);
      prop.rect(s.x - 1, s.y - 64, 2, 64).fill(0x2c2c34);
    }
  }
  void tier;
  return { container, props: prop as unknown as Container };
};

/* ------------------------------------------------------------- desk props */

/** Notepad on the console's left edge. Drawn over the desk. (Mug lives on the candle table after brew.) */
export const buildDeskProps = (deskH = 40): Container => {
  const c = new Container();
  const g = new Graphics();
  const dPt = (gx: number, gy: number, lift = deskH) => {
    const p = iso(gx, gy);
    return { x: p.x, y: p.y - lift };
  };
  const padTex = getPropTexture('notepad');
  // Notepad
  const n1 = dPt(3.34, 4.62);
  const n2 = dPt(3.62, 4.62);
  const n3 = dPt(3.62, 4.8);
  const n4 = dPt(3.34, 4.8);
  if (padTex) {
    // Flat art sheared onto the desk plane (u along iso x, v along iso y).
    const pad = new Sprite(padTex);
    pad.setFromMatrix(new Matrix(
      (n2.x - n1.x) / padTex.width, (n2.y - n1.y) / padTex.width,
      (n4.x - n1.x) / padTex.height, (n4.y - n1.y) / padTex.height,
      n1.x, n1.y,
    ));
    c.addChild(pad);
  } else {
    g.poly([n1.x, n1.y, n2.x, n2.y, n3.x, n3.y, n4.x, n4.y]).fill(0xf0e6cf);
    g.poly([n1.x, n1.y, n2.x, n2.y, n3.x, n3.y, n4.x, n4.y]).stroke({ width: 0.6, color: 0x8a7a5a, alpha: 0.7 });
    g.moveTo(n1.x + 3, n1.y + 1.5).lineTo(n2.x - 2, n2.y + 1.5).stroke({ width: 0.6, color: 0x6b7a99, alpha: 0.6 });
  }
  c.addChildAt(g, 0);
  return c;
};

/* ---------------------------------------------------------- candle table */

/** Iso tile under the brass candle table (listening-side rug edge). */
export const CANDLE_TABLE_TILE = { x: 6.55, y: 5.35 } as const;

/** World-space flame tip used by the additive candle glow (must match `buildCandleTable`). */
export const CANDLE_FLAME_POS = (() => {
  const p = iso(CANDLE_TABLE_TILE.x, CANDLE_TABLE_TILE.y);
  return { x: p.x, y: p.y - 28 };
})();

/**
 * Mug rim on the candle table (beside the candlestick, toward camera).
 * Steam / settle animation must target this — never the desk or window sill.
 */
export const CANDLE_MUG_POS = (() => {
  const p = iso(CANDLE_TABLE_TILE.x + 0.22, CANDLE_TABLE_TILE.y + 0.14);
  return { x: p.x + 1, y: p.y - 12 };
})();

/**
 * Small brass side-table + candle near the front-right rug edge.
 * Presentation only — not a hotspot (hit targets stay on shelf / console / door).
 */
export const buildCandleTable = (): Container => {
  const c = new Container();
  c.eventMode = 'none';
  const g = new Graphics();
  const base = iso(CANDLE_TABLE_TILE.x, CANDLE_TABLE_TILE.y);
  // Round table top (iso squash)
  g.ellipse(base.x, base.y, 14, 6).fill({ color: 0x000000, alpha: 0.28 });
  g.ellipse(base.x, base.y - 2, 13, 5.5).fill(0x3a2a1c);
  g.ellipse(base.x, base.y - 2, 13, 5.5).stroke({ width: 1, color: BRASS, alpha: 0.55 });
  g.rect(base.x - 1.4, base.y - 2, 2.8, 10).fill(0x2a1c12);
  // Brass candlestick + cream candle
  g.ellipse(base.x, base.y - 12, 3.2, 1.4).fill(0xc9974a);
  g.rect(base.x - 1.1, base.y - 24, 2.2, 12).fill(0xf3ead6);
  g.ellipse(base.x, base.y - 24, 1.1, 0.6).fill(0xe8dcc4);
  // Static wick tip (flame glow lives in the additive layer)
  g.circle(base.x, base.y - 26.5, 1.1).fill(0xffc266);
  c.addChild(g);
  c.zIndex = base.y;
  return c;
};

/**
 * Espresso mug for the candle table. Starts hidden — floor shows it only after
 * `brew_espresso` completes (cleared when daily chores refresh).
 */
export const buildCandleDrink = (): Container => {
  const c = new Container();
  c.eventMode = 'none';
  const g = new Graphics();
  const m = CANDLE_MUG_POS;
  const mugTex = getPropTexture('mug');
  if (mugTex) {
    const mug = new Sprite(mugTex);
    mug.anchor.set(22 / 48, 41 / 48);
    mug.scale.set(16 / mugTex.height * 1.05);
    mug.position.set(m.x, m.y + 3);
    c.addChild(mug);
  } else {
    g.ellipse(m.x, m.y + 2, 5.5, 2.2).fill({ color: 0x000000, alpha: 0.28 });
    g.rect(m.x - 4.5, m.y - 6, 9, 8).fill(0xe8e2d4);
    g.ellipse(m.x, m.y + 2, 4.5, 1.9).fill(0xe8e2d4);
    g.ellipse(m.x, m.y - 6, 4.5, 1.9).fill(0x3a1f12);
    g.ellipse(m.x, m.y - 6, 4.5, 1.9).stroke({ width: 0.8, color: 0xffffff, alpha: 0.6 });
    g.roundRect(m.x + 3.5, m.y - 4.5, 3, 4.5, 1.4).stroke({ width: 1.1, color: 0xe8e2d4 });
    c.addChild(g);
  }
  c.visible = false;
  c.alpha = 0;
  c.zIndex = iso(CANDLE_TABLE_TILE.x, CANDLE_TABLE_TILE.y).y + 1;
  return c;
};

/** Settle-in duration (seconds) when the brew mug first appears on the candle table. */
export const CANDLE_DRINK_SETTLE_SEC = 0.45;

/** World-space beer bottle feet on the candle table (opposite the brew mug). */
export const CANDLE_BEER_POS = (() => {
  const p = iso(CANDLE_TABLE_TILE.x - 0.28, CANDLE_TABLE_TILE.y + 0.1);
  return { x: p.x - 2, y: p.y - 6 };
})();

/**
 * Rider beers for the candle table. Starts hidden — floor shows them when an
 * active session's rider asks for drinks (coffee remains brew-gated via `buildCandleDrink`).
 */
export const buildCandleBeers = (): Container => {
  const c = new Container();
  c.eventMode = 'none';
  const g = new Graphics();
  const drawBottle = (ox: number, oy: number) => {
    g.ellipse(ox, oy + 1, 3.2, 1.3).fill({ color: 0x000000, alpha: 0.25 });
    g.rect(ox - 2.2, oy - 10, 4.4, 11).fill(0x8a5a22);
    g.rect(ox - 1.2, oy - 14, 2.4, 4).fill(0x6e4818);
    g.ellipse(ox, oy - 14, 1.2, 0.7).fill(0xd9c48a);
    g.rect(ox - 2.0, oy - 6, 4.0, 2.2).fill(0xc9a227);
  };
  const m = CANDLE_BEER_POS;
  drawBottle(m.x, m.y);
  drawBottle(m.x + 5, m.y + 1);
  c.addChild(g);
  c.visible = false;
  c.alpha = 0;
  c.zIndex = iso(CANDLE_TABLE_TILE.x, CANDLE_TABLE_TILE.y).y + 1;
  return c;
};

/* --------------------------------------------------------------- lighting */

export interface DecorLightsInput {
  spec: EraDecorSpec;
  /** Optional override; defaults to `getEraLightingKit(spec.eraId)`. */
  kit?: EraLightingKit;
  /** Studio tier 1–5 — unlocks data-driven neon practicals. */
  tier?: number;
}

export interface DecorLightsAmbient {
  /** 0 = night, 1 = full daylight — from the studio clock (see studioDecorConfig). */
  dayness: number;
  /** Day phase for clock rim / candle mood (optional). */
  dayPhase?: DayPhase;
  /** True after `brew_espresso` completes — mug steam + heat shimmer. */
  coffeeSteaming?: boolean;
}

export interface DecorLights {
  /** Floor-clipped spill, inserted above the floor and below props/figures. */
  floorContainer: Container;
  container: Container;
  kit: EraLightingKit;
  /**
   * `live` = a session is being recorded right now (lights the ON AIR lamp).
   * Pass `ambient.dayness` from the shared clock so shaft/motes match the wall hands + window.
   */
  update: (tSeconds: number, reduceMotion: boolean, live?: boolean, ambient?: DecorLightsAmbient) => void;
}

export const buildDecorLights = (input: DecorLightsInput): DecorLights => {
  const { spec } = input;
  const kit = input.kit ?? getEraLightingKit(spec.eraId);
  const tier = Math.max(1, Math.min(5, Math.floor(input.tier ?? 1)));
  const glowScale = kit.propGlowScale;
  const container = new Container();
  container.eventMode = 'none';
  container.blendMode = 'add';
  const floorContainer = new Container();
  floorContainer.eventMode = 'none';
  floorContainer.blendMode = 'add';
  const floorContent = new Container();
  const floorMask = new Graphics();
  isoQuad(floorMask, 0, 0, ROOM_W, ROOM_D);
  floorMask.fill(0xffffff);
  floorContent.mask = floorMask;
  floorContainer.addChild(floorMask, floorContent);

  /* Window light: one coherent source from the glazing to a soft floor footprint. */
  const shaft = new Container();
  const shaftG = new Graphics();
  const floorShaftG = new Graphics();
  const winA = rightWallPt(5.1, 96);
  const winB = rightWallPt(6.9, 96);
  const winC = rightWallPt(6.9, 34);
  const winD = rightWallPt(5.1, 34);
  const f0 = iso(4.15, 3.7);
  const f1 = iso(5.95, 3.9);
  const f2 = iso(6.9, 0.2);
  const f3 = iso(5.1, 0.2);
  // A restrained airborne wash joins the lower window edge to the floor. Keeping
  // this below the floor spill prevents a bright wall-to-floor banner.
  shaftG
    .poly([winA.x, winA.y, winB.x, winB.y, f1.x, f1.y, f0.x, f0.y])
    .fill({ color: spec.daylight, alpha: kit.shaftAirAlpha });
  // Nested isometric footprints distribute the configured alpha across a soft
  // falloff instead of stacking five near-opaque copies with a hard outer rim.
  const footprint = [f0, f1, f2, f3];
  const center = footprint.reduce((p, q) => ({ x: p.x + q.x / 4, y: p.y + q.y / 4 }), { x: 0, y: 0 });
  for (let i = 0; i < 7; i++) {
    const inset = i / 18;
    const layer = footprint.map((p) => ({
      x: p.x + (center.x - p.x) * inset,
      y: p.y + (center.y - p.y) * inset,
    }));
    floorShaftG.poly(layer.flatMap((p) => [p.x, p.y])).fill({
      color: spec.daylight,
      alpha: kit.shaftFloorAlpha * (0.035 + i * 0.012),
    });
  }
  shaft.addChild(shaftG);
  container.addChild(shaft);
  floorContent.addChild(floorShaftG);

  /* Dust motes drifting through the beam */
  const motes = getMoteSeeds(kit.moteCount, spec.eraId);
  const moteG = new Graphics();
  container.addChild(moteG);
  const beamPoint = (u: number, v: number) => {
    // v across the beam (winA→winB), u down the beam (window → floor)
    const topX = winA.x + (winB.x - winA.x) * v;
    const topY = winA.y + (winB.y - winA.y) * v;
    const botX = f0.x + (f1.x - f0.x) * v;
    const botY = f0.y + (f1.y - f0.y) * v;
    return { x: topX + (botX - topX) * u, y: topY + (botY - topY) * u };
  };

  /* Lamp pools (warm glow on the floor around the console + rug) — kit colours.
   * Both pools sit on the floor plane (like the contact shadow at deskFoot.y + 3);
   * a lifted centre would read as a detached halo floating above the boards. */
  const pools = new Graphics();
  const rug = iso(4.5, 4.25);
  radialGlow(pools, rug.x, rug.y + 3, kit.rugPool.rx, kit.rugPool.ry, kit.rugPool.color, kit.rugPool.alpha);
  const desk = iso(4.5, 4.05);
  radialGlow(pools, desk.x, desk.y + 3, kit.deskPool.rx, kit.deskPool.ry, kit.deskPool.color, kit.deskPool.alpha);
  floorContent.addChild(pools);

  /* Era signature glows */
  const glowG = new Graphics();
  container.addChild(glowG);
  const practicalFloorG = new Graphics();
  floorContent.addChild(practicalFloorG);

  /* Tier neon strip behind the live-room glass (data-driven; was hard-coded in WebGLCanvas). */
  const tierNeon = new Graphics();
  container.addChild(tierNeon);

  /* ON AIR lamp above the studio door */
  const onAir = new Graphics();
  container.addChild(onAir);
  const airPos = BOOTH_HEADER_LAMP;

  /* Candle flame + pool (physical prop is `buildCandleTable`) */
  const candleG = new Graphics();
  container.addChild(candleG);
  const candlePos = CANDLE_FLAME_POS;

  /* Mug steam — candle-table drink only (desk / sill never steam) */
  const steam = new Graphics();
  container.addChild(steam);
  const mugPos = CANDLE_MUG_POS;

  /* Clock rim glow — additive halo so the wall face reads after dark. */
  const clockGlowG = new Graphics();
  container.addChild(clockGlowG);
  const clockAnchor = iso(0, 2.0);
  const clockFace = { x: clockAnchor.x, y: clockAnchor.y - 92 };

  const neonQuad = (u: number, v: number) => {
    const p = leftWallPt(0.25 + u * (1.2 - 0.25), 76 + v * (122 - 76));
    return p;
  };
  // Lightning bolt in (u,v) unit space
  const bolt: Array<[number, number]> = [
    [0.55, 0.92], [0.3, 0.5], [0.48, 0.5], [0.35, 0.1], [0.72, 0.58], [0.53, 0.58], [0.66, 0.92],
  ];

  const update = (t: number, reduce: boolean, live = false, ambient?: DecorLightsAmbient) => {
    const day = reduce
      ? REDUCED_MOTION_DAYNESS
      : (ambient?.dayness ?? getDaynessFromClockMinutes(0));
    const interiorBoost = getInteriorLightBoost(day);
    shaft.alpha = 0.18 + 0.82 * day;
    // Live sessions warm the desk/rug pools; night boosts practicals when the window dims
    pools.alpha = (live ? 1.12 : 1.0) * interiorBoost;

    // Motes
    moteG.clear();
    if (!reduce) {
      for (const m of motes) {
        const s = advanceMote(m, t);
        const p = beamPoint(s.u, s.v);
        moteG.circle(p.x, p.y, m.size).fill({
          color: spec.daylight,
          alpha: kit.moteBaseAlpha * s.alpha * (0.4 + 0.6 * day),
        });
      }
    } else {
      // Static motes retain depth without turning reduced-motion mode into a
      // frozen field of bright particles.
      for (const m of motes.slice(0, Math.ceil(motes.length / 3))) {
        const p = beamPoint(m.u, m.v);
        moteG.circle(p.x, p.y, Math.min(1.1, m.size)).fill({ color: spec.daylight, alpha: kit.moteBaseAlpha * 0.22 });
      }
    }

    // ON AIR lamp
    onAir.clear();
    const pulse = reduce ? 1 : 0.85 + 0.15 * Math.sin(t * 3.2);
    radialGlow(onAir, airPos.x, airPos.y, live ? 22 : 12, live ? 12 : 6, 0xff3b30, (live ? 0.6 : 0.10) * pulse, 5);
    onAir.circle(airPos.x, airPos.y, 2.6).fill({ color: 0xff6a5c, alpha: live ? 0.95 : 0.25 });

    // Era prop glows (scaled by kit; brighter after dark so the room still reads)
    glowG.clear();
    practicalFloorG.clear();
    const nightGlow = glowScale * interiorBoost;
    if (spec.prop === 'brass-lamp') {
      const b = iso(7.55, 2.3);
      const f = (reduce ? 1 : 0.96 + 0.04 * Math.sin(t * 2.1)) * nightGlow;
      // Shade halo hugs the shade; floor pool sits at the prop base (b.y + 2), not floating.
      radialGlow(glowG, b.x, b.y - 66, 22, 15, spec.glow, 0.20 * f);
      radialGlow(practicalFloorG, b.x, b.y + 2, 52, 18, spec.glow2, 0.07 * f);
    } else if (spec.prop === 'neon-sign') {
      const flick = reduce ? 1 : Math.sin(t * 23) * Math.sin(t * 7) > 0.93 ? 0.35 : 1;
      const pts = bolt.flatMap(([u, v]) => {
        const p = neonQuad(u, v);
        return [p.x, p.y];
      });
      const a = flick * nightGlow;
      glowG.poly(pts).stroke({ width: 7, color: spec.glow, alpha: 0.16 * a });
      glowG.poly(pts).stroke({ width: 3.5, color: spec.glow, alpha: 0.5 * a });
      glowG.poly(pts).stroke({ width: 1.4, color: 0xffe6fb, alpha: 0.9 * a });
      const n0 = neonQuad(0.12, 0.06);
      const n1 = neonQuad(0.82, 0.06);
      glowG.moveTo(n0.x, n0.y).lineTo(n1.x, n1.y).stroke({ width: 2.4, color: spec.glow2, alpha: 0.7 * a });
      const wall = leftWallPt(0.72, 96);
      radialGlow(glowG, wall.x, wall.y, 46, 34, spec.glow, 0.13 * a, 6);
    } else if (spec.prop === 'lava-lamp') {
      const t0 = iso(7.45, 1.1);
      radialGlow(glowG, t0.x, t0.y - 34, 18, 20, spec.glow, 0.16 * nightGlow);
      radialGlow(practicalFloorG, t0.x, t0.y + 2, 40, 14, spec.glow, 0.06 * nightGlow);
      for (let i = 0; i < 3; i++) {
        const y = t0.y - 28 - (reduce ? i * 8 : (Math.sin(t * (0.5 + i * 0.23) + i * 2) * 0.5 + 0.5) * 20);
        glowG.circle(t0.x + (reduce ? 0 : Math.sin(t * 0.9 + i) * 1.4), y, 2.6 + i * 0.7).fill({ color: 0xffa070, alpha: 0.75 });
      }
    } else if (spec.prop === 'led-strip') {
      const segs = 14;
      for (let i = 0; i < segs; i++) {
        const hue = ((i / segs) * 0.35 + (reduce ? 0 : t * 0.05)) % 1;
        const color = hslToHex(hue, 0.75, 0.6);
        const a0 = i / segs;
        const a1 = (i + 0.85) / segs;
        const r0 = rightWallPt(a0 * ROOM_W, WALL_H - 4);
        const r1 = rightWallPt(a1 * ROOM_W, WALL_H - 4);
        glowG.moveTo(r0.x, r0.y).lineTo(r1.x, r1.y).stroke({ width: 5, color, alpha: 0.18 * nightGlow });
        glowG.moveTo(r0.x, r0.y).lineTo(r1.x, r1.y).stroke({ width: 2, color, alpha: 0.85 });
        const l0 = leftWallPt(a0 * ROOM_D, WALL_H - 4);
        const l1 = leftWallPt(a1 * ROOM_D, WALL_H - 4);
        glowG.moveTo(l0.x, l0.y).lineTo(l1.x, l1.y).stroke({ width: 5, color, alpha: 0.18 * nightGlow });
        glowG.moveTo(l0.x, l0.y).lineTo(l1.x, l1.y).stroke({ width: 2, color, alpha: 0.85 });
      }
      const s0 = iso(7.3, 1.6);
      radialGlow(glowG, s0.x, s0.y - 66, 14, 14, 0xffffff, 0.35 * nightGlow, 5);
    }

    // Tier neon practical (booth glass strip) — honour bloom/CRT by living in the additive layer
    tierNeon.clear();
    if (tier >= kit.neonFromTier) {
      const neonA = iso(1.0, 0.7);
      const neonB = iso(3.6, 0.7);
      const breath = reduce ? 1 : 0.82 + 0.18 * Math.sin(t * kit.neonPulseHz * Math.PI * 2);
      const liveBoost = live ? 1.15 : 1;
      tierNeon
        .poly([neonA.x, neonA.y - 84, neonB.x, neonB.y - 84, neonB.x, neonB.y - 74, neonA.x, neonA.y - 74])
        .fill({ color: kit.neonPrimary, alpha: 0.22 * breath * liveBoost });
      tierNeon
        .poly([neonA.x, neonA.y - 82, neonB.x, neonB.y - 82, neonB.x, neonB.y - 76, neonA.x, neonA.y - 76])
        .fill({ color: kit.neonSecondary, alpha: 0.55 * breath * liveBoost });
      radialGlow(
        tierNeon,
        (neonA.x + neonB.x) / 2,
        neonA.y - 79,
        70,
        18,
        kit.neonPrimary,
        0.14 * breath * liveBoost,
        5,
      );
    }

    // Steam + heat shimmer — only after espresso is brewed (chore / drinks state)
    steam.clear();
    const steamAmt = coffeeSteamStrength(Boolean(ambient?.coffeeSteaming), t, reduce);
    if (steamAmt > 0) {
      const wisps = reduce ? 2 : 4;
      for (let i = 0; i < wisps; i++) {
        const phase = reduce ? i / wisps : (t * 0.45 + i / wisps) % 1;
        const y = mugPos.y - phase * (14 + steamAmt * 6);
        const x = mugPos.x + Math.sin(phase * 5 + i * 2) * (2.2 + steamAmt);
        const r = (1.4 + phase * 2.4) * (0.85 + steamAmt * 0.25);
        steam.circle(x, y, r).fill({ color: 0xfff6e8, alpha: 0.28 * steamAmt * (1 - phase) });
      }
      // Soft heat shimmer pool just above the mug rim
      if (!reduce) {
        const shimmer = 0.5 + 0.5 * Math.sin(t * 2.8);
        radialGlow(steam, mugPos.x, mugPos.y + 2, 10 + shimmer * 2, 5, 0xffe0a6, 0.06 * steamAmt, 4);
      }
    }

    // Candle flicker — warm pool on the listening table
    candleG.clear();
    {
      const flick = candleFlicker(t, reduce);
      const nightLift = 0.85 + (1 - day) * 0.35;
      radialGlow(candleG, candlePos.x, candlePos.y, 18 * flick, 12 * flick, 0xff9a4d, 0.22 * flick * nightLift, 5);
      radialGlow(candleG, candlePos.x, candlePos.y + 10, 28, 10, 0xffc266, 0.08 * flick * nightLift, 4);
      candleG.circle(candlePos.x, candlePos.y - 1, 1.6 + flick * 0.6).fill({
        color: 0xffe6a0,
        alpha: 0.55 + flick * 0.4,
      });
    }

    // Clock rim glow — stronger in evening/night so the face still reads
    clockGlowG.clear();
    {
      const phase: DayPhase = ambient?.dayPhase ?? (day < 0.2 ? 'night' : day < 0.45 ? 'evening' : day < 0.8 ? 'day' : 'morning');
      const glowA = clockRimGlowAlpha(day, phase, t, reduce);
      radialGlow(clockGlowG, clockFace.x, clockFace.y, 22, 18, BRASS, glowA * 0.55, 5);
      radialGlow(clockGlowG, clockFace.x, clockFace.y, 12, 10, 0xffe0a6, glowA * 0.35, 4);
    }
  };

  update(0, true);
  return { floorContainer, container, kit, update };
};

/** HSL → 0xRRGGBB (h,s,l in 0..1). */
export const hslToHex = (h: number, s: number, l: number): number => {
  const k = (n: number) => (n + h * 12) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const r = Math.round(f(0) * 255);
  const g = Math.round(f(8) * 255);
  const b = Math.round(f(4) * 255);
  return (r << 16) | (g << 8) | b;
};

/* -------------------------------------------------------------- wall clock */

/**
 * Point on a wall-mounted face. `u` runs to the viewer's right along the wall, `v` runs up.
 * For the left wall the reading direction is up-and-right on screen (0.894, -0.447).
 */
const leftFace = (cx: number, cy: number, u: number, v: number) => ({
  x: cx + u * 0.894,
  y: cy - u * 0.447 - v,
});

export interface WallClock {
  container: Container;
  /** Redraw the hands. `hour` is 0..12, `minute` is 0..60. */
  setTime: (hour: number, minute: number) => void;
}

/** A proper brass-rimmed wall clock drawn *in the left wall plane* (ticks, numerals-as-dots, hands). */
export const buildWallClock = (cx: number, cy: number): WallClock => {
  const container = new Container();
  const g = new Graphics();
  const R = 17;
  const ring = (r: number, steps = 40) => {
    const pts: number[] = [];
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const p = leftFace(cx, cy, Math.cos(a) * r, Math.sin(a) * r);
      pts.push(p.x, p.y);
    }
    return pts;
  };
  // Soft shadow on the wall, offset down-right
  const shadow = ring(R + 1.5).map((v, i) => (i % 2 === 0 ? v + 2.2 : v + 3));
  g.poly(shadow).fill({ color: 0x000000, alpha: 0.28 });
  const renderedFace = getStudioTexture('clockFace');
  const faceTex = renderedFace ? null : getPropTexture('wallClock');
  if (renderedFace) {
    // Blender-rendered brass dial with real depth, centred on the clock; hands stay live below.
    const face = new Sprite(renderedFace);
    face.anchor.set(0.5);
    face.scale.set(0.5);
    const c = leftFace(cx, cy, 0, 0);
    face.position.set(c.x, c.y);
    container.addChild(face);
  } else if (faceTex) {
    // Flat face art sheared into the left-wall plane; hands stay live below.
    const k = (R * 2) / faceTex.width;
    const face = new Sprite(faceTex);
    const o = leftFace(cx, cy, -R, R);
    face.setFromMatrix(new Matrix(0.894 * k, -0.447 * k, 0, k, o.x, o.y));
    container.addChild(face);
  } else {
    // Brass rim, dark inner rim, cream face
    g.poly(ring(R)).fill(0xc9974a);
    g.poly(ring(R)).stroke({ width: 0.8, color: 0x6b4a1c });
    g.poly(ring(R - 2.2)).fill(0x2a1f14);
    g.poly(ring(R - 3.2)).fill(0xf3ead6);
  }
  // Hour ticks (12) and quarter markers
  for (let i = 0; !faceTex && !renderedFace && i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const long = i % 3 === 0;
    const r0 = R - 3.6;
    const r1 = R - (long ? 8 : 6);
    const p0 = leftFace(cx, cy, Math.sin(a) * r0, Math.cos(a) * r0);
    const p1 = leftFace(cx, cy, Math.sin(a) * r1, Math.cos(a) * r1);
    g.moveTo(p0.x, p0.y).lineTo(p1.x, p1.y).stroke({ width: long ? 1.6 : 0.8, color: 0x2b2118 });
  }
  container.addChild(g);

  const hands = new Graphics();
  container.addChild(hands);
  const hub = new Graphics();
  const c0 = leftFace(cx, cy, 0, 0);
  hub.circle(c0.x, c0.y, 1.6).fill(0x8a2323);
  container.addChild(hub);

  const setTime = (hour: number, minute: number) => {
    hands.clear();
    const hAng = (((hour % 12) + minute / 60) / 12) * Math.PI * 2;
    const mAng = (minute / 60) * Math.PI * 2;
    const tip = (ang: number, len: number) => leftFace(cx, cy, Math.sin(ang) * len, Math.cos(ang) * len);
    const tail = (ang: number, len: number) => leftFace(cx, cy, -Math.sin(ang) * len, -Math.cos(ang) * len);
    const h = tip(hAng, 8);
    const ht = tail(hAng, 2);
    const m = tip(mAng, 12.5);
    const mt = tail(mAng, 2.5);
    hands.moveTo(ht.x, ht.y).lineTo(h.x, h.y).stroke({ width: 2.2, color: 0x2b2118, cap: 'round' });
    hands.moveTo(mt.x, mt.y).lineTo(m.x, m.y).stroke({ width: 1.4, color: 0x2b2118, cap: 'round' });
  };
  setTime(10, 8);
  return { container, setTime };
};

/* --------------------------------------------------------------- live booth */

/** Lamp position (world px) on the booth header, used by the lighting layer's ON AIR lamp. */
export const BOOTH_HEADER_LAMP = (() => {
  const p = iso(2.25, 1.0);
  return { x: p.x, y: p.y - 79 };
})();

/**
 * A properly enclosed vocal booth against the right wall: carpeted floor, foam-lined
 * interior, side walls, a flat roof, a header beam and a glass front with posts and a door.
 * Replaces the old bare glass pane that floated in the room.
 */
export const buildLiveBooth = (): Container => {
  const backTex = getStudioTexture('boothBack');
  const frontTex = getStudioTexture('boothFront');
  if (backTex && frontTex) {
    // Blender-rendered booth: interior (foam, mic, stool, stand) behind, glass + frame + roof in front.
    const sprites = new Container();
    const origin = iso(2.25, 1.0);
    for (const tex of [backTex, frontTex]) {
      const sp = new Sprite(tex);
      sp.anchor.set(100 / tex.width, 235 / tex.height);
      sp.scale.set(0.5);
      sp.position.set(origin.x, origin.y);
      sprites.addChild(sp);
    }
    return sprites;
  }
  const c = new Container();
  const gBack = new Graphics();
  const gFront = new Graphics();
  const x0 = 1.0;
  const x1 = 3.5;
  const y0 = 0;
  const y1 = 1.0;
  const GH = 74; // glass height
  const H = 86; // roof height
  const P = (x: number, y: number, l = 0) => {
    const p = iso(x, y);
    return { x: p.x, y: p.y - l };
  };
  const quad = (a: ReturnType<typeof P>, b: ReturnType<typeof P>, c2: ReturnType<typeof P>, d: ReturnType<typeof P>) => [a.x, a.y, b.x, b.y, c2.x, c2.y, d.x, d.y];

  // Carpet
  gBack.poly(quad(P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1))).fill(0x2e2521);
  gBack.poly(quad(P(x0 + 0.08, y0 + 0.08), P(x1 - 0.08, y0 + 0.08), P(x1 - 0.08, y1 - 0.06), P(x0 + 0.08, y1 - 0.06))).stroke({ width: 0.8, color: BRASS, alpha: 0.25 });

  // Foam on the back (right) wall: egg-crate checker
  const cols = 10;
  const rows = 4;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const xa = x0 + ((x1 - x0) * i) / cols;
      const xb = x0 + ((x1 - x0) * (i + 1)) / cols;
      const la = 4 + ((GH - 6) * j) / rows;
      const lb = 4 + ((GH - 6) * (j + 1)) / rows;
      gBack.poly(rightWallQuad(xa, xb, la, lb)).fill((i + j) % 2 ? 0x241d19 : 0x191411);
    }
  }
  gBack.poly(rightWallQuad(x0, x1, 0, 4)).fill(0x120e0b);

  // Inner face of the left side wall (x = x0), foam stripes
  for (let j = 0; j < 6; j++) {
    const la = 4 + ((GH - 4) * j) / 6;
    const lb = 4 + ((GH - 4) * (j + 1)) / 6;
    gBack.poly(quad(P(x0, y0, la), P(x0, y1, la), P(x0, y1, lb), P(x0, y0, lb))).fill(j % 2 ? 0x241d19 : 0x1a1512);
  }

  // Mic stand + pop filter + stool + music stand, deep in the booth
  const stool = P(1.75, 0.52);
  let stoolSpriteRef: Sprite | null = null;
  const stoolTex = getPropTexture('stool');
  if (stoolTex) {
    const sp = new Sprite(stoolTex);
    sp.anchor.set(0.5, 72 / 80);
    sp.scale.set(44 / stoolTex.height * 1.0);
    sp.position.set(stool.x, stool.y);
    stoolSpriteRef = sp;
  } else {
    gBack.ellipse(stool.x, stool.y, 9, 4.2).fill({ color: 0x000000, alpha: 0.3 });
    gBack.rect(stool.x - 1, stool.y - 18, 2, 18).fill(0x4a4038);
    gBack.ellipse(stool.x, stool.y - 20, 9, 4.2).fill(0x6b3a2a);
    gBack.ellipse(stool.x, stool.y - 20, 9, 4.2).stroke({ width: 0.8, color: 0x2a1610 });
  }

  const base = P(2.25, 0.55);
  let micSpriteRef: Sprite | null = null;
  const micTex = getPropTexture('micStand');
  if (micTex) {
    const micSprite = new Sprite(micTex);
    micSprite.scale.set(58 / micTex.height * 1.3);
    micSprite.anchor.set(34 / 80, 150 / 160);
    micSprite.position.set(base.x, base.y + 2);
    micSpriteRef = micSprite;
  } else {
    gBack.ellipse(base.x, base.y, 12, 6).fill(0x1b1613);
    gBack.rect(base.x - 1.6, base.y - 46, 3.2, 46).fill(0x8f98ab);
    gBack.moveTo(base.x, base.y - 46).lineTo(base.x + 10, base.y - 52).stroke({ width: 2, color: 0x8f98ab });
    gBack.circle(base.x + 11, base.y - 53, 5.5).fill(BRASS);
    gBack.circle(base.x + 11, base.y - 53, 5.5).stroke({ width: 1, color: 0x6b4a1c });
    gBack.circle(base.x + 4, base.y - 50, 8).stroke({ width: 1, color: 0x000000, alpha: 0.7 });
  }

  const stand = P(2.85, 0.6);
  let standSpriteRef: Sprite | null = null;
  const standTex = getPropTexture('musicStand');
  if (standTex) {
    const sp = new Sprite(standTex);
    sp.anchor.set(0.5, 104 / 112);
    sp.scale.set(54 / standTex.height * 1.0);
    sp.position.set(stand.x, stand.y);
    standSpriteRef = sp;
  } else {
    gBack.rect(stand.x - 0.8, stand.y - 38, 1.6, 38).fill(0x3a3f45);
    gBack.poly([stand.x - 9, stand.y - 42, stand.x + 9, stand.y - 48, stand.x + 9, stand.y - 36, stand.x - 9, stand.y - 30]).fill(0x2f353c);
  }

  // Glass front (y = y1)
  const gl = quad(P(x0, y1), P(x1, y1), P(x1, y1, GH), P(x0, y1, GH));
  gFront.poly(gl).fill({ color: 0xa6d8e6, alpha: 0.13 });
  // reflection streaks
  gFront.poly(quad(P(1.35, y1), P(1.6, y1), P(2.05, y1, GH), P(1.8, y1, GH))).fill({ color: 0xffffff, alpha: 0.07 });
  gFront.poly(quad(P(2.0, y1), P(2.12, y1), P(2.55, y1, GH), P(2.43, y1, GH))).fill({ color: 0xffffff, alpha: 0.05 });
  gFront.poly(gl).stroke({ width: 1.4, color: 0x9fb1b5, alpha: 0.85 });
  // Posts (left, mid, door jamb, right)
  for (const px of [x0, 1.9, 2.75, x1]) {
    gFront.poly(quad(P(px - 0.035, y1), P(px + 0.035, y1), P(px + 0.035, y1, H), P(px - 0.035, y1, H))).fill(0x2a2521);
    gFront.poly(quad(P(px - 0.035, y1), P(px + 0.035, y1), P(px + 0.035, y1, H), P(px - 0.035, y1, H))).stroke({ width: 0.6, color: BRASS, alpha: 0.6 });
  }
  // Door outline + handle between the last two posts
  gFront.poly(quad(P(2.79, y1, 2), P(x1 - 0.04, y1, 2), P(x1 - 0.04, y1, GH - 2), P(2.79, y1, GH - 2))).stroke({ width: 1, color: 0xcfe0e4, alpha: 0.55 });
  const hdl = P(2.88, y1, 36);
  gFront.roundRect(hdl.x - 1, hdl.y - 6, 2, 12, 1).fill(BRASS);

  // Header beam across the top of the glass
  gFront.poly(quad(P(x0, y1, GH), P(x1, y1, GH), P(x1, y1, H), P(x0, y1, H))).fill(0x231b16);
  gFront.poly(quad(P(x0, y1, GH), P(x1, y1, GH), P(x1, y1, GH + 1.6), P(x0, y1, GH + 1.6))).fill({ color: BRASS, alpha: 0.8 });
  // Nameplate + lamp housing on the header
  gFront.poly(quad(P(1.35, y1, 76), P(1.95, y1, 76), P(1.95, y1, 83), P(1.35, y1, 83))).fill(0x3a2c1f);
  gFront.poly(quad(P(1.35, y1, 76), P(1.95, y1, 76), P(1.95, y1, 83), P(1.35, y1, 83))).stroke({ width: 0.7, color: BRASS, alpha: 0.7 });
  const lamp = BOOTH_HEADER_LAMP;
  gFront.roundRect(lamp.x - 7, lamp.y - 4, 14, 8, 2).fill(0x120d0a);
  gFront.circle(lamp.x, lamp.y, 2.6).fill(0x5a1a14);

  // Outer face of the right side wall (x = x1), facing the room
  gFront.poly(quad(P(x1, y0), P(x1, y1), P(x1, y1, H), P(x1, y0, H))).fill(0x3d302a);
  gFront.poly(quad(P(x1, y0), P(x1, y1), P(x1, y1, 38), P(x1, y0, 38))).fill(0x2a201b);
  gFront.poly(quad(P(x1, y0, 38), P(x1, y1, 38), P(x1, y1, 41), P(x1, y0, 41))).fill({ color: BRASS, alpha: 0.5 });
  gFront.poly(quad(P(x1, y0), P(x1, y1), P(x1, y1, H), P(x1, y0, H))).stroke({ width: 1, color: 0x120d09, alpha: 0.8 });

  // Flat roof
  gFront.poly(quad(P(x0, y0, H), P(x1, y0, H), P(x1, y1, H), P(x0, y1, H))).fill(0x4a3d34);
  gFront.poly(quad(P(x0 + 0.1, y0 + 0.1, H), P(x1 - 0.1, y0 + 0.1, H), P(x1 - 0.1, y1 - 0.1, H), P(x0 + 0.1, y1 - 0.1, H))).fill(0x54463c);
  gFront.poly(quad(P(x0, y0, H), P(x1, y0, H), P(x1, y1, H), P(x0, y1, H))).stroke({ width: 1.2, color: 0x120d09, alpha: 0.9 });
  gFront.poly([P(x0, y1, H).x, P(x0, y1, H).y, P(x1, y1, H).x, P(x1, y1, H).y, P(x1, y1, H).x, P(x1, y1, H).y - 0.1]).stroke({ width: 1.2, color: BRASS, alpha: 0.7 });

  c.addChild(gBack);
  if (stoolSpriteRef) c.addChild(stoolSpriteRef);
  if (micSpriteRef) c.addChild(micSpriteRef);
  if (standSpriteRef) c.addChild(standSpriteRef);
  c.addChild(gFront);
  return c;
};

/* ------------------------------------------------------ smooth gradient sprites */

/**
 * A smooth radial gradient as a sprite (canvas texture). Stacked ellipses band visibly
 * on big surfaces — this is what the backdrop halo and vignette use instead.
 * `stops` are [offset 0..1, css colour] pairs. Returns null when no 2D canvas exists (tests/SSR).
 */
export const radialGradientSprite = (
  width: number,
  height: number,
  stops: Array<[number, string]>,
): Sprite | null => {
  if (typeof document === 'undefined') return null;
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, col] of stops) grad.addColorStop(o, col);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const sprite = new Sprite(Texture.from(canvas));
  sprite.width = width;
  sprite.height = height;
  sprite.eventMode = 'none';
  return sprite;
};

/* --------------------------------------------------------------- backdrop */

/** Screen-space backdrop behind the room: warm ink with a soft halo under the diorama. */
export const buildUnderlay = (width: number, height: number, centre: { x: number; y: number }, scale: number): Container => {
  const c = new Container();
  c.eventMode = 'none';
  const g = new Graphics();
  g.rect(0, 0, width, height).fill(0x0e0c0a);
  c.addChild(g);
  const rx = Math.max(width * 0.62, 240 * scale * 2);
  const ry = Math.max(height * 0.66, 140 * scale * 2);
  const halo = radialGradientSprite(rx * 2, ry * 2, [
    [0, 'rgba(92, 64, 36, 0.55)'],
    [0.45, 'rgba(60, 42, 26, 0.26)'],
    [1, 'rgba(14, 12, 10, 0)'],
  ]);
  if (halo) {
    halo.anchor.set(0.5);
    halo.position.set(centre.x, centre.y);
    c.addChild(halo);
  }
  return c;
};
