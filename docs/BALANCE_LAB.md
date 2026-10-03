# Balance Lab (#57)

Development-only panel for tuning the economy simulation. It sits on the headless harness in `src/dev/balance/` (#19/#111); it is not a second game state.

## Use
`pnpm run dev`, then open `http://localhost:8080/?balanceLab` (or your dev port). Pick a scenario, move the sliders, press **Run sweep** (20, 100 or 1,000 seeds; 1,000 takes a couple of seconds and briefly blocks the tab). The table shows bankruptcy rate, median cash, income per day, quality, reputation and first-upgrade day per strategy bot, plus any runaway flags.

- **Copy overrides as JSON** and **Diff against baseline** show exactly what differs from `DEFAULT_BALANCE_CONFIG`; **Reset group** and **Reset all** restore the repository values exactly (setting a slider back to its baseline drops the override).
- **Export sweep JSON / CSV** downloads the result. The lab never writes source files: promote an accepted value by editing `src/dev/balance/config.ts` (or the real constant it stands for) in a normal commit.
- Scenario presets: `early` (day-1 bedroom), `first-hire`, `mid`, `high-rep-capacity-pressure`, `late`, `label-prestige`. `two-room-midgame`, `burnout-risk` and `used-gear-flipper` need systems the sim does not model yet (multi-room, fatigue, used gear, which is out of scope here).

## Architecture
`BalanceConfig` (typed) is the source of truth. `tunables.ts` lists 14 knobs with safe min/max/step and the reason each exists; `setOverride` clamps and snaps, and `effectiveConfig` layers overrides on a scenario. The panel is a plain React component with no extra dependency (the issue suggests Tweakpane; that package was not added). It is behind `import.meta.env.DEV` and a lazy import, so the production build contains no lab code (checked: no balance chunk and no lab strings in `dist/assets`). `tests/balance-lab.check.ts` covers ranges, reset-to-baseline, determinism and that a changed value changes a fresh simulation.

## Baseline values and why
See the `why` text of each entry in `src/dev/balance/tunables.ts`; the baseline values are `DEFAULT_BALANCE_CONFIG`.

## Tuning report: ambient share on a day-1 studio
Sweep: scenario `early`, 200 seeds, 60 days, all five bots.

| Setting | cheapest bot ambient share | Flags |
|---|---|---|
| baseline (10 ambient ticks/day) | 0.14 | `ambient-high` over the 0.12 limit |
| 9 ticks/day | 0.13 | `ambient-high` |
| 8 ticks/day | 0.12 | none |

Other bots sit at 0.09 to 0.11, and `mid` is clean (0.04 to 0.08). Reading: a cheap-fee studio leans on ambient earnings more than the "quiet side income" intent. `ambientTicksPerDay` is an assumption about how long an attended player idles, not a game constant, so no game value was changed here. The real levers are `AMBIENT_DAILY_CAP_BASE` (25) and the per-release cap in `src/economy/ambientIncome.ts`. This report is the evidence for that decision, which is left to the project owner.
