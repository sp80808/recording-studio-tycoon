/**
 * Screen shake — a tiny game-feel helper (bead goj.3).
 *
 * Adds a transient CSS class to the game shell (`.game-layout`, set by
 * `GameLayout`) so any part of the game can punctuate an event without
 * plumbing state through React. Respects prefers-reduced-motion via CSS.
 */
export type ShakeIntensity = 'light' | 'medium' | 'heavy';

const SHAKE_DURATION_MS: Record<ShakeIntensity, number> = {
  light: 320,
  medium: 460,
  heavy: 650,
};

let clearHandle: number | null = null;

export const triggerScreenShake = (intensity: ShakeIntensity = 'medium') => {
  if (typeof document === 'undefined') return;
  const shell = document.querySelector<HTMLElement>('.game-layout');
  if (!shell) return;

  const cls = `shake-${intensity}`;
  // Clear any in-flight shake so rapid triggers replay cleanly.
  if (clearHandle !== null) {
    window.clearTimeout(clearHandle);
    clearHandle = null;
  }
  shell.classList.remove('shake-light', 'shake-medium', 'shake-heavy');
  void shell.offsetWidth; // force reflow so the animation restarts
  void shell.offsetHeight;
  shell.classList.add(cls);
  clearHandle = window.setTimeout(() => {
    shell.classList.remove(cls);
    clearHandle = null;
  }, SHAKE_DURATION_MS[intensity] + 60);
};
