/**
 * #324 / #325 / #326 regression checks (DOM-free): display-mode fullscreen policy, the shared
 * safe-area / touch contract, the notification placement policy, and era decade labels.
 * Browser-level geometry lives in tests/mobile-shell.browser.check.cjs.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const store: Record<string, string> = {};
// Minimal document: chrome store dataset + enough surface for Sonner's import-time style injection.
Object.defineProperty(globalThis, 'document', {
  value: {
    documentElement: { dataset: store },
    head: { appendChild() {} },
    createElement: () => ({ appendChild() {}, setAttribute() {} }),
    createTextNode: () => ({}),
    getElementsByTagName: () => [{ appendChild() {} }],
  },
  configurable: true,
});

import { readAppDisplayMode, shouldShowFullscreenControl, isMobileShell } from '../src/lib/appDisplayMode';
import {
  deriveChromeState,
  resolveNotificationPlacement,
  laneFor,
  shouldDefer,
  type ChromeState,
} from '../src/lib/notificationPlacement';
import { AVAILABLE_ERAS, eraDecadeLabel } from '../src/data/eras';
import { openingBrief } from '../src/rpg/careerSetup';
import { CITIES } from '../src/rpg/cities';
import { useUiChromeStore } from '../src/stores/uiChromeStore';

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');
let passed = 0;
const ok = (cond: boolean, msg: string) => {
  assert.ok(cond, `FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

// ---- #324 fullscreen control policy ------------------------------------------------------
const env = (active: string[], navigatorStandalone?: boolean) => ({
  matchMedia: (q: string) => ({ matches: active.includes(q) }),
  navigatorStandalone,
});
const desktop = readAppDisplayMode(env([]));
ok(shouldShowFullscreenControl(desktop), 'desktop browser shows the fullscreen control');
ok(!isMobileShell(desktop), 'desktop is not the mobile shell');
const phoneQuery = '(max-width: 767px), (max-height: 500px) and (pointer: coarse)';
ok(!shouldShowFullscreenControl(readAppDisplayMode(env([phoneQuery]))), 'compact phone width hides fullscreen');
ok(!shouldShowFullscreenControl(readAppDisplayMode(env(['(pointer: coarse)']))), 'coarse pointer hides fullscreen');
ok(!shouldShowFullscreenControl(readAppDisplayMode(env(['(display-mode: standalone)']))), 'installed standalone PWA hides fullscreen');
ok(!shouldShowFullscreenControl(readAppDisplayMode(env(['(display-mode: fullscreen)']))), 'fullscreen display mode hides fullscreen');
ok(!shouldShowFullscreenControl(readAppDisplayMode(env([], true))), 'iOS navigator.standalone hides fullscreen');
ok(shouldShowFullscreenControl(readAppDisplayMode({})), 'missing matchMedia (SSR / old browser) falls back to the desktop default');
ok(readAppDisplayMode({ matchMedia: () => { throw new Error('boom'); } }).installed === false, 'matchMedia failure does not throw');

const header = read('src/components/GameHeader.tsx');
ok(/showFullscreen && \(/.test(header) && header.includes('useAppDisplayMode'), 'GameHeader omits (not disables) the fullscreen button');
ok(!/userAgent|iPhone|iPad/i.test(header + read('src/lib/appDisplayMode.ts') + read('src/hooks/useAppDisplayMode.ts')), 'no UA sniffing in display-mode detection');

// ---- #324 safe-area + touch contract ------------------------------------------------------
const shell = read('src/styles/mobile-shell.css');
for (const token of ['--rst-safe-top', '--rst-safe-right', '--rst-safe-bottom', '--rst-safe-left', '--rst-mobile-top-gutter', '--rst-touch-target: 44px', '--rst-top-inset']) {
  ok(shell.includes(token), `shell contract defines ${token}`);
}
const mobileGutter = /--rst-mobile-top-gutter:\s*(\d+)px;\s*}/.exec(shell.slice(shell.indexOf('@media (max-width: 767px), (pointer: coarse)')));
ok(!!mobileGutter && +mobileGutter[1] >= 10 && +mobileGutter[1] <= 16, 'mobile top gutter is 10-16px below the safe-area inset');
ok(read('src/main.tsx').includes("mobile-shell.css"), 'shell contract is loaded app-wide');
const play = read('src/components/studio-play.css');
ok(/\.studio-hud \{[^}]*padding:var\(--rst-top-inset\)/.test(play), 'gameplay HUD starts at safe-area + gutter');
ok(play.includes('min-width:var(--rst-touch-target)'), 'HUD icon buttons use the 44px touch token on phones');
ok(!/--studio-hud-clearance:\s*calc\(\d+px \+ env\(safe-area-inset-top/.test(play), 'HUD clearance no longer hard-codes env() + px');
const career = read('src/components/CareerStartScreen.tsx');
ok(career.includes('pt-[var(--rst-top-inset)]') && career.includes('rst-top-action'), 'career setup Back / Quick start use the top inset and 44px action class');
ok(/\.rst-top-action \{[^}]*min-height: var\(--rst-touch-target\)/.test(shell), 'rst-top-action meets the touch target');

// ---- #324 manifest: standalone-first ------------------------------------------------------
const manifest = JSON.parse(read('public/manifest.webmanifest'));
ok(manifest.display === 'standalone' && manifest.display_override[0] === 'standalone', 'PWA manifest prefers standalone (native-feeling shell, system safe areas stay predictable)');

// ---- #325 placement policy ----------------------------------------------------------------
const states: ChromeState[] = ['idle', 'first-session', 'session', 'take-calibration', 'drawer', 'modal'];
for (const s of states) {
  const p = resolveNotificationPlacement(s, true);
  ok(p.capacity <= 1, `compact ${s}: at most one foreground card`);
  ok(p.lane !== 'corner' && p.criticalLane !== 'corner', `compact ${s}: never uses the wide-screen corner stack`);
}
ok(resolveNotificationPlacement('idle', true).lane === 'top', 'idle studio uses the top rail');
ok(resolveNotificationPlacement('first-session', true).lane === 'top', 'first-session guide state keeps feedback off the bottom band');
ok(resolveNotificationPlacement('session', true).lane === 'session', 'session console uses the free band under its header');
const calib = resolveNotificationPlacement('take-calibration', true);
ok(shouldDefer(calib, 'important') && shouldDefer(calib, 'critical'), 'take calibration defers all feedback');
for (const s of ['drawer', 'modal'] as const) {
  const p = resolveNotificationPlacement(s, true);
  ok(shouldDefer(p, 'important'), `${s}: routine feedback waits`);
  ok(laneFor(p, 'critical') === 'session', `${s}: errors pre-empt in the mid band, not over the dock`);
}
const sideways = resolveNotificationPlacement('session', true, true);
ok(shouldDefer(sideways, 'important') && laneFor(sideways, 'critical') === 'session', 'short landscape: session console has no free band, so routine feedback waits');
ok(resolveNotificationPlacement('idle', true, true).lane === 'top', 'short landscape idle still uses the top rail (CSS pins it right)');
const wide = resolveNotificationPlacement('idle', false);
ok(wide.lane === 'corner' && wide.capacity >= 2, 'desktop keeps the multi-toast corner stack');
ok(!states.some((s) => resolveNotificationPlacement(s, false).lane === 'hold'), 'desktop never defers feedback');

ok(deriveChromeState({ takeCalibrationFocused: true, consoleFocused: true, surfaces: ['drawer', 'modal'] }) === 'take-calibration', 'take calibration outranks everything');
ok(deriveChromeState({ takeCalibrationFocused: false, consoleFocused: false, surfaces: ['coach', 'drawer'] }) === 'drawer', 'drawer outranks the coach');
ok(deriveChromeState({ takeCalibrationFocused: false, consoleFocused: false, surfaces: ['session-panel'] }) === 'session', 'session panel is its own state');
ok(deriveChromeState({ takeCalibrationFocused: false, consoleFocused: false, surfaces: ['coach'] }) === 'first-session', 'coach alone is first-session');
ok(deriveChromeState({ takeCalibrationFocused: false, consoleFocused: false, surfaces: [] }) === 'idle', 'nothing open is idle');

// Store: surfaces mirror to data-chrome-busy and release cleanly.
const chrome = useUiChromeStore.getState();
chrome.setSurface('a', 'drawer');
ok(store.chromeBusy === 'drawer', 'drawer sets data-chrome-busy');
chrome.setSurface('b', 'modal');
chrome.setSurface('a', null);
ok(store.chromeBusy === 'modal', 'modal still busy after the drawer closes');
chrome.setSurface('b', null);
ok(store.chromeBusy === undefined, 'last surface released clears data-chrome-busy');

// Both hosts share one lane on phones.
const toaster = read('src/components/ui/toaster.tsx');
ok(toaster.includes('resolveNotificationPlacement') && toaster.includes('visibleToasts={placement.capacity}'), 'Sonner capacity and lane come from the shared policy');
ok(!toaster.includes('bottom-right'), 'Sonner no longer parks phone toasts bottom-right');
const notifs = read('src/components/NotificationSystem.tsx');
ok(notifs.includes('return null') && /toast\(\{/.test(notifs) && !notifs.includes('if (compact) return'), 'game notifications forward into the single Sonner rail at every width');
ok(!notifs.includes('rst-game-notifications') && !notifs.includes('fixed bottom-4'), 'no second legacy notification stack that could overlap Sonner on desktop');
ok(!read('src/components/first-session-guide.css').includes('.rst-game-notifications'), 'no scattered per-host notification overrides remain');
ok(/\.rst-toaster \{ pointer-events: none; \}/.test(shell) && shell.includes('[data-sonner-toast] { pointer-events: auto; }'), 'rail only captures pointer events on the card itself');

// Deferral bridge: take-calibration holds a toast and releases it afterwards.
Object.defineProperty(globalThis, 'window', {
  value: { matchMedia: (q: string) => ({ matches: q.includes('max-width: 767px'), media: q, addEventListener() {}, removeEventListener() {} }) },
  configurable: true,
});
(async () => {
  const { toast, __deferredToastCount } = await import('../src/hooks/use-toast');
  const { toastGate } = await import('../src/lib/toastGate');
  toastGate.reset();
  useUiChromeStore.getState().setTakeCalibrationFocused(true);
  toast({ title: 'Achievement unlocked', description: 'First booking' });
  ok(__deferredToastCount() === 1, 'phone toast during take calibration is deferred, not shown');
  toast({ title: 'Achievement unlocked', description: 'First booking' });
  ok(__deferredToastCount() === 1, 'duplicate deferred toast coalesces via the gate');
  useUiChromeStore.getState().setTakeCalibrationFocused(false);
  ok(__deferredToastCount() === 0, 'deferred toast is released when calibration ends');

  // A card already on screen yields when a drawer takes over, then returns when it closes.
  toastGate.reset();
  toast({ title: 'Working: Clean Tape Heads', description: '+1 unit' });
  ok(__deferredToastCount() === 0, 'idle phone toast shows immediately');
  useUiChromeStore.getState().setSurface('drawer-1', 'drawer');
  ok(__deferredToastCount() === 1, 'a visible toast yields (re-queues) when a drawer opens');
  useUiChromeStore.getState().setSurface('drawer-1', null);
  ok(__deferredToastCount() === 0, 'and returns when the drawer closes');

  // ---- #326 era labels ----------------------------------------------------------------------
  const labels = [...AVAILABLE_ERAS].sort((a, b) => a.startYear - b.startYear).map((e) => eraDecadeLabel(e.startYear));
  ok(JSON.stringify(labels) === JSON.stringify(['1960s', '1980s', '2000s', '2020s']), 'era picker labels are 1960s / 1980s / 2000s / 2020s');
  ok(eraDecadeLabel(2024) === '2020s' && eraDecadeLabel(2026) === '2020s', 'a concrete year can never leak as "2024s"');
  ok(AVAILABLE_ERAS.find((e) => e.id === 'modern')!.startYear === 2020, 'modern era starts on the 2020 boundary shared with eraProgression');
  const la = CITIES.find((c) => c.name === 'Los Angeles')!;
  ok(openingBrief(la.id, 'modern')?.headline === 'LOS ANGELES · 2020s', 'opening brief reads "LOS ANGELES · 2020s"');
  for (const file of ['src/components/CareerStartScreen.tsx', 'src/components/EraSelectionModal.tsx', 'src/rpg/careerSetup.ts']) {
    ok(!/startYear\}?s\b/.test(read(file)) && !/\{[^}]*startYear\}s/.test(read(file)), `${file} never renders startYear + "s"`);
  }
  console.log(`mobile-shell: all ${passed} checks passed`);
})().catch((e) => { console.error(e); process.exit(1); });
