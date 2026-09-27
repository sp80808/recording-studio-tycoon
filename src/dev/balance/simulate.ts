/**
 * GH #19 skeleton day-loop simulation.
 *
 * Pure headless loop over MINIMAL plain-object stand-ins — no React hooks,
 * no components, no GameState-dependent UI code. Drives the real pure
 * economy functions: generateNewProjects + generateProjectReview, with
 * player skill XP applied via grantSkillXp and market trend via
 * getGenreMarketMultiplier.
 *
 * Determinism rules: the whole run executes inside one withSeededRandom
 * block (fixed call order => identical Math.random stream), project IDs are
 * rewritten to seed/day/index BEFORE review (generateProjectReview seeds its
 * internal RNG from project.id), money is rounded to integers, and no
 * Date.now / wall-clock values appear in outputs.
 */
import { generateNewProjects } from '@/utils/projectUtils';
import { generateProjectReview } from '@/utils/projectReviewUtils';
import { grantSkillXp, initializeSkillsPlayer } from '@/utils/skillUtils';
import { getGenreMarketMultiplier } from '@/utils/eraProgression';
import type { PlayerData, Project, Skill } from '@/types/game';
import { withSeededRandom } from './rng';

export type Strategy = 'cheapest' | 'highest-fee' | 'balanced';
export const STRATEGIES: Strategy[] = ['cheapest', 'highest-fee', 'balanced'];

export const PROJECTS_PER_DAY = 3;
export const EQUIPMENT_QUALITY = 50;
export const STARTING_CASH = 500;
export const DAILY_COST = 25;
export const DEFAULT_ERA = 'analog60s';

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
  settledIds: string[];
  qualities: number[];
  moneyHistory: number[];
  repHistory: number[];
  perDay: DayRecord[];
}

const pickProject = (projects: Project[], strategy: Strategy): Project => {
  let best = projects[0];
  if (strategy === 'cheapest') {
    for (const p of projects) {
      if (p.difficulty < best.difficulty || (p.difficulty === best.difficulty && p.payoutBase < best.payoutBase)) best = p;
    }
    return best;
  }
  if (strategy === 'highest-fee') {
    for (const p of projects) {
      if (p.payoutBase > best.payoutBase) best = p;
    }
    return best;
  }
  // balanced: best payout-per-difficulty ratio (strict > keeps first on ties)
  let bestRatio = best.payoutBase / Math.max(1, best.difficulty);
  for (const p of projects) {
    const ratio = p.payoutBase / Math.max(1, p.difficulty);
    if (ratio > bestRatio) {
      best = p;
      bestRatio = ratio;
    }
  }
  return best;
};

/** Simulate `days` days under one strategy. Same seed + strategy => identical result. */
export const simulateStrategy = (
  seed: number,
  strategy: Strategy,
  days: number,
  era: string = DEFAULT_ERA,
): BalanceRun => {
  return withSeededRandom(seed, () => {
    const skills = initializeSkillsPlayer();
    const skillMap = skills as unknown as Record<string, Skill>;
    const player = { skills } as PlayerData;

    let cash = STARTING_CASH;
    let reputation = 0;
    const settledIds: string[] = [];
    const qualities: number[] = [];
    const moneyHistory: number[] = [];
    const repHistory: number[] = [];
    const perDay: DayRecord[] = [];

    for (let day = 1; day <= days; day++) {
      cash = Math.round(cash - DAILY_COST);

      const candidates = generateNewProjects(PROJECTS_PER_DAY, 1, era);
      // Rewrite IDs deterministically BEFORE review: the review's internal
      // seeded RNG derives from project.id, so Date.now-based IDs would
      // break determinism even under a seeded Math.random.
      candidates.forEach((p, i) => {
        p.id = `seed${seed}-d${day}-c${i}`;
        p.clientId = `seed${seed}-d${day}-client${i}`;
        p.associatedBandId = p.clientId;
      });

      const project = pickProject(candidates, strategy);
      const report = generateProjectReview(
        project,
        { type: 'player', id: 'player', name: 'Player' },
        EQUIPMENT_QUALITY,
        player,
        [],
        { marketMultiplier: getGenreMarketMultiplier(project.genre, era) },
      );

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

      settledIds.push(project.id);
      qualities.push(quality);
      moneyHistory.push(cash);
      repHistory.push(reputation);
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
      });
    }

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
      settledIds,
      qualities,
      moneyHistory,
      repHistory,
      perDay,
    };
  });
};

/** Run all three strategy bots under the same seed. */
export const runAllStrategies = (
  seed: number,
  days: number,
  era: string = DEFAULT_ERA,
): Record<Strategy, BalanceRun> => ({
  cheapest: simulateStrategy(seed, 'cheapest', days, era),
  'highest-fee': simulateStrategy(seed, 'highest-fee', days, era),
  balanced: simulateStrategy(seed, 'balanced', days, era),
});
