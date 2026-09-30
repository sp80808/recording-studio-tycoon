/**
 * Asset provenance + sprite-fallback checks (GitHub issue #58 first slice).
 * Runs the same `pnpm assets:verify` script CI/contributors run, plus static
 * checks that the optional sprite dressing layer degrades gracefully.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

console.log('asset-provenance checks…');

// The manifest + tracked-directory audit itself.
const output = execFileSync(process.execPath, ['scripts/verify-assets.mjs'], { encoding: 'utf8' });
assert.match(output, /^PASS: assets:verify/, 'pnpm assets:verify must pass against the committed manifest');

const studioAssets = readFileSync('src/components/studio/studioAssets.ts', 'utf8');
const webgl = readFileSync('src/components/WebGLCanvas.tsx', 'utf8');

// Sprite fallback path (issue #58 §B): a load failure must resolve to null,
// never throw or reject uncaught.
assert.match(studioAssets, /\.catch\(\(\) => null\)/, 'Optional texture loads must catch failures and resolve to null, never reject');
assert.match(studioAssets, /Never throws/, 'Loader contract must be documented as non-throwing');

// The shelf must draw its procedural fallback unconditionally, then only
// *optionally* upgrade to a sprite — asset presence must never gate the
// guaranteed first frame.
const shelfLoopMatch = webgl.match(/for \(let i = 0; i < gearCount; i\+\+\) \{[\s\S]*?\n  \}/);
assert.ok(shelfLoopMatch, 'Gear shelf loop must exist in WebGLCanvas');
const shelfLoop = shelfLoopMatch![0];
const fillIdx = shelfLoop.indexOf('.fill(color)');
const spriteIdx = shelfLoop.indexOf('loadOptionalTexture(');
assert.ok(fillIdx >= 0 && spriteIdx > fillIdx, 'Procedural bar must be drawn before any optional sprite upgrade is even attempted');
assert.match(shelfLoop, /if \(!texture \|\| refs\.disposed\) return;/, 'Sprite upgrade must bail out on missing texture or a torn-down scene, never crash the loop');

console.log('✓ asset-provenance checks passed');
