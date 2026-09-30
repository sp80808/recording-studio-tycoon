import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('src/components/console/PocketMeter.tsx', 'utf8');

assert.match(source, /cycleSeconds:\s*1\.6/, 'needle sweep should feel snappy but readable');
assert.match(source, /autoLockSeconds:\s*3\.3/, 'players should have time to react without waiting');
assert.match(source, /prefers-reduced-motion: reduce/, 'reduced motion must use the static accessible path');
assert.match(source, /role="meter"/, 'meter must expose its live value to assistive technology');

console.log('PASS: PocketMeter pacing, reduced motion and meter semantics');
