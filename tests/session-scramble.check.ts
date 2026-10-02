import {
  createSessionScramble, startSession, assignJob, unassign, tick, scoreSessionScramble, workDurationMs,
  jobById, SESSION_MS, SCRAMBLE_DIFFICULTY, type ScrambleState, type JobId,
} from '@/minigames/sessionScramble';
let n = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); n++; console.log(`PASS: ${m}`); };
const json = (s: unknown) => JSON.stringify(s);

/** Flat, calm baseline so single factors can be isolated. */
const calm = (seed = 'calm'): ScrambleState => {
  const s = createSessionScramble(seed, 2);
  return {
    ...s, earlyMs: 0, deadlineMs: SESSION_MS, boothFreeAtMs: 0,
    staff: s.staff.map((m) => ({ ...m, pace: 1, tech: 1, hands: 1, people: 1 })),
  };
};
const run = (s: ScrambleState, ms: number) => { let x = s; for (let t = 0; t < ms; t += 100) x = tick(x, 100); return x; };
const doneAt = (s: ScrambleState, id: JobId) => jobById(s, id).doneAtMs;

// Determinism.
const a = createSessionScramble('x', 2), b = createSessionScramble('x', 2);
ok(json(a) === json(b), 'same seed gives the same scramble');
ok(json(a) !== json(createSessionScramble('y', 2)), 'different seeds differ');
ok(a.jobs.length === 6 && a.staff.length === 3, 'six jobs and three staff');
for (const d of [1, 2, 3] as const) {
  const s = createSessionScramble('d', d);
  ok(s.deadlineMs === SESSION_MS - s.earlyMs && s.earlyMs >= 0, `difficulty ${d} deadline is the 45s window minus any early arrival`);
  ok(jobById(s, 'patch').baseMs === Math.round(7000 * SCRAMBLE_DIFFICULTY[d].workMult), `difficulty ${d} scales job durations`);
}
const plan = (s: ScrambleState) => {
  let x = startSession(s);
  x = assignJob(x, 's0', 'patch'); x = assignJob(x, 's1', 'cable'); x = assignJob(x, 's2', 'greet');
  return x;
};
ok(json(run(plan(a), 20000)) === json(run(plan(b), 20000)), 'identical plans run identically');
const p1 = plan(calm()), p2 = plan(calm());
let fine = p1; for (let i = 0; i < 100; i++) fine = tick(fine, 100);
ok(json(fine) === json(tick(p2, 10000)), 'tick is independent of how dt is sliced');
ok(tick(calm(), 5000).elapsedMs === 0, 'time does not pass before the session starts');

// Staff stats change duration.
const base = calm();
const fast = { ...base, staff: base.staff.map((m) => (m.id === 's0' ? { ...m, tech: 1.4 } : m)) };
const slow = { ...base, staff: base.staff.map((m) => (m.id === 's0' ? { ...m, tech: 0.6 } : m)) };
ok(workDurationMs(jobById(fast, 'patch'), fast.staff[0]) < workDurationMs(jobById(slow, 'patch'), slow.staff[0]), 'higher stat means a shorter job');
const doPatch = (s: ScrambleState) => run(assignJob(startSession(s), 's0', 'patch'), 20000);
ok(doneAt(doPatch(fast), 'patch')! < doneAt(doPatch(slow), 'patch')!, 'a skilled tech finishes patching sooner in the simulation');
const quick = { ...base, staff: base.staff.map((m) => (m.id === 's1' ? { ...m, pace: 1.3 } : m)) };
const plod = { ...base, staff: base.staff.map((m) => (m.id === 's1' ? { ...m, pace: 0.8 } : m)) };
const doGreet = (s: ScrambleState) => run(assignJob(startSession(s), 's1', 'greet'), 20000);
ok(doneAt(doGreet(quick), 'greet')! < doneAt(doGreet(plod), 'greet')!, 'a faster walker arrives and finishes sooner');

// Blockers delay.
// Narrow corridor: mics and the spare cable both go through it.
let q = startSession(calm());
q = assignJob(q, 's0', 'mics'); q = assignJob(q, 's1', 'cable');
q = tick(q, 500);
ok(q.staff.some((m) => m.blocked === 'narrow'), 'second person waits for the narrow corridor');
const solo = run(assignJob(startSession(calm()), 's1', 'cable'), 20000);
const queued = run(q, 19500);
ok(doneAt(queued, 'cable')! > doneAt(solo, 'cable')!, 'queueing in the corridor delays the cable repair');
ok(queued.blockedMs > 0 && solo.blockedMs === 0, 'blocked time is tracked');

// Cable across the walkway slows walking to the booth and live room.
const hp = (fixed: boolean) => {
  let s = calm();
  if (fixed) s = { ...s, jobs: s.jobs.map((j) => (j.id === 'cable' ? { ...j, progress: 1, doneAtMs: 0 } : j)) };
  return run(assignJob(startSession(s), 's0', 'headphones'), 30000);
};
ok(doneAt(hp(false), 'headphones')! > doneAt(hp(true), 'headphones')!, 'an unrepaired cable slows the walk');

// Occupied booth holds headphones back.
const busy = { ...calm(), boothFreeAtMs: 15000 };
const busyRun = run(assignJob(startSession(busy), 's0', 'headphones'), 30000);
ok(doneAt(busyRun, 'headphones')! > 15000, 'headphones cannot finish while the booth is occupied');
ok(tick(assignJob(startSession(busy), 's0', 'headphones'), 9000).staff[0].blocked === 'booth', 'waiting staff are flagged as blocked by the booth');

// Early artist ends the session sooner.
const early = { ...calm(), earlyMs: 10000, deadlineMs: SESSION_MS - 10000 };
const earlyEnd = run(startSession(early), 60000);
ok(earlyEnd.phase === 'done' && earlyEnd.elapsedMs === SESSION_MS - 10000, 'an early artist ends the session at the earlier time');
const onTime = run(startSession(calm()), 60000);
ok(onTime.phase === 'done' && onTime.elapsedMs === SESSION_MS, 'the artist arrives at 45 seconds otherwise');

// Assignment rules.
const as = startSession(calm());
ok(assignJob(as, 's0', 'patch').staff[0].jobId === 'patch', 'assigning sets the staff job');
ok(assignJob(assignJob(as, 's0', 'patch'), 's1', 'patch').staff[1].jobId === null, 'one person per job');
ok(unassign(assignJob(as, 's0', 'patch'), 's0').staff[0].jobId === null, 'unassign stands staff down');

// Score is 0-1000 and monotonic.
const full = (s: ScrambleState) => {
  let x = startSession(s);
  const order: [string, JobId][] = [['s1', 'cable'], ['s0', 'patch'], ['s2', 'greet']];
  for (const [id, j] of order) x = assignJob(x, id, j);
  x = run(x, 12000);
  for (const [id, j] of [['s1', 'mics'], ['s2', 'headphones'], ['s0', 'gobos']] as [string, JobId][]) x = assignJob(x, id, j);
  return run(x, 40000);
};
const finished = full(calm());
const sc = (s: ScrambleState) => scoreSessionScramble(s).total;
ok(finished.jobs.every((j) => j.doneAtMs !== null), 'a sensible plan finishes every job in time');
ok(sc(finished) > 650 && sc(finished) <= 1000, 'a full setup scores 650-1000');
ok(sc(createSessionScramble('z', 1)) === 0, 'nothing done scores zero');
const doneCount = (s: ScrambleState) => s.jobs.filter((j) => j.doneAtMs !== null).length;
let prev = -1, prevCount = -1, sorted = true;
for (const ms of [0, 5000, 10000, 15000, 20000, 30000, 45000]) {
  const s = run(startSession(assignJob(assignJob(assignJob(calm(), 's0', 'patch'), 's1', 'cable'), 's2', 'greet')), ms);
  const sco = sc(s);
  if (sco < prev || doneCount(s) < prevCount) sorted = false;
  prev = sco; prevCount = doneCount(s);
}
ok(sorted, 'score never drops as more jobs get done');
const lateCalm = calm();
const slowFull = full({ ...lateCalm, staff: lateCalm.staff.map((m) => ({ ...m, pace: 0.8, hands: 0.7, tech: 0.7, people: 0.7 })) });
ok(sc(finished) >= sc(slowFull), 'a quicker setup never scores less than a slower one');
for (let i = 0; i < 20; i++) {
  const r = sc(full(createSessionScramble(`rand${i}`, ((i % 3) + 1) as 1 | 2 | 3)));
  if (r < 0 || r > 1000) throw new Error('FAIL: score out of range');
}
ok(true, 'scores stay within 0-1000 across seeds');

// Immutability.
const snap = json(a);
const planned = plan(a);
run(planned, 20000); tick(startSession(a), 1000); scoreSessionScramble(a);
ok(json(a) === snap, 'creating, planning and ticking never mutate the source state');
const before = json(planned);
tick(planned, 5000);
ok(json(planned) === before, 'tick returns a new state and leaves the old one untouched');
console.log(`session-scramble: all ${n} checks passed`);
