import {
  getNextHotspotDirectional,
  HOTSPOT_POSITIONS,
  CanonicalHotspotId,
} from '@/utils/studioHotspots';

let passed = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

const standardList: CanonicalHotspotId[] = ['console', 'liveRoom', 'phone', 'clock', 'tv', 'shelf'];

// 1. Coordinates exist for all standard hotspots
for (const h of standardList) {
  ok(HOTSPOT_POSITIONS[h] !== undefined, `has 2D coordinates for ${h}`);
}

// 2. Directional navigation from Console (center mixing desk)
// Moving left from Console hits Shelf (gear rack on left wall)
ok(getNextHotspotDirectional('console', 'left', standardList) === 'shelf', 'console -> left leads to shelf');

// Moving up from Console hits LiveRoom or Phone
const upFromConsole = getNextHotspotDirectional('console', 'up', standardList);
ok(upFromConsole === 'liveRoom' || upFromConsole === 'phone', `console -> up leads to ${upFromConsole}`);

// Moving right from Console leads to LiveRoom
ok(getNextHotspotDirectional('console', 'right', standardList) === 'liveRoom', 'console -> right leads to liveRoom');

// 3. Directional navigation from Shelf (left wall)
// Moving right from Shelf leads to Console
ok(getNextHotspotDirectional('shelf', 'right', standardList) === 'console', 'shelf -> right leads to console');

// Moving up from Shelf leads to Phone
ok(getNextHotspotDirectional('shelf', 'up', standardList) === 'phone', 'shelf -> up leads to phone');

// 4. Directional navigation from LiveRoom
// Moving left from LiveRoom leads to Console
ok(getNextHotspotDirectional('liveRoom', 'left', standardList) === 'console', 'liveRoom -> left leads to console');

// Moving up from LiveRoom leads to TV
ok(getNextHotspotDirectional('liveRoom', 'up', standardList) === 'tv', 'liveRoom -> up leads to tv');

// 5. Boundary behavior: if no candidate in strict direction, stays on current
ok(getNextHotspotDirectional('clock', 'up', standardList) === 'clock', 'clock -> up remains on clock when at top wall');

// 6. With promotion banner included
const withPromo: CanonicalHotspotId[] = [...standardList, 'promotion'];
ok(getNextHotspotDirectional('console', 'down', withPromo) === 'promotion', 'console -> down leads to promotion banner');

console.log(`studio-hotspot-nav: all ${passed} checks passed`);
