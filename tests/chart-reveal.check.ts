import assert from 'node:assert';
import {
  REVEAL_MIN_LEVEL, buildRevealSteps, collectRewardItems, isRevealUnlocked,
  estimateChartPosition, payoffTierForPosition, registerRewardProvider, stepDelayMs,
} from '../src/utils/chartReveal';

console.log('Testing chart reveal model...');
assert.strictEqual(isRevealUnlocked(REVEAL_MIN_LEVEL - 1), false, 'gated early game');
assert.strictEqual(isRevealUnlocked(REVEAL_MIN_LEVEL), true);
assert.deepStrictEqual(['top1', 'top10', 'top40', 'chart'], [1, 7, 40, 41].map(payoffTierForPosition));

for (const final of [1, 8, 37, 100]) {
  const a = buildRevealSteps(final, 's');
  assert.deepStrictEqual(a, buildRevealSteps(final, 's'), 'deterministic');
  assert.strictEqual(a[a.length - 1], final, 'lands on final position');
  assert.ok(a.every(n => n >= 1), 'never below 1');
}
assert.ok(stepDelayMs(0, 8) < stepDelayMs(6, 8), 'ticker slows toward the end');

assert.strictEqual(estimateChartPosition(59, 'a'), null, 'low quality does not chart');
assert.strictEqual(estimateChartPosition(NaN, 'a'), null);
assert.ok(estimateChartPosition(99, 'a')! <= 2, 'top quality lands top 2');
assert.ok(estimateChartPosition(75, 'a')! >= 26 && estimateChartPosition(75, 'a')! <= 40);
assert.strictEqual(estimateChartPosition(85, 'p'), estimateChartPosition(85, 'p'), 'deterministic');

const off = registerRewardProvider(m => [{ id: 'x', label: `tier ${m.tier}` }]);
registerRewardProvider(() => { throw new Error('bad'); });
assert.deepStrictEqual(collectRewardItems({ source: 'chart', tier: 'top1' }), [{ id: 'x', label: 'tier top1' }]);
off();
console.log('chart-reveal: all checks passed');
