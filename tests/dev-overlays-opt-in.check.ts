/**
 * DEV overlays must stay off by default and only appear via Settings opt-in.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';

const defaults = fs.readFileSync('src/data/defaultSettings.ts', 'utf8');
const types = fs.readFileSync('src/contexts/settings-context-types.ts', 'utf8');
const settingsCtx = fs.readFileSync('src/contexts/SettingsContext.tsx', 'utf8');
const devMenu = fs.readFileSync('src/components/DevMenu.tsx', 'utf8');
const settingsModal = fs.readFileSync('src/components/modals/SettingsModal.tsx', 'utf8');

assert.match(types, /devShowBoxDropButton:\s*boolean/);
assert.match(types, /devShowPerfHud:\s*boolean/);
assert.match(defaults, /devShowBoxDropButton:\s*false/);
assert.match(defaults, /devShowPerfHud:\s*false/);
assert.match(
  settingsCtx,
  /devShowBoxDropButton:\s*parsed\.devShowBoxDropButton\s*===\s*true/,
  'load path must coerce box-drop chrome to strict true'
);
assert.match(
  settingsCtx,
  /devShowPerfHud:\s*parsed\.devShowPerfHud\s*===\s*true/,
  'load path must coerce perf HUD to strict true'
);

assert.doesNotMatch(
  devMenu,
  /useState\(false\)/,
  'DevMenu must not locally force-show floating chrome'
);
assert.match(devMenu, /settings\.devShowBoxDropButton\s*===\s*true/);
assert.match(devMenu, /settings\.devShowPerfHud\s*===\s*true/);
assert.match(devMenu, /if\s*\(!showBoxDrop\s*&&\s*!showPerfHud\)\s*return null/);

assert.match(settingsModal, /Developer Tools/);
assert.match(settingsModal, /Show Spawn Box Drop/);
assert.match(settingsModal, /Show Perf HUD/);
assert.match(settingsModal, /Spawn Box Drop Now/);

console.log('✓ dev-overlays-opt-in checks passed');
