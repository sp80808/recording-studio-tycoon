// Shared 2:1 isometric box kit for in-house Pixi furniture (premises decor and room layouts).
// In-house proprietary original, Pixi Graphics only (logged in docs/ART_SOURCING_LOG.md).
import { Container, Graphics } from 'pixi.js';

export const wrap = (g: Graphics): Container => {
  const c = new Container();
  c.eventMode = 'none';
  c.addChild(g);
  return c;
};

// --- Tiny isometric box kit (2:1 projection, same as `iso`): u runs along +x, v along +y, z is up. ---
export type P3 = [number, number, number];
export const pt = (u: number, v: number, z: number): [number, number] => [u - v, (u + v) / 2 - z];
export const quad = (g: Graphics, a: P3, b: P3, c: P3, d: P3) => {
  g.poly([pt(...a), pt(...b), pt(...c), pt(...d)].flat());
};

export interface BoxColors { top: number; left: number; right: number }

/** Three visible faces of an axis-aligned box: top, front-left (+v) and front-right (+u). */
export const isoBox = (g: Graphics, u0: number, v0: number, u1: number, v1: number, z0: number, z1: number, c: BoxColors, edge = 0x000000) => {
  quad(g, [u0, v1, z0], [u1, v1, z0], [u1, v1, z1], [u0, v1, z1]);
  g.fill(c.left);
  quad(g, [u1, v0, z0], [u1, v1, z0], [u1, v1, z1], [u1, v0, z1]);
  g.fill(c.right);
  quad(g, [u0, v0, z1], [u1, v0, z1], [u1, v1, z1], [u0, v1, z1]);
  g.fill(c.top);
  // Soft rim along the top front edges so the volume reads at gameplay zoom.
  const a = pt(u0, v1, z1);
  const b = pt(u1, v1, z1);
  const d = pt(u1, v0, z1);
  g.moveTo(a[0], a[1]).lineTo(b[0], b[1]).lineTo(d[0], d[1]).stroke({ width: 1, color: edge, alpha: 0.35 });
};

export const LEATHER: BoxColors = { top: 0xb8794a, left: 0x8a5230, right: 0x6a3d22 };
export const LEATHER_BACK: BoxColors = { top: 0xa06a40, left: 0x7a4929, right: 0x5f3720 };
export const WOOD: BoxColors = { top: 0x7a5636, left: 0x4f3622, right: 0x3b281a };
export const NAVY: BoxColors = { top: 0x5a6e8c, left: 0x3f4f68, right: 0x2f3c50 };
export const NAVY_BACK: BoxColors = { top: 0x4d5f7a, left: 0x364559, right: 0x28344a };
export const LEG: BoxColors = { top: 0x2a1f14, left: 0x2a1f14, right: 0x1a130c };

export interface SeatSpec {
  half: number; // half length along u
  depth: number; // half depth along v
  seatZ: number;
  backZ: number;
  armZ: number;
  armW: number;
  cushions: number;
  frame: BoxColors;
  cushion: BoxColors;
  back: BoxColors;
  legH: number;
  accent?: number;
}

/** Facing the camera: backrest on the far (-v) side, arms at both ends, split seat cushions. */
export const buildSeat = (s: SeatSpec): Container => {
  const g = new Graphics();
  const { half: h, depth: d } = s;
  g.ellipse(0, 4, h + 6, d * 0.5 + 8).fill({ color: 0x000000, alpha: 0.3 });
  const lh = s.legH;
  if (lh > 0) {
    for (const [u, v] of [[-h + 1, -d + 1], [h - 4, -d + 1], [-h + 1, d - 4], [h - 4, d - 4]]) isoBox(g, u, v, u + 3, v + 3, 0, lh, LEG);
  }
  // Backrest (far side) first so everything else overlaps it, then far arm, frame, cushions, near arm.
  isoBox(g, -h, -d, h, -d + 5, s.seatZ, s.backZ, s.back);
  isoBox(g, -h, -d + 5, -h + s.armW, d, s.seatZ, s.armZ, s.back);
  isoBox(g, -h + s.armW, -d + 5, h - s.armW, d, lh, s.seatZ, s.frame);
  const cw = (2 * (h - s.armW)) / s.cushions;
  for (let i = 0; i < s.cushions; i++) {
    const u0 = -h + s.armW + i * cw + 0.5;
    isoBox(g, u0, -d + 5, u0 + cw - 1, d - 1, s.seatZ, s.seatZ + 5, s.cushion);
  }
  isoBox(g, h - s.armW, -d + 5, h, d, s.seatZ, s.armZ, s.back);
  if (s.accent !== undefined) {
    // Accent piping along the front lip of the seat frame
    const a = pt(-h + s.armW, d, s.seatZ + 1);
    const b = pt(h - s.armW, d, s.seatZ + 1);
    g.moveTo(a[0], a[1]).lineTo(b[0], b[1]).stroke({ width: 1.6, color: s.accent, alpha: 0.85 });
  }
  return wrap(g);
};

export const buildRack = (): Container => {
  const g = new Graphics();
  g.ellipse(0, 2, 22, 8).fill({ color: 0x000000, alpha: 0.28 });
  const hw = 12;
  const hd = 8;
  isoBox(g, -hw, -hd, hw, hd, 0, 58, { top: 0x4a5262, left: 0x2b3039, right: 0x1e232b }, 0x7d8aa3);
  // Faceplates on the front (+v) face
  for (let i = 0; i < 4; i++) {
    const z0 = 4 + i * 13;
    quad(g, [-hw + 2, hd, z0], [hw - 2, hd, z0], [hw - 2, hd, z0 + 9], [-hw + 2, hd, z0 + 9]);
    g.fill(0x3d4452);
    const led = pt(hw - 5, hd, z0 + 4.5);
    g.circle(led[0], led[1], 1.6).fill(i % 2 ? 0x59d98a : 0xf0b84a);
    const s0 = pt(-hw + 4, hd, z0 + 4.5);
    const s1 = pt(-hw + 12, hd, z0 + 4.5);
    g.moveTo(s0[0], s0[1]).lineTo(s1[0], s1[1]).stroke({ width: 1, color: 0x14151a, alpha: 0.7 });
  }
  return wrap(g);
};

