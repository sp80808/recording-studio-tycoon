import assert from 'node:assert';
import { defaultSettings, GRAPHICS_PRESETS } from '../src/data/defaultSettings';

console.log('Testing Engine Settings & Graphics Presets...');

// 1. Verify default values
assert.strictEqual(defaultSettings.graphicsPreset, 'high');
assert.strictEqual(defaultSettings.resolutionScale, 1.0);
assert.strictEqual(defaultSettings.targetFps, 60);
// CRT scanlines are opt-in: they hazed the whole studio and read as an unwanted texture by default.
assert.strictEqual(defaultSettings.crtScanlines, false);
assert.strictEqual(GRAPHICS_PRESETS.high.crtScanlines, defaultSettings.crtScanlines, 'default profile matches the high preset');
assert.strictEqual(defaultSettings.analogTapeWarmth, true);
assert.strictEqual(defaultSettings.bloomAndGlow, true);
assert.strictEqual(defaultSettings.screenShake, true);
assert.strictEqual(defaultSettings.pocketMeterAssistance, 'normal');
console.log('PASS: Default settings have authentic graphics parameters');

// 2. Preset configs
assert.strictEqual(GRAPHICS_PRESETS.low.resolutionScale, 0.75);
assert.strictEqual(GRAPHICS_PRESETS.low.crtScanlines, false);
assert.strictEqual(GRAPHICS_PRESETS.ultra.resolutionScale, 1.5);
assert.strictEqual(GRAPHICS_PRESETS.ultra.targetFps, 120);
assert.strictEqual(GRAPHICS_PRESETS.ultra.crtScanlines, true, 'retro CRT look stays available on Ultra');
console.log('PASS: Graphics presets accurately configure resolution and features');

console.log('engine-settings: all checks passed');
