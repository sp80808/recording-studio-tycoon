import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { matchHotkey } from '../src/hooks/useStudioHotkeys';
import { DOCK_TABS } from '../src/contexts/GamepadNavContext';

const bindings = [
  { key: '1', label: 'Bookings' },
  { key: '2', label: 'Session' },
  { key: '?', label: 'Shortcuts' },
];

describe('studio hotkeys', () => {
  it('matches plain key presses only', () => {
    assert.equal(matchHotkey({ key: '1' }, bindings)?.label, 'Bookings');
    assert.equal(matchHotkey({ key: '?' }, bindings)?.label, 'Shortcuts');
    assert.equal(matchHotkey({ key: 'x' }, bindings), undefined);
  });

  it('ignores modified presses so browser shortcuts still work', () => {
    assert.equal(matchHotkey({ key: '1', ctrlKey: true }, bindings), undefined);
    assert.equal(matchHotkey({ key: '1', metaKey: true }, bindings), undefined);
    assert.equal(matchHotkey({ key: '2', altKey: true }, bindings), undefined);
  });

  it('binds one number per dock tab, in dock order, and never in the minigame tab', () => {
    const src = fs.readFileSync('src/components/MainGameContent.tsx', 'utf8');
    assert.match(src, /DOCK_TABS\.map\(\(id, index\)/);
    assert.match(src, /key: String\(index \+ 1\)/);
    assert.match(src, /useStudioHotkeys\(hotkeyBindings, panel !== 'session'/);
    assert.equal(DOCK_TABS.length, 7);
    assert.match(src, /aria-keyshortcuts/);
  });

  it('stands down for typing and dialogs', () => {
    const hook = fs.readFileSync('src/hooks/useStudioHotkeys.ts', 'utf8');
    assert.match(hook, /isTypingTarget\(e\.target\)/);
    assert.match(hook, /hasBlockingDialog\(\)/);
    assert.match(hook, /e\.repeat/);
  });
});
