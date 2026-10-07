import assert from 'node:assert/strict';
import {
  CLOSED_PAUSE_NAV, pauseNavBack, pauseNavHasLayer, pauseNavOpenSettings, pauseNavTogglePause,
} from '../src/utils/pauseMenuNav';

const open = pauseNavTogglePause(CLOSED_PAUSE_NAV);
assert.equal(open.pauseOpen, true);
// Top level: back closes and resumes.
assert.deepEqual(pauseNavBack(open), CLOSED_PAUSE_NAV);
// Sub views step back to the pause menu, not out of it.
for (const view of ['controls', 'quit'] as const) {
  const sub = pauseNavBack({ ...open, view });
  assert.equal(sub.pauseOpen, true);
  assert.equal(sub.view, 'main');
}
// Settings opened from pause returns to pause, then a second back resumes.
const inSettings = pauseNavOpenSettings(open);
assert.equal(inSettings.pauseOpen, false);
assert.equal(inSettings.settingsOpen, true);
assert.equal(pauseNavHasLayer(inSettings), true);
const back1 = pauseNavBack(inSettings);
assert.equal(back1.pauseOpen, true);
assert.equal(back1.settingsOpen, false);
assert.deepEqual(pauseNavBack(back1), CLOSED_PAUSE_NAV);
// Settings opened from the game does not force the pause menu open.
const direct = pauseNavBack({ ...CLOSED_PAUSE_NAV, settingsOpen: true });
assert.equal(direct.pauseOpen, false);
assert.equal(direct.settingsOpen, false);
// Back with nothing open is a no-op.
assert.deepEqual(pauseNavBack(CLOSED_PAUSE_NAV), CLOSED_PAUSE_NAV);
assert.equal(pauseNavHasLayer(CLOSED_PAUSE_NAV), false);
console.log('pause-menu-nav: ok');
