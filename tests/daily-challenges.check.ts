// Automated checks for the deterministic daily challenge system (bead itt).
// Bundled with esbuild and run under node via `pnpm test` (see scripts/run-checks.sh).
// Throws on the first failure; prints PASS lines otherwise.
import {
  getDailyChallenge,
  checkDailyChallenge,
  withDailyTracking,
  freshDailyTracking,
} from '../src/utils/dailyChallenges';
import type { GameState } from '../src/types/game';

let passed = 0;
const ok = (cond: boolean, msg: string): void => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

const minimalState = (day: number, tracking?: GameState['dailyTracking']): GameState =>
  ({
    currentDay: day,
    currentEra: 'analog60s',
    money: 1000,
    reputation: 10,
    hiredStaff: [],
    activeProject: null,
    notifications: [],
    playerData: { xp: 0 },
    dailyTracking: tracking,
  } as unknown as GameState);

// 1. Deterministic pick: same day, same challenge; day 8 -> first-takes.
ok(getDailyChallenge(8).id === 'first-takes', 'day 8 selects first-takes');
ok(getDailyChallenge(8).id === getDailyChallenge(8).id, 'same day is stable');
ok(getDailyChallenge(9).id === 'box-office', 'day 9 selects box-office');
ok(getDailyChallenge(16).id === 'first-takes', 'pool cycles every 8 days');

// 2. Fresh tracking starts at zero and is not done.
const fresh = freshDailyTracking(8);
const s0 = minimalState(8, fresh);
const st0 = checkDailyChallenge(s0);
ok(st0.progress === 0 && !st0.done, 'fresh challenge starts 0/not-done');

// 3. Sessions accumulate; completion grants exactly once.
const s1 = withDailyTracking(s0, { sessions: 2 });
ok((s1.dailyTracking?.sessionsWorkedToday ?? -1) === 2, 'sessions accumulate');
ok(!checkDailyChallenge(s1).done, '2/3 sessions is not done');
const moneyBefore = s1.money;
const reward = getDailyChallenge(8).reward;
const s2 = withDailyTracking(s1, { sessions: 1 });
ok(checkDailyChallenge(s2).done, '3/3 sessions completes');
ok(s2.dailyTracking?.challengeDoneId === 'first-takes', 'completion flag set');
ok(s2.money === moneyBefore + reward.money, 'money reward applied once');
ok(
  s2.notifications.some((n) => n.id === 'daily-challenge-8-first-takes'),
  'completion notification queued',
);
const s3 = withDailyTracking(s2, { sessions: 1 });
ok(s3.money === s2.money, 'no double grant on further sessions');

// 4. Day rollover resets counters and re-arms.
const carried = minimalState(9, s2.dailyTracking);
const s4 = withDailyTracking(carried, { sessions: 1 });
ok((s4.dailyTracking?.sessionsWorkedToday ?? -1) === 1, 'rollover resets counters');
ok(s4.dailyTracking?.challengeDoneId === null, 'rollover clears completion flag');
ok(getDailyChallenge(9).id === 'box-office', 'new day brings a new challenge');

console.log(`\nAll ${passed} daily-challenge checks passed.`);
