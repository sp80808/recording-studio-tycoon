// Dealer store — Flight Case Monetisation (bead 89o.5).
// Owns the premium purchase flow: provider products, purchase state
// machine, fulfilment into the entitlement ledger, restore, and the
// celebration payload consumed by the reveal integration (bead 89o.6).
// Never touches GameState saves; never auto-opens (explicit clicks only).

import { create } from 'zustand';
import { getProductBySku, V1_CATALOGUE } from './catalog';
import { loadLedgerCache, saveLedgerCache } from './entitlements';
import { FulfillmentService } from './fulfillment';
import { MockPurchaseProvider } from './MockPurchaseProvider';
import type {
  EntitlementId,
  LocalizedProduct,
  PurchaseProvider,
  Sku,
  StoreProduct,
} from './types';

export type PurchaseState =
  | { status: 'idle' }
  | { status: 'pending'; sku: Sku }
  | { status: 'owned'; sku: Sku }
  | { status: 'cancelled'; sku: Sku }
  | { status: 'failed'; sku: Sku; message: string };

/** Resolved premium case staged for the celebration reveal (bead 89o.6). */
export interface PremiumCelebration {
  sku: Sku;
  productTitle: string;
  /** Chosen preview ref for choose-1-of-3, else all preview refs. */
  refs: string[];
}

interface DealerState {
  dealerOpen: boolean;
  provider: PurchaseProvider;
  products: LocalizedProduct[];
  productsError: string | null;
  productsLoading: boolean;
  purchase: PurchaseState;
  celebration: PremiumCelebration | null;
  fulfillment: FulfillmentService;

  setDealerOpen: (open: boolean) => void;
  refreshProducts: () => Promise<void>;
  purchaseSku: (sku: Sku, choiceRef?: string) => Promise<void>;
  restore: () => Promise<number>;
  clearCelebration: () => void;
  ownedEntitlements: () => EntitlementId[];
  isOwned: (entitlementId: EntitlementId) => boolean;
  getProduct: (sku: Sku) => StoreProduct | undefined;
}

const provider = new MockPurchaseProvider();
const fulfillment = new FulfillmentService();
loadLedgerCache(fulfillment.getLedger());

export const useDealerStore = create<DealerState>((set, get) => ({
  dealerOpen: false,
  provider,
  products: [],
  productsError: null,
  productsLoading: false,
  purchase: { status: 'idle' },
  celebration: null,
  fulfillment,

  setDealerOpen: (open) => {
    set({ dealerOpen: open });
    if (open) void get().refreshProducts();
  },

  refreshProducts: async () => {
    set({ productsLoading: true, productsError: null });
    try {
      const products = await get().provider.listProducts();
      set({ products, productsLoading: false });
    } catch (err) {
      set({
        productsLoading: false,
        productsError: err instanceof Error ? err.message : 'Store unavailable — check connection and retry.',
      });
    }
  },

  purchaseSku: async (sku, choiceRef) => {
    const product = getProductBySku(sku);
    if (!product) {
      set({ purchase: { status: 'failed', sku, message: `Unknown product: ${sku}` } });
      return;
    }
    set({ purchase: { status: 'pending', sku } });
    try {
      const receipt = await get().provider.purchase(sku);
      const result = get().fulfillment.fulfill({ receipt, product, choiceRef });
      if (result.outcome === 'granted' || result.outcome === 'already_granted') {
        saveLedgerCache(get().fulfillment.getLedger());
        const refs = product.preview.chooseOneOfMany
          ? [result.entitlements[0]?.ref ?? choiceRef ?? '']
          : product.preview.items.map((i) => i.ref);
        set({
          purchase: { status: 'owned', sku },
          celebration: { sku, productTitle: product.title, refs },
        });
      } else {
        set({
          purchase: {
            status: 'failed',
            sku,
            message: result.outcome === 'rejected_unknown_choice' ? 'Pick one of the three shown options.' : 'Receipt not verified — nothing granted.',
          },
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Purchase failed.';
      const cancelled = /cancel/i.test(message);
      set({ purchase: cancelled ? { status: 'cancelled', sku } : { status: 'failed', sku, message } });
    }
  },

  restore: async () => {
    const receipts = await get().provider.restorePurchases();
    const results = get().fulfillment.restore(receipts, V1_CATALOGUE);
    saveLedgerCache(get().fulfillment.getLedger());
    const granted = results.filter((r) => r.outcome === 'granted').length;
    set({ purchase: { status: 'idle' } });
    return granted;
  },

  clearCelebration: () => set({ celebration: null }),

  ownedEntitlements: () => get().fulfillment.getLedger().list().map((e) => e.entitlementId),

  isOwned: (entitlementId) => get().fulfillment.getLedger().has(entitlementId),

  getProduct: (sku) => getProductBySku(sku),
}));

export function priceFor(sku: Sku, products: LocalizedProduct[]): string {
  return products.find((p) => p.sku === sku)?.displayPrice ?? '—';
}
