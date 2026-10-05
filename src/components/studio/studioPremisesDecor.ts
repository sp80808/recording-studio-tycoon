// Premises furniture (#70): what the Living Studio gains when you move up.
//   Tier 1 Project Studio: client waiting bench + wall-side storage rack.
//   Tier 2 Commercial Studio: reception counter with a sign and a second rack.
//   Tier 3 Multi-room Facility: premium client sofa and a third rack bay.
// In-house proprietary original, drawn in Pixi Graphics (logged in docs/ART_SOURCING_LOG.md). Presentation only.

import { Container, Graphics } from 'pixi.js';
import { iso } from './isoMath';
import { archetypePropId } from '@/rpg/premisesAffordance';
import { buildRack, buildSeat, isoBox, LEATHER, LEATHER_BACK, NAVY, NAVY_BACK, pt, quad, WOOD, wrap } from './studioIsoKit';

export interface PremisesProp {
  id: string;
  /** Lowest premises tier that shows this prop. */
  minTier: 1 | 2 | 3;
  x: number;
  y: number;
  build: (accent: number) => Container;
}

const buildBench = (): Container =>
  buildSeat({ half: 31, depth: 11, seatZ: 8, backZ: 30, armZ: 18, armW: 5, cushions: 2, frame: WOOD, cushion: LEATHER, back: LEATHER_BACK, legH: 8 });

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

/** Writing nook (project room): small desk with a keyboard and a lamp. */
const buildWritingNook = (accent: number): Container => {
  const g = new Graphics();
  g.ellipse(0, 3, 24, 8).fill({ color: 0x000000, alpha: 0.28 });
  isoBox(g, -14, -8, 14, 8, 14, 18, WOOD, 0x000000);
  for (const [u, v] of [[-12, -6], [12, -6], [-12, 6], [12, 6]]) isoBox(g, u - 1, v - 1, u + 1, v + 1, 0, 14, { top: 0x2a1f14, left: 0x2a1f14, right: 0x1a130c });
  isoBox(g, -9, -3, 7, 3, 18, 20, { top: 0x23262d, left: 0x16181d, right: 0x101216 });
  for (let i = 0; i < 6; i++) {
    const k = pt(-8 + i * 2.6, 0, 20.2);
    g.circle(k[0], k[1], 0.9).fill(i % 3 === 0 ? accent : 0xd8d2c4);
  }
  const l = pt(11, -5, 18);
  g.moveTo(l[0], l[1]).lineTo(l[0], l[1] - 14).stroke({ width: 1.4, color: 0x1d1d22 });
  g.circle(l[0], l[1] - 15, 3).fill(0xffd98a);
  return wrap(g);
};

/** Gear bench (basement): workbench with a half-opened unit, a vice and a task lamp. */
const buildGearBench = (): Container => {
  const g = new Graphics();
  g.ellipse(0, 3, 30, 9).fill({ color: 0x000000, alpha: 0.28 });
  isoBox(g, -22, -7, 22, 7, 16, 20, { top: 0x6b6f78, left: 0x3f434b, right: 0x2e3238 }, 0x000000);
  for (const u of [-20, 20]) isoBox(g, u - 1.5, -6, u + 1.5, 6, 0, 16, { top: 0x2f3239, left: 0x2f3239, right: 0x1e2025 });
  isoBox(g, -12, -4, 2, 4, 20, 25, { top: 0x4a5262, left: 0x2b3039, right: 0x1e232b }, 0x7d8aa3);
  const f = pt(-5, 4, 24);
  g.circle(f[0], f[1], 1.6).fill(0xf0b84a);
  isoBox(g, 10, -3, 15, 3, 20, 24, { top: 0x9aa0ad, left: 0x6c7280, right: 0x555a66 });
  const l = pt(18, -5, 20);
  g.moveTo(l[0], l[1]).lineTo(l[0] - 4, l[1] - 14).stroke({ width: 1.3, color: 0x1d1d22 });
  g.circle(l[0] - 4, l[1] - 15, 2.8).fill(0xffd98a);
  return wrap(g);
};

/** Rehearsal riser (warehouse): low stage platform with a kick drum, cymbals and an amp. */
const buildDrumRiser = (accent: number): Container => {
  const g = new Graphics();
  g.ellipse(0, 4, 44, 12).fill({ color: 0x000000, alpha: 0.3 });
  isoBox(g, -34, -22, 34, 22, 0, 7, { top: 0x5a4430, left: 0x3b2c1f, right: 0x2a1f16 }, 0x000000);
  isoBox(g, 6, -16, 22, -4, 7, 33, { top: 0x2a2d34, left: 0x1d1f24, right: 0x14161a });
  const sp = pt(14, -4, 18);
  g.circle(sp[0], sp[1], 4).fill(0x3a3e47);
  const kick = pt(-14, 0, 14);
  g.ellipse(kick[0], kick[1], 9, 11).fill(0x1d1f24).stroke({ width: 1.5, color: accent });
  for (const [u, v, z] of [[-22, -8, 22], [-8, -12, 24], [-26, 6, 18]] as const) {
    const c = pt(u, v, z);
    g.ellipse(c[0], c[1], 7, 2.6).fill(0xe8c177);
    g.moveTo(c[0], c[1]).lineTo(c[0], c[1] + z - 7).stroke({ width: 1, color: 0x14151a, alpha: 0.8 });
  }
  return wrap(g);
};

/** On-air sign (commercial): illuminated accent sign bracketed to the back wall. */
const buildOnAirSign = (accent: number): Container => {
  const g = new Graphics();
  isoBox(g, -18, -2, 18, 2, 50, 62, { top: 0x2a2d34, left: 0x1d1f24, right: 0x14161a });
  quad(g, [-16, 2, 52], [16, 2, 52], [16, 2, 60], [-16, 2, 60]);
  g.fill({ color: accent, alpha: 0.9 });
  for (let i = 0; i < 4; i++) {
    const a = pt(-12 + i * 8, 2.1, 56);
    g.circle(a[0], a[1], 1.8).fill(0xffffff);
  }
  const glow = pt(0, 2, 56);
  g.ellipse(glow[0], glow[1], 30, 12).fill({ color: accent, alpha: 0.12 });
  return wrap(g);
};

/** Record wall (existing studio): framed gold records on the back wall. */
const buildRecordWall = (): Container => {
  const g = new Graphics();
  for (let i = 0; i < 3; i++) {
    const u = -22 + i * 22;
    isoBox(g, u - 8, -1, u + 8, 1, 42, 62, { top: 0x4a3626, left: 0x3a2a1d, right: 0x2a1f16 });
    const c = pt(u, 1.2, 52);
    g.ellipse(c[0], c[1], 7, 4.2).fill(0xe6b866);
    g.ellipse(c[0], c[1], 2, 1.2).fill(0x3a2a1d);
  }
  return wrap(g);
};

/** One visible prop per property archetype (#250). Ids match `ARCHETYPE_AFFORDANCES`. */
const ARCHETYPE_PROPS: Record<string, Omit<PremisesProp, 'minTier'>> = {
  writingNook: { id: 'writingNook', x: 6.3, y: 6.5, build: buildWritingNook },
  gearBench: { id: 'gearBench', x: 2.6, y: 0.8, build: buildGearBench },
  drumRiser: { id: 'drumRiser', x: 6.4, y: 4.4, build: buildDrumRiser },
  onAirSign: { id: 'onAirSign', x: 2.2, y: 0.5, build: buildOnAirSign },
  recordWall: { id: 'recordWall', x: 2.8, y: 0.5, build: buildRecordWall },
};

export const PREMISES_PROPS: PremisesProp[] = [
  { id: 'clientBench', minTier: 1, x: 1.9, y: 6.55, build: buildBench },
  { id: 'storageRack', minTier: 1, x: 4.3, y: 0.6, build: buildRack },
  { id: 'reception', minTier: 2, x: 1.15, y: 5.9, build: buildReception },
  { id: 'storageRack2', minTier: 2, x: 5.15, y: 0.6, build: buildRack },
  { id: 'premiumSofa', minTier: 3, x: 5.2, y: 6.9, build: buildSofa },
  { id: 'storageRack3', minTier: 3, x: 6.0, y: 0.6, build: buildRack },
];

/** Band furniture plus, when a property archetype was chosen (#250), its one visible affordance prop. */
export const getPremisesProps = (premisesTier: number, archetype?: unknown): PremisesProp[] => {
  const props = PREMISES_PROPS.filter((p) => p.minTier <= premisesTier);
  const extraId = archetypePropId(archetype, premisesTier);
  const extra = extraId ? ARCHETYPE_PROPS[extraId] : undefined;
  return extra ? [...props, { ...extra, minTier: 1 }] : props;
};

/** Containers placed on the floor, ready for the caller to depth-sort (`zIndex = depth + y`). */
export const buildPremisesDecor = (premisesTier: number, accent: number, archetype?: unknown): { id: string; y: number; container: Container }[] =>
  getPremisesProps(premisesTier, archetype).map((p) => {
    const pos = iso(p.x, p.y);
    const container = p.build(accent);
    container.position.set(pos.x, pos.y);
    container.label = `premises-prop:${p.id}`;
    return { id: p.id, y: pos.y, container };
  });
