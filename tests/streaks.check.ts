/** Streak verification: carry, miss reset, shield, ladder bonuses, atomicity. */
import {
  freshDailyTracking,
  withDailyTracking,
  getDailyChallenge,
} from '../src/utils/dailyChallenges';
import { rolloverStreak, completeStreak } from '../src/narrative/streaks';
import type { GameState } from '../src/types/game';

let passed = 0;
const ok = (cond: boolean, msg: string): void => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

const baseState = (day: number, tracking?: GameState['dailyTracking']): GameState =>
  ({
    currentDay: day,
    money: 1000,
    reputation: 10,
    playerData: { xp: 0 },
    hiredStaff: [],
    activeProject: null,
    currentEra: 'analog60s',
    notifications: [],
    dailyTracking: tracking ?? freshDailyTracking(day),
  }) as unknown as GameState;

/** Complete today's challenge deterministically regardless of which def is up. */
const completeToday = (s: GameState): GameState => {
  const def = getDailyChallenge(s.currentDay);
  if (def.id === 'first-takes') return withDailyTracking(s, { sessions: 3 });
  if (def.id === 'box-office') return withDailyTracking(s, { earned: 400 });
  if (def.id === 'crowd-pleaser') return withDailyTracking(s, { projects: 1 });
  if (def.id === 'show-off') return withDailyTracking(s, { minigames: 2 });
  if (def.id === 'on-fire') return withDailyTracking(s, { combo: 3 });
  if (def.id === 'good-boss') return withDailyTracking(s, {});
  if (def.id === 'genre-night') {
    return withDailyTracking(
      { ...s, activeProject: { genre: 'Rock' } } as GameState,
      {}
    );
  }
  return withDailyTracking({ ...s, hiredStaff: [{ status: 'Working' }, { status: 'Working' }] } as unknown as GameState, {});
};

// Pure helpers
ok(rolloverStreak(undefined, 5).streakCount === 0, 'no prev -> zero streak');
const carried = rolloverStreak(
  { day: 5, challengeDoneId: 'x', streakCount: 2, lastStreakDay: 5, streakShield: 0 },
  6
);
ok(carried.streakCount === 2, 'completed day carries streak');
const missed = rolloverStreak(
  { day: 5, challengeDoneId: null, streakCount: 2, lastStreakDay: 4, streakShield: 0 },
  6
);
ok(missed.streakCount === 0, 'missed day resets streak');
const shielded = rolloverStreak(
  { day: 5, challengeDoneId: null, streakCount: 2, lastStreakDay: 4, streakShield: 1 },
  6
);
ok(shielded.streakCount === 2 && shielded.streakShield === 0, 'shield consumed instead of reset');
const c3 = completeStreak({ streakCount: 2, lastStreakDay: 5, streakShield: 0 }, 6);
ok(c3.streakCount === 3 && c3.bonus === 500, '3d streak pays $500');
const c7 = completeStreak({ streakCount: 6, lastStreakDay: 6, streakShield: 0 }, 7);
ok(c7.bonus === 1000 && c7.bankedShield === true, '7d banks shield + $1000');

// Full loop: 3 consecutive completions -> streak 3 + bonus exactly once
let s = baseState(10);
s = completeToday(s);
ok(s.dailyTracking?.streakCount === 1, 'day 10 streak = 1');
s = { ...s, currentDay: 11, dailyTracking: freshDailyTracking(11, s.dailyTracking) };
ok(s.dailyTracking?.streakCount === 1, 'rollover keeps streak');
s = completeToday(s);
ok(s.dailyTracking?.streakCount === 2, 'day 11 streak = 2');
const moneyBefore = s.money;
s = { ...s, currentDay: 12, dailyTracking: freshDailyTracking(12, s.dailyTracking) };
s = completeToday(s);
ok(s.dailyTracking?.streakCount === 3, 'day 12 streak = 3');
ok(s.money >= moneyBefore + 500, '3d ladder bonus paid');
// Double-fire guard: second tick same day changes nothing
const again = withDailyTracking(s, { sessions: 5 });
ok(again.dailyTracking?.streakCount === 3 && again.money === s.money, 'no double grant same day');
// Miss a day -> reset
const missedDay = { ...s, currentDay: 13, dailyTracking: freshDailyTracking(13, s.dailyTracking) };
const skipped = { ...missedDay, currentDay: 14, dailyTracking: freshDailyTracking(14, missedDay.dailyTracking) };
ok(skipped.dailyTracking?.streakCount === 0, 'skipped day resets streak, no negative state');

console.log(`streaks: all ${passed} checks passed`);
