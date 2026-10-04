// Public platform API — bead 84a.1.
export type {
  BillboardAdapter,
  BillboardEntry,
  BillboardResult,
  BillboardSurface,
  CloudAdapter,
  CloudFailureReason,
  CloudProviderId,
  CloudResult,
  CloudSaveSurface,
  CloudSlotSummary,
  HapticsSurface,
  PlatformCapabilities,
  PlatformKind,
  PresenceActivity,
  PresenceSurface,
  SharePayload,
  ShareResult,
  SharingSurface,
} from './types';
export {
  detectPlatformKind,
  getPlatform,
  resetPlatformForTests,
  setBillboardAdapter,
  setCloudAdapter,
} from './platformBridge';
export type { PlatformBridge } from './platformBridge';
export {
  deleteLocalSaveSlot,
  listLocalSaveSlots,
  readLocalSaveSlot,
  resetLocalSaveStoreForTests,
  writeLocalSaveSlot,
} from './localSaveStore';
export type { LocalSlotRecord } from './localSaveStore';
export {
  CAREER_CLOUD_SLOT,
  CLOUD_SAVES_TABLE,
  createSupabaseCloudAdapter,
  disabledBillboard,
  ensureGuestUserId,
  initCloudSave,
  registerDisabledBillboard,
  resetCloudAuthForTests,
} from './supabaseCloud';
export type { SupabaseLike } from './supabaseCloud';
