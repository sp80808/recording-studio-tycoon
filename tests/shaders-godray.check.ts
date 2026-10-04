import assert from 'node:assert';
import {
  calculateGodrayColor,
  createStudioGodrayFilter,
} from '../src/lib/render/shaders/godrayFilter';

console.log('Testing Studio Godray Filter module...');

// 1. Verify period-authentic sunlight and moonlight colors across clock minutes
const dawn = calculateGodrayColor(420);   // 07:00 AM
const noon = calculateGodrayColor(720);   // 12:00 PM
const sunset = calculateGodrayColor(1140); // 19:00 PM
const midnight = calculateGodrayColor(60); // 01:00 AM

assert.strictEqual(dawn.hex, 0xffc27a, 'Dawn delivers warm peach-gold beam');
assert.strictEqual(noon.hex, 0xfff0c0, 'Noon delivers brilliant crisp white beam');
assert.strictEqual(sunset.hex, 0xff7a45, 'Golden hour delivers amber-ruby beam');
assert.strictEqual(midnight.hex, 0x4a6d8c, 'Night delivers cool slate moonlight beam');
console.log('PASS: Time-of-day chromatic progression matches physical light physics');

// 2. Safe headless fallback (Node environment without document)
const headlessResult = createStudioGodrayFilter();
assert.strictEqual(headlessResult, null, 'Safely returns null in non-browser Node environments');
console.log('PASS: Headless environment safely guarded without throwing');

console.log('shaders-godray: all checks passed');
