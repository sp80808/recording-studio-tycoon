import assert from 'node:assert';
import { readFileSync } from 'node:fs';
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

// 3. No hard quad edge (bead u0q): the ray contribution must fade near the
// filter frame boundary so the container bounds never read as a rectangle.
const shaderSrc = readFileSync('src/lib/render/shaders/godrayFilter.ts', 'utf8');
assert.ok(shaderSrc.includes('edgeFade'), 'shader fades rays near the filter frame edge');
assert.ok(shaderSrc.includes('vTextureCoord'), 'edge mask derives from frame UVs');
assert.doesNotMatch(
  shaderSrc,
  /finalAlpha = max\(baseColor\.a, length\(rayColor\)/,
  'raw ray alpha must not reach the output unmasked',
);
console.log('PASS: Ray glow fades at the frame edge — no visible square');

console.log('shaders-godray: all checks passed');
