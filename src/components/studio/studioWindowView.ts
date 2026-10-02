// What you see through the studio window: a sun that crosses the sky by day, a moon and stars by
// night, and a city skyline whose windows switch on at dusk. Driven by the same 24h clock minutes as
// the sky colour, wall clock and room tint (see studioDecorConfig). In-house CC0, Pixi Graphics only.

import { Container, Graphics } from 'pixi.js';

export interface WindowView {
  container: Container;
  /** `minutesOfDay` 0..1439, `dayness` 0 (night) .. 1 (noon), `tSeconds` for twinkle. */
  update: (minutesOfDay: number, dayness: number, tSeconds: number, reduceMotion: boolean) => void;
}

type Pt = { x: number; y: number };

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Tiny deterministic generator so the skyline is identical on every rebuild. */
const rng = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

export const SUNRISE_MIN = 360; // 06:00
export const SUNSET_MIN = 1080; // 18:00

/** Where the sun (day) or moon (night) sits, as window fractions: u across, v up. Null when below the horizon. */
export const getCelestialPosition = (minutesOfDay: number): { body: 'sun' | 'moon'; u: number; v: number } => {
  const m = ((minutesOfDay % 1440) + 1440) % 1440;
  const isDay = m >= SUNRISE_MIN && m < SUNSET_MIN;
  // Progress 0..1 across whichever arc is up (the moon rides the night arc).
  const p = isDay ? (m - SUNRISE_MIN) / (SUNSET_MIN - SUNRISE_MIN) : ((m - SUNSET_MIN + 1440) % 1440) / (1440 - (SUNSET_MIN - SUNRISE_MIN));
  return { body: isDay ? 'sun' : 'moon', u: 0.12 + p * 0.76, v: 0.42 + Math.sin(p * Math.PI) * 0.46 };
};

/** Strength of lit skyline windows: off by day, fully on after dark. */
export const getCityLightLevel = (dayness: number): number => 1 - smoothstep(0.25, 0.6, dayness);
/** Star visibility: only once it is properly dark. */
export const getStarLevel = (dayness: number): number => 1 - smoothstep(0.1, 0.35, dayness);

/**
 * `a`/`b` are the bottom-left and bottom-right corners of the glass on the wall plane and
 * `bottomLift`/`topLift` its vertical extent in pixels (same numbers `WebGLCanvas` used for the pane).
 */
export const buildWindowView = (a: Pt, b: Pt, bottomLift: number, topLift: number, seed = 7): WindowView => {
  const pt = (u: number, v: number): Pt => ({
    x: a.x + (b.x - a.x) * u,
    y: a.y + (b.y - a.y) * u - (bottomLift + (topLift - bottomLift) * v),
  });
  const quad = (u0: number, v0: number, u1: number, v1: number): number[] => {
    const p0 = pt(u0, v0);
    const p1 = pt(u1, v0);
    const p2 = pt(u1, v1);
    const p3 = pt(u0, v1);
    return [p0.x, p0.y, p1.x, p1.y, p2.x, p2.y, p3.x, p3.y];
  };
  const container = new Container();
  container.eventMode = 'none';
  const random = rng(seed);

  // Stars
  const stars = new Graphics();
  const starPts = Array.from({ length: 16 }, () => ({ u: 0.06 + random() * 0.88, v: 0.5 + random() * 0.46, phase: random() * 6.28, big: random() > 0.75 }));
  container.addChild(stars);

  // Celestial body (redrawn when it moves a pixel or so)
  const body = new Graphics();
  container.addChild(body);

  // Skyline: far layer (lighter) then near layer, plus lit windows on both.
  const skyline = new Graphics();
  const lights = new Graphics();
  const lightCells: { rect: number[]; warm: boolean; flicker: number }[] = [];
  let u = 0.0;
  const layers = [
    { top: 0.34, hMin: 0.12, hMax: 0.3, color: 0x1a2236, alpha: 0.75 },
    { top: 0.22, hMin: 0.08, hMax: 0.22, color: 0x10151f, alpha: 1 },
  ];
  for (const layer of layers) {
    u = layer === layers[0] ? -0.02 : 0.02;
    while (u < 1) {
      const w = 0.07 + random() * 0.09;
      const h = layer.hMin + random() * (layer.hMax - layer.hMin);
      const u1 = Math.min(1, u + w);
      skyline.poly(quad(Math.max(0, u), 0, u1, h)).fill({ color: layer.color, alpha: layer.alpha });
      // Roof detail on some towers
      if (random() > 0.6) skyline.poly(quad(u + w * 0.4, h, u + w * 0.55, h + 0.06)).fill({ color: layer.color, alpha: layer.alpha });
      // Window grid
      const cols = Math.max(1, Math.floor(w / 0.022));
      const rows = Math.max(1, Math.floor(h / 0.045));
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (random() > (layer === layers[0] ? 0.4 : 0.55)) continue;
          const cu = u + 0.008 + c * ((w - 0.016) / cols);
          const cv = 0.02 + r * (h / rows) * 0.92;
          lightCells.push({ rect: quad(cu, cv, cu + 0.012, cv + 0.02), warm: random() > 0.25, flicker: random() });
        }
      }
      u = u1 + 0.005 + random() * 0.015;
    }
  }
  container.addChild(skyline);
  for (const c of lightCells) lights.poly(c.rect).fill({ color: c.warm ? 0xffd98a : 0x9fd8ff, alpha: 0.5 + c.flicker * 0.5 });
  container.addChild(lights);
  lights.alpha = 0;

  let lastKey = '';

  return {
    container,
    update: (minutesOfDay, dayness, t, reduceMotion) => {
      const city = reduceMotion ? 0 : getCityLightLevel(dayness);
      lights.alpha = city;
      const starLevel = reduceMotion ? 0 : getStarLevel(dayness);
      // Twinkle only changes alpha, so redraw stars at ~4Hz.
      const starKey = `${Math.round(starLevel * 20)}|${Math.floor(t * 4)}`;
      if (starKey !== lastKey) {
        lastKey = starKey;
        stars.clear();
        if (starLevel > 0.01) {
          for (const s of starPts) {
            const p = pt(s.u, s.v);
            const tw = reduceMotion ? 1 : 0.55 + 0.45 * Math.sin(t * 1.7 + s.phase);
            stars.circle(p.x, p.y, s.big ? 1.1 : 0.7).fill({ color: 0xffffff, alpha: starLevel * tw });
          }
        }
      }
      // Sun or moon
      const c = getCelestialPosition(reduceMotion ? 720 : minutesOfDay);
      const p = pt(c.u, c.v);
      body.clear();
      if (c.body === 'sun') {
        // Warm near the horizon, white overhead; fade out into the dusk/dawn sky
        const col = Math.abs(c.u - 0.5) * 2 > 0.6 ? 0xffb066 : 0xfff2b8;
        body.circle(p.x, p.y, 7).fill({ color: col, alpha: 0.18 });
        body.circle(p.x, p.y, 4).fill({ color: col, alpha: 0.95 });
      } else {
        body.circle(p.x, p.y, 7).fill({ color: 0xcfe0ff, alpha: 0.12 });
        body.circle(p.x, p.y, 3.6).fill({ color: 0xeef3ff, alpha: 0.95 });
        body.circle(p.x - 1, p.y + 0.8, 0.8).fill({ color: 0xb8c4e0, alpha: 0.7 });
        body.circle(p.x + 1.1, p.y - 0.9, 0.6).fill({ color: 0xb8c4e0, alpha: 0.7 });
      }
    },
  };
};
