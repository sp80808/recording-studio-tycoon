import assert from 'node:assert';
import { generateBoxLoot, pickLootForEra } from '../src/features/boxDrops/lootGenerator';
import { CrateUnboxingModal } from '../src/features/boxDrops/CrateUnboxingModal';
import {
  FlightCaseReveal,
  RewardReveal,
  inferTierFromOutcome,
  RARITY_CONFIG,
} from '../src/components/motion/primitives/FlightCaseReveal';
import {
  createInitialRevealState,
  revealReducer,
  REVEAL_PHASES,
} from '../src/features/boxDrops/revealStateMachine';
import { detectUnapprovedWebGLContexts } from '../src/lib/motion/qualification';

console.log('Testing Crate Unboxing & Loot Generator...');
assert.strictEqual(typeof CrateUnboxingModal, 'function', 'CrateUnboxingModal component should be exported');
assert.strictEqual(typeof FlightCaseReveal, 'function', 'FlightCaseReveal primitive should be exported');
assert.strictEqual(typeof RewardReveal, 'function', 'RewardReveal primitive alias should be exported');

const loot1970 = generateBoxLoot('1970s', 1, 42);
assert.strictEqual(loot1970.length, 1);
assert(loot1970[0].name.length > 0);
assert(loot1970[0].condition >= 50 && loot1970[0].condition <= 100);
assert(['common', 'uncommon', 'rare', 'vintage', 'legendary'].includes(loot1970[0].rarity));

// Test multiple count
const lootBatch = generateBoxLoot('1980s', 3, 100);
assert.strictEqual(lootBatch.length, 3);
lootBatch.forEach(item => {
  assert(item.baseValue > 0);
  assert(item.era === '1980s');
});

// State machine verification on generated loot: outcome immutability across reveal phases
const targetItem = loot1970[0];
let state = createInitialRevealState(targetItem);
assert.strictEqual(state.phase, 'closed');
assert.strictEqual(state.outcome, targetItem);

// closed -> latch -> open -> silhouette -> reveal -> details -> collect
state = revealReducer(state, { type: 'START_UNLATCH' });
assert.strictEqual(state.phase, 'latch');
assert.strictEqual(state.outcome, targetItem);

state = revealReducer(state, { type: 'STEP_FORWARD' });
assert.strictEqual(state.phase, 'open');
assert.strictEqual(state.outcome, targetItem);

state = revealReducer(state, { type: 'STEP_FORWARD' });
assert.strictEqual(state.phase, 'silhouette');
assert.strictEqual(state.outcome, targetItem);

state = revealReducer(state, { type: 'STEP_FORWARD' });
assert.strictEqual(state.phase, 'reveal');
assert.strictEqual(state.outcome, targetItem);

state = revealReducer(state, { type: 'STEP_FORWARD' });
assert.strictEqual(state.phase, 'details');
assert.strictEqual(state.outcome, targetItem);

state = revealReducer(state, { type: 'CHOOSE_ACTION', action: 'stash' });
assert.strictEqual(state.phase, 'collect');
assert.strictEqual(state.selectedAction, 'stash');
assert.strictEqual(state.outcome, targetItem);

// Skip instantly reaches details with intact outcome
const freshState = createInitialRevealState(targetItem);
const skippedState = revealReducer(freshState, { type: 'SKIP' });
assert.strictEqual(skippedState.phase, 'details');
assert.strictEqual(skippedState.isSkipped, true);
assert.strictEqual(skippedState.outcome, targetItem);

// Reduced motion fast path
const rmState = createInitialRevealState(targetItem, { reducedMotion: true });
const rmUnlatched = revealReducer(rmState, { type: 'START_UNLATCH' });
assert.strictEqual(rmUnlatched.phase, 'details');
assert.strictEqual(rmUnlatched.outcome, targetItem);

// Zero unapproved WebGL contexts
const cleanCheck = detectUnapprovedWebGLContexts({
  querySelectorAll: () => [],
} as any);
assert.strictEqual(cleanCheck.passed, true);
assert.strictEqual(cleanCheck.unapprovedCount, 0);

console.log('crate-unboxing: all checks passed');
