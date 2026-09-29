/**
 * Monetisation 8 — save/reset/restore/reversal hardening (bead 89o.8).
 * Covers: GameState reset/import isolation, spoof resistance, refund
 * unequip side-effects, offline read-only cache vs provider authority.
 */
import assert from 'node:assert/strict';
import { getProductBySku } from '../src/monetization/catalog';
import {
  applyReversalCosmeticSideEffects,
  clearEquippedPremiumItems,
  listEquippedPremiumItems,
  setEquippedPremiumItem,
} from '../src/monetization/equippedCosmetics';
import {
  EntitlementLedger,
  LEDGER_CACHE_KEY,
  clearLedgerCache,
  loadLedgerCache,
  reconcileOfflineCacheWithProvider,
  saveLedgerCache,
} from '../src/monetization/entitlements';
import { FulfillmentService } from '../src/monetization/fulfillment';
import {
  GAME_SAVE_STORAGE_KEY,
  isEntitlementLedgerStorageKey,
  resetGameSavePreservingLedger,
  stripSpoofedEntitlementClaims,
  sanitizeImportedSaveEnvelope,
} from '../src/monetization/saveIsolation';
import type { PurchaseReceipt } from '../src/monetization/types';

const SKU = 'rst.case_cosmetic.sunburst_livery_v1';
const product = getProductBySku(SKU)!;
assert.ok(product, 'catalogue must include sunburst livery');

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

function verifiedReceipt(transactionId: string, sku = SKU): PurchaseReceipt {
  return { provider: 'mock', transactionId, sku, status: 'verified' };
}

function grantSunburst(svc: FulfillmentService, transactionId: string) {
  return svc.fulfill({ receipt: verifiedReceipt(transactionId), product });
}

// ---------------------------------------------------------------------------
// 1. Reset / import cannot mint or destroy purchases
// ---------------------------------------------------------------------------
{
  const storage = new MemoryStorage();
  const ledger = new EntitlementLedger();
  const svc = new FulfillmentService(ledger);
  const granted = grantSunburst(svc, 'tx-reset-1');
  assert.equal(granted.outcome, 'granted');
  saveLedgerCache(ledger, storage);

  // Career save + ledger both present
  storage.setItem(GAME_SAVE_STORAGE_KEY, JSON.stringify({ gameState: { money: 99 }, ownedEntitlements: ['hack'] }));
  assert.ok(storage.has(GAME_SAVE_STORAGE_KEY));
  assert.ok(storage.has(LEDGER_CACHE_KEY));

  resetGameSavePreservingLedger(storage);
  assert.equal(storage.has(GAME_SAVE_STORAGE_KEY), false, 'career save cleared');
  assert.ok(storage.has(LEDGER_CACHE_KEY), 'ledger cache must survive reset');
  assert.ok(isEntitlementLedgerStorageKey(LEDGER_CACHE_KEY));

  // Ownership still present in-memory and reloadable from cache
  assert.ok(ledger.has('livery-sunburst'));
  const reloaded = new EntitlementLedger();
  assert.ok(loadLedgerCache(reloaded, storage));
  assert.ok(reloaded.has('livery-sunburst'));
  assert.equal(reloaded.getAuthority(), 'offline_cache');
  console.log('PASS: reset clears game save but preserves entitlement ledger');
}

{
  const ledger = new EntitlementLedger();
  const svc = new FulfillmentService(ledger);
  grantSunburst(svc, 'tx-import-survive');
  const before = ledger.snapshot();

  // Importing a fresh career blob must not touch the ledger
  const imported = sanitizeImportedSaveEnvelope({
    version: '9.9.9',
    gameState: { money: 0, ownedEntitlements: ['livery-sunburst', 'fake-vip'] },
    ownedEntitlements: ['spoof-root'],
  });
  assert.ok(!('ownedEntitlements' in (imported.cleaned as object)));
  assert.deepEqual(ledger.snapshot(), before, 'import must not mutate ledger');
  assert.ok(ledger.has('livery-sunburst'));
  console.log('PASS: import cannot destroy existing purchases');
}

// ---------------------------------------------------------------------------
// 2. Spoof resistance — save claims never grant without ledger / receipt
// ---------------------------------------------------------------------------
{
  const spoofed = {
    version: '1.0.0',
    ownedEntitlements: ['livery-sunburst'],
    premiumEntitlements: ['decor-control-room'],
    entitlementLedger: { version: 1, entitlements: [{ entitlementId: 'hack' }] },
    monetisation: { owned: true },
    gameState: {
      money: 5000,
      ownedEntitlements: ['livery-sunburst'],
      entitlements: ['stickers-tour-vol1'],
    },
  };
  const { cleaned, strippedKeys } = stripSpoofedEntitlementClaims(spoofed);
  assert.ok(strippedKeys.includes('ownedEntitlements'));
  assert.ok(strippedKeys.includes('premiumEntitlements'));
  assert.ok(strippedKeys.includes('entitlementLedger'));
  assert.ok(strippedKeys.includes('monetisation'));
  assert.ok(strippedKeys.includes('gameState.ownedEntitlements'));
  assert.ok(strippedKeys.includes('gameState.entitlements'));
  assert.equal((cleaned as { gameState: { money: number } }).gameState.money, 5000);
  assert.ok(!('ownedEntitlements' in (cleaned as object)));

  const ledger = new EntitlementLedger();
  const svc = new FulfillmentService(ledger);
  // Spoofed payload alone never grants
  assert.equal(ledger.list().length, 0);
  // Unverified / fabricated receipt rejected
  const rejected = svc.fulfill({
    receipt: { provider: 'mock', transactionId: 'spoof-tx', sku: SKU, status: 'pending' },
    product,
  });
  assert.equal(rejected.outcome, 'rejected_unverified');
  assert.equal(ledger.has('livery-sunburst'), false);

  const wrongSku = svc.fulfill({
    receipt: verifiedReceipt('tx-wrong-sku', 'rst.not.a.real.sku'),
    product,
  });
  assert.equal(wrongSku.outcome, 'rejected_unverified');
  console.log('PASS: spoofed save / unverified receipt cannot mint entitlements');
}

// ---------------------------------------------------------------------------
// 3. Refund / reversal — revoke + unequip cosmetics, no save corruption
// ---------------------------------------------------------------------------
{
  clearEquippedPremiumItems();
  const storage = new MemoryStorage();
  storage.setItem(GAME_SAVE_STORAGE_KEY, JSON.stringify({ gameState: { money: 42 } }));

  const ledger = new EntitlementLedger();
  const svc = new FulfillmentService(ledger);
  const result = grantSunburst(svc, 'tx-refund-1');
  assert.equal(result.outcome, 'granted');
  saveLedgerCache(ledger, storage);

  setEquippedPremiumItem({
    entitlementId: 'livery-sunburst',
    entitlementKind: 'case_livery',
    source: 'studio',
  });
  assert.equal(listEquippedPremiumItems().length, 1);

  const reversed = svc.reverse('tx-refund-1');
  assert.equal(reversed.outcome, 'revoked');
  assert.equal(reversed.entitlements.length, 1);
  assert.equal(ledger.has('livery-sunburst'), false);
  assert.equal(ledger.get('livery-sunburst')?.revoked, true);
  assert.equal(ledger.get('livery-sunburst')?.revokeReason, 'reversed');

  const unequipped = applyReversalCosmeticSideEffects(reversed.entitlements);
  assert.deepEqual(unequipped, ['livery-sunburst']);
  assert.equal(listEquippedPremiumItems().length, 0);

  // Career save untouched
  assert.ok(storage.has(GAME_SAVE_STORAGE_KEY));
  assert.equal(JSON.parse(storage.getItem(GAME_SAVE_STORAGE_KEY)!).gameState.money, 42);

  saveLedgerCache(ledger, storage);
  // applyReceiptStatus path
  const again = svc.applyReceiptStatus({
    provider: 'mock',
    transactionId: 'tx-refund-1',
    sku: SKU,
    status: 'reversed',
  });
  assert.ok(again);
  assert.equal(again!.outcome, 'revoked');
  assert.equal(again!.entitlements.length, 0, 'already revoked → nothing more');
  console.log('PASS: reversal revokes entitlement, unequips cosmetics, leaves save intact');
}

// ---------------------------------------------------------------------------
// 4. Offline read-only cache vs provider authority
// ---------------------------------------------------------------------------
{
  const storage = new MemoryStorage();
  const onlineLedger = new EntitlementLedger();
  const svc = new FulfillmentService(onlineLedger);
  grantSunburst(svc, 'tx-real-1');
  assert.equal(onlineLedger.getAuthority(), 'provider_verified');
  saveLedgerCache(onlineLedger, storage);

  // Simulate cold start offline: hydrate from cache only
  const offlineLedger = new EntitlementLedger();
  assert.ok(loadLedgerCache(offlineLedger, storage));
  assert.equal(offlineLedger.getAuthority(), 'offline_cache');
  assert.ok(offlineLedger.has('livery-sunburst'), 'cache usable read-only offline');

  // Tamper cache: inject a never-purchased entitlement
  const tampered = offlineLedger.snapshot();
  tampered.entitlements.push({
    entitlementId: 'decor-control-room',
    kind: 'decor_bundle',
    ref: 'control_room_v1',
    grantedByTransaction: 'tx-spoofed-cache',
    grantedAt: Date.now(),
  });
  tampered.processedGrants.push('tx-spoofed-cache:decor-control-room');
  storage.setItem(LEDGER_CACHE_KEY, JSON.stringify(tampered));

  const spoofLoaded = new EntitlementLedger();
  loadLedgerCache(spoofLoaded, storage);
  assert.ok(spoofLoaded.has('decor-control-room'), 'tampered cache loads offline');
  assert.equal(spoofLoaded.getAuthority(), 'offline_cache');

  // Provider comes online with only the real receipt — reconcile drops spoof
  const providerReceipts = [verifiedReceipt('tx-real-1')];
  const revoked = reconcileOfflineCacheWithProvider(spoofLoaded, providerReceipts, storage);
  assert.ok(revoked.some((e) => e.entitlementId === 'decor-control-room'));
  assert.equal(spoofLoaded.has('decor-control-room'), false);
  assert.ok(spoofLoaded.has('livery-sunburst'));
  assert.equal(spoofLoaded.getAuthority(), 'provider_verified');

  // Cache rewritten without the spoof
  const after = new EntitlementLedger();
  loadLedgerCache(after, storage);
  assert.equal(after.has('decor-control-room'), false);
  assert.ok(after.has('livery-sunburst'));

  clearLedgerCache(storage);
  assert.equal(storage.getItem(LEDGER_CACHE_KEY), null);
  console.log('PASS: offline cache is read-only; provider reconcile drops spoofs');
}

// ---------------------------------------------------------------------------
// 5. Restore after reset rebuilds from provider receipts (idempotent)
// ---------------------------------------------------------------------------
{
  const ledger = new EntitlementLedger();
  const svc = new FulfillmentService(ledger);
  const receipts = [verifiedReceipt('tx-restore-a'), verifiedReceipt('tx-restore-a')]; // duplicate callback
  // First restore grants; second pass idempotent
  const first = svc.restore([receipts[0]], [product]);
  assert.equal(first[0].outcome, 'granted');
  const second = svc.restore(receipts, [product]);
  assert.ok(second.every((r) => r.outcome === 'already_granted' || r.outcome === 'granted'));
  assert.equal(ledger.list().filter((e) => e.entitlementId === 'livery-sunburst').length, 1);
  console.log('PASS: restore after reset is idempotent under duplicate receipts');
}

clearEquippedPremiumItems();
console.log('PASS: monetisation-hardening suite');
