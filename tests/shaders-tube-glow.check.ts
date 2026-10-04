import assert from 'node:assert';
import {
  calculateTubeGlowIntensity,
  createTubeGlowFilter,
} from '../src/lib/render/shaders/tubeGlowFilter';

console.log('Testing Thermionic Tube Glow Filter module...');

// 1. Verify dynamic audio/activity-reactive intensity scaling
const idle = calculateTubeGlowIntensity(0, false);
const activeSession = calculateTubeGlowIntensity(0.85, true);

assert.strictEqual(idle, 0.18, 'Idle studio maintains subtle quiescent filament glow');
assert.ok(activeSession > idle, 'Active session scales up tube emission');
assert.ok(activeSession <= 0.70, 'Tube glow is strictly clamped against oversaturation');
console.log('PASS: Tube glow intensity reacts physically to audio activity and session state');

// 2. Safe headless fallback (Node environment without document)
const headlessResult = createTubeGlowFilter();
assert.strictEqual(headlessResult, null, 'Safely returns null in non-browser Node environments');
console.log('PASS: Headless environment safely guarded without throwing');

console.log('shaders-tube-glow: all checks passed');
