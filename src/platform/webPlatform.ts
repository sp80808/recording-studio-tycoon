// Web fallbacks for every platform surface — bead 84a.1.
// SSR/Node-safe: every probe guards on typeof window/navigator. Native builds
// keep these as the base — adapters override per-surface, never per-call-site.

import type {
  BillboardAdapter,
  BillboardEntry,
  BillboardResult,
  BillboardSurface,
  CloudAdapter,
  CloudResult,
  CloudSaveSurface,
  HapticsSurface,
  PlatformCapabilities,
  PlatformKind,
  PresenceActivity,
  PresenceSurface,
  SharePayload,
  ShareResult,
  SharingSurface,
} from './types';

/* ---------------------------------------------------------- haptics */

// Mirrors utils/mobilePlatform hapticTick semantics (coarse pointer + vibrate
// API), self-contained so platform code stays dependency-free and test-safe.
let hapticsEnabled = true;

const canVibrate = (): boolean => {
  try {
    if (!hapticsEnabled) return false;
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    if (typeof window.matchMedia === 'function' && !window.matchMedia('(pointer: coarse)').matches) return false;
    return typeof navigator.vibrate === 'function';
  } catch {
    return false;
  }
};

export const webHaptics: HapticsSurface = {
  get available() {
    return canVibrate();
  },
  tick(pattern = 12) {
    try {
      if (canVibrate()) navigator.vibrate(pattern);
    } catch {
      /* ignore */
    }
  },
  get enabled() {
    return hapticsEnabled;
  },
  setEnabled(on: boolean) {
    hapticsEnabled = on;
  },
};

/* ---------------------------------------------------------- presence */

export const webPresence: PresenceSurface = {
  available: false,
  setActivity(_activity: PresenceActivity) {
    /* No rich-presence channel on web — no-op by design. */
  },
  clearActivity() {
    /* No-op. */
  },
};

/* -------------------------------------------------------------- cloud */

const cloudUnavailable: CloudResult = { ok: false, reason: 'unavailable' };

export const createWebCloud = (adapter?: CloudAdapter): CloudSaveSurface => ({
  get available() {
    return !!adapter;
  },
  get providerId() {
    return adapter?.providerId ?? 'none';
  },
  async upload(slot: string, payload: string): Promise<CloudResult> {
    if (!adapter) return cloudUnavailable;
    return adapter.upload(slot, payload);
  },
  async download(slot: string): Promise<CloudResult & { payload?: string }> {
    if (!adapter) return cloudUnavailable;
    return adapter.download(slot);
  },
  async listSlots(): Promise<CloudResult & { slots?: { slot: string; updatedAt: number }[] }> {
    if (!adapter) return cloudUnavailable;
    return adapter.listSlots();
  },
});

/* ----------------------------------------------------------- billboard */

const billboardUnavailable: BillboardResult = { ok: false, reason: 'unavailable' };

export const createWebBillboard = (adapter?: BillboardAdapter): BillboardSurface => ({
  get available() {
    return !!adapter;
  },
  async submitTopHit(entry: BillboardEntry): Promise<BillboardResult> {
    if (!adapter) return billboardUnavailable;
    return adapter.submitTopHit(entry);
  },
  async fetchGlobalTop(limit: number): Promise<BillboardResult> {
    if (!adapter) return billboardUnavailable;
    return adapter.fetchGlobalTop(limit);
  },
});

/* ------------------------------------------------------------- sharing */

const hasNativeShare = (): boolean => {
  try {
    return typeof navigator !== 'undefined' && typeof (navigator as Navigator & { share?: unknown }).share === 'function';
  } catch {
    return false;
  }
};

export const webSharing: SharingSurface = {
  get nativeShare() {
    return hasNativeShare();
  },
  async share(payload: SharePayload): Promise<ShareResult> {
    // 1. Native sheet where offered (mobile browsers).
    if (hasNativeShare()) {
      try {
        await (navigator as Navigator & { share: (p: SharePayload) => Promise<void> }).share(payload);
        return { ok: true, via: 'native' };
      } catch (e) {
        const name = e instanceof Error ? e.name : '';
        if (name === 'AbortError' || name === 'NotAllowedError') return { ok: false, reason: 'dismissed' };
        // Fall through to clipboard on other share errors.
      }
    }
    // 2. Clipboard fallback — copy the most useful single string.
    try {
      const text = [payload.title, payload.text, payload.url].filter(Boolean).join(' — ');
      if (typeof navigator !== 'undefined' && navigator.clipboard && text) {
        await navigator.clipboard.writeText(text);
        return { ok: true, via: 'clipboard' };
      }
    } catch {
      /* fall through */
    }
    return { ok: false, reason: 'unavailable' };
  },
};

/* -------------------------------------------------------- capabilities */

export const webCapabilities = (kind: PlatformKind): PlatformCapabilities => ({
  kind,
  haptics: webHaptics.available,
  presence: webPresence.available,
  cloudSave: false,
  billboard: false,
  nativeShare: webSharing.nativeShare,
});
