import assert from 'node:assert';
import {
  calculateEffectiveResolution,
  shouldSkipFrame,
  calculateDynamicBloom,
  getEraPostFxTuning,
  calculateTapeSaturationWarmth,
} from '../src/components/WebGLCanvas';

console.log('Testing Graphics Post-FX Math & Budgets from WebGLCanvas...');

// 1. Effective Resolution Math
assert.strictEqual(calculateEffectiveResolution(1.0, 1.0), 1.0);
assert.strictEqual(calculateEffectiveResolution(2.0, 0.75), 1.5);
assert.strictEqual(calculateEffectiveResolution(2.0, 1.5), 3.0);
console.log('PASS: Effective resolution scales accurately');

// 2. Frame Budget Limiter
assert.strictEqual(shouldSkipFrame(60, 10.0), true, '10ms is below 60fps budget (16.6ms)');
assert.strictEqual(shouldSkipFrame(60, 16.0), false, '16ms meets 60fps budget');
assert.strictEqual(shouldSkipFrame(30, 25.0), true, '25ms is below 30fps budget (33.3ms)');
assert.strictEqual(shouldSkipFrame(0, 5.0), false, 'Unlimited fps never skips');
console.log('PASS: Frame budget math accurately throttles frames');

// 3. Era-Relevant Post-FX Tuning (Subtle and non-distracting)
const analogTuning = getEraPostFxTuning('analog60s');
const digitalTuning = getEraPostFxTuning('digital80s');
const millenniumTuning = getEraPostFxTuning('internet2000s');
const streamingTuning = getEraPostFxTuning('streaming2020s');

assert.ok(analogTuning.scanlineAlpha <= 0.06 && analogTuning.scanlineAlpha >= 0.02, 'Analog scanline alpha is subtle');
assert.ok(digitalTuning.scanlineAlpha <= 0.06 && digitalTuning.scanlineAlpha >= 0.02, 'Digital scanline alpha is subtle');
assert.ok(millenniumTuning.scanlineAlpha < digitalTuning.scanlineAlpha, 'Millennium LCD is cleaner than 80s CRT');
assert.ok(streamingTuning.scanlineAlpha <= 0.02, 'Streaming era scanlines are ultra-fine');

assert.strictEqual(analogTuning.vignetteColor, 0x1d1107, 'Warm analog tape amber vignette');
assert.strictEqual(digitalTuning.vignetteColor, 0x160c24, 'Digital 80s slate violet vignette');
assert.ok(analogTuning.vignetteAlpha <= 0.25, 'Vignette alpha remains subtle');
console.log('PASS: Era-relevant tuning delivers authentic, subtle values');

// 4. Dynamic Audio/Activity-Reactive Bloom Math
const idleBloom = calculateDynamicBloom(0, false, 'analog60s');
const activeBloom = calculateDynamicBloom(0.85, true, 'analog60s');
const digitalBloom = calculateDynamicBloom(0.5, true, 'digital80s');
const reducedMotionBloom = calculateDynamicBloom(0.9, true, 'analog60s', true);

assert.ok(idleBloom.meterAlpha >= 0.08 && idleBloom.meterAlpha <= 0.15, 'Idle bloom is quiet and subtle');
assert.ok(activeBloom.meterAlpha > idleBloom.meterAlpha, 'Active bloom increases with session activity');
assert.ok(activeBloom.meterAlpha <= 0.30, 'Active bloom is strictly clamped against tacky glare');
assert.ok(activeBloom.lampAlpha > idleBloom.lampAlpha, 'Recording lamp lights up on active project');
assert.strictEqual(reducedMotionBloom.radiusMultiplier, 1.0, 'Reduced motion disables radius pulsation');
assert.strictEqual(analogBloomColorMatches(idleBloom.meterColor), true, 'Warm amber meter glow in analog era');
assert.strictEqual(digitalBloom.meterColor, 0xc77dff, 'Synth magenta/cyan meter glow in 80s era');
console.log('PASS: Dynamic bloom reacts accurately to session activity without distraction');

// 5. Tape Saturation Warmth
assert.strictEqual(calculateTapeSaturationWarmth(0, false, 1.0), 1.0, 'Idle studio retains neutral tape warmth');
const activeWarmth = calculateTapeSaturationWarmth(0.8, true, 1.0);
assert.ok(activeWarmth > 1.0 && activeWarmth <= 1.10, 'Active session applies subtle tape warmth compression boost');
console.log('PASS: Analog tape saturation provides subtle tactile dynamic warmth');

function analogBloomColorMatches(color: number) {
  return color === 0xffaa33;
}

console.log('graphics-postfx: all checks passed');

