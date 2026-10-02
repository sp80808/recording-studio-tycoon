import {
  createPhaseCheck, toggleFlip, listen, commitKit, currentKit, fullness, minFlips, agreesWithReference, scorePhaseCheck,
  scoreKit, ROUNDS, LISTENS_PER_KIT, IN_PHASE, CHANNELS_BY_DIFFICULTY, type PhaseState,
} from '@/minigames/phaseCheck';
let n = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); n++; console.log(`PASS: ${m}`); };
const json = (s: unknown) => JSON.stringify(s);

const a = createPhaseCheck('x', 2), b = createPhaseCheck('x', 2);
ok(json(a) === json(b), 'same seed gives the same session');
ok(json(a) !== json(createPhaseCheck('y', 2)), 'different seeds differ');
for (const d of [1, 2, 3] as const) {
  const s = createPhaseCheck('d', d);
  ok(s.kits.length === ROUNDS && s.kits.every((k) => k.channels.length === CHANNELS_BY_DIFFICULTY[d]), `difficulty ${d} sets the channel count`);
  ok(s.kits.every((k) => new Set(k.channels.map((c) => c.id)).size === k.channels.length), `difficulty ${d} has no duplicate mics`);
  ok(s.kits.every((k) => !k.channels[0].invertedAtSource), `difficulty ${d} reference mic is never inverted`);
  ok(s.kits.every((k) => minFlips(k) >= 1 && fullness(k) < IN_PHASE), `difficulty ${d} always starts out of phase`);
}

/** Flip exactly the inverted mics. */
const solve = (s: PhaseState): PhaseState => {
  let x = s;
  for (const c of currentKit(x).channels) if (c.invertedAtSource) x = toggleFlip(x, c.id);
  return x;
};
let s = createPhaseCheck('solve', 3);
const kit0 = currentKit(s);
s = solve(s);
ok(fullness(currentKit(s)) === 1, 'flipping every inverted mic gives a full sum');
ok(currentKit(s).flips === minFlips(kit0) && scoreKit(currentKit(s)) === 100, 'a perfect kit scores the cap');
const t = toggleFlip(toggleFlip(createPhaseCheck('t', 2), 'nope'), currentKit(createPhaseCheck('t', 2)).channels[1].id);
ok(currentKit(t).flips === 1, 'toggling a real channel counts a flip, unknown ids are ignored');
ok(fullness(toggleFlip(t, currentKit(t).channels[1].id).kits[0]) === fullness(createPhaseCheck('t', 2).kits[0]), 'flipping twice restores the sum');

// Listening.
let l = createPhaseCheck('listen', 2);
const first = currentKit(l).channels[0].id, second = currentKit(l).channels[1];
ok(listen(l, first) === l, 'the reference channel cannot be listened to');
l = listen(l, second.id);
ok(currentKit(l).listensLeft === LISTENS_PER_KIT - 1, 'a listen spends one token');
ok(agreesWithReference(currentKit(l), second.id) === !second.invertedAtSource, 'a heard mic reports its relation to the reference');
const afterFlip = toggleFlip(l, second.id);
ok(agreesWithReference(currentKit(afterFlip), second.id) === second.invertedAtSource, 'the relation updates live as you flip');
ok(listen(l, second.id) === l, 'listening to the same mic twice is ignored');
let spent = l; for (const c of currentKit(l).channels.slice(2)) spent = listen(spent, c.id);
ok(currentKit(spent).listensLeft === 0 && currentKit(spent).channels.filter((c) => c.heard).length === LISTENS_PER_KIT, 'listens run out');

// Rounds and scoring.
let run = createPhaseCheck('run', 2);
for (let i = 0; i < ROUNDS; i++) { run = commitKit(solve(run)); }
ok(run.phase === 'done' && run.kits.every((k) => k.committed), 'committing three kits finishes the session');
ok(scorePhaseCheck(run).total >= 96 && scorePhaseCheck(run).inPhaseKits === ROUNDS, 'solving everything scores near the top');
let lazy = createPhaseCheck('run', 2);
for (let i = 0; i < ROUNDS; i++) lazy = commitKit(lazy);
ok(scorePhaseCheck(lazy).total < scorePhaseCheck(run).total && scorePhaseCheck(lazy).tips.length > 0, 'committing without fixing scores lower and gives a tip');
ok(commitKit(run) === run && toggleFlip(run, first) === run, 'a finished session is frozen');
const wasteful = (() => { let w = createPhaseCheck('w', 1); const id = currentKit(w).channels[1].id; for (let i = 0; i < 6; i++) w = toggleFlip(w, id); return scoreKit(currentKit(solve(w))); })();
ok(wasteful < 100, 'extra flips cost points even when the kit ends in phase');
console.log(`phase-check: ${n} checks passed`);
