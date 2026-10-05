/** Player release influence on the market and Industry Pulse "since week" (#52 tails): small, capped, seeded, fading. */
import {
  genreDemand, industryPulse, playerReleaseShift, releaseSignals,
  PLAYER_RELEASE_CAP, PLAYER_RELEASE_NUDGE, PLAYER_RELEASE_WINDOW_DAYS, PULSE_LOOKBACK_WEEKS, type ReleaseSignal,
} from '../src/rpg/marketDemand';

let n = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); n++; console.log(`PASS: ${m}`); };

const rel = (id: string, genre: string, q: number, day: number): ReleaseSignal => ({ projectId: id, genre, qualityScore: q, releaseDay: day });
const SEED = 21, DAY = 100;

// Neutral without releases or a seed, and for unrelated genres.
ok(playerReleaseShift(SEED, DAY, 'pop', undefined) === 0 && playerReleaseShift(SEED, DAY, 'pop', []) === 0, 'no releases, no influence');
ok(playerReleaseShift(undefined, DAY, 'pop', [rel('a', 'Pop', 90, 95)]) === 0, 'a save with no seed has no influence');
ok(playerReleaseShift(SEED, DAY, 'jazz', [rel('a', 'Pop', 90, 95)]) === 0, 'a pop release does not move jazz');
ok(genreDemand(SEED, DAY, 'Pop') === genreDemand(SEED, DAY, 'Pop', []), 'an empty release list leaves demand unchanged');

// A good recent release nudges its genre up a little, deterministically.
const one = [rel('a', 'Synth Pop', 90, 95)];
const s1 = playerReleaseShift(SEED, DAY, 'pop', one);
ok(s1 > 0 && s1 <= PLAYER_RELEASE_NUDGE * 1.25, 'one release nudges its market genre by a small amount');
ok(s1 === playerReleaseShift(SEED, DAY, 'pop', JSON.parse(JSON.stringify(one))), 'the nudge is reproducible from the save (seeded)');
ok(playerReleaseShift(SEED + 1, DAY, 'pop', one) !== s1, 'a different save jitters differently');
ok(playerReleaseShift(SEED, DAY, 'pop', [rel('a', 'Pop', 30, 95)]) < playerReleaseShift(SEED, DAY, 'pop', [rel('a', 'Pop', 95, 95)]), 'better records nudge more');

// It fades and expires; it never counts a release made today (no self-boost).
ok(playerReleaseShift(SEED, DAY, 'pop', [rel('a', 'Pop', 90, DAY)]) === 0, 'a release does not boost its own outcome');
ok(playerReleaseShift(SEED, DAY, 'pop', [rel('a', 'Pop', 90, DAY - 2)]) > playerReleaseShift(SEED, DAY, 'pop', [rel('a', 'Pop', 90, DAY - 20)]), 'the nudge fades with age');
ok(playerReleaseShift(SEED, DAY, 'pop', [rel('a', 'Pop', 90, DAY - PLAYER_RELEASE_WINDOW_DAYS)]) === 0, 'the nudge expires after the window');

// Capped however many releases pile up.
const many = Array.from({ length: 60 }, (_, i) => rel(`r${i}`, 'Pop', 100, DAY - 1 - (i % 5)));
ok(playerReleaseShift(SEED, DAY, 'pop', many) === PLAYER_RELEASE_CAP, 'many releases hit the cap and stop');

// Releases count from the next market week (the market only changes weekly). Demand stays bounded and moves by at most the cap; the market is only nudged, never replaced.
let bounded = true, moved = false;
for (let d = 0; d < 300; d += 7) {
  const base = genreDemand(SEED, d + 40, 'Pop');
  const nudged = genreDemand(SEED, d + 40, 'Pop', [rel('x', 'Pop', 100, d + 30), ...many.map((m) => ({ ...m, releaseDay: d + 32 }))]);
  if (nudged > 1 || nudged < -1 || nudged - base > PLAYER_RELEASE_CAP + 1e-9 || nudged < base - 1e-9) bounded = false;
  if (nudged > base) moved = true;
}
ok(bounded && moved, 'releases lift demand by at most the cap and never past 1');

// releaseSignals flattens client relationships.
const flat = releaseSignals({ c1: { releases: [rel('a', 'Pop', 50, 1)] }, c2: {}, c3: { releases: [rel('b', 'Rock', 60, 2), rel('c', 'Jazz', 70, 3)] } });
ok(flat.length === 3 && releaseSignals(undefined).length === 0, "releaseSignals flattens every client's releases, tolerating legacy saves");

// Industry Pulse "since" detail.
let sawChanged = false, sawHeld = false, consistent = true;
for (let seed = 1; seed < 15; seed++) for (let d = 0; d < 400; d += 7) {
  for (const l of industryPulse(seed, d)) {
    if (!l.since.length) consistent = false;
    if (l.changedWeek === undefined) { sawHeld = true; if (!l.since.includes(`${PULSE_LOOKBACK_WEEKS}+ weeks`) && d >= PULSE_LOOKBACK_WEEKS * 7) consistent = false; }
    else {
      sawChanged = true;
      if (l.changedWeek > Math.floor(d / 7) || !l.since.includes(`since week ${l.changedWeek + 1}`)) consistent = false;
    }
  }
}
ok(sawChanged && sawHeld && consistent, 'the pulse says which week each genre last changed, or that it has held for the whole lookback');
ok(JSON.stringify(industryPulse(SEED, DAY)) === JSON.stringify(industryPulse(SEED, DAY - (DAY % 7) + 6)), 'the pulse is stable within a week');
const pulseBase = JSON.stringify(industryPulse(SEED, DAY, 6));
const pulseNudged = JSON.stringify(industryPulse(SEED, DAY, 6, many));
ok(pulseBase !== pulseNudged, "the pulse reflects the studio's own releases");

console.log(`${n} market player-influence checks passed`);
