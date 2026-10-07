/**
 * Diegetic client enter/exit through the studio door.
 * Non-blocking cosmetic transit: never gates bookings or gameplay.
 * Skippable; respects prefers-reduced-motion (instant snap).
 */

export type ClientTransitPhase = 'absent' | 'entering' | 'present' | 'exiting';

export interface ClientTransitState {
  phase: ClientTransitPhase;
  /** 0..1 progress along the current enter/exit path. */
  t: number;
  /** Last observed session flag (edge detection). */
  sessionActive: boolean;
}

export const CLIENT_ENTER_MS = 1_500;
export const CLIENT_EXIT_MS = 1_100;

export function createClientTransitState(sessionActive = false): ClientTransitState {
  return {
    phase: sessionActive ? 'present' : 'absent',
    t: sessionActive ? 1 : 0,
    sessionActive,
  };
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** Smoothstep ease for a soft walk feel. */
export function easeClientTransit(t: number): number {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

/**
 * Advance transit from session presence + frame delta.
 * When reduceMotion is set, snaps to the destination phase immediately.
 */
export function advanceClientTransit(
  state: ClientTransitState,
  opts: { sessionActive: boolean; dtMs: number; reduceMotion: boolean },
): ClientTransitState {
  const { sessionActive, dtMs, reduceMotion } = opts;
  let next: ClientTransitState = { ...state };

  // Edge: session started → walk in from the door
  if (sessionActive && !state.sessionActive) {
    if (reduceMotion) {
      return { phase: 'present', t: 1, sessionActive: true };
    }
    next = { phase: 'entering', t: 0, sessionActive: true };
  }

  // Edge: session ended → walk out through the door
  if (!sessionActive && state.sessionActive) {
    if (reduceMotion) {
      return { phase: 'absent', t: 0, sessionActive: false };
    }
    // If still entering, reverse from current progress
    const startT = state.phase === 'entering' ? 1 - state.t : 0;
    next = { phase: 'exiting', t: startT, sessionActive: false };
  } else {
    next.sessionActive = sessionActive;
  }

  if (next.phase === 'entering') {
    if (reduceMotion) return { phase: 'present', t: 1, sessionActive: true };
    const t = clamp01(next.t + dtMs / CLIENT_ENTER_MS);
    return t >= 1
      ? { phase: 'present', t: 1, sessionActive: next.sessionActive }
      : { ...next, t };
  }

  if (next.phase === 'exiting') {
    if (reduceMotion) return { phase: 'absent', t: 0, sessionActive: false };
    const t = clamp01(next.t + dtMs / CLIENT_EXIT_MS);
    return t >= 1
      ? { phase: 'absent', t: 0, sessionActive: next.sessionActive }
      : { ...next, t };
  }

  return next;
}

/** Instantly finish the current enter/exit (click / Escape / reduced motion). */
export function skipClientTransit(state: ClientTransitState, sessionActive: boolean): ClientTransitState {
  if (state.phase === 'entering' || (sessionActive && state.phase !== 'present')) {
    return { phase: 'present', t: 1, sessionActive: true };
  }
  if (state.phase === 'exiting' || (!sessionActive && state.phase !== 'absent')) {
    return { phase: 'absent', t: 0, sessionActive: false };
  }
  return { ...state, sessionActive };
}

export function isClientTransitAnimating(state: ClientTransitState): boolean {
  return state.phase === 'entering' || state.phase === 'exiting';
}

export interface Point2 {
  x: number;
  y: number;
}

/**
 * World position + visibility for the client figure.
 * Enter: door → stand. Exit: stand → door.
 */
export function clientTransitPose(
  state: ClientTransitState,
  door: Point2,
  stand: Point2,
): { x: number; y: number; visible: boolean; alpha: number; pathT: number } {
  if (state.phase === 'absent') {
    return { x: door.x, y: door.y, visible: false, alpha: 0, pathT: 0 };
  }
  if (state.phase === 'present') {
    return { x: stand.x, y: stand.y, visible: true, alpha: 1, pathT: 1 };
  }

  const raw = state.phase === 'entering' ? state.t : 1 - state.t;
  const pathT = easeClientTransit(raw);
  const x = door.x + (stand.x - door.x) * pathT;
  const y = door.y + (stand.y - door.y) * pathT;
  // Fade in near the door on enter; fade out near the door on exit
  const doorProximity = state.phase === 'entering' ? pathT : raw;
  const alpha = clamp01(0.25 + doorProximity * 0.75);
  return { x, y, visible: true, alpha, pathT };
}

/**
 * How far open the studio door reads (0..1) while a client walks through it:
 * swings open over the first 12% of the walk, holds, then eases shut over the last 30%.
 * Purely cosmetic; 0 whenever nobody is mid-transit (so Reduced Motion's snap never shows it).
 */
export function doorOpenAmount(state: ClientTransitState): number {
  if (state.phase !== 'entering' && state.phase !== 'exiting') return 0;
  // Exits walk stand → door, so the door opens late and shuts as they leave.
  const t = state.phase === 'entering' ? state.t : 1 - state.t;
  const open = Math.min(1, t / 0.12);
  const close = t > 0.7 ? Math.max(0, (1 - t) / 0.3) : 1;
  return easeClientTransit(Math.min(open, close));
}
