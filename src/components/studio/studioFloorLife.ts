/**
 * Living-studio floor FX — pure presentation helpers.
 *
 * Quiet documentary studio: console needles / LEDs, candle flicker, coffee steam.
 * Values are allocation-free numbers for the Pixi ticker. Reduced-motion callers
 * get frozen pleasant poses (no twitch). No prop physics (no glowing clocks,
 * no swaying shelves).
 */
import type { DayPhase } from '@/components/studio/studioDecorConfig';

/** Tuned constants — small, believable micro-motion (not game VFX). */
export const VU_BASE = 0.14;
export const VU_ACTIVITY_GAIN = 0.36;
export const VU_WOBBLE_HZ = 1.05;
export const VU_WOBBLE_DEPTH = 0.055;
export const VU_NEEDLE_LAG = 0.12;

export const LED_IDLE_PACE = 0.45;
export const LED_LIVE_PACE = 1.15;
export const LED_IDLE_FLOOR = 0.2;
export const LED_LIVE_FLOOR = 0.36;
/** Soft clip flicker only when sine crest is rare/high. */
export const LED_CLIP_THRESHOLD = 0.93;
export const LED_CLIP_BOOST = 0.14;

export const CANDLE_FLICKER_FLOOR = 0.64;
export const CANDLE_FLICKER_CEIL = 0.9;

export const STEAM_BASE = 0.32;
export const STEAM_WISP_MOD = 0.18;

export const IDLE_HINT_BREATHE_HZ = 1.15;
export const IDLE_HINT_ALPHA_MIN = 0.16;
export const IDLE_HINT_ALPHA_MAX = 0.34;
export const IDLE_HINT_DOOR_ALPHA_MIN = 0.12;
export const IDLE_HINT_DOOR_ALPHA_MAX = 0.26;

/** Approach `target` from `current` (per-tick lag for VU needles). */
export const smoothToward = (current: number, target: number, rate: number): number =>
  current + (target - current) * Math.max(0, Math.min(1, rate));

/** VU needle deflection: 0 = parked left, 1 = pinned red. Small, slightly soft wobble. */
export const vuNeedleNorm = (
  activity: number,
  tSeconds: number,
  channelIndex: number,
  reduceMotion: boolean,
): number => {
  const base = Math.max(0, Math.min(1, activity));
  if (reduceMotion) return VU_BASE + base * VU_ACTIVITY_GAIN;
  const wobble =
    0.5 +
    0.5 *
      Math.sin(tSeconds * (VU_WOBBLE_HZ + channelIndex * 0.18) + channelIndex * 1.7) *
      Math.sin(tSeconds * (0.55 + channelIndex * 0.07) + 0.4);
  return Math.max(
    0.06,
    Math.min(0.92, VU_BASE + base * VU_ACTIVITY_GAIN + wobble * VU_WOBBLE_DEPTH * (0.6 + base * 0.4)),
  );
};

/** Needle angle in radians (wall-up = 0); sweeps roughly −50°…+50°. */
export const vuNeedleAngle = (norm: number): number => {
  const n = Math.max(0, Math.min(1, norm));
  return -0.88 + n * 1.76;
};

/**
 * Status LED alpha — mostly steady; rare soft clip flickers when live.
 * Quiet when idle (no disco).
 */
export const statusLedPulse = (
  activity: number,
  tSeconds: number,
  ledIndex: number,
  live: boolean,
  reduceMotion: boolean,
): number => {
  if (reduceMotion) return live ? 0.55 : 0.3;
  const pace = live ? LED_LIVE_PACE : LED_IDLE_PACE;
  const crest = Math.sin(tSeconds * pace + ledIndex * 2.1);
  const flicker = live && crest > LED_CLIP_THRESHOLD ? LED_CLIP_BOOST : crest > 0.85 ? 0.04 : 0;
  const floor = live ? LED_LIVE_FLOOR : LED_IDLE_FLOOR;
  return Math.min(0.95, floor + activity * 0.06 + flicker);
};

/**
 * Candle flame intensity 0..1 — gentle irregular flicker (not a torch).
 * Two slow incommensurate sines so it never reads as a looped GIF.
 */
export const candleFlicker = (tSeconds: number, reduceMotion: boolean): number => {
  if (reduceMotion) return 0.78;
  const a = Math.sin(tSeconds * 3.8);
  const b = Math.sin(tSeconds * 5.9 + 1.1);
  const c = Math.sin(tSeconds * 8.2 + 0.4);
  const n = 0.76 + 0.07 * a + 0.04 * b * b + 0.03 * c;
  return Math.max(CANDLE_FLICKER_FLOOR, Math.min(CANDLE_FLICKER_CEIL, n));
};

/**
 * Steam / heat shimmer when coffee is present after brew.
 * Thin intermittent wisps — dips between breaths.
 */
export const coffeeSteamStrength = (
  coffeeSteaming: boolean,
  tSeconds: number,
  reduceMotion: boolean,
): number => {
  if (!coffeeSteaming) return 0;
  if (reduceMotion) return 0.28;
  const breath = 0.5 + 0.5 * Math.sin(tSeconds * 0.4);
  const gap = Math.sin(tSeconds * 0.18 + 0.8) > -0.4 ? 1 : 0.12;
  return (STEAM_BASE + STEAM_WISP_MOD * breath) * gap;
};

/** Idle hotspot brass outline — very soft breathe (directional UX, not prop physics). */
export const idleHintAlpha = (
  tSeconds: number,
  isDoor: boolean,
  reduceMotion: boolean,
): number => {
  if (reduceMotion) return isDoor ? 0.28 : 0.36;
  const min = isDoor ? IDLE_HINT_DOOR_ALPHA_MIN : IDLE_HINT_ALPHA_MIN;
  const max = isDoor ? IDLE_HINT_DOOR_ALPHA_MAX : IDLE_HINT_ALPHA_MAX;
  const n = 0.5 + 0.5 * Math.sin(tSeconds * IDLE_HINT_BREATHE_HZ);
  return min + (max - min) * n;
};

export interface ShelfIdleMotion {
  dy: number;
  rot: number;
  alpha: number;
}

/**
 * Shelf gear micro-drift — sub-pixel bob so the rack reads alive without
 * moving hit geometry. Frozen when reduced motion is on. Pure presentation.
 */
export const shelfIdleMotion = (
  tSeconds: number,
  phase: number,
  live: boolean,
  reduceMotion: boolean,
): ShelfIdleMotion => {
  if (reduceMotion) return { dy: 0, rot: 0, alpha: live ? 1 : 0.96 };
  const amp = live ? 1 : 0.5;
  const sway = Math.sin(tSeconds * 0.9 + phase * 1.3);
  const bob = Math.sin(tSeconds * 0.6 + phase * 0.7);
  return {
    dy: bob * 0.6 * amp,
    rot: sway * 0.008 * amp,
    alpha: 0.96 + 0.04 * (0.5 + 0.5 * sway),
  };
};

/** Clock rim halo strength — brighter after dark so the face still reads. Pure presentation. */
export const clockRimGlowAlpha = (dayness: number, phase: DayPhase | undefined, tSeconds: number, reduceMotion: boolean): number => {
  const night = 1 - Math.max(0, Math.min(1, dayness));
  const phaseLift = phase === 'night' ? 0.08 : phase === 'evening' ? 0.04 : 0;
  const base = 0.12 + night * 0.35 + phaseLift;
  if (reduceMotion) return base;
  return base * (0.9 + 0.1 * Math.sin(tSeconds * 1.7));
};
