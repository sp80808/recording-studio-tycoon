import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildFacilityMap } from '../src/utils/facilityMap';
import { createDefaultStudioRooms } from '../src/utils/studioRoomUtils';
import { FacilityMap } from '../src/components/studio/FacilityMap';
import { buildFacilityPlan, doorSwingPath, furnitureInside, PLAN_TILE } from '../src/utils/facilityPlan';

const rooms = createDefaultStudioRooms();
const none = new Set<string>();

// Fresh game: only Studio A, everything else locked with a reason.
let cells = buildFacilityMap(rooms, { activeId: 'studio-a', occupied: none, premisesTier: 0, playerLevel: 1 });
assert.deepEqual(cells.map((c) => c.id), ['studio-a', 'vocal-suite', 'live-room', 'mix-suite']);
assert.equal(cells[0].status, 'viewing');
assert.ok(cells.slice(1).every((c) => c.status === 'locked' && !c.clickable));
assert.equal(cells[1].lockedReason, 'Needs premises tier 1');

// Premises ok, level short -> level reason; level ok -> price.
const v = rooms.find((r) => r.id === 'vocal-suite')!;
assert.equal(buildFacilityMap(rooms, { activeId: 'studio-a', occupied: none, premisesTier: 1, playerLevel: 1 })[1].lockedReason, `Reach level ${v.requiredPlayerLevel}`);
assert.match(buildFacilityMap(rooms, { activeId: 'studio-a', occupied: none, premisesTier: 1, playerLevel: 9 })[1].lockedReason!, /^Buy for \$1,800$/);

// Unlocked rooms: booked vs free vs viewing; locked rooms keep their cell.
const owned = rooms.map((r) => (r.id === 'live-room' || r.id === 'vocal-suite' ? { ...r, unlocked: true } : r));
cells = buildFacilityMap(owned, { activeId: 'vocal-suite', occupied: new Set(['live-room']), premisesTier: 2, playerLevel: 9 });
const by = Object.fromEntries(cells.map((c) => [c.id, c]));
assert.equal(by['vocal-suite'].status, 'viewing');
assert.equal(by['live-room'].status, 'booked');
assert.equal(by['studio-a'].status, 'free');
assert.equal(by['mix-suite'].status, 'locked');
assert.ok(by['live-room'].size > by['vocal-suite'].size, 'bigger footprint draws a bigger cell');
assert.ok(cells.every((c) => c.size >= 0.6 && c.size <= 1));
const slots = new Set(cells.map((c) => `${c.col},${c.row}`));
assert.equal(slots.size, cells.length, 'every room has its own floorplan cell');

// Renders every room; markup carries state for tests/AT.
const html = renderToStaticMarkup(<FacilityMap rooms={owned} activeId="vocal-suite" occupied={new Set(['live-room'])} premisesTier={2} playerLevel={9} onSelect={() => {}} />);
assert.ok(html.includes('data-testid="facility-map"') && html.includes('aria-label="Facility map"'));

// Wired into StudioRoom, one switcher state.
const src = readFileSync('src/components/StudioRoom.tsx', 'utf8');
assert.ok(src.includes('<FacilityMap') && src.includes('setViewRoomId(id)'), 'StudioRoom mounts the facility map on the shared room state');

// Blueprint: real footprints either side of one corridor, furniture inside each room, no overlaps.
{
  const plan = buildFacilityPlan(cells, owned);
  const r = Object.fromEntries(plan.rooms.map((room) => [room.id, room]));
  assert.equal(r['studio-a'].w, 7 * PLAN_TILE, 'Studio A keeps its 7 x 7 footprint');
  assert.equal(r['live-room'].w, 8 * PLAN_TILE, 'Live Room keeps its 8 x 8 footprint');
  for (const room of plan.rooms) {
    assert.ok(furnitureInside(room), `${room.id} furniture stays inside its walls`);
    assert.ok(room.furniture.length >= 4, `${room.id} shows its furniture`);
    assert.ok(room.x >= 0 && room.y >= 0 && room.x + room.w <= plan.width && room.y + room.h <= plan.height, `${room.id} inside the building`);
    // Every door opens onto the corridor.
    assert.ok(room.door.y === plan.corridor.y || room.door.y === plan.corridor.y + plan.corridor.h, `${room.id} door on the corridor`);
    assert.ok(room.door.hingeX >= room.x && room.door.hingeX + room.door.width <= room.x + room.w, `${room.id} door within its wall`);
    assert.match(doorSwingPath(room.door).arc, /^M [\d.]+ [\d.]+ A /);
  }
  for (let i = 0; i < plan.rooms.length; i++) for (let j = i + 1; j < plan.rooms.length; j++) {
    const a = plan.rooms[i], b = plan.rooms[j];
    const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    assert.ok(!overlap, `${a.id} and ${b.id} do not overlap`);
  }
  assert.ok(r['studio-a'].y + r['studio-a'].h <= plan.corridor.y && r['live-room'].y >= plan.corridor.y + plan.corridor.h, 'rooms sit either side of the corridor');
}

// Opened plan markup carries room state for tests / AT.
{
  const html2 = renderToStaticMarkup(<FacilityMap rooms={owned} activeId="vocal-suite" occupied={new Set(['live-room'])} premisesTier={2} playerLevel={9} onSelect={() => {}} />);
  assert.ok(!html2.includes('data-room='), 'plan stays closed until the Map button is pressed');
}

console.log('facility map check passed');
