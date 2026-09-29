import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('src/components/console/PocketMeter.tsx', 'utf8');

assert.match(source, /cycleSeconds:\s*2\.4/, 'needle sweep should remain readable');
assert.match(source, /autoLockSeconds:\s*5/, 'players should have time to react');
assert.match(source, /prefers-reduced-motion: reduce/, 'reduced motion must use the static accessible path');
assert.match(source, /role="meter"/, 'meter must expose its live value to assistive technology');

console.log('PASS: PocketMeter pacing, reduced motion and meter semantics');
