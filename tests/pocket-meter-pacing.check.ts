import assert from 'node:assert/strict';
import fs from 'node:fs';

const meter = fs.readFileSync('src/components/console/PocketMeter.tsx', 'utf8');
const active = fs.readFileSync('src/components/ActiveProject.tsx', 'utf8');
const takeEval = fs.readFileSync('src/rpg/takeEvaluation.ts', 'utf8');
const stageWork = fs.readFileSync('src/hooks/useStageWork.tsx', 'utf8');

const timingValue = (name: 'cycleSeconds' | 'autoLockSeconds'): number => {
  const match = meter.match(new RegExp(`${name}:\\s*([0-9.]+)`));
  assert.ok(match, `PocketMeter must declare ${name}`);
  const value = Number(match[1]);
  assert.ok(Number.isFinite(value) && value > 0, `${name} must be a positive duration`);
  return value;
};

const cycleSeconds = timingValue('cycleSeconds');
const autoLockSeconds = timingValue('autoLockSeconds');

// Needle: verify the playable timing relationships rather than pinning one tuning pass.
// PocketMeter's live sweep is center 0.53 / amplitude 0.41 and the base Gold
// window is 0.70–0.85. Measure the rising crossing that the player reacts to.
const crossingSeconds = (
  Math.asin((0.85 - 0.53) / 0.41) - Math.asin((0.70 - 0.53) / 0.41)
) / (Math.PI * 2) * cycleSeconds;
assert.ok(
  crossingSeconds >= 0.09 && crossingSeconds <= 0.16,
  `Gold crossing must remain readable without dragging (${Math.round(crossingSeconds * 1000)}ms)`,
);
const cyclesBeforeFallback = autoLockSeconds / cycleSeconds;
assert.ok(
  cyclesBeforeFallback >= 1.5 && cyclesBeforeFallback <= 2,
  `auto-lock must allow more than one pass without becoming a wait (${cyclesBeforeFallback.toFixed(2)} cycles)`,
);
assert.ok(autoLockSeconds <= 3.5, 'safe fallback must resolve the console check promptly');
assert.match(meter, /prefers-reduced-motion: reduce/, 'reduced motion must use the static accessible path');
assert.match(meter, /role="meter"/, 'meter must expose its live value to assistive technology');

// Inter-take dock: short rearm beat, no long toast dead-wait.
assert.match(active, /postTakeRearmMs:\s*320/, 'post-take rearm should be a short beat, not a pause');
assert.match(active, /takeToastMs:\s*1400/, 'take toast should clear before the next arm feels blocked');
assert.match(active, /setTakeState\('tracking'\)/, 'energy burst should auto-rearm the next take');
assert.match(active, /Stand down/, 'players need an explicit way to stop the take burst');

// Throughput: fewer calibration cycles per stage without deleting the skill lock.
assert.match(takeEval, /return energyCost \* 3/, 'base units should clear early stages in ~2 takes');
assert.match(stageWork, /calculateTakeBaseUnits\(energyCost\)/, 'session work must use shared take base units');

console.log('PASS: PocketMeter pacing, burst rearm, throughput and meter semantics');
