import { createFlightCase, placeItem, removeItem, canPlace, closeCase, auditCase, scoreFlightCase, sessionRisk, CASES, cellsOf, itemById } from '@/minigames/flightCasePacking';
let n = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); n++; console.log(`PASS: ${m}`); };

ok(JSON.stringify(createFlightCase('x', 2)) === JSON.stringify(createFlightCase('x', 2)), 'same seed gives the same rig');
ok(createFlightCase('a', 3).items.length > createFlightCase('a', 1).items.length, 'bigger cases bring more gear');
ok(CASES[3].cols * CASES[3].rows > CASES[1].cols * CASES[1].rows, 'case upgrades change space');

const s0 = createFlightCase('t', 1);
ok(s0.placed.length === 0 && auditCase(s0).leftBehind.length === s0.items.length, 'everything starts on the floor');
ok(placeItem(s0, 'interface', 4, 4) === s0, 'out-of-bounds placement is refused');
const s1 = placeItem(s0, 'interface', 0, 0);
ok(s1 !== s0 && s0.placed.length === 0, 'placing returns new state');
ok(!canPlace(s1, 'laptop', 1, 0, false), 'overlap is refused');
ok(placeItem(s1, 'interface', 3, 3) .placed.length === 1, 'moving an item does not duplicate it');
ok(removeItem(s1, 'interface').placed.length === 0, 'items can be taken out');

// Fragile needs padding.
let f = placeItem(createFlightCase('f', 1), 'condenser', 0, 0);
ok(auditCase(f).unprotected.includes('condenser'), 'bare fragile gear is flagged');
f = placeItem(f, 'cables2', 1, 0);
ok(!auditCase(f).unprotected.includes('condenser'), 'a soft neighbour protects fragile gear');

// Heavy above expensive.
let h = placeItem(createFlightCase('h', 1), 'laptop', 0, 2);
h = placeItem(h, 'di1', 0, 1);
ok(auditCase(h).crushed.includes('di1'), 'heavy gear directly above expensive gear is flagged');
h = placeItem(h, 'di1', 4, 1);
ok(auditCase(h).crushed.length === 0, 'moving it aside clears the flag');

// Leftovers add risk; closing locks the case.
ok(sessionRisk(s0) > sessionRisk(s1), 'leftovers add session risk');
const c = closeCase(s1);
ok(placeItem(c, 'laptop', 0, 3) === c && removeItem(c, 'interface') === c, 'a closed case cannot be changed');

// Scoring is monotonic: more sensible packing never scores worse.
const empty = scoreFlightCase(s0).total, some = scoreFlightCase(s1).total;
ok(empty === 0 && some > empty && some <= 1000, 'score rises as gear is packed');
ok(scoreFlightCase(h).total >= 0 && scoreFlightCase(h).total <= 1000, 'score stays within 0-1000');
ok(cellsOf(s1, s1.placed[0]).length === itemById(s1, 'interface').w * itemById(s1, 'interface').h, 'footprints match item sizes');
ok(JSON.stringify(s0) === JSON.stringify(createFlightCase('t', 1)), 'state is immutable across actions');

// A clean packing exists for every case size (guards against an unwinnable rig).
function solve(state: ReturnType<typeof createFlightCase>, idx = 0): ReturnType<typeof createFlightCase> | null {
  if (idx === state.items.length) {
    const a = auditCase(state);
    return a.unprotected.length === 0 && a.crushed.length === 0 ? state : null;
  }
  const id = state.items[idx].id;
  for (let y = 0; y < state.rows; y++) for (let x = 0; x < state.cols; x++) for (const r of [false, true]) {
    if (!canPlace(state, id, x, y, r)) continue;
    const out = solve(placeItem(state, id, x, y, r), idx + 1);
    if (out) return out;
  }
  return null;
}
for (const d of [1, 2, 3] as const) {
  const solved = solve(createFlightCase('solve', d));
  ok(!!solved && scoreFlightCase(solved).total >= 800, `difficulty ${d} has a clean packing scoring 800+`);
}
console.log(`flight-case-packing: all ${n} checks passed`);
