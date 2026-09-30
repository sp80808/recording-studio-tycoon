import assert from 'node:assert';
import {
  REVEAL_MIN_LEVEL, buildRevealSteps, collectRewardItems, isRevealUnlocked,
  payoffTierForPosition, registerRewardProvider, stepDelayMs,
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

const off = registerRewardProvider(m => [{ id: 'x', label: `tier ${m.tier}` }]);
registerRewardProvider(() => { throw new Error('bad'); });
assert.deepStrictEqual(collectRewardItems({ source: 'chart', tier: 'top1' }), [{ id: 'x', label: 'tier top1' }]);
off();
console.log('chart-reveal: all checks passed');
