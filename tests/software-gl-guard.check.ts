// #352/#353: software-GL playtests froze, starved timers (review stuck on "Calculating...") and OOM-killed tabs.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applySoftwareGlProfile, isSoftwareGlRendererName, readGlRendererName } from '../src/lib/render/rendererChoice';

assert.equal(isSoftwareGlRendererName('ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)'), true);
assert.equal(isSoftwareGlRendererName('llvmpipe (LLVM 15.0.7, 256 bits)'), true);
assert.equal(isSoftwareGlRendererName('Microsoft Basic Render Driver'), true);
assert.equal(isSoftwareGlRendererName('ANGLE (Apple, ANGLE Metal Renderer: Apple M2, Unspecified Version)'), false);
assert.equal(isSoftwareGlRendererName('NVIDIA GeForce RTX 3060'), false);
assert.equal(isSoftwareGlRendererName(null), false);

// The probe never throws on missing or hostile contexts.
assert.equal(readGlRendererName(null), null);
assert.equal(readGlRendererName({}), null);
assert.equal(readGlRendererName({ getExtension() { throw new Error('lost'); } }), null);
assert.equal(readGlRendererName({ getExtension: () => null, getParameter: () => 'llvmpipe', RENDERER: 1 }), 'llvmpipe');

// The profile clamps presentation but keeps unrelated fields and never mutates the saved settings.
const saved = { resolutionScale: 1.5, targetFps: 120 as number, crtScanlines: true, analogTapeWarmth: true, bloomAndGlow: true, language: 'en' };
const soft = applySoftwareGlProfile(saved);
assert.deepEqual(
  { r: soft.resolutionScale, f: soft.targetFps, c: soft.crtScanlines, a: soft.analogTapeWarmth, b: soft.bloomAndGlow, l: soft.language },
  { r: 0.5, f: 20, c: false, a: false, b: false, l: 'en' },
);
assert.equal(saved.bloomAndGlow, true);
assert.equal(applySoftwareGlProfile({ ...saved, targetFps: 0 }).targetFps, 20, 'uncapped vsync is capped too');
assert.equal(applySoftwareGlProfile({ ...saved, targetFps: 15 }).targetFps, 15, 'never raises a lower cap');

// Review reveal must have a wall-clock failure path.
const modal = readFileSync('src/components/modals/ProjectReviewModal.tsx', 'utf8');
assert.match(modal, /REVEAL_WATCHDOG_MS/);
assert.match(modal, /window\.setTimeout\(skipReveal, REVEAL_WATCHDOG_MS\)/);

console.log('software-gl-guard checks passed');
