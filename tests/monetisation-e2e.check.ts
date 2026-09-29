/**
 * Monetisation 9 — mock vertical-slice E2E (bead 89o.9).
 * Drives catalogue → purchase → fulfilment → cinematic reveal payload →
 * surviving ownership + telemetry without Playwright.
 */
import assert from 'node:assert/strict';
import {
  createInitialRevealState,
  revealReducer,
} from '../src/features/boxDrops/revealStateMachine';
import { generateBoxLoot } from '../src/features/boxDrops/lootGenerator';
import { getProductBySku, V1_CATALOGUE, validateCatalogue } from '../src/monetization/catalog';
import {
  EntitlementLedger,
  clearLedgerCache,
  loadLedgerCache,
  saveLedgerCache,
} from '../src/monetization/entitlements';
import { assertExperimentsSafe } from '../src/monetization/experiments';
import { FulfillmentService } from '../src/monetization/fulfillment';
import { MockPurchaseError, MockPurchaseProvider } from '../src/monetization/MockPurchaseProvider';
import { celebrationToDisplay } from '../src/monetization/reveal';
import {
  GAME_SAVE_STORAGE_KEY,
  resetGameSavePreservingLedger,
} from '../src/monetization/saveIsolation';
import { createInitialChoreState, executeStudioChore } from '../src/simulation/choreEngine';
import {
  clearMonetisationTelemetryBuffer,
  getMonetisationTelemetryBuffer,
  setMonetisationTelemetryClock,
  trackPremiumCaseOpened,
  trackPurchaseCancelled,
  trackPurchaseFailed,
  trackPurchaseStarted,
  trackPurchaseVerified,
  trackStoreOpened,
} from '../src/monetization/telemetry';
import type { PurchaseReceipt, StoreProduct } from '../src/monetization/types';

const SKU_LIVERY = 'rst.case_cosmetic.sunburst_livery_v1';
const SKU_CURATED = 'rst.curated_case.seventies_analog_v1';
const SKU_PICK = 'rst.curated_case.pick_trio_v1';

class MemoryStorage {
  private data = new Map<string, string>();
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
  getItem(k: string) {
    return this.data.has(k) ? this.data.get(k)! : null;
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
  has(k: string) {
    return this.data.has(k);
  }
}

function product(sku: string): StoreProduct {
  const p = getProductBySku(sku);
  assert.ok(p, `missing catalogue product ${sku}`);
  return p;
}

async function purchaseVerified(
  provider: MockPurchaseProvider,
  sku: string,
): Promise<PurchaseReceipt> {
  const receipt = await provider.purchase(sku);
  assert.equal(receipt.status, 'verified');
  assert.equal(receipt.provider, 'mock');
  assert.equal(receipt.sku, sku);
  return receipt;
}

// ---------------------------------------------------------------------------
// 1. Catalogue / SKU uniqueness
// ---------------------------------------------------------------------------
{
  const errors = validateCatalogue(V1_CATALOGUE);
  assert.deepEqual(errors, [], `catalogue integrity: ${errors.join('; ')}`);
  const skus = V1_CATALOGUE.map((p) => p.sku);
  assert.equal(new Set(skus).size, skus.length, 'SKUs must be unique');
  const ids = V1_CATALOGUE.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length, 'product ids must be unique');
  for (const p of V1_CATALOGUE) {
    assert.ok(p.preview.items.length > 0, `${p.id} must disclose contents`);
    assert.ok(!p.preview.chooseOneOfMany || p.preview.items.length >= 2);
  }
  console.log('PASS: catalogue / SKU uniqueness');
}

async function runSlice(): Promise<void> {
  setMonetisationTelemetryClock(() => 1_700_000_100_000);
  clearMonetisationTelemetryBuffer();

  // ---------------------------------------------------------------------------
  // 2. Happy path: catalogue → purchase → fulfil → reveal → ownership + telemetry
  // ---------------------------------------------------------------------------
  {
    const provider = new MockPurchaseProvider({ mode: 'success', latencyMs: 0 });
    const ledger = new EntitlementLedger();
    const fulfillment = new FulfillmentService(ledger);
    const curated = product(SKU_CURATED);

    trackStoreOpened({ experimentId: 'A' });
    const listed = await provider.listProducts();
    assert.ok(listed.some((p) => p.sku === SKU_CURATED));
    assert.ok(listed.every((p) => p.displayPrice && p.currencyCode));

    trackPurchaseStarted({
      sku: SKU_CURATED,
      productType: curated.type,
      experimentId: 'A',
    });
    const receipt = await purchaseVerified(provider, SKU_CURATED);
    const granted = fulfillment.fulfill({ receipt, product: curated });
    assert.equal(granted.outcome, 'granted');
    assert.equal(granted.entitlements.length, curated.entitlements.length);
    for (const e of curated.entitlements) {
      assert.ok(ledger.has(e.entitlementId));
    }
    trackPurchaseVerified({ sku: SKU_CURATED, experimentId: 'A' });

    const refs = curated.preview.items.map((i) => i.ref);
    const display = celebrationToDisplay(SKU_CURATED, refs);
    assert.equal(display.length, refs.length);
    assert.equal(display[0].label, curated.preview.items[0].label);
    trackPremiumCaseOpened({ sku: SKU_CURATED, experimentId: 'A' });

    // Cinematic reveal state machine consumes the celebration payload
    const premiumOutcome = {
      productTitle: curated.title,
      items: display,
    };
    let reveal = createInitialRevealState(premiumOutcome);
    reveal = revealReducer(reveal, { type: 'SKIP' });
    assert.equal(reveal.phase, 'details');
    assert.equal(reveal.outcome.productTitle, curated.title);
    assert.equal(reveal.outcome.items.length, display.length);

    const events = getMonetisationTelemetryBuffer().map((r) => r.event);
    for (const name of ['store_opened', 'purchase_started', 'verified', 'premium_case_opened'] as const) {
      assert.ok(events.includes(name), `missing telemetry ${name}`);
    }
    console.log('PASS: happy path catalogue → reveal → ownership + telemetry');
  }

  // ---------------------------------------------------------------------------
  // 3. Idempotency + duplicate callback (same receipt twice)
  // ---------------------------------------------------------------------------
  {
    const provider = new MockPurchaseProvider({ mode: 'duplicate_callback', latencyMs: 0 });
    const ledger = new EntitlementLedger();
    const fulfillment = new FulfillmentService(ledger);
    const livery = product(SKU_LIVERY);
    const receipt = await purchaseVerified(provider, SKU_LIVERY);

    const first = fulfillment.fulfill({ receipt, product: livery });
    const second = fulfillment.fulfill({ receipt, product: livery }); // duplicate callback
    assert.equal(first.outcome, 'granted');
    assert.equal(second.outcome, 'already_granted');
    assert.equal(ledger.list().filter((e) => e.entitlementId === 'livery-sunburst').length, 1);

    // Provider mode re-purchase still yields verified; ledger stays idempotent by txn+entitlement
    const again = await purchaseVerified(provider, SKU_LIVERY);
    const third = fulfillment.fulfill({ receipt: again, product: livery });
    assert.ok(third.outcome === 'already_granted' || third.outcome === 'granted');
    assert.equal(ledger.list().filter((e) => e.entitlementId === 'livery-sunburst').length, 1);
    console.log('PASS: idempotency + duplicate callback');
  }

  // ---------------------------------------------------------------------------
  // 4. Cancel / fail grant nothing; reversal revokes cleanly
  // ---------------------------------------------------------------------------
  {
    const cancelProvider = new MockPurchaseProvider({ mode: 'cancelled', latencyMs: 0 });
    const failProvider = new MockPurchaseProvider({ mode: 'failed', latencyMs: 0 });
    const ledger = new EntitlementLedger();
    const fulfillment = new FulfillmentService(ledger);
    const livery = product(SKU_LIVERY);

    await assert.rejects(() => cancelProvider.purchase(SKU_LIVERY), (err: unknown) => {
      assert.ok(err instanceof MockPurchaseError);
      assert.equal(err.code, 'cancelled');
      return true;
    });
    trackPurchaseCancelled({ sku: SKU_LIVERY, reason: 'user_cancelled', experimentId: 'A' });
    assert.equal(ledger.list().length, 0);

    await assert.rejects(() => failProvider.purchase(SKU_LIVERY), (err: unknown) => {
      assert.ok(err instanceof MockPurchaseError);
      assert.equal(err.code, 'failed');
      return true;
    });
    trackPurchaseFailed({ sku: SKU_LIVERY, reason: 'provider_error', experimentId: 'A' });
    assert.equal(ledger.list().length, 0);

    // Pending / unverified receipts never grant
    const pendingReject = fulfillment.fulfill({
      receipt: { provider: 'mock', transactionId: 'tx-pending', sku: SKU_LIVERY, status: 'pending' },
      product: livery,
    });
    assert.equal(pendingReject.outcome, 'rejected_unverified');
    assert.equal(ledger.has('livery-sunburst'), false);

    // Verified then reverse
    const okProvider = new MockPurchaseProvider({ mode: 'success', latencyMs: 0 });
    const receipt = await purchaseVerified(okProvider, SKU_LIVERY);
    assert.equal(fulfillment.fulfill({ receipt, product: livery }).outcome, 'granted');
    const reversed = fulfillment.reverse(receipt.transactionId);
    assert.equal(reversed.outcome, 'revoked');
    assert.equal(ledger.has('livery-sunburst'), false);
    assert.equal(ledger.get('livery-sunburst')?.revokeReason, 'reversed');

    const viaStatus = fulfillment.applyReceiptStatus({
      ...receipt,
      status: 'reversed',
    });
    assert.ok(viaStatus);
    assert.equal(viaStatus!.outcome, 'revoked');
    console.log('PASS: cancel/fail grant nothing; reversal revokes cleanly');
  }

  // ---------------------------------------------------------------------------
  // 5. Restore after reset (provider authority, idempotent)
  // ---------------------------------------------------------------------------
  {
    const storage = new MemoryStorage();
    const provider = new MockPurchaseProvider({ mode: 'success', latencyMs: 0 });
    const ledger = new EntitlementLedger();
    const fulfillment = new FulfillmentService(ledger);
    const livery = product(SKU_LIVERY);

    const receipt = await purchaseVerified(provider, SKU_LIVERY);
    assert.equal(fulfillment.fulfill({ receipt, product: livery }).outcome, 'granted');
    saveLedgerCache(ledger, storage);
    storage.setItem(GAME_SAVE_STORAGE_KEY, JSON.stringify({ gameState: { money: 12 } }));

    resetGameSavePreservingLedger(storage);
    assert.equal(storage.has(GAME_SAVE_STORAGE_KEY), false);

    // Simulate wipe of in-memory ownership; rebuild from provider receipts
    const restoredLedger = new EntitlementLedger();
    const restoredSvc = new FulfillmentService(restoredLedger);
    const receipts = await provider.restorePurchases();
    assert.ok(receipts.some((r) => r.transactionId === receipt.transactionId));
    const results = restoredSvc.restore(receipts, V1_CATALOGUE);
    assert.ok(results.some((r) => r.outcome === 'granted'));
    assert.ok(restoredLedger.has('livery-sunburst'));

    const secondPass = restoredSvc.restore(receipts, V1_CATALOGUE);
    assert.ok(secondPass.every((r) => r.outcome === 'already_granted' || r.outcome === 'granted'));
    assert.equal(restoredLedger.list().filter((e) => e.entitlementId === 'livery-sunburst').length, 1);

    // Offline cache still readable after career reset
    assert.ok(loadLedgerCache(new EntitlementLedger(), storage));
    clearLedgerCache(storage);
    console.log('PASS: restore-after-reset rebuilds ownership idempotently');
  }

  // ---------------------------------------------------------------------------
  // 6. Offline provider
  // ---------------------------------------------------------------------------
  {
    const offline = new MockPurchaseProvider({ mode: 'offline', latencyMs: 0 });
    await assert.rejects(() => offline.listProducts(), /offline/i);
    await assert.rejects(() => offline.purchase(SKU_LIVERY), /offline/i);
    await assert.rejects(() => offline.restorePurchases(), /offline/i);

    // Cached ownership remains usable read-only while provider is offline
    const storage = new MemoryStorage();
    const online = new MockPurchaseProvider({ mode: 'success', latencyMs: 0 });
    const ledger = new EntitlementLedger();
    const svc = new FulfillmentService(ledger);
    const receipt = await purchaseVerified(online, SKU_LIVERY);
    svc.fulfill({ receipt, product: product(SKU_LIVERY) });
    saveLedgerCache(ledger, storage);

    const cold = new EntitlementLedger();
    assert.ok(loadLedgerCache(cold, storage));
    assert.equal(cold.getAuthority(), 'offline_cache');
    assert.ok(cold.has('livery-sunburst'));
    console.log('PASS: offline provider + read-only cache');
  }

  // ---------------------------------------------------------------------------
  // 7. Reduced-motion reveal path (premium celebration)
  // ---------------------------------------------------------------------------
  {
    const curated = product(SKU_CURATED);
    const display = celebrationToDisplay(
      SKU_CURATED,
      curated.preview.items.map((i) => i.ref),
    );
    const outcome = { productTitle: curated.title, items: display };
    const rm = createInitialRevealState(outcome, { reducedMotion: true });
    assert.equal(rm.isReducedMotion, true);
    const jumped = revealReducer(rm, { type: 'START_UNLATCH' });
    assert.equal(jumped.phase, 'details', 'reduced motion skips animation phases');
    assert.deepEqual([...jumped.history], ['closed', 'details']);
    assert.equal(jumped.outcome.items.length, display.length);
    console.log('PASS: reduced-motion premium reveal path');
  }

  // ---------------------------------------------------------------------------
  // 8. Choose-1-of-3 + unknown choice grants nothing
  // ---------------------------------------------------------------------------
  {
    const provider = new MockPurchaseProvider({ mode: 'success', latencyMs: 0 });
    const ledger = new EntitlementLedger();
    const fulfillment = new FulfillmentService(ledger);
    const pick = product(SKU_PICK);
    const receipt = await purchaseVerified(provider, SKU_PICK);

    const bad = fulfillment.fulfill({ receipt, product: pick, choiceRef: 'not-an-option' });
    assert.equal(bad.outcome, 'rejected_unknown_choice');
    assert.equal(ledger.list().length, 0);

    const choice = pick.preview.items[1].ref;
    const ok = fulfillment.fulfill({ receipt, product: pick, choiceRef: choice });
    assert.equal(ok.outcome, 'granted');
    assert.equal(ok.entitlements[0]?.ref, choice);
    const dup = fulfillment.fulfill({
      receipt,
      product: pick,
      choiceRef: pick.preview.items[0].ref,
    });
    assert.equal(dup.outcome, 'already_granted');
    console.log('PASS: choose-1-of-3 fulfilment + unknown choice rejection');
  }

  // ---------------------------------------------------------------------------
  // 9. Earned cases / chores / experiments unaffected
  // ---------------------------------------------------------------------------
  {
    assertExperimentsSafe();
    const lootA = generateBoxLoot('1970s', 1, 42);
    const lootB = generateBoxLoot('1970s', 1, 42);
    assert.equal(lootA.length, 1);
    assert.deepEqual(lootA[0].name, lootB[0].name);
    assert.ok(['common', 'uncommon', 'rare', 'vintage', 'legendary'].includes(lootA[0].rarity));

    const chore = createInitialChoreState();
    assert.equal(Object.keys(chore.chores).length, 5);
    const exec = executeStudioChore(chore, 'clean_tape_heads', 3);
    assert.ok(exec);
    assert.equal(exec.nextChoreState.chores.clean_tape_heads.completed, true);

    // Premium path never invents loot rows — celebration is catalogue-resolved only
    const display = celebrationToDisplay(SKU_CURATED, ['ssl_4000_console~walnut_70s']);
    assert.equal(display[0].label.includes('Walnut'), true);
    assert.ok(!('rarity' in display[0]));
    console.log('PASS: earned cases + chores unaffected; experiments stay safe');
  }

  setMonetisationTelemetryClock(null);
  clearMonetisationTelemetryBuffer();
  console.log('PASS: monetisation-e2e suite');
}

runSlice().catch((err) => {
  console.error(err);
  process.exit(1);
});
