/** Market demand signals (#52): deterministic, weekly, bounded, and never about technical quality. */
import {
  enquiryDemandWeight, genreDemand, industryPulse, releaseDemandPoints, weekStartDay,
  ENQUIRY_DEMAND_SWING, RELEASE_DEMAND_POINTS, MARKET_WEEK_DAYS,
} from '../src/rpg/marketDemand';
import { outcomeBandFor, recordRelease } from '../src/rpg/artistCareer';
import { generateNewProjects } from '../src/utils/projectUtils';
import { MarketService } from '../src/game-mechanics/market-trends';
import { calculateStaffProjectFit } from '../src/utils/staffFitUtils';
import type { ClientRelationship } from '../src/types/game';

let n = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); n++; console.log(`PASS: ${m}`); };

// Weekly cadence and determinism.
ok(weekStartDay(0) === 0 && weekStartDay(6) === 0 && weekStartDay(7) === 7 && weekStartDay(20) === 14, 'weeks start every seven days');
const genres = ['Pop', 'Rock', 'Hip-Hop', 'Electronic', 'Country', 'Jazz'];
const snap = (seed: number, day: number) => JSON.stringify(genres.map((g) => genreDemand(seed, day, g)));
ok(snap(5, 21) === snap(5, 21), 'same save and day give the same demand (reload safe)');
ok(snap(5, 21) === snap(5, 21 + MARKET_WEEK_DAYS - 1), 'demand does not move inside a week');
let moved = false;
for (let d = 7; d <= 140 && !moved; d += 7) if (snap(5, d) !== snap(5, 0)) moved = true;
ok(moved, 'demand moves between weeks');
ok(snap(5, 70) !== snap(6, 70), 'a different save has a different market');

// Bounds.
let allBounded = true;
for (let d = 0; d <= 700; d += 7) for (const g of genres) {
  const s = genreDemand(9, d, g);
  const w = enquiryDemandWeight(9, d)(g);
  if (s < -1 || s > 1 || w < 1 - ENQUIRY_DEMAND_SWING - 1e-9 || w > 1 + ENQUIRY_DEMAND_SWING + 1e-9) allBounded = false;
  if (Math.abs(releaseDemandPoints(9, d, g)) > RELEASE_DEMAND_POINTS) allBounded = false;
}
ok(allBounded, 'demand, enquiry weight and release points stay inside their bounds over 100 weeks');
ok(genreDemand(9, 70, 'Folk') === 0 && enquiryDemandWeight(9, 70)('Folk') === 1, 'a genre the market does not model is neutral');
ok(genreDemand(undefined, 70, 'Pop') === 0 && enquiryDemandWeight(undefined, 70)('Pop') === 1 && industryPulse(undefined, 5).length === 0, 'a save with no seed is neutral');

// No genre is pinned by noise alone: over a long run each genre is hot and cold at some point.
const seen: Record<string, [boolean, boolean]> = {};
for (let seed = 1; seed <= 12; seed++) for (let d = 0; d <= 700; d += 7) for (const g of genres) {
  const s = genreDemand(seed, d, g);
  const cur = (seen[g] ??= [false, false]);
  if (s > 0.3) cur[0] = true;
  if (s < -0.3) cur[1] = true;
}
ok(genres.every((g) => seen[g][0] && seen[g][1]), 'every genre is sometimes hot and sometimes cold across saves');

// Enquiries consume the signal, boundedly: the hot genre shows up more than the cold one, never exclusively.
const hotCold = (() => {
  for (let seed = 1; seed < 60; seed++) for (let d = 0; d < 400; d += 7) {
    const sc = genres.map((g) => [g, genreDemand(seed, d, g)] as const).sort((a, b) => b[1] - a[1]);
    if (sc[0][1] > 0.6 && sc[sc.length - 1][1] < -0.6) return { seed, d, hot: sc[0][0], cold: sc[sc.length - 1][0] };
  }
  return null;
})();
ok(hotCold !== null, 'the sweep finds a week with one hot and one cold genre');
if (hotCold) {
  const count = (weight?: (g: string) => number) => {
    const c: Record<string, number> = {};
    for (let i = 0; i < 160; i++) for (const p of generateNewProjects(3, 6, 'modern', [], 1, 5, undefined, weight)) c[p.genre] = (c[p.genre] ?? 0) + 1;
    return c;
  };
  const w = enquiryDemandWeight(hotCold.seed, hotCold.d);
  const on = count(w);
  const eras = (on[hotCold.hot] ?? 0) + (on[hotCold.cold] ?? 0);
  const off = count();
  ok(eras === 0 || (on[hotCold.hot] ?? 0) / Math.max(1, off[hotCold.hot] ?? 1) > (on[hotCold.cold] ?? 0) / Math.max(1, off[hotCold.cold] ?? 1) - 0.05, `hot ${hotCold.hot} gains share over cold ${hotCold.cold} compared with no demand`);
  ok(Object.keys(on).length >= Object.keys(off).length - 1, 'demand never removes whole genres from the board');
}

// Releases: a bounded nudge. Quality still dominates and the default call is unchanged.
ok(outcomeBandFor.length === 2, 'the outcome signature still has two required inputs');
ok(outcomeBandFor('x', 80) === outcomeBandFor('x', 80, 0), 'no demand gives the original outcome');
const rank = { quiet: 0, solid: 1, breakthrough: 2, prestige: 3 } as const;
let nudgeOk = true;
for (let i = 0; i < 200; i++) {
  const base = rank[outcomeBandFor(`r${i}`, 40 + (i % 50))];
  const up = rank[outcomeBandFor(`r${i}`, 40 + (i % 50), RELEASE_DEMAND_POINTS)];
  const down = rank[outcomeBandFor(`r${i}`, 40 + (i % 50), -RELEASE_DEMAND_POINTS)];
  if (up < base || down > base || up - base > 1 || base - down > 1) nudgeOk = false;
  if (rank[outcomeBandFor(`r${i}`, 40 + (i % 50), 999)] !== up) nudgeOk = false; // clamped
}
ok(nudgeOk, 'demand moves an outcome by at most one band, in the right direction, and is clamped');
const rel = recordRelease({ clientId: 'c', clientName: 'C', primaryGenre: 'Pop', relationshipXp: 0, tier: 'Neutral', sessionsCompleted: 1, lastSessionDay: 1, bestQualityScore: 60, referralCount: 0 } as ClientRelationship,
  { projectId: 'p', title: 'T', genre: 'Pop', qualityScore: 75, day: 3, demandPoints: RELEASE_DEMAND_POINTS });
ok(rel.releases![0].outcomeBand === outcomeBandFor('p', 75, RELEASE_DEMAND_POINTS), 'a recorded release uses the demand at release time');

// Technical quality is a separate axis: fit scoring does not read the market at all.
ok(calculateStaffProjectFit.length >= 1 && !String(calculateStaffProjectFit).includes('marketDemand') && !String(calculateStaffProjectFit).includes('genreDemand'), 'staff-to-project fit does not read demand');

// Industry Pulse.
const pulse = industryPulse(5, 70);
ok(pulse.length === 3 && pulse.every((l) => ['Rising', 'Stable', 'Cooling'].includes(l.word) && l.effect.length > 0), 'the pulse shows three genres with a word and a plain effect');
ok(JSON.stringify(industryPulse(5, 70)) === JSON.stringify(industryPulse(5, 74)), 'the pulse holds all week');

// The second market class is seeded too.
const mk = (seed: string) => new MarketService([{ id: 'pop', name: 'Pop', description: '' } as never], []);
void mk;
const g = [{ id: 'pop', name: 'Pop', description: '' }, { id: 'rock', name: 'Rock', description: '' }] as never[];
const a = new MarketService(g, [], 3), b = new MarketService(g, [], 3), c = new MarketService(g, [], 4);
const key = (m: MarketService) => JSON.stringify(m.getAllMarketTrends());
ok(key(a) === key(b) && key(a) !== key(c), 'the game-mechanics market is deterministic per seed (no Math.random)');
a.updateMarketTrends(5); b.updateMarketTrends(5);
ok(key(a) === key(b), 'its updates are deterministic too');

console.log(`market-demand: all ${n} checks passed`);
