import assert from 'node:assert';

console.log('Testing Graphics Post-FX Math & Budgets...');

// 1. Effective Resolution Math
export const calculateEffectiveResolution = (dpr: number, scale: number) => {
  const clampedDpr = Math.max(1.0, Math.min(2.0, dpr || 1.0));
  return Math.max(0.5, Math.min(3.0, clampedDpr * (scale || 1.0)));
};

assert.strictEqual(calculateEffectiveResolution(1.0, 1.0), 1.0);
assert.strictEqual(calculateEffectiveResolution(2.0, 0.75), 1.5);
assert.strictEqual(calculateEffectiveResolution(2.0, 1.5), 3.0);
console.log('PASS: Effective resolution scales accurately');

// 2. Frame Budget Limiter
export const shouldSkipFrame = (targetFps: number, elapsedMs: number) => {
  if (targetFps <= 0) return false;
  const budgetMs = 1000 / targetFps;
  return elapsedMs < budgetMs - 1.0;
};

assert.strictEqual(shouldSkipFrame(60, 10.0), true, '10ms is below 60fps budget (16.6ms)');
assert.strictEqual(shouldSkipFrame(60, 16.0), false, '16ms meets 60fps budget');
assert.strictEqual(shouldSkipFrame(30, 25.0), true, '25ms is below 30fps budget (33.3ms)');
assert.strictEqual(shouldSkipFrame(0, 5.0), false, 'Unlimited fps never skips');
console.log('PASS: Frame budget math accurately throttles frames');

console.log('graphics-postfx: all checks passed');
