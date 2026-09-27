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

## Phase 2: Core Gameplay Loop

- [ ] Replace mock `ProjectService` progression/report with real scoring (`ruc.1`)
- [ ] Wire completion reports into Index/`useGameLogic` (`ruc.2`)
- [ ] Random events + salaries/upkeep on the daily tick (`ruc.3`)
- [x] Combo streak + Overdrive risk/reward on work sessions (`ifx.1`, done)
- [x] Minigames restored (18 games + manager/tutorials from git history)

## Phase 3: Advanced Feature Expansion

- [ ] Stage-tied minigames feeding quality scores (EQ/fader/punch-in) (`ifx.2`)
- [ ] Milestone rewards that visibly upgrade the studio room (`ifx.3`)
- [ ] Detailed Skill and Progression System for player and staff.
- [ ] Research and Development tree for new technologies.
- [ ] Music Charting System to track song performance.
- [ ] Narrative and Storyline Events.

## Completed Tasks

- 2026-09-27 — Beads initialized (4 epics, 16 issues) + workflow documented.
- 2026-09-27 — Build repaired: single Vite config with `@` alias, toast bridge,
  restored minigames, fixed `Era`/`GameState`/`stageName`/save-system imports.
- 2026-09-27 — Studio room shipped; combo/overdrive shipped; verified in headless
  Chrome with 0 console errors.

