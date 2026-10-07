import { useEffect, useId } from 'react';
import { useUiChromeStore } from '@/stores/uiChromeStore';
import type { SurfaceKind } from '@/lib/notificationPlacement';

/** Publish that a surface (drawer, session panel, modal, coach) is on screen while `kind` is non-null. */
export function useChromeSurface(kind: SurfaceKind | null): void {
  const owner = useId();
  useEffect(() => {
    useUiChromeStore.getState().setSurface(owner, kind);
    return () => useUiChromeStore.getState().setSurface(owner, null);
  }, [owner, kind]);
}
