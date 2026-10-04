import assert from 'node:assert/strict';
import { CAT_COATS, CAT_SPOTS, FURNISHINGS, getFurnishings, pickCatCoat } from '../src/components/studio/studioFloorFurnishings';
import { getPremisesProps } from '../src/components/studio/studioPremisesDecor';
import { ROOM_D, ROOM_W } from '../src/components/studio/isoMath';

// Tier gating: each tier shows a superset of the previous one, and tier 5 shows everything.
let prev = 0;
for (let tier = 1; tier <= 5; tier++) {
  const n = getFurnishings(tier).length;
  assert.ok(n >= prev, `tier ${tier} must not lose furnishings`);
  prev = n;
}
assert.equal(getFurnishings(5).length, FURNISHINGS.length);
assert.ok(getFurnishings(1).length >= 1, 'tier 1 already has something new on the floor');
assert.ok(getFurnishings(1).length < getFurnishings(5).length, 'higher tiers add items');

// Unique ids, and every item and cat spot sits inside the room.
assert.equal(new Set(FURNISHINGS.map((f) => f.id)).size, FURNISHINGS.length);
for (const f of FURNISHINGS) {
  assert.ok(f.x > 0 && f.x < ROOM_W && f.y > 0 && f.y < ROOM_D, `${f.id} inside the room`);
}
for (const [phase, s] of Object.entries(CAT_SPOTS)) {
  assert.ok(s.x > 0 && s.x < ROOM_W && s.y > 0 && s.y < ROOM_D, `cat spot ${phase} inside the room`);
}

// The cat's coat is deterministic per seed and varies across seeds.
assert.equal(pickCatCoat('seed-a').id, pickCatCoat('seed-a').id);
const coats = new Set(Array.from({ length: 40 }, (_, i) => pickCatCoat(`run-${i}`).id));
assert.ok(coats.size >= 3 && coats.size <= CAT_COATS.length, 'several coats come up across seeds');

// Premises props: none in the borrowed room, more at each move, all inside the room.
assert.equal(getPremisesProps(0).length, 0);
assert.ok(getPremisesProps(1).length >= 2);
assert.ok(getPremisesProps(2).length > getPremisesProps(1).length);
assert.ok(getPremisesProps(2).some((p) => p.id === 'reception'));
for (const p of getPremisesProps(2)) assert.ok(p.x > 0 && p.x < ROOM_W && p.y > 0 && p.y < ROOM_D, `${p.id} inside the room`);

// #249: the Tier 1 bench and seating must read as furniture (real height and a backrest), not a flat slab,
// and stay clear of the producer's floor path and the dock edge.
import { buildPremisesDecor } from '../src/components/studio/studioPremisesDecor';
for (const tier of [1, 3]) {
  for (const { id, container } of buildPremisesDecor(tier, 0xf0b84a)) {
    const b = container.getLocalBounds();
    const h = b.maxY - b.minY;
    if (id === 'clientBench') assert.ok(h >= 34 && b.maxX - b.minX >= 60, `bench has volume (${h}px tall)`);
    if (id === 'premiumSofa') assert.ok(h >= 40, `sofa has volume (${h}px tall)`);
    if (id.startsWith('storageRack')) assert.ok(b.maxX - b.minX >= 24, 'rack shows both a front and a side face');
  }
}
const bench = getPremisesProps(1).find((p) => p.id === 'clientBench')!;
assert.ok(bench.y >= 6 && bench.x < 3, 'bench sits on the front edge, clear of the console and producer');
assert.equal(getPremisesProps(0).some((p) => p.id === 'clientBench'), false, 'Tier 0 has no bench');

console.log('floor furnishings check passed');

// Flight case floor stack: tiers map to looks and the stack caps what it draws.
import { buildCaseStack, caseLookForTier, MAX_VISIBLE_CASES } from '../src/components/studio/studioCaseStack';
assert.equal(caseLookForTier('standard'), 'road');
assert.equal(caseLookForTier('cardboard_box'), 'cardboard');
assert.equal(caseLookForTier('holy_grail_vault'), 'vault');
assert.equal(caseLookForTier('vintage_flight_case'), 'vintage');
assert.equal(buildCaseStack([], 0xffffff), null, 'no pending cases, no stack');
assert.ok(buildCaseStack(['road_case'], 0xffffff)!.hit.length >= 6);
assert.ok(MAX_VISIBLE_CASES >= 2);
console.log('case stack check passed');
