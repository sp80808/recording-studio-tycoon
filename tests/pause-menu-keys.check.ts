import assert from 'node:assert/strict';
import { shouldTogglePauseOnKey } from '../src/utils/pauseMenuKeys';

// Esc opens the menu from the game, but must not re-toggle while it is open
// (the dialog closes itself on Esc; a second toggle re-opened it).
assert.equal(shouldTogglePauseOnKey('Escape', false), true);
assert.equal(shouldTogglePauseOnKey('Escape', true), false);
// P still toggles both ways.
assert.equal(shouldTogglePauseOnKey('p', false), true);
assert.equal(shouldTogglePauseOnKey('P', true), true);
assert.equal(shouldTogglePauseOnKey('x', false), false);
console.log('pause-menu-keys: ok');
