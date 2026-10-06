import { DRAG_START_PX, SNAP_RADIUS_PX, distanceToRect, exceedsDragThreshold, findSnapTarget, magneticPosition } from '../src/rpg/chainPatchDrag';

let passed = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); passed++; console.log(`PASS: ${m}`); };
const jack = (id: string, left: number, accepts = true) => ({ id, rect: { left, top: 0, width: 44, height: 44 }, accepts });
const jacks = [jack('a', 0), jack('b', 100), jack('c', 200, false)];

ok(!exceedsDragThreshold({ x: 0, y: 0 }, { x: 3, y: 4 }), 'small wiggle stays a tap');
ok(exceedsDragThreshold({ x: 0, y: 0 }, { x: DRAG_START_PX + 1, y: 0 }), 'past threshold becomes a drag');
ok(distanceToRect({ x: 10, y: 10 }, jacks[0].rect) === 0, 'inside a rect is distance 0');
ok(distanceToRect({ x: 54, y: 22 }, jacks[0].rect) === 10, 'distance measured from edge');
ok(findSnapTarget({ x: 20, y: 20 }, jacks) === 'a', 'inside jack snaps');
ok(findSnapTarget({ x: 44 + SNAP_RADIUS_PX - 1, y: 20 }, [jack('a', 0)]) === 'a', 'within radius snaps (magnet)');
ok(findSnapTarget({ x: 20, y: 200 }, jacks) === null, 'beyond radius does not snap');
ok(findSnapTarget({ x: 222, y: 22 }, jacks) === null, 'incompatible jack never snaps');
ok(findSnapTarget({ x: 80, y: 22 }, jacks) === 'b', 'nearer jack wins when both in reach');
ok(findSnapTarget({ x: 72, y: 22 }, [jack('a', 0), jack('b', 100)]) === 'a', 'equal edge distance falls to nearer centre');
ok(findSnapTarget({ x: 5, y: 5 }, []) === null, 'no targets gives no snap');
const r = jacks[1].rect;
ok(magneticPosition({ x: 1, y: 2 }, r).x === 122, 'ghost pulls to jack centre');
ok(magneticPosition({ x: 1, y: 2 }, r, true).x === 1, 'reduced motion leaves ghost on pointer');
ok(magneticPosition({ x: 1, y: 2 }, null).y === 2, 'unsnapped ghost follows pointer');
console.log(`${passed} checks passed`);
