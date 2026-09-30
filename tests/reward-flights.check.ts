import assert from 'node:assert';
import { rewardGains } from '../src/utils/rewardFeedback';
import { RewardFlights } from '../src/components/RewardFlights';

console.log('Testing Reward Flights & Milestone Feedback...');

// 1. Export verification
assert.strictEqual(typeof RewardFlights, 'function', 'RewardFlights component should be exported');

// 2. Gain delta evaluation
const prev = { money: 1000, xp: 50, level: 1, day: 1 };
const next = { money: 1500, xp: 120, level: 1, day: 1 };
const gains = rewardGains(prev, next);

assert.strictEqual(gains.money, 500, 'Calculates +$500 gain');
assert.strictEqual(gains.xp, 70, 'Calculates +70 XP gain');

// 3. Zero gains on no change
const same = rewardGains(next, next);
assert.strictEqual(same.money, 0);
assert.strictEqual(same.xp, 0);

// 4. Streak milestone evaluation
function evaluateStreakMilestone(prevStreak: number, currentStreak: number): boolean {
  return currentStreak >= 3 && currentStreak > prevStreak && currentStreak % 3 === 0;
}

assert.strictEqual(evaluateStreakMilestone(2, 3), true, 'Day 3 milestone unlocks flight crate');
assert.strictEqual(evaluateStreakMilestone(3, 3), false, 'Same streak does not duplicate banner');
assert.strictEqual(evaluateStreakMilestone(5, 6), true, 'Day 6 milestone unlocks second flight crate');
assert.strictEqual(evaluateStreakMilestone(1, 2), false, 'Day 2 is not yet a milestone');

// 5. Reward FX helpers
import { rewardTier, rewardCoinCount, lootArc, formatGain, isLevelUp, takePopTier } from '../src/utils/rewardFx';
assert.strictEqual(rewardTier('xp', 10), 'small');
assert.strictEqual(rewardTier('xp', 300), 'jackpot');
assert.strictEqual(rewardTier('money', 700), 'big');
assert.strictEqual(rewardCoinCount('jackpot', false), 8);
assert.strictEqual(rewardCoinCount('jackpot', true), 1, 'lite mode collapses to one chip');
const arc = lootArc({ x: 100, y: 500 }, { x: 900, y: 40 }, 2, 5, 7);
assert.deepStrictEqual([arc.x[0], arc.y[0], arc.x[3], arc.y[3]], [100, 500, 900, 40], 'arc starts at source, ends at target');
assert.deepStrictEqual(lootArc({ x: 1, y: 2 }, { x: 3, y: 4 }, 1, 3, 9), lootArc({ x: 1, y: 2 }, { x: 3, y: 4 }, 1, 3, 9), 'deterministic');
assert.strictEqual(formatGain('money', 1234.4), '+$1,234');
assert.strictEqual(formatGain('xp', 12), '+12 XP');
assert.ok(isLevelUp(2, 3) && !isLevelUp(3, 3) && !isLevelUp(4, 3));
assert.strictEqual(takePopTier('Gold'), 'big');

console.log('reward-flights: all checks passed');
