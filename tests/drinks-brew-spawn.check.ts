/**
 * Candle-table drink props: spawn only after brew_espresso; clear on daily reset.
 * Placement must be the candle table — never desk or window sill.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  createInitialChoreState,
  executeStudioChore,
  refreshDailyChores,
} from '../src/simulation/choreEngine';
import {
  CANDLE_DRINK_SETTLE_SEC,
  CANDLE_MUG_POS,
  CANDLE_TABLE_TILE,
} from '../src/components/studio/studioDecor';
import { coffeeSteamStrength } from '../src/components/studio/studioFloorLife';

console.log('drinks-brew-spawn checks…');

// Chore loop: brew completes → drink flag true; day refresh → false
let chores = createInitialChoreState();
assert.equal(chores.chores.brew_espresso.completed, false, 'fresh day: brew pending');

const brewed = executeStudioChore(chores, 'brew_espresso', 1);
assert.ok(brewed, 'brew_espresso executes');
chores = brewed.nextChoreState;
assert.equal(chores.chores.brew_espresso.completed, true, 'brew marks completed');

chores = refreshDailyChores(chores, 2).nextChoreState;
assert.equal(chores.chores.brew_espresso.completed, false, 'day advance clears brew (drink despawns)');

// Steam FX gated by the same flag the floor passes as coffeeSteaming
assert.equal(coffeeSteamStrength(false, 1, false), 0, 'no steam before brew');
assert.ok(coffeeSteamStrength(true, 1, false) > 0, 'steam after brew');
assert.ok(CANDLE_DRINK_SETTLE_SEC > 0 && CANDLE_DRINK_SETTLE_SEC < 2, 'settle is a short pop-in');

// Placement: mug sits on the candle table tile, not desk/sill coords
assert.equal(CANDLE_TABLE_TILE.x, 6.55);
assert.equal(CANDLE_TABLE_TILE.y, 5.35);
assert.ok(Number.isFinite(CANDLE_MUG_POS.x) && Number.isFinite(CANDLE_MUG_POS.y));

const decor = readFileSync('src/components/studio/studioDecor.ts', 'utf8');
const webgl = readFileSync('src/components/WebGLCanvas.tsx', 'utf8');
const room = readFileSync('src/components/StudioRoom.tsx', 'utf8');

assert.match(decor, /export const buildCandleDrink/, 'candle drink builder exists');
assert.match(decor, /export const CANDLE_MUG_POS/, 'mug world pos exported for steam');
assert.match(decor, /Mug lives on the candle table after brew/, 'desk props doc: mug left the desk');
assert.doesNotMatch(
  decor.slice(decor.indexOf('export const buildDeskProps'), decor.indexOf('export const CANDLE_TABLE_TILE')),
  /getPropTexture\('mug'\)/,
  'desk props must not spawn the mug',
);
assert.match(decor, /const mugPos = CANDLE_MUG_POS/, 'steam targets candle mug, not desk');

assert.match(webgl, /buildCandleTable\(\)/, 'candle table mounted on floor');
assert.match(webgl, /buildCandleDrink\(\)/, 'drink container mounted');
assert.match(webgl, /coffeeSteaming/, 'scene reads brew flag');
assert.match(webgl, /CANDLE_DRINK_SETTLE_SEC/, 'settle animation wired');
assert.match(webgl, /paneTop \+ mullionInset/, 'window mullion clipped inside pane');
assert.doesNotMatch(webgl, /winMidY - 78, 4, 64/, 'orphan mullion stub removed');

assert.match(
  room,
  /coffeeSteaming:\s*Boolean\(gameState\.choreState\?\.chores\?\.brew_espresso\?\.completed\)/,
  'StudioRoom derives coffeeSteaming from brew_espresso.completed',
);

console.log('✓ drinks-brew-spawn checks passed');
