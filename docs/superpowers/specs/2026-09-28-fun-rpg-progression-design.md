# Fun-First RPG Progression — Design Spec (2026-09-28)

Epic: `recording-studio-tycoon-sd3`. Direction: parallel tracks + narrative heavy + rebalance allowed.

## 1. Verdict from 5 brainstorm tracks

- Moment-to-moment loop is grind-to-payday with no fail state (`useStageWork` forces ≥1 progress, deadlines unenforced, minigames capped +10/100 and skippable).
- Retention: only dailies exist (no streaks); awards auto-fire; choices empty (`makeEventChoice` no-ops, choice events filtered out); no rivals/fans/quests.
- RPG: 3 divergent XP curves, training payouts never applied, perks computed but never called, equipment skill-keys mismatch real SkillIds, reputation uncapped with 6 parallel fame counters.
- Economy: double popularity tax, starting cash buys shop day-1 (Modern) or never (Classic SSL), staff salaries inverted, contracts 20-100x but unwired, tours 5k/day exploit, no royalties/rental/overhead.
- Train constraints (all landed into local main): rooms=`studioRoomUtils.ts`, fit=`staffFitUtils.ts`, RNG=`seededRandom.ts`, clock=`simulationClock.ts`. Dirty UI files (Splash, Tutorial, CareerHub, RightPanel, projectUtils, studioRoomUtils, useGameState…) must NOT be edited until they land. Relationship double-write unresolved — narrative must be read-only until reconciled.

## 2. Scrum slices (beads)

1. **sd3.1 pure foundations** ✅ SHIPPED — `src/rpg/{rankChase,comboCodex,unifiedXp}`, `src/narrative/{comebackDetector,awardsScoring,fanMail}`, `tests/rpg-slice1.check.ts`. No dirty edits.
2. **sd3.2 work-loop wiring** — stage grades, Focus Flow aura, Safe/Ambitious/Moonshot stakes. Blocked until `useStageWork`/`ProjectReviewModal` dirty settles.
3. **sd3.3 retention wiring** — streaks, Golden Reels modal, comeback offers, fan inbox UI. New components only.
4. **sd3.4 economy 0.4.0** — salary tiers, payout rebase, royalties, overhead, rental, migration. Blocked until `projectUtils`/`studioRoomUtils` dirty settles + sim re-run.

## 3. Slice-1 API (canonical)

- `gradeQuality(q)` → `{rank D/C/B/A/S/S+, pointsToNext, payoutMult 0.6-2.5, nearMiss ≤3pts, nextRank}`. S (90+) unlocks label offers.
- `evaluateCombo(genre, mood, {mastery, isFirstDiscovery})` → tier + qualityBonus + xpMult + SP. 6 canonical moods, 12 signatures, terrible pairs.
- `xpNext(track, level)` → skill `120·L^1.6`, producer `180·L^1.45`, role `100·L^1.5`. `talentPointsEarned(30)=36`.
- `detectSlump(...)` → loyal-regular / redemption-rush / ghost-produce, 7d expiry, 21d re-arm, unfarmable.
- `eligibleNominees / winChance / pickWinnerSeeded` — seeded `reels-year-studio`, attend/charted modifiers.
- `generateFanLetters(input, rng)` — RNG injected, 14d expiry, cap 20.

## 4. Rules for slices 2-4

- New code in `src/rpg/*`, `src/narrative/*` only; read-only joins to relationships/rooms/fit; append-only `reviewSnippet` suffix for narrative writes.
- All sim/narrative randomness via `createSeededRandom`, never bare `Math.random`.
- Fit stays sole ranker; talents/rooms/gear feed its inputs.
- Economy migration bumps save to 0.4.0 (remap salaries, cap tours, divide stale contract budgets, init royalty streams).

## 5. Self-review

- No TBDs; thresholds/formulas concrete; conflict zones named with file paths.
- Scope is one epic with 4 ordered slices; slice 1 independent and landed.
