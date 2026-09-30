/**
 * GH #19 / #57 seeded economy sweep.
 *
 * Runs every strategy bot across N seeds, aggregates the headline economy
 * metrics and judges them against the runaway limits in config.ts. Flags are
 * reports for a human (or the coordinator) to act on; the sweep never
 * rebalances anything itself.
 *
 *   runScenarioSweep({ scenario: 'mid', seeds: 100, days: 60 })
 */
import {
  DEFAULT_ERA,
  STRATEGIES,
  simulateStrategy,
  type BalanceRun,
  type Strategy,
} from './simulate';
import { resolveConfig, SCENARIOS, type BalanceConfig } from './config';
import { allPassed, checkInvariants } from './invariants';

export interface SweepOptions {
  seeds: number;
  days: number;
  era?: string;
  /** Named snapshot from SCENARIOS (early / mid / late). Explicit `config` wins over it. */
  scenario?: string;
  config?: Partial<BalanceConfig>;
  strategies?: Strategy[];
  firstSeed?: number;
}

export interface StrategyStats {
  strategy: Strategy;
  runs: number;
  bankruptcyRate: number;
  medianCash: number;
  p10Cash: number;
  p90Cash: number;
  meanReputation: number;
  meanQuality: number;
  meanDailyIncome: number;
  meanFirstUpgradeDay: number | null;
  neverUpgradedRate: number;
  meanGems: number;
  meanLootValue: number;
  meanRewardCash: number;
  /** Reward cash-equivalent as a share of session fees earned. */
  rewardShare: number;
  repeatSessionShare: number;
  meanAmbientPerDay: number;
  /** Ambient cash as a share of all income (session fees + ambient). */
  ambientShare: number;
  maxAmbientDay: number;
  maxSessionPayoutMultiple: number;
  maxCaseLoot: number;
  invariantFailures: number;
}

export interface RunawayFlag {
  kind: string;
  strategy: Strategy | 'all';
  value: number;
  limit: number;
  detail: string;
}

export interface SweepResult {
  scenario: string;
  seeds: number;
  days: number;
  era: string;
  config: BalanceConfig;
  stats: StrategyStats[];
  flags: RunawayFlag[];
}

const mean = (xs: number[]): number => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);
const quantile = (xs: number[], q: number): number => {
  if (!xs.length) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
};
const r2 = (n: number): number => Math.round(n * 100) / 100;

export const summarize = (strategy: Strategy, runs: BalanceRun[], days: number): StrategyStats => {
  const cashes = runs.map((r) => r.cash);
  const upgrades = runs.map((r) => r.firstUpgradeDay).filter((d): d is number => d !== null);
  const earned = runs.reduce((s, r) => s + r.earned, 0);
  const rewardCash = runs.reduce((s, r) => s + r.rewards.rewardCash, 0);
  const sessions = runs.reduce((s, r) => s + r.completed, 0);
  return {
    strategy,
    runs: runs.length,
    bankruptcyRate: r2(runs.filter((r) => r.bankrupt).length / Math.max(1, runs.length)),
    medianCash: Math.round(quantile(cashes, 0.5)),
    p10Cash: Math.round(quantile(cashes, 0.1)),
    p90Cash: Math.round(quantile(cashes, 0.9)),
    meanReputation: r2(mean(runs.map((r) => r.reputation))),
    meanQuality: r2(mean(runs.map((r) => r.avgQuality))),
    meanDailyIncome: r2(earned / Math.max(1, runs.length * days)),
    meanFirstUpgradeDay: upgrades.length ? r2(mean(upgrades)) : null,
    neverUpgradedRate: r2(1 - upgrades.length / Math.max(1, runs.length)),
    meanGems: r2(mean(runs.map((r) => r.rewards.gems))),
    meanLootValue: r2(mean(runs.map((r) => r.rewards.lootValue))),
    meanRewardCash: r2(mean(runs.map((r) => r.rewards.rewardCash))),
    rewardShare: r2(rewardCash / Math.max(1, earned)),
    meanAmbientPerDay: r2(runs.reduce((a, r) => a + r.rewards.ambient, 0) / Math.max(1, runs.length * days)),
    ambientShare: r2(runs.reduce((a, r) => a + r.rewards.ambient, 0) / Math.max(1, earned + runs.reduce((a, r) => a + r.rewards.ambient, 0))),
    maxAmbientDay: runs.reduce((m, r) => Math.max(m, r.rewards.maxAmbientDay), 0),
    repeatSessionShare: r2(runs.reduce((s, r) => s + r.repeatSessions, 0) / Math.max(1, sessions)),
    maxSessionPayoutMultiple: runs.reduce((m, r) => r.perDay.reduce((mm, d) => Math.max(mm, d.payoutMultiple), m), 0),
    maxCaseLoot: runs.reduce((m, r) => Math.max(m, r.rewards.maxCaseLoot), 0),
    invariantFailures: runs.filter((r) => !allPassed(checkInvariants(r))).length,
  };
};

export const detectRunaways = (stats: StrategyStats[], config: BalanceConfig): RunawayFlag[] => {
  const L = config.limits;
  const flags: RunawayFlag[] = [];
  for (const s of stats) {
    if (s.rewardShare > L.maxRewardShare)
      flags.push({ kind: 'reward-share', strategy: s.strategy, value: s.rewardShare, limit: L.maxRewardShare, detail: 'gems + loot are a larger share of income than a side reward should be' });
    if (s.maxSessionPayoutMultiple > L.maxSessionPayoutMultiple)
      flags.push({ kind: 'session-payout', strategy: s.strategy, value: s.maxSessionPayoutMultiple, limit: L.maxSessionPayoutMultiple, detail: 'one session paid far above its listed fee' });
    if (s.maxCaseLoot > L.maxCaseLootValue)
      flags.push({ kind: 'case-loot', strategy: s.strategy, value: s.maxCaseLoot, limit: L.maxCaseLootValue, detail: 'a single flight case rolled loot worth more than the limit' });
    if (s.bankruptcyRate > L.maxBankruptcyRate)
      flags.push({ kind: 'death-spiral', strategy: s.strategy, value: s.bankruptcyRate, limit: L.maxBankruptcyRate, detail: 'too many seeds dipped below zero cash' });
    if (s.meanDailyIncome > L.maxDailyIncome)
      flags.push({ kind: 'daily-income', strategy: s.strategy, value: s.meanDailyIncome, limit: L.maxDailyIncome, detail: 'mean session income per day exceeds the runaway ceiling' });
    if (config.play.ambientTicksPerDay > 0 && s.ambientShare > L.maxAmbientShare)
      flags.push({ kind: 'ambient-high', strategy: s.strategy, value: s.ambientShare, limit: L.maxAmbientShare, detail: 'ambient earning is a larger share of income than a background trickle should be' });
    if (config.play.ambientTicksPerDay > 0 && s.ambientShare < L.minAmbientShare)
      flags.push({ kind: 'ambient-low', strategy: s.strategy, value: s.ambientShare, limit: L.minAmbientShare, detail: 'ambient earning is too small to register next to session fees' });
    if (s.invariantFailures > 0)
      flags.push({ kind: 'invariant', strategy: s.strategy, value: s.invariantFailures, limit: 0, detail: 'runs violated an economy invariant' });
  }
  const medians = stats.map((s) => s.medianCash).sort((a, b) => a - b);
  const mid = medians[Math.floor(medians.length / 2)];
  const best = stats.reduce((a, b) => (b.medianCash > a.medianCash ? b : a), stats[0]);
  if (best && mid > 0) {
    const dominance = r2(best.medianCash / mid);
    if (dominance > L.maxStrategyDominance)
      flags.push({ kind: 'strategy-dominance', strategy: best.strategy, value: dominance, limit: L.maxStrategyDominance, detail: 'best strategy out-earns the median strategy by an extreme margin' });
  }
  return flags;
};

export const runScenarioSweep = (opts: SweepOptions): SweepResult => {
  const scenario = opts.scenario ?? 'early';
  const era = opts.era ?? DEFAULT_ERA;
  const config = resolveConfig({ ...(SCENARIOS[scenario] ?? {}), ...(opts.config ?? {}) });
  const strategies = opts.strategies ?? STRATEGIES;
  const first = opts.firstSeed ?? 1;
  const stats = strategies.map((strategy) => {
    const runs: BalanceRun[] = [];
    for (let i = 0; i < opts.seeds; i++) runs.push(simulateStrategy(first + i, strategy, opts.days, era, config));
    return summarize(strategy, runs, opts.days);
  });
  return { scenario, seeds: opts.seeds, days: opts.days, era, config, stats, flags: detectRunaways(stats, config) };
};

export const sweepToCsv = (result: SweepResult): string => {
  const rows = result.stats.map((s) => ({ scenario: result.scenario, days: result.days, era: result.era, ...s }));
  const headers = Object.keys(rows[0] ?? { scenario: '' });
  const cell = (v: unknown): string => (v === null ? '' : String(v));
  return [headers.join(','), ...rows.map((r) => headers.map((h) => cell((r as Record<string, unknown>)[h])).join(','))].join('\n') + '\n';
};
