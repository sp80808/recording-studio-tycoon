// Platform surface contracts — bead 84a.1.
// Pure types only: native adapters (Capacitor/Tauri, beads 84a.4/84a.5) and the
// Supabase cloud adapter (bead 84a.2) implement these same interfaces. Gameplay
// code talks to the `PlatformBridge` facade, never to window/Capacitor/Tauri.

/** Where the game is currently running. */
export type PlatformKind = 'web' | 'capacitor' | 'tauri';

/** What the active platform can actually do (probed, not assumed). */
export interface PlatformCapabilities {
  kind: PlatformKind;
  haptics: boolean;
  presence: boolean;
  cloudSave: boolean;
  billboard: boolean;
  nativeShare: boolean;
}

/* ---------------------------------------------------------- haptics */

export interface HapticsSurface {
  /** True when a vibration path is reachable right now. */
  readonly available: boolean;
  /** Fire-and-forget buzz. Always safe to call; no-ops when unavailable. */
  tick(pattern?: number | number[]): void;
  readonly enabled: boolean;
  setEnabled(on: boolean): void;
}

/* ---------------------------------------------------------- presence */

export interface PresenceActivity {
  details?: string;
  state?: string;
}

export interface PresenceSurface {
  /** True when a rich-presence channel (e.g. Discord via Tauri) is live. */
  readonly available: boolean;
  /** Fire-and-forget. No-ops on web. */
  setActivity(activity: PresenceActivity): void;
  clearActivity(): void;
}

/* -------------------------------------------------------------- cloud */

export type CloudProviderId = 'none' | 'supabase';

export interface CloudSlotSummary {
  slot: string;
  updatedAt: number;
}

export type CloudFailureReason = 'unavailable' | 'offline' | 'auth' | 'conflict' | 'error';

export interface CloudResult {
  ok: boolean;
  reason?: CloudFailureReason;
  detail?: string;
}

/** Adapter seam for bead 84a.2 (IndexedDB + Supabase sync). Web default: disabled. */
export interface CloudAdapter {
  readonly providerId: Exclude<CloudProviderId, 'none'>;
  upload(slot: string, payload: string): Promise<CloudResult>;
  download(slot: string): Promise<CloudResult & { payload?: string }>;
  listSlots(): Promise<CloudResult & { slots?: CloudSlotSummary[] }>;
}

export interface CloudSaveSurface {
  readonly available: boolean;
  readonly providerId: CloudProviderId;
  upload(slot: string, payload: string): Promise<CloudResult>;
  download(slot: string): Promise<CloudResult & { payload?: string }>;
  listSlots(): Promise<CloudResult & { slots?: CloudSlotSummary[] }>;
}

/* ----------------------------------------------------------- billboard */

export interface BillboardEntry {
  title: string;
  artist: string;
  genre: string;
  score: number;
}

export interface BillboardResult {
  ok: boolean;
  reason?: CloudFailureReason;
  detail?: string;
  rows?: BillboardEntry[];
}

/** Adapter seam for bead 84a.3 (Supabase global charts). Web default: disabled. */
export interface BillboardAdapter {
  submitTopHit(entry: BillboardEntry): Promise<BillboardResult>;
  fetchGlobalTop(limit: number): Promise<BillboardResult>;
}

export interface BillboardSurface {
  readonly available: boolean;
  submitTopHit(entry: BillboardEntry): Promise<BillboardResult>;
  fetchGlobalTop(limit: number): Promise<BillboardResult>;
}

/* ------------------------------------------------------------- sharing */

export interface SharePayload {
  title?: string;
  text?: string;
  url?: string;
}

export interface ShareResult {
  ok: boolean;
  /** 'native' | 'clipboard' on success; reason code otherwise. */
  via?: 'native' | 'clipboard';
  reason?: 'unavailable' | 'dismissed' | 'error';
  detail?: string;
}

export interface SharingSurface {
  /** True when navigator.share exists. Clipboard fallback is separate. */
  readonly nativeShare: boolean;
  share(payload: SharePayload): Promise<ShareResult>;
}
