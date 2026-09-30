/**
 * GH #19 balance-harness CLI entry.
 *
 * Build + run OFFLINE (from the repo root):
 *   pnpm exec esbuild src/dev/balance/run.ts --bundle --platform=node \
 *     --format=cjs --outfile=/tmp/rst-balance.cjs --alias:@=./src \
 *     && node /tmp/rst-balance.cjs --days 30 --seed 42
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { runAllStrategies, STRATEGIES, DEFAULT_ERA, type BalanceRun, type Strategy } from './simulate';
import { checkInvariants, allPassed } from './invariants';
import { runScenarioSweep, sweepToCsv } from './sweep';
import { SCENARIOS } from './config';

const DEFAULT_DAYS = 30;
const DEFAULT_SEED = 42;

interface CliOptions {
  days: number;
  seed: number;
  era: string;
  out: string | null;
  sweep: number;
  scenario: string;
}

const parseArgs = (argv: string[]): CliOptions => {
  const opts: CliOptions = { days: DEFAULT_DAYS, seed: DEFAULT_SEED, era: DEFAULT_ERA, out: null, sweep: 0, scenario: 'early' };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--days' && i + 1 < argv.length) opts.days = Math.max(1, Math.floor(Number(argv[++i])));
    else if (arg === '--seed' && i + 1 < argv.length) opts.seed = Math.floor(Number(argv[++i]));
    else if (arg === '--era' && i + 1 < argv.length) opts.era = String(argv[++i]);
    else if (arg === '--sweep' && i + 1 < argv.length) opts.sweep = Math.max(0, Math.floor(Number(argv[++i])));
    else if (arg === '--scenario' && i + 1 < argv.length) opts.scenario = String(argv[++i]);
    else if (arg === '--out' && i + 1 < argv.length) opts.out = String(argv[++i]);
  }
  if (!Number.isFinite(opts.days)) opts.days = DEFAULT_DAYS;
  if (!Number.isFinite(opts.seed)) opts.seed = DEFAULT_SEED;
  return opts;
};

const pad = (value: string | number, width: number): string => {
  const s = String(value);
  return s.length >= width ? s : s + ' '.repeat(width - s.length);
};

const printTable = (runs: Record<Strategy, BalanceRun>): void => {
  console.log('strategy    days  cash    rep   completed  avgQuality  totalQuality');
  console.log('----------  ----  ------  ----  ---------  ----------  ------------');
  for (const strategy of STRATEGIES) {
    const r = runs[strategy];
    console.log(
      `${pad(strategy, 12)}${pad(r.days, 6)}${pad(r.cash, 8)}${pad(r.reputation, 6)}${pad(r.completed, 11)}${pad(r.avgQuality, 12)}${r.totalQuality}`,
    );
  }
};

const main = (): void => {
  const opts = parseArgs(process.argv.slice(2));
  console.log(`rst-balance: seed=${opts.seed} days=${opts.days} era=${opts.era}`);

  if (opts.sweep > 0) {
    if (!(opts.scenario in SCENARIOS)) throw new Error(`unknown scenario ${opts.scenario}; use ${Object.keys(SCENARIOS).join('/')}`);
    const result = runScenarioSweep({ seeds: opts.sweep, days: opts.days, era: opts.era, scenario: opts.scenario, firstSeed: opts.seed });
    console.log(`sweep: scenario=${result.scenario} seeds=${result.seeds}`);
    console.table(result.stats.map(({ strategy, bankruptcyRate, medianCash, meanDailyIncome, meanFirstUpgradeDay, rewardShare, repeatSessionShare, ambientShare, meanAmbientPerDay }) => ({ strategy, bankruptcyRate, medianCash, meanDailyIncome, meanFirstUpgradeDay, rewardShare, repeatSessionShare, ambientShare, meanAmbientPerDay })));
    if (result.flags.length === 0) console.log('runaway flags: none');
    for (const f of result.flags) console.log(`RUNAWAY ${f.kind} [${f.strategy}] value=${f.value} limit=${f.limit} - ${f.detail}`);
    const outDir = opts.out ?? path.resolve(process.cwd(), 'src/dev/balance/results');
    fs.mkdirSync(outDir, { recursive: true });
    const base = path.join(outDir, `sweep-${result.scenario}-${opts.seed}-${result.seeds}x${result.days}`);
    fs.writeFileSync(`${base}.json`, JSON.stringify(result, null, 2));
    fs.writeFileSync(`${base}.csv`, sweepToCsv(result));
    console.log(`wrote ${base}.json and .csv`);
    return;
  }

  const runs = runAllStrategies(opts.seed, opts.days, opts.era);
  printTable(runs);

  const invariantMap: Record<string, ReturnType<typeof checkInvariants>> = {};
  for (const strategy of STRATEGIES) {
    const results = checkInvariants(runs[strategy]);
    invariantMap[strategy] = results;
    console.log(`\ninvariants [${strategy}]: ${allPassed(results) ? 'PASS' : 'FAIL'}`);
    for (const r of results) {
      console.log(`  ${r.passed ? 'PASS' : 'FAIL'} ${r.name} — ${r.detail}`);
    }
  }

  // No wall-clock fields: same seed+days+era must be byte-identical.
  const payload = {
    deterministic: true,
    note: 'no timestamps/Date.now in output; rerun with same flags is byte-identical',
    seed: opts.seed,
    days: opts.days,
    era: opts.era,
    strategies: runs,
    invariants: invariantMap,
  };
  const outDir = opts.out ?? path.resolve(process.cwd(), 'src/dev/balance/results');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${opts.seed}.json`);
  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2));
  console.log(`\nwrote ${outFile}`);
};

main();
