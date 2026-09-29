import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  EXPERIMENT_IDS,
  MONETISATION_EXPERIMENTS,
  assertExperimentsSafe,
  assignMonetisationExperiment,
  cohortFromSubject,
  getActiveExperimentId,
  getActiveMonetisationExperiment,
} from '../src/monetization/experiments';
import { equipPremiumItem } from '../src/monetization/cosmetics';
import { EntitlementLedger } from '../src/monetization/entitlements';
import { FulfillmentService } from '../src/monetization/fulfillment';
import { getProductBySku, V1_CATALOGUE, validateCatalogue } from '../src/monetization/catalog';
import { useDealerStore } from '../src/monetization/store';
import {
  MONETISATION_KPI_LIST,
  clearMonetisationTelemetryBuffer,
  computeMonetisationKpis,
  getMonetisationTelemetryBuffer,
  isForbiddenTelemetryValue,
  scrubDimensions,
  setMonetisationTelemetryClock,
  trackMonetisation,
  trackPremiumCaseOpened,
  trackPremiumItemEquipped,
  trackProductViewed,
  trackPurchaseCancelled,
  trackPurchaseFailed,
  trackPurchaseStarted,
  trackPurchaseVerified,
  trackStoreOpened,
} from '../src/monetization/telemetry';

clearMonetisationTelemetryBuffer();
setMonetisationTelemetryClock(() => 1_700_000_000_000);
assignMonetisationExperiment('A');

// --- Event catalogue ---
const REQUIRED_EVENTS = [
  'store_opened',
  'product_viewed',
  'purchase_started',
  'cancelled',
  'verified',
  'failed',
  'entitlement_restored',
  'premium_case_opened',
  'premium_item_equipped',
] as const;

trackStoreOpened({ experimentId: 'A' });
trackProductViewed({
  sku: 'rst.case_cosmetic.sunburst_livery_v1',
  productType: 'case_cosmetic',
  section: 'customs',
  experimentId: 'A',
});
trackPurchaseStarted({
  sku: 'rst.case_cosmetic.sunburst_livery_v1',
  productType: 'case_cosmetic',
  experimentId: 'A',
});
trackPurchaseCancelled({ sku: 'rst.case_cosmetic.sunburst_livery_v1', reason: 'user_cancelled', experimentId: 'A' });
trackPurchaseVerified({ sku: 'rst.case_cosmetic.sunburst_livery_v1', experimentId: 'A' });
trackPurchaseFailed({ sku: 'rst.case_cosmetic.sunburst_livery_v1', reason: 'provider_error', experimentId: 'A' });
trackMonetisation('entitlement_restored', { restoredCount: 2, experimentId: 'A' });
trackPremiumCaseOpened({ sku: 'rst.curated_case.seventies_analog_v1', experimentId: 'A' });
trackPremiumItemEquipped({
  entitlementId: 'livery-sunburst',
  entitlementKind: 'case_livery',
  experimentId: 'A',
  source: 'studio',
});

const events = getMonetisationTelemetryBuffer().map((r) => r.event);
for (const name of REQUIRED_EVENTS) {
  assert.ok(events.includes(name), `missing event ${name}`);
}
console.log('PASS: all required monetisation telemetry events emit');

// --- Privacy scrub ---
const scrubbed = scrubDimensions({
  sku: 'rst.case_cosmetic.sunburst_livery_v1',
  experimentId: 'B',
  // @ts-expect-error intentional forbidden key injection
  displayPrice: '$2.99',
  // @ts-expect-error
  api_key: 'sekret',
  // @ts-expect-error
  receipt: 'raw-receipt',
} as any);
assert.equal(scrubbed.sku, 'rst.case_cosmetic.sunburst_livery_v1');
assert.equal(scrubbed.experimentId, 'B');
assert.equal((scrubbed as any).displayPrice, undefined);
assert.equal((scrubbed as any).api_key, undefined);
assert.equal((scrubbed as any).receipt, undefined);
assert.equal(isForbiddenTelemetryValue('Bearer token abc'), true);
assert.equal(isForbiddenTelemetryValue('rst.case_cosmetic.sunburst_livery_v1'), false);

const poisoned = trackMonetisation('failed', {
  sku: 'rst.ok',
  reason: 'provider_error',
  // injected via cast
  ...( { card_number: '4111111111111111', displayPrice: '$9.99' } as any ),
});
assert.equal((poisoned.dimensions as any).card_number, undefined);
assert.equal((poisoned.dimensions as any).displayPrice, undefined);
console.log('PASS: privacy scrub drops credentials/prices');

// --- KPI list ---
clearMonetisationTelemetryBuffer();
trackStoreOpened({ experimentId: 'A' });
trackProductViewed({ sku: 'a', productType: 'case_cosmetic', experimentId: 'A' });
trackProductViewed({ sku: 'b', productType: 'studio_pack', experimentId: 'A' });
trackPurchaseStarted({ sku: 'a', experimentId: 'A' });
trackPurchaseVerified({ sku: 'a', experimentId: 'A' });
const kpis = computeMonetisationKpis(getMonetisationTelemetryBuffer());
assert.equal(kpis.storeOpens, 1);
assert.equal(kpis.productViews, 2);
assert.equal(kpis.purchaseStarts, 1);
assert.equal(kpis.purchaseVerified, 1);
assert.equal(kpis.viewToStartRate, 0.5);
assert.equal(kpis.startToVerifiedRate, 1);
for (const key of MONETISATION_KPI_LIST) {
  assert.ok(key in kpis, `KPI ${key} missing`);
}
console.log('PASS: KPI list + funnel rates');

// --- Experiments A–E ---
assert.deepEqual(EXPERIMENT_IDS, ['A', 'B', 'C', 'D', 'E']);
assertExperimentsSafe();
for (const id of EXPERIMENT_IDS) {
  assert.equal(MONETISATION_EXPERIMENTS[id].worsensFreeProgression, false);
  assignMonetisationExperiment(id);
  assert.equal(getActiveExperimentId(), id);
  assert.equal(getActiveMonetisationExperiment().id, id);
}
assignMonetisationExperiment('D');
assert.match(
  getActiveMonetisationExperiment().params.dealerTagline ?? '',
  /earned cases stay free/i,
);
const c1 = cohortFromSubject('player-opaque-1');
const c2 = cohortFromSubject('player-opaque-1');
assert.equal(c1, c2);
assert.ok(EXPERIMENT_IDS.includes(c1));
console.log('PASS: experiments A–E safe + sticky cohort');

// --- Product rule: storyline never monetised ---
{
  const catErrors = validateCatalogue();
  assert.deepEqual(catErrors, [], `catalogue story-paywall smell: ${catErrors.join('; ')}`);
  const allowedKinds = new Set([
    'case_livery',
    'sticker_set',
    'decor_bundle',
    'collector_variant',
    'reveal_style',
    'curated_case_access',
  ]);
  for (const p of V1_CATALOGUE) {
    for (const e of p.entitlements) {
      assert.ok(allowedKinds.has(e.kind), `unexpected entitlement kind ${e.kind} on ${p.id}`);
    }
  }
  const read = (rel: string) => fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
  for (const rel of [
    'src/narrative/branchingStorylineEngine.ts',
    'src/components/CareerHub.tsx',
    'src/components/modals/StorylineBranchModal.tsx',
  ]) {
    const src = read(rel);
    assert.equal(
      /from\s+['"][^'"]*monetization|PurchaseProvider|DealerModal|purchaseSku|hasEntitlement|requireEntitlement/i.test(
        src,
      ),
      false,
      `${rel} must not couple to monetisation / purchases`,
    );
  }
  console.log('PASS: storyline isolation — catalogue cosmetics-only, narrative UI free of IAP');
}

async function runWiredChecks(): Promise<void> {
  // --- Store wiring (open + purchase funnel) ---
  clearMonetisationTelemetryBuffer();
  assignMonetisationExperiment('B');
  const store = useDealerStore.getState();
  store.setDealerOpen(true);
  await new Promise((r) => setTimeout(r, 0));
  const sku = 'rst.case_cosmetic.sunburst_livery_v1';
  await useDealerStore.getState().purchaseSku(sku);
  const wired = getMonetisationTelemetryBuffer().map((r) => r.event);
  assert.ok(wired.includes('store_opened'), 'store open should telemetrize');
  assert.ok(wired.includes('purchase_started'), 'purchase start should telemetrize');
  assert.ok(wired.includes('verified') || wired.includes('failed') || wired.includes('cancelled'), 'purchase terminal event');
  const openDims = getMonetisationTelemetryBuffer().find((r) => r.event === 'store_opened')!.dimensions;
  assert.equal(openDims.experimentId, 'B');
  console.log('PASS: dealer store emits open + purchase telemetry');

  // --- Equip helper ---
  clearMonetisationTelemetryBuffer();
  const denied = equipPremiumItem({
    entitlementId: 'never-owned-xyz',
    entitlementKind: 'case_livery',
  });
  assert.equal(denied.ok, false);
  assert.equal(getMonetisationTelemetryBuffer().length, 0);

  // Grant via fulfilment so isOwned is true
  const product = getProductBySku(sku)!;
  const fulfillment = useDealerStore.getState().fulfillment;
  fulfillment.fulfill({
    receipt: {
      provider: 'mock',
      transactionId: 'tx-tele-equip-1',
      sku,
      status: 'verified',
    },
    product,
  });
  const allowed = equipPremiumItem({
    entitlementId: product.entitlements[0].entitlementId,
    entitlementKind: product.entitlements[0].kind,
    source: 'rack',
  });
  assert.equal(allowed.ok, true);
  const equipEvt = getMonetisationTelemetryBuffer().find((r) => r.event === 'premium_item_equipped');
  assert.ok(equipEvt);
  assert.equal(equipEvt!.dimensions.entitlementId, product.entitlements[0].entitlementId);
  assert.equal(equipEvt!.dimensions.source, 'rack');
  console.log('PASS: premium_item_equipped only when owned');

  // Catalogue sanity (earned path untouched contract)
  assert.ok(V1_CATALOGUE.length >= 1);
  assert.equal(new EntitlementLedger().list().length, 0);
  assert.ok(new FulfillmentService());

  setMonetisationTelemetryClock(null);
  clearMonetisationTelemetryBuffer();
  assignMonetisationExperiment('A');
  console.log('PASS: monetisation-telemetry suite');
}

runWiredChecks()
  .then(() => {
    /* suite finished inside runWiredChecks */
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
