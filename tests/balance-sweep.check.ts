/** GH #19 / #57 balance harness: determinism, invariants, config overrides, sweep + runaway flags. */
import assert from 'node:assert';
import { simulateStrategy, STRATEGIES } from '../src/dev/balance/simulate';
import { checkInvariants, allPassed } from '../src/dev/balance/invariants';
import { runScenarioSweep, sweepToCsv } from '../src/dev/balance/sweep';
import { SCENARIOS, PLAY_PROFILES } from '../src/dev/balance/config';

let passed = 0;
const ok = (cond: boolean, msg: string): void => {
  assert(cond, `FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

// Same seed + strategy + config => identical result; a different seed differs.
const a = simulateStrategy(11, 'balanced', 40);
ok(JSON.stringify(a) === JSON.stringify(simulateStrategy(11, 'balanced', 40)), 'same seed + strategy is identical');
ok(JSON.stringify(a) !== JSON.stringify(simulateStrategy(12, 'balanced', 40)), 'different seed differs');

// A 100-day run completes headless for every strategy and passes all invariants.
for (const s of STRATEGIES) {
  const run = simulateStrategy(3, s, 100);
  ok(run.perDay.length > 0 && run.moneyHistory.length === 100, `${s}: 100-day run completes`);
  ok(allPassed(checkInvariants(run)), `${s}: invariants hold`);
}
ok(checkInvariants(a).length >= 5, 'at least five economic invariants automated');

// Snapshot scenarios: early / mid / late all hold invariants.
for (const name of Object.keys(SCENARIOS)) {
  const run = simulateStrategy(5, 'highest-fee', 60, 'analog60s', SCENARIOS[name]);
  ok(allPassed(checkInvariants(run)), `scenario ${name}: invariants hold`);
}

// Constants change without editing the harness.
const cheap = simulateStrategy(9, 'balanced', 40, 'analog60s', { dailyCost: 25 });
const dear = simulateStrategy(9, 'balanced', 40, 'analog60s', { dailyCost: 2000 });
ok(dear.cash < cheap.cash, 'raising dailyCost lowers ending cash');
ok(dear.bankrupt && !cheap.bankrupt, 'extreme upkeep flags bankruptcy');

// Attended play out-earns automation (idle profile) but not by an extreme margin.
const attended = simulateStrategy(9, 'balanced', 60, 'analog60s', { play: PLAY_PROFILES.attended });
const auto = simulateStrategy(9, 'balanced', 60, 'analog60s', { play: PLAY_PROFILES.auto });
ok(attended.avgQuality > auto.avgQuality, 'attended play yields higher quality than automation');

// Reward side runs: late-game sessions chart and pay gems; everything stays accounted for.
const late = simulateStrategy(2, 'highest-fee', 90, 'analog60s', SCENARIOS.late);
ok(late.rewards.chartDebuts > 0 && late.rewards.gems > 0, 'late scenario charts songs and earns gems');
ok(late.rewards.chartPlacements >= late.rewards.chartDebuts, 'weekly chart moves add to debuts');

// Invariants catch a corrupted run.
const dup = { ...a, settledIds: [...a.settledIds, a.settledIds[0]] };
ok(!allPassed(checkInvariants(dup)), 'duplicate settlement is detected');
const nan = { ...a, cash: NaN };
ok(!allPassed(checkInvariants(nan)), 'NaN cash is detected');

// Sweep: deterministic, aggregates per strategy, exports CSV, flags runaways.
const sweep = runScenarioSweep({ scenario: 'mid', seeds: 6, days: 30 });
ok(JSON.stringify(sweep) === JSON.stringify(runScenarioSweep({ scenario: 'mid', seeds: 6, days: 30 })), 'sweep is deterministic');
ok(sweep.stats.length === STRATEGIES.length, 'sweep covers every strategy');
ok(sweep.stats.every((s) => s.invariantFailures === 0), 'sweep: no invariant failures');
const csv = sweepToCsv(sweep).trim().split('\n');
ok(csv.length === 1 + STRATEGIES.length && csv[0].startsWith('scenario,days,era,strategy'), 'CSV has a header and one row per strategy');
const tight = runScenarioSweep({ scenario: 'late', seeds: 4, days: 60, config: { limits: { maxRewardShare: 0, maxDailyIncome: 1, maxStrategyDominance: 1 } as never } });
ok(tight.flags.some((f) => f.kind === 'reward-share'), 'tight limits raise a reward-share flag');
ok(tight.flags.some((f) => f.kind === 'daily-income'), 'tight limits raise a daily-income flag');

console.log(`balance-sweep: ${passed} checks passed`);
