/**
 * Take calibration (PocketMeter console check): the drawn Pocket and the graded
 * Pocket are one shared window, the rAF sweep never re-subscribes to
 * per-render identities (the every-frame clock-reset regression), the
 * assistance setting is wired end-to-end, and the keyboard / auto-lock /
 * needle-state affordances stay honest.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  evaluateTakeAccuracy,
  getTakeGoldWindow,
  TAKE_POCKET_WINDOW,
} from '@/rpg/takeEvaluation';

const meter = fs.readFileSync('src/components/console/PocketMeter.tsx', 'utf8');
const active = fs.readFileSync('src/components/ActiveProject.tsx', 'utf8');

let passed = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

const sourceNumber = (name: string): number => {
  const match = meter.match(new RegExp(`${name}:\\s*([0-9.]+)`));
  assert.ok(match, `PocketMeter must declare ${name}`);
  const value = Number(match[1]);
  assert.ok(Number.isFinite(value) && value > 0, `${name} must be a positive number`);
  return value;
};

// 1. Shared window: 'normal' keeps the historic 0.70–0.85 pocket; assistance
//    levels scale the width symmetrically around the same centre.
const normal = getTakeGoldWindow(0);
ok(Math.abs(normal.min - 0.70) < 1e-9 && Math.abs(normal.max - 0.85) < 1e-9, 'normal assistance keeps the historic 0.70–0.85 Gold pocket');
const strict = getTakeGoldWindow(0, 'strict');
const generous = getTakeGoldWindow(0, 'generous');
ok(strict.min > normal.min && strict.max < normal.max, 'strict narrows the pocket');
ok(generous.min < normal.min && generous.max > normal.max, 'generous widens the pocket');
ok(
  Math.abs((strict.min + strict.max) / 2 - TAKE_POCKET_WINDOW.center) < 1e-9 &&
  Math.abs((generous.min + generous.max) / 2 - TAKE_POCKET_WINDOW.center) < 1e-9,
  'assistance levels share the same pocket centre',
);
ok(
  TAKE_POCKET_WINDOW.assistanceWidth.strict === 0.07 &&
  TAKE_POCKET_WINDOW.assistanceWidth.normal === 0.15 &&
  TAKE_POCKET_WINDOW.assistanceWidth.generous === 0.25,
  'pocket widths match the settings copy (±7 / ±15 / ±25%)',
);

// 2. Grading agrees with the drawn window at the exact edges — the faceplate
//    confetti and the "LOCK GOLD TAKE!" state can never lie again.
const scenarios: Array<[number, 'strict' | 'normal' | 'generous']> = [
  [0, 'strict'],
  [0, 'normal'],
  [0.1, 'normal'],
  [1, 'normal'],
  [0.3, 'generous'],
  [0, 'generous'],
];
for (const [bonus, assistance] of scenarios) {
  const w = getTakeGoldWindow(bonus, assistance);
  const label = `bonus ${bonus}, ${assistance}`;
  ok(evaluateTakeAccuracy(w.min, bonus, assistance).grade === 'Gold', `low edge scores Gold (${label})`);
  ok(evaluateTakeAccuracy(w.max, bonus, assistance).grade === 'Gold', `high edge scores Gold (${label})`);
  if (w.min > 0) ok(evaluateTakeAccuracy(w.min - 0.001, bonus, assistance).grade === 'Silver', `a hair under the pocket is Silver, not Gold (${label})`);
  if (w.max < 1) ok(evaluateTakeAccuracy(w.max + 0.001, bonus, assistance).grade === 'Silver', `a hair over the pocket is Silver, not Gold (${label})`);
}

// 3. Chore timing bonus only widens the pocket and never leaves the scale.
const boosted = getTakeGoldWindow(2, 'normal');
ok(boosted.min < normal.min && boosted.max > normal.max, 'cleaned tape heads widen the pocket');
ok(boosted.min >= 0 && boosted.max <= 1, 'boosted pocket stays on the needle scale');

// 4. The drawn pocket reads the shared window (no drift, no local literals).
ok(meter.includes('getTakeGoldWindow'), 'PocketMeter draws the shared Gold window');
ok(!/0\.66|0\.88/.test(meter), 'no stale faceplate pocket literals (the 0.66/0.88 regression)');
ok(active.includes('settings.pocketMeterAssistance'), 'take grading honours the PocketMeter assistance setting');

// 5. Sweep-loop regression: the effect subscribes only to arm state and the
//    reduced-motion setting. The old dependency list included `gamepad` (a new
//    object every render) and `onLock`, so the per-frame re-render reset the
//    sweep start clock every frame and the needle never reached the pocket.
ok(meter.includes('}, [isArmed, settings.reducedMotion]);'), 'sweep effect depends only on arm state + reduced motion');
ok(!meter.includes('}, [isArmed, onLock, gamepad, goldMin, goldMax, settings.reducedMotion]);'), 'the identity-churning dependency list cannot come back');
ok(meter.includes('onLockRef') && meter.includes('hapticRef'), 'live callbacks are read through refs, not subscriptions');

// 6. Keyboard parity + auto-lock honesty + needle state exposure.
ok(/window\.addEventListener\('keydown'/.test(meter), 'keyboard lock listener while armed');
ok(meter.includes("event.key !== ' '") && meter.includes("event.key !== 'Enter'"), 'Space and Enter lock the take');
ok(meter.includes("target?.closest('button, input, select, textarea, [role=\"button\"]')"), 'focused controls keep native key semantics');
ok(meter.includes('AUTO-LOCK') && meter.includes('data-testid="auto-lock-drain"'), 'the auto-lock fallback is visible on the instrument');
ok(meter.includes('data-needle-state'), 'needle state is exposed for styling and tests');
ok(meter.includes('prefers-reduced-motion: reduce'), 'reduced motion keeps the static accessible path');
ok(meter.includes('role="meter"'), 'meter semantics retained for assistive tech');

// 7. Sweep simulation: re-derive pocket visits from the instrument geometry.
const center = sourceNumber('center');
const amplitude = sourceNumber('amplitude');
const cycle = sourceNumber('cycleSeconds');
const autoLock = sourceNumber('autoLockSeconds');
const posAt = (t: number) => Math.max(0.05, Math.min(0.98, center + amplitude * Math.sin((t * Math.PI * 2) / cycle)));

const pocketVisits = (w: { min: number; max: number }) => {
  const visits: number[] = [];
  let enteredAt: number | null = null;
  for (let t = 0; t <= autoLock; t += 0.002) {
    const inside = posAt(t) >= w.min && posAt(t) <= w.max;
    if (inside && enteredAt === null) enteredAt = t;
    if (!inside && enteredAt !== null) {
      visits.push(t - enteredAt);
      enteredAt = null;
    }
  }
  return visits;
};

const normalVisits = pocketVisits(normal);
ok(normalVisits.length >= 2, `the needle keeps offering pocket chances before the fallback (${normalVisits.length} visits)`);
ok(normalVisits.every(v => v >= 0.09 && v <= 0.16), 'each normal pocket crossing stays in a readable 90–160ms band');
const firstVisit = (w: { min: number; max: number }) => Math.min(...pocketVisits(w));
ok(firstVisit(strict) < firstVisit(normal), 'strict pockets demand tighter timing');
ok(firstVisit(generous) > firstVisit(normal), 'generous pockets hold longer for accessibility');
const passes = autoLock / cycle;
ok(passes >= 1.5 && passes <= 2, `fallback resolves after ~1.8 passes without becoming a wait (${passes.toFixed(2)})`);

// 3. #335/#339: who locked the take is visible, and accessible names carry the visible text.
ok(/onLockRef\.current\([^)]*'auto'\)/.test(meter) && /onLockRef\.current\(pos, 'player'\)/.test(meter), 'PocketMeter reports player vs auto lock source');
ok(/source === 'auto' \? 'Auto-locked' : 'Locked'/.test(active), 'take result text shows manual vs auto lock');
ok(/aria-label=\{`Lock take: \$\{lockLabel\}/.test(meter) && /<span>\{lockLabel\}<\/span>/.test(meter), 'Lock button name includes its visible label');
ok(/t\('active_arm_take'[^)]*\)\}\s*—/.test(active), 'Arm button name includes its visible ARM TAKE text');
ok(!/performDailyWork/.test(active.slice(active.indexOf('const handleArmTake'), active.indexOf('const handleStandDown'))), 'arming never spends energy or advances work');

console.log(`take-calibration: all ${passed} checks passed`);

