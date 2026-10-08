/**
 * One placement policy for feedback (Sonner toasts + game notifications) (#325).
 *
 * Feedback yields to the current primary gameplay action. The policy is a pure function of
 * explicit UI-chrome state and viewport class: no DOM measurement, polling, or collision search.
 * The returned lane maps to CSS tokens in styles/mobile-shell.css, so geometry lives in one place.
 */
import type { ToastPriority } from '@/lib/toastGate';

/** What currently owns the player's attention. Highest priority wins in `deriveChromeState`. */
export type ChromeState =
  | 'idle' // studio floor, enquiry chips, dock
  | 'first-session' // coach card is up (bottom band); top rail is still free
  | 'session' // session console open, between takes (focus sliders / Arm / Lock)
  | 'take-calibration' // PocketMeter tracking: nothing may sit over it
  | 'drawer' // bookings / gear / crew / career drawer
  | 'modal'; // dialog or pause menu

export type SurfaceKind = 'drawer' | 'session-panel' | 'modal' | 'coach';

/**
 * Where a card may appear.
 * - top:     empty band under the HUD + enquiry chips (compact)
 * - session: critical-only lane; routine messages wait while the compact console is busy
 * - corner:  bottom-left stack on wide screens, where there is genuinely spare space
 * - hold:    no safe lane; the card waits (queued, not dropped) until the state changes
 */
export type NotificationLane = 'top' | 'session' | 'corner' | 'hold';

export type NotificationPlacement = {
  state: ChromeState;
  compact: boolean;
  /** Lane for ordinary feedback. */
  lane: NotificationLane;
  /** Lane for critical feedback (errors). May differ: errors pre-empt but still avoid controls. */
  criticalLane: NotificationLane;
  /** Max foreground cards in the lane at once. */
  capacity: number;
};

export type ChromeInputs = {
  takeCalibrationFocused: boolean;
  consoleFocused: boolean;
  surfaces: readonly SurfaceKind[];
};

export function deriveChromeState(input: ChromeInputs): ChromeState {
  if (input.takeCalibrationFocused) return 'take-calibration';
  if (input.surfaces.includes('modal')) return 'modal';
  if (input.surfaces.includes('drawer')) return 'drawer';
  if (input.consoleFocused || input.surfaces.includes('session-panel')) return 'session';
  if (input.surfaces.includes('coach')) return 'first-session';
  return 'idle';
}

export const DESKTOP_CAPACITY = 2;

/**
 * `shortLandscape` (a phone on its side) has no free band inside the session console or drawers, so
 * those states wait for a gap instead of floating over the compressed controls.
 */
export function resolveNotificationPlacement(state: ChromeState, compact: boolean, shortLandscape = false): NotificationPlacement {
  if (!compact) {
    return { state, compact, lane: 'corner', criticalLane: 'corner', capacity: DESKTOP_CAPACITY };
  }
  switch (state) {
    case 'idle':
    case 'first-session':
      return { state, compact, lane: 'top', criticalLane: 'top', capacity: 1 };
    case 'session':
      // On narrow screens, even the band below the header is occupied by the
      // title, stage progress and intervention buttons. Routine feedback is
      // already conveyed by the console and must never float over the mixer.
      // Critical errors retain the narrow session lane.
      return { state, compact, lane: 'hold', criticalLane: 'session', capacity: 1 };
    case 'take-calibration':
      // The meter and focus controls own the whole screen for a few seconds: wait, even for errors.
      return { state, compact, lane: 'hold', criticalLane: 'hold', capacity: 1 };
    case 'drawer':
    case 'modal':
      // Panel primary actions win; only critical feedback pre-empts, in the least obstructive band.
      return { state, compact, lane: 'hold', criticalLane: 'session', capacity: 1 };
  }
}

export function laneFor(placement: NotificationPlacement, priority: ToastPriority | undefined): NotificationLane {
  return priority === 'critical' ? placement.criticalLane : placement.lane;
}

/** True when a card of this priority has no safe lane right now and must wait. */
export function shouldDefer(placement: NotificationPlacement, priority: ToastPriority | undefined): boolean {
  return laneFor(placement, priority) === 'hold';
}
