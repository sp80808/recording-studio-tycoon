import { CITIES } from '@/rpg/cities';
import { getEraWindowStyle, DEFAULT_ERA_WINDOW } from '@/components/studio/studioSkylines';
import { cityFloorPlanks, cityFloorSpec, CITY_FLOORS, cityPosters, cityTrimColor, CITY_POSTERS, ROOM_POSTER_SLOTS } from '@/components/studio/cityRoomStyle';
import { ROOM_LAYOUT_PROFILES, ROOM_DOOR, ROOM_ON_AIR_HALF } from '@/components/studio/roomLayouts';

const assert = (c: unknown, m: string) => { if (!c) { console.error('FAIL', m); process.exit(1); } };
const base = 0x2a1f18;

assert(cityTrimColor(base, undefined) === base, 'no city leaves trim unchanged');
assert(cityTrimColor(base, 'atlantis') === base, 'unknown city leaves trim unchanged');
assert(cityPosters(undefined).length === 0 && cityPosters('atlantis').length === 0, 'no posters without a known city');

const trims = new Set<number>();
for (const c of CITIES) {
  const t = cityTrimColor(base, c.id);
  assert(t !== base, `${c.id} trim differs`);
  assert(cityTrimColor(base, c.id) === t, `${c.id} trim deterministic`);
  trims.add(t);
  assert(cityPosters(c.id, 'project-studio').length === 0, `${c.id}: Studio A door wall stays free of posters`);
  assert(cityPosters(c.id).length === 0, `${c.id}: no room means no posters`);
  for (const [type, slots] of Object.entries(ROOM_POSTER_SLOTS)) {
    assert(cityPosters(c.id, type as never).length === slots!.length, `${c.id} ${type} gets one poster per slot`);
  }
}
for (const [type, slots] of Object.entries(ROOM_POSTER_SLOTS)) {
  const prof = ROOM_LAYOUT_PROFILES[type as keyof typeof ROOM_LAYOUT_PROFILES];
  assert(!!prof, `${type} has a layout`);
  const { width, depth } = prof.footprint;
  const door = { a: prof.doorSpot.y - ROOM_DOOR.half - 0.1, b: prof.doorSpot.y + ROOM_DOOR.half + 0.1 };
  slots!.forEach((s, i) => {
    const tag = `${type} poster ${i}`;
    assert(s.y0 < s.y1 && s.y0 >= 0.3 && s.y1 <= (s.side === 'right' ? width : depth) - 0.1, `${tag} sits on its wall`);
    const hit = (a: number, b: number) => s.y0 < b && s.y1 > a;
    if (s.side === 'left') assert(!hit(door.a, door.b), `${tag} is clear of the door`);
    for (const w of prof.walls) if (w.side === s.side && w.kind !== 'brick') assert(!hit(w.from, w.to), `${tag} is clear of ${w.kind} treatment`);
    if (prof.window.side === s.side) assert(!hit(prof.window.from, prof.window.to), `${tag} is clear of the window`);
    if (s.side === 'right') assert(!hit(prof.onAirX - ROOM_ON_AIR_HALF - 0.1, prof.onAirX + ROOM_ON_AIR_HALF + 0.1), `${tag} is clear of the on-air lamp`);
    slots!.forEach((o, j) => { if (j > i && o.side === s.side) assert(s.y1 <= o.y0 || o.y1 <= s.y0, `${tag} does not overlap poster ${j}`); });
  });
}
assert(trims.size === CITIES.length, 'every city has a distinct trim');
assert(Object.keys(CITY_POSTERS).length === CITIES.length, 'poster table covers every city');

const planks: [number, number, number] = [0x6a4d38, 0x604532, 0x58402e];
assert(cityFloorPlanks(planks, undefined) === planks && cityFloorPlanks(planks, 'atlantis') === planks, 'no city leaves floor planks unchanged');
assert(!cityFloorSpec(undefined) && !cityFloorSpec('atlantis'), 'no floor pattern or prop without a known city');
const floors = new Set<number>();
for (const c of CITIES) {
  const f = cityFloorPlanks(planks, c.id);
  assert(f.every((v, i) => v !== planks[i]), `${c.id} floor differs`);
  floors.add(f[0]);
  assert(!!cityFloorSpec(c.id), `${c.id} has floor pattern and prop`);
}
assert(floors.size === CITIES.length, 'every city has a distinct floor tint');
assert(Object.keys(CITY_FLOORS).length === CITIES.length, 'floor table covers every city');
assert(new Set(Object.values(CITY_FLOORS).map((f) => f.prop)).size === CITIES.length, 'every city has its own prop');

assert(getEraWindowStyle(undefined) === DEFAULT_ERA_WINDOW && getEraWindowStyle('nope') === DEFAULT_ERA_WINDOW, 'unknown era uses the default window look');
assert(getEraWindowStyle('analog60s').tintAmount === 0 && getEraWindowStyle('analog60s').warm === 0xffd98a, 'default era keeps the original window look');
const eraLooks = new Set(['analog60s', 'digital80s', 'internet2000s', 'streaming2020s'].map((e) => `${getEraWindowStyle(e).warm}|${getEraWindowStyle(e).cool}`));
assert(eraLooks.size === 4, 'each era has its own window lighting');
console.log('city room style: ok');
