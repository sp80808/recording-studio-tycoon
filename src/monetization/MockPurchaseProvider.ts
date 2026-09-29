// MockPurchaseProvider — Flight Case Monetisation (bead 89o.3).
// Deterministic stand-in for Steam/Apple/Google/Web billing. Holds the
// localised mock price table (the catalogue itself is price-free) and
// simulates pending / cancel / fail / duplicate-callback / offline modes.
// Receipts are structurally valid but provider-tagged "mock" and never
// backend-verified — see BackendVerifiedProvider for the real contract.

import { getProductBySku, V1_CATALOGUE } from './catalog';
import type {
  LocalizedProduct,
  PurchaseProvider,
  PurchaseReceipt,
  Sku,
  TransactionId,
} from './types';
import type { ProviderMode, ProviderOptions } from './PurchaseProvider';

const MOCK_PRICES: Record<Sku, { displayPrice: string; currencyCode: string }> = {
  'rst.case_cosmetic.sunburst_livery_v1': { displayPrice: '$2.99', currencyCode: 'USD' },
  'rst.case_cosmetic.tour_stickers_v1': { displayPrice: '$1.99', currencyCode: 'USD' },
  'rst.studio_pack.control_room_v1': { displayPrice: '$4.99', currencyCode: 'USD' },
  'rst.curated_case.seventies_analog_v1': { displayPrice: '$6.99', currencyCode: 'USD' },
  'rst.case_cosmetic.gold_vu_reveal_v1': { displayPrice: '$2.99', currencyCode: 'USD' },
  'rst.curated_case.fairychild_gold_v1': { displayPrice: '$3.99', currencyCode: 'USD' },
  'rst.curated_case.pick_trio_v1': { displayPrice: '$5.99', currencyCode: 'USD' },
  'rst.supporter_pack.road_crew_v1': { displayPrice: '$9.99', currencyCode: 'USD' },
};

let transactionCounter = 0;

const nextTransactionId = (): TransactionId =>
  `mock-txn-${Date.now()}-${(transactionCounter += 1)}`;

export class MockPurchaseProvider implements PurchaseProvider {
  readonly id = 'mock' as const;
  readonly backendVerified = false;
  private mode: ProviderMode;
  private latencyMs: number;
  /** Receipts "owned" by this mock account — survives provider reload. */
  private owned: PurchaseReceipt[] = [];
  private failNextList = false;

  constructor(options: ProviderOptions = {}) {
    this.mode = options.mode ?? 'success';
    this.latencyMs = options.latencyMs ?? 150;
  }

  setMode(mode: ProviderMode): void {
    this.mode = mode;
  }

  /** Test hook: next listProducts() call throws (provider unavailable). */
  failNextListProducts(): void {
    this.failNextList = true;
  }

  private wait(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this.latencyMs));
  }

  async listProducts(): Promise<LocalizedProduct[]> {
    if (this.mode === 'offline') throw new Error('mock provider offline');
    if (this.failNextList) {
      this.failNextList = false;
      throw new Error('mock provider unavailable');
    }
    await this.wait();
    return V1_CATALOGUE.map((p) => ({
      sku: p.sku,
      ...(MOCK_PRICES[p.sku] ?? { displayPrice: '$0.00', currencyCode: 'USD' }),
    }));
  }

  async purchase(sku: Sku): Promise<PurchaseReceipt> {
    if (this.mode === 'offline') throw new Error('mock provider offline');
    const product = getProductBySku(sku);
    if (!product) throw new Error(`unknown sku: ${sku}`);
    await this.wait();

    switch (this.mode) {
      case 'cancelled':
        throw purchaseError('cancelled', `purchase cancelled by user: ${sku}`);
      case 'failed':
        throw purchaseError('failed', `purchase failed verification: ${sku}`);
      case 'pending_then_success':
      case 'success':
      case 'duplicate_callback': {
        const receipt: PurchaseReceipt = {
          provider: 'mock',
          transactionId: nextTransactionId(),
          sku,
          status: 'verified',
        };
        this.owned.push(receipt);
        return receipt;
      }
    }
  }

  async restorePurchases(): Promise<PurchaseReceipt[]> {
    if (this.mode === 'offline') throw new Error('mock provider offline');
    await this.wait();
    return [...this.owned];
  }
}

export class MockPurchaseError extends Error {
  readonly code: 'cancelled' | 'failed' | 'offline' | 'unknown_sku';
  constructor(code: MockPurchaseError['code'], message: string) {
    super(message);
    this.code = code;
  }
}

const purchaseError = (
  code: MockPurchaseError['code'],
  message: string,
): MockPurchaseError => new MockPurchaseError(code, message);
