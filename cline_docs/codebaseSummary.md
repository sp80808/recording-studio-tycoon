# Codebase Summary

High-level architectural overview of Recording Studio Tycoon (v0.4.0).

---

## Key Components and Systems

### 1. Game Shell (`src/pages/Index.tsx`)
- Owns `GameState` through `useGameState`.
- Orchestrates `useGameLogic` (actions, economy ticks, project progression).
- Hosts top header (`GameHeader.tsx`), living room viewport (`StudioRoom.tsx`), contextual slide drawer (`MainGameContent.tsx`), console transport dock (`ActiveProject.tsx`), and cutscene director (`CutsceneDirector.tsx`).

### 2. Living Isometric Studio (`src/components/WebGLCanvas.tsx` / `StudioRoom.tsx`)
- **PixiJS 8 Application:** Procedural isometric 3D grid (`TILE_W=56, TILE_H=28`).
- **5-Tier Console Hardware Progression:**
  - Tier 1: 4-channel tube desk with mahogany cheeks, Auratone cube speaker, and reel-to-reel tape deck.
  - Tier 2: Slate console with NS-10 monitors and analog telephone.
  - Tier 3: British blue console with single DAW display and outboard rack.
  - Tier 4: Graphite console with illuminated meter bridge and dual displays.
  - Tier 5: World-class gold-trimmed flagship console with ultra-wide screens and patchbays.
- **Hotspots:** Console desk, live room, analog telephone, studio clock, CRT monitor, vinyl shelf.
- **Visual Filters:** Era color grading overlay (`EraGrade.tsx`) tailored to the current historical era.

### 3. Interactive Console Work Loop (`src/components/ActiveProject.tsx` / `PocketMeter.tsx`)
- **Transport Dock:** 60fps illuminated Lock Take button with haptic animations.
- **PocketMeter:** Real-time needle gauge evaluating take timing window (Gold, Silver, Solid).
- **Variable Energy Takes:** 1⚡ (efficient), 2⚡ (standard), or 3⚡ Overdrive (+75% output boost).
- **Real-time Focus Sliders:** Performance, Sound Capture, Layering sliders with real-time genre compatibility percentage matching.

### 4. Tactile Audio System (`src/utils/audioSystem.ts`)
- **Tone.js Synthesis:** Polyphonic harmonic chords triggered per genre on locked takes.
- **Kenney UI SFX:** Authentic mechanical switch clicks and rotary knob audio on all physical studio interactions.
- **Audio Unlock:** Graceful user-gesture unlocking listener wired to global state.
- **Juice & Particles:** `canvas-confetti` bursts on platinum records and milestone achievements.

### 5. Fun-First RPG Progression Engine (`src/rpg/`)
- `takeEvaluation.ts`: Translates needle timing into performance quality scores.
- `comboCodex.ts`: Multiplicative quality chaining on consecutive successful takes.
- `contractStakes.ts`: Safe contracts vs high-risk Moonshot stakes (+60% payout multiplier).
- `stageGrades.ts`: S/A/B/C letter grades across tracking, overdubs, mixing, and mastering.
- `unifiedXp.ts`: Shared XP and level progression across producer skills and studio expansion.
- `characterOrigins.ts` & `studioLore.ts`: 5 producer backgrounds with distinct console laws and story dilemmas.

### 6. Narrative Cutscenes & Ambient Director (`src/components/cutscenes/`)
- `MinigameOutcomeCutscene.tsx`: Visual feedback and score summaries after completing studio minigames.
- `CinematicStoryCutscene.tsx`: Storylet dialogues with studio rivals, artists, and label executives.
- `CutsceneDirector.tsx`: Queue manager managing priority cutscenes without UI collision.
- `StudioAmbientBackdrop.tsx`: Atmospheric backdrop matching the studio's era and mood.

### 7. Gamepad Controller Support (`src/services/gamepadService.ts` / `GamepadNavContext.tsx`)
- Hardware auto-detection with 60fps polling loop.
- Dynamic SVG button glyphs adapting to Xbox, PlayStation, Nintendo Switch, and Steam Deck layouts (`GamepadGlyph.tsx`).
- Spatial focus navigation across all studio tabs and inspector modals.
- Controller-first minigames: `BeatPadGame` (MPC drum pad), `TapeJogGame` (reel-to-reel tape jog & splice), and `ConsoleRideGame` (dual-stick fader ride).

### 8. Desktop-Idle Simulation Core (`src/simulation/`)
- `simulationClock.ts`: 5-minute background time slicing during active play or offline catch-up (capped at 8 hours).
- `WelcomeBackSummaryModal.tsx`: Summarizes offline progress, completed stages, revenue earned, and staff energy.
- `seededRandom.ts`: Mulberry32 deterministic pseudo-random number generator for reproducible outcomes.
