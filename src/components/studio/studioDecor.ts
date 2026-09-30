/**
 * Studio decor renderer (Pixi). Draws the room's dressing — plank floor, slab,
 * wainscot, diffusers, trophy wall, era signature props — plus an additive
 * lighting layer with a window shaft, dust motes, lamp pools and a steaming mug.
 *
 * All decisions (which trophies, which era prop, plank/mote layout) come from
 * studioDecorConfig.ts so this file only draws. Every animated element honours
 * `reduceMotion` by freezing to a pleasant static pose.
 */
import { Container, Graphics, Sprite, Texture } from 'pixi.js';
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
  getDayness,
  getMoteSeeds,
  getPlankLayout,
  getTrophyWall,
  type EraDecorSpec,
  type TrophyInput,
} from './studioDecorConfig';

const WALL_TRIM = 0x1d2433;
const BRASS = 0xe6b866;

/* --------------------------------------------------------------- helpers */

/** Soft radial glow faked with stacked ellipses (use in an additive layer). */
const radialGlow = (
  g: Graphics,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: number,
  alpha: number,
  steps = 7,
) => {
  for (let i = 0; i < steps; i++) {
    const k = 1 - i / steps;
    g.ellipse(x, y, rx * k, ry * k).fill({ color, alpha: (alpha / steps) * (1 + i * 0.35) });
  }
};

/** Points of a circle drawn *on* a wall plane (foreshortened along the wall's x axis). */
const wallEllipse = (cx: number, cy: number, r: number, plane: 'left' | 'right', steps = 22): number[] => {
  const ax = plane === 'right' ? 0.894 : -0.894;
  const ay = 0.447;
  const pts: number[] = [];
  for (let i = 0; i < steps; i++) {
    const th = (i / steps) * Math.PI * 2;
    const c = Math.cos(th) * r;
    const s = Math.sin(th) * r;
    pts.push(cx + c * ax, cy + c * ay - s);
  }
  return pts;
};

const starPoints = (cx: number, cy: number, rOuter: number, rInner: number, plane: 'left' | 'right'): number[] => {
  const ax = plane === 'right' ? 0.894 : -0.894;
  const ay = 0.447;
  const pts: number[] = [];
  for (let i = 0; i < 10; i++) {
    const th = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? rOuter : rInner;
    const c = Math.cos(th) * r;
    const s = Math.sin(th) * r;
    pts.push(cx + c * ax, cy + c * ay + s);
  }
  return pts;
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
export const buildRug = (): Graphics => {
  const g = new Graphics();
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

  // Trophy wall
  const slots = getTrophyWall(trophies);
  for (const slot of slots) {
    const x0 = slot.x - 0.24;
    const x1 = slot.x + 0.24;
    const frame = rightWallQuad(x0, x1, 94, 126);
    if (slot.kind === 'empty') {
      g.poly(frame).stroke({ width: 1, color: BRASS, alpha: 0.16 });
      const nail = rightWallPt(slot.x, 132);
      g.circle(nail.x, nail.y, 1.1).fill({ color: BRASS, alpha: 0.3 });
      continue;
    }
    g.poly(frame).fill(0x2a1d14);
    g.poly(frame).stroke({ width: 1.6, color: BRASS, alpha: 0.9 });
    g.poly(rightWallQuad(x0 + 0.04, x1 - 0.04, 98, 122)).fill(0x120d09);
    const mid = rightWallPt(slot.x, 110);
    if (slot.kind === 'award') {
      g.poly(starPoints(mid.x, mid.y, 9, 4, 'right')).fill(BRASS);
      g.poly(starPoints(mid.x, mid.y, 9, 4, 'right')).stroke({ width: 0.8, color: 0xfff1c9, alpha: 0.8 });
    } else {
      const platinum = slot.kind === 'platinum';
      g.poly(wallEllipse(mid.x, mid.y, 10.5, 'right')).fill(platinum ? 0xdfe6ee : 0xe6b866);
      g.poly(wallEllipse(mid.x, mid.y, 10.5, 'right')).stroke({ width: 0.8, color: 0x000000, alpha: 0.4 });
      g.poly(wallEllipse(mid.x, mid.y, 7, 'right')).stroke({ width: 0.6, color: 0x000000, alpha: 0.28 });
      g.poly(wallEllipse(mid.x, mid.y, 4.6, 'right')).stroke({ width: 0.6, color: 0x000000, alpha: 0.24 });
      g.poly(wallEllipse(mid.x, mid.y, 3, 'right')).fill(platinum ? 0x8a3b3b : 0x3a2a20);
      // glint
      g.poly(wallEllipse(mid.x - 3, mid.y - 4, 2, 'right', 10)).fill({ color: 0xffffff, alpha: 0.55 });
    }
  }
  container.addChild(g);

  // Era signature prop (physical parts)
  const propG = new Graphics();
  const prop = propG;
  if (spec.prop === 'brass-lamp') {
    const b = iso(7.55, 2.3);
    prop.ellipse(b.x, b.y, 9, 4).fill(0x2a1c10);
    prop.rect(b.x - 1.2, b.y - 58, 2.4, 58).fill(0xc9974a);
    prop.poly([b.x - 13, b.y - 60, b.x + 13, b.y - 60, b.x + 8, b.y - 76, b.x - 8, b.y - 76]).fill(0xf0cf95);
    prop.poly([b.x - 13, b.y - 60, b.x + 13, b.y - 60, b.x + 8, b.y - 76, b.x - 8, b.y - 76]).stroke({ width: 1, color: 0x8a6531 });
  } else if (spec.prop === 'lava-lamp') {
    const t = iso(7.45, 1.1);
    prop.poly([t.x - 15, t.y - 20, t.x + 15, t.y - 20, t.x + 15, t.y - 12, t.x - 15, t.y - 12]).fill(0x2c2a27);
    prop.rect(t.x - 12, t.y - 12, 3, 12).fill(0x1c1a18);
    prop.rect(t.x + 9, t.y - 12, 3, 12).fill(0x1c1a18);
    prop.roundRect(t.x - 5, t.y - 52, 10, 32, 4).fill({ color: 0xff7a45, alpha: 0.22 });
    prop.roundRect(t.x - 5, t.y - 52, 10, 32, 4).stroke({ width: 1, color: 0xffb08a, alpha: 0.8 });
    prop.rect(t.x - 6, t.y - 22, 12, 4).fill(0x8d8478);
    prop.rect(t.x - 4, t.y - 56, 8, 4).fill(0x8d8478);
  } else if (spec.prop === 'neon-sign') {
    // Backing plate for the neon bolt on the left wall
    g.poly(leftWallQuad(0.25, 1.2, 76, 122)).fill({ color: 0x0d0a12, alpha: 0.95 });
    g.poly(leftWallQuad(0.25, 1.2, 76, 122)).stroke({ width: 1.2, color: 0x2a2233 });
  } else if (spec.prop === 'led-strip') {
    // Ring light on a stand, front-right corner of the window side
    const s = iso(7.3, 1.6);
    prop.ellipse(s.x, s.y, 8, 3.5).fill(0x1a1a1f);
    prop.rect(s.x - 1, s.y - 64, 2, 64).fill(0x2c2c34);
  }
  void tier;
  return { container, props: prop as unknown as Container };
};

/* ------------------------------------------------------------- desk props */

/** Mug + notepad on the console's left edge. Drawn over the desk. */
export const buildDeskProps = (deskH = 40): Container => {
  const c = new Container();
  const g = new Graphics();
  const dPt = (gx: number, gy: number, lift = deskH) => {
    const p = iso(gx, gy);
    return { x: p.x, y: p.y - lift };
  };
  // Notepad
  const n1 = dPt(3.34, 4.62);
  const n2 = dPt(3.62, 4.62);
  const n3 = dPt(3.62, 4.8);
  const n4 = dPt(3.34, 4.8);
  g.poly([n1.x, n1.y, n2.x, n2.y, n3.x, n3.y, n4.x, n4.y]).fill(0xf0e6cf);
  g.poly([n1.x, n1.y, n2.x, n2.y, n3.x, n3.y, n4.x, n4.y]).stroke({ width: 0.6, color: 0x8a7a5a, alpha: 0.7 });
  g.moveTo(n1.x + 3, n1.y + 1.5).lineTo(n2.x - 2, n2.y + 1.5).stroke({ width: 0.6, color: 0x6b7a99, alpha: 0.6 });
  // Mug
  const m = dPt(3.95, 4.78);
  g.ellipse(m.x, m.y + 2, 6.5, 2.6).fill({ color: 0x000000, alpha: 0.28 });
  g.rect(m.x - 5, m.y - 7, 10, 9).fill(0xe8e2d4);
  g.ellipse(m.x, m.y + 2, 5, 2.2).fill(0xe8e2d4);
  g.ellipse(m.x, m.y - 7, 5, 2.2).fill(0x3a1f12);
  g.ellipse(m.x, m.y - 7, 5, 2.2).stroke({ width: 0.8, color: 0xffffff, alpha: 0.6 });
  g.roundRect(m.x + 4, m.y - 5, 3.5, 5, 1.5).stroke({ width: 1.2, color: 0xe8e2d4 });
  c.addChild(g);
  return c;
};

/* --------------------------------------------------------------- lighting */

export interface DecorLightsInput {
  spec: EraDecorSpec;
}

export interface DecorLights {
  container: Container;
  /** `live` = a session is being recorded right now (lights the ON AIR lamp). */
  update: (tSeconds: number, reduceMotion: boolean, live?: boolean) => void;
}

export const buildDecorLights = (input: DecorLightsInput): DecorLights => {
  const { spec } = input;
  const container = new Container();
  container.eventMode = 'none';
  container.blendMode = 'add';

  /* Window light shaft: a soft parallelogram from the window down onto the floor. */
  const shaft = new Container();
  const shaftG = new Graphics();
  const winA = rightWallPt(5.1, 96);
  const winB = rightWallPt(6.9, 96);
  const winC = rightWallPt(6.9, 34);
  const winD = rightWallPt(5.1, 34);
  const f0 = iso(4.15, 3.7);
  const f1 = iso(5.95, 3.9);
  const f2 = iso(6.9, 0.2);
  const f3 = iso(5.1, 0.2);
  // Airborne beam
  shaftG.poly([winA.x, winA.y, winB.x, winB.y, f1.x, f1.y, f0.x, f0.y]).fill({ color: spec.daylight, alpha: 0.035 });
  shaftG.poly([winD.x, winD.y, winC.x, winC.y, f1.x, f1.y, f0.x, f0.y]).fill({ color: spec.daylight, alpha: 0.03 });
  // Floor pool, layered for a soft edge
  for (let i = 0; i < 4; i++) {
    const k = i / 4;
    const lerp = (a: { x: number; y: number }, b: { x: number; y: number }) => ({ x: a.x + (b.x - a.x) * k * 0.28, y: a.y + (b.y - a.y) * k * 0.28 });
    const p0 = lerp(f0, f3);
    const p1 = lerp(f1, f2);
    const p2 = lerp(f2, f1);
    const p3 = lerp(f3, f0);
    shaftG.poly([p0.x, p0.y, p1.x, p1.y, p2.x, p2.y, p3.x, p3.y]).fill({ color: spec.daylight, alpha: 0.045 });
  }
  shaft.addChild(shaftG);
  container.addChild(shaft);

  /* Dust motes drifting through the beam */
  const motes = getMoteSeeds(26, spec.eraId);
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

  /* Lamp pools (warm glow on the floor around the console + rug) */
  const pools = new Graphics();
  const rug = iso(4.5, 4.3);
  radialGlow(pools, rug.x, rug.y + 4, 120, 46, 0xffb45a, 0.10);
  const desk = iso(4.5, 4.05);
  radialGlow(pools, desk.x, desk.y - 42, 70, 26, 0xffd58a, 0.06);
  container.addChild(pools);

  /* Era signature glows */
  const glowG = new Graphics();
  container.addChild(glowG);

  /* ON AIR lamp above the studio door */
  const onAir = new Graphics();
  container.addChild(onAir);
  const airPos = BOOTH_HEADER_LAMP;

  /* Mug steam */
  const steam = new Graphics();
  container.addChild(steam);
  const mugPos = (() => {
    const p = iso(3.95, 4.78);
    return { x: p.x, y: p.y - 40 - 8 };
  })();

  const neonQuad = (u: number, v: number) => {
    const p = leftWallPt(0.25 + u * (1.2 - 0.25), 76 + v * (122 - 76));
    return p;
  };
  // Lightning bolt in (u,v) unit space
  const bolt: Array<[number, number]> = [
    [0.55, 0.92], [0.3, 0.5], [0.48, 0.5], [0.35, 0.1], [0.72, 0.58], [0.53, 0.58], [0.66, 0.92],
  ];

  const update = (t: number, reduce: boolean, live = false) => {
    const day = getDayness(reduce ? 0 : t);
    shaft.alpha = 0.3 + 0.7 * day;

    // Motes
    moteG.clear();
    if (!reduce) {
      for (const m of motes) {
        const s = advanceMote(m, t);
        const p = beamPoint(s.u, s.v);
        moteG.circle(p.x, p.y, m.size).fill({ color: spec.daylight, alpha: 0.55 * s.alpha * (0.4 + 0.6 * day) });
      }
    } else {
      for (const m of motes) {
        const p = beamPoint(m.u, m.v);
        moteG.circle(p.x, p.y, m.size).fill({ color: spec.daylight, alpha: 0.22 });
      }
    }

    // ON AIR lamp
    onAir.clear();
    const pulse = reduce ? 1 : 0.85 + 0.15 * Math.sin(t * 3.2);
    radialGlow(onAir, airPos.x, airPos.y, live ? 22 : 12, live ? 12 : 6, 0xff3b30, (live ? 0.6 : 0.10) * pulse, 5);
    onAir.circle(airPos.x, airPos.y, 2.6).fill({ color: 0xff6a5c, alpha: live ? 0.95 : 0.25 });

    // Era prop glows
    glowG.clear();
    if (spec.prop === 'brass-lamp') {
      const b = iso(7.55, 2.3);
      const f = reduce ? 1 : 0.96 + 0.04 * Math.sin(t * 2.1);
      radialGlow(glowG, b.x, b.y - 66, 34, 24, spec.glow, 0.32 * f, 6);
      radialGlow(glowG, b.x, b.y - 2, 80, 30, spec.glow2, 0.11 * f, 6);
    } else if (spec.prop === 'neon-sign') {
      const flick = reduce ? 1 : Math.sin(t * 23) * Math.sin(t * 7) > 0.93 ? 0.35 : 1;
      const pts = bolt.flatMap(([u, v]) => {
        const p = neonQuad(u, v);
        return [p.x, p.y];
      });
      glowG.poly(pts).stroke({ width: 7, color: spec.glow, alpha: 0.16 * flick });
      glowG.poly(pts).stroke({ width: 3.5, color: spec.glow, alpha: 0.5 * flick });
      glowG.poly(pts).stroke({ width: 1.4, color: 0xffe6fb, alpha: 0.9 * flick });
      const a = neonQuad(0.12, 0.06);
      const b = neonQuad(0.82, 0.06);
      glowG.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ width: 2.4, color: spec.glow2, alpha: 0.7 * flick });
      const wall = leftWallPt(0.72, 96);
      radialGlow(glowG, wall.x, wall.y, 46, 34, spec.glow, 0.13 * flick, 6);
    } else if (spec.prop === 'lava-lamp') {
      const t0 = iso(7.45, 1.1);
      radialGlow(glowG, t0.x, t0.y - 34, 26, 30, spec.glow, 0.25, 6);
      radialGlow(glowG, t0.x, t0.y, 60, 22, spec.glow, 0.09, 5);
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
        glowG.moveTo(r0.x, r0.y).lineTo(r1.x, r1.y).stroke({ width: 5, color, alpha: 0.18 });
        glowG.moveTo(r0.x, r0.y).lineTo(r1.x, r1.y).stroke({ width: 2, color, alpha: 0.85 });
        const l0 = leftWallPt(a0 * ROOM_D, WALL_H - 4);
        const l1 = leftWallPt(a1 * ROOM_D, WALL_H - 4);
        glowG.moveTo(l0.x, l0.y).lineTo(l1.x, l1.y).stroke({ width: 5, color, alpha: 0.18 });
        glowG.moveTo(l0.x, l0.y).lineTo(l1.x, l1.y).stroke({ width: 2, color, alpha: 0.85 });
      }
      const s0 = iso(7.3, 1.6);
      radialGlow(glowG, s0.x, s0.y - 66, 14, 14, 0xffffff, 0.35, 5);
    }

    // Steam
    steam.clear();
    if (!reduce) {
      for (let i = 0; i < 3; i++) {
        const phase = (t * 0.45 + i / 3) % 1;
        const y = mugPos.y - phase * 16;
        const x = mugPos.x + Math.sin(phase * 5 + i * 2) * 2.4;
        steam.circle(x, y, 1.6 + phase * 2.2).fill({ color: 0xffffff, alpha: 0.32 * (1 - phase) });
      }
    }
  };

  update(0, true);
  return { container, update };
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
  // Brass rim, dark inner rim, cream face
  g.poly(ring(R)).fill(0xc9974a);
  g.poly(ring(R)).stroke({ width: 0.8, color: 0x6b4a1c });
  g.poly(ring(R - 2.2)).fill(0x2a1f14);
  g.poly(ring(R - 3.2)).fill(0xf3ead6);
  // Hour ticks (12) and quarter markers
  for (let i = 0; i < 12; i++) {
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
  const c = new Container();
  const g = new Graphics();
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
  g.poly(quad(P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1))).fill(0x2e2521);
  g.poly(quad(P(x0 + 0.08, y0 + 0.08), P(x1 - 0.08, y0 + 0.08), P(x1 - 0.08, y1 - 0.06), P(x0 + 0.08, y1 - 0.06))).stroke({ width: 0.8, color: BRASS, alpha: 0.25 });

  // Foam on the back (right) wall: egg-crate checker
  const cols = 10;
  const rows = 4;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const xa = x0 + ((x1 - x0) * i) / cols;
      const xb = x0 + ((x1 - x0) * (i + 1)) / cols;
      const la = 4 + ((GH - 6) * j) / rows;
      const lb = 4 + ((GH - 6) * (j + 1)) / rows;
      g.poly(rightWallQuad(xa, xb, la, lb)).fill((i + j) % 2 ? 0x241d19 : 0x191411);
    }
  }
  g.poly(rightWallQuad(x0, x1, 0, 4)).fill(0x120e0b);

  // Inner face of the left side wall (x = x0), foam stripes
  for (let j = 0; j < 6; j++) {
    const la = 4 + ((GH - 4) * j) / 6;
    const lb = 4 + ((GH - 4) * (j + 1)) / 6;
    g.poly(quad(P(x0, y0, la), P(x0, y1, la), P(x0, y1, lb), P(x0, y0, lb))).fill(j % 2 ? 0x241d19 : 0x1a1512);
  }

  // Mic stand + pop filter + stool + music stand, deep in the booth
  const base = P(2.25, 0.55);
  g.ellipse(base.x, base.y, 12, 6).fill(0x1b1613);
  g.rect(base.x - 1.6, base.y - 46, 3.2, 46).fill(0x8f98ab);
  g.moveTo(base.x, base.y - 46).lineTo(base.x + 10, base.y - 52).stroke({ width: 2, color: 0x8f98ab });
  g.circle(base.x + 11, base.y - 53, 5.5).fill(BRASS);
  g.circle(base.x + 11, base.y - 53, 5.5).stroke({ width: 1, color: 0x6b4a1c });
  g.circle(base.x + 4, base.y - 50, 8).stroke({ width: 1, color: 0x000000, alpha: 0.7 });
  const stool = P(1.75, 0.7);
  g.ellipse(stool.x, stool.y, 9, 4.2).fill({ color: 0x000000, alpha: 0.3 });
  g.rect(stool.x - 1, stool.y - 18, 2, 18).fill(0x4a4038);
  g.ellipse(stool.x, stool.y - 20, 9, 4.2).fill(0x6b3a2a);
  g.ellipse(stool.x, stool.y - 20, 9, 4.2).stroke({ width: 0.8, color: 0x2a1610 });
  const stand = P(2.85, 0.6);
  g.rect(stand.x - 0.8, stand.y - 38, 1.6, 38).fill(0x3a3f45);
  g.poly([stand.x - 9, stand.y - 42, stand.x + 9, stand.y - 48, stand.x + 9, stand.y - 36, stand.x - 9, stand.y - 30]).fill(0x2f353c);

  // Glass front (y = y1)
  const gl = quad(P(x0, y1), P(x1, y1), P(x1, y1, GH), P(x0, y1, GH));
  g.poly(gl).fill({ color: 0xa6d8e6, alpha: 0.13 });
  // reflection streaks
  g.poly(quad(P(1.35, y1), P(1.6, y1), P(2.05, y1, GH), P(1.8, y1, GH))).fill({ color: 0xffffff, alpha: 0.07 });
  g.poly(quad(P(2.0, y1), P(2.12, y1), P(2.55, y1, GH), P(2.43, y1, GH))).fill({ color: 0xffffff, alpha: 0.05 });
  g.poly(gl).stroke({ width: 1.4, color: 0x9fb1b5, alpha: 0.85 });
  // Posts (left, mid, door jamb, right)
  for (const px of [x0, 1.9, 2.75, x1]) {
    g.poly(quad(P(px - 0.035, y1), P(px + 0.035, y1), P(px + 0.035, y1, H), P(px - 0.035, y1, H))).fill(0x2a2521);
    g.poly(quad(P(px - 0.035, y1), P(px + 0.035, y1), P(px + 0.035, y1, H), P(px - 0.035, y1, H))).stroke({ width: 0.6, color: BRASS, alpha: 0.6 });
  }
  // Door outline + handle between the last two posts
  g.poly(quad(P(2.79, y1, 2), P(x1 - 0.04, y1, 2), P(x1 - 0.04, y1, GH - 2), P(2.79, y1, GH - 2))).stroke({ width: 1, color: 0xcfe0e4, alpha: 0.55 });
  const hdl = P(2.88, y1, 36);
  g.roundRect(hdl.x - 1, hdl.y - 6, 2, 12, 1).fill(BRASS);

  // Header beam across the top of the glass
  g.poly(quad(P(x0, y1, GH), P(x1, y1, GH), P(x1, y1, H), P(x0, y1, H))).fill(0x231b16);
  g.poly(quad(P(x0, y1, GH), P(x1, y1, GH), P(x1, y1, GH + 1.6), P(x0, y1, GH + 1.6))).fill({ color: BRASS, alpha: 0.8 });
  // Nameplate + lamp housing on the header
  g.poly(quad(P(1.35, y1, 76), P(1.95, y1, 76), P(1.95, y1, 83), P(1.35, y1, 83))).fill(0x3a2c1f);
  g.poly(quad(P(1.35, y1, 76), P(1.95, y1, 76), P(1.95, y1, 83), P(1.35, y1, 83))).stroke({ width: 0.7, color: BRASS, alpha: 0.7 });
  const lamp = BOOTH_HEADER_LAMP;
  g.roundRect(lamp.x - 7, lamp.y - 4, 14, 8, 2).fill(0x120d0a);
  g.circle(lamp.x, lamp.y, 2.6).fill(0x5a1a14);

  // Outer face of the right side wall (x = x1), facing the room
  g.poly(quad(P(x1, y0), P(x1, y1), P(x1, y1, H), P(x1, y0, H))).fill(0x3d302a);
  g.poly(quad(P(x1, y0), P(x1, y1), P(x1, y1, 38), P(x1, y0, 38))).fill(0x2a201b);
  g.poly(quad(P(x1, y0, 38), P(x1, y1, 38), P(x1, y1, 41), P(x1, y0, 41))).fill({ color: BRASS, alpha: 0.5 });
  g.poly(quad(P(x1, y0), P(x1, y1), P(x1, y1, H), P(x1, y0, H))).stroke({ width: 1, color: 0x120d09, alpha: 0.8 });

  // Flat roof
  g.poly(quad(P(x0, y0, H), P(x1, y0, H), P(x1, y1, H), P(x0, y1, H))).fill(0x4a3d34);
  g.poly(quad(P(x0 + 0.1, y0 + 0.1, H), P(x1 - 0.1, y0 + 0.1, H), P(x1 - 0.1, y1 - 0.1, H), P(x0 + 0.1, y1 - 0.1, H))).fill(0x54463c);
  g.poly(quad(P(x0, y0, H), P(x1, y0, H), P(x1, y1, H), P(x0, y1, H))).stroke({ width: 1.2, color: 0x120d09, alpha: 0.9 });
  g.poly([P(x0, y1, H).x, P(x0, y1, H).y, P(x1, y1, H).x, P(x1, y1, H).y, P(x1, y1, H).x, P(x1, y1, H).y - 0.1]).stroke({ width: 1.2, color: BRASS, alpha: 0.7 });
  c.addChild(g);
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
