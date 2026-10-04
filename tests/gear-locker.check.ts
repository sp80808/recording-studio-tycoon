import assert from 'node:assert/strict';

import {
  layoutGearLocker,
  lockerQuadPoints,
  projectLockerPoint,
  projectPointInLockerQuad,
} from '../src/components/studio/gearLocker';

console.log('gear-locker checks…');

const q4 = { x: 20, y: 120 };
const q3 = { x: 140, y: 80 };
assert.deepEqual(projectLockerPoint(q4, q3, 60, 0, 0), { x: 20, y: 60 });
assert.deepEqual(projectLockerPoint(q4, q3, 60, 1, 1), q3);

const locker = layoutGearLocker({
  ownedIds: ['basic_mic', 'basic_monitors', 'audio_interface', 'compressor'],
  capacity: 6,
  q4,
  q3,
  shelfH: 60,
  palette: [0xd9a441, 0x5aa9e6, 0xe05c5c],
});
assert.equal(locker.columns, 1);
assert.equal(locker.rows, 6);
assert.equal(locker.slots.length, 4);
assert.equal(locker.rails.length, 2);
assert.equal(locker.shelves.length, 7);
assert.equal(locker.feet.length, 2);
assert.equal(lockerQuadPoints(locker.opening).length, 8);
assert.deepEqual(projectPointInLockerQuad(locker.opening, 0, 0), locker.opening.topLeft);
assert.deepEqual(projectPointInLockerQuad(locker.opening, 1, 1), locker.opening.bottomRight);
assert.ok(locker.slots.every(slot => slot.spriteMaxWidth > slot.spriteMaxHeight));
assert.ok(locker.slots.every(slot => slot.faceplate.details.length >= 5));

const expanded = layoutGearLocker({
  ownedIds: Array.from({ length: 14 }, (_, index) => `legacy_slot_${index}`),
  capacity: 14,
  q4,
  q3,
  shelfH: 60,
  palette: [0xd9a441],
});
assert.equal(expanded.columns, 2);
assert.equal(expanded.rows, 7);
assert.equal(expanded.slots.length, 14);
assert.equal(expanded.rails.length, 3);
assert.equal(new Set(expanded.slots.map(slot => slot.equipmentId)).size, 14);

console.log('✓ gear-locker checks passed');
