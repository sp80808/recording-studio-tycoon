# Current Task: Studio Room + Gamification Pass (2026-09-27)

## Objective
Make the game *feel* like a game: restore the deleted minigames, put an interactive
isometric studio room at the centre of the UI, and add real work-session game mechanics
(combo streaks, Overdrive). Track everything in Beads (`bd list`).

## Context
- The build was broken by an uncommitted App.tsx refactor plus a historical commit
  (`530d9e27`) that had deleted 18 minigame components and gutted `MinigameManager`.
- `App.tsx` (uncommitted) already mounts the real shell (`pages/Index.tsx`); that is kept.
- Beads initialized in this repo (prefix `recording-studio-tycoon`), 4 epics / 16 issues.

## Completed This Session
- Fixed Vite config (single `vite.config.ts` with `@` alias + `define.global`), build passes.
- Restored `src/components/minigames/` from git history (18 games + tutorials).
- Fixed broken imports: `Era` type, `useSaveSystem` re-export, `ProjectReport`,
  `GameState`, `ProjectStage.stageName`, `MinigameType`/`MinigameManager` API.
- Bridged `use-toast` → Sonner so all in-game toasts actually render.
- Rewrote `WebGLCanvas.tsx` as a Pixi **v8** isometric studio room (fit-to-viewport,
  animated VU meters/TV/clock/phone, hover glows, 6 clickable hotspots).
- Added `StudioRoom.tsx` (HUD + hotspot → real game actions) into the center column.
- `GameLayout` fixed to a real `h-screen` shell (was invalid CSS-in-className).
- Gamification: ⚡ combo streak (+10%/step, caps +50%, resets on new day) and
  🔥 Overdrive (2 energy, +75% output, 25% crew-burnout risk) in `useStageWork`,
  with UI chip/button in `ActiveProject`.
- Verified in headless Chrome: splash → era → game → work → combo → overdrive,
  **0 console errors**.

## Next Steps
1. Close out beads: `1yf.1`, `1yf.2`, `1yf.3`, `goj.1`, `ifx.1` are complete.
2. Phase 2 core loop (epic `ruc`): replace mock `ProjectService` scoring, wire reports,
   connect random events + salaries to `advanceDay`.
3. `goj.2` inspector popups (collapse RightPanel tabs), `goj.3` remove web affordances
   (Refresh cooldown, splash→era→studio transitions, SFX).
4. `ifx.2` tie restored minigames to stage types/quality; `ifx.3` milestone rewards
   that visibly upgrade the room.
5. Docs: roadmap Phase 1 claims reconciled — keep updating as slices land.

