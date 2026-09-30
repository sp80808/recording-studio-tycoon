/**
 * Take feedback that lands in the room, not just the modal: a floating grade and artist
 * speech bubble over the booth, a VU flash, and an artist nod (read by the Pixi ticker).
 * Decoupled through a window event like rewardPop so ActiveProject never imports the room.
 */
export const TAKE_FEEDBACK_EVENT = 'rst:take-feedback';
export type TakeGrade = 'Gold' | 'Silver' | 'Solid';

export interface TakeFeedbackDetail { grade: TakeGrade; seq: number }

const QUIPS: Record<TakeGrade, string[]> = {
  Gold: ["That's the one!", 'Did you feel that?', 'Print it, print it!'],
  Silver: ['Tight. Keep going.', 'Nice, one more like that.', 'Getting close.'],
  Solid: ['Yeah, okay.', 'Safe. Let us push it.', 'We can do better.'],
};

/** Deterministic quip: same seq and grade always say the same thing (no RNG). */
export const takeQuip = (grade: TakeGrade, seq: number): string => {
  const pool = QUIPS[grade];
  return pool[Math.abs(seq) % pool.length];
};

/** How big the VU flash and nod are: 0..1. */
export const takeIntensity = (grade: TakeGrade): number => (grade === 'Gold' ? 1 : grade === 'Silver' ? 0.65 : 0.35);

/** Artist nod offset in px for elapsed ms since the lock; damped bounce over 500 ms. */
export const nodOffset = (elapsedMs: number, grade: TakeGrade): number => {
  if (elapsedMs < 0 || elapsedMs > 500) return 0;
  const k = 1 - elapsedMs / 500;
  return Math.sin(elapsedMs / 500 * Math.PI * 3) * 3 * takeIntensity(grade) * k;
};

let last: { at: number; grade: TakeGrade } | null = null;
let seq = 0;
export const lastTake = () => last;

export function emitTakeFeedback(grade: TakeGrade): void {
  if (typeof window === 'undefined') return;
  seq += 1;
  last = { at: performance.now(), grade };
  window.dispatchEvent(new CustomEvent<TakeFeedbackDetail>(TAKE_FEEDBACK_EVENT, { detail: { grade, seq } }));
}
