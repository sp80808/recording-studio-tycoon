# Design Specification: Studio Chore Engine, Progression Loops & Loot Reward Animations

**Date:** 2026-09-29  
**Status:** Approved  
**Version:** 1.0  
**Target Milestone:** v0.5.0  

---

## 1. Executive Summary & Goals

This specification defines the architecture, data models, UI components, animation choreography, and progression hooks for:
1. **Studio Maintenance & Daily Chores Engine**: A tactile, authentic studio upkeep loop (tape head cleaning, outboard rack calibration, patchbay dressing, acoustic baffle tuning, barista espresso brewing) providing active session buffs, gear condition upkeep, and daily chore streaks.
2. **Floor & Dock UI Integration**: Interactive "Needs Attention" visual indicators on the PixiJS isometric studio floor hotspots, paired with an industrial wooden **Studio Duties Clipboard** dock component supporting mouse and gamepad controls.
3. **Core Progression & Session Loop Coupling**: Direct wiring of chore buffs into PocketMeter take precision, technical/creativity point multipliers, energy conservation, unified XP gain, and multi-source loot crate drop triggers.
4. **Vintage Flight Case Unboxing & Visual Juice**: A complete replacement of the rudimentary box modal with a cinematic 3D perspective flight case featuring metal latches, opening thud, rarity-colored radiating light rays, particle confetti, 3D card flips, and enhanced `RewardFlights` particle trails.

---

## 2. System Architecture & Component Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MAIN APPLICATION WINDOW                         │
├───────────────────────────────────┬────────────────────────────────────┤
│     Living Isometric Studio       │        Console Transport Dock      │
│  (PixiJS WebGLCanvas / Hotspots)  │   (PocketMeter / Lock Take Button) │
│   - Console (Tape Heads / Wrench) │                                    │
│   - Outboard (Calibration)        │  ┌──────────────────────────────┐  │
│   - Vinyl Shelf/Lounge (Espresso) │  │  Studio Duties Clipboard     │  │
│   - Live Room (Acoustic Tuning)   │  │  - Daily Maintenance Checklist│  │
│                                   │  │  - Streak Counter (e.g. 2/3) │  │
│                                   │  │  - Gamepad (A) to Execute    │  │
│                                   │  └──────────────────────────────┘  │
└───────────────────────────────────┴────────────────────────────────────┘
                                    │
                         State / Engine Events
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        CHORE ENGINE SERVICE                            │
│                  (src/simulation/choreEngine.ts)                       │
│  - Tracks daily chore statuses, condition decay, and active buffs      │
│  - Evaluates daily refresh, streaks, and awards Flight Case crates     │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ├── Session Buffs (PocketMeter tolerance, XP multipliers)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 SESSION WORK LOOP & PROGRESSION ENGINE                 │
│      (useStageWork.ts / takeEvaluation.ts / unifiedXp.ts)              │
│  - Applies active chore buffs during tracking, overdubs & mixing       │
│  - Evaluates 'S' grade take streaks for lucky crate drops              │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ├── Crate Token Awarded
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 VINTAGE FLIGHT CASE UNBOXING MODAL                     │
│           (src/features/boxDrops/CrateUnboxingModal.tsx)               │
│  - Phase 1: 3D Flight Case presentation & dual metal latch snap SFX    │
│  - Phase 2: Lid burst, 360° rarity light rays, dust motes & confetti   │
│  - Phase 3: 3D card flip reveal with gear specs & condition meter      │
│  - Phase 4: Equip to Rack, Send to Inventory, or Sell for Cash         │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ├── Currency / XP Flight Payload
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       REWARD FLIGHTS SYSTEM                            │
│                 (src/components/RewardFlights.tsx)                     │
│  - Trailing particles & animated curved bezier arcs to HUD targets     │
│  - Floating streak & combo milestone badges ("x3 STREAK!", "GOLD TAKE")│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Models & State Contracts

### 3.1 Chore Engine Types (`src/simulation/choreEngine.ts`)

```typescript
export type StudioChoreId = 
  | 'clean_tape_heads'    // Boosts PocketMeter timing sweet-spot by +10%
  | 'calibrate_outboard'   // Increases session Technical points by +15%
  | 'organize_patchbay'    // Reduces energy cost on next Overdrive take by 1⚡
  | 'tune_acoustics'       // Increases session Creativity points by +15%
  | 'brew_espresso';       // Restores 1 player/staff energy & grants +10% client vibe

export type ChoreCategory = 'maintenance' | 'acoustics' | 'hospitality';

export interface StudioChore {
  id: StudioChoreId;
  title: string;
  description: string;
  category: ChoreCategory;
  energyCost: number;       // 0 or 1
  hotspotId: 'console' | 'liveroom' | 'phone' | 'shelf' | 'crt';
  completed: boolean;
  buffDurationSessions: number; // typically 1 session (or 2 with Master Calibrator perk)
  buffType: 'timing_bonus' | 'tech_bonus' | 'creativity_bonus' | 'energy_saver' | 'vibe_boost';
  buffMagnitude: number;
}

export interface ActiveChoreBuff {
  id: string;
  choreId: StudioChoreId;
  buffType: StudioChore['buffType'];
  magnitude: number;
  remainingSessions: number;
}

export interface StudioChoreState {
  chores: Record<StudioChoreId, StudioChore>;
  activeBuffs: ActiveChoreBuff[];
  dailyCompletedCount: number;
  streakDays: number;
  lastCompletedDay: number;
}
```

### 3.2 Extended GameState Contracts (`src/types/game.ts`)

```typescript
export interface GameState {
  // Existing state properties...
  choreState: StudioChoreState;
  pendingCrates: Array<{
    id: string;
    era: Era;
    source: 'chore_streak' | 's_grade_take' | 'yard_sale';
    tier: 'standard' | 'vintage_flight_case';
  }>;
}
```

---

## 4. Subsystem Specifications

### 4.1 Studio Maintenance & Daily Chores Engine
- **Lifecycle:**
  - When `advanceDay()` is invoked or time advances past midnight in `simulationClock.ts`, `refreshDailyChores(state)` resets `completed: false` for all chores.
  - If `dailyCompletedCount >= 3` on the previous day, `streakDays` increments by 1. If not, `streakDays` resets to 0.
  - When `streakDays % 3 === 0` (every 3 consecutive active chore days), a `pendingCrate` of tier `'vintage_flight_case'` is added.
- **Execution:**
  - Player or gamepad selects a chore -> checks player energy (if `energyCost > 0`).
  - Plays mechanical sound effect (`ui sfx/rotary-switch.wav` or `ui sfx/purchase-complete.mp3`).
  - Generates floating XP flight (`+25 XP` or `+50 XP`).
  - Registers the corresponding `ActiveChoreBuff`.

### 4.2 Studio Duties Clipboard UI & Hotspot Badges
- **Hotspot Indicators (`WebGLCanvas.tsx` / `StudioRoom.tsx`):**
  - Renders floating status badges with micro-bobbing animation above corresponding room coordinates:
    - Reel-to-Reel / Console -> Wrench indicator
    - Outboard Rack -> Fader indicator
    - Vinyl Shelf / Lounge -> Coffee cup indicator
    - Live Room -> Tuning fork / note indicator
  - Clicking the hotspot triggers the maintenance action directly, accompanied by floating text "+Buff Active".
- **Clipboard Drawer (`src/components/chores/StudioDutiesClipboard.tsx`):**
  - Weathered mahogany wood texture, silver spring clip header, brass screws.
  - Interactive checkboxes with smooth checkmark stroke animation.
  - Streak progress bar (`[■■□] 2/3 Days to Crate`).
  - D-Pad navigation support and button `(A)` activation.

### 4.3 Progression & Session Loop Coupling
- **PocketMeter Sweet Spot Tolerance (`takeEvaluation.ts`):**
  - If `timing_bonus` buff is active, the optimal window width expands by 10% (e.g. Gold threshold scales from `±0.04` to `±0.044`).
- **Stage Work Points (`useStageWork.ts`):**
  - `tech_bonus` multiplies raw technical gains by 1.15x.
  - `creativity_bonus` multiplies raw creativity gains by 1.15x.
  - `energy_saver` reduces Overdrive cost from 3 to 2 energy.
- **Unified XP & Perk Unlocks (`unifiedXp.ts`):**
  - Level 4 Perk: **Intern Assistant** (intern automatically sweeps 1 random chore at daybreak).
  - Level 8 Perk: **Master Calibrator** (`buffDurationSessions` increased from 1 to 2).
- **Crate Triggers:**
  - S-Grade stage completion has a 25% seeded roll to drop an extra studio crate.

### 4.4 Vintage Flight Case Unboxing & Reward Animation Juice
- **Modal Component (`src/features/boxDrops/CrateUnboxingModal.tsx`):**
  - Replaces `BoxDropModal.tsx`.
  - **Stage 1 (Closed Case):** Heavy textured road case with riveted metal corners, stenciled studio typography, and two spring latches. Clicking latches plays heavy metallic snaps.
  - **Stage 2 (Lid Open & Burst):** Lid hinges backward in 3D perspective (`transform: rotateX(-110deg)`). 360-degree rotating light rays rendered behind case. Particle dust & confetti explosion colored to item rarity.
  - **Stage 3 (Card Reveal):** Velvet foam cavity reveals floating gear card executing a 3D flip. Card displays high-res equipment icon, era badge, condition percentage meter with color gradient, base resale value, and gear category.
  - **Stage 4 (Decision Action):**
    - `[Equip to Studio Rack]` -> Instantly equips to studio if compatible.
    - `[Send to Inventory]` -> Stores in warehouse.
    - `[Sell for Cash]` -> Liquidates for 80% base value with instant coin flight.
- **Enhanced Reward Flights (`src/components/RewardFlights.tsx`):**
  - Curved bezier flight paths with particle trails for XP and Cash.
  - Streak and take grade milestone banner popups ("PERFECT GOLD TAKE!", "CHORE STREAK 3x!").

---

## 5. Visual Aesthetics & Styling Guide

- **Color Tokens:**
  - Common: `#94a3b8` (Slate Silver)
  - Uncommon: `#10b981` (Emerald Green)
  - Rare: `#38bdf8` (Outboard Blue)
  - Vintage: `#c084fc` (Amethyst Purple)
  - Legendary: `#fbbf24` (Solar Gold)
- **Typography & Surfaces:**
  - Industrial studio aesthetic: dark charcoal backgrounds (`#0f172a`), brushed aluminum trims, textured paper clipboard with mono-spaced specs font (`font-mono`).
- **Sound Effects:**
  - Latch click: `switch-metal.wav`
  - Crate open thud: `crate-open.mp3` / `door-heavy.wav`
  - Reveal chord: Tone.js genre-tailored polyphonic harmony with major 7th / 9th voicing.
  - Confetti pop: `confetti-pop.mp3`.

---

## 6. Verification & Test Plan

1. **Unit Tests:**
   - `choreEngine.test.ts`: Verify chore execution, energy deduction, daily refresh, streak increments, and 3-day crate drop triggers.
   - `lootGenerator.test.ts`: Ensure deterministic era drops, correct rarity weighting, and condition boundaries.
   - `takeEvaluation.test.ts`: Verify `timing_bonus` properly expands PocketMeter accuracy tolerance.
2. **Component & Integration Tests:**
   - `StudioDutiesClipboard.check.ts`: Test mounting, chore completion events, gamepad navigation, and streak counter.
   - `CrateUnboxingModal.check.ts`: Test multi-phase sequence (latches -> lid opening -> card flip -> actions).
3. **Build & Regression Verification:**
   - Full TypeScript compile (`pnpm run build` / `tsc --noEmit`).
   - Run complete test suite (`bash scripts/run-checks.sh`).
