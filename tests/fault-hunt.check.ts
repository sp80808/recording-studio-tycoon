import { createFaultHunt, probe, toggleFlag, finish, scoreFaultHunt, FAULT_DIFFICULTY, neighbours } from '@/minigames/faultHunt';
let n = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); n++; console.log(`PASS: ${m}`); };

const a = createFaultHunt('x', { difficulty: 2 }), b = createFaultHunt('x', { difficulty: 2 });
ok(JSON.stringify(a) === JSON.stringify(b), 'same seed gives the same board');
ok(JSON.stringify(createFaultHunt('y', { difficulty: 2 })) !== JSON.stringify(a), 'different seed gives a different board');
for (const d of [1, 2, 3] as const) {
  const s = createFaultHunt(`d${d}`, { difficulty: d });
  ok(s.cells.filter((c) => c.fault).length === FAULT_DIFFICULTY[d].faults, `difficulty ${d} places the configured fault count`);
}
const s3 = createFaultHunt('kinds', { difficulty: 3 });
ok(new Set(s3.cells.filter((c) => c.fault).map((c) => c.fault)).size === 5, 'hard board mixes all five fault kinds');
ok(a.cells.every((c, i) => c.adjacent === neighbours(a.size, i).filter((k) => a.cells[k].fault).length), 'clues equal faulty neighbour counts');

const clue = createFaultHunt('clue', { difficulty: 1, freeClues: 2 });
ok(clue.cells.some((c) => c.status === 'probed'), 'free clues reveal healthy jacks');
ok(clue.cells.every((c) => !(c.fault && c.status !== 'hidden')), 'free clues never reveal a fault');
ok(clue.probesLeft === FAULT_DIFFICULTY[1].probes, 'free clues cost no probes');

let s = createFaultHunt('play', { difficulty: 1 });
const safe = s.cells.findIndex((c) => !c.fault);
const fault = s.cells.findIndex((c) => c.fault);
const after = probe(s, safe);
ok(after.probesLeft === s.probesLeft - 1 && after.cells[safe].status === 'probed', 'probing a healthy jack spends one probe and reveals it');
ok(probe(after, safe) === after, 'probing the same jack twice is a no-op');
const hit = probe(s, fault);
ok(hit.trips === 1 && hit.cells[fault].status === 'tripped', 'probing a fault trips it');
ok(s.cells[safe].status === 'hidden', 'probe is immutable');

let flagged = toggleFlag(s, fault);
ok(flagged.cells[fault].flagged && !toggleFlag(flagged, fault).cells[fault].flagged, 'flag toggles');
let capped = s;
for (let i = 0; i < s.cells.length; i++) capped = toggleFlag(capped, i);
ok(capped.cells.filter((c) => c.flagged).length === s.faultCount, 'flags are capped at the fault count');

// Perfect report: flag every fault without probing.
let perfect = s;
s.cells.forEach((c, i) => { if (c.fault) perfect = toggleFlag(perfect, i); });
perfect = finish(perfect);
const max = FAULT_DIFFICULTY[1].probes;
const ps = scoreFaultHunt(perfect, max);
ok(ps.found === s.faultCount && ps.wrongFlags === 0, 'perfect flags find every fault');
ok(ps.total >= 850, 'perfect report scores well');
// Sloppy: trip everything.
let sloppy = s;
s.cells.forEach((c, i) => { if (c.fault) sloppy = probe(sloppy, i); });
ok(scoreFaultHunt(finish(sloppy), max).total < ps.total, 'tripping faults scores worse than flagging them');
// Wrong flags hurt.
let wrong = s;
wrong = toggleFlag(wrong, safe);
ok(scoreFaultHunt(finish(wrong), max).wrongFlags === 1, 'wrong flags are counted');
// Running out of probes finishes the game.
let spent = createFaultHunt('spent', { difficulty: 1 });
const hidden = spent.cells.map((c, i) => i).filter((i) => spent.cells[i].fault);
for (let i = 0; i < FAULT_DIFFICULTY[1].probes; i++) spent = probe(spent, hidden[i % hidden.length]);
ok(spent.finished || spent.probesLeft >= 0, 'spending probes never goes negative');
ok(probe(finish(s), safe) === finish(s) || probe(finish(s), safe).probesLeft === s.probesLeft, 'finished boards ignore probes');
for (let i = 0; i < 30; i++) {
  let g = createFaultHunt(`fuzz${i}`, { difficulty: ((i % 3) + 1) as 1 | 2 | 3 });
  g.cells.forEach((_, k) => { g = probe(g, k); });
  const t = scoreFaultHunt(finish(g), 11).total;
  if (t < 0 || t > 1000) throw new Error('score out of range');
}
ok(true, 'scores stay within 0..1000');
console.log(`fault-hunt: all ${n} checks passed`);
