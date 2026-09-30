/**
 * Design-system guards (static): flat translucent chrome, dialogs that can actually be positioned.
 * These encode two real regressions/preferences so they cannot silently return:
 *  - `.rst-modal { position: ... }` in the later theme stylesheet overrode Tailwind's `fixed`, pushing
 *    every Radix dialog off-screen.
 *  - Controls and panels use flat translucent fills, not gradients.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync('src/styles/studio-theme.css', 'utf8');
const read = (p: string) => readFileSync(p, 'utf8');

/** Body of the first rule whose selector list contains `selector` exactly. */
const ruleBody = (source: string, selector: string): string => {
  const re = new RegExp(`(^|\\n)${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`);
  const m = re.exec(source);
  assert.ok(m, `rule ${selector} exists`);
  return m![2];
};

describe('design system: dialogs', () => {
  it('.rst-modal declares no positioning (it would override fixed/absolute utilities)', () => {
    assert.doesNotMatch(ruleBody(css, '.rst-modal'), /position\s*:/);
  });

  it('Radix dialog + alert dialog keep fixed centring and the shared modal frame', () => {
    for (const file of ['src/components/ui/dialog.tsx', 'src/components/ui/alert-dialog.tsx']) {
      const src = read(file);
      assert.match(src, /rst-modal[^"]*fixed left-\[50%\] top-\[50%\]/, `${file} centres with fixed positioning`);
    }
  });
});

describe('design system: flat, translucent chrome (no gradient fills)', () => {
  const flatSelectors = ['.rst-surface', '.rst-modal', '.rst-btn', '.rst-btn-primary', '.rst-btn-success', '.rst-btn-danger', '.rst-option', '.rst-duty-chip', '.rst-toast', '.rst-chip'];
  it('core control/panel classes contain no gradients', () => {
    for (const sel of flatSelectors) {
      assert.doesNotMatch(ruleBody(css, sel), /gradient/, `${sel} is flat`);
    }
  });

  it('GamePanel variants are flat translucent fills', () => {
    const panel = read('src/components/ui/GamePanel.tsx');
    const variants = panel.slice(panel.indexOf('VARIANT_BORDER_BG'), panel.indexOf('GLOW_STYLES'));
    assert.doesNotMatch(variants, /gradient|from-|via-|to-\[/, 'GamePanel variants carry no gradient');
    assert.match(variants, /rgba\(/, 'and use translucent fills');
  });

  it('HUD, dock and primary action are flat', () => {
    const play = read('src/components/studio-play.css');
    for (const sel of ['.studio-primary-action', '.studio-command-dock']) {
      const line = play.split('\n').find((l) => l.startsWith(`${sel} {`));
      assert.ok(line, `${sel} defined`);
      assert.doesNotMatch(line!, /gradient/, `${sel} is flat`);
    }
    const hud = play.split('\n').find((l) => l.startsWith('.studio-hud-stats > *,'));
    assert.ok(hud && !/gradient/.test(hud), 'HUD pills are flat');
  });

  it('every KenneyButton variant maps to a shared studio button class', () => {
    const src = read('src/components/ui/KenneyButton.tsx');
    for (const v of ['yellow', 'green', 'red', 'grey', 'blue']) assert.match(src, new RegExp(`${v}:\\s*'rst-btn`), `variant ${v}`);
    assert.doesNotMatch(src, /borderImage/, 'sprite border-image (hollow outline) is gone');
  });

  it('blue is not used for text in game chrome (ivory / brass / stone instead)', () => {
    const files = ['src/components/CareerHub.tsx', 'src/components/ProjectList.tsx', 'src/components/ContextDrawer.tsx', 'src/components/GameHeader.tsx', 'src/components/CareerStartScreen.tsx'];
    for (const f of files) assert.doesNotMatch(read(f), /text-(sky|blue|indigo)-\d/, `${f} has no blue text`);
  });
});
