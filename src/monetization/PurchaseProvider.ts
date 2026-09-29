// PurchaseProvider contract — Flight Case Monetisation (bead 89o.3).
// The provider is the authority on prices (localised display strings) and
// receipt issuance. Gameplay components never hard-code currencies and never
// mint receipts themselves.

import type {
  LocalizedProduct,
  PurchaseProvider,
  PurchaseProviderId,
  PurchaseReceipt,
  Sku,
} from './types';

export type { PurchaseProvider };
export type ProviderMode =
  | 'success'
  | 'pending_then_success'
  | 'cancelled'
  | 'failed'
  | 'duplicate_callback'
  | 'offline';

export interface ProviderOptions {
  mode?: ProviderMode;
  /** Simulated latency in ms (default 150; 0 for tests). */
  latencyMs?: number;
}

export const PROVIDER_ID: PurchaseProviderId = 'mock';

/**
 * Steam/Apple/Google adapters (beads 89o.10 / later slices) implement this
 * same interface. Transaction init/finalisation for real-money providers
 * belongs on a secure backend; browser code only ever sees receipts.
 */
export interface BackendVerifiedProvider extends PurchaseProvider {
  /** True when receipts are verified server-side (never true for mock). */
  readonly backendVerified: boolean;
}
