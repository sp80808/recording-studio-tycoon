/** Flight cases enter gameplay at producer level 3 (bead fec). */
import assert from 'node:assert/strict';
import {
  isFlightCaseSystemUnlocked,
  rewardForProducerLevel,
} from '../src/economy/flightCaseEconomy';
import { FLIGHT_CASE_UNLOCK_LEVEL } from '../src/data/flightCases';
import { resolvePlayerLevelUps, xpForPlayerLevel } from '../src/utils/playerUtils';
import type { GameState } from '../src/types/game';

console.log('Testing flight-case level integration...');

assert.equal(FLIGHT_CASE_UNLOCK_LEVEL, 3);

const lvl = (level: number) => ({ playerData: { level } }) as unknown as GameState;
assert.equal(isFlightCaseSystemUnlocked(lvl(1)), false);
assert.equal(isFlightCaseSystemUnlocked(lvl(2)), false);
assert.equal(isFlightCaseSystemUnlocked(lvl(3)), true);
assert.equal(isFlightCaseSystemUnlocked(lvl(12)), true);

// Milestone rewards escalate; other levels grant nothing.
assert.equal(rewardForProducerLevel(3)?.cases?.[0].tier, 'road_case');
assert.equal(rewardForProducerLevel(3)?.cases?.[0].source, 'level_reward');
assert.equal(rewardForProducerLevel(5)?.cases?.[0].tier, 'tour_trunk');
assert.equal(rewardForProducerLevel(8)?.cases?.[0].tier, 'vintage_flight_case');
assert.equal(rewardForProducerLevel(12)?.cases?.[0].tier, 'holy_grail_vault');
assert.equal(rewardForProducerLevel(2), null);
assert.equal(rewardForProducerLevel(4), null);
assert.equal(rewardForProducerLevel(6), null);

const stateFor = (level: number, extraXp = 0): GameState =>
  ({
    currentDay: 10,
    money: 1000,
    gems: 0,
    saveSeed: 'check-seed',
    selectedEra: '1970s',
    ledger: { entries: [], nextSeq: 1, startDay: 1 },
    notifications: [],
    pendingCrates: [],
    playerData: {
      level,
      xp: xpForPlayerLevel(level) + extraXp,
      xpToNextLevel: xpForPlayerLevel(level),
      perkPoints: 0,
      dailyWorkCapacity: 3,
    },
  }) as unknown as GameState;

// Crossing level 3 grants the first road case exactly once.
const crossed = resolvePlayerLevelUps(stateFor(2));
assert.equal(crossed.playerData.level, 3);
assert.equal(crossed.pendingCrates?.length, 1);
assert.equal(crossed.pendingCrates?.[0].tier, 'road_case');
assert.equal(crossed.pendingCrates?.[0].source, 'level_reward');
assert.deepEqual(crossed.flightCaseLevelsClaimed, [3]);
assert.ok(
  crossed.notifications.some((n) => n.id === 'producer-level-3' && n.message.includes('Flight Case Depot')),
  'unlock notification names the Depot',
);

// Re-running on the settled state grants nothing more.
const again = resolvePlayerLevelUps(crossed);
assert.equal(again.pendingCrates?.length, 1);
assert.deepEqual(again.flightCaseLevelsClaimed, [3]);

// Multi-level jump claims every crossed milestone.
const jumper = resolvePlayerLevelUps(stateFor(2, xpForPlayerLevel(3) + xpForPlayerLevel(4)));
assert.equal(jumper.playerData.level, 5);
assert.deepEqual(jumper.flightCaseLevelsClaimed, [3, 5]);
assert.ok(jumper.pendingCrates?.some((c) => c.tier === 'road_case'));
assert.ok(jumper.pendingCrates?.some((c) => c.tier === 'tour_trunk'));

// Non-milestone crossing grants no case but still levels up.
const plain = resolvePlayerLevelUps(stateFor(3));
assert.equal(plain.playerData.level, 4);
assert.equal(plain.pendingCrates?.length, 0);
assert.equal(plain.flightCaseLevelsClaimed, undefined);

console.log('flight-case-levels.check.ts: ok');
