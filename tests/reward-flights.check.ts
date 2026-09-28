import assert from 'node:assert/strict';
import { rewardGains } from '../src/utils/rewardFeedback';
import { xpForPlayerLevel } from '../src/utils/playerUtils';

const start = { money: 100, xp: 90, level: 1, day: 1 };
assert.deepEqual(rewardGains(start, start), { money: 0, xp: 0 });
assert.deepEqual(rewardGains(start, { ...start, money: 150, xp: 95 }), { money: 50, xp: 5 });
assert.deepEqual(rewardGains(start, { ...start, money: 60, level: 2, xp: 10 }), { money: 0, xp: 20 });
assert.equal(rewardGains(start, { ...start, level: 3, xp: 5 }).xp, 15 + xpForPlayerLevel(2));
assert.deepEqual(rewardGains(start, { ...start, day: 0, money: 1000 }), { money: 0, xp: 0 });
assert.deepEqual(rewardGains(start, { ...start, money: NaN }), { money: 0, xp: 0 });
assert.deepEqual(rewardGains(start, { ...start, xp: 10 }), { money: 0, xp: 0 });
console.log('PASS reward flights: actual gains, spending, level rollover, reset and invalid state');
