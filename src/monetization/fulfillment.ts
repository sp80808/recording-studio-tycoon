// Idempotent fulfilment — Flight Case Monetisation (bead 89o.4).
// Rules:
// - Only `verified` receipts grant. Anything else grants nothing.
// - `transactionId + entitlementId` grants at most once (duplicate
//   callbacks, app reload mid-fulfilment, restore-after-reinstall safe).
// - Choose-1-of-3 products grant once, recording the chosen preview ref;
//   the choice must be one of the disclosed preview items.
// - Reversed (refunded) transactions revoke their entitlements gracefully.
// - Fulfilment never reads GameState saves and never writes them: a local
//   save cannot spoof a purchased entitlement.

import { EntitlementLedger } from './entitlements';
import type { OwnedEntitlement } from './entitlements';
import type {
  EntitlementGrant,
  PurchaseReceipt,
  StoreProduct,
  TransactionId,
} from './types';

export type FulfillOutcome =
  | 'granted'
  | 'already_granted'
  | 'rejected_unverified'
  | 'rejected_unknown_choice'
  | 'revoked';

export interface FulfillResult {
  outcome: FulfillOutcome;
  entitlements: OwnedEntitlement[];
}

export interface FulfillRequest {
  receipt: PurchaseReceipt;
  product: StoreProduct;
  /** Required for choose-1-of-3 products: one of product.preview.items[].ref. */
  choiceRef?: string;
}

export class FulfillmentService {
  constructor(private readonly ledger: EntitlementLedger = new EntitlementLedger()) {}

  getLedger(): EntitlementLedger {
    return this.ledger;
  }

  fulfill({ receipt, product, choiceRef }: FulfillRequest): FulfillResult {
    if (receipt.status !== 'verified' || receipt.sku !== product.sku) {
      return { outcome: 'rejected_unverified', entitlements: [] };
    }
    if (product.preview.chooseOneOfMany) {
      return this.fulfillChoice(receipt, product, choiceRef);
    }
    const already = this.allDuplicate(receipt.transactionId, product.entitlements);
    const granted = product.entitlements.map((g) =>
      this.grantOnce(receipt.transactionId, g, g.ref).entitlement,
    );
    return { outcome: already ? 'already_granted' : 'granted', entitlements: granted };
  }

  private fulfillChoice(receipt: PurchaseReceipt, product: StoreProduct, choiceRef?: string): FulfillResult {
    const offered = product.preview.items.map((i) => i.ref);
    if (!choiceRef || !offered.includes(choiceRef)) {
      return { outcome: 'rejected_unknown_choice', entitlements: [] };
    }
    const access = product.entitlements[0];
    // One grant per transaction: a second choice for the same purchase is a duplicate.
    if (this.ledger.wasProcessed(receipt.transactionId, access.entitlementId)) {
      const existing = this.ledger.get(access.entitlementId);
      return { outcome: 'already_granted', entitlements: existing ? [existing] : [] };
    }
    const { entitlement } = this.grantOnce(receipt.transactionId, access, choiceRef);
    return { outcome: 'granted', entitlements: [entitlement] };
  }

  private grantOnce(
    transactionId: TransactionId,
    grant: EntitlementGrant,
    ref: string,
  ): { result: 'granted' | 'already_granted'; entitlement: OwnedEntitlement } {
    return this.ledger.grant({
      entitlementId: grant.entitlementId,
      kind: grant.kind,
      ref,
      grantedByTransaction: transactionId,
      grantedAt: Date.now(),
    });
  }

  private allDuplicate(transactionId: TransactionId, grants: EntitlementGrant[]): boolean {
    return grants.every((g) => this.ledger.wasProcessed(transactionId, g.entitlementId));
  }

  /** Re-fulfill verified receipts (restore after reinstall/reset). Idempotent. */
  restore(receipts: PurchaseReceipt[], products: StoreProduct[]): FulfillResult[] {
    return receipts
      .filter((r) => r.status === 'verified')
      .map((receipt) => {
        const product = products.find((p) => p.sku === receipt.sku);
        if (!product) return { outcome: 'rejected_unverified' as const, entitlements: [] };
        if (product.preview.chooseOneOfMany) {
          const existing = product.entitlements
            .map((e) => this.ledger.get(e.entitlementId))
            .find((e) => e && e.grantedByTransaction === receipt.transactionId);
          if (existing) return { outcome: 'already_granted' as const, entitlements: [existing] };
          // Choice not yet made for this transaction: nothing to restore yet.
          return { outcome: 'already_granted' as const, entitlements: [] };
        }
        return this.fulfill({ receipt, product });
      });
  }

  /** Refund/reversal: revoke every entitlement granted by this transaction. */
  reverse(transactionId: TransactionId): FulfillResult {
    const revoked: OwnedEntitlement[] = [];
    for (const e of this.ledger.list()) {
      if (e.grantedByTransaction === transactionId && this.ledger.revoke(e.entitlementId, 'reversed')) {
        const updated = this.ledger.get(e.entitlementId);
        if (updated) revoked.push(updated);
      }
    }
    return { outcome: 'revoked', entitlements: revoked };
  }
}
