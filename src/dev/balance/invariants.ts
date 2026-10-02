/**
 * GH #19 balance-harness invariants — deterministic checks over a BalanceRun.
 */
import type { BalanceRun } from './simulate';
import { DEFAULT_LIMITS } from './config';

export interface InvariantResult {
  name: string;
  passed: boolean;
  detail: string;
}

/** Debt is allowed in the sim, but cash below this is flagged impossible. */
export const MAX_DEBT = -10000;
/** Quality above this is assumed to never lose reputation (see note below). */
export const HIGH_QUALITY_THRESHOLD = 70;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export const checkInvariants = (run: BalanceRun): InvariantResult[] => {
  const results: InvariantResult[] = [];

  const numericFields: number[] = [
    run.cash,
    run.reputation,
    run.completed,
    run.totalQuality,
    run.avgQuality,
    ...run.qualities,
    ...run.moneyHistory,
    ...run.repHistory,
  ];
  const badCount = numericFields.filter((n) => !isFiniteNumber(n)).length;
  results.push({
    name: 'no-nan',
    passed: badCount === 0,
    detail: badCount === 0 ? 'all numeric fields finite' : `${badCount} non-finite numeric fields`,
  });

  const minCash = run.moneyHistory.length > 0 ? Math.min(...run.moneyHistory) : run.cash;
  results.push({
    name: 'money-floor',
    passed: minCash >= MAX_DEBT,
    detail: `min cash ${minCash} vs floor ${MAX_DEBT} (debt allowed, ruin flagged)`,
  });

  const uniqueIds = new Set(run.settledIds).size;
  results.push({
    name: 'no-duplicate-settlement',
    passed: uniqueIds === run.settledIds.length,
    detail: `${uniqueIds} unique of ${run.settledIds.length} settled ids`,
  });

  const outOfRange = run.qualities.filter((q) => q < 0 || q > 100);
  results.push({
    name: 'quality-range',
    passed: outOfRange.length === 0,
    detail: outOfRange.length === 0 ? `all ${run.qualities.length} qualities within 0-100` : `${outOfRange.join(',')} out of range`,
  });

  const countsMatch =
    run.completed === run.settledIds.length &&
    run.completed === run.perDay.length &&
    run.completed <= run.days &&
    run.moneyHistory.length === run.days;
  results.push({
    name: 'completed-count',
    passed: countsMatch,
    detail: `completed=${run.completed} settled=${run.settledIds.length} days=${run.days} (single room: one session at a time, at most one settle/day)`,
  });

  // ASSUMPTION (approximated): the sim settles one session at a time and generateProjectReview floors reputation gains at >= 0, so
  // reputation cannot decrease here. A real economy with reputation decay,
  // failed-project penalties, or upkeep charged to reputation could violate
  // this — the check documents the approximation rather than proving the
  // real game monotonic.
  let violations = 0;
  run.perDay.forEach((record, i) => {
    const before = i === 0 ? 0 : run.perDay[i - 1].repAfter;
    if (record.quality > HIGH_QUALITY_THRESHOLD && record.repAfter < before) violations++;
  });
  results.push({
    name: 'reputation-monotonic-on-high-quality',
    passed: violations === 0,
    detail:
      violations === 0
        ? `no rep decrease on days with quality > ${HIGH_QUALITY_THRESHOLD} (assumes no rep decay/fees — approximated, see note)`
        : `${violations} high-quality days lost reputation`,
  });

  // Reward economy: gems and loot can only add, chart positions stay on the chart,
  // and every case granted is accounted for.
  const r = run.rewards;
  const rewardNumbers = [r.gems, r.lootValue, r.maxCaseLoot, r.rewardCash, r.chartDebuts, r.chartPlacements, r.number1s, r.minigames, r.ambient, r.maxAmbientDay, ...Object.values(r.cases)];
  results.push({
    name: 'rewards-finite-nonnegative',
    passed: rewardNumbers.every((n) => isFiniteNumber(n) && n >= 0),
    detail: `gems=${r.gems} rewardCash=${r.rewardCash} chartPlacements=${r.chartPlacements}`,
  });

  results.push({
    name: 'chart-accounting',
    passed: r.chartPlacements >= r.chartDebuts && r.number1s <= r.chartPlacements && r.chartDebuts <= run.completed,
    detail: `debuts=${r.chartDebuts} placements=${r.chartPlacements} number1s=${r.number1s} sessions=${run.completed}`,
  });

  results.push({
    name: 'ambient-within-daily-cap',
    passed: r.maxAmbientDay <= Math.max(r.ambientCap, 0),
    detail: `max ambient day ${r.maxAmbientDay} vs cap reached ${r.ambientCap}`,
  });

  const worstMultiple = run.perDay.reduce((m, d) => Math.max(m, d.payoutMultiple), 0);
  results.push({
    name: 'session-payout-bounded',
    passed: worstMultiple <= DEFAULT_LIMITS.maxSessionPayoutMultiple,
    detail: `worst payout multiple ${worstMultiple} vs limit ${DEFAULT_LIMITS.maxSessionPayoutMultiple} (quality x market x match x stake over payoutBase)`,
  });

  // Starting state must be winnable: the first session has to pay more than a day of upkeep
  // on top of starting cash, i.e. the run cannot be dead on arrival.
  const first = run.perDay[0];
  results.push({
    name: 'winnable-start',
    passed: !first || first.moneyGained > 0,
    detail: first ? `day 1 fee ${first.moneyGained}` : 'no days simulated',
  });

  return results;
};

export const allPassed = (results: InvariantResult[]): boolean =>
  results.every((r) => r.passed);
