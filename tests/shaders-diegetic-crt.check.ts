import assert from 'node:assert';
import {
  DEFAULT_DIEGETIC_CRT_OPTIONS,
  createDiegeticCrtFilter,
} from '../src/lib/render/shaders/diegeticCrtFilter';

console.log('Testing Diegetic CRT Filter module...');

// 1. Verify default options are period-subtle
assert.strictEqual(DEFAULT_DIEGETIC_CRT_OPTIONS.pitch, 3.0);
assert.strictEqual(DEFAULT_DIEGETIC_CRT_OPTIONS.scanlineAlpha, 0.25);
assert.strictEqual(DEFAULT_DIEGETIC_CRT_OPTIONS.curvature, 0.05);
assert.strictEqual(DEFAULT_DIEGETIC_CRT_OPTIONS.chromaticAberration, 0.0015);
console.log('PASS: Default CRT options are physically subtle');

// 2. Safe headless fallback (Node environment without document)
const headlessResult = createDiegeticCrtFilter();
assert.strictEqual(headlessResult, null, 'Safely returns null in non-browser Node environments');
console.log('PASS: Headless environment safely guarded without throwing');

console.log('shaders-diegetic-crt: all checks passed');
