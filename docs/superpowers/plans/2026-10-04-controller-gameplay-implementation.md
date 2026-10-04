# Controller Gameplay Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul controller gameplay in Recording Studio Tycoon across 2D spatial drawer grid navigation, tactical analog RT take transport with rich dual-rumble haptics, and directional studio floor hotspot raycasting with smooth camera controls.

**Architecture:** A pure geometric cone raycasting engine for DOM and isometric hotspots; an enhanced `useGamepad` service providing continuous analog triggers and multi-frequency haptics; and contextual input routing across modals, drawers, studio floor, and console transport.

**Tech Stack:** TypeScript, React, PixiJS v8, Web Audio, Web Gamepad API.

**Spec:** `docs/superpowers/specs/2026-10-04-controller-gameplay-design.md`

## Global Constraints
- Strictly follow pnpm 12+ package scripts (`pnpm test`, `bash scripts/run-checks.sh`).
- Zero regressions in existing 10 check suites.
- Preserve keyboard and touch navigation seamlessly alongside gamepad input.
- Conservative git policy: no git commit or push without explicit user request.

---

### Task 1: 2D Spatial Navigation Geometric Engine

**Files:**
- Create: `src/utils/spatialNavigation.ts`
- Test: `tests/spatial-navigation.check.ts`

**Interfaces:**
- Consumes: Standard DOMRect, SpatialDirection (`'up' | 'down' | 'left' | 'right'`)
- Produces: `findNextSpatialFocus(activeEl: HTMLElement, direction: SpatialDirection, container: HTMLElement): HTMLElement | null`
- Produces: `computeSpatialScore(origin: {x: number, y: number}, target: {x: number, y: number}, direction: SpatialDirection): number | null`

- [ ] **Step 1: Write the failing unit check for spatial navigation**
Create `tests/spatial-navigation.check.ts` covering half-plane filtering, cone-angle scoring, and grid transitions (2x2 and 3x3 layouts).
- [ ] **Step 2: Run test to confirm failure**
Run `npx tsx tests/spatial-navigation.check.ts`.
- [ ] **Step 3: Implement `src/utils/spatialNavigation.ts`**
Implement vector calculation, 50° cone angular penalty, and candidate element discovery.
- [ ] **Step 4: Re-run test and confirm passing**
Verify that `tests/spatial-navigation.check.ts` passes.

---

### Task 2: Gamepad Service Analog Triggers & Multi-Tier Haptics

**Files:**
- Modify: `src/types/gamepad.ts`
- Modify: `src/services/gamepadService.ts`
- Modify: `src/hooks/useGamepad.ts`
- Test: `tests/gamepad-service.check.ts`

**Interfaces:**
- Consumes: `navigator.getGamepads()`
- Produces: `GamepadSnapshot.triggers` (`{ left: number; right: number }` continuous 0.0-1.0)
- Produces: `triggerHapticPattern(pattern: 'tick' | 'detent' | 'goldSuccess' | 'solidSuccess' | 'offTime' | 'motorHum')`

- [ ] **Step 1: Update `src/types/gamepad.ts` with trigger values and haptic patterns**
Add typed interfaces for haptic pattern names and trigger sensitivity.
- [ ] **Step 2: Add failing tests to `tests/gamepad-service.check.ts`**
Add assertions for analog trigger normalization and haptic pattern dispatch.
- [ ] **Step 3: Update `src/services/gamepadService.ts` and `src/hooks/useGamepad.ts`**
Expose continuous trigger values and the `triggerHapticPattern` helper with fallbacks.
- [ ] **Step 4: Run `tests/gamepad-service.check.ts` and verify passes**

---

### Task 3: Studio Floor Directional Hotspots & Camera R3 Zoom

**Files:**
- Modify: `src/utils/studioHotspots.ts`
- Modify: `src/components/StudioRoom.tsx`
- Modify: `src/components/WebGLCanvas.tsx`
- Test: `tests/studio-hotspot-nav.check.ts`

**Interfaces:**
- Consumes: Hotspot definitions and world coordinates
- Produces: `getNextHotspotDirectional(current: StudioHotspot, dir: 'up' | 'down' | 'left' | 'right', era: string): StudioHotspot`

- [ ] **Step 1: Write failing test in `tests/studio-hotspot-nav.check.ts`**
Verify directional transitions between `console`, `liveRoom`, `phone`, `clock`, `tv`, `shelf`.
- [ ] **Step 2: Implement `getNextHotspotDirectional` in `src/utils/studioHotspots.ts`**
Map normalized positions and geometric vector selection for floor hotspots.
- [ ] **Step 3: Wire directional hotspot transitions in `src/components/StudioRoom.tsx`**
Replace linear hotspot array modulo cycling with directional transitions on D-Pad and Left Stick.
- [ ] **Step 4: Update `src/components/WebGLCanvas.tsx` camera control**
Map Right Stick click (R3) to toggle zoom between 1.0x and 1.6x; remove RT zoom conflict so RT is free for transport.
- [ ] **Step 5: Run tests and verify passing**

---

### Task 4: Tactical Console Transport (Analog RT Punch-In & PocketMeter Scrubbing)

**Files:**
- Modify: `src/components/console/PocketMeter.tsx`
- Modify: `src/components/ActiveProject.tsx`
- Test: `tests/take-calibration.check.ts`

**Interfaces:**
- Consumes: `useGamepad.triggers.right`, `useGamepad.triggerHapticPattern`, `useGamepad.leftStick`
- Produces: Arming take on RT squeeze (>0.4), locking take on RT full pull (>0.8) or South button.

- [ ] **Step 1: Integrate RT analog punch-in and detent haptics in `PocketMeter.tsx`**
Support RT actuation alongside South button; trigger `hapticTick` on Gold pocket entry and `hapticLockTake` on completion.
- [ ] **Step 2: Add dynamic fader velocity in `ActiveProject.tsx`**
Use progressive Left Stick tilt for fine (1%) vs coarse (10%) focus mixer tuning with haptic detents.
- [ ] **Step 3: Run `tests/take-calibration.check.ts` and verify regression pass**

---

### Task 5: 2D Spatial Grid Navigation in `GamepadNavContext.tsx` & Dynamic HUD

**Files:**
- Modify: `src/contexts/GamepadNavContext.tsx`
- Modify: `src/components/ui/GamepadHUD.tsx`
- Modify: `src/components/studio-play.css`
- Test: `tests/gamepad-navigation.check.ts`

**Interfaces:**
- Consumes: `findNextSpatialFocus` from `src/utils/spatialNavigation.ts`
- Produces: 2D directional navigation in drawer contents; dynamic context-aware HUD labels.

- [ ] **Step 1: Update `GamepadNavContext.tsx` to use `findNextSpatialFocus`**
When navigating with D-Pad or Left Stick in a dialog or drawer, use 2D cone raycasting before falling back to linear order.
- [ ] **Step 2: Update `GamepadHUD.tsx`**
Display dynamic contextual badges (`RT: Lock Take`, `A: Inspect / Select`, `B: Back`, `D-pad: Move`, `LB/RB: Categories`).
- [ ] **Step 3: Add gamepad glowing amber focus ring in `studio-play.css`**
Add `.gamepad-focus-ring` with amber halo styling.
- [ ] **Step 4: Run `tests/gamepad-navigation.check.ts` and verify pass**

---

### Task 6: Full Verification & Automated Regression Suite

**Files:**
- Test: `bash scripts/run-checks.sh`

- [ ] **Step 1: Run complete check script**
Execute `bash scripts/run-checks.sh` to ensure all 10+ suites pass without warning or error.
- [ ] **Step 2: Run TypeScript build check**
Execute `pnpm run build` to confirm zero compilation errors.
