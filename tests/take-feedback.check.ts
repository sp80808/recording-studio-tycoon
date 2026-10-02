import assert from 'node:assert';
import { takeQuip, takeIntensity, nodOffset } from '../src/utils/takeFeedback';

console.log('Testing take feedback...');
assert.strictEqual(takeQuip('Gold', 4), takeQuip('Gold', 4), 'deterministic');
assert.notStrictEqual(takeQuip('Gold', 0), takeQuip('Gold', 1), 'rotates through lines');
assert.ok(takeIntensity('Gold') > takeIntensity('Silver') && takeIntensity('Silver') > takeIntensity('Solid'));
assert.strictEqual(nodOffset(-5, 'Gold'), 0);
assert.strictEqual(nodOffset(600, 'Gold'), 0, 'nod ends after 500ms');
assert.ok(Math.abs(nodOffset(80, 'Gold')) > Math.abs(nodOffset(80, 'Solid')), 'gold nods harder');
console.log('take feedback OK');
