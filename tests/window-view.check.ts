import assert from 'node:assert/strict';
import { getCelestialPosition, getCityLightLevel, getStarLevel } from '../src/components/studio/studioWindowView';

assert.equal(getCelestialPosition(720).body, 'sun');
assert.equal(getCelestialPosition(0).body, 'moon');
assert.equal(getCelestialPosition(1200).body, 'moon');
// Sun climbs to its highest at midday and moves left to right.
const dawn = getCelestialPosition(400);
const noon = getCelestialPosition(720);
const dusk = getCelestialPosition(1050);
assert.ok(noon.v > dawn.v && noon.v > dusk.v && dawn.u < noon.u && noon.u < dusk.u);
for (let m = 0; m < 1440; m += 15) {
  const c = getCelestialPosition(m);
  assert.ok(c.u >= 0.1 && c.u <= 0.9 && c.v >= 0.4 && c.v <= 0.9, `body stays inside the glass at ${m}`);
}
// City lights and stars: off at noon, on at midnight.
assert.equal(getCityLightLevel(1), 0);
assert.equal(getCityLightLevel(0), 1);
assert.equal(getStarLevel(1), 0);
assert.equal(getStarLevel(0), 1);
console.log('window view check passed');
