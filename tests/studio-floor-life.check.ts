/**
 * Living studio floor FX checks — needles, LEDs, candle, clock glow, coffee steam, shelf sway.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  candleFlicker,
  clockRimGlowAlpha,
  coffeeSteamStrength,
  shelfIdleMotion,
  statusLedPulse,
  vuNeedleAngle,
  vuNeedleNorm,
} from '../src/components/studio/studioFloorLife';

console.log('studio-floor-life checks…');

// VU needles react to activity; reduced motion freezes the wobble
const idleNeedle = vuNeedleNorm(0.1, 1.2, 0, false);
const hotNeedle = vuNeedleNorm(0.9, 1.2, 0, false);
assert.ok(hotNeedle > idleNeedle, 'higher activity deflects the needle further');
const frozenNeedle = vuNeedleNorm(0.9, 4.0, 2, true);
const frozenNeedleLater = vuNeedleNorm(0.9, 9.0, 2, true);
assert.equal(frozenNeedle, frozenNeedleLater, 'reduced-motion needle is stable across time');
assert.ok(vuNeedleAngle(1) > vuNeedleAngle(0), 'needle angle sweeps with norm');

// Status LEDs brighter / livelier when live
const idleLed = statusLedPulse(0.2, 0.5, 0, false, false);
const liveLed = statusLedPulse(0.8, 0.5, 0, true, false);
assert.ok(liveLed >= idleLed * 0.9, 'live session LEDs stay readable');
assert.equal(statusLedPulse(1, 0, 0, true, true), statusLedPulse(1, 99, 0, true, true));

// Candle flicker stays in a warm band; frozen under reduced motion
const flick = candleFlicker(1.7, false);
assert.ok(flick >= 0.35 && flick <= 1);
assert.equal(candleFlicker(0, true), candleFlicker(12, true));

// Clock rim stronger at night than midday
const dayGlow = clockRimGlowAlpha(0.95, 'day', 1, false);
const nightGlow = clockRimGlowAlpha(0.15, 'night', 1, false);
assert.ok(nightGlow > dayGlow, 'clock glow lifts at night');

// Coffee steam only after brew
assert.equal(coffeeSteamStrength(false, 1, false), 0);
assert.ok(coffeeSteamStrength(true, 1, false) > 0.3, 'brew steam reads above idle');
assert.equal(coffeeSteamStrength(true, 0, true), coffeeSteamStrength(true, 40, true));

// Shelf micro-motion freezes under reduced motion
const frozenShelf = shelfIdleMotion(3, 1, true, true);
assert.equal(frozenShelf.dy, 0);
assert.equal(frozenShelf.rot, 0);
const liveShelf = shelfIdleMotion(3, 1, true, false);
assert.ok(Math.abs(liveShelf.dy) + Math.abs(liveShelf.rot) > 0);

// Wiring: canvas + decor + room consume the living FX contract
const webgl = readFileSync('src/components/WebGLCanvas.tsx', 'utf8');
const decor = readFileSync('src/components/studio/studioDecor.ts', 'utf8');
const room = readFileSync('src/components/StudioRoom.tsx', 'utf8');
assert.match(webgl, /vuNeedleNorm|needle:\s*tier === 1/, 'VU needles wired for tier-1 console');
assert.match(webgl, /statusLeds/, 'status LED jewels registered');
assert.match(webgl, /shelfIdleMotion/, 'shelf micro-motion applied');
assert.match(webgl, /buildCandleTable/, 'candle table placed on the floor');
assert.match(webgl, /buildCandleDrink/, 'brew mug mounted on candle table');
assert.match(webgl, /coffeeSteaming/, 'coffee steam flag passed into decor ambient');
assert.match(decor, /candleFlicker|CANDLE_FLAME_POS/, 'decor lights draw candle flicker');
assert.match(decor, /clockRimGlowAlpha|WALL_CLOCK_FACE/, 'decor lights draw clock rim glow');
assert.match(decor, /coffeeSteamStrength/, 'mug steam gated on brew');
assert.match(decor, /CANDLE_MUG_POS/, 'steam aims at candle-table mug');
assert.match(room, /brew_espresso\?\.completed/, 'StudioRoom sets coffeeSteaming from chore');

console.log('✓ studio-floor-life checks passed');
