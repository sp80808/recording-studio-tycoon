/** Balance Lab (#57): overrides sit on top of the typed config, stay in safe ranges, and reset exactly. */
import {
  TUNABLES, baselineValue, clampTunable, setOverride, resetGroup, toConfigOverrides, diffAgainstBaseline, effectiveConfig,
} from '../src/dev/balance/tunables';
import { DEFAULT_BALANCE_CONFIG, SCENARIOS, resolveConfig } from '../src/dev/balance/config';
import { runScenarioSweep } from '../src/dev/balance/sweep';

let n = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); n++; console.log(`PASS: ${m}`); };

ok(TUNABLES.length >= 12 && TUNABLES.length <= 25, 'the lab exposes 12-25 documented tunables');
ok(TUNABLES.every((t) => t.why.length > 20 && t.min < t.max && t.step > 0), 'every tunable has a reason and a sane range');
ok(TUNABLES.every((t) => baselineValue(t.path) >= t.min && baselineValue(t.path) <= t.max), 'every baseline sits inside its safe range');
ok(new Set(TUNABLES.map((t) => t.path)).size === TUNABLES.length, 'no tunable is listed twice');
ok(new Set(TUNABLES.map((t) => t.group)).size === 4, 'tunables cover enquiries, sessions, outcomes and economy');

// Safe ranges.
const cash = TUNABLES.find((t) => t.path === 'startingCash')!;
ok(clampTunable('startingCash', -50) === cash.min && clampTunable('startingCash', 1e9) === cash.max, 'values clamp into the safe range');
ok(clampTunable('startingCash', Number.NaN) === baselineValue('startingCash'), 'a non-number falls back to the baseline');
ok(clampTunable('minigameRate', 0.33) === 0.35, 'values snap to the step');
let threw = false; try { clampTunable('notAThing', 1); } catch { threw = true; }
ok(threw, 'unknown tunables are refused');

// Overrides and reset.
let o = setOverride({}, 'startingCash', 4000);
ok(o.startingCash === 4000 && Object.keys(o).length === 1, 'setting a value records one override');
ok(Object.keys(setOverride(o, 'startingCash', baselineValue('startingCash'))).length === 0, 'setting a value back to the baseline removes the override');
o = setOverride(setOverride(o, 'dailyCost', 90), 'projectsPerDay', 5);
ok(Object.keys(resetGroup(o, 'Economy')).join() === 'projectsPerDay', 'reset group clears only that group');
ok(JSON.stringify(effectiveConfig({}, {})) === JSON.stringify(resolveConfig({})) && JSON.stringify(effectiveConfig({}, {})) === JSON.stringify(DEFAULT_BALANCE_CONFIG), 'no overrides is exactly the repository baseline');
ok(JSON.stringify(effectiveConfig({}, resetGroup(resetGroup(resetGroup(resetGroup(o, 'Economy'), 'Enquiries'), 'Sessions'), 'Outcomes'))) === JSON.stringify(DEFAULT_BALANCE_CONFIG), 'resetting every group restores the baseline exactly');
const nested = toConfigOverrides({ 'play.minigamePoints': 9 });
ok((nested.play as { minigamePoints: number }).minigamePoints === 9, 'nested play overrides map onto the config');
const d = diffAgainstBaseline(o);
ok(d.length === Object.keys(o).length && d.every((x) => x.baseline !== x.value), 'the diff lists only values that differ from the baseline');

// Presets and sweeps.
ok(['early', 'mid', 'late', 'first-hire', 'high-rep-capacity-pressure', 'label-prestige'].every((k) => k in SCENARIOS), 'scenario presets include the lab set');
ok(Object.values(SCENARIOS).every((s) => TUNABLES.every((t) => { const v = (s as Record<string, number>)[t.path]; return v === undefined || (v >= t.min && v <= t.max); })), 'every preset stays inside the lab ranges');
const base = runScenarioSweep({ scenario: 'early', seeds: 8, days: 20 });
const again = runScenarioSweep({ scenario: 'early', seeds: 8, days: 20 });
ok(JSON.stringify(base) === JSON.stringify(again), 'same scenario, seeds and config give an identical sweep');
const rich = runScenarioSweep({ scenario: 'early', seeds: 8, days: 20, config: toConfigOverrides({ startingCash: 20000 }) });
ok(JSON.stringify(rich.stats) !== JSON.stringify(base.stats) && rich.stats[0].medianCash > base.stats[0].medianCash, 'changing a pane value changes a fresh simulation');
const sixCore = base.stats[0];
ok(['bankruptcyRate', 'medianCash', 'meanDailyIncome', 'meanQuality', 'meanReputation', 'meanFirstUpgradeDay'].every((k) => k in sixCore), 'the six core metrics are in every sweep row');

console.log(`balance-lab: all ${n} checks passed`);
