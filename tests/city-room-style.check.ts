import { CITIES } from '@/rpg/cities';
import { cityPosters, cityTrimColor, CITY_POSTERS } from '@/components/studio/cityRoomStyle';

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
console.log('city room style: ok');
