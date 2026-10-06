// Equivalence check (#248): the Studio A layout profile must match the hardcoded scene in WebGLCanvas.buildScene,
// so the renderer can later move onto the profile path with no visual or behavioural change.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ROOM_D, ROOM_W } from '../src/components/studio/isoMath';
import { getRoomLayoutProfile } from '../src/components/studio/roomLayouts';
import { CASE_STACK_TILE } from '../src/components/studio/studioCaseStack';
import { STUDIO_A_LAYOUT as A } from '../src/components/studio/studioALayout';

assert.equal(A.footprint.width, ROOM_W);
assert.equal(A.footprint.depth, ROOM_D);
assert.equal(getRoomLayoutProfile('project-studio'), null, 'renderer path unchanged until the switch-over lands');

const src = readFileSync('src/components/WebGLCanvas.tsx', 'utf8');
const has = (snippet: string, why: string) =>
  assert.ok(src.includes(snippet), `WebGLCanvas no longer contains ${snippet} (${why}); update the Studio A profile`);

const byId = new Map(A.hotspots.map((h) => [h.id, h.at]));
const wall = (id: string) => {
  const at = byId.get(id as never);
  assert.ok(at?.kind === 'wall', `${id} is a wall hotspot`);
  return at;
};

has(`iso(${A.window.from}, 0)`, 'window start');
has(`iso(${A.window.to}, 0)`, 'window end');
has(`iso(0, ${wall('tv').from})`, 'tv start');
has(`iso(0, ${wall('tv').to})`, 'tv end');
has(`iso(0, ${wall('clock').from.toFixed(1)})`, 'clock');
has(`iso(0, ${wall('door').from})`, 'door start');
has(`iso(0, ${wall('door').to})`, 'door end');
assert.deepEqual(A.doorWall, { side: 'left', from: wall('door').from, to: wall('door').to });
has(`iso(${A.doorFloor.x}, ${A.doorFloor.y})`, 'door floor');
has('iso(7.3, 1.6)', 'promotion');
has(`const boothX0 = ${A.booth.x0.toFixed(1)}`, 'booth x0');
has(`const boothX1 = ${A.booth.x1.toFixed(1)}`, 'booth x1');
has(`const boothGlassY = ${A.booth.glassY.toFixed(1)}`, 'booth glass');
has(`iso(${A.booth.stand.x}, ${A.booth.stand.y})`, 'mic stand');
has(`iso(${A.deskFoot.x}, ${A.deskFoot.y})`, 'desk');
has(`iso(${A.shelf.x0.toFixed(1)}, ${A.shelf.y0.toFixed(1)})`, 'shelf back-left');
has(`iso(${A.shelf.x0.toFixed(1)}, ${A.shelf.y1.toFixed(1)})`, 'shelf front-left');
has(`iso(2.0 + shelfExtension, ${A.shelf.y0.toFixed(1)})`, 'shelf back-right');

assert.deepEqual(byId.get('liveRoom'), { kind: 'floor', ...A.booth.stand });
assert.deepEqual(byId.get('console'), { kind: 'floor', ...A.deskFoot });
assert.deepEqual(byId.get('cases'), { kind: 'floor', x: CASE_STACK_TILE.x, y: CASE_STACK_TILE.y });
const shelf = byId.get('shelf');
assert.ok(
  shelf?.kind === 'floor' && shelf.x === (A.shelf.x0 + A.shelf.x1) / 2 && shelf.y === (A.shelf.y0 + A.shelf.y1) / 2,
  'shelf anchor is the shelf centre'
);
for (const h of A.hotspots) {
  const { at } = h;
  if (at.kind === 'floor') assert.ok(at.x >= 0 && at.x <= ROOM_W && at.y >= 0 && at.y <= ROOM_D, `${h.id} inside the footprint`);
  else assert.ok(at.from >= 0 && at.to <= (at.side === 'left' ? ROOM_D : ROOM_W), `${h.id} on its wall`);
}
