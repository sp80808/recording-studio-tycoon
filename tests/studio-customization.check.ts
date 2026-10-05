import assert from 'node:assert/strict';
import { createDefaultGameState } from '../src/utils/newGameState';
import {
  STUDIO_FURNISHINGS, PRODUCER_COSMETICS, PREMISES_ANCHORS, createInitialCustomization, migrateCustomization, syncCustomizationUnlocks,
  isItemUnlocked, equipFurnishing, unequipAnchor, remapForAnchors, equipProducerCosmetic, unequipProducerSlot, applyProducerCosmetics,
  listLockedItems, getProvenance, getAnchorsForTier, exportMetaLedger, applyMetaLedger,
} from '../src/rpg/studioCustomization';
import { deriveCareerMilestones } from '../src/utils/careerChronicle';
import type { GameState } from '../src/types/game';

const base = createDefaultGameState();

// Legacy / corrupt saves.
assert.deepEqual(migrateCustomization(undefined), createInitialCustomization());
assert.deepEqual(migrateCustomization('junk'), createInitialCustomization());
const repaired = migrateCustomization({ unlockedItems: ['nope', 'crew-mug', 7], equippedByAnchor: { lamp: 'brass-lamp', 'wall-art': 'first-cheque-frame', shelf: 'crew-mug', rug: 'ghost' }, equippedProducer: { accessory: 'session-cans', shirt: 'session-cans' } });
assert.deepEqual(repaired.unlockedItems, ['crew-mug']);
assert.deepEqual(repaired.equippedByAnchor, { lamp: 'brass-lamp', shelf: 'crew-mug' }, 'locked / unknown / wrongly slotted entries dropped');
assert.deepEqual(repaired.equippedProducer, {}, 'locked or mis-slotted producer items dropped');

// Catalogue sanity.
assert.ok(STUDIO_FURNISHINGS.length >= 12 && PRODUCER_COSMETICS.length >= 6);
for (const f of STUDIO_FURNISHINGS) for (const a of f.compatibleAnchors) assert.ok(PREMISES_ANCHORS[3].includes(a), `${f.id} anchor ${a}`);
const knownMilestones = new Set(['first-paid-session', 'first-repeat-client', 'first-poor-session', 'first-staff-hire', 'first-room-added', 'first-premises-move', 'first-loyal-client', 'first-charting-release', 'first-story-choice']);
const sources = new Set([...STUDIO_FURNISHINGS, ...PRODUCER_COSMETICS].flatMap((i) => (i.unlock.kind === 'milestone' ? [i.unlock.milestoneId] : [])));
assert.ok(sources.size >= 5);
for (const s of sources) assert.ok(knownMilestones.has(s), `unknown milestone ${s}`);

// Fresh career: only defaults available, locked hints are spoiler-free sources.
const fresh = syncCustomizationUnlocks(base);
assert.equal(fresh.unlockedItems.length, 0);
assert.ok(isItemUnlocked(fresh, 'brass-lamp') && !isItemUnlocked(fresh, 'first-cheque-frame'));
assert.equal(listLockedItems(fresh).find((l) => l.id === 'first-cheque-frame')?.hint, 'Get paid for a session');
assert.equal(equipFurnishing(fresh, getAnchorsForTier(0), 'wall-art', 'first-cheque-frame'), fresh, 'locked item cannot be equipped');

// Earned milestones unlock items with provenance; sync is idempotent.
const rep = (title: string, money: number) => ({ projectId: title, projectTitle: title, overallQualityScore: 70, moneyGained: money, reputationGained: 1, playerManagementXpGained: 0, skillBreakdown: [], reviewSnippet: '', assignedPerson: { type: 'player', id: 'p', name: 'P' }, genre: 'Rock' }) as GameState['financials']['reports'][number];
const played: GameState = {
  ...base,
  financials: { ...base.financials, reports: [rep('Demo', 120)] },
  clientRelationships: { c1: { clientId: 'c1', clientName: 'Mira', primaryGenre: 'Rock', relationshipXp: 90, tier: 'Loyal', sessionsCompleted: 3, lastSessionDay: 5, bestQualityScore: 80, referralCount: 0 } },
  premisesTier: 1,
};
assert.ok(deriveCareerMilestones(played).some((m) => m.id === 'first-loyal-client'));
const synced = syncCustomizationUnlocks(played);
for (const id of ['first-cheque-frame', 'session-cans', 'signed-tour-poster', 'studio-plaque', 'rebook-polaroid']) assert.ok(isItemUnlocked(synced, id), id);
assert.match(getProvenance(synced, 'signed-tour-poster') ?? '', /Mira/);
assert.equal(syncCustomizationUnlocks({ ...played, studioCustomization: synced }), synced, 'idempotent');
assert.ok(!isItemUnlocked(synced, 'gold-reference-disc'));
assert.ok(isItemUnlocked(syncCustomizationUnlocks({ ...base, studioCustomization: synced }), 'first-cheque-frame'), 'never revoked');

// Equip / unequip deterministic; one item sits in one place; incompatible anchors rejected.
const a1 = getAnchorsForTier(1);
let c = equipFurnishing(synced, a1, 'wall-art', 'first-cheque-frame');
assert.equal(c.equippedByAnchor['wall-art'], 'first-cheque-frame');
assert.deepEqual(equipFurnishing(synced, a1, 'wall-art', 'first-cheque-frame'), c);
c = equipFurnishing(c, a1, 'shelf', 'first-cheque-frame');
assert.deepEqual(c.equippedByAnchor, { shelf: 'first-cheque-frame' });
assert.equal(equipFurnishing(c, a1, 'lamp', 'first-cheque-frame'), c, 'incompatible anchor');
assert.equal(equipFurnishing(c, getAnchorsForTier(0), 'trophy-shelf', 'studio-plaque'), c, 'anchor absent in tier 0');
assert.deepEqual(unequipAnchor(c, 'shelf').equippedByAnchor, {});
assert.equal(unequipAnchor(c, 'rug'), c);

// Premises change: unlocks survive, displaced items remap to a free compatible anchor or return to storage.
let t1 = equipFurnishing(synced, a1, 'trophy-shelf', 'studio-plaque');
t1 = equipFurnishing(t1, a1, 'lamp', 'brass-lamp');
assert.deepEqual(remapForAnchors(t1, ['wall-art', 'lamp']).equippedByAnchor, { lamp: 'brass-lamp', 'wall-art': 'studio-plaque' });
const stored = remapForAnchors(t1, ['lamp']);
assert.deepEqual(stored.equippedByAnchor, { lamp: 'brass-lamp' });
assert.deepEqual(stored.unlockedItems, t1.unlockedItems, 'unlocks preserved');
assert.equal(remapForAnchors(t1, a1), t1, 'unchanged when every anchor survives');
for (const tier of [0, 1, 2] as const) for (const a of PREMISES_ANCHORS[tier]) assert.ok(PREMISES_ANCHORS[(tier + 1) as 1 | 2 | 3].includes(a), 'tiers only add anchors');

// Producer cosmetics overlay without mutating the saved look; purely visual.
const look = { seed: 7, hair: 'bob', hairColour: 'jet_black', clothesColour: 'ruby', accessory: 'none' } as const;
assert.deepEqual(applyProducerCosmetics(look, synced), look);
let p = equipProducerCosmetic(synced, 'session-cans');
assert.equal(applyProducerCosmetics(look, p).accessory, 'headphones');
assert.equal(look.accessory, 'none');
assert.equal(equipProducerCosmetic(fresh, 'session-cans'), fresh);
p = equipProducerCosmetic(p, 'loyalty-chain');
assert.equal(p.equippedProducer.accessory, 'loyalty-chain', 'slot holds one item');
assert.deepEqual(applyProducerCosmetics(look, unequipProducerSlot(p, 'accessory')), look);
for (const cos of PRODUCER_COSMETICS) assert.deepEqual(Object.keys(cos).filter((k) => !['id', 'name', 'slot', 'accessory', 'shirt', 'unlock'].includes(k)), [], 'no stat fields');

// Meta ledger: cosmetic ids and stories only, no gameplay power.
const ledger = exportMetaLedger(synced);
assert.deepEqual(Object.keys(ledger).sort(), ['items', 'version']);
for (const i of ledger.items) assert.deepEqual(Object.keys(i).sort(), ['id', 'reason']);
const next = applyMetaLedger(JSON.parse(JSON.stringify(ledger)));
assert.deepEqual(next.unlockedItems, synced.unlockedItems);
assert.deepEqual(next.equippedByAnchor, {});
assert.match(getProvenance(next, 'first-cheque-frame') ?? '', /^Carried over: /);
assert.deepEqual(applyMetaLedger(null), createInitialCustomization());
assert.doesNotThrow(() => applyMetaLedger({ items: [null, { id: 1 }, { id: 'ghost', reason: 'x' }] }));

console.log('studio customization checks passed');

// Review fixes: duplicate placements collapse and carry-over provenance does not compound.
{
  const multi = STUDIO_FURNISHINGS.find((f) => f.compatibleAnchors.length >= 2)!;
  assert.ok(multi, 'a multi-anchor furnishing exists');
  const unlocked = multi.unlock.kind === 'milestone' ? [multi.id] : [];
  const raw = { unlockedItems: unlocked, equippedByAnchor: { [multi.compatibleAnchors[0]]: multi.id, [multi.compatibleAnchors[1]]: multi.id } };
  const fixed = migrateCustomization(raw);
  assert.ok(Object.values(fixed.equippedByAnchor).filter((x) => x === multi.id).length <= 1, 'one physical item is placed once');
  const m = STUDIO_FURNISHINGS.find((f) => f.unlock.kind === 'milestone')!;
  const once = applyMetaLedger({ version: 1, items: [{ id: m.id, reason: 'Won a prize' }] });
  const twice = applyMetaLedger(exportMetaLedger(once));
  assert.equal(twice.provenance[m.id], once.provenance[m.id], 'carry-over prefix is not stacked');
}
