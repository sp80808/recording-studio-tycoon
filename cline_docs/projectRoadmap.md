# Project Roadmap: Recording Studio Tycoon

This document outlines the main development phases. Issue-level tracking lives in
**Beads** (`bd list` / `bd ready` / `bd prime`) — this file stays at phase level.

## Phase 1: UI Shell + PIXI Studio Room (Done)

Reality check (2026-09-27): the game is a **DOM shell with an embedded Pixi scene**,
not a full-PIXI UI. `src/pixi-ui/` panels exist but are not the main interface.

- [x] DOM game shell mounted (`App.tsx` → router → `pages/Index.tsx` → `GameLayout`)
- [x] Isometric Pixi studio room (`WebGLCanvas.tsx`, Pixi v8) with animated
  VU meters, wall clock, charts TV, phone, staff figures, day/night tint
- [x] Room hotspots wired to real actions (work / gigs / advance day / info)
- [x] Responsive fit-to-viewport scaling; layout uses `h-screen` shell
- [ ] RightPanel collapse into contextual inspector popups (bead `goj.2`)
- [ ] De-websitify pass: Refresh cooldown, transitions, screen shake, SFX (`goj.3`)

## Phase 2: Core Gameplay Loop (Done)

- [x] Replace mock `ProjectService` progression/report with real scoring (`ruc.1`)
- [x] Wire completion reports into Index/`useGameLogic` (`ruc.2`)
- [x] Random events + salaries/upkeep on the daily tick (`ruc.3`)
- [x] Combo streak + Overdrive risk/reward on work sessions (`ifx.1`, done)
- [x] Minigames restored (18 games + manager/tutorials from git history)

## Phase 3: Advanced Feature Expansion

- [x] Stage-tied minigames feeding quality scores (EQ/fader/punch-in) (`ifx.2`)
- [x] Milestone rewards that visibly upgrade the studio room (`ifx.3`)
- [x] Narrative and Storyline Events (`CutsceneDirector`, cinematic story + minigame outcome
  cutscenes, ambient backdrops, studio lore checks)
- [ ] Detailed Skill and Progression System — partial (talents/perk points `z2f.4`, RPG slices
  `sd3.1/.2`; deeper skill trees pending `sd3.3/.4`)
- [ ] Research and Development tree — partial (`ResearchModal` + `startResearchMod` live)
- [ ] Music Charting System — partial (`ChartsPanel` + chart services; pending consolidation `#52`)
- [ ] Flea market / used-gear depth (`#17`, `#3` legacy)

## Phase 4: Studio OS + Living Studio + Gamepad

- [x] Full-bleed living studio floor replaces dashboard layout (`studio-play.css`, command dock,
  contextual `studio-activity-panel` dialogs, height-aware media queries) — GH #41/#54, beads `zel.*`
- [x] Gamepad Task 1: polling service, deadzones, haptic actuator, `useGamepad` (`49i.1`)
- [x] Gamepad Task 2: `GamepadGlyph` vector badges + Settings controller layout/rumble (`49i.2`)
- [x] Gamepad Tasks 3–8: spatial nav + HUD, radial action wheel, MPC beat-pad / tape-jog /
  console-ride minigames, tactile PocketMeter haptics, and isometric floor camera (`49i.3`…`49i.8`)
- [ ] Workbench/telemetry tooling from the new GitHub backlog (#59 then #57-first sequence —
  see `cline_docs/githubIssueTriage.md`)


## Completed Tasks

- 2026-09-27 — Beads initialized (4 epics, 16 issues) + workflow documented.
- 2026-09-27 — Build repaired: single Vite config with `@` alias, toast bridge,
  restored minigames, fixed `Era`/`GameState`/`stageName`/save-system imports.
- 2026-09-27 — Studio room shipped; combo/overdrive shipped; verified in headless
  Chrome with 0 console errors.
- 2026-09-27 — Epic `ruc` (Core Gameplay Loop) completed: real `ProjectService` lifecycle,
  unified `applyReportToState` completion settlement, daily salaries/upkeep financial
  tracking, and game-day cooldown random events wired to `advanceDay`.
- 2026-09-27 — Stage-tied minigames (EQ match, Fader ride, Punch-in) wired to
  project quality (`minigamePoints`) and stages (`ifx.2`).

