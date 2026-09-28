/** k6e.2 feel-kit verification (source-assert + behavioral where DOM-free). */
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const baseDir = process.cwd();
const read = (p: string): string => fs.readFileSync(path.join(baseDir, p), 'utf8');

const css = read('src/components/chip-fidelity.css');
const header = read('src/components/GameHeader.tsx');
const notifs = read('src/components/NotificationSystem.tsx');

let passed = 0;
const ok = (cond: boolean, msg: string): void => {
  assert(cond, `FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

// Fidelity tokens: one motion language, bevel, grain, reduced-motion
for (const t of ['--chip-out', '--chip-spring', '.kenney-bevel', '.chip-grain', 'feTurbulence', '.settle-tick', '.deny-shake', '.press-ripple-ink', '.flame-pop'] as const) {
  ok(css.includes(t), `fidelity CSS owns ${t}`);
}
ok(css.includes('@media (prefers-reduced-motion: reduce)'), 'single reduced-motion block');
ok(css.includes('.press-ripple-ink { display: none;') || css.includes('.press-ripple-ink { display:none;') || /press-ripple-ink \{ display: none/.test(css), 'ripple disabled under reduced-motion');

// New components exist with the right contracts
const ticker = read('src/components/SettleTicker.tsx');
ok(ticker.includes('settle-tick') && ticker.includes('useEffect'), 'SettleTicker pulses on value rise');
const flame = read('src/components/StreakFlame.tsx');
ok(flame.includes('role="status"') && flame.includes('count < 2'), 'StreakFlame: sr status, hidden under 2d');
ok(css.includes('font-variant-numeric'), 'flame count uses tabular-nums (no HUD jitter)');
const ripple = read('src/components/ui/PressRipple.tsx');
ok(ripple.includes('aria-hidden') && ripple.includes('animationend'), 'PressRipple decorative + self-cleaning');

// Mounts in clean files only
ok(header.includes('chip-fidelity.css'), 'GameHeader loads fidelity CSS');
for (const m of ['SettleTicker', 'StreakFlame', 'PressRipple'] as const) {
  ok(header.includes(m), `GameHeader mounts ${m}`);
}
ok(header.includes('dailyTracking?.streakCount'), 'flame reads streak state');
ok(notifs.includes('deny-shake') && notifs.includes(`type === 'error'`), 'error toasts shake');
ok(notifs.includes('chip-fidelity.css'), 'NotificationSystem loads fidelity CSS');

// Dirty-zone discipline: none of the new kit references dirty in-flight files
const kit = css + ticker + flame + ripple;
for (const d of ['ActiveProject', 'StudioRoom', 'CareerHub', 'StudioStrip', 'MinigameChrome', 'StudioInspector'] as const) {
  ok(!kit.includes(d), `kit independent of dirty ${d}`);
}

console.log(`feel-kit: all ${passed} checks passed`);
