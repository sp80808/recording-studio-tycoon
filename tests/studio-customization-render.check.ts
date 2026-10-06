import assert from 'node:assert/strict';
import {
  createInitialCustomization, equipFurnishing, equipProducerCosmetic, applyProducerCosmetics, getAnchorsForTier, STUDIO_FURNISHINGS,
  type StudioCustomizationState,
} from '../src/rpg/studioCustomization';
import { mapFurnishingsToRender, furnishingRenderKey, ANCHOR_SPOTS } from '../src/components/studio/studioFurnishingRender';
import { DEFAULT_PRODUCER_APPEARANCE } from '../src/features/sprites/producerAppearance';

const empty = createInitialCustomization();
assert.deepEqual(mapFurnishingsToRender(empty, 0), [], 'nothing equipped, nothing drawn');
assert.equal(furnishingRenderKey(undefined, 0), '');

let c: StudioCustomizationState = equipFurnishing(empty, getAnchorsForTier(0), 'lamp', 'brass-lamp');
c = equipFurnishing(c, getAnchorsForTier(3), 'sofa', 'corduroy-sofa');
assert.deepEqual(mapFurnishingsToRender(c, 0).map((i) => i.itemId), ['brass-lamp'], 'sofa anchor does not exist at tier 0, so it is hidden');
assert.deepEqual(mapFurnishingsToRender(c, 1).map((i) => i.itemId).sort(), ['brass-lamp', 'corduroy-sofa']);
assert.notEqual(furnishingRenderKey(c, 0), furnishingRenderKey(c, 1));

// Locked, unknown and mis-slotted entries never render even if smuggled into state.
const smuggled: StudioCustomizationState = { ...empty, equippedByAnchor: { 'wall-art': 'first-cheque-frame', rug: 'ghost', lamp: 'worn-rug' } };
assert.deepEqual(mapFurnishingsToRender(smuggled, 3), []);

// Every anchor has a spot and every furnishing renders.
for (const anchor of getAnchorsForTier(3)) assert.ok(ANCHOR_SPOTS[anchor], anchor);
const unlockedAll: StudioCustomizationState = { ...empty, unlockedItems: STUDIO_FURNISHINGS.map((f) => f.id) };
for (const f of STUDIO_FURNISHINGS) {
  const eq = equipFurnishing(unlockedAll, getAnchorsForTier(3), f.compatibleAnchors[0], f.id);
  assert.equal(mapFurnishingsToRender(eq, 3).length, 1, `${f.id} renders`);
}

// Producer cosmetics overlay the appearance without mutating it.
const owned: StudioCustomizationState = { ...empty, unlockedItems: ['session-cans', 'chart-leather'] };
const worn = equipProducerCosmetic(equipProducerCosmetic(owned, 'session-cans'), 'chart-leather');
const looks = applyProducerCosmetics(DEFAULT_PRODUCER_APPEARANCE, worn);
assert.equal(looks.accessory, 'headphones');
assert.equal(looks.shirt, 'leather_jacket');
assert.equal(applyProducerCosmetics(DEFAULT_PRODUCER_APPEARANCE, empty), DEFAULT_PRODUCER_APPEARANCE);
console.log('studio customization render checks passed');
