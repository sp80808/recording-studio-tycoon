import { create } from 'zustand';
import { COMPACT_QUERY, SHORT_LANDSCAPE_QUERY } from '@/lib/appDisplayMode';
import {
  deriveChromeState,
  resolveNotificationPlacement,
  type ChromeState,
  type NotificationPlacement,
  type SurfaceKind,
} from '@/lib/notificationPlacement';

/**
 * Shared UI chrome flags for coach / toast hosts.
 * Owners publish what is on screen (take calibration, console, drawers, modals, the coach);
 * `selectChromeState` turns that into the single state the notification rail keys off.
 * `data-chrome-busy` on <html> mirrors the busy states for CSS.
 */
type UiChromeState = {
  consoleFocused: boolean;
  setConsoleFocused: (focused: boolean) => void;
  takeCalibrationFocused: boolean;
  setTakeCalibrationFocused: (focused: boolean) => void;
  /** Open surfaces by owner id (drawer, session panel, modal, coach). */
  surfaces: Record<string, SurfaceKind>;
  setSurface: (owner: string, kind: SurfaceKind | null) => void;
};

function busyDataset(s: Pick<UiChromeState, 'consoleFocused' | 'takeCalibrationFocused' | 'surfaces'>): string | undefined {
  const state = deriveChromeState({ ...s, surfaces: Object.values(s.surfaces) });
  if (state === 'take-calibration') return 'take-calibration';
  if (state === 'session') return 'world-console';
  if (state === 'drawer' || state === 'modal') return state;
  return undefined;
}

function syncDataset(s: Pick<UiChromeState, 'consoleFocused' | 'takeCalibrationFocused' | 'surfaces'>) {
  if (typeof document === 'undefined') return;
  const busy = busyDataset(s);
  if (busy) document.documentElement.dataset.chromeBusy = busy;
  else delete document.documentElement.dataset.chromeBusy;
}

export const useUiChromeStore = create<UiChromeState>((set, get) => ({
  consoleFocused: false,
  setConsoleFocused: (focused) => {
    const next = { ...get(), consoleFocused: focused };
    syncDataset(next);
    set({ consoleFocused: focused });
  },
  takeCalibrationFocused: false,
  setTakeCalibrationFocused: (focused) => {
    const next = { ...get(), takeCalibrationFocused: focused };
    syncDataset(next);
    set({ takeCalibrationFocused: focused });
  },
  surfaces: {},
  setSurface: (owner, kind) => {
    const current = get().surfaces;
    if ((current[owner] ?? null) === kind) return;
    const surfaces = { ...current };
    if (kind) surfaces[owner] = kind;
    else delete surfaces[owner];
    syncDataset({ ...get(), surfaces });
    set({ surfaces });
  },
}));

export const selectTakeCalibrationFocused = (s: UiChromeState) => s.takeCalibrationFocused;

export const selectConsoleFocused = (s: UiChromeState) => s.consoleFocused;

/** Current chrome state as a primitive, so React selectors stay referentially stable. */
export const selectChromeState = (s: UiChromeState): ChromeState =>
  deriveChromeState({
    takeCalibrationFocused: s.takeCalibrationFocused,
    consoleFocused: s.consoleFocused,
    surfaces: Object.values(s.surfaces),
  });

function mediaMatches(query: string): boolean {
  try {
    return typeof window !== 'undefined' && Boolean(window.matchMedia?.(query).matches);
  } catch {
    return false;
  }
}

export const isCompactViewport = (): boolean => mediaMatches(COMPACT_QUERY);
export const isShortLandscape = (): boolean => mediaMatches(SHORT_LANDSCAPE_QUERY);

/** Non-React accessor for the toast bridge (admission happens outside React). */
export function currentNotificationPlacement(compact: boolean = isCompactViewport(), shortLandscape: boolean = isShortLandscape()): NotificationPlacement {
  return resolveNotificationPlacement(selectChromeState(useUiChromeStore.getState()), compact, shortLandscape);
}
