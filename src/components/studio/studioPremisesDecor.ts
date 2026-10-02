// Premises furniture (#70): what the Living Studio gains when you move up.
//   Tier 1 Project Studio: client waiting bench + wall-side storage rack.
//   Tier 2 Commercial Studio: reception counter with a sign, water cooler and a second rack.
// In-house CC0, drawn in Pixi Graphics (logged in docs/ART_SOURCING_LOG.md). Presentation only.

import { Container, Graphics } from 'pixi.js';
import { iso } from './isoMath';

export interface PremisesProp {
  id: string;
  /** Lowest premises tier that shows this prop. */
  minTier: 1 | 2;
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

const buildBench = (): Container => {
  const g = new Graphics();
  g.ellipse(0, 4, 36, 8).fill({ color: 0x000000, alpha: 0.28 });
  g.roundRect(-30, -14, 60, 12, 4).fill(0x6b4a2f);
  g.roundRect(-30, -24, 60, 10, 4).fill(0x8a6340);
  g.rect(-26, -2, 5, 8).fill(0x2a1f14);
  g.rect(21, -2, 5, 8).fill(0x2a1f14);
  return wrap(g);
};

const buildRack = (): Container => {
  const g = new Graphics();
  g.ellipse(0, 2, 20, 6).fill({ color: 0x000000, alpha: 0.28 });
  g.rect(-16, -58, 32, 58).fill(0x2b3039);
  g.rect(-16, -58, 32, 58).stroke({ width: 2, color: 0x4c5769 });
  for (let i = 0; i < 4; i++) {
    g.rect(-13, -54 + i * 13, 26, 9).fill(0x3d4452);
    g.circle(9, -49.5 + i * 13, 1.8).fill(i % 2 ? 0x59d98a : 0xf0b84a);
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

const buildCooler = (): Container => {
  const g = new Graphics();
  g.ellipse(0, 2, 11, 4).fill({ color: 0x000000, alpha: 0.28 });
  g.roundRect(-7, -26, 14, 26, 2).fill(0xdfe5ee);
  g.roundRect(-7, -26, 14, 26, 2).stroke({ width: 1, color: 0x9aa5b5 });
  g.circle(0, -38, 7).fill({ color: 0x7fc8ff, alpha: 0.75 });
  g.rect(-7, -40, 14, 3).fill({ color: 0xffffff, alpha: 0.2 });
  g.rect(-2, -20, 4, 3).fill(0x4a90d9);
  return wrap(g);
};

export const PREMISES_PROPS: PremisesProp[] = [
  { id: 'clientBench', minTier: 1, x: 2.9, y: 6.7, build: buildBench },
  { id: 'storageRack', minTier: 1, x: 4.3, y: 0.6, build: buildRack },
  { id: 'reception', minTier: 2, x: 1.15, y: 5.9, build: buildReception },
  { id: 'waterCooler', minTier: 2, x: 7.2, y: 6.45, build: buildCooler },
  { id: 'storageRack2', minTier: 2, x: 5.15, y: 0.6, build: buildRack },
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
