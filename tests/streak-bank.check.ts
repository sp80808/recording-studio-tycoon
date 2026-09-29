/** k6e.5 Streak Bank verification — pure zone/quote invariants + wiring. */
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

import {
  CHARGE_MS,
  GOLD_ZONE,
  MIN_BANK_COMBO,
  PREVIEW_COMBO,
  ZONE_MULTIPLIER,
  evaluateRelease,
  goldMaxCash,
  quoteBank,
  zoneForProgress,
} from '@/rpg/streakBank';

const read = (p: string): string => fs.readFileSync(path.join(process.cwd(), p), 'utf8');
let passed = 0;
const ok = (cond: boolean, msg: string): void => {
  assert(cond, `FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};
const near = (a: number, b: number, eps = 1e-9): boolean => Math.abs(a - b) <= eps;

// ── Tuning constants ──────────────────────────────────────────────────────
ok(MIN_BANK_COMBO === 3 && PREVIEW_COMBO === 2, 'unlock at combo 3, preview at 2');
ok(CHARGE_MS === 1600, 'charge sweep is 1600ms');
ok(near(GOLD_ZONE[1] - GOLD_ZONE[0], 0.14, 1e-6), 'gold window is 14% wide');
ok(GOLD_ZONE[0] === 0.68 && GOLD_ZONE[1] === 0.82, 'gold window sits at 68-82%');

// ── Zone coverage: no gaps, no overlaps, safe NaN handling ────────────────
const cases: Array<[number, string]> = [
  [-0.2, 'early'], [0, 'early'], [0.6799, 'early'],
  [0.68, 'gold'], [0.8199, 'gold'],
  [0.82, 'late'], [0.999, 'late'],
  [1, 'filled'], [5, 'filled'], [Number.NaN, 'filled'],
];
for (const [p, want] of cases) {
  ok(zoneForProgress(p) === want, `progress ${String(p)} → ${want}`);
}
let early = 0; let goldHits = 0; let late = 0; let filled = 0;
for (let i = 0; i <= 1000; i += 1) {
  const z = zoneForProgress(i / 1000);
  if (z === 'early') early += 1; else if (z === 'gold') goldHits += 1;
  else if (z === 'late') late += 1; else filled += 1;
}
ok(early === 680 && goldHits === 140 && late === 180 && filled === 1,
  `sweep partitions cleanly (680/140/180/1) — got ${early}/${goldHits}/${late}/${filled}`);

// ── Quote curve: tier caps, level scaling, XP cap, monotonicity ───────────
ok(quoteBank(3, 5).tier === 0.75, 'combo 3 tier ×0.75');
ok(quoteBank(4, 5).tier === 1 && quoteBank(5, 5).tier === 1, 'combo 4-5 tier ×1.0');
ok(quoteBank(6, 5).tier === 1.25 && quoteBank(50, 5).tier === 1.25, 'combo ≥6 tier capped ×1.25');
ok(quoteBank(4, 5).cash === 85, 'level 5 combo 4 safe quote = $85');
ok(quoteBank(4, 1).cash === 45, 'level 1 combo 4 safe quote = $45');
ok(quoteBank(3, 1).xp === 12, 'combo 3 grants 12 XP');
ok(quoteBank(20, 9).xp === 30, 'XP soft-capped at 30');
ok(quoteBank(4, 9).cash > quoteBank(4, 5).cash && quoteBank(4, 5).cash > quoteBank(4, 1).cash,
  'quote scales monotonically with level');

// ── Release evaluation: multipliers, streak rules, payout bounds ──────────
const l5c4 = { combo: 4, level: 5 };
const earlyR = evaluateRelease(l5c4.combo, l5c4.level, 0.3);
const goldR = evaluateRelease(l5c4.combo, l5c4.level, 0.75);
const lateR = evaluateRelease(l5c4.combo, l5c4.level, 0.9);
const fillR = evaluateRelease(l5c4.combo, l5c4.level, 1);
ok(earlyR.cash === 72 && earlyR.multiplier === 0.85 && !earlyR.keepsCombo, 'early release: ×0.85, $72, streak spent');
ok(goldR.cash === 136 && goldR.keepsCombo, 'gold release: ×1.6, $136, streak KEPT');
ok(lateR.cash === 77 && !lateR.keepsCombo, 'late release: ×0.9, $77, streak spent');
ok(fillR.cash === 85 && !fillR.keepsCombo, 'filled floor: ×1.0, $85');
ok(ZONE_MULTIPLIER.gold > ZONE_MULTIPLIER.filled && ZONE_MULTIPLIER.filled > ZONE_MULTIPLIER.late
  && ZONE_MULTIPLIER.late > ZONE_MULTIPLIER.early, 'multiplier ordering gold > filled > late > early');
ok(goldMaxCash(4, 5) === 136 && goldMaxCash(4, 5) > quoteBank(4, 5).cash, 'HUD gold max beats safe quote');
ok(evaluateRelease(3, 1, 0.99).cash >= 1 && evaluateRelease(50, 1, 0).cash >= 1, 'payout never drops below $1');
const blindEv = 0.68 * ZONE_MULTIPLIER.early + 0.14 * ZONE_MULTIPLIER.gold + 0.18 * ZONE_MULTIPLIER.late;
ok(blindEv < ZONE_MULTIPLIER.filled, `blind timed release EV ${blindEv.toFixed(3)} < 1.0 patience floor`);

// ── Wiring: dock render, state settlement, test registration ──────────────
const active = read('src/components/ActiveProject.tsx');
ok(active.includes('<StreakBankControl'), 'ActiveProject renders StreakBankControl in the transport dock');
ok(active.includes('comboCount: result.keepsCombo ? prev.activeProject.comboCount : 0'),
  'bank settlement resets combo unless gold kept it');
ok(active.includes('money: prev.money + result.cash') && active.includes('xp: prev.playerData.xp + result.xp'),
  'settlement credits money and XP through setGameState');
const control = read('src/components/StreakBankControl.tsx');
for (const t of ['useReducedMotion', 'role="status"', 'setPointerCapture', 'handleKeyDown', "justPressed.select",
  'visibilitychange', 'AnimatedCounter', 'triggerMilestoneCelebration', 'GOLD_ZONE', 'CHARGE_MS']) {
  ok(control.includes(t), `control uses ${t}`);
}
ok(control.includes("if (!reduceMotion) triggerMilestoneCelebration"),
  'confetti gated behind reduced motion (audio/haptics stay on)');
const runner = read('scripts/run-checks.sh');
ok(runner.includes('streak-bank'), 'run-checks.sh registers streak-bank');
const types = read('src/types/game.ts');
ok(types.includes('comboCount'), 'Project type carries comboCount');
const work = read('src/hooks/useStageWork.tsx');
ok(work.includes('project.comboCount || 0') || work.includes('(project.comboCount || 0) + 1'),
  'work loop still grows the combo the bank draws from');

console.log(`streak-bank: all ${passed} checks passed`);
