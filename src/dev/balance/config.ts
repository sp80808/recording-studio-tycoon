/**
 * GH #19 / #57 balance constants and scenario presets.
 *
 * Every tunable number the harness uses lives here so a sweep can change them
 * without editing simulate.ts. The game's own constants (payout tables, chart
 * bands, case prices) are still read from their real modules; this file holds
 * the *simulation-side* assumptions (upkeep, player level curve, how often a
 * mini-game fires) and the runaway-payout limits the sweep judges against.
 */
import type { FlightCaseTier } from '@/data/flightCases';

/** How much real lifecycle input the simulated player feeds into settlement (see SettlementContext). */
export interface PlayProfile {
  /** Accumulated creative / technical production points per session (take minigames). */
  cPoints: number;
  tPoints: number;
  /** Quality points from the mini-game bonus (0-10). */
  minigamePoints: number;
  /** Stage grade earned on every stage. */
  stageGrade: 'Gold' | 'Silver' | 'Bronze' | null;
  focusEffectiveness: number;
  staffContribution: number;
  studioQualityBonus: number;
  equipmentQualityBonus: number;
  /** Ambient-income ticks earned per in-game day of active play (one tick = 45s of input, see ambientIncome.ts). */
  ambientTicksPerDay: number;
}

/** Attended: locks takes, rides the console. Auto: the room runs itself with no player input. */
export const PLAY_PROFILES: Record<'attended' | 'auto', PlayProfile> = {
  attended: { cPoints: 60, tPoints: 60, minigamePoints: 4, stageGrade: 'Silver', focusEffectiveness: 1.1, staffContribution: 0, studioQualityBonus: 2, equipmentQualityBonus: 0, ambientTicksPerDay: 10 },
  auto: { cPoints: 0, tPoints: 0, minigamePoints: 0, stageGrade: null, focusEffectiveness: 1, staffContribution: 0, studioQualityBonus: 0, equipmentQualityBonus: 0, ambientTicksPerDay: 0 },
};

export interface BalanceConfig {
  startingCash: number;
  startingReputation: number;
  /** Every player skill starts at this level (scenario snapshots: early 1, mid 6, late 12). */
  startingSkillLevel: number;
  /** Studio tier 1-5 (feeds ambient income). */
  studioLevel: number;
  /** Fixed daily upkeep (rent + wages stand-in). */
  dailyCost: number;
  projectsPerDay: number;
  /** Stand-in for equipment quality (0-100) fed to settlement. */
  equipmentQuality: number;
  /** Player level = 1 + floor(reputation / repPerLevel), capped at maxLevel. */
  repPerLevel: number;
  maxLevel: number;
  /** Chance a settled session also plays a rewarded mini-game. */
  minigameRate: number;
  /** Cash value of one gem (road case: 600 money vs 30 gems => 20). */
  gemCashValue: number;
  /** Fraction of a loot item's baseValue realised when sold on. */
  lootResaleFactor: number;
  /** Cash that counts as the first meaningful upgrade (new room / console). */
  firstUpgradeCost: number;
  play: PlayProfile;
  limits: RunawayLimits;
}

export interface RunawayLimits {
  /** Reward cash-equivalent (gems + loot) above this share of session income is flagged. */
  maxRewardShare: number;
  /** One session paying out more than this multiple of its payoutBase is flagged. */
  maxSessionPayoutMultiple: number;
  /** Best strategy's mean cash above this multiple of the median strategy is flagged. */
  maxStrategyDominance: number;
  /** Any single case loot roll worth more than this cash-equivalent is flagged. */
  maxCaseLootValue: number;
  /** Share of seeds ending below zero cash that counts as a death spiral. */
  maxBankruptcyRate: number;
  /** A strategy earning per day above this (late game) is flagged as runaway income. */
  maxDailyIncome: number;
  /** Ambient income above this share of total income is too generous... */
  maxAmbientShare: number;
  /** ...and below this share it is not noticeable as a side income (only judged when ticks > 0). */
  minAmbientShare: number;
}

export const DEFAULT_LIMITS: RunawayLimits = {
  maxRewardShare: 0.35,
  maxSessionPayoutMultiple: 3.2,
  maxStrategyDominance: 2.5,
  maxCaseLootValue: 6000,
  maxBankruptcyRate: 0.25,
  maxDailyIncome: 6000,
  maxAmbientShare: 0.12,
  minAmbientShare: 0.01,
};

export const DEFAULT_BALANCE_CONFIG: BalanceConfig = {
  startingCash: 500,
  startingReputation: 0,
  startingSkillLevel: 1,
  studioLevel: 1,
  dailyCost: 25,
  projectsPerDay: 3,
  equipmentQuality: 50,
  repPerLevel: 25,
  maxLevel: 10,
  minigameRate: 0.5,
  gemCashValue: 20,
  lootResaleFactor: 0.5,
  firstUpgradeCost: 2500,
  play: PLAY_PROFILES.attended,
  limits: DEFAULT_LIMITS,
};

/** Snapshot scenarios: a known progression state + the overrides that define it. */
export const SCENARIOS: Record<string, Partial<BalanceConfig>> = {
  early: {},
  mid: { startingCash: 6000, startingReputation: 120, startingSkillLevel: 6, studioLevel: 3, dailyCost: 120, equipmentQuality: 65 },
  late: { startingCash: 30000, startingReputation: 450, startingSkillLevel: 12, studioLevel: 5, dailyCost: 400, equipmentQuality: 85 },
};

export const resolveConfig = (overrides: Partial<BalanceConfig> = {}): BalanceConfig => ({
  ...DEFAULT_BALANCE_CONFIG,
  ...overrides,
  play: { ...DEFAULT_BALANCE_CONFIG.play, ...(overrides.play ?? {}) },
  limits: { ...DEFAULT_LIMITS, ...(overrides.limits ?? {}) },
});

export const CASE_TIERS: FlightCaseTier[] = [
  'cardboard_box',
  'road_case',
  'tour_trunk',
  'vintage_flight_case',
  'holy_grail_vault',
];
