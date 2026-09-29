# Narrative Expansion Design — Lore, Cutscenes, Random Events, Bands

Date: 2026-09-29. Scope: medium depth on all four subsystems, even coverage.
No code changes in this spec; each section ends in a beads slice with acceptance criteria.

## Context (what exists today)

- `src/narrative/studioLore.ts` — 8 Console Laws, 4 rival studios (one per playstyle), 3 historic studios.
- `src/narrative/storyArcs.ts` — 4 arcs × 3 chapters, `checkCompletion(state)` + fixed rewards.
- `src/narrative/narrativeChoices.ts` — 5 dilemmas, `getEligibleDilemmas` (day-gated), `applyChoiceOutcome` (money/rep only).
- `src/narrative/fanMail.ts`, `streaks.ts`, `comebackDetector.ts`, `playstyleTheme.ts` — inbox, streaks, slump offers, themes.
- `src/game-mechanics/random-events.ts` — `RandomEventService` (cooldowns in game days), 10 `EventType`s, 3 sample events.
- `src/utils/historicalEvents.ts` — 12 scripted events across 4 eras, day-triggered.
- `src/game-mechanics/eventIntegration.ts` — live daily-tick bridge; choice-events excluded until an event-choice dialog exists; Genre/Contract/Market effects are narrative-only (no GameState fields).
- `src/components/cutscenes/` — `CutsceneDirector` queue with 2 types (`outcome_vignette`, `story_cinematic`); 1 shipped career cutscene (Silas Vance arrival at rep ≥ 25 or level ≥ 3).
- `src/types/bands.ts` + `BandManagement.tsx` — `Band`, `BandRelease`, `TourStatus`, `SessionMusician`, `OriginalTrackProject`; no drama/lifecycle systems.

## 1. Lore bible expansion

**Goal:** double the codex without touching existing entries (append-only; existing ids frozen).

- **Console Laws 9–12.** 9: Law of the Demo (finished beats perfect); 10: Law of the Session Player (hire for feel, not chops); 11: Law of the Second Room (a B-room prints money while the A-room prints legends); 12: Law of the Reunion (every breakup is a future payday). Same shape as existing `ConsoleLaw` (quote + lore + gameplayPrinciple), each principle maps to a real mechanic (streaks, session musicians, studio rooms, comeback offers).
- **2 new rival studios (6 total).** `Velvet Static Collective` (hit-maker splinter: idol-group factory, threat Contender, signature Pop/RnB) and `The Basement Tapes Union` (underground co-op: threat Contender, signature Lo-Fi/Punk). Gives hit-maker and underground a second foil so arcs 2–3 can stage rival-vs-rival triangles. New `threatLevel` value `Rising` for both; no changes to existing four.
- **Historic venues (new collection, mirrors `HistoricStudio`).** 4 entries, one per era: The Marquee Cellar (60s), Arena Dome Circuit (80s), Warped Parking-Lot Tour (2000s), Bedroom Stream Fest (2020s). Each has `acousticSecret` + `legendaryRecord`; venues become tour destinations in §4.
- **Era codex entries.** 1–2 paragraph fiction per era pinning why the era sounds the way it does; surfaced in era-select tooltip. Pure content, no code.

Acceptance: new entries render in existing codex UI with zero changes to existing ids; `getRivalStudio`/`getConsoleLaws` return 6/12.

## 2. Cutscene pipeline expansion

**Goal:** grow from 1 career cutscene to a trigger table, reusing the existing queue + 2 types (no new renderer work).

- **New `story_cinematic` payloads (4).** One rival-arrival per remaining playstyle (Chad Sterling, Roxy Riot, Dr. Thorne — same shape as `RISING_STUDIO_CUTSCENE`: title/chapter/speaker/lines/2 choices), plus 1 band-milestone cinematic (first band release ships → label scout appears). Trigger thresholds mirror the existing one (rep/level gates + `alreadySeen` localStorage key per milestone id).
- **New `outcome_vignette` payloads (3).** S-grade take, first gold record, tour return. Fire-and-forget (no choices), reuse `MinigameOutcomeCutscene`.
- **Choice→flag wiring.** Career cutscene choices currently persist only a `CREED_KEY` string. Extend to write a story flag consumable by `getEligibleDilemmas` (e.g. creed `protect-the-take` unlocks a follow-up dilemma). Small, additive: `careerCutscenes.ts` exports `CREED_FLAGS: Record<choiceId, storyFlag>`.
- **Director extension point.** `CutsceneDirector` gains a trigger-registry (`useCutsceneTriggers`) so new milestones register declaratively instead of hand-rolled `autoSave` listeners. Existing Rising-Studio listener migrates onto it unchanged in behavior.

Acceptance: trigger table (7 entries: condition → payload → seen-key) documented; all choices resolve to a persisted flag; no existing cutscene regresses (seen-keys stable).

## 3. Random events expansion

**Goal:** 12 new events that compose with lore/bands/equipment, all resolvable through existing `applyEventToState` targets or honest narrative-only labels.

- **Band events (4).** `Garage band walkout` (StaffMood −, needs mediation choice — blocked on choice dialog, ships narrative-only first), `Viral cover` (StudioReputation +, requires an active band), `Tour bus breakdown` (OperatingCosts +, requires tour active), `Reunion rumor` (narrative-only, requires breakup flag from §4).
- **Lore events (4).** `Rival diss track` (reputation swing vs named rival, playstyle-gated), `Console Law anecdote` (flavor + small buff tied to a Law, e.g. Law 5 → energy saver), `Historic venue anniversary` (payout bump for matching genre), `Award nomination` (extends existing `industry_award` pattern, lower thresholds).
- **Studio events (4).** `Tube stash find` (equipment condition +, yard-sale flavor), `Power surge` (condition −, mitigated by maintenance perk), `Intern prodigy` (staff XP event), `Sync brief lands` (money +, requires rep gate).
- **Trigger discipline.** Every event uses only real GameState fields (`reputation`, `currentDay`, `financials.reports`, `hiredStaff`, `ownedEquipment`, `bands`, `playerBands`). No new condition kinds. Cooldowns follow existing per-type table. Choice-bearing events stay excluded from the auto pool until the choice dialog lands (same rule as today).
- **Historical weave.** 4 of the 12 events are era-conditional variants that name-check `HISTORICAL_EVENTS` (e.g. post-MTV payola pitch), so scripted history and RNG events feel like one world.

Acceptance: event table (12 rows: id, type, condition, effects, cooldown, choice/none) documented; all auto-pool events apply cleanly via `applyEventToState`; choice events queued behind the dialog dependency, explicitly listed.

## 4. Band possibilities

**Goal:** turn bands from a roster into a lifecycle: formation → releases → drama → tours → breakup → reunion/solo.

- **Archetypes (4, data-only).** Garage Band (cheap, volatile, high creativity), Idol Group (expensive, stable, hit-maker synergy), Supergroup (session-musician fusion, high floor), Legacy Act (comebackDetector tie-in, reunion paydays). Each is a preset bundle of `fame/notoriety` starts + genre affinities; no new types, just authored configs + a `bandArchetype` string field.
- **Lifecycle states.** Extend `TourStatus`-adjacent state with `bandStatus: active | on_tour | hiatus | broken_up | reunited` + `drama: 0–100` meter. Drama rises on overwork/neglect, falls on rest/rewards; at 100 → breakup event (band → `broken_up`, members freed, `reunionEligibleDay = day + 60`).
- **Drama events (4, reuse §3 machinery).** `Ego clash` (mediation choice), `Side project` (member idles, solo-release teaser), `Viral feud` (fame +/rep −), `Walkout` (show cancelled, costs). All feed the drama meter instead of inventing new resources.
- **Tours v2.** Extend existing `TourStatus` with `venueId` (→ §1 venues), `hype` (built by releases/fan mail, spent on ticket income), `incidentDay` (scheduledOptional `Tour bus breakdown` hook). Tour income = `dailyIncome × hype multiplier`, computed in the existing daily tick.
- **Releases → world.** `BandRelease` gains `eraId` + optional `rivalResponse` (named rival comments via fanMail-style inbox line). Charted releases spawn fan letters (existing generator) and can trigger the band-milestone cutscene (§2).
- **Solo careers.** On breakup, one member may spawn as a `SessionMusician`-promotable solo client (reuses client-relationship tiers). Reunion after 60 days clears drama, grants a one-tour hype bonus (Law 12 made mechanical).

Acceptance: lifecycle diagram (5 states + transitions) documented; drama meter math specified (sources/sinks/rates); no existing `Band` field renamed; tour income formula specified with a worked example.

## 5. Integration matrix

| New content | Touches | Notes |
|---|---|---|
| Laws 9–12 | streaks, session musicians, rooms, comeback | principles map 1:1 to mechanics |
| New rivals | storyArcs, cutscenes, events | triangle plots for arcs 2–3 |
| Venues | tours, historical events | venueId on TourStatus |
| Cutscenes (7) | CutsceneDirector, dilemmas | creed → story-flag bridge |
| Events (12) | eventIntegration, bands, fanMail | choice events gated on dialog |
| Band lifecycle | TourStatus, fanMail, comeback, charts | breakup → solo → reunion loop |

Shared rule: **append-only data, additive code.** No existing id, field, or seen-key changes. Anything needing a choice dialog or new GameState field is marked gated, ships narrative-only first.

## 6. Phased slices (beads)

1. Lore codex append (Laws 9–12, 2 rivals, 4 venues, era entries).
2. Cutscene trigger table + 7 payloads + creed-flag bridge.
3. Random event pool (12) + historical weave.
4. Band lifecycle (archetypes, drama, tours v2, breakup/reunion/solo).
5. Integration pass (director registry, inbox lines, balance check via `run-checks.sh` + balance harness).

Each slice: data-first, behind no flags (content is inert until triggers fire), verified by a `tests/*.check.ts` content-table assertion in the style of existing suites.
