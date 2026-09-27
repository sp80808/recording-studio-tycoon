# GH #19 — Deterministic Balance Harness (skeleton)

Headless economy probe: drives the real `generateNewProjects` +
`generateProjectReview` (+ `grantSkillXp`, `getGenreMarketMultiplier`) with
seeded randomness so balance tuning is reproducible. No React, no UI, no dev
server, no new dependencies.

## Build + run (OFFLINE)

From the repo root (`recording-studio-tycoon/`):

```sh
pnpm exec esbuild src/dev/balance/run.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-balance.cjs --alias:@=./src && node /tmp/rst-balance.cjs --days 30 --seed 42
```

Flags: `--days <n>` (default 30), `--seed <n>` (default 42),
`--era <id>` (default `analog60s`), `--out <dir>` (default
`src/dev/balance/results/` — resolved from cwd, so run from the repo root).

**esbuild alias note:** the bundle relies on `--alias:@=./src` to resolve the
`@/` imports (same mapping as `tsconfig.json`/`vite.config.ts`). If that flag
fails on your esbuild version, the fallback is: temporarily rewrite the `@/...`
imports in `src/dev/balance/*.ts` to relative paths (e.g.
`../../utils/projectUtils`), bundle, then revert. No alias plugin needed and
no new dependency is allowed for this.

## Output

- stdout: per-strategy table (cash / rep / completed / avgQuality /
  totalQuality) + per-strategy invariant results.
- JSON: `src/dev/balance/results/<seed>.json` (dir created at runtime via
  `fs.mkdirSync` recursive). Contains full runs + invariant results, with **no
  timestamps** — rerunning with the same flags must be byte-identical.

## Strategies

- `cheapest` — lowest difficulty (tie: lowest payout).
- `highest-fee` — highest `payoutBase`.
- `balanced` — best `payoutBase / difficulty` ratio.

Each simulated day: pay a fixed upkeep (`DAILY_COST = 25`, `STARTING_CASH =
500`), generate 3 candidate projects, pick per strategy, settle instantly via
`generateProjectReview` (player, equipment quality 50, market multiplier from
genre popularity), apply skill XP via `grantSkillXp`, accumulate
`{ cash, reputation, completed, totalQuality }`.

## Invariants (6)

1. `no-nan` — every numeric field finite.
2. `money-floor` — cash never below `-10000` (debt allowed, ruin flagged).
3. `no-duplicate-settlement` — no project ID settled twice.
4. `quality-range` — every quality within 0–100.
5. `completed-count` — completed == settled ids == day records == days.
6. `reputation-monotonic-on-high-quality` — rep never decreases on a day with
   quality > 70. **Approximated:** the skeleton settles instantly with rep
   gains floored at ≥ 0, so rep cannot fall here; real rep decay/penalties
   could violate it.

## Open questions this harness will answer once wired to real constants

- Payout-vs-difficulty slope: does `highest-fee` dominate `balanced`/earnings
  per day, or do difficulty costs (not yet modelled) offset it?
- Market neutrality: is `getGenreMarketMultiplier` centred so no single genre
  dominates across eras?
- Upkeep tuning: what `DAILY_COST` keeps `cheapest` viable but not dominant
  over 30/90/180-day horizons?
- XP pacing: how fast do `grantSkillXp` level-ups inflate quality (and thus
  payouts) — does difficulty scaling keep up?
- Missing costs: staff wages, equipment, multi-day durations, and failure
  states are not modelled yet — wiring them in is the next step before any
  number is trusted for tuning.
