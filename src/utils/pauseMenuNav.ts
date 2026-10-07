/**
 * One back-step model for the pause menu, shared by Esc, the on-screen back
 * controls, the gamepad B button and the phone back gesture. Back always
 * undoes exactly one level: sub view -> pause menu -> game.
 */
export type PauseView = 'main' | 'controls' | 'quit';

export interface PauseNavState {
  pauseOpen: boolean;
  view: PauseView;
  settingsOpen: boolean;
  /** Settings was opened from the pause menu, so closing it returns there. */
  settingsFromPause: boolean;
}

export const CLOSED_PAUSE_NAV: PauseNavState = {
  pauseOpen: false,
  view: 'main',
  settingsOpen: false,
  settingsFromPause: false,
};

/** True while something the back gesture should consume is on screen. */
export function pauseNavHasLayer(s: PauseNavState): boolean {
  return s.pauseOpen || (s.settingsOpen && s.settingsFromPause);
}

export function pauseNavBack(s: PauseNavState): PauseNavState {
  if (s.settingsOpen) {
    return s.settingsFromPause
      ? { pauseOpen: true, view: 'main', settingsOpen: false, settingsFromPause: false }
      : { ...s, settingsOpen: false };
  }
  if (!s.pauseOpen) return s;
  if (s.view !== 'main') return { ...s, view: 'main' };
  return CLOSED_PAUSE_NAV;
}

/** Pause menu "Studio Settings": hide the menu, remember to come back. */
export function pauseNavOpenSettings(s: PauseNavState): PauseNavState {
  return { pauseOpen: false, view: 'main', settingsOpen: true, settingsFromPause: s.pauseOpen };
}

export function pauseNavTogglePause(s: PauseNavState): PauseNavState {
  return s.pauseOpen ? CLOSED_PAUSE_NAV : { ...s, pauseOpen: true, view: 'main' };
}
