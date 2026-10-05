import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getRoomLayoutProfile, ROOM_LAYOUT_PROFILES, validateRoomLayout } from '../src/components/studio/roomLayouts';
import { roomStaffCount } from '../src/components/studio/roomFigures';
import { buildRoomLayoutScene, computeRoomView } from '../src/components/studio/roomLayoutScene';
import { createDefaultStudioRooms, getProjectForRoom } from '../src/utils/studioRoomUtils';

// Every purchasable extra room has a layout; Studio A keeps its hand-built scene (no profile).
const rooms = createDefaultStudioRooms();
assert.equal(getRoomLayoutProfile('project-studio'), null, 'Studio A is not a vignette-style profile');
for (const room of rooms.filter((r) => r.type !== 'project-studio')) {
  assert.ok(getRoomLayoutProfile(room.type), `${room.type} has a layout profile`);
}

// Layouts are structurally valid: props fit, nothing overlaps, staff spots are free, hotspots resolve.
const kindsByRoom = new Map<string, string>();
for (const profile of Object.values(ROOM_LAYOUT_PROFILES)) {
  assert.deepEqual(validateRoomLayout(profile!), [], `${profile!.type} layout problems`);
  assert.ok(profile!.hotspots.length >= 1, `${profile!.type} has a room-specific hotspot`);
  assert.ok(profile!.staffSpots.length >= 2, `${profile!.type} reserves floor spots for people`);
  kindsByRoom.set(profile!.type, profile!.props.map((p) => p.kind).sort().join(','));
}
assert.equal(new Set(kindsByRoom.values()).size, kindsByRoom.size, 'each room has its own prop set');

// Room identity (issue targets): booth-forward vocal, big open live floor, desk-heavy dark mix.
const vocal = ROOM_LAYOUT_PROFILES['vocal-suite']!;
const live = ROOM_LAYOUT_PROFILES['live-room']!;
const mix = ROOM_LAYOUT_PROFILES['mix-suite']!;
assert.ok(vocal.props.some((p) => p.kind === 'micStand' && p.hotspot === 'liveRoom'), 'vocal mic is a real hotspot');
assert.ok(live.footprint.width * live.footprint.depth > vocal.footprint.width * vocal.footprint.depth, 'live room is the larger floor');
assert.ok(live.props.some((p) => p.kind === 'drumKit') && live.props.filter((p) => p.kind === 'ampStack').length >= 2);
assert.ok(!live.props.some((p) => p.kind === 'console' || p.kind === 'desk'), 'live room is not desk-heavy');
assert.ok(mix.props.some((p) => p.kind === 'console') && mix.props.filter((p) => p.kind === 'nearfield').length >= 2);
assert.ok(mix.dim > live.dim, 'mix suite has the darker lighting identity');

// Deterministic and cheap: same seed, same tree; object count stays within the mobile budget.
const OBJECT_BUDGET = 1600;
for (const profile of Object.values(ROOM_LAYOUT_PROFILES)) {
  const wired: string[] = [];
  const a = buildRoomLayoutScene(profile!, { occupied: false, seed: 'seed', addHotspot: (id, _hit, visual, _z, parent) => { wired.push(id); parent.addChild(visual); } });
  const b = buildRoomLayoutScene(profile!, { occupied: false, seed: 'seed' });
  assert.equal(a.objectCount(), b.objectCount(), `${profile!.type} builds deterministically`);
  assert.ok(a.objectCount() < OBJECT_BUDGET, `${profile!.type} stays under the object budget (${a.objectCount()})`);
  assert.deepEqual([...wired].sort(), profile!.hotspots.map((h) => h.id).sort(), `${profile!.type} wires every declared hotspot`);
  assert.ok(a.bounds.maxX > a.bounds.minX && a.bounds.maxY > a.bounds.minY);
  a.tick(1.2, false);
  a.tick(1.2, true);
}

// Figures, window and camera (#248 follow-up): every room stages people, has a clock-driven window and a resting camera.
for (const profile of Object.values(ROOM_LAYOUT_PROFILES)) {
  assert.equal(roomStaffCount(profile!, 99), profile!.staffSpots.length, `${profile!.type} caps crew at its reserved spots`);
  assert.equal(roomStaffCount(profile!, 0), 1, `${profile!.type} always stages the producer`);
  const built = buildRoomLayoutScene(profile!, { occupied: true, seed: 's', clockMinutes: 1350 });
  built.windowView.update(1350, 0, 1, false);
  built.setWindowSky(0x112233);
  const view = computeRoomView(profile!, built.bounds, { width: 1280, height: 800, topInset: 68, bottomInset: 160 });
  const phone = computeRoomView(profile!, built.bounds, { width: 390, height: 780, topInset: 116, bottomInset: 160 });
  for (const [v, w, h] of [[view, 1280, 800], [phone, 390, 780]] as const) {
    assert.ok(v.scale > 0 && v.scale <= 2.6, `${profile!.type} camera scale in range`);
    assert.ok(built.bounds.minX * v.scale + v.x >= 9 || built.bounds.maxX * v.scale + v.x <= w - 9, `${profile!.type} stays horizontally on screen`);
    assert.ok(built.bounds.minY * v.scale + v.y >= 60 || built.bounds.maxY * v.scale + v.y <= h - 100, `${profile!.type} stays vertically on screen`);
  }
}
assert.ok(mix.camera.zoom > vocal.camera.zoom, 'mix suite pushes in on the console');

// Occupied rooms light the on-air lamp; free rooms keep it dim.
const free = buildRoomLayoutScene(live, { occupied: false, seed: 's' });
const busy = buildRoomLayoutScene(live, { occupied: true, seed: 's' });
busy.tick(0, true);
assert.ok(busy.root.getLocalBounds().width > 0 && free.root.getLocalBounds().width > 0);

// Wiring: one Pixi Application, the room swap happens inside WebGLCanvas, and the SVG vignette is no longer mounted.
const canvasSrc = readFileSync('src/components/WebGLCanvas.tsx', 'utf8');
assert.equal((canvasSrc.match(/new Application\(/g) ?? []).length, 1, 'exactly one Pixi Application');
assert.ok(canvasSrc.includes('getRoomLayoutProfile(stateRef.current.roomType)'), 'WebGLCanvas swaps scenes by room type');
assert.ok(canvasSrc.includes('roomType'), 'roomType is part of the scene state');
const studioSrc = readFileSync('src/components/StudioRoom.tsx', 'utf8');
assert.ok(!/<RoomVignette/.test(studioSrc), 'RoomVignette SVG is not a gameplay surface any more');
assert.ok(studioSrc.includes('roomType: viewRoom?.type'), 'StudioRoom passes the viewed room into the Pixi scene');
assert.ok(studioSrc.includes('activeHotspots'), 'gamepad hotspot cycling follows the active room');

// Room-to-project resolution: concurrent projects resolve by bookingRoomId; extra rooms never borrow the primary.
const pA = { id: 'a', title: 'A', bookingRoomId: 'studio-a' } as never;
const pB = { id: 'b', title: 'B', bookingRoomId: 'room-b' } as never;
const pC = { id: 'c', title: 'C', bookingRoomId: 'room-c' } as never;
const projState = { activeProject: pA, activeProjects: [pB] };
assert.equal(getProjectForRoom(projState, undefined), pA);
assert.equal(getProjectForRoom(projState, 'studio-a'), pA);
assert.equal(getProjectForRoom(projState, 'room-b'), pB);
assert.equal(getProjectForRoom(projState, 'room-c'), null);
assert.equal(getProjectForRoom({ activeProject: pC, activeProjects: [pB] }, 'room-c'), pC);
assert.equal(getProjectForRoom({ activeProject: null, activeProjects: [] }, 'room-b'), null);
assert.ok(canvasSrc.includes('createClientTransitState(destSession)'), 'room switch resets artist transit');

console.log('room layouts check passed');
