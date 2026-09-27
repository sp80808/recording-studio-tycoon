# Codebase Summary

High-level overview of the project structure, key components, and their interactions.

## Key Components and Their Interactions

### 1. App Shell (DOM)
- `src/App.tsx` — QueryClient/Tooltip/Toaster providers + router (`/` → `pages/Index.tsx`).
- `src/pages/Index.tsx` — owns `GameState` via `useGameState`, composes `useGameLogic`
  (advance day, purchase, hire, training, progression), renders `GameLayout`,
  `GameHeader`, `MainGameContent` and all modals/celebrations.
- `src/components/GameLayout.tsx` — fixed `h-screen` column shell (header + content),
  so the game never page-scrolls.

### 2. MainGameContent (3-column desktop / swipe tabs mobile)
- Left: `ProjectList` (gigs + Refresh + start project).
- Center: **`StudioRoom`** (Pixi isometric room) on top, then
  `ProgressiveProjectInterface`/`ActiveProject` in a scroll wrapper, with the
  floating XP/reward orb overlay.
- Right: `RightPanel` (Studio/Skills/Staff/Bands/Charts tabs + equipment shop).

### 3. Studio Room (Pixi v8)
- `src/components/StudioRoom.tsx` — derives scene state from `GameState`
  (activity from project progress/working staff, staff on floor, equipment count,
  day) and maps hotspot clicks to real actions (advance day, refresh gigs,
  focus project, info toasts). HUD plates/legend are DOM overlays.
- `src/components/WebGLCanvas.tsx` — Pixi **v8** app (`new Application()` +
  `await app.init({ resizeTo })`, `app.canvas`), builds a procedural isometric
  room (walls/window/clock/TV/glass live room/gear shelf/console/phone/staff),
  fit-to-viewport scaling, ticker animation (VU bars, TV equalizer, phone ring,
  clock hand, staff bob, ambient day/night tint), hover glows, 6 hotspots:
  `console | liveRoom | phone | clock | tv | shelf`.

### 4. Work Session / Gamification (`src/hooks/useStageWork.tsx`)
- `performDailyWork` computes C/T points (attributes → focus → studio skills →
  equipment → staff) then applies:
  - ⚡ **combo**: consecutive same-day sessions (`project.comboCount`,
    `project.lastWorkDay`), +10%/step capped at +50%, resets on a new day.
  - 🔥 **overdrive**: `project.overdriveArmed` → 2 energy, ×1.75 output,
    25% chance of crew mood/energy burnout; flag consumed each session.
- Auto-triggers stage-matched minigames (`utils/minigameUtils`).

### 5. Minigames (`src/components/minigames/`)
- Restored full set: `MinigameManager` (isOpen/onClose/gameType/onReward API,
  exports `MinigameType`) + 17 game components (RhythmTiming, MixingBoard,
  VocalRecording, Mastering, EffectChain, AcousticTreatment, InstrumentLayering,
  VocalTuning, LiveRecording, GearMaintenance, BeatMaking, SoundWave,
  MidiProgramming, SamplingSequencing, TapeSplicing, LyricFocus, …) and
  `MinigameTutorialPopup`.
- Rewards feed creativity/technical/XP bonuses back into the active project.

### 6. Game Mechanics (`src/game-mechanics/`, `src/services/`, `src/utils/`)
- `ProjectService.ts` — still mock (+1%/tick, random quality); to be replaced
  (bead `ruc.1`).
- `random-events.ts`, `studio-perks.ts`, `ProgressionSystem`, `marketService`,
  `historicalEvents` — wired to various hooks; daily tick integration pending.

## Data Flow
1. `Index.tsx` holds `GameState`; all mutations flow through hooks
   (`useGameLogic` and its sub-hooks) via `setGameState`.
2. `MainGameContent` receives the game actions as props and hands them to panels;
   `StudioRoom` receives `advanceDay`/`refreshCandidates` for room hotspots.
3. Pixi scene reads a state ref every frame (no React re-render per frame);
   scene rebuilds only on resize or layout-affecting state changes.
4. Toasts: `use-toast` bridges every `toast()` call to Sonner (single renderer
   in `App.tsx`).

## External Dependencies
- **React 18 + TypeScript + Vite 5** (single `vite.config.ts`: `@` alias,
  `define.global`, port 8080).
- **pixi.js 8** (room scene), **Radix UI** (modals/tabs/sliders), **Tailwind**,
  **sonner** (toasts), **recharts**, **react-router-dom**, **@tanstack/react-query**,
  **i18next**, **framer-motion**.
- **Beads** (`bd` CLI, embedded Dolt) for issue tracking — run from this directory.

## Recent Significant Changes (2026-09-27)
- Build repaired: Vite alias config, Sonner toast bridge, restored minigame
  components, fixed `Era`/`GameState`/`ProjectStage.stageName`/save-system imports,
  `GameLayout` rewritten as a real viewport shell.
- `WebGLCanvas` rewritten as Pixi v8 isometric studio room; `StudioRoom` added to
  the center column with HUD + hotspots wired to game actions.
- Combo streak + Overdrive added to work sessions with UI chip/button.
- Beads initialized (4 epics / 16 issues) — see `bd list`.
- Reference docs: `docs/game_enhancement_design_plan.md`, `docs/visual_studio_plan.md`.

