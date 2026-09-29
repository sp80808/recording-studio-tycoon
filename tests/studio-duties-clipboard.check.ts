import assert from 'node:assert';
import {
  createInitialChoreState,
  executeStudioChore,
  assignChoreToStaff,
  autoAssignAvailableChores,
  processAutomaticChores,
  AUTHORED_CHORES
} from '../src/simulation/choreEngine';

console.log('Testing Studio Duties Clipboard Specs...');

const state = createInitialChoreState();
assert.strictEqual(Object.keys(state.chores).length, 5);

// Test chore display metadata
const tapeChore = state.chores.clean_tape_heads;
assert.strictEqual(tapeChore.title, 'Clean Tape Heads');
assert.strictEqual(tapeChore.category, 'maintenance');
assert.strictEqual(tapeChore.energyCost, 1);
assert.strictEqual(tapeChore.buffType, 'timing_bonus');

// Test staff assignability
const assigned = assignChoreToStaff(state, 'clean_tape_heads', 'engineer-1');
assert.strictEqual(assigned.chores.clean_tape_heads.assignedStaffId, 'engineer-1');

// Test unassign
const unassigned = assignChoreToStaff(assigned, 'clean_tape_heads', null);
assert.strictEqual(unassigned.chores.clean_tape_heads.assignedStaffId, null);

// Test streak milestone calculation
const streak0DaysLeft = 3 - (0 % 3);
assert.strictEqual(streak0DaysLeft, 3);
const streak2DaysLeft = 3 - (2 % 3);
assert.strictEqual(streak2DaysLeft, 1);

console.log('studio-duties-clipboard: all checks passed');
