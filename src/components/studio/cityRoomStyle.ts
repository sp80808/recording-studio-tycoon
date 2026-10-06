/**
 * Per-city room dressing (#291): wall trim colour and a pair of wall posters, keyed off gameState.cityId.
 * Pure data + mapping; the Pixi painter below only turns the data into polygons on the left wall.
 * No city (legacy saves, default) returns no change: trim passes through and no posters are drawn.
 */
import type { Graphics } from 'pixi.js';
import { getCityById } from '@/rpg/cities';
import { iso, isoQuad, leftWallPt, ROOM_D, ROOM_W } from './isoMath';
import { mixColor } from './cityWallTint';

export type PosterMotif = 'sunburst' | 'stripes' | 'bars' | 'diamond' | 'rings' | 'wave';

export interface PosterSpec {
  motif: PosterMotif;
  bg: number;
  fg: number;
  /** Left-wall span in tiles (y0 < y1). */
  y0: number;
  y1: number;
}

/** Share of the city accent mixed into the wall trim. */
export const CITY_TRIM_TINT = 0.4;

const SLOT_A = { y0: 3.0, y1: 3.75 } as const;
const SLOT_B = { y0: 4.3, y1: 4.9 } as const;
export const POSTER_LIFT = { low: 54, high: 112 } as const;

const poster = (slot: { y0: number; y1: number }, motif: PosterMotif, bg: number, fg: number): PosterSpec => ({ ...slot, motif, bg, fg });

export const CITY_POSTERS: Record<string, readonly [PosterSpec, PosterSpec]> = {
  'los-angeles': [poster(SLOT_A, 'sunburst', 0x3a2038, 0xf2a65a), poster(SLOT_B, 'stripes', 0x1d2a3a, 0xff7a6b)],
  nashville: [poster(SLOT_A, 'diamond', 0x2a1d14, 0xd98c4a), poster(SLOT_B, 'rings', 0x1d2a22, 0xe8d9a8)],
  london: [poster(SLOT_A, 'rings', 0x1a2540, 0xd9463e), poster(SLOT_B, 'stripes', 0x20283a, 0x7fa8d9)],
  berlin: [poster(SLOT_A, 'bars', 0x15171d, 0x9aa3b8), poster(SLOT_B, 'wave', 0x22262f, 0xe6e9f2)],
  tokyo: [poster(SLOT_A, 'sunburst', 0xefe6d6, 0xc4372c), poster(SLOT_B, 'wave', 0x1b2038, 0xe87aa0)],
  rio: [poster(SLOT_A, 'stripes', 0x14301f, 0xf2d33a), poster(SLOT_B, 'sunburst', 0x0f2a3a, 0x5fbf7a)],
  detroit: [poster(SLOT_A, 'bars', 0x1a1d22, 0x5aa7a7), poster(SLOT_B, 'diamond', 0x2a2d33, 0xd7dbe0)],
  lagos: [poster(SLOT_A, 'diamond', 0x1d2a1a, 0xd5a52f), poster(SLOT_B, 'stripes', 0x2a1a14, 0x4fbf6a)],
};

export const cityPosters = (cityId?: string): readonly PosterSpec[] => (cityId ? CITY_POSTERS[cityId] : undefined) ?? [];

const parseHex = (hex: string): number => parseInt(hex.replace('#', ''), 16);

/** Wall trim nudged toward the home city's accent; unchanged without a known city. */
export const cityTrimColor = (trim: number, cityId?: string): number => {
  const city = getCityById(cityId);
  return city ? mixColor(trim, parseHex(city.accent), CITY_TRIM_TINT) : trim;
};

/** Paint the city's posters on the left wall (frame, backing, motif). */
export const drawCityPosters = (g: Graphics, cityId?: string): void => {
  for (const p of cityPosters(cityId)) {
    const pt = (u: number, v: number) => leftWallPt(p.y0 + u * (p.y1 - p.y0), POSTER_LIFT.low + v * (POSTER_LIFT.high - POSTER_LIFT.low));
    const quad = (u0: number, u1: number, v0: number, v1: number) => {
      const a = pt(u0, v0); const b = pt(u1, v0); const c = pt(u1, v1); const d = pt(u0, v1);
      return [a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y];
    };
    g.poly(quad(-0.06, 1.06, -0.04, 1.04)).fill(0x120e0a);
    g.poly(quad(0, 1, 0, 1)).fill(p.bg);
    const fill = (pts: number[], alpha = 1) => g.poly(pts).fill({ color: p.fg, alpha });
    switch (p.motif) {
      case 'stripes':
        for (let i = 0; i < 3; i++) fill(quad(0.1, 0.9, 0.18 + i * 0.26, 0.3 + i * 0.26), 0.9 - i * 0.2);
        break;
      case 'bars':
        [0.35, 0.6, 0.85, 0.5, 0.7].forEach((h, i) => fill(quad(0.1 + i * 0.16, 0.2 + i * 0.16, 0.08, 0.08 + h * 0.8)));
        break;
      case 'diamond': {
        const m = [pt(0.5, 0.1), pt(0.88, 0.5), pt(0.5, 0.9), pt(0.12, 0.5)];
        fill(m.flatMap((q) => [q.x, q.y]));
        const n = [pt(0.5, 0.3), pt(0.68, 0.5), pt(0.5, 0.7), pt(0.32, 0.5)];
        g.poly(n.flatMap((q) => [q.x, q.y])).fill(p.bg);
        break;
      }
      case 'rings': {
        const c = pt(0.5, 0.5);
        g.ellipse(c.x, c.y, 11, 15).fill(p.fg);
        g.ellipse(c.x, c.y, 7, 10).fill(p.bg);
        g.ellipse(c.x, c.y, 3, 5).fill(p.fg);
        break;
      }
      case 'wave': {
        const line: number[] = [];
        for (let i = 0; i <= 8; i++) {
          const q = pt(0.08 + (i / 8) * 0.84, 0.5 + (i % 2 ? 0.2 : -0.2));
          line.push(q.x, q.y);
        }
        g.poly(line, false).stroke({ width: 2, color: p.fg });
        break;
      }
      case 'sunburst': {
        const c = pt(0.5, 0.45);
        for (let i = 0; i < 6; i++) {
          const a0 = (i / 6) * Math.PI;
          const a1 = a0 + Math.PI / 12;
          const r = 20;
          fill([c.x, c.y, c.x + Math.cos(a0) * r, c.y - Math.sin(a0) * r * 0.9, c.x + Math.cos(a1) * r, c.y - Math.sin(a1) * r * 0.9], 0.85);
        }
        g.circle(c.x, c.y, 4).fill(p.fg);
        break;
      }
    }
  }
};

/* ------------------------------------------------------------ floor + props */

export type FloorPattern = 'checker' | 'runner' | 'border' | 'diagonal';
export type CityProp = 'surfboard' | 'guitar-case' | 'umbrella-stand' | 'crate' | 'lantern' | 'conga' | 'record-crate' | 'drum';

export interface CityFloorSpec {
  pattern: FloorPattern;
  /** Overlay colour for the pattern (low alpha). */
  color: number;
  prop: CityProp;
  propColor: number;
  propAccent: number;
}

/** Share of the city accent mixed into the floorboards. */
export const CITY_FLOOR_TINT = 0.1;

export const CITY_FLOORS: Record<string, CityFloorSpec> = {
  'los-angeles': { pattern: 'diagonal', color: 0xf2a65a, prop: 'surfboard', propColor: 0xf2d6a0, propAccent: 0xe0604a },
  nashville: { pattern: 'runner', color: 0xd98c4a, prop: 'guitar-case', propColor: 0x2a1d14, propAccent: 0xc9a050 },
  london: { pattern: 'checker', color: 0xd9d0c0, prop: 'umbrella-stand', propColor: 0x2c3a52, propAccent: 0xd9463e },
  berlin: { pattern: 'border', color: 0x9aa3b8, prop: 'crate', propColor: 0x4a5060, propAccent: 0xe6e9f2 },
  tokyo: { pattern: 'border', color: 0xe8d9b0, prop: 'lantern', propColor: 0xc4372c, propAccent: 0xffd98a },
  rio: { pattern: 'diagonal', color: 0xf2d33a, prop: 'conga', propColor: 0x7a3a1a, propAccent: 0x5fbf7a },
  detroit: { pattern: 'checker', color: 0x5aa7a7, prop: 'record-crate', propColor: 0x3a3028, propAccent: 0x5aa7a7 },
  lagos: { pattern: 'runner', color: 0xd5a52f, prop: 'drum', propColor: 0x8a5a2a, propAccent: 0x4fbf6a },
};

export const cityFloorSpec = (cityId?: string): CityFloorSpec | undefined => (cityId ? CITY_FLOORS[cityId] : undefined);

/** Floorboard tones nudged toward the home city's accent; unchanged without a known city. */
export const cityFloorPlanks = (planks: [number, number, number], cityId?: string): [number, number, number] => {
  const city = getCityById(cityId);
  if (!city) return planks;
  const accent = parseHex(city.accent);
  return [mixColor(planks[0], accent, CITY_FLOOR_TINT), mixColor(planks[1], accent, CITY_FLOOR_TINT), mixColor(planks[2], accent, CITY_FLOOR_TINT)];
};

/** Faint floor pattern over the boards (checker, centre runner, edge border, diagonal stripes). */
export const drawCityFloorPattern = (g: Graphics, cityId?: string): void => {
  const spec = cityFloorSpec(cityId);
  if (!spec) return;
  const fill = (x0: number, y0: number, x1: number, y1: number, alpha: number) => {
    isoQuad(g, x0, y0, x1, y1);
    g.fill({ color: spec.color, alpha });
  };
  switch (spec.pattern) {
    case 'checker':
      for (let x = 0; x < ROOM_W; x++) for (let y = 0; y < ROOM_D; y++) if ((x + y) % 2 === 0) fill(x, y, x + 1, y + 1, 0.11);
      break;
    case 'runner':
      fill(0, 2.6, ROOM_W, 2.8, 0.22);
      fill(0, 3.2, ROOM_W, 3.3, 0.16);
      break;
    case 'border':
      fill(0.15, 0.15, ROOM_W - 0.15, 0.3, 0.2);
      fill(0.15, 0.15, 0.3, ROOM_D - 0.15, 0.2);
      fill(0.15, ROOM_D - 0.3, ROOM_W - 0.15, ROOM_D - 0.15, 0.2);
      fill(ROOM_W - 0.3, 0.15, ROOM_W - 0.15, ROOM_D - 0.15, 0.2);
      break;
    case 'diagonal':
      for (let i = 1; i < ROOM_W; i += 2) fill(i, 0, i + 0.4, ROOM_D, 0.13);
      break;
  }
};

/** Anchor of the city floor prop, in room tiles (front edge of the floor, clear of the desk, sofa and doors). */
export const CITY_PROP_ANCHOR = { x: 3.6, y: 6.5 } as const;

/** One small floor prop per city, drawn from plain polygons and ellipses. Nothing without a known city. */
export const drawCityProp = (g: Graphics, cityId?: string): void => {
  const spec = cityFloorSpec(cityId);
  if (!spec) return;
  const o = iso(CITY_PROP_ANCHOR.x, CITY_PROP_ANCHOR.y);
  const { propColor: c, propAccent: a } = spec;
  g.ellipse(o.x, o.y + 1, 12, 5).fill({ color: 0x000000, alpha: 0.28 });
  switch (spec.prop) {
    case 'surfboard':
      g.ellipse(o.x, o.y - 18, 5, 19).fill(c);
      g.rect(o.x - 0.6, o.y - 36, 1.2, 36).fill({ color: a, alpha: 0.9 });
      break;
    case 'guitar-case':
      g.ellipse(o.x, o.y - 8, 8, 10).fill(c);
      g.rect(o.x - 3, o.y - 30, 6, 20).fill(c);
      g.rect(o.x - 4, o.y - 12, 8, 1.5).fill(a);
      g.rect(o.x - 4, o.y - 6, 8, 1.5).fill(a);
      break;
    case 'umbrella-stand':
      g.rect(o.x - 6, o.y - 14, 12, 14).fill(c);
      g.rect(o.x - 6, o.y - 14, 12, 2).fill(a);
      g.rect(o.x - 3, o.y - 30, 1.6, 17).fill(a);
      g.rect(o.x + 1, o.y - 26, 1.6, 13).fill(0xd8d0c0);
      break;
    case 'crate':
      g.poly([o.x - 10, o.y - 6, o.x, o.y - 11, o.x + 10, o.y - 6, o.x, o.y - 1]).fill(a);
      g.poly([o.x - 10, o.y - 6, o.x, o.y - 1, o.x, o.y + 6, o.x - 10, o.y + 1]).fill(c);
      g.poly([o.x + 10, o.y - 6, o.x, o.y - 1, o.x, o.y + 6, o.x + 10, o.y + 1]).fill({ color: c, alpha: 0.75 });
      break;
    case 'lantern':
      g.rect(o.x - 0.8, o.y - 34, 1.6, 8).fill(a);
      g.ellipse(o.x, o.y - 20, 8, 10).fill(c);
      g.ellipse(o.x, o.y - 20, 4, 6).fill({ color: a, alpha: 0.6 });
      g.rect(o.x - 4, o.y - 31, 8, 2).fill(0x2a1a14);
      g.rect(o.x - 4, o.y - 10, 8, 2).fill(0x2a1a14);
      break;
    case 'conga':
      g.poly([o.x - 7, o.y - 26, o.x + 7, o.y - 26, o.x + 5, o.y, o.x - 5, o.y]).fill(c);
      g.ellipse(o.x, o.y - 26, 7, 3).fill(0xe8d9b0);
      g.rect(o.x - 6, o.y - 18, 12, 1.6).fill(a);
      break;
    case 'record-crate':
      g.rect(o.x - 9, o.y - 12, 18, 12).fill(c);
      for (let i = 0; i < 5; i++) g.rect(o.x - 7 + i * 3.2, o.y - 18 - (i % 2), 2.2, 7).fill(i % 2 ? 0x1a1a1e : a);
      break;
    case 'drum':
      g.ellipse(o.x, o.y - 6, 8, 4).fill(c);
      g.rect(o.x - 8, o.y - 20, 16, 14).fill(c);
      g.ellipse(o.x, o.y - 20, 8, 4).fill(0xe8d9b0);
      g.rect(o.x - 8, o.y - 14, 16, 1.6).fill(a);
      break;
  }
};
