// Sunlight falling through the window onto the studio floor, with dust motes drifting in the beam.
// The patch slides across the floor as the sun crosses the sky (same clock as studioWindowView) and
// fades out at night. In-house CC0, Pixi Graphics only, no image files.

import { Container, Graphics } from 'pixi.js';
import { iso } from './isoMath';
import { getCelestialPosition } from './studioWindowView';

export interface LightShaft {
  container: Container;
  update: (minutesOfDay: number, tSeconds: number, reduceMotion: boolean) => void;
}

const MOTES = 14;
/** Window glass spans x 5.1..6.9 on the back wall; the beam lands this many tiles into the room. */
const BEAM_DEPTH = 3.4;
const BEAM_SHIFT = 2.2;

/** 0 at night, up to 1 at noon, soft ramp near sunrise and sunset. */
export const getShaftStrength = (minutesOfDay: number): number => {
  const c = getCelestialPosition(minutesOfDay);
  if (c.body !== 'sun') return 0;
  const edge = Math.min(c.u - 0.12, 0.88 - c.u) / 0.2;
  return Math.max(0, Math.min(1, edge)) * 0.85 + 0.15 * Math.max(0, Math.min(1, edge));
};

/** Sideways slide of the beam, in tiles: negative in the morning, positive toward evening. */
export const getShaftShift = (minutesOfDay: number): number => {
  const c = getCelestialPosition(minutesOfDay);
  return c.body === 'sun' ? (c.u - 0.5) * 2 * BEAM_SHIFT : 0;
};

export const buildLightShaft = (seed = 3): LightShaft => {
  const container = new Container();
  container.eventMode = 'none';
  const patch = new Graphics();
  const motes = new Graphics();
  container.addChild(patch, motes);
  const phases = Array.from({ length: MOTES }, (_, i) => ({
    u: ((i * 0.6180339 + seed * 0.137) % 1),
    v: ((i * 0.7548776 + seed * 0.291) % 1),
    speed: 0.03 + ((i * 0.37) % 1) * 0.05,
    phase: i * 1.7,
  }));
  let lastKey = '';

  return {
    container,
    update: (minutes, t, reduceMotion) => {
      const m = reduceMotion ? 720 : minutes;
      const strength = getShaftStrength(m);
      container.visible = strength > 0.02;
      if (!container.visible) { lastKey = ''; return; }
      const shift = getShaftShift(m);
      const warm = Math.abs(getCelestialPosition(m).u - 0.5) * 2 > 0.6;
      const key = `${Math.round(strength * 40)}|${Math.round(shift * 20)}|${reduceMotion ? 0 : Math.floor(t * 8)}`;
      if (key === lastKey) return;
      lastKey = key;
      const col = warm ? 0xffc27a : 0xfff0c0;
      const a = iso(5.1, 0.15);
      const b = iso(6.9, 0.15);
      const c = iso(6.9 + shift, BEAM_DEPTH);
      const d = iso(5.1 + shift, BEAM_DEPTH);
      patch.clear();
      patch.poly([a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y]).fill({ color: col, alpha: 0.1 * strength });
      // Brighter core, narrower toward the far edge
      const ci = iso(5.5, 0.15), cj = iso(6.5, 0.15), ck = iso(6.5 + shift * 0.9, BEAM_DEPTH * 0.7), cl = iso(5.5 + shift * 0.9, BEAM_DEPTH * 0.7);
      patch.poly([ci.x, ci.y, cj.x, cj.y, ck.x, ck.y, cl.x, cl.y]).fill({ color: col, alpha: 0.09 * strength });
      motes.clear();
      for (const p of phases) {
        const drift = reduceMotion ? 0 : t * p.speed;
        const v = (p.v + drift) % 1;
        const u = p.u + (reduceMotion ? 0 : Math.sin(t * 0.6 + p.phase) * 0.04);
        const x0 = 5.1 + 1.8 * u + shift * v;
        const y0 = 0.15 + (BEAM_DEPTH - 0.15) * v;
        const pt = iso(x0, y0);
        const twinkle = reduceMotion ? 1 : 0.6 + 0.4 * Math.sin(t * 2.2 + p.phase);
        const fade = Math.sin(v * Math.PI); // fade in/out along the beam
        // Motes rise a little as they travel (screen-space lift)
        motes.circle(pt.x, pt.y - 10 - v * 14, 0.9).fill({ color: 0xffffff, alpha: 0.65 * strength * twinkle * fade });
      }
    },
  };
};
