/**
 * Tactile studio objects (#194): the world answers a tap the way the swinging door answers an
 * arrival. Each hotspot gets a short physical reaction (press, wobble, rattle, CRT flick), and
 * the desk phone really rings: a handset that rattles on its cradle in a double-ring cadence
 * and lifts when you pick it up.
 *
 * Presentation only and pure, so the Pixi ticker drives it from refs and tests pin the curves.
 * Every reaction returns exactly to rest, and Reduced Motion gets rest values throughout.
 */

export type ObjectFeelKind = 'press' | 'wobble' | 'rattle' | 'flick' | 'lift';

export interface ObjectPose {
  /** Horizontal / vertical scale about the object's base. */
  sx: number;
  sy: number;
  /** Vertical offset in px (negative is up). */
  dy: number;
  /** Rotation in radians about the base. */
  rot: number;
  /** Brightness boost 0..1 (CRT flick); 0 at rest. */
  flash: number;
}

export const REST_POSE: Readonly<ObjectPose> = { sx: 1, sy: 1, dy: 0, rot: 0, flash: 0 };

/** Which reaction each studio hotspot plays when tapped. */
export const HOTSPOT_FEEL: Readonly<Record<string, ObjectFeelKind>> = {
  console: 'press',
  liveRoom: 'press',
  phone: 'lift',
  clock: 'wobble',
  tv: 'flick',
  shelf: 'rattle',
  door: 'rattle',
  promotion: 'wobble',
  cases: 'press',
  producer: 'press',
};

export const feelKindFor = (id: string): ObjectFeelKind => HOTSPOT_FEEL[id] ?? 'press';

/** Length of each reaction. */
export const FEEL_MS: Readonly<Record<ObjectFeelKind, number>> = {
  press: 360,
  wobble: 700,
  rattle: 420,
  flick: 320,
  lift: 900,
};

/**
 * Pose of a tapped object `elapsedMs` after the tap.
 * - press: a quick squash, then a small overshoot as it springs back;
 * - wobble: a wall-hung thing swings on its nail and settles;
 * - rattle: a fast decaying side-to-side shake (gear in a rack, a door in its frame);
 * - flick: the CRT brightens and the picture jumps, like knocking the set;
 * - lift: handled by `handsetLift`; the base just gives a tiny press.
 */
export function objectFeelPose(kind: ObjectFeelKind, elapsedMs: number, reduceMotion = false): ObjectPose {
  const dur = FEEL_MS[kind];
  if (reduceMotion || elapsedMs <= 0 || elapsedMs >= dur) return { ...REST_POSE };
  const k = elapsedMs / dur;
  const decay = 1 - k;
  switch (kind) {
    case 'press': {
      // Down for the first 30%, then a damped spring back through rest.
      const s = k < 0.3 ? Math.sin((k / 0.3) * (Math.PI / 2)) : Math.cos(((k - 0.3) / 0.7) * Math.PI * 1.5) * decay;
      return { sx: 1 + 0.035 * s, sy: 1 - 0.05 * s, dy: 0, rot: 0, flash: 0 };
    }
    case 'wobble':
      return { ...REST_POSE, rot: Math.sin(k * Math.PI * 4) * 0.07 * decay * decay };
    case 'rattle':
      return { ...REST_POSE, rot: Math.sin(k * Math.PI * 9) * 0.018 * decay, dy: -Math.abs(Math.sin(k * Math.PI * 9)) * 0.8 * decay };
    case 'flick':
      return { ...REST_POSE, flash: Math.max(0, 1 - k * 1.6), sy: 1 + 0.02 * Math.sin(k * Math.PI * 3) * decay };
    case 'lift': {
      const s = k < 0.12 ? Math.sin((k / 0.12) * Math.PI) : 0;
      return { sx: 1 + 0.02 * s, sy: 1 - 0.03 * s, dy: 0, rot: 0, flash: 0 };
    }
  }
}

/**
 * Handset picked up: it rises off the cradle, tilts towards the ear, hangs, then is set back
 * down with a small bounce. Returns lift (px, upward positive) and tilt (radians).
 */
export function handsetLift(elapsedMs: number, reduceMotion = false): { lift: number; tilt: number } {
  const dur = FEEL_MS.lift;
  if (reduceMotion || elapsedMs <= 0 || elapsedMs >= dur) return { lift: 0, tilt: 0 };
  const k = elapsedMs / dur;
  let u: number;
  if (k < 0.25) u = 1 - (1 - k / 0.25) ** 3; // ease out up
  else if (k < 0.6) u = 1; // hold at the ear
  else if (k < 0.85) u = 1 - ((k - 0.6) / 0.25) ** 2; // ease down
  else u = -Math.sin(((k - 0.85) / 0.15) * Math.PI) * 0.12; // bounce on the cradle
  return { lift: 9 * u, tilt: -0.32 * Math.max(0, u) };
}

/**
 * UK-style double ring: 0.4 s on, 0.2 s off, 0.4 s on, 2 s off. Returns 0..1 bell energy with
 * soft edges so the rattle does not click on and off.
 */
export const RING_CYCLE_MS = 3_000;
const RING_BURSTS: ReadonlyArray<[number, number]> = [[0, 400], [600, 1_000]];

export function phoneRingLevel(tMs: number): number {
  const p = ((tMs % RING_CYCLE_MS) + RING_CYCLE_MS) % RING_CYCLE_MS;
  for (const [a, b] of RING_BURSTS) {
    if (p >= a && p < b) return Math.min(1, (p - a) / 40, (b - p) / 60);
  }
  return 0;
}

/** True at the start of each burst pair: the moment to play the bell. */
export const ringCycleIndex = (tMs: number): number => Math.floor(tMs / RING_CYCLE_MS);

/** Handset chatter on the cradle while the bell rings (px / radians). */
export function handsetRattle(tMs: number, level: number, reduceMotion = false): { dy: number; rot: number } {
  if (reduceMotion || level <= 0) return { dy: 0, rot: 0 };
  // ~22 Hz hammer: fast, small, always upward (it lifts off the cradle and drops back).
  const hammer = Math.abs(Math.sin((tMs / 1000) * Math.PI * 22));
  return { dy: -1.6 * hammer * level, rot: 0.05 * Math.sin((tMs / 1000) * Math.PI * 22) * level };
}

/* ------------------------------------------------------------ console during a take */

/** Fader travel on the desk, as a 0..1 level (1 = pushed fully up, away from the engineer). */
export const clampLevel = (v: number): number => Math.max(0.04, Math.min(0.96, v));

/**
 * Where channel fader `index` sits. `live` (0..1) blends from its parked level into a mix that
 * rides gently with session activity; `push` (0..1) is the brief "that's the one" lift after a
 * strong take. Deterministic in time, so a frame never jitters.
 */
export function faderLevel(rest: number, index: number, tSec: number, activity: number, live: number, push: number): number {
  const a = Math.max(0, Math.min(1, activity));
  const mix = rest + 0.14 + 0.07 * Math.sin(tSec * 0.55 + index * 1.7) * (0.4 + a);
  return clampLevel(rest + (mix - rest) * Math.max(0, Math.min(1, live)) + 0.1 * Math.max(0, Math.min(1, push)));
}

/** Gold / Silver takes push the faders up a touch; it rises fast and eases back over 900ms. */
export const TAKE_PUSH_MS = 900;
export function takePush(elapsedMs: number, grade: 'Gold' | 'Silver' | 'Solid' | string): number {
  if (elapsedMs <= 0 || elapsedMs >= TAKE_PUSH_MS) return 0;
  const peak = grade === 'Gold' ? 1 : grade === 'Silver' ? 0.55 : 0;
  const k = elapsedMs / TAKE_PUSH_MS;
  return peak * Math.min(1, k / 0.12) * (1 - k) ** 2;
}

/**
 * Monitor woofer excursion on the beat (0..1): a kick-like thump each beat that decays,
 * scaled by how hard the session is working. Zero when nothing plays.
 */
export function wooferPump(tSec: number, bpm: number, activity: number, playing: boolean): number {
  if (!playing || bpm <= 0) return 0;
  const beat = (tSec * bpm) / 60;
  const phase = beat - Math.floor(beat);
  const accent = Math.floor(beat) % 2 === 0 ? 1 : 0.7;
  return Math.exp(-phase * 7) * accent * (0.35 + 0.65 * Math.max(0, Math.min(1, activity)));
}
