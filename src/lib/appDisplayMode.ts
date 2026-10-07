/**
 * App-shell display capability, read from media queries instead of user-agent sniffing (#324).
 * Pure so the checks stay DOM-free; the React bridge is hooks/useAppDisplayMode.ts.
 */

/** Phone layouts: narrow portrait, or a short coarse-pointer landscape. Mirrors the 767px cut-off used by the mobile chrome CSS. */
export const COMPACT_QUERY = '(max-width: 767px), (max-height: 500px) and (pointer: coarse)';
/** Phone held sideways: little vertical room, the notch sits at the side. */
export const SHORT_LANDSCAPE_QUERY = '(max-height: 500px) and (orientation: landscape) and (pointer: coarse)';
export const COARSE_QUERY = '(pointer: coarse)';
export const STANDALONE_QUERY = '(display-mode: standalone)';
export const FULLSCREEN_DISPLAY_QUERY = '(display-mode: fullscreen)';
export const MIN_UI_DISPLAY_QUERY = '(display-mode: minimal-ui)';

export type AppDisplayMode = {
  /** Launched from the home screen / installed app window (standalone, minimal-ui, or iOS navigator.standalone). */
  installed: boolean;
  /** The OS already runs the page fullscreen (manifest display: fullscreen). */
  fullscreenDisplay: boolean;
  /** Primary pointer is a finger. */
  coarsePointer: boolean;
  /** Phone-width viewport. */
  compact: boolean;
  /** Short coarse-pointer landscape (a phone on its side). */
  shortLandscape: boolean;
};

export type DisplayModeEnv = {
  matchMedia?: ((query: string) => { matches: boolean }) | undefined;
  /** iOS Safari exposes navigator.standalone for home-screen launches. */
  navigatorStandalone?: boolean;
};

export const DEFAULT_DISPLAY_MODE: AppDisplayMode = {
  installed: false,
  fullscreenDisplay: false,
  coarsePointer: false,
  compact: false,
  shortLandscape: false,
};

export function readAppDisplayMode(env: DisplayModeEnv): AppDisplayMode {
  const matches = (query: string): boolean => {
    try {
      return Boolean(env.matchMedia?.(query)?.matches);
    } catch {
      return false;
    }
  };
  const fullscreenDisplay = matches(FULLSCREEN_DISPLAY_QUERY);
  return {
    installed:
      matches(STANDALONE_QUERY) ||
      matches(MIN_UI_DISPLAY_QUERY) ||
      fullscreenDisplay ||
      env.navigatorStandalone === true,
    fullscreenDisplay,
    coarsePointer: matches(COARSE_QUERY),
    compact: matches(COMPACT_QUERY),
    shortLandscape: matches(SHORT_LANDSCAPE_QUERY),
  };
}

/**
 * The in-game Fullscreen API toggle only earns HUD width in a normal desktop/windowed browser.
 * An installed app is already chromeless, and touch / phone-width layouts have no use for it.
 */
export function shouldShowFullscreenControl(mode: AppDisplayMode): boolean {
  return !mode.installed && !mode.coarsePointer && !mode.compact;
}

/** Touch-first presentation (phone browser or installed app): drives the shared top gutter and notification rail. */
export function isMobileShell(mode: AppDisplayMode): boolean {
  return mode.installed || mode.coarsePointer || mode.compact;
}

export function browserDisplayEnv(): DisplayModeEnv {
  if (typeof window === 'undefined') return {};
  return {
    matchMedia: window.matchMedia?.bind(window),
    navigatorStandalone: (window.navigator as Navigator & { standalone?: boolean }).standalone === true,
  };
}
