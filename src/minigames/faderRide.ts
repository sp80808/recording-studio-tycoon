/** Pure rules for the Fader Ride minigame: a fixed-length run that scores itself. */
export const ZONE_LO = 40;
export const ZONE_HI = 60;
export const CLIP_LEVEL = 95;
export const TICK_MS = 150;
export const GAME_SECONDS = 30;
/** The run is counted in simulation ticks, so every player rides exactly the same length. */
export const TOTAL_TICKS = Math.round((GAME_SECONDS * 1000) / TICK_MS);
export const PASS_SCORE = 600;

export const trackLevelAt = (step: number, jitter: number): number =>
  Math.min(95, Math.max(15, 50 + Math.sin(step * 0.12) * 18 + jitter));

export const outputLevel = (track: number, fader: number): number =>
  Math.max(0, Math.min(100, track + (fader - 50) * 0.75));

export const inZone = (output: number): boolean => output >= ZONE_LO && output <= ZONE_HI;

export const runProgress = (ticks: number): number => Math.min(1, ticks / TOTAL_TICKS);
export const secondsLeft = (ticks: number): number =>
  Math.max(0, Math.ceil(((TOTAL_TICKS - ticks) * TICK_MS) / 1000));
export const isRunComplete = (ticks: number): boolean => ticks >= TOTAL_TICKS;

/**
 * Score out of 1000: share of the whole run spent in the green window, +10% for no clipping.
 * Dividing by the full run length (not ticks so far) means finishing early cannot beat riding it out.
 */
export const scoreRide = (inZoneTicks: number, ticks: number, maxOutput: number): number => {
  if (ticks <= 0) return 0;
  const base = Math.round((inZoneTicks / Math.max(ticks, TOTAL_TICKS)) * 1000);
  return Math.min(1000, Math.round(base * (maxOutput <= CLIP_LEVEL ? 1.1 : 1)));
};
