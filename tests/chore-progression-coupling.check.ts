import assert from 'node:assert';
import { evaluateTakeAccuracy, calculateTakeEnergyCost } from '../src/rpg/takeEvaluation';
import { createInitialChoreState } from '../src/simulation/choreEngine';

console.log('Testing Chore Progression Coupling...');

// 1. Standard PocketMeter evaluation
const baseTakeStandard = evaluateTakeAccuracy(0.69);
assert.strictEqual(baseTakeStandard.grade, 'Silver', '0.69 is outside standard 0.70-0.85 Gold range');

// 2. Active timing_bonus expands Gold range (+10% tolerance)
const boostedTake = evaluateTakeAccuracy(0.69, 0.10);
assert.strictEqual(boostedTake.grade, 'Gold', 'With 0.10 timing bonus, 0.69 qualifies for Gold Take');
console.log('PASS: timing_bonus successfully widens PocketMeter Gold window');

// 3. Energy saver reduces overdrive cost
const standardOverdrive = calculateTakeEnergyCost(5, true, false);
assert.strictEqual(standardOverdrive, 3, 'Standard overdrive burns 3 energy');

const discountedOverdrive = calculateTakeEnergyCost(5, true, true);
assert.strictEqual(discountedOverdrive, 2, 'Energy saver buff reduces overdrive to 2 energy');
console.log('PASS: energy_saver buff discounts overdrive energy cost');

console.log('chore-progression-coupling: all checks passed');
