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

// #311: wall anchors were tuned by eye against the rendered room (docs/furnishing-anchors-tier*.png). Pin the free
// wall gaps so a retune cannot silently put a piece on the window, clock, door, shutters, neon/diffuser or trophy wall.
// Zones are existing decor footprints in wall tiles (along the wall) x lift px; a piece spans +/-0.4 tile (panel +/-0.8).
type Zone = { surface: 'right-wall' | 'left-wall'; a0: number; a1: number; l0: number; l1: number; name: string };
const WALL_ZONES: Zone[] = [
  { surface: 'right-wall', a0: 5.1, a1: 6.9, l0: 34, l1: 100, name: 'window' },
  { surface: 'right-wall', a0: 7.1, a1: 7.85, l0: 46, l1: 108, name: 'shutter' },
  { surface: 'right-wall', a0: 0.5, a1: 4.75, l0: 94, l1: 126, name: 'trophy wall' },
  { surface: 'left-wall', a0: 0.25, a1: 1.3, l0: 46, l1: 122, name: 'neon / diffuser' },
  { surface: 'left-wall', a0: 1.5, a1: 2.5, l0: 72, l1: 112, name: 'clock' },
  { surface: 'left-wall', a0: 3.1, a1: 4.3, l0: 0, l1: 100, name: 'door' },
  { surface: 'left-wall', a0: 4.5, a1: 6.4, l0: 40, l1: 112, name: 'board' },
];
// Wall footprint per drawn shape (px, from studioFurnishingRender draw()): width / 28 px-per-tile, height as drawn.
const WALL_SHAPES: Record<string, { w: number; h: number }> = {
  frame: { w: 22, h: 17 }, poster: { w: 22, h: 30 }, panel: { w: 44, h: 36 }, reel: { w: 22, h: 22 }, disc: { w: 18, h: 19 }, trophy: { w: 22, h: 25 }, cassette: { w: 24, h: 16 }, mug: { w: 16, h: 9 },
};
const wallBoxes = getAnchorsForTier(3).flatMap((id) => {
  const spot = ANCHOR_SPOTS[id];
  if (spot.surface === 'floor') return [];
  const along = spot.surface === 'right-wall' ? spot.x : spot.y;
  // Every compatible furnishing must fit, so test each one at this anchor.
  return STUDIO_FURNISHINGS.filter((f) => (f.compatibleAnchors as readonly string[]).includes(id)).map((f) => {
    const shape = mapFurnishingsToRender(equipFurnishing(unlockedAll, getAnchorsForTier(3), id, f.id), 3)[0].shape;
    const dims = WALL_SHAPES[shape];
    assert.ok(dims, `${f.id} (${shape}) has a wall footprint on ${id}`);
    return { id: `${id}/${f.id}`, surface: spot.surface, a0: along - dims.w / 56, a1: along + dims.w / 56, l0: spot.lift, l1: spot.lift + dims.h };
  });
});
const hits = (p: { a0: number; a1: number; l0: number; l1: number }, q: { a0: number; a1: number; l0: number; l1: number }) =>
  p.a0 < q.a1 && q.a0 < p.a1 && p.l0 < q.l1 && q.l0 < p.l1;
for (const box of wallBoxes) {
  assert.ok(box.l1 <= 132, `${box.id} stays under the ceiling`);
  for (const z of WALL_ZONES.filter((zz) => zz.surface === box.surface)) assert.ok(!hits(box, z), `${box.id} overlaps the ${z.name}`);
  // Different anchors on one wall must not collide (two items for the same anchor are alternatives, never co-drawn).
  for (const other of wallBoxes) if (other.id.split('/')[0] !== box.id.split('/')[0] && other.surface === box.surface) assert.ok(!hits(box, other), `${box.id} overlaps ${other.id}`);
}
for (const id of getAnchorsForTier(3)) {
  const spot = ANCHOR_SPOTS[id];
  if (spot.surface === 'floor') assert.ok(spot.x > 0 && spot.x < 8 && spot.y > 0 && spot.y < 7, `${id} is inside the room`);
}

// Producer cosmetics overlay the appearance without mutating it.
const owned: StudioCustomizationState = { ...empty, unlockedItems: ['session-cans', 'chart-leather'] };
const worn = equipProducerCosmetic(equipProducerCosmetic(owned, 'session-cans'), 'chart-leather');
const looks = applyProducerCosmetics(DEFAULT_PRODUCER_APPEARANCE, worn);
assert.equal(looks.accessory, 'headphones');
assert.equal(looks.shirt, 'leather_jacket');
assert.equal(applyProducerCosmetics(DEFAULT_PRODUCER_APPEARANCE, empty), DEFAULT_PRODUCER_APPEARANCE);
console.log('studio customization render checks passed');
