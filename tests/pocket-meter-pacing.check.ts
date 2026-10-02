import assert from 'node:assert/strict';
import fs from 'node:fs';

const meter = fs.readFileSync('src/components/console/PocketMeter.tsx', 'utf8');
const active = fs.readFileSync('src/components/ActiveProject.tsx', 'utf8');
const takeEval = fs.readFileSync('src/rpg/takeEvaluation.ts', 'utf8');
const stageWork = fs.readFileSync('src/hooks/useStageWork.tsx', 'utf8');

// Needle: quick console check — snappier than 1.6/3.3, still slower than twitchy ~1.1.
assert.match(meter, /cycleSeconds:\s*1\.8/, 'needle sweep should feel like a quick console check');
assert.match(meter, /autoLockSeconds:\s*3\.2/, 'auto-lock should match the 3.2s design fallback');
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
