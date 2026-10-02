import { gameAudio } from './audioSystem';
import * as Tone from 'tone';

/** True on phones/tablets where the primary pointer is a finger. */
export const isCoarsePointer = (): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;

/** Short haptic tick. Android/Chromium only (iOS Safari exposes no vibration API); silently no-ops elsewhere. */
/** Mirrors the Settings haptics toggle; SettingsProvider keeps it in sync. */
let hapticsEnabled = true;
export const setHapticsEnabled = (on: boolean): void => {
  hapticsEnabled = on;
};

export const hapticTick = (ms: number | number[] = 12): void => {
  try {
    if (hapticsEnabled && isCoarsePointer() && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(ms);
  } catch {
    /* ignore */
  }
};

/**
 * iOS/Android audio lifecycle:
 *  - `audioSession.type = 'playback'` keeps sound on when the iOS ringer switch is silent.
 *  - iOS only treats touchend/click as an unlock gesture (not touchstart), so re-arm on touchend.
 *  - Suspend audio when the page is hidden and resume (incl. iOS "interrupted" state) when it returns.
 */
export const initMobileAudioLifecycle = (): void => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  try {
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (session) session.type = 'playback';
  } catch {
    /* ignore */
  }

  const resume = () => {
    void gameAudio.userGestureSignal().catch(() => undefined);
  };
  document.addEventListener('touchend', resume, { once: true, capture: true, passive: true });

  document.addEventListener('visibilitychange', () => {
    try {
      const ctx = Tone.getContext().rawContext as AudioContext;
      if (document.hidden) {
        void ctx.suspend?.();
      } else {
        void ctx.resume?.();
        resume();
      }
    } catch {
      /* ignore */
    }
  });
  // iOS fires pageshow when restoring from bfcache after a call/lock.
  window.addEventListener('pageshow', (e) => {
    if ((e as PageTransitionEvent).persisted) resume();
  });
};

export const registerServiceWorker = (): void => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((e) => console.warn('Service worker registration failed:', e));
  });
};
