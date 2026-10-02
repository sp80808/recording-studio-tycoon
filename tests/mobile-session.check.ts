/** #141: static guards for the phone zero-scroll session console. The browser run lives in
 *  tests/mobile-session.check.cjs (needs a dev server + Playwright, so it is not part of pnpm test). */
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { PHONE_SESSION_QUERY } from '../src/hooks/usePhoneSession';

const read = (p: string): string => fs.readFileSync(path.join(process.cwd(), p), 'utf8');

// Same breakpoints as the CSS (phones and short/landscape windows), never tablet/desktop.
assert.strictEqual(PHONE_SESSION_QUERY, '(max-width: 540px), (max-height: 500px)');

const active = read('src/components/ActiveProject.tsx');
assert(active.includes('usePhoneSession()'), 'ActiveProject branches on the phone hook');
assert(active.includes('MobileSessionStatusStrip') && active.includes('MobileFocusMixer'), 'phone composition uses the extracted presentation components');
assert(active.includes('data-session-layout'), 'layout mode is exposed for e2e');
assert(active.includes('Session Focus Allocation'), 'desktop focus module is untouched');
assert(active.includes("takeState === 'tracking' ? ("), 'PocketMeter swaps into the centre workspace while armed');
// State stays authoritative in ActiveProject: the presentation components never touch game state.
for (const f of ['MobileSessionStatusStrip', 'MobileFocusMixer']) {
  const src = read(`src/components/console/${f}.tsx`);
  assert(!/setGameState|useGameState|evaluateTakeAccuracy/.test(src), `${f} is presentation-only`);
}
// One session shell: no second SessionView was introduced.
const stray = (fs.readdirSync(path.join(process.cwd(), 'src/components'), { recursive: true }) as unknown as string[])
  .map(String).filter(f => /SessionView/i.test(f));
assert.deepStrictEqual(stray, [], 'no SessionView duplicate');

const css = read('src/components/studio-play.css');
const phoneCss = css.slice(css.indexOf('#141'));
assert(phoneCss.includes('100dvh'), 'session shell uses dynamic viewport units');
assert(/safe-area-inset-bottom[^;]*\)\s*!important/.test(phoneCss), 'dock respects the bottom safe area');
assert(/studio-drawer-body \{\s*overflow:hidden !important/.test(phoneCss), 'phone session body never scrolls');
assert(!phoneCss.includes('.studio-drawer-tabs'), 'phone session CSS does not maintain a duplicate drawer tab rail');

const drawer = read('src/components/ContextDrawer.tsx');
const mainGame = read('src/components/MainGameContent.tsx');
assert(drawer.includes('studio-drawer-titleblock') && drawer.includes('studio-drawer-body'), 'drawer exposes phone hooks');
assert(drawer.includes('aria-labelledby="context-drawer-title"'), 'dialog keeps its accessible name');
assert(!drawer.includes('role="tablist"') && !drawer.includes('studio-drawer-tabs'), 'drawer does not duplicate the Studio activity navigation');
assert(mainGame.includes('aria-label="Studio activities"') && mainGame.includes('studio-command-dock'), 'Studio floor command dock is the navigation owner');
assert(!mainGame.includes('onTabChange={(tab:'), 'MainGameContent does not wire duplicate drawer tab switching');

// Reward targets must be mounted outside the closed-by-default details popover (P2 review).
const strip = read('src/components/console/MobileSessionStatusStrip.tsx');
const popoverAt = strip.indexOf('{open && (');
for (const id of ['id="creativity-points"', 'id="technical-points"', 'data-creativity-target', 'data-technical-target']) {
  const at = strip.indexOf(id);
  assert(at > -1 && at < popoverAt, `${id} is always mounted (before the popover)`);
  assert(strip.indexOf(id, at + 1) === -1, `${id} is not duplicated`);
}

console.log('PASS: #141 mobile session console static guards');
