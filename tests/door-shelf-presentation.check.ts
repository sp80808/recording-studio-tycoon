/**
 * Focused checks for P2 door enter/exit + equipment shelf sprites.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  layoutShelfSlots,
  parseCssHexTint,
  resolveRackFaceplate,
  resolveShelfCapacity,
  selectShelfEquipmentIds,
  shelfStructuralKey,
} from '../src/components/studio/equipmentShelfSprites';
import {
  advanceClientTransit,
  CLIENT_ENTER_MS,
  clientTransitPose,
  createClientTransitState,
  easeClientTransit,
  isClientTransitAnimating,
  skipClientTransit,
} from '../src/components/studio/clientDoorTransit';

console.log('door-shelf-presentation checks…');

// --- Shelf layout -----------------------------------------------------------
assert.equal(resolveShelfCapacity(1), 6);
assert.equal(resolveShelfCapacity(3), 10);
assert.equal(resolveShelfCapacity(5), 14);

assert.equal(parseCssHexTint('#38bdf8'), 0x38bdf8);
assert.equal(parseCssHexTint('#abc'), 0xaabbcc);
assert.equal(parseCssHexTint('nope', 0xd9a441), 0xd9a441);

const preferred = selectShelfEquipmentIds(
  ['mystery_box', 'basic_mic', 'studio_monitors', 'mystery_box'],
  3,
);
assert.deepEqual(preferred, ['basic_mic', 'studio_monitors', 'mystery_box']);
assert.ok(preferred.length <= 3);

const slots = layoutShelfSlots({
  ownedIds: ['basic_mic', 'basic_monitors', 'audio_interface'],
  capacity: 6,
  q1: { x: 0, y: 100 },
  q2: { x: 120, y: 100 },
  shelfH: 44,
  palette: [0xd9a441, 0x5aa9e6, 0xe05c5c],
});
assert.equal(slots.length, 3);
assert.equal(slots[0].equipmentId, 'basic_mic');
assert.match(slots[0].spritePath, /assets\/items\//);
assert.ok(slots[0].tint > 0);
assert.equal(slots[0].faceplate.chassis, 0x211c18);
assert.ok(slots[0].faceplate.details.length >= 5);
assert.ok(
  slots[0].faceplate.details.every(detail => detail.x >= 0 && detail.x <= 1 && detail.y >= 0 && detail.y <= 1),
);
const monitorFaceplate = resolveRackFaceplate('basic_monitors', 0x38bdf8);
assert.equal(monitorFaceplate.details.filter(detail => detail.shape === 'circle').length, 5);
assert.notEqual(monitorFaceplate.panel, 0x38bdf8, 'Accent must not flood the fallback chassis');
assert.notEqual(shelfStructuralKey(['a', 'b']), shelfStructuralKey(['a']));
assert.equal(shelfStructuralKey(undefined, 4), 'count:4');

// --- Client door transit ----------------------------------------------------
assert.equal(easeClientTransit(0), 0);
assert.equal(easeClientTransit(1), 1);
assert.ok(easeClientTransit(0.5) > 0.4 && easeClientTransit(0.5) < 0.6);

let transit = createClientTransitState(false);
assert.equal(transit.phase, 'absent');
assert.equal(isClientTransitAnimating(transit), false);

transit = advanceClientTransit(transit, { sessionActive: true, dtMs: 0, reduceMotion: false });
assert.equal(transit.phase, 'entering');
assert.ok(isClientTransitAnimating(transit));

transit = advanceClientTransit(transit, {
  sessionActive: true,
  dtMs: CLIENT_ENTER_MS / 2,
  reduceMotion: false,
});
assert.equal(transit.phase, 'entering');
assert.ok(transit.t > 0 && transit.t < 1);

const midPose = clientTransitPose(transit, { x: 0, y: 0 }, { x: 100, y: 50 });
assert.ok(midPose.visible);
assert.ok(midPose.x > 0 && midPose.x < 100);

transit = advanceClientTransit(transit, {
  sessionActive: true,
  dtMs: CLIENT_ENTER_MS,
  reduceMotion: false,
});
assert.equal(transit.phase, 'present');

const presentPose = clientTransitPose(transit, { x: 0, y: 0 }, { x: 100, y: 50 });
assert.equal(presentPose.x, 100);
assert.equal(presentPose.y, 50);
assert.equal(presentPose.alpha, 1);

transit = advanceClientTransit(transit, { sessionActive: false, dtMs: 0, reduceMotion: false });
assert.equal(transit.phase, 'exiting');

const skipped = skipClientTransit(transit, false);
assert.equal(skipped.phase, 'absent');
assert.equal(isClientTransitAnimating(skipped), false);

// Reduced motion snaps instantly
let rm = createClientTransitState(false);
rm = advanceClientTransit(rm, { sessionActive: true, dtMs: 16, reduceMotion: true });
assert.equal(rm.phase, 'present');
rm = advanceClientTransit(rm, { sessionActive: false, dtMs: 16, reduceMotion: true });
assert.equal(rm.phase, 'absent');

// --- Source wiring ----------------------------------------------------------
const webgl = readFileSync('src/components/WebGLCanvas.tsx', 'utf8');
const room = readFileSync('src/components/StudioRoom.tsx', 'utf8');
assert.match(webgl, /layoutGearLocker/, 'Shelf uses projected gear-locker layout helper');
assert.match(webgl, /lockerQuadPoints/, 'Locker face and modules use isometric quads');
assert.match(webgl, /getEquipmentTexture|ensureEquipmentTexture/, 'Shelf tries equipment textures');
assert.match(webgl, /advanceClientTransit/, 'Door transit driven in ticker');
assert.match(webgl, /clientTransitPose/, 'Artist pose follows door path');
assert.match(webgl, /skipClientTransit|skipDoorTransit/, 'Transit is skippable');
assert.match(webgl, /refs\.doorFloor/, 'Door floor anchor stored');
assert.match(room, /ownedEquipmentIds/, 'StudioRoom passes owned gear ids');

console.log('✓ door-shelf-presentation checks passed');
