import { CITIES } from '@/rpg/cities';
import { getEraWindowStyle, DEFAULT_ERA_WINDOW } from '@/components/studio/studioSkylines';
import { cityFloorPlanks, cityFloorSpec, CITY_FLOORS, cityPosters, cityTrimColor, CITY_POSTERS } from '@/components/studio/cityRoomStyle';

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
  const p = cityPosters(c.id);
  assert(p.length === 2, `${c.id} has two posters`);
  assert(p[0].y1 <= p[1].y0, `${c.id} posters do not overlap`);
  assert(p.every((s) => s.y0 < s.y1 && s.y0 >= 2.5 && s.y1 <= 5.5), `${c.id} posters sit on the free left wall span`);
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
