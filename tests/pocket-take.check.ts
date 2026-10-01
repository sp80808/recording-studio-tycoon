import {
  evaluateTakeAccuracy,
  calculateTakeEnergyCost,
  calculateTakeBaseUnits
} from '@/rpg/takeEvaluation';

let passed = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

// 1. Accuracy Brackets
const sweetSpot = evaluateTakeAccuracy(0.78);
ok(sweetSpot.grade === 'Gold' && sweetSpot.multiplier === 1.3 && sweetSpot.qualityBonus === 4, 'needle at 0.78 is Gold Take');

const nearMissLow = evaluateTakeAccuracy(0.65);
ok(nearMissLow.grade === 'Silver' && nearMissLow.multiplier === 1.1 && nearMissLow.qualityBonus === 2, 'needle at 0.65 is Silver Take');

const nearMissHigh = evaluateTakeAccuracy(0.90);
ok(nearMissHigh.grade === 'Silver' && nearMissHigh.multiplier === 1.1 && nearMissHigh.qualityBonus === 2, 'needle at 0.90 is Silver Take');

const offTarget = evaluateTakeAccuracy(0.30);
ok(offTarget.grade === 'Solid' && offTarget.multiplier === 1.0 && offTarget.qualityBonus === 0, 'needle at 0.30 is Solid Take');

// 2. Energy Adaptation
ok(calculateTakeEnergyCost(6, false) === 2, 'default take burns 2 energy');
ok(calculateTakeEnergyCost(1, false) === 1, '1 energy left adapts to 1 energy take');
ok(calculateTakeEnergyCost(0, false) === 0, '0 energy returns 0');
ok(calculateTakeEnergyCost(6, true) === 3, 'overdrive adds +1 energy');
ok(calculateTakeEnergyCost(2, true) === 2, 'overdrive with 2 energy burns 2 energy');

// 3. Base Units Scaling — early stages (~8–12 units) clear in ~2 takes.
ok(calculateTakeBaseUnits(2) === 6, '2 energy produces 6 base units');
ok(calculateTakeBaseUnits(1) === 3, '1 energy produces 3 base units');
ok(calculateTakeBaseUnits(3) === 9, '3 energy (overdrive) produces 9 base units');

console.log(`pocket-take: all ${passed} checks passed`);
