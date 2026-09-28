import { GameState } from '@/types/game';
import { ERA_DEFINITIONS } from '@/utils/eraProgression';
import { rolloverStreak, completeStreak } from '@/narrative/streaks';

/**
 * Deterministic daily challenges (bead ifx.3).
 *
 * One challenge per day, picked by day number — same for every player, no
 * save bloat, no streak punishments. Progress comes from DailyTracking
 * counters (bumped at settlement points) plus live state (staff, project).
 * Completion is granted atomically inside the state updater that bumps the
 * counter, so rewards can never double-fire.
 */

export interface DailyChallengeReward {
  money: number;
  reputation: number;
  xp: number;
}

export interface DailyChallengeDef {
  id: string;
  title: string;
  description: string;
  target: number;
  reward: DailyChallengeReward;
  progress: (state: GameState) => number;
}

export interface DailyChallengePatch {
  earned?: number;
  minigames?: number;
  projects?: number;
  sessions?: number;
  /** Max-combo observation (takes the max, not the sum). */
  combo?: number;
}

const CHALLENGES: DailyChallengeDef[] = [
  {
    id: 'first-takes',
    title: '🎙 First Takes',
    description: 'Work 3 sessions today.',
    target: 3,
    reward: { money: 200, reputation: 2, xp: 30 },
    progress: (s) => s.dailyTracking?.sessionsWorkedToday ?? 0,
  },
  {
    id: 'box-office',
    title: '💵 Box Office',
    description: 'Earn $400 from settlements today.',
    target: 400,
    reward: { money: 250, reputation: 3, xp: 40 },
    progress: (s) => s.dailyTracking?.earnedToday ?? 0,
  },
  {
    id: 'crowd-pleaser',
    title: '👏 Crowd Pleaser',
    description: 'Complete 1 project today.',
    target: 1,
    reward: { money: 300, reputation: 4, xp: 50 },
    progress: (s) => s.dailyTracking?.projectsCompletedToday ?? 0,
  },
  {
    id: 'show-off',
    title: '🎮 Show-off',
    description: 'Play 2 production minigames today.',
    target: 2,
    reward: { money: 150, reputation: 2, xp: 40 },
    progress: (s) => s.dailyTracking?.minigamesPlayedToday ?? 0,
  },
  {
    id: 'on-fire',
    title: '🔥 On Fire',
    description: 'Reach a x3 work combo.',
    target: 3,
    reward: { money: 200, reputation: 3, xp: 50 },
    progress: (s) => s.dailyTracking?.maxComboToday ?? 0,
  },
  {
    id: 'good-boss',
    title: '💚 Good Boss',
    description: 'Keep every staff member at 50+ energy.',
    target: 1,
    reward: { money: 150, reputation: 3, xp: 30 },
    progress: (s) => {
      if (s.hiredStaff.length === 0) return 1;
      const minEnergy = Math.min(...s.hiredStaff.map((m) => m.energy));
      return minEnergy >= 50 ? 1 : 0;
    },
  },
  {
    id: 'genre-night',
    title: '🎶 Genre Night',
    description: 'Have an era-hot genre on the console.',
    target: 1,
    reward: { money: 200, reputation: 3, xp: 40 },
    progress: (s) => {
      const project = s.activeProject;
      if (!project) return 0;
      const era = ERA_DEFINITIONS.find((e) => e.id === s.currentEra);
      return era && era.availableGenres.includes(project.genre) ? 1 : 0;
    },
  },
  {
    id: 'full-house',
    title: '🏠 Full House',
    description: 'Have 2 staff working at once.',
    target: 2,
    reward: { money: 250, reputation: 3, xp: 40 },
    progress: (s) => s.hiredStaff.filter((m) => m.status === 'Working').length,
  },
];

export function getDailyChallenge(day: number): DailyChallengeDef {
  return CHALLENGES[((day % CHALLENGES.length) + CHALLENGES.length) % CHALLENGES.length];
}

export interface DailyChallengeStatus {
  def: DailyChallengeDef;
  progress: number;
  done: boolean;
}

export function checkDailyChallenge(state: GameState): DailyChallengeStatus {
  const def = getDailyChallenge(state.currentDay);
  const progress = Math.min(def.target, Math.floor(def.progress(state)));
  const done = state.dailyTracking?.day === state.currentDay &&
    (state.dailyTracking?.challengeDoneId === def.id || progress >= def.target);
  return { def, progress, done };
}

const ZERO_TRACKING = {
  earnedToday: 0,
  minigamesPlayedToday: 0,
  maxComboToday: 0,
  projectsCompletedToday: 0,
  sessionsWorkedToday: 0,
  challengeDoneId: null as string | null,
  streakCount: 0,
  lastStreakDay: null as number | null,
  streakShield: 0,
};

export function freshDailyTracking(
  day: number,
  prev?: GameState['dailyTracking']
): GameState['dailyTracking'] {
  return { day, ...ZERO_TRACKING, ...rolloverStreak(prev, day) };
}

/**
 * Merge a tracking patch (with day rollover), then atomically grant today's
 * challenge reward if newly completed. Pure — safe inside setState updaters.
 */
export function withDailyTracking(state: GameState, patch: DailyChallengePatch): GameState {
  const base = state.dailyTracking?.day === state.currentDay
    ? state.dailyTracking
    : { ...ZERO_TRACKING, day: state.currentDay, ...rolloverStreak(state.dailyTracking, state.currentDay) };

  const tracking = {
    ...base,
    earnedToday: base.earnedToday + (patch.earned ?? 0),
    minigamesPlayedToday: base.minigamesPlayedToday + (patch.minigames ?? 0),
    maxComboToday: Math.max(base.maxComboToday, patch.combo ?? 0),
    projectsCompletedToday: base.projectsCompletedToday + (patch.projects ?? 0),
    sessionsWorkedToday: base.sessionsWorkedToday + (patch.sessions ?? 0),
  };

  const withTracking: GameState = { ...state, dailyTracking: tracking };
  if (tracking.challengeDoneId) return withTracking;

  const { def, done } = checkDailyChallenge(withTracking);
  if (!done) return withTracking;

  // Streak extends exactly once per completed day (challengeDoneId guards re-entry).
  const streak = completeStreak(
    {
      streakCount: tracking.streakCount ?? 0,
      lastStreakDay: tracking.lastStreakDay ?? null,
      streakShield: tracking.streakShield ?? 0,
    },
    withTracking.currentDay
  );

  const bonusParts: string[] = [];
  if (streak.bonus > 0) bonusParts.push(`+$${streak.bonus} streak bonus (${streak.streakCount}d)`);
  if (streak.bankedShield) bonusParts.push('+1 streak shield');

  return {
    ...withTracking,
    money: withTracking.money + def.reward.money + streak.bonus,
    reputation: withTracking.reputation + def.reward.reputation,
    playerData: {
      ...withTracking.playerData,
      xp: withTracking.playerData.xp + def.reward.xp,
    },
    dailyTracking: {
      ...tracking,
      challengeDoneId: def.id,
      streakCount: streak.streakCount,
      lastStreakDay: streak.lastStreakDay,
      streakShield: streak.streakShield,
    },
    notifications: [
      ...withTracking.notifications,
      {
        id: `daily-challenge-${withTracking.currentDay}-${def.id}`,
        message: `${def.title} complete! +$${def.reward.money}, +${def.reward.reputation} rep, +${def.reward.xp} XP.${bonusParts.length > 0 ? ` ${bonusParts.join(', ')}.` : ''}`,
        type: 'success' as const,
        timestamp: Date.now(),
        duration: 6000,
      },
    ],
  };
}
