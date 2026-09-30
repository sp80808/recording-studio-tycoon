# Balance baseline (harness v1)

Sweep: 1,000 seeds x 100 days, seed 1 upwards, era `analog60s`, default
`BalanceConfig`. Reproduce with
`node /tmp/rst-balance.cjs --sweep 1000 --days 100 --scenario <early|mid|late>`
(build line in `src/dev/balance/README.md`).

| Scenario | Strategy | Median cash | Income/day | 1st upgrade day | Reward share |
|---|---|---|---|---|---|
| early | cheapest | 28,328 | 304 | 10.2 | 0 |
| early | highest-fee | 51,516 | 537 | 7.8 | 0 |
| early | repeat-client-first | 46,281 | 485 | 7.7 | 0 |
| mid | highest-fee | 83,080 | 892 | - | 0 |
| late | highest-fee | 94,325 | 1,044 | - | 0.02 |
| late | repeat-client-first | 87,548 | 974 | - | 0.02 |

## What it says (and does not)

- **No runaway flags** at the default limits. Highest-fee out-earns cheapest by
  about 1.8x (limit 2.5x).
- **No death spiral** in this model: bankruptcy 0 in every scenario because
  daily upkeep (25-400) is far below session fees. There is no cash sink yet
  (upgrades, salaries per hire, rent), so cash grows without bound. Treat
  "solvent" as unproven until sinks are modelled.
- **First meaningful upgrade** (2,500 cash) arrives around day 8-10 from a
  500 start. Mid/late start above it, so their value is 1 by construction.
- **Reward side is small but alive.** Charting needs quality 60+. Early play
  never charts; mid barely does (about 2 gems a run); late earns about 100
  gems and rare cases per 100 days, 2% of session income. Worst single case
  loot seen: 1,500 cash-equivalent.
- **Watch item: session payout multiple** (paid / listed fee) reaches 3.07 in
  the late scenario; limit is 3.2. It is quality x difficulty x match x market
  stacking, not a bug, but it has little headroom.
- Model gaps: one room, one session at a time, fixed upkeep, instant crate
  opening, no staff burnout/idle time, no offline progress. Live shows, A&R
  contracts, creative briefs and Know-How are not yet in the loop.
