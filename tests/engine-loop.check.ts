import assert from 'node:assert';
import { EngineLoop } from '../src/engine/engineLoop';

console.log('Testing Engine Loop & Accumulator...');

const loop = new EngineLoop({ fixedStepSec: 0.05, maxDeltaSec: 0.25 });

// 1. Simulation step accumulation
let fixedTicks = 0;
loop.onFixedTick((fixedDelta) => {
  assert.strictEqual(fixedDelta, 0.05);
  fixedTicks += 1;
});

// Simulate 120ms of elapsed time -> should trigger exactly 2 fixed ticks of 50ms, with 20ms accumulated
loop.simulateStep(0.12);
assert.strictEqual(fixedTicks, 2, '120ms should produce 2 fixed ticks of 50ms');
assert.strictEqual(Math.round(loop.getAccumulatorSec() * 1000), 20, 'Accumulator should retain remaining 20ms');
console.log('PASS: Fixed-step accumulator evaluates ticks accurately');

// 2. Render tick delta clamping
let lastRenderDelta = 0;
loop.onTick((event) => {
  lastRenderDelta = event.deltaSec;
});

// Simulate large delta (e.g. 1500ms after tab freeze)
loop.simulateStep(1.5);
assert.strictEqual(lastRenderDelta, 0.25, 'Delta should clamp to maxDeltaSec (0.25s)');
console.log('PASS: Render delta clamps correctly under extreme delay');

console.log('engine-loop: all checks passed');
