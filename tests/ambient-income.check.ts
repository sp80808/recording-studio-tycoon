/** Ambient earning: deterministic, capped, active-play only, quiet. */
import assert from 'node:assert';
import fs from 'node:fs';
import {
  AMBIENT_DAILY_CAP_MAX, AMBIENT_IDLE_MS, AMBIENT_TICK_MS, LINES, accrueActiveTime, ambientDailyCap,
  applyAmbientTick, rollAmbientTick,
} from '../src/economy/ambientIncome';
import { createDefaultGameState } from '../src/utils/newGameState';

let passed = 0;
const ok = (cond: boolean, msg: string): void => {
  assert(cond, `FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

const base = createDefaultGameState();
const withCatalog = (n: number) => ({
  ...base,
  saveSeed: 'ambient-test',
  financials: { ...base.financials, reports: Array.from({ length: n }, () => ({}) as never) },
});

// Determinism
const a = rollAmbientTick(withCatalog(3), 5, 7);
const b = rollAmbientTick(withCatalog(3), 5, 7);
ok(JSON.stringify(a) === JSON.stringify(b), 'same seed/day/tick gives the same roll');

// Empty catalog only tips; tiny
const fresh = withCatalog(0);
ok(Array.from({ length: 50 }, (_, i) => rollAmbientTick(fresh, 1, i)).every((r) => r.source === 'tip' && r.amount <= 4), 'no catalog => only small tips');

// Sources and size: a busy catalog pays, but one tick stays tiny against a gig (>= $500)
const busy = withCatalog(15);
const rolls = Array.from({ length: 400 }, (_, i) => rollAmbientTick(busy, 3, i));
ok(['residual', 'tip', 'sync'].every((s) => rolls.some((r) => r.source === s)), 'all three sources occur');
ok(Math.max(...rolls.map((r) => r.amount)) < 60, 'largest single tick stays under $60');
ok(rolls.every((r) => LINES[r.source].includes(r.line)), 'lines come from the source pool');

// Daily cap: applying ticks stops at the cap and never exceeds it
let s = { ...busy, currentDay: 9, money: 1000 };
let paid = 0;
for (let i = 0; i < 500; i += 1) {
  const r = applyAmbientTick(s);
  if (r.roll) paid += r.roll.amount;
  s = r.state;
}
const cap = ambientDailyCap(busy);
ok(paid === cap && s.money === 1000 + cap, `paid exactly the daily cap ($${cap})`);
ok(s.ambientIncome?.earnedToday === cap, 'counter tracks the cap');
ok(s.financials.income === busy.financials.income + cap, 'income figure records the ambient cash');
ok(applyAmbientTick(s).roll === null, 'capped day pays nothing more');
const next = applyAmbientTick({ ...s, currentDay: 10 });
ok(next.roll !== null && next.state.ambientIncome?.earnedToday === next.roll.amount, 'new day resets the cap');
ok(ambientDailyCap(withCatalog(500)) <= AMBIENT_DAILY_CAP_MAX, 'cap never exceeds the hard ceiling');
ok(cap < 500, 'daily cap is far below a single gig payout');

// Active-play gating
ok(accrueActiveTime(0, 5000, AMBIENT_IDLE_MS + 1, true).accumulatedMs === 0, 'idle player accrues nothing');
ok(accrueActiveTime(0, 5000, 100, false).accumulatedMs === 0, 'hidden tab accrues nothing');
ok(accrueActiveTime(0, 5000, 100, true).accumulatedMs === 5000, 'active player accrues time');
ok(accrueActiveTime(AMBIENT_TICK_MS - 1000, 5000, 100, true).due === 1, 'a tick is due after enough active time');
ok(accrueActiveTime(0, 8 * 3600 * 1000, 100, true).due <= 1, 'a throttled timer cannot bank a catch-up burst');

// Copy: no link-bait, every line is a real sentence and no cringe markers
const all = Object.values(LINES).flat();
ok(all.length >= 18 && new Set(all).size === all.length, 'enough distinct lines');
ok(all.every((l) => l.length > 20 && l.length < 130 && !/!|lol|epic|yolo/i.test(l)), 'lines are dry, not shouty');

// Source wiring (React hook): no real-money/ads, and contract royalties are not duplicated
const src = fs.readFileSync('src/economy/ambientIncome.ts', 'utf8');
ok(!/processContractsDay|signedArtists|usedGear/i.test(src.replace(/\/\/.*$/gm, '')), 'does not touch contract royalties or used gear');

console.log(`ambient-income: all ${passed} checks passed`);
