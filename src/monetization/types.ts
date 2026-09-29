// Monetisation domain types — Flight Case Monetisation (bead 89o).
// Prices live with the payment provider, never here and never hard-coded
// in gameplay components. All premium contents are previewable (no paid
// random loot in v1).

export type ProductId = string;
export type EntitlementId = string;
export type Sku = string;
export type TransactionId = string;

export type StoreProductType =
  | 'case_cosmetic' // liveries, sticker sets, reveal styles
  | 'curated_case' // fixed disclosed contents OR disclosed choose-1-of-3
  | 'studio_pack' // décor bundles
  | 'supporter_pack'; // cosmetics + collector content

/** A single disclosed item inside a curated product preview. */
export interface PreviewItem {
  /** Human-readable label shown in the preview surface. */
  label: string;
  /** Kind of thing granted — resolves against existing catalogues. */
  kind: 'flight_case_tier' | 'equipment_variant' | 'collectible' | 'reveal_style' | 'decor';
  /** Reference id: FlightCaseTier, equipmentArt equipmentId, collectible id, etc. */
  ref: string;
  icon: string;
}

export interface ProductPreview {
  tagline: string;
  /** Exact contents for fixed products; the disclosed options for choose-1-of-3. */
  items: PreviewItem[];
  /** True when the buyer picks one of `items` at claim time. */
  chooseOneOfMany: boolean;
}

export type EntitlementKind =
  | 'case_livery'
  | 'sticker_set'
  | 'decor_bundle'
  | 'collector_variant'
  | 'reveal_style'
  | 'curated_case_access';

export interface EntitlementGrant {
  entitlementId: EntitlementId;
  kind: EntitlementKind;
  /** Reference resolved by fulfilment (art variant, collectible, case tier…). */
  ref: string;
}

export interface StoreProduct {
  id: ProductId;
  sku: Sku;
  type: StoreProductType;
  title: string;
  description: string;
  preview: ProductPreview;
  entitlements: EntitlementGrant[];
}

export type PurchaseProviderId = 'mock' | 'steam' | 'apple' | 'google' | 'web';

export type ReceiptStatus = 'pending' | 'verified' | 'reversed';

export interface PurchaseReceipt {
  provider: PurchaseProviderId;
  transactionId: TransactionId;
  sku: Sku;
  status: ReceiptStatus;
}

export interface LocalizedProduct {
  sku: Sku;
  /** Provider-formatted display price, e.g. "$4.99" / "4,99 €". */
  displayPrice: string;
  /** ISO 4217 code reported by the provider, e.g. "USD". */
  currencyCode: string;
}

export interface PurchaseProvider {
  readonly id: PurchaseProviderId;
  listProducts(): Promise<LocalizedProduct[]>;
  purchase(sku: Sku): Promise<PurchaseReceipt>;
  restorePurchases(): Promise<PurchaseReceipt[]>;
}
