// src/rpg/takeEvaluation.ts
function evaluateTakeAccuracy(needlePosition, timingBonus = 0) {
  const pos = Math.max(0, Math.min(1, needlePosition));
  const expansion = 0.15 * Math.max(0, timingBonus);
  const goldMin = Math.max(0, 0.7 - expansion);
  const goldMax = Math.min(1, 0.85 + expansion);
  if (pos >= goldMin && pos <= goldMax) {
    return {
      grade: "Gold",
      multiplier: 1.3,
      qualityBonus: 4,
      label: "Gold Take"
    };
  }
  const silverMin = Math.max(0, goldMin - 0.2);
  const silverMax = Math.min(1, goldMax + 0.1);
  if (pos >= silverMin && pos < goldMin || pos > goldMax && pos <= silverMax) {
    return {
      grade: "Silver",
      multiplier: 1.1,
      qualityBonus: 2,
      label: "Silver Take"
    };
  }
  return {
    grade: "Solid",
    multiplier: 1,
    qualityBonus: 0,
    label: "Solid Take"
  };
}
function calculateTakeEnergyCost(availableEnergy, overdriveArmed, energySaver = false) {
  if (availableEnergy <= 0) return 0;
  if (availableEnergy === 1) return 1;
  if (overdriveArmed) {
    const targetCost = energySaver ? 2 : 3;
    return Math.min(availableEnergy, targetCost);
  }
  return 2;
}
function calculateTakeBaseUnits(energyCost) {
  return energyCost * 3;
}

// tests/pocket-take.check.ts
var passed = 0;
var ok = (cond, msg) => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};
var sweetSpot = evaluateTakeAccuracy(0.78);
ok(sweetSpot.grade === "Gold" && sweetSpot.multiplier === 1.3 && sweetSpot.qualityBonus === 4, "needle at 0.78 is Gold Take");
var nearMissLow = evaluateTakeAccuracy(0.65);
ok(nearMissLow.grade === "Silver" && nearMissLow.multiplier === 1.1 && nearMissLow.qualityBonus === 2, "needle at 0.65 is Silver Take");
var nearMissHigh = evaluateTakeAccuracy(0.9);
ok(nearMissHigh.grade === "Silver" && nearMissHigh.multiplier === 1.1 && nearMissHigh.qualityBonus === 2, "needle at 0.90 is Silver Take");
var offTarget = evaluateTakeAccuracy(0.3);
ok(offTarget.grade === "Solid" && offTarget.multiplier === 1 && offTarget.qualityBonus === 0, "needle at 0.30 is Solid Take");
ok(calculateTakeEnergyCost(6, false) === 2, "default take burns 2 energy");
ok(calculateTakeEnergyCost(1, false) === 1, "1 energy left adapts to 1 energy take");
ok(calculateTakeEnergyCost(0, false) === 0, "0 energy returns 0");
ok(calculateTakeEnergyCost(6, true) === 3, "overdrive adds +1 energy");
ok(calculateTakeEnergyCost(2, true) === 2, "overdrive with 2 energy burns 2 energy");
ok(calculateTakeBaseUnits(2) === 6, "2 energy produces 6 base units");
ok(calculateTakeBaseUnits(1) === 3, "1 energy produces 3 base units");
ok(calculateTakeBaseUnits(3) === 9, "3 energy (overdrive) produces 9 base units");
console.log(`pocket-take: all ${passed} checks passed`);
