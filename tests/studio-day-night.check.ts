/**
 * Clock-linked day/night + window sky (studio ambience).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  CLOCK_DAY_OFFSET,
  CLOCK_MINUTES_PER_REAL_SECOND,
  getDaynessFromClockMinutes,
  getDayPhase,
  getNightTintAlpha,
  getStudioClockMinutes,
  getWallClockTime,
  getWindowSkyColor,
  lerpHex,
  REDUCED_MOTION_DAYNESS,
  STUDIO_DAY_MINUTES,
  WALL_CLOCK_MINUTES,
} from '../src/components/studio/studioDecorConfig';

console.log('studio-day-night checks…');

// Shared minute stream: day offset + real-time advance
assert.equal(getStudioClockMinutes(1, 0), (CLOCK_DAY_OFFSET) % STUDIO_DAY_MINUTES);
assert.equal(
  getStudioClockMinutes(0, 15),
  (15 * CLOCK_MINUTES_PER_REAL_SECOND) % STUDIO_DAY_MINUTES,
);
// Consecutive days never share the same face start
assert.notEqual(
  getWallClockTime(1, 0).hour * 60 + getWallClockTime(1, 0).minute,
  getWallClockTime(2, 0).hour * 60 + getWallClockTime(2, 0).minute,
);

// Phase map
assert.equal(getDayPhase(0), 'night');
assert.equal(getDayPhase(299), 'night');
assert.equal(getDayPhase(300), 'morning');
assert.equal(getDayPhase(599), 'morning');
assert.equal(getDayPhase(600), 'day');
assert.equal(getDayPhase(1019), 'day');
assert.equal(getDayPhase(1020), 'evening');
assert.equal(getDayPhase(1259), 'evening');
assert.equal(getDayPhase(1260), 'night');
assert.equal(getDayPhase(1439), 'night');

// Dayness: noon bright, midnight dark, smooth midpoints
const noon = getDaynessFromClockMinutes(720);
const midnight = getDaynessFromClockMinutes(0);
const dawn = getDaynessFromClockMinutes(360);
const dusk = getDaynessFromClockMinutes(1080);
assert.ok(noon > 0.99, 'noon is full daylight');
assert.ok(midnight < 0.01, 'midnight is deepest night');
assert.ok(Math.abs(dawn - 0.5) < 0.02, '6am ~ half dayness');
assert.ok(Math.abs(dusk - 0.5) < 0.02, '6pm ~ half dayness');
assert.ok(getNightTintAlpha(midnight) > getNightTintAlpha(noon), 'tint stronger at night');
assert.ok(REDUCED_MOTION_DAYNESS > 0.7, 'reduced-motion freezes on a bright day look');

// Window sky: day ≠ night, morning ≠ evening, noon matches legacy pane blue
const daySky = getWindowSkyColor(720);
const nightSky = getWindowSkyColor(0);
const morningSky = getWindowSkyColor(400);
const eveningSky = getWindowSkyColor(1100);
assert.equal(daySky, 0x8fbfe6, 'noon sky keeps prior static window blue');
assert.notEqual(daySky, nightSky);
assert.notEqual(morningSky, eveningSky);
assert.notEqual(lerpHex(0x000000, 0xffffff, 0.5), 0x000000);

// Wall face is 12h; lighting minutes are 24h
const late = getWallClockTime(0, (13 * 60) / CLOCK_MINUTES_PER_REAL_SECOND);
assert.ok(late.minutesOfDay >= 13 * 60);
assert.equal(late.hour, Math.floor((late.minutesOfDay % WALL_CLOCK_MINUTES) / 60) % 12);

// Wiring: WebGLCanvas drives clock + window + tint + decor from one sample
const webgl = readFileSync('src/components/WebGLCanvas.tsx', 'utf8');
const decor = readFileSync('src/components/studio/studioDecor.ts', 'utf8');
assert.match(webgl, /getWallClockTime\(s\.day, t\)/, 'ticker samples shared clock');
assert.match(webgl, /getWindowSkyColor/, 'window sky from clock');
assert.match(webgl, /getNightTintAlpha\(dayness\)/, 'night tint from dayness');
assert.match(webgl, /refs\.decor\?\.update\([^)]*dayness/, 'decor lights receive dayness');
assert.match(webgl, /setWindowSky/, 'window pane is updatable');
assert.doesNotMatch(webgl, /Math\.sin\(\(t \* Math\.PI \* 2\) \/ 90\)/, 'legacy 90s tint sine removed');
assert.match(decor, /ambient\?\.dayness|DecorLightsAmbient/, 'decor accepts clock ambient');
assert.match(decor, /getInteriorLightBoost/, 'practicals boost after dark');

// Advance-day / HUD day display untouched (StudioRoom still passes currentDay)
const room = readFileSync('src/components/StudioRoom.tsx', 'utf8');
assert.match(room, /day:\s*gameState\.currentDay/, 'room still feeds currentDay into canvas');

console.log('✓ studio-day-night checks passed');
