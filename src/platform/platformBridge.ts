// PlatformBridge facade — bead 84a.1.
// One singleton, direct surface references (no events, no overhead). Native
// shells (Capacitor 84a.4, Tauri 84a.5) register adapters per-surface; until
// then every surface resolves to its safe web fallback.

import type {
  BillboardAdapter,
  BillboardSurface,
  CloudAdapter,
  CloudSaveSurface,
  HapticsSurface,
  PlatformCapabilities,
  PlatformKind,
  PresenceSurface,
  SharingSurface,
} from './types';
import {
  createWebBillboard,
  createWebCloud,
  webCapabilities,
  webHaptics,
  webPresence,
  webSharing,
} from './webPlatform';

export type { PlatformKind };

export interface PlatformBridge {
  readonly kind: PlatformKind;
  readonly capabilities: PlatformCapabilities;
  readonly haptics: HapticsSurface;
  readonly presence: PresenceSurface;
  readonly cloud: CloudSaveSurface;
  readonly billboard: BillboardSurface;
  readonly sharing: SharingSurface;
}

/** Probe the host. No SDK imports — Capacitor/Tauri are optional globals. */
export const detectPlatformKind = (): PlatformKind => {
  try {
    if (typeof window === 'undefined') return 'web';
    const w = window as unknown as Record<string, unknown>;
    const cap = w['Capacitor'] as { isNativePlatform?: () => boolean } | undefined;
    if (cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform()) return 'capacitor';
    if ('__TAURI__' in w || '__TAURI_INTERNALS__' in w) return 'tauri';
  } catch {
    /* ignore */
  }
  return 'web';
};

let cached: PlatformBridge | null = null;
let cloudAdapter: CloudAdapter | undefined;
let billboardAdapter: BillboardAdapter | undefined;

/** Register the Supabase cloud adapter (bead 84a.2). Takes effect on next getPlatform(). */
export const setCloudAdapter = (adapter?: CloudAdapter): void => {
  cloudAdapter = adapter;
  cached = null;
};

/** Register the global-charts adapter (bead 84a.3). Takes effect on next getPlatform(). */
export const setBillboardAdapter = (adapter?: BillboardAdapter): void => {
  billboardAdapter = adapter;
  cached = null;
};

export const getPlatform = (): PlatformBridge => {
  if (cached) return cached;
  const kind = detectPlatformKind();
  const cloud = createWebCloud(cloudAdapter);
  const billboard = createWebBillboard(billboardAdapter);
  cached = {
    kind,
    capabilities: {
      ...webCapabilities(kind),
      cloudSave: cloud.available,
      billboard: billboard.available,
    },
    haptics: webHaptics,
    presence: webPresence,
    cloud,
    billboard,
    sharing: webSharing,
  };
  return cached;
};

/** Test seam: drop the cached bridge (and adapters) so checks stay isolated. */
export const resetPlatformForTests = (): void => {
  cached = null;
  cloudAdapter = undefined;
  billboardAdapter = undefined;
};
