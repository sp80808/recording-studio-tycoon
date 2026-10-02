/**
 * GH #19 headless day-loop simulation.
 *
 * Pure loop over MINIMAL plain-object stand-ins — no React hooks, no
 * components, no UI. Drives the real pure economy functions:
 *   - generateNewProjects + generateProjectReview (session fees and quality)
 *   - debutChartRun / advanceChartWeek / weeksDue (weekly chart run)
 *   - rewardForChartPlacement / rewardForMinigame / grantRewardBundle /
 *     openFlightCase (flight cases + gems)
 * with player skill XP via grantSkillXp and market trend via
 * getGenreMarketMultiplier.
 *
 * Determinism rules: the whole run executes inside one withSeededRandom
 * block (fixed call order => identical Math.random stream), project IDs are
 * rewritten to seed/day/index BEFORE review (generateProjectReview seeds its
 * internal RNG from project.id), money is rounded to integers, reward rolls
 * use their own seeded stream so they never perturb the booking stream, and
 * no Date.now / wall-clock values appear in outputs.
 *
 * Out of scope on purpose: the used-gear economy. Loot is valued at its rolled
 * baseValue only; nothing here touches ownedEquipment or resale spreads.
 */
import { generateNewProjects } from '@/utils/projectUtils';
import { generateProjectReview } from '@/utils/projectReviewUtils';
import { calculateXpToNextLevel, grantSkillXp, initializeSkillsPlayer } from '@/utils/skillUtils';
import { getGenreMarketMultiplier } from '@/utils/eraProgression';
import { advanceChartWeek, debutChartRun, weeksDue, type ChartRunEntry } from '@/utils/chartRun';
import {
  grantRewardBundle,
  openFlightCase,
  rewardForChartPlacement,
  rewardForMinigame,
  type RewardBundle,
} from '@/economy/flightCaseEconomy';
import { gradeForMinigameScore } from '@/economy/rewardHookup';
import { applyAmbientTick, ambientDailyCap } from '@/economy/ambientIncome';
import { createSeededRandom } from '@/simulation/seededRandom';
import type { FlightCaseTier } from '@/data/flightCases';
import type { ClientRelationship, GameState, PlayerData, Project, Skill } from '@/types/game';
import { withSeededRandom } from './rng';
import { CASE_TIERS, DEFAULT_BALANCE_CONFIG, resolveConfig, type BalanceConfig } from './config';

export type Strategy =
  | 'cheapest'
  | 'highest-fee'
  | 'balanced'
  | 'reputation-first'
  | 'repeat-client-first';
export const STRATEGIES: Strategy[] = [
  'cheapest',
  'highest-fee',
  'balanced',
  'reputation-first',
  'repeat-client-first',
];

// Backwards-compatible aliases for the default config.
export const PROJECTS_PER_DAY = DEFAULT_BALANCE_CONFIG.projectsPerDay;
export const EQUIPMENT_QUALITY = DEFAULT_BALANCE_CONFIG.equipmentQuality;
export const STARTING_CASH = DEFAULT_BALANCE_CONFIG.startingCash;
export const DAILY_COST = DEFAULT_BALANCE_CONFIG.dailyCost;
export const DEFAULT_ERA = 'analog60s';

const ERA_DECADE: Record<string, string> = {
  analog60s: '1960s',
  digital80s: '1980s',
  internet2000s: '2000s',
  streaming2020s: '2020s',
};

export interface DayRecord {
  day: number;
  projectId: string;
  title: string;
  genre: string;
  difficulty: number;
  payoutBase: number;
  quality: number;
  moneyGained: number;
  repGained: number;
  cashAfter: number;
  repAfter: number;
  /** moneyGained / payoutBase: how far quality x market x match multiplied the listed fee. */
  payoutMultiple: number;
  repeatClient: boolean;
  /** Reward cash-equivalent (gems + loot) earned on this day from chart and mini-game moments. */
  rewardCash: number;
}

export interface RewardTotals {
  gems: number;
  cases: Record<FlightCaseTier, number>;
  /** Sum of rolled loot baseValue (before the resale factor). */
  lootValue: number;
  /** Largest single case loot value (cash-equivalent, after the resale factor). */
  maxCaseLoot: number;
  /** gems x gemCashValue + lootValue x lootResaleFactor. */
  rewardCash: number;
  chartDebuts: number;
  chartPlacements: number;
  number1s: number;
  minigames: number;
  /** Cash earned from ambient ticks (already included in run cash). */
  ambient: number;
  /** Largest ambient total on any single day. */
  maxAmbientDay: number;
  /** Highest daily cap the catalog reached. */
  ambientCap: number;
}

export interface BalanceRun {
  seed: number;
  strategy: Strategy;
  days: number;
  era: string;
  cash: number;
  reputation: number;
  completed: number;
  totalQuality: number;
  avgQuality: number;
  /** Sum of session fees (before upkeep and rewards). */
  earned: number;
  repeatSessions: number;
  /** First day cash reached config.firstUpgradeCost (null = never). */
  firstUpgradeDay: number | null;
  minCash: number;
  bankrupt: boolean;
  rewards: RewardTotals;
  settledIds: string[];
  qualities: number[];
  moneyHistory: number[];
  repHistory: number[];
  perDay: DayRecord[];
}

const pickBest = (projects: Project[], score: (p: Project) => number): Project => {
  let best = projects[0];
  let bestScore = score(best);
  for (const p of projects) {
    const s = score(p);
    if (s > bestScore) {
      best = p;
      bestScore = s;
    }
  }
  return best;
};

export const isReturnClient = (p: Project): boolean => p.title.startsWith('Return:');

export const pickProject = (projects: Project[], strategy: Strategy): Project => {
  switch (strategy) {
    case 'cheapest':
      // lowest difficulty, tie: lowest payout
      return pickBest(projects, (p) => -(p.difficulty * 1e9 + p.payoutBase));
    case 'highest-fee':
      return pickBest(projects, (p) => p.payoutBase);
    case 'reputation-first':
      return pickBest(projects, (p) => p.repGainBase * 1e6 + p.payoutBase);
    case 'repeat-client-first':
      return pickBest(projects, (p) => (isReturnClient(p) ? 1e9 : 0) + p.payoutBase);
    case 'balanced':
    default:
      return pickBest(projects, (p) => p.payoutBase / Math.max(1, p.difficulty));
  }
};

export const emptyRewards = (): RewardTotals => ({
  gems: 0,
  cases: Object.fromEntries(CASE_TIERS.map((t) => [t, 0])) as Record<FlightCaseTier, number>,
  lootValue: 0,
  maxCaseLoot: 0,
  rewardCash: 0,
  chartDebuts: 0,
  chartPlacements: 0,
  number1s: 0,
  minigames: 0,
  ambient: 0,
  maxAmbientDay: 0,
  ambientCap: 0,
});

/** Simulate `days` days under one strategy. Same seed + strategy + config => identical result. */
export const simulateStrategy = (
  seed: number,
  strategy: Strategy,
  days: number,
  era: string = DEFAULT_ERA,
  overrides: Partial<BalanceConfig> = {},
): BalanceRun => {
  const config = resolveConfig(overrides);
  return withSeededRandom(seed, () => {
    const skills = initializeSkillsPlayer();
    const skillMap = skills as unknown as Record<string, Skill>;
    if (config.startingSkillLevel > 1) {
      for (const key of Object.keys(skillMap)) {
        skillMap[key] = { level: config.startingSkillLevel, xp: 0, xpToNextLevel: calculateXpToNextLevel(config.startingSkillLevel) };
      }
    }
    const player = { skills } as PlayerData;
    const rewardRng = createSeededRandom(`${seed}:rewards`);

    let cash = config.startingCash;
    let reputation = config.startingReputation;
    let earned = 0;
    let repeatSessions = 0;
    let firstUpgradeDay: number | null = null;
    let minCash = cash;
    const settledIds: string[] = [];
    const qualities: number[] = [];
    const moneyHistory: number[] = [];
    const repHistory: number[] = [];
    const perDay: DayRecord[] = [];
    const knownClients = new Map<string, ClientRelationship>();
    let chartRun: ChartRunEntry[] = [];
    const rewards = emptyRewards();

    // Minimal GameState stand-in for the pure flight-case functions.
    let rewardState = {
      money: 0,
      gems: 0,
      currentDay: 1,
      selectedEra: ERA_DECADE[era] ?? '1970s',
      saveSeed: seed,
      pendingCrates: [],
    } as unknown as GameState;

    // Ambient earning (#109): stand-in state for the pure tick functions.
    let ambientState = {
      money: 0,
      currentDay: 1,
      saveSeed: seed,
      studioLevel: config.studioLevel,
      financials: { income: 0, profit: 0, reports: [] as unknown[] },
    } as unknown as GameState;

    /** Grant a bundle, open every crate it produced, return its cash-equivalent. */
    const settleReward = (bundle: RewardBundle, day: number): number => {
      if (!bundle.gems && !bundle.cases?.length) return 0;
      // Tick `money` so crate ids stay unique across grants on the same day.
      rewardState = { ...rewardState, currentDay: day, money: rewardState.money + 1 };
      const granted = grantRewardBundle(rewardState, bundle);
      rewardState = granted.state;
      let cashEq = (granted.granted.gems ?? 0) * config.gemCashValue;
      rewards.gems += granted.granted.gems ?? 0;
      for (const c of bundle.cases ?? []) rewards.cases[c.tier] += 1;
      for (const crate of [...(rewardState.pendingCrates ?? [])]) {
        const opened = openFlightCase(rewardState, crate.id);
        rewardState = opened.state;
        const value = opened.items.reduce((s, i) => s + i.baseValue, 0);
        rewards.lootValue += value;
        rewards.maxCaseLoot = Math.max(rewards.maxCaseLoot, value * config.lootResaleFactor);
        cashEq += value * config.lootResaleFactor;
      }
      rewards.rewardCash += cashEq;
      return cashEq;
    };

    /** One booked session at a time (single room); it settles on its last day. */
    let ambientCapSeen = 0;
    let active: { project: Project; report: ReturnType<typeof generateProjectReview>; endDay: number } | null = null;

    for (let day = 1; day <= days; day++) {
      cash = Math.round(cash - config.dailyCost);
      let rewardCash = 0;

      if (!active) {
        const level = Math.min(config.maxLevel, 1 + Math.floor(reputation / config.repPerLevel));
        const candidates = generateNewProjects(config.projectsPerDay, level, era, [...knownClients.values()]);
        // Rewrite IDs deterministically BEFORE review: the review's internal
        // seeded RNG derives from project.id, so Date.now-based IDs would
        // break determinism even under a seeded Math.random. Returning clients
        // keep their relationship clientId so repeat business stays linked.
        candidates.forEach((p, i) => {
          const returning = isReturnClient(p);
          p.id = `seed${seed}-d${day}-c${i}`;
          if (!returning) p.clientId = `seed${seed}-d${day}-client${i}`;
          p.associatedBandId = p.clientId;
        });

        const project = pickProject(candidates, strategy);
        // Feed the play profile into the project the way takes / stage grades would.
        const play = config.play;
        project.accumulatedCPoints = play.cPoints;
        project.accumulatedTPoints = play.tPoints;
        project.minigamePoints = play.minigamePoints;
        project.stageGrades = play.stageGrade ? project.stages.map(() => play.stageGrade!) : [];
        const report = generateProjectReview(
          project,
          { type: 'player', id: 'player', name: 'Player' },
          config.equipmentQuality,
          player,
          [],
          {
            marketMultiplier: getGenreMarketMultiplier(project.genre, era),
            focusEffectiveness: play.focusEffectiveness,
            staffContribution: play.staffContribution,
            studioQualityBonus: play.studioQualityBonus,
            equipmentQualityBonus: play.equipmentQualityBonus,
          },
        );
        active = { project, report, endDay: day + Math.max(1, project.durationDaysTotal) - 1 };
      }

      if (active && day >= active.endDay) {
        const { project, report } = active;
        active = null;

        for (const entry of report.skillBreakdown) {
          const current = skillMap[entry.skillName];
          if (!current) continue;
          skillMap[entry.skillName] = grantSkillXp(current, entry.xpGained).updatedSkill;
        }

        const moneyGained = Math.round(report.moneyGained);
        const repGained = Math.round(report.reputationGained);
        const quality = Math.round(report.overallQualityScore);
        cash = Math.round(cash + moneyGained);
        reputation = Math.round(reputation + repGained);
        earned += moneyGained;
        const repeat = isReturnClient(project);
        if (repeat) repeatSessions++;

        const known = knownClients.get(project.clientId);
        knownClients.set(project.clientId, {
          clientId: project.clientId,
          clientName: project.clientName ?? project.clientId,
          primaryGenre: project.genre,
          relationshipXp: (known?.relationshipXp ?? 0) + 10,
          tier: known?.tier ?? 'Newcomer',
          sessionsCompleted: (known?.sessionsCompleted ?? 0) + 1,
          lastSessionDay: day,
          bestQualityScore: Math.max(known?.bestQualityScore ?? 0, quality),
          referralCount: known?.referralCount ?? 0,
        } as ClientRelationship);

        // Reward side: chart debut, then a rewarded mini-game roll.
        const debut = debutChartRun(project.id, project.title, quality, day);
        if (debut) {
          chartRun.push(debut);
          rewards.chartDebuts++;
          rewards.chartPlacements++;
          if (debut.position <= 1) rewards.number1s++;
          rewardCash += settleReward(rewardForChartPlacement(debut.position), day);
        }
        if (rewardRng() < config.minigameRate) {
          rewards.minigames++;
          // Mini-game raw score tracks session quality on the 0-1000 scale with a seeded spread.
          const score = Math.max(0, Math.min(1000, quality * 10 + Math.round((rewardRng() - 0.5) * 200)));
          rewardCash += settleReward(rewardForMinigame(gradeForMinigameScore(score)), day);
        }

        settledIds.push(project.id);
        qualities.push(quality);
        perDay.push({
          day,
          projectId: project.id,
          title: project.title,
          genre: project.genre,
          difficulty: project.difficulty,
          payoutBase: Math.round(project.payoutBase),
          quality,
          moneyGained,
          repGained,
          cashAfter: cash,
          repAfter: reputation,
          payoutMultiple: Math.round((moneyGained / Math.max(1, project.payoutBase)) * 1000) / 1000,
          repeatClient: repeat,
          rewardCash: 0,
        });
      }

      // Ambient ticks from active play: capped per day by the real rules.
      if (config.play.ambientTicksPerDay > 0) {
        ambientState = {
          ...ambientState,
          currentDay: day,
          financials: { ...ambientState.financials, reports: new Array(settledIds.length).fill({}) },
        } as GameState;
        const before = ambientState.money;
        for (let t = 0; t < config.play.ambientTicksPerDay; t++) ambientState = applyAmbientTick(ambientState).state;
        const gained = ambientState.money - before;
        cash += gained;
        rewards.ambient += gained;
        rewards.maxAmbientDay = Math.max(rewards.maxAmbientDay, gained);
        ambientCapSeen = Math.max(ambientCapSeen, ambientDailyCap(ambientState));
      }

      // Weekly chart moves for songs already on the chart (mirrors Index.tsx).
      const nextRun: ChartRunEntry[] = [];
      for (const entry of chartRun) {
        let current = entry;
        let exited = false;
        for (let w = weeksDue(entry, day); w > 0 && !exited; w--) {
          const update = advanceChartWeek(current, day);
          rewards.chartPlacements++;
          if (update.entry.position <= 1) rewards.number1s++;
          rewardCash += settleReward(rewardForChartPlacement(update.entry.position), day);
          if (update.exited) exited = true;
          else current = update.entry;
        }
        if (!exited) nextRun.push(current);
      }
      chartRun = nextRun;
      if (perDay.length > 0 && perDay[perDay.length - 1].day === day) perDay[perDay.length - 1].rewardCash = Math.round(rewardCash);

      if (firstUpgradeDay === null && cash + rewards.rewardCash >= config.firstUpgradeCost) firstUpgradeDay = day;
      minCash = Math.min(minCash, cash);
      moneyHistory.push(cash);
      repHistory.push(reputation);
    }

    rewards.ambient = Math.round(rewards.ambient);
    rewards.ambientCap = ambientCapSeen;
    rewards.rewardCash = Math.round(rewards.rewardCash);
    rewards.maxCaseLoot = Math.round(rewards.maxCaseLoot);
    const completed = settledIds.length;
    const totalQuality = qualities.reduce((sum, q) => sum + q, 0);
    return {
      seed,
      strategy,
      days,
      era,
      cash,
      reputation,
      completed,
      totalQuality,
      avgQuality: completed > 0 ? Math.round((totalQuality / completed) * 100) / 100 : 0,
      earned,
      repeatSessions,
      firstUpgradeDay,
      minCash,
      bankrupt: minCash < 0,
      rewards,
      settledIds,
      qualities,
      moneyHistory,
      repHistory,
      perDay,
    };
  });
};

/** Run every strategy bot under the same seed. */
export const runAllStrategies = (
  seed: number,
  days: number,
  era: string = DEFAULT_ERA,
  overrides: Partial<BalanceConfig> = {},
): Record<Strategy, BalanceRun> =>
  Object.fromEntries(STRATEGIES.map((s) => [s, simulateStrategy(seed, s, days, era, overrides)])) as Record<
    Strategy,
    BalanceRun
  >;
