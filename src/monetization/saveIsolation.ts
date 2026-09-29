// Save/reset/import isolation — Flight Case Monetisation (bead 89o.8).
// Purchased ownership lives exclusively in the entitlement ledger
// (`entitlements.ts`), never in GameState saves. This module:
//   1. Strips spoof keys that a tampered save might claim as ownership.
//   2. Ensures game reset/import only touches the game save key — never
//      the offline ledger cache key.
//   3. Provides pure helpers for tests and SaveSystemContext hooks.

import { LEDGER_CACHE_KEY } from './entitlements';

/** localStorage key for the career GameState blob (SaveSystemContext). */
export const GAME_SAVE_STORAGE_KEY = 'recordingStudioTycoonSave';

/**
 * Keys that MUST NEVER be treated as purchase authority when present on a
 * GameState / save envelope. A tampered export can invent these; we strip
 * them so import cannot mint entitlements.
 */
export const SPOOF_ENTITLEMENT_CLAIM_KEYS = [
  'ownedEntitlements',
  'premiumEntitlements',
  'purchasedEntitlements',
  'entitlementLedger',
  'entitlements',
  'monetisation',
  'monetization',
  'premiumOwnership',
] as const;

export type SpoofEntitlementClaimKey = (typeof SPOOF_ENTITLEMENT_CLAIM_KEYS)[number];

export interface StripSpoofResult<T> {
  cleaned: T;
  strippedKeys: string[];
}

/** Deep-ish strip: remove spoof keys from the root object and nested `gameState`. */
export function stripSpoofedEntitlementClaims<T>(payload: T): StripSpoofResult<T> {
  if (payload === null || typeof payload !== 'object') {
    return { cleaned: payload, strippedKeys: [] };
  }

  const strippedKeys: string[] = [];
  const source = payload as Record<string, unknown>;
  const cleaned: Record<string, unknown> = { ...source };

  for (const key of SPOOF_ENTITLEMENT_CLAIM_KEYS) {
    if (Object.prototype.hasOwnProperty.call(cleaned, key)) {
      delete cleaned[key];
      strippedKeys.push(key);
    }
  }

  if (cleaned.gameState && typeof cleaned.gameState === 'object' && cleaned.gameState !== null) {
    const nested = stripSpoofedEntitlementClaims(cleaned.gameState);
    cleaned.gameState = nested.cleaned;
    for (const k of nested.strippedKeys) {
      strippedKeys.push(`gameState.${k}`);
    }
  }

  return { cleaned: cleaned as T, strippedKeys };
}

/**
 * Reset the career save without touching the entitlement ledger cache.
 * Reinstall (wiping all localStorage) is a different path — restore from
 * the purchase provider rebuilds ownership.
 */
export function resetGameSavePreservingLedger(
  storage: Pick<Storage, 'removeItem'>,
  gameSaveKey: string = GAME_SAVE_STORAGE_KEY,
): void {
  storage.removeItem(gameSaveKey);
  // Explicitly do NOT remove LEDGER_CACHE_KEY.
}

/** True when a storage key belongs to the monetisation ledger (must survive reset). */
export function isEntitlementLedgerStorageKey(key: string): boolean {
  return key === LEDGER_CACHE_KEY;
}

/**
 * Import gate: strip spoof claims from a parsed save envelope before
 * migration. Never reads or writes the entitlement ledger.
 */
export function sanitizeImportedSaveEnvelope<T extends Record<string, unknown>>(
  parsed: T,
): StripSpoofResult<T> {
  return stripSpoofedEntitlementClaims(parsed);
}
