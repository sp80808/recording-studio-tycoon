import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  formatStudioCountdown,
  formatStudioTime,
  getStudioClockSnapshot,
  getStudioDayDurationMs,
  STUDIO_DAY_START_MINUTES,
} from '../src/game-mechanics/studioTime';

console.log('studio clock progression checks…');

assert.equal(getStudioDayDurationMs('easy'), 8 * 60_000, 'easy leaves the most room to plan');
assert.equal(getStudioDayDurationMs('medium'), 6 * 60_000, 'medium preserves the original visual-day cadence');
assert.equal(getStudioDayDurationMs('hard'), 4 * 60_000, 'hard applies real schedule pressure');

const start = getStudioClockSnapshot(0, 'medium');
const midday = getStudioClockSnapshot(getStudioDayDurationMs('medium') / 6, 'medium');
const close = getStudioClockSnapshot(getStudioDayDurationMs('medium'), 'medium');
assert.equal(start.minutesOfDay, STUDIO_DAY_START_MINUTES, 'each playable day starts at 08:00');
assert.equal(start.formattedTime, '08:00');
assert.equal(midday.formattedTime, '12:00');
assert.equal(close.formattedTime, '08:00', 'the clock wraps exactly when the next day is due');
assert.equal(close.progress, 1);
assert.equal(formatStudioTime(-1), '23:59');
assert.equal(formatStudioCountdown(61_001), '1:02');

const provider = readFileSync('src/contexts/StudioClockContext.tsx', 'utf8');
const webgl = readFileSync('src/components/WebGLCanvas.tsx', 'utf8');
const inspector = readFileSync('src/components/StudioInspector.tsx', 'utf8');
const header = readFileSync('src/components/GameHeader.tsx', 'utf8');
assert.match(provider, /document\.hidden/, 'background tabs do not burn studio days');
assert.match(provider, /completeRef\.current\(\)/, 'the existing advance-day action remains authoritative');
assert.match(webgl, /s\.clockMinutes/, 'wall clock and window accept the shared playable-day clock');
assert.match(inspector, /Next day in/, 'calendar explains its automatic rollover');
assert.match(header, /studio-hud-time/, 'HUD exposes the live studio time');

console.log('✓ studio clock progression checks passed');
