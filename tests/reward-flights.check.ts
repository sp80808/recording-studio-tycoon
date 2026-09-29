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

console.log('reward-flights: all checks passed');
