/** Pure (Pixi-free) reel animation math so it can be unit-tested in Node. */
import type { GearSpriteVisualState } from './gearVisualState';

export const REEL_SPOKES = 3;
export const REEL_FRAME_COUNT = 8;

/** Pure frame spec: rotation of the spoke pattern per frame (symmetry lets 8 frames loop seamlessly). */
export const reelFrameAngles = (frames = REEL_FRAME_COUNT): number[] =>
  Array.from({ length: frames }, (_, i) => (i / frames) * ((Math.PI * 2) / REEL_SPOKES));

/** Frames-per-tick speed for a state; 0 means settle on frame 0 (static). */
export const reelAnimationSpeed = (state: GearSpriteVisualState, reducedMotion: boolean): number => {
  if (reducedMotion || !state.powered || state.archetype !== 'tape-machine') return 0;
  if (state.transport === 'stopped') return 0;
  if (state.transport === 'rewind') return -0.5;
  return state.transport === 'record' ? 0.22 : 0.15;
};

