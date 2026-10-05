// Premises furniture (#70): what the Living Studio gains when you move up.
//   Tier 1 Project Studio: client waiting bench + wall-side storage rack.
//   Tier 2 Commercial Studio: reception counter with a sign and a second rack.
//   Tier 3 Multi-room Facility: premium client sofa and a third rack bay.
// In-house proprietary original, drawn in Pixi Graphics (logged in docs/ART_SOURCING_LOG.md). Presentation only.

import { Container, Graphics } from 'pixi.js';
import { iso } from './isoMath';

export interface PremisesProp {
  id: string;
  /** Lowest premises tier that shows this prop. */
  minTier: 1 | 2 | 3;
  x: number;
  y: number;
  build: (accent: number) => Container;
}

const wrap = (g: Graphics): Container => {
  const c = new Container();
  c.eventMode = 'none';
  c.addChild(g);
  return c;
};

// --- Tiny isometric box kit (2:1 projection, same as `iso`): u runs along +x, v along +y, z is up. ---
type P3 = [number, number, number];
const pt = (u: number, v: number, z: number): [number, number] => [u - v, (u + v) / 2 - z];
const quad = (g: Graphics, a: P3, b: P3, c: P3, d: P3) => {
  g.poly([pt(...a), pt(...b), pt(...c), pt(...d)].flat());
};

interface BoxColors { top: number; left: number; right: number }

/** Three visible faces of an axis-aligned box: top, front-left (+v) and front-right (+u). */
const isoBox = (g: Graphics, u0: number, v0: number, u1: number, v1: number, z0: number, z1: number, c: BoxColors, edge = 0x000000) => {
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

const LEATHER: BoxColors = { top: 0xb8794a, left: 0x8a5230, right: 0x6a3d22 };
const LEATHER_BACK: BoxColors = { top: 0xa06a40, left: 0x7a4929, right: 0x5f3720 };
const WOOD: BoxColors = { top: 0x7a5636, left: 0x4f3622, right: 0x3b281a };
const NAVY: BoxColors = { top: 0x5a6e8c, left: 0x3f4f68, right: 0x2f3c50 };
const NAVY_BACK: BoxColors = { top: 0x4d5f7a, left: 0x364559, right: 0x28344a };
const LEG: BoxColors = { top: 0x2a1f14, left: 0x2a1f14, right: 0x1a130c };

interface SeatSpec {
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
const buildSeat = (s: SeatSpec): Container => {
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

const buildBench = (): Container =>
  buildSeat({ half: 31, depth: 11, seatZ: 8, backZ: 30, armZ: 18, armW: 5, cushions: 2, frame: WOOD, cushion: LEATHER, back: LEATHER_BACK, legH: 8 });

const buildRack = (): Container => {
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

/** Reception counter: wood front, light top, desk lamp, bell and an accent sign on the front panel. */
const buildReception = (accent: number): Container => {
  const g = new Graphics();
  g.ellipse(0, 4, 42, 10).fill({ color: 0x000000, alpha: 0.3 });
  // Front (left face) and side (right face) panels, top slab
  g.poly([-38, -2, 0, 14, 0, -16, -38, -32]).fill(0x4a3626);
  g.poly([0, 14, 38, -2, 38, -32, 0, -16]).fill(0x3a2a1d);
  g.poly([-38, -32, 0, -16, 38, -32, 0, -48]).fill(0x8a6a48);
  g.poly([-38, -32, 0, -16, 0, -14, -38, -30]).fill(0xb28a5c);
  // Accent sign band on the front panel
  g.poly([-30, -9, -8, 1.5, -8, -9, -30, -20]).fill({ color: accent, alpha: 0.85 });
  for (let i = 0; i < 3; i++) g.moveTo(-26 + i * 7, -13.5 + i * 3.3).lineTo(-22 + i * 7, -11.5 + i * 3.3).stroke({ width: 1.2, color: 0x14151a, alpha: 0.6 });
  // Desk lamp and service bell on the top
  g.circle(14, -46, 2.5).fill(0xffd98a);
  g.moveTo(14, -44).lineTo(14, -40).stroke({ width: 1.2, color: 0x1d1d22 });
  g.ellipse(-8, -34, 4, 1.8).fill(0xc9974a);
  g.ellipse(-8, -36, 2.4, 1.6).fill(0xe8c177);
  return wrap(g);
};

const buildSofa = (accent: number): Container =>
  buildSeat({ half: 38, depth: 13, seatZ: 6, backZ: 36, armZ: 22, armW: 8, cushions: 3, frame: NAVY_BACK, cushion: NAVY, back: NAVY_BACK, legH: 3, accent });

export const PREMISES_PROPS: PremisesProp[] = [
  { id: 'clientBench', minTier: 1, x: 1.9, y: 6.55, build: buildBench },
  { id: 'storageRack', minTier: 1, x: 4.3, y: 0.6, build: buildRack },
  { id: 'reception', minTier: 2, x: 1.15, y: 5.9, build: buildReception },
  { id: 'storageRack2', minTier: 2, x: 5.15, y: 0.6, build: buildRack },
  { id: 'premiumSofa', minTier: 3, x: 5.2, y: 6.9, build: buildSofa },
  { id: 'storageRack3', minTier: 3, x: 6.0, y: 0.6, build: buildRack },
];

export const getPremisesProps = (premisesTier: number): PremisesProp[] =>
  PREMISES_PROPS.filter((p) => p.minTier <= premisesTier);

/** Containers placed on the floor, ready for the caller to depth-sort (`zIndex = depth + y`). */
export const buildPremisesDecor = (premisesTier: number, accent: number): { id: string; y: number; container: Container }[] =>
  getPremisesProps(premisesTier).map((p) => {
    const pos = iso(p.x, p.y);
    const container = p.build(accent);
    container.position.set(pos.x, pos.y);
    container.label = `premises-prop:${p.id}`;
    return { id: p.id, y: pos.y, container };
  });
