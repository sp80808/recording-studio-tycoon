// Isometric Pixi scene for the extra studio rooms (#248), built from a RoomLayoutProfile.
// Runs inside the one shared Pixi Application owned by WebGLCanvas: this module only builds a Container
// tree (static Graphics, no filters, no textures, no tickers) plus a tiny `tick` for the on-air lamp.
// In-house proprietary original, Pixi Graphics only (logged in docs/ART_SOURCING_LOG.md).
import { Container, Graphics } from 'pixi.js';
import { iso, isoQuad, WALL_H as ROOM_WALL_H } from './isoMath';
import { buildRack, buildSeat, isoBox, NAVY, NAVY_BACK, pt, quad, wrap, type BoxColors } from './studioIsoKit';
import { getDaynessFromClockMinutes, getWindowSkyColor } from './studioDecorConfig';
import { buildWindowView, type WindowView } from './studioWindowView';
import { PROP_METRICS, ROOM_WINDOW_LIFT, type RoomHotspotId, type RoomLayoutProfile, type RoomPropSpec, type RoomWallSpec } from './roomLayouts';

export interface RoomSceneOptions {
  /** A project is booked into this room right now. */
  occupied: boolean;
  seed: string | number;
  /** Picks the window skyline (#291). */
  cityId?: string;
  /** Era/city grade blended into the room palette so rooms still age with the studio. */
  /** Studio clock (minutes of day) used for the first paint of the window; the ticker keeps it live afterwards. */
  clockMinutes?: number;
  /** Added to every prop's zIndex so figures staged by the caller sort against props on one depth scale. */
  depthBase?: number;
  tint?: { wallLeft: number; wallRight: number; accent: number };
  /** Hotspot wiring supplied by WebGLCanvas (hover glow, gamepad anchors, selection). Optional for headless use. */
  addHotspot?: (id: RoomHotspotId, hit: Graphics, visual: Container, zIndex: number, parent: Container) => void;
}

export interface RoomSceneBuild {
  root: Container;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  /** Animates the on-air lamp. Cheap: touches one Graphics alpha. */
  tick: (seconds: number, reduceMotion: boolean) => void;
  hotspotIds: RoomHotspotId[];
  /** Sun, moon, stars and skyline seen through the room's window. */
  windowView: WindowView;
  /** Repaints the window glass (sky colour from the studio clock). */
  setWindowSky: (color: number) => void;
  /** Number of display objects in the tree (used by the performance budget check). */
  objectCount: () => number;
}

const mix = (a: number, b: number, t: number): number => {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  const r = Math.round(ar + (br - ar) * t), g = Math.round(ag + (bg - ag) * t), bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
};
const shade = (c: number, t: number): number => (t >= 0 ? mix(c, 0xffffff, t) : mix(c, 0x000000, -t));
const boxOf = (c: number): BoxColors => ({ top: shade(c, 0.18), left: c, right: shade(c, -0.28) });

const hash = (s: string | number): number => {
  let h = 2166136261;
  for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
};
const rng = (seed: number) => () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };

/* ------------------------------------------------------------------ props */

const cyl = (g: Graphics, cx: number, cy: number, rx: number, ry: number, h: number, side: number, top: number) => {
  g.ellipse(cx, cy + h, rx, ry).fill(shade(side, -0.25));
  g.rect(cx - rx, cy, rx * 2, h).fill(side);
  g.ellipse(cx, cy, rx, ry).fill(top);
  g.ellipse(cx, cy, rx, ry).stroke({ width: 1, color: 0x000000, alpha: 0.25 });
};

const paintDrumKit = (): Container => {
  const g = new Graphics();
  g.ellipse(0, 8, 46, 17).fill({ color: 0x000000, alpha: 0.3 });
  // Hardware first (behind the shells)
  g.moveTo(-34, 2).lineTo(-34, -34).stroke({ width: 1.6, color: 0x9aa3b0 });
  g.moveTo(26, 0).lineTo(26, -58).stroke({ width: 1.6, color: 0x9aa3b0 });
  g.moveTo(34, 2).lineTo(34, -30).stroke({ width: 1.6, color: 0x9aa3b0 });
  // Kick drum: shell, batter head and logo ring
  g.ellipse(2, -6, 17, 19).fill(0x7a1f26);
  g.ellipse(-1, -8, 16, 18).fill(0xb23a3a);
  g.ellipse(-1, -8, 12, 14).fill(0xe8dcc0);
  g.ellipse(-1, -8, 4, 5).fill(0x2b2b30);
  // Rack toms on the kick
  cyl(g, -10, -42, 10, 4.5, 8, 0x8f2a31, 0xe8dcc0);
  cyl(g, 10, -44, 10, 4.5, 8, 0x8f2a31, 0xe8dcc0);
  // Snare and floor tom
  cyl(g, -26, -22, 10, 5, 8, 0xc9cdd6, 0xf1ead6);
  cyl(g, 26, -14, 12, 6, 12, 0x8f2a31, 0xe8dcc0);
  // Cymbals
  g.ellipse(-34, -36, 12, 3.4).fill(0xd9b25a);
  g.ellipse(-34, -34, 12, 3.4).stroke({ width: 1, color: 0x8a6a2a, alpha: 0.7 });
  g.ellipse(26, -60, 14, 4).fill(0xe6c36a);
  g.ellipse(34, -32, 13, 3.6).fill(0xcfa94e);
  // Throne
  g.ellipse(8, 14, 9, 4).fill(0x1d1d22);
  g.rect(4, 8, 8, 6).fill(0x2c2c33);
  return wrap(g);
};

const paintAmpStack = (): Container => {
  const g = new Graphics();
  g.ellipse(0, 4, 24, 10).fill({ color: 0x000000, alpha: 0.3 });
  const cab: BoxColors = { top: 0x2c2e38, left: 0x1e2028, right: 0x14151a };
  isoBox(g, -13, -9, 13, 9, 0, 28, cab, 0x6a6f80);
  isoBox(g, -13, -9, 13, 9, 28, 56, cab, 0x6a6f80);
  for (const z0 of [3, 31]) {
    quad(g, [-10, 9, z0], [10, 9, z0], [10, 9, z0 + 22], [-10, 9, z0 + 22]);
    g.fill(0x3a3430);
    for (const u of [-4.5, 4.5]) {
      const c = pt(u, 9, z0 + 11);
      g.circle(c[0], c[1], 4.2).fill(0x14120f);
      g.circle(c[0], c[1], 1.4).fill(0x4a443d);
    }
  }
  isoBox(g, -13, -8, 13, 8, 56, 68, { top: 0x3a3d4a, left: 0x272a33, right: 0x1a1c22 }, 0x8a90a2);
  for (let i = 0; i < 5; i++) {
    const c = pt(-9 + i * 4.5, 8, 62);
    g.circle(c[0], c[1], 1.4).fill(i % 2 ? 0xe8dcc0 : 0xd9a441);
  }
  const led = pt(10, 8, 62);
  g.circle(led[0], led[1], 1.2).fill(0xff5a4a);
  return wrap(g);
};

const paintStageBox = (): Container => {
  const g = new Graphics();
  g.ellipse(0, 3, 22, 9).fill({ color: 0x000000, alpha: 0.28 });
  isoBox(g, -13, -10, 13, 10, 0, 18, { top: 0x6b7280, left: 0x4b5160, right: 0x363b47 }, 0xd0d5e0);
  for (let i = 0; i < 6; i++) {
    const c = pt(-9.5 + i * 3.8, 10, 10);
    g.circle(c[0], c[1], 1.5).fill(i % 3 === 0 ? 0xe05c5c : i % 3 === 1 ? 0xf0b84a : 0x59d98a);
    g.circle(c[0], c[1], 0.6).fill(0x101216);
  }
  const hinge = pt(0, 0, 18.4);
  g.moveTo(hinge[0] - 10, hinge[1]).lineTo(hinge[0] + 10, hinge[1]).stroke({ width: 1, color: 0x2a2e38, alpha: 0.6 });
  return wrap(g);
};

const paintMicBoom = (): Container => {
  const g = new Graphics();
  g.ellipse(0, 3, 10, 4).fill({ color: 0x000000, alpha: 0.3 });
  g.ellipse(0, 1, 7, 3).fill(0x1d1d22);
  g.moveTo(0, 0).lineTo(0, -62).stroke({ width: 2, color: 0x2a2a31 });
  g.moveTo(0, -62).lineTo(14, -72).stroke({ width: 1.8, color: 0x2a2a31 });
  g.roundRect(11, -80, 6, 13, 3).fill(0x3a3f4d);
  g.roundRect(12, -79, 4, 5, 2).fill(0x8a90a2);
  return wrap(g);
};

const paintMicStand = (): Container => {
  const g = new Graphics();
  g.ellipse(0, 4, 20, 8).fill({ color: 0x000000, alpha: 0.3 });
  for (const [x, y] of [[-14, 5], [14, 5], [0, -3]]) g.moveTo(0, -4).lineTo(x, y).stroke({ width: 2, color: 0x1d1d22 });
  g.moveTo(0, -4).lineTo(0, -62).stroke({ width: 2.4, color: 0x1d1d22 });
  g.moveTo(0, -62).quadraticCurveTo(10, -68, 14, -74).stroke({ width: 2, color: 0x1d1d22 });
  // Shock mount, large-diaphragm capsule and gold grille
  g.roundRect(10, -92, 10, 20, 5).fill(0x14151a);
  g.roundRect(11.5, -90, 7, 12, 3.5).fill(0xc9974a);
  g.roundRect(12.5, -88, 2, 8, 1).fill({ color: 0xffe3a3, alpha: 0.7 });
  // Pop filter: ring, mesh and arm
  g.ellipse(27, -80, 6, 11).fill({ color: 0x9aa5b5, alpha: 0.2 });
  g.ellipse(27, -80, 6, 11).stroke({ width: 1.2, color: 0xaeb7c5, alpha: 0.9 });
  g.moveTo(20, -76).lineTo(0, -48).stroke({ width: 1.2, color: 0x1d1d22 });
  return wrap(g);
};

const paintHeadphoneStand = (): Container => {
  const g = new Graphics();
  g.ellipse(0, 2, 9, 4).fill({ color: 0x000000, alpha: 0.3 });
  g.ellipse(0, 0, 6, 2.6).fill(0x2a2a31);
  g.moveTo(0, 0).lineTo(0, -34).stroke({ width: 2, color: 0x3a3a42 });
  g.moveTo(-9, -36).quadraticCurveTo(0, -52, 9, -36).stroke({ width: 2.4, color: 0xe6b866 });
  g.roundRect(-12, -38, 6, 11, 3).fill(0x18181b);
  g.roundRect(6, -38, 6, 11, 3).fill(0x18181b);
  return wrap(g);
};

const paintDesk = (accent: number): Container => {
  const g = new Graphics();
  g.ellipse(0, 4, 36, 13).fill({ color: 0x000000, alpha: 0.28 });
  const wood: BoxColors = { top: 0x8a6a48, left: 0x5a4430, right: 0x41301f };
  isoBox(g, -28, -11, -24, 11, 0, 26, wood);
  isoBox(g, 24, -11, 28, 11, 0, 26, wood);
  isoBox(g, -28, -12, 28, 12, 26, 30, wood);
  // Monitor with a glowing screen, keyboard and the cue box
  isoBox(g, -10, -5, 8, -3, 30, 50, { top: 0x2a2c34, left: 0x16171c, right: 0x0f1014 });
  quad(g, [-8.5, -3, 32], [6.5, -3, 32], [6.5, -3, 48], [-8.5, -3, 48]);
  g.fill({ color: accent, alpha: 0.55 });
  isoBox(g, -8, 2, 6, 7, 30, 31.5, { top: 0x3a3d48, left: 0x2a2c34, right: 0x1c1d22 });
  isoBox(g, 15, 0, 24, 8, 30, 34, { top: 0x4a4f5e, left: 0x343845, right: 0x252832 });
  for (let i = 0; i < 3; i++) {
    const c = pt(17.5 + i * 2.8, 8, 32);
    g.circle(c[0], c[1], 0.9).fill(0xe8dcc0);
  }
  return wrap(g);
};

const paintConsole = (): Container => {
  const g = new Graphics();
  g.ellipse(0, 6, 54, 20).fill({ color: 0x000000, alpha: 0.3 });
  const body: BoxColors = { top: 0x2f333c, left: 0x1d2027, right: 0x14161b };
  isoBox(g, -42, -18, 42, 18, 0, 26, body, 0x6a6f80);
  // Sloped working surface plus the meter bridge at the back
  quad(g, [-42, -18, 34], [42, -18, 34], [42, 18, 28], [-42, 18, 28]);
  g.fill(0x3a3f4a);
  quad(g, [-42, 18, 28], [42, 18, 28], [42, 18, 26], [-42, 18, 26]);
  g.fill(0x252830);
  isoBox(g, -42, -18, 42, -10, 34, 52, { top: 0x20232b, left: 0x181a20, right: 0x101216 });
  const caps = [0x59d98a, 0xf0b84a, 0x5aa9e6, 0xe05c5c];
  for (let i = 0; i < 16; i++) {
    const u = -39 + i * 5.2;
    const slot = [pt(u, 2, 31), pt(u + 1.6, 2, 31), pt(u + 1.6, 14, 28.6), pt(u, 14, 28.6)].flat();
    g.poly(slot).fill(0x14161b);
    const capV = 5 + ((i * 7) % 8);
    const capZ = 31 - (capV - 2) * 0.2;
    const cap = [pt(u - 0.4, capV, capZ + 0.6), pt(u + 2, capV, capZ + 0.6), pt(u + 2, capV + 2.6, capZ + 0.2), pt(u - 0.4, capV + 2.6, capZ + 0.2)].flat();
    g.poly(cap).fill(caps[i % 4]);
    // Meter ladder on the bridge face
    const lit = 2 + ((i * 5) % 5);
    for (let k = 0; k < 6; k++) {
      const c = pt(u + 0.8, -10, 37 + k * 2.4);
      g.rect(c[0] - 1.2, c[1] - 0.8, 2.4, 1.6).fill(k < lit ? (k > 3 ? 0xe05c5c : 0x59d98a) : 0x2a2d35);
    }
  }
  return wrap(g);
};

const paintNearfield = (): Container => {
  const g = new Graphics();
  g.ellipse(0, 3, 12, 5).fill({ color: 0x000000, alpha: 0.3 });
  isoBox(g, -4, -4, 4, 4, 0, 4, { top: 0x2a2c34, left: 0x1d1f26, right: 0x14151a });
  isoBox(g, -1.2, -1.2, 1.2, 1.2, 4, 40, { top: 0x2a2c34, left: 0x1d1f26, right: 0x14151a });
  isoBox(g, -8, -7, 8, 7, 40, 72, { top: 0x2c2e38, left: 0x1b1d24, right: 0x111217 }, 0x6a6f80);
  const w = pt(0, 7, 53);
  g.circle(w[0], w[1], 5.6).fill(0x0c0d10);
  g.circle(w[0], w[1], 3.6).fill(0x2a2d36);
  g.circle(w[0], w[1], 1.2).fill(0x5a5f70);
  const t = pt(0, 7, 66);
  g.circle(t[0], t[1], 1.9).fill(0x3a3f4d);
  return wrap(g);
};

const paintBassTrap = (): Container => {
  const g = new Graphics();
  g.ellipse(0, 3, 14, 6).fill({ color: 0x000000, alpha: 0.3 });
  isoBox(g, -8, -8, 8, 8, 0, 96, { top: 0x4a4440, left: 0x37332f, right: 0x28251f }, 0x7a736b);
  for (let z = 8; z < 96; z += 10) {
    const a = pt(-8, 8, z);
    const b = pt(8, 8, z);
    const c = pt(8, -8, z);
    g.moveTo(a[0], a[1]).lineTo(b[0], b[1]).lineTo(c[0], c[1]).stroke({ width: 1, color: 0x000000, alpha: 0.2 });
  }
  return wrap(g);
};

const paintPlant = (): Container => {
  const g = new Graphics();
  g.ellipse(0, 3, 11, 5).fill({ color: 0x000000, alpha: 0.28 });
  isoBox(g, -6, -6, 6, 6, 0, 12, { top: 0x5a3a28, left: 0x7a4f35, right: 0x5a3a28 });
  const leaf = [[-14, -38, 0x3f7a4a], [14, -42, 0x4a8a56], [0, -52, 0x56985f], [-8, -30, 0x356a3f], [10, -30, 0x3f7a4a]] as const;
  for (const [x, y, c] of leaf) g.poly([0, -10, x - 4, y + 10, x, y, x + 4, y + 10]).fill(c);
  return wrap(g);
};

const paintLamp = (accent: number): Container => {
  const g = new Graphics();
  g.ellipse(0, 3, 9, 4).fill({ color: 0x000000, alpha: 0.28 });
  g.moveTo(0, 0).lineTo(0, -62).stroke({ width: 2, color: 0x2a2018 });
  g.ellipse(0, -66, 10, 5).fill(0xf0d9a0);
  g.rect(-9, -72, 18, 6).fill(0xe3c887);
  g.ellipse(0, -72, 9, 3.4).fill(shade(accent, 0.5));
  return wrap(g);
};

const paintRug = (profile: RoomLayoutProfile, spec: RoomPropSpec): Container => {
  const g = new Graphics();
  const m = PROP_METRICS.rug;
  const w = spec.w ?? m.w, d = spec.d ?? m.d;
  isoQuad(g, spec.x - w / 2, spec.y - d / 2, spec.x + w / 2, spec.y + d / 2);
  g.fill(profile.palette.rug);
  isoQuad(g, spec.x - w / 2 + 0.18, spec.y - d / 2 + 0.18, spec.x + w / 2 - 0.18, spec.y + d / 2 - 0.18);
  g.stroke({ width: 1.4, color: shade(profile.palette.rug, 0.35), alpha: 0.7 });
  isoQuad(g, spec.x - w / 2 + 0.4, spec.y - d / 2 + 0.4, spec.x + w / 2 - 0.4, spec.y + d / 2 - 0.4);
  g.fill({ color: shade(profile.palette.rug, 0.12), alpha: 0.8 });
  const c = new Container();
  c.eventMode = 'none';
  c.addChild(g);
  return c;
};

const paintProp = (profile: RoomLayoutProfile, spec: RoomPropSpec, accent: number): Container => {
  switch (spec.kind) {
    case 'drumKit': return paintDrumKit();
    case 'ampStack': return paintAmpStack();
    case 'stageBox': return paintStageBox();
    case 'micBoom': return paintMicBoom();
    case 'micStand': return paintMicStand();
    case 'headphoneStand': return paintHeadphoneStand();
    case 'desk': return paintDesk(accent);
    case 'console': return paintConsole();
    case 'nearfield': return paintNearfield();
    case 'rack': return buildRack();
    case 'bassTrap': return paintBassTrap();
    case 'plant': return paintPlant();
    case 'lamp': return paintLamp(accent);
    case 'sofa': return buildSeat({ half: 28, depth: 12, seatZ: 7, backZ: 32, armZ: 19, armW: 6, cushions: 2, frame: NAVY_BACK, cushion: NAVY, back: NAVY_BACK, legH: 3, accent });
    case 'rug': return paintRug(profile, spec);
  }
};

/* ------------------------------------------------------------------ shell */

const wallPt = (side: 'left' | 'right', t: number, lift: number) => {
  const p = side === 'right' ? iso(t, 0) : iso(0, t);
  return [p.x, p.y - lift] as const;
};

const paintWallTreatment = (g: Graphics, w: RoomWallSpec, base: number, rand: () => number) => {
  const l0 = w.lift0 ?? 24;
  const l1 = w.lift1 ?? 108;
  const quadAt = (t0: number, t1: number, a: number, b: number) => {
    const p = [wallPt(w.side, t0, a), wallPt(w.side, t1, a), wallPt(w.side, t1, b), wallPt(w.side, t0, b)];
    return p.flat() as number[];
  };
  if (w.kind === 'panel') {
    g.poly(quadAt(w.from, w.to, l0, l1)).fill(shade(base, -0.18));
    g.poly(quadAt(w.from + 0.08, w.to - 0.08, l0 + 5, l1 - 5)).fill(shade(base, 0.08));
    g.poly(quadAt(w.from + 0.08, w.to - 0.08, l0 + 5, l1 - 5)).stroke({ width: 1.2, color: 0x000000, alpha: 0.3 });
    return;
  }
  if (w.kind === 'brick') {
    g.poly(quadAt(w.from, w.to, l0, l1)).fill(shade(base, -0.05));
    const rows = Math.floor((l1 - l0) / 9);
    for (let r = 0; r < rows; r++) {
      const a = l0 + r * 9;
      const off = (r % 2) * 0.12;
      for (let t = w.from + off; t < w.to; t += 0.24) {
        const t1 = Math.min(w.to, t + 0.22);
        if (t1 - t < 0.05) continue;
        g.poly(quadAt(Math.max(w.from, t), t1, a + 0.8, a + 8)).fill(shade(base, rand() * 0.14 - 0.04));
      }
    }
    return;
  }
  const step = w.kind === 'foam' ? 0.34 : 0.22;
  const rows = w.kind === 'foam' ? Math.max(1, Math.floor((l1 - l0) / 20)) : 1;
  const rowH = (l1 - l0) / rows;
  for (let r = 0; r < rows; r++) {
    const a = l0 + r * rowH;
    let i = 0;
    for (let t = w.from; t < w.to - 0.02; t += step, i++) {
      const t1 = Math.min(w.to, t + step);
      if (w.kind === 'foam') {
        const tone = (i + r) % 2 ? 0x353a45 : 0x2b2f38;
        g.poly(quadAt(t, t1, a + 1, a + rowH - 1)).fill(tone);
        const mid = (t + t1) / 2;
        g.poly([...wallPt(w.side, t, a + 1), ...wallPt(w.side, mid, a + rowH * 0.5), ...wallPt(w.side, t, a + rowH - 1)]).fill({ color: 0xffffff, alpha: 0.07 });
        g.poly(quadAt(t, t1, a + 1, a + rowH - 1)).stroke({ width: 0.8, color: 0x0e1014, alpha: 0.7 });
      } else {
        const hgt = l0 + (l1 - l0) * (0.55 + ((i * 37) % 10) / 22);
        g.poly(quadAt(t, t1, l0, hgt)).fill(shade(0x6b5440, ((i * 13) % 7) / 20 - 0.1));
        g.poly(quadAt(t, t1, l0, hgt)).stroke({ width: 0.8, color: 0x1a120c, alpha: 0.6 });
      }
    }
  }
};

const buildWindow = (profile: RoomLayoutProfile, pal: RoomLayoutProfile['palette'], seed: number, minutes: number, cityId?: string) => {
  const { side, from, to } = profile.window;
  const { bottom, top } = ROOM_WINDOW_LIFT;
  // buildWindowView wants the left-then-right glass corners; the left wall runs right-to-left in screen x.
  const a = side === 'right' ? iso(from, 0) : iso(0, to);
  const b = side === 'right' ? iso(to, 0) : iso(0, from);
  const poly = [a.x, a.y - top, b.x, b.y - top, b.x, b.y - bottom, a.x, a.y - bottom];
  const wrapC = new Container();
  const pane = new Graphics();
  const setSky = (color: number) => { pane.clear(); pane.poly(poly).fill(color); };
  setSky(getWindowSkyColor(minutes));
  wrapC.addChild(pane);
  const view = buildWindowView(a, b, bottom, top, seed, cityId);
  view.update(minutes, getDaynessFromClockMinutes(minutes), 0, false);
  wrapC.addChild(view.container);
  const frame = new Graphics();
  frame.poly(poly).stroke({ width: 3.5, color: pal.trim });
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  frame.rect(mx - 1.5, my - top + 4, 3, top - bottom - 8).fill(pal.trim);
  wrapC.addChild(frame);
  return { container: wrapC, view, setSky };
};

const buildShell = (profile: RoomLayoutProfile, pal: RoomLayoutProfile['palette'], rand: () => number, accent: number): { shell: Container; onAir: Graphics } => {
  const { width: W, depth: D } = profile.footprint;
  const shell = new Container();
  shell.eventMode = 'none';
  shell.zIndex = -100;
  const thick = 12;
  const back = iso(0, 0), left = iso(0, D), front = iso(W, D), right = iso(W, 0);

  const slab = new Graphics();
  const cx = (left.x + right.x) / 2;
  for (let i = 0; i < 5; i++) slab.ellipse(cx, front.y + thick - 14, (right.x - left.x) * 0.55 * (1 - i * 0.12), 70 * (1 - i * 0.12)).fill({ color: 0x000000, alpha: 0.1 });
  slab.poly([left.x, left.y, front.x, front.y, front.x, front.y + thick, left.x, left.y + thick]).fill(shade(pal.trim, 0.12));
  slab.poly([front.x, front.y, right.x, right.y, right.x, right.y + thick, front.x, front.y + thick]).fill(pal.trim);
  slab.poly([left.x, left.y, front.x, front.y, right.x, right.y]).stroke({ width: 1.5, color: accent, alpha: 0.4 });
  shell.addChild(slab);

  // Boards run along x; seams are staggered so the floor reads as planks, not a flat diamond.
  const floor = new Graphics();
  const rows = Math.round(D * 2);
  for (let r = 0; r < rows; r++) {
    const y0 = r * 0.5, y1 = y0 + 0.5;
    let x = 0;
    while (x < W - 0.01) {
      const len = 1.6 + rand() * 1.8;
      const x1 = Math.min(W, x + len);
      isoQuad(floor, x, y0, x1, y1);
      floor.fill((r + Math.floor(x)) % 2 ? pal.floorA : pal.floorB);
      isoQuad(floor, x, y0, x1, y1);
      floor.stroke({ width: 0.8, color: 0x000000, alpha: 0.3 });
      x = x1;
    }
  }
  shell.addChild(floor);

  const walls = new Graphics();
  walls.poly([back.x, back.y, left.x, left.y, left.x, left.y - ROOM_WALL_H, back.x, back.y - ROOM_WALL_H]).fill(pal.wallLeft);
  walls.poly([back.x, back.y, right.x, right.y, right.x, right.y - ROOM_WALL_H, back.x, back.y - ROOM_WALL_H]).fill(pal.wallRight);
  // Skirting boards
  walls.poly([back.x, back.y, left.x, left.y, left.x, left.y - 9, back.x, back.y - 9]).fill(shade(pal.wallLeft, -0.35));
  walls.poly([back.x, back.y, right.x, right.y, right.x, right.y - 9, back.x, back.y - 9]).fill(shade(pal.wallRight, -0.35));
  for (const w of profile.walls) paintWallTreatment(walls, w, w.side === 'left' ? pal.wallLeft : pal.wallRight, rand);
  walls.poly([left.x, left.y, left.x, left.y - ROOM_WALL_H, back.x, back.y - ROOM_WALL_H, right.x, right.y - ROOM_WALL_H, right.x, right.y]).stroke({ width: 4, color: pal.trim });
  walls.poly([back.x, back.y, back.x, back.y - ROOM_WALL_H]).stroke({ width: 2, color: pal.trim, alpha: 0.6 });
  shell.addChild(walls);

  // On-air lamp (right wall): dim housing always, lit glow while a project is booked in.
  const housing = new Graphics();
  const x0 = profile.onAirX - 0.3, x1 = profile.onAirX + 0.3;
  housing.poly([...wallPt('right', x0, 118), ...wallPt('right', x1, 118), ...wallPt('right', x1, 106), ...wallPt('right', x0, 106)]).fill(0x14100d);
  shell.addChild(housing);
  const onAir = new Graphics();
  onAir.poly([...wallPt('right', x0 + 0.04, 116), ...wallPt('right', x1 - 0.04, 116), ...wallPt('right', x1 - 0.04, 108), ...wallPt('right', x0 + 0.04, 108)]).fill(accent);
  shell.addChild(onAir);
  return { shell, onAir };
};

/* ------------------------------------------------------------------ build */

const hitHexagon = (spec: RoomPropSpec): Graphics => {
  const m = PROP_METRICS[spec.kind];
  const w = spec.w ?? m.w, d = spec.d ?? m.d;
  const c = iso(spec.x, spec.y);
  const hw = (w + d) * 14 + 4;
  const hd = (w + d) * 7 + 3;
  const h = m.h;
  const g = new Graphics();
  g.poly([c.x - hw, c.y - h, c.x, c.y - hd - h, c.x + hw, c.y - h, c.x + hw, c.y, c.x, c.y + hd, c.x - hw, c.y]).fill(0xffffff);
  return g;
};

export const buildRoomLayoutScene = (profile: RoomLayoutProfile, opts: RoomSceneOptions): RoomSceneBuild => {
  const rand = rng(hash(`${opts.seed}:${profile.type}`));
  const t = opts.tint;
  const pal = {
    ...profile.palette,
    wallLeft: t ? mix(profile.palette.wallLeft, t.wallLeft, 0.22) : profile.palette.wallLeft,
    wallRight: t ? mix(profile.palette.wallRight, t.wallRight, 0.22) : profile.palette.wallRight,
  };
  const accent = profile.palette.accent;
  const root = new Container();
  root.sortableChildren = true;

  const { shell, onAir } = buildShell(profile, pal, rand, accent);
  root.addChild(shell);
  const win = buildWindow(profile, pal, hash(`${opts.seed}:${profile.type}:window`), opts.clockMinutes ?? 840, opts.cityId);
  win.container.eventMode = 'none';
  win.container.zIndex = -90;
  root.addChild(win.container);
  const depthBase = opts.depthBase ?? 0;

  const hotspotIds: RoomHotspotId[] = [];
  const pools = new Graphics();
  pools.eventMode = 'none';
  pools.blendMode = 'add';
  pools.zIndex = 9000;

  for (const spec of profile.props) {
    const visual = paintProp(profile, spec, accent);
    if (spec.kind === 'rug') {
      // The rug art is drawn in room coordinates, so it only needs layering under everything else.
      visual.zIndex = -50;
      root.addChild(visual);
      continue;
    }
    const pos = iso(spec.x, spec.y);
    visual.position.set(pos.x, pos.y);
    visual.label = `room-prop:${spec.id}`;
    const z = depthBase + pos.y;
    visual.zIndex = z;
    if (spec.hotspot) {
      hotspotIds.push(spec.hotspot);
      const hit = hitHexagon(spec);
      if (opts.addHotspot) opts.addHotspot(spec.hotspot, hit, visual, z, root);
      else root.addChild(visual);
      // Warm pool of light on the floor so interactive props read at a glance.
      const m = PROP_METRICS[spec.kind];
      const rx = Math.max(m.w, m.d) * 30 + 10;
      pools.ellipse(pos.x, pos.y + 4, rx, rx * 0.5).fill({ color: accent, alpha: opts.occupied ? 0.08 : 0.04 });
    } else {
      root.addChild(visual);
    }
  }
  root.addChild(pools);

  // Per-room lighting identity: the Mix Suite is dimmed, the Live Room is left bright.
  const { width: W, depth: D } = profile.footprint;
  if (profile.dim > 0) {
    const dim = new Graphics();
    dim.eventMode = 'none';
    const back = iso(0, 0), left = iso(0, D), front = iso(W, D), right = iso(W, 0);
    dim.poly([back.x, back.y - ROOM_WALL_H, right.x, right.y - ROOM_WALL_H, right.x, right.y, front.x, front.y, left.x, left.y, left.x, left.y - ROOM_WALL_H]).fill({ color: 0x05070a, alpha: profile.dim });
    dim.zIndex = 8000;
    root.addChild(dim);
  }

  const bounds = {
    minX: iso(0, D).x - 8,
    maxX: iso(W, 0).x + 8,
    minY: iso(0, 0).y - ROOM_WALL_H - 6,
    maxY: iso(W, D).y + 16,
  };

  const baseAlpha = opts.occupied ? 1 : 0.18;
  onAir.alpha = baseAlpha;
  const tick = (seconds: number, reduceMotion: boolean) => {
    if (!opts.occupied) return;
    onAir.alpha = reduceMotion ? 1 : 0.7 + 0.3 * Math.sin(seconds * 3.2);
  };

  const count = (c: Container): number => c.children.reduce((n, ch) => n + 1 + (ch instanceof Container ? count(ch) : 0), 0);
  return { root, bounds, tick, hotspotIds, windowView: win.view, setWindowSky: win.setSky, objectCount: () => count(root) };
};

/**
 * Resting camera for a room: fit the room to the viewport, zoom by the profile's multiplier and centre the
 * profile's focus tile, then clamp so the room never slides off screen. Pure so the checks can assert it.
 */
export const computeRoomView = (
  profile: RoomLayoutProfile,
  bounds: RoomSceneBuild['bounds'],
  viewport: { width: number; height: number; topInset: number; bottomInset: number },
): { scale: number; x: number; y: number } => {
  const { width, height, topInset, bottomInset } = viewport;
  const fit = Math.min(
    (width - 60) / (bounds.maxX - bounds.minX),
    Math.max(80, height - topInset - bottomInset - 20) / (bounds.maxY - bounds.minY),
    2.4,
  );
  const scale = Math.min(fit * profile.camera.zoom, 2.6);
  const f = iso(profile.camera.focus.x, profile.camera.focus.y);
  const cx = width / 2;
  const cy = (topInset + height - bottomInset) / 2;
  const clampAxis = (origin: number, min: number, max: number, lo: number, hi: number) => {
    const a = lo - min * scale;
    const b = hi - max * scale;
    return Math.max(Math.min(a, b), Math.min(Math.max(a, b), origin));
  };
  return {
    scale,
    x: clampAxis(cx - f.x * scale, bounds.minX, bounds.maxX, 10, width - 10),
    y: clampAxis(cy - f.y * scale, bounds.minY, bounds.maxY, topInset, height - bottomInset),
  };
};
