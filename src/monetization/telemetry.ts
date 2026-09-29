// Privacy-minimal monetisation telemetry — Flight Case Monetisation (bead 89o.7).
// Emits funnel events with allow-listed dimensions only. Never carries payment
// credentials, display prices, raw receipts, or PII.

import type { EntitlementId, EntitlementKind, Sku, StoreProductType } from './types';

export type MonetisationTelemetryEvent =
  | 'store_opened'
  | 'product_viewed'
  | 'purchase_started'
  | 'cancelled'
  | 'verified'
  | 'failed'
  | 'entitlement_restored'
  | 'premium_case_opened'
  | 'premium_item_equipped';

/** Allow-listed dimension keys. Anything else is dropped at emit time. */
export type MonetisationDimensionKey =
  | 'experimentId'
  | 'sku'
  | 'productType'
  | 'section'
  | 'entitlementId'
  | 'entitlementKind'
  | 'reason'
  | 'source'
  | 'restoredCount'
  | 'choiceRef';

export type MonetisationDimensions = Partial<
  Record<MonetisationDimensionKey, string | number | boolean>
>;

export interface MonetisationTelemetryRecord {
  event: MonetisationTelemetryEvent;
  at: number;
  dimensions: MonetisationDimensions;
}

export interface MonetisationTelemetrySink {
  record(entry: MonetisationTelemetryRecord): void;
}

/** Substrings that must never appear as dimension keys or string values. */
const FORBIDDEN_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /credential/i,
  /card[_-]?number/i,
  /\bcvv\b/i,
  /pan\b/i,
  /auth[_-]?code/i,
  /display[_-]?price/i,
  /receipt/i,
  /api[_-]?key/i,
];

const ALLOWED_KEYS = new Set<MonetisationDimensionKey>([
  'experimentId',
  'sku',
  'productType',
  'section',
  'entitlementId',
  'entitlementKind',
  'reason',
  'source',
  'restoredCount',
  'choiceRef',
]);

export function isForbiddenTelemetryValue(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return FORBIDDEN_PATTERNS.some((re) => re.test(value));
}

export function scrubDimensions(raw: MonetisationDimensions): MonetisationDimensions {
  const out: MonetisationDimensions = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!ALLOWED_KEYS.has(key as MonetisationDimensionKey)) continue;
    if (value === undefined || value === null) continue;
    if (typeof value === 'string' && isForbiddenTelemetryValue(value)) continue;
    if (isForbiddenTelemetryValue(key)) continue;
    out[key as MonetisationDimensionKey] = value;
  }
  return out;
}

/** Funnel KPIs derived from the in-memory buffer (dev/tests; not a live pipe). */
export interface MonetisationKpis {
  storeOpens: number;
  productViews: number;
  purchaseStarts: number;
  purchaseCancelled: number;
  purchaseVerified: number;
  purchaseFailed: number;
  entitlementsRestored: number;
  premiumCasesOpened: number;
  premiumItemsEquipped: number;
  /** purchase_started / product_viewed (0 when no views). */
  viewToStartRate: number;
  /** verified / purchase_started (0 when no starts). */
  startToVerifiedRate: number;
}

export function computeMonetisationKpis(records: readonly MonetisationTelemetryRecord[]): MonetisationKpis {
  const count = (event: MonetisationTelemetryEvent) =>
    records.filter((r) => r.event === event).length;
  const storeOpens = count('store_opened');
  const productViews = count('product_viewed');
  const purchaseStarts = count('purchase_started');
  const purchaseCancelled = count('cancelled');
  const purchaseVerified = count('verified');
  const purchaseFailed = count('failed');
  const entitlementsRestored = count('entitlement_restored');
  const premiumCasesOpened = count('premium_case_opened');
  const premiumItemsEquipped = count('premium_item_equipped');
  return {
    storeOpens,
    productViews,
    purchaseStarts,
    purchaseCancelled,
    purchaseVerified,
    purchaseFailed,
    entitlementsRestored,
    premiumCasesOpened,
    premiumItemsEquipped,
    viewToStartRate: productViews === 0 ? 0 : purchaseStarts / productViews,
    startToVerifiedRate: purchaseStarts === 0 ? 0 : purchaseVerified / purchaseStarts,
  };
}

export const MONETISATION_KPI_LIST = [
  'storeOpens',
  'productViews',
  'purchaseStarts',
  'purchaseCancelled',
  'purchaseVerified',
  'purchaseFailed',
  'entitlementsRestored',
  'premiumCasesOpened',
  'premiumItemsEquipped',
  'viewToStartRate',
  'startToVerifiedRate',
] as const;

class MemorySink implements MonetisationTelemetrySink {
  readonly records: MonetisationTelemetryRecord[] = [];
  record(entry: MonetisationTelemetryRecord): void {
    this.records.push(entry);
  }
  clear(): void {
    this.records.length = 0;
  }
}

const memorySink = new MemorySink();
let activeSink: MonetisationTelemetrySink = memorySink;
let nowFn: () => number = () => Date.now();

export function setMonetisationTelemetrySink(sink: MonetisationTelemetrySink | null): void {
  activeSink = sink ?? memorySink;
}

export function getMonetisationTelemetryBuffer(): readonly MonetisationTelemetryRecord[] {
  return memorySink.records;
}

export function clearMonetisationTelemetryBuffer(): void {
  memorySink.clear();
}

/** Test hook only. */
export function setMonetisationTelemetryClock(fn: (() => number) | null): void {
  nowFn = fn ?? (() => Date.now());
}

export function trackMonetisation(
  event: MonetisationTelemetryEvent,
  dimensions: MonetisationDimensions = {},
): MonetisationTelemetryRecord {
  const entry: MonetisationTelemetryRecord = {
    event,
    at: nowFn(),
    dimensions: scrubDimensions(dimensions),
  };
  activeSink.record(entry);
  return entry;
}

export function trackStoreOpened(dims: { experimentId?: string; section?: string } = {}): void {
  trackMonetisation('store_opened', dims);
}

export function trackProductViewed(dims: {
  sku: Sku;
  productType: StoreProductType;
  section?: string;
  experimentId?: string;
}): void {
  trackMonetisation('product_viewed', dims);
}

export function trackPurchaseStarted(dims: {
  sku: Sku;
  productType?: StoreProductType;
  experimentId?: string;
  choiceRef?: string;
}): void {
  trackMonetisation('purchase_started', dims);
}

export function trackPurchaseCancelled(dims: {
  sku: Sku;
  reason?: string;
  experimentId?: string;
}): void {
  trackMonetisation('cancelled', dims);
}

export function trackPurchaseVerified(dims: {
  sku: Sku;
  experimentId?: string;
  choiceRef?: string;
}): void {
  trackMonetisation('verified', dims);
}

export function trackPurchaseFailed(dims: {
  sku: Sku;
  reason: string;
  experimentId?: string;
}): void {
  trackMonetisation('failed', { ...dims, reason: dims.reason.slice(0, 120) });
}

export function trackEntitlementRestored(dims: {
  restoredCount: number;
  experimentId?: string;
}): void {
  trackMonetisation('entitlement_restored', dims);
}

export function trackPremiumCaseOpened(dims: {
  sku: Sku;
  experimentId?: string;
}): void {
  trackMonetisation('premium_case_opened', dims);
}

export function trackPremiumItemEquipped(dims: {
  entitlementId: EntitlementId;
  entitlementKind: EntitlementKind;
  experimentId?: string;
  source?: string;
}): void {
  trackMonetisation('premium_item_equipped', dims);
}
