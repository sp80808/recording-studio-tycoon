/**
 * Decides what the global keydown handler should do for pause-menu keys.
 * While the pause menu is open its Radix Dialog already closes itself on
 * Escape; toggling here as well re-opened the menu (close, then flip back).
 */
export function shouldTogglePauseOnKey(key: string, pauseOpen: boolean): boolean {
  if (key === 'Escape') return !pauseOpen;
  return key === 'p' || key === 'P';
}
