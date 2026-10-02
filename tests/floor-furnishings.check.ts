import assert from 'node:assert/strict';
import { CAT_COATS, CAT_SPOTS, FURNISHINGS, getFurnishings, pickCatCoat } from '../src/components/studio/studioFloorFurnishings';
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

console.log('floor furnishings check passed');
