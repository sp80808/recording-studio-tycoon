import {
  createGainStaging, adjustGain, play, commitTake, currentTake, checkTake, scoreTake, scoreGainStaging, peaks,
  ROUNDS, PLAYS_PER_TAKE, STEP_DB, GAIN_MAX, GAIN_MIN, TARGET_MIN, TARGET_MAX, NOISE_FLOOR_DB, type GainState,
} from '@/minigames/gainStaging';
let n = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); n++; console.log(`PASS: ${m}`); };
const json = (s: unknown) => JSON.stringify(s);

ok(json(createGainStaging('x', 2)) === json(createGainStaging('x', 2)), 'same seed gives the same session');
ok(json(createGainStaging('x', 2)) !== json(createGainStaging('y', 2)), 'different seeds differ');
for (const d of [1, 2, 3] as const) {
  const s = createGainStaging('d', d);
  ok(s.takes.length === ROUNDS && s.takes.every((t) => t.source % STEP_DB === 0 && t.source < TARGET_MIN), `difficulty ${d}: quiet sources that need gain`);
  ok(s.takes.every((t) => !checkTake(t).inWindow), `difficulty ${d}: starts outside the window`);
}

/** Preamp up to land at the noise-floor margin, then the fader to hit the window. */
const solve = (s: GainState): GainState => {
  let x = s;
  const t = currentTake(x);
  const target = -12;
  let guard = 0;
  while (peaks(t.source, currentTake(x).gains)[2] < target && guard++ < 40) {
    const g = currentTake(x).gains;
    x = adjustGain(x, g[0] < GAIN_MAX && peaks(t.source, g)[0] < -18 ? 0 : 1, STEP_DB);
  }
  return x;
};
let s = solve(createGainStaging('solve', 2));
const c = checkTake(currentTake(s));
ok(c.inWindow && !c.clipped && !c.noisy, 'a sensible staging lands in the window with no clip and no noise');
ok(scoreTake(currentTake(s)) >= 85, 'a clean take scores high');

// Reading is stale until the next play, and plays are limited.
let r = createGainStaging('r', 2);
ok(currentTake(r).reading === null, 'no reading before the first play');
r = adjustGain(r, 0, STEP_DB);
r = play(r);
const before = currentTake(r).reading!;
r = adjustGain(r, 0, STEP_DB);
ok(json(currentTake(r).reading) === json(before), 'readings go stale when a knob moves');
for (let i = 0; i < PLAYS_PER_TAKE + 2; i++) r = play(r);
ok(currentTake(r).playsLeft === 0, 'plays are limited per take');

// Limits and invalid input.
let k = createGainStaging('k', 2);
for (let i = 0; i < 20; i++) k = adjustGain(k, 0, STEP_DB);
ok(currentTake(k).gains[0] === GAIN_MAX, 'gain stops at the top of the range');
for (let i = 0; i < 20; i++) k = adjustGain(k, 0, -STEP_DB);
ok(currentTake(k).gains[0] === GAIN_MIN, 'gain stops at the bottom of the range');
ok(adjustGain(k, 7, STEP_DB) === k, 'unknown stages are ignored');

// Clipping and noise cost points.
const base = currentTake(createGainStaging('pen', 2));
const clipTake = { ...base, gains: [24, 12, 12] as [number, number, number], moves: 3 };
ok(checkTake(clipTake).clipped && scoreTake(clipTake) <= 60, 'a clipping take is heavily penalised');
const noisyTake = { ...base, gains: [0, 24, 0] as [number, number, number], moves: 3 };
ok(base.source + 0 < NOISE_FLOOR_DB && checkTake(noisyTake).noisy, 'under-gaining the preamp is flagged noisy');
ok(scoreTake({ ...base, moves: 3 }) < 70, 'an untouched take scores low');

// Session flow.
let f = createGainStaging('flow', 2);
for (let i = 0; i < ROUNDS; i++) { f = solve(f); f = commitTake(f); }
ok(f.phase === 'done' && scoreGainStaging(f).total >= 80 && scoreGainStaging(f).cleanTakes === ROUNDS, 'a full clean session finishes with a high total');
ok(commitTake(f) === f, 'a finished session cannot be committed again');
console.log(`gain-staging: all ${n} checks passed`);
