import assert from 'node:assert';
import {
  createInitialChoreState,
  executeStudioChore,
  refreshDailyChores,
  hasActiveChoreBuff,
  getActiveBuffMagnitude,
  consumeChoreBuffSession,
  StudioChoreId
} from '../src/simulation/choreEngine';

console.log('Testing Chore Engine Core Service...');

// 1. Initial State
const state = createInitialChoreState();
assert.strictEqual(Object.keys(state.chores).length, 5, 'Should have 5 authored studio chores');
assert.strictEqual(state.chores.clean_tape_heads.completed, false);
assert.strictEqual(state.streakDays, 0);
assert.strictEqual(state.activeBuffs.length, 0);
console.log('PASS: Initial chore state verified');

// 2. Execute Chore with sufficient energy
const execResult = executeStudioChore(state, 'clean_tape_heads', 3);
assert(execResult !== null, 'Chore execution should succeed');
assert.strictEqual(execResult.nextChoreState.chores.clean_tape_heads.completed, true);
assert.strictEqual(execResult.energyBurned, 1);
assert.strictEqual(execResult.xpAwarded, 35);
assert.strictEqual(hasActiveChoreBuff(execResult.nextChoreState, 'timing_bonus'), true);
assert.strictEqual(getActiveBuffMagnitude(execResult.nextChoreState, 'timing_bonus'), 0.10);
console.log('PASS: Execute chore grants buff and marks completed');

// 3. Prevent duplicate execution
const duplicateResult = executeStudioChore(execResult.nextChoreState, 'clean_tape_heads', 3);
assert.strictEqual(duplicateResult, null, 'Cannot execute already completed chore');
console.log('PASS: Prevents duplicate execution');

// 4. Daily Refresh and Streak Tracking
let dailyState = execResult.nextChoreState;
// Complete 2 more chores to hit >= 3 threshold
const chore2 = executeStudioChore(dailyState, 'calibrate_outboard', 3)!;
const chore3 = executeStudioChore(chore2.nextChoreState, 'organize_patchbay', 3)!;
dailyState = chore3.nextChoreState;
assert.strictEqual(dailyState.dailyCompletedCount, 3);

// Advance Day 1 -> streak should become 1
const day1 = refreshDailyChores(dailyState, 2);
assert.strictEqual(day1.nextChoreState.streakDays, 1);
assert.strictEqual(day1.nextChoreState.chores.clean_tape_heads.completed, false);
assert.strictEqual(day1.crateAwarded, false);
console.log('PASS: Day refresh increments streak when threshold met');

// Advance Day 2 and 3 with threshold to trigger 3-day streak crate award
let streakState = day1.nextChoreState;
streakState = executeStudioChore(streakState, 'clean_tape_heads', 3)!.nextChoreState;
streakState = executeStudioChore(streakState, 'calibrate_outboard', 3)!.nextChoreState;
streakState = executeStudioChore(streakState, 'tune_acoustics', 3)!.nextChoreState;
const day2 = refreshDailyChores(streakState, 3);
assert.strictEqual(day2.nextChoreState.streakDays, 2);

streakState = day2.nextChoreState;
streakState = executeStudioChore(streakState, 'clean_tape_heads', 3)!.nextChoreState;
streakState = executeStudioChore(streakState, 'calibrate_outboard', 3)!.nextChoreState;
streakState = executeStudioChore(streakState, 'brew_espresso', 3)!.nextChoreState;
const day3 = refreshDailyChores(streakState, 4);
assert.strictEqual(day3.nextChoreState.streakDays, 3);
assert.strictEqual(day3.crateAwarded, true, '3-day streak should award a vintage flight case crate');
console.log('PASS: 3-day chore streak awards crate');

// 5. Buff session consumption
const buffState = consumeChoreBuffSession(day3.nextChoreState);
assert.strictEqual(buffState.activeBuffs.length, 0, '1-session buffs should expire after a session');
console.log('PASS: Buff consumption verified');

// 6. Assignable Chores to Staff & Ability-based Automation
import {
  assignChoreToStaff,
  processAutomaticChores,
  autoAssignAvailableChores
} from '../src/simulation/choreEngine';

const mockStaff: any[] = [
  {
    id: 'staff-eng-1',
    name: 'Alex Engineer',
    role: 'Engineer',
    primaryStats: { creativity: 40, technical: 85, speed: 80 },
    energy: 90,
    mood: 80,
    xpInRole: 100,
    levelInRole: 3
  },
  {
    id: 'staff-prod-1',
    name: 'Sam Producer',
    role: 'Producer',
    primaryStats: { creativity: 90, technical: 50, speed: 75 },
    energy: 85,
    mood: 85,
    xpInRole: 200,
    levelInRole: 4
  }
];

// Assign maintenance chore to high-tech/speed engineer
let assignedState = assignChoreToStaff(state, 'clean_tape_heads', 'staff-eng-1');
assert.strictEqual(assignedState.chores.clean_tape_heads.assignedStaffId, 'staff-eng-1');
console.log('PASS: Chore successfully assigned to staff');

// Automatic processing triggers assigned chores
const autoResult = processAutomaticChores(assignedState, mockStaff);
assert.strictEqual(autoResult.completedChores.length, 1);
assert.strictEqual(autoResult.nextChoreState.chores.clean_tape_heads.completed, true);
// Staff with high technical skill (>75) grants an enhanced ability buff bonus
const tapeBuff = autoResult.nextChoreState.activeBuffs.find(b => b.choreId === 'clean_tape_heads');
assert(tapeBuff !== undefined, 'Buff must be created');
assert(tapeBuff.magnitude >= 0.11, 'High technical ability should scale buff magnitude above 0.10');
assert.strictEqual(autoResult.staffEnergyDeltas['staff-eng-1'] < 0, true, 'Staff burns energy');
console.log('PASS: Automatic chore processing executes based on staff ability');

// Auto-assign matching best staff to remaining chores
const autoAssignedState = autoAssignAvailableChores(createInitialChoreState(), mockStaff);
assert.strictEqual(autoAssignedState.chores.clean_tape_heads.assignedStaffId, 'staff-eng-1', 'Engineer assigned to maintenance');
assert.strictEqual(autoAssignedState.chores.tune_acoustics.assignedStaffId, 'staff-prod-1', 'Producer assigned to acoustics');
console.log('PASS: Auto-assign optimally assigns duties based on staff stats and role');

console.log('chore-engine: all checks passed');
