/** sd3.4a economy income verification: payouts, salaries, cash, tour, contracts. */
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { generateCandidates, generateNewProjects } from '../src/utils/projectUtils';
import { AVAILABLE_ERAS } from '../src/data/eras';

const baseDir = process.cwd();
const read = (p: string): string => fs.readFileSync(path.join(baseDir, p), 'utf8');

let passed = 0;
const ok = (cond: boolean, msg: string): void => {
  assert(cond, `FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

// Starting cash cut ~5x, flavor order preserved
const cash = Object.fromEntries(AVAILABLE_ERAS.map((e) => [e.id, e.startingMoney]));
ok(cash['classic_rock'] === 3500, 'classic 3.5k');
ok(cash['golden_age'] === 5000, 'golden 5k');
ok(cash['digital_age'] === 7000, 'digital 7k');
ok(cash['modern'] === 9000, 'modern 9k');

// Payout rebase: live templates span T0-T3 (no 250s, no 60k spikes)
const pros = generateNewProjects(30, 1, 'analog60s');
const bases = pros.map((p) => p.payoutBase);
ok(Math.min(...bases) >= 500, `floor lifted (min ${Math.min(...bases)})`);
ok(Math.max(...bases) <= 4500, `no 60k spikes (max ${Math.max(...bases)})`);

// Double-tax fix: offer no longer scales on raw popularity/100
const pu = read('src/utils/projectUtils.ts');
ok(pu.includes('getGenreMarketMultiplier'), 'offer uses centered market multiplier');
ok(!pu.includes('genrePopularity / 100'), 'raw popularity tax removed');

// Salary tiers over samples: all in 35-240, both ends reachable
const cands = Array.from({ length: 5 }, () => generateCandidates(20)).flat();
const sals = cands.map((c) => c.salary);
ok(Math.min(...sals) >= 35 && Math.max(...sals) <= 240, `tiers bounded 35-240 (got ${Math.min(...sals)}-${Math.max(...sals)})`);
ok(sals.some((s) => s < 60), 'interns exist (day-1 hireable)');
ok(sals.some((s) => s > 150), 'specialists exist (empire tier)');

// Tour exploit capped (source-assert: hook needs React state)
const band = read('src/hooks/useBandManagement.tsx');
ok(band.includes('Math.min(1500, band.fame * 25)'), 'tour capped min(1500, fame*25)');
ok(!band.includes('band.fame * 100'), 'fame*100 exploit removed');

// Contract budgets anchored to live economy (source-assert: generator is UI-dead)
const contracts = read('src/game-mechanics/advanced-contracts.ts');
ok(contracts.includes('1500 + prestigeScore * 60'), 'contract budgets prestige-anchored');
ok(!contracts.includes('Math.random() * 50000'), '10k-60k flat roll removed');

console.log(`economy-income: all ${passed} checks passed`);
