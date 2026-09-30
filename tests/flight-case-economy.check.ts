import assert from 'node:assert';
import { createDefaultGameState } from '../src/utils/newGameState';
import {
  FLIGHT_CASE_PRICES,
  awardCase,
  buyFlightCase,
  getCaseOdds,
  grantRewardBundle,
  openFlightCase,
  rewardForChartPlacement,
  rollCaseContents,
} from '../src/economy/flightCaseEconomy';
import { FLIGHT_CASES } from '../src/data/flightCases';

console.log('Testing flight case + gem economy...');
const base = { ...createDefaultGameState(), money: 10000, gems: 0, currentDay: 200, saveSeed: 'test' };

// buying with money / gems
const bought = buyFlightCase(base, 'road_case', 'money');
assert(bought.ok);
if (bought.ok) {
  assert.strictEqual(bought.state.money, 10000 - FLIGHT_CASE_PRICES.road_case.money!);
  assert.strictEqual(bought.state.pendingCrates!.length, (base.pendingCrates ?? []).length + 1);
}
assert.deepStrictEqual(buyFlightCase(base, 'road_case', 'gems'), { ok: false, reason: 'insufficient_funds' });
assert.deepStrictEqual(buyFlightCase(base, 'holy_grail_vault', 'money'), { ok: false, reason: 'not_sold' });
assert.deepStrictEqual(buyFlightCase({ ...base, currentDay: 1, gems: 999 }, 'holy_grail_vault', 'gems'), { ok: false, reason: 'locked' });
const gemBuy = buyFlightCase({ ...base, gems: 600 }, 'holy_grail_vault', 'gems');
assert(gemBuy.ok && gemBuy.state.gems === 100);

// immutability
assert.strictEqual(base.money, 10000);

// reward hook
const chart = grantRewardBundle(base, rewardForChartPlacement(1));
assert(chart.state.gems! >= 25);
assert(chart.state.pendingCrates!.some((c) => c.source === 'reward'));
assert.deepStrictEqual(rewardForChartPlacement(99), {});

// opening: deterministic, removes crate, respects item count and guarantee
const withTrunk = awardCase(base, 'tour_trunk', 'reward');
const crate = withTrunk.pendingCrates![withTrunk.pendingCrates!.length - 1];
const a = rollCaseContents(withTrunk, crate);
const b = rollCaseContents(withTrunk, crate);
assert.deepStrictEqual(a, b);
assert(a.length >= 2 && a.length <= 3);
assert(a.some((i) => ['rare', 'vintage', 'legendary'].includes(i.rarity)), 'trunk guarantees rare+');
const opened = openFlightCase(withTrunk, crate.id);
assert.strictEqual(opened.items.length, a.length);
assert(!opened.state.pendingCrates!.some((c) => c.id === crate.id));
assert.strictEqual(openFlightCase(withTrunk, 'nope').items.length, 0);

// legacy tiers still open
const legacy = { ...base, pendingCrates: [{ id: 'old', era: '1980s', source: 'chore_streak' as const, tier: 'standard' as const }] };
assert(openFlightCase(legacy, 'old').items.length >= 1);

// odds sum to ~100 for every tier/era
for (const tier of Object.keys(FLIGHT_CASES) as (keyof typeof FLIGHT_CASES)[]) {
  const total = getCaseOdds(tier, '1970s').reduce((s, o) => s + o.pct, 0);
  assert(Math.abs(total - 100) < 0.5, `${tier} odds sum ${total}`);
}
console.log('flight case economy ok');
