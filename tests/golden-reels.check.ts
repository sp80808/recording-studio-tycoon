/** Golden Reels nomination: live-pool membership, gating, annual cooldown, effects. */
import { RandomEventService } from '../src/game-mechanics/random-events';
import { GOLDEN_REELS_NOMINATION, SAMPLE_RANDOM_EVENTS } from '../src/game-mechanics/sample-data';
import { applyEventToState } from '../src/game-mechanics/eventIntegration';
import type { GameState } from '../src/types/game';

let passed = 0;
const ok = (cond: boolean, msg: string): void => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

const state = (over: Partial<GameState> = {}): GameState =>
  ({
    currentDay: 200,
    reputation: 75,
    money: 5000,
    financials: {
      income: 0,
      expenses: 0,
      profit: 0,
      reports: new Array(9).fill({}),
    },
    hiredStaff: [{ mood: 60 }],
    ownedEquipment: [],
    notifications: [],
    ...over,
  }) as unknown as GameState;

// Pool membership: no choices -> survives the live auto-resolvable filter
ok(
  SAMPLE_RANDOM_EVENTS.some((e) => e.id === 'golden_reels_nomination'),
  'nomination is in the live pool'
);
ok(!GOLDEN_REELS_NOMINATION.playerChoices, 'nomination is auto-resolvable (no choices)');
ok(GOLDEN_REELS_NOMINATION.type === 'AwardCeremony', 'annual AwardCeremony cadence');

// Deterministic trigger when eligible (chance forced to 1 for the test copy)
const eligible = new RandomEventService([{ ...GOLDEN_REELS_NOMINATION, triggerChance: 1 }]);
const fired = eligible.evaluateEvents(state(), 200);
ok(fired.length === 1 && fired[0].id === 'golden_reels_nomination', 'fires when rep/projects/day gates pass');

// Each gate blocks independently
const lowRep = new RandomEventService([{ ...GOLDEN_REELS_NOMINATION, triggerChance: 1 }]);
ok(lowRep.evaluateEvents(state({ reputation: 40 }), 200).length === 0, 'rep <= 60 blocks');
const fewProj = new RandomEventService([{ ...GOLDEN_REELS_NOMINATION, triggerChance: 1 }]);
ok(
  fewProj.evaluateEvents(state({ financials: { income: 0, expenses: 0, profit: 0, reports: [] } as unknown as GameState['financials'] }), 200).length === 0,
  'under 9 reports blocks'
);
const early = new RandomEventService([{ ...GOLDEN_REELS_NOMINATION, triggerChance: 1 }]);
ok(early.evaluateEvents(state({ currentDay: 100 }), 100).length === 0, 'day <= 180 blocks');

// Annual cooldown: no refire within 365 days, refires after
ok(eligible.evaluateEvents(state(), 300).length === 0, 'no refire within 365 days');
ok(eligible.evaluateEvents(state(), 566).length === 1, 'refires after 365 days (next season)');

// Effects fold into state through the live path (rep clamp + crew mood)
const outcome = applyEventToState(state({ reputation: 98 }), GOLDEN_REELS_NOMINATION);
ok(outcome.state.reputation === 100, 'rep gain clamps at 100 (98 + 5)');
ok(outcome.state.hiredStaff[0].mood === 70, 'crew mood +10');
ok(outcome.applied.length === 2, 'both effects applied (none narrative-only)');

console.log(`golden-reels: all ${passed} checks passed`);
