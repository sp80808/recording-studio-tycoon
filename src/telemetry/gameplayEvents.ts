/**
 * Gameplay telemetry contract (#59). Framework-agnostic and local-first: gameplay code only ever calls the
 * `GameplayEventSink` interface, never a vendor SDK. Events carry allowlisted, anonymous tuning facts (enums,
 * bands, counts). There is no free text, no names, no identifiers and no pointer data.
 */

export const TRACE_SCHEMA_VERSION = 1;
/** Bump when simulation rules change in a way that makes old traces non-comparable. */
export const SIMULATION_VERSION = '2026.10.0';
/** Bump when balance numbers change on purpose; the balance hash catches accidental drift too. */
export const BALANCE_VERSION = '2026.10.0';

export type GameplayEventName =
  | 'enquiry_generated'
  | 'enquiry_viewed'
  | 'enquiry_accepted'
  | 'enquiry_declined'
  | 'enquiry_expired'
  | 'session_booked'
  | 'session_started'
  | 'intervention_offered'
  | 'intervention_intervened'
  | 'intervention_delegated'
  | 'intervention_skipped'
  | 'session_settled'
  | 'staff_hired'
  | 'room_purchased'
  | 'gear_bought'
  | 'gear_sold'
  | 'repair_completed'
  | 'relationship_tier_changed'
  | 'management_panel_opened';

export type TelemetryValue = string | number | boolean | null;

export interface GameplayTelemetryEvent {
  name: GameplayEventName;
  runId: string;
  gameDay: number;
  simulationVersion: string;
  balanceVersion: string;
  seed?: string;
  properties: Record<string, TelemetryValue>;
}

export interface GameplayEventSink {
  capture(event: GameplayTelemetryEvent): void;
}

/** The only property keys each event may carry. Anything else is dropped before it reaches a sink. */
export const ALLOWED_PROPERTIES: Record<GameplayEventName, readonly string[]> = {
  enquiry_generated: ['service', 'feeBand', 'durationBand', 'source'],
  enquiry_viewed: ['service', 'feeBand', 'durationBand', 'roomsFree'],
  enquiry_accepted: ['service', 'feeBand', 'durationBand', 'marginBand', 'deposit', 'roomsFree'],
  enquiry_declined: ['service', 'feeBand', 'durationBand', 'marginBand', 'deposit', 'roomsFree'],
  enquiry_expired: ['service', 'feeBand', 'durationBand'],
  session_booked: ['service', 'feeBand', 'roomType'],
  session_started: ['service', 'feeBand', 'roomType'],
  intervention_offered: ['kind'],
  intervention_intervened: ['kind'],
  intervention_delegated: ['kind'],
  intervention_skipped: ['kind'],
  session_settled: ['service', 'qualityBand', 'quality', 'feeBand', 'deposit'],
  staff_hired: ['role'],
  room_purchased: ['roomType'],
  gear_bought: ['source', 'priceBand'],
  gear_sold: ['priceBand'],
  repair_completed: ['kind', 'condition'],
  relationship_tier_changed: ['from', 'to'],
  management_panel_opened: ['destination'],
};

const SAFE_STRING = /^[a-z0-9][a-z0-9_.\-]{0,31}$/i;

/** Keep only allowlisted keys with primitive values; strings must look like enum tokens, never prose or names. */
export const sanitizeProperties = (
  name: GameplayEventName,
  properties: Record<string, unknown> | undefined,
): Record<string, TelemetryValue> => {
  const out: Record<string, TelemetryValue> = {};
  const allowed = ALLOWED_PROPERTIES[name] ?? [];
  for (const key of allowed) {
    const v = properties?.[key];
    if (v === null) out[key] = null;
    else if (typeof v === 'boolean') out[key] = v;
    else if (typeof v === 'number' && Number.isFinite(v)) out[key] = Math.round(v * 100) / 100;
    else if (typeof v === 'string' && SAFE_STRING.test(v)) out[key] = v;
  }
  return out;
};

export type FeeBand = 'low' | 'mid' | 'high' | 'top';
export const feeBand = (fee: number): FeeBand => (fee < 300 ? 'low' : fee < 800 ? 'mid' : fee < 1500 ? 'high' : 'top');
export const durationBand = (days: number): 'short' | 'medium' | 'long' => (days <= 1 ? 'short' : days <= 3 ? 'medium' : 'long');
export const qualityBand = (score: number): 'poor' | 'good' | 'excellent' => (score < 50 ? 'poor' : score < 80 ? 'good' : 'excellent');

/** Small stable string hash (FNV-1a), used for balance config and state fingerprints. Not cryptographic. */
export const fnv1a = (text: string): string => {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
};
