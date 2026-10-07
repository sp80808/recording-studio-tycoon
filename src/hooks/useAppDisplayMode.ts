import { useEffect, useState } from 'react';
import {
  browserDisplayEnv,
  COARSE_QUERY,
  COMPACT_QUERY,
  FULLSCREEN_DISPLAY_QUERY,
  MIN_UI_DISPLAY_QUERY,
  readAppDisplayMode,
  SHORT_LANDSCAPE_QUERY,
  STANDALONE_QUERY,
  type AppDisplayMode,
} from '@/lib/appDisplayMode';

/** Live display-mode capabilities (installed / fullscreen display / coarse pointer / phone width). */
export function useAppDisplayMode(): AppDisplayMode {
  const [mode, setMode] = useState<AppDisplayMode>(() => readAppDisplayMode(browserDisplayEnv()));

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const queries = [COMPACT_QUERY, SHORT_LANDSCAPE_QUERY, COARSE_QUERY, STANDALONE_QUERY, FULLSCREEN_DISPLAY_QUERY, MIN_UI_DISPLAY_QUERY].map((q) =>
      window.matchMedia(q)
    );
    const refresh = () => {
      const next = readAppDisplayMode(browserDisplayEnv());
      setMode((prev) =>
        prev.installed === next.installed &&
        prev.fullscreenDisplay === next.fullscreenDisplay &&
        prev.coarsePointer === next.coarsePointer &&
        prev.compact === next.compact &&
        prev.shortLandscape === next.shortLandscape
          ? prev
          : next
      );
    };
    queries.forEach((q) => q.addEventListener?.('change', refresh));
    refresh();
    return () => queries.forEach((q) => q.removeEventListener?.('change', refresh));
  }, []);

  return mode;
}
