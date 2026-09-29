import { evaluateMixOutput, calculateConsoleRideScore } from '@/components/minigames/ConsoleRideGame';

let passed = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

// Target RMS sweet spot (level ~50, pan ~0)
const sweetSpot = evaluateMixOutput(50, 0, 50, 0);
ok(sweetSpot.inSweetSpot === true && sweetSpot.isClipping === false, 'level in sweet spot');

// Clipping (>92 output level)
const clipping = evaluateMixOutput(95, 0, 80, 0);
ok(clipping.isClipping === true, 'detects digital clipping');

// Off-center pan
const uncentered = evaluateMixOutput(50, 60, 50, -20);
ok(uncentered.inSweetSpot === false, 'panning mismatch is not sweet spot');

// Score calculation
const score = calculateConsoleRideScore(80, 100, 0);
ok(score === 800, '80% in-zone with 0 clips gives 800 score');

console.log(`console-ride-game: all ${passed} checks passed`);
