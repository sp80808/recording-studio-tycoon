# Gamepad Controller Support, Dynamic UI Navigation & Pad-Centric Minigames Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate full cross-platform Gamepad API support (Xbox, PS4/PS5, Switch, Generic), authentic dynamic SVG glyphs, spatial UI navigation with bumper tab cycling and a radial action wheel, and three pad-centric studio minigames (MPC Beat Pad, Tape Jog & Splice, Dual-Stick Console Fader Ride).

**Architecture:** A centralized `GamepadService` / `useGamepad` engine polls controller hardware at 60fps with deadzones, edge-triggered buttons, and haptics. Contextual button glyphs auto-switch between controller badges and keyboard/mouse hints. A `GamepadNavContext` coordinates 2D spatial focus and modal trapping. Three new minigames bind directly to analog sticks, triggers, and face buttons with audio synthesis and haptic feedback.

**Tech Stack:** HTML5 Gamepad API, React 18, TypeScript, Tailwind CSS, Tone.js / Web Audio API, SVG vector graphics.

**Spec:** [docs/superpowers/specs/2026-09-29-gamepad-controller-support-and-minigames-design.md](file:///Volumes/Harry/DEV/Recording%20Studio%20Tycoon/RST%20v1.5/recording-studio-tycoon/docs/superpowers/specs/2026-09-29-gamepad-controller-support-and-minigames-design.md)

## Global Constraints
- Pure TypeScript / React without introducing unvetted heavy external dependencies (use stdlib and Web standard APIs).
- Deadzone threshold fixed at `0.18` for analog sticks to avoid drift.
- Backward compatibility: Mouse, touch, and keyboard interactions must continue to work flawlessly alongside gamepad input.
- Test runner: `node` executing bundled check scripts via `esbuild` according to `scripts/run-checks.sh`.

---

### Task 1: Gamepad Types & Core Polling Service (`recording-studio-tycoon-49i.1`)

**Files:**
- Create: `src/types/gamepad.ts`
- Create: `src/services/gamepadService.ts`
- Create: `src/hooks/useGamepad.ts`
- Test: `tests/gamepad-service.check.ts`

**Interfaces:**
- Produces:
  - `ControllerType`: `'xbox' | 'playstation' | 'switch' | 'generic'`
  - `StandardButton`: `'south' | 'east' | 'west' | 'north' | 'lb' | 'rb' | 'lt' | 'rt' | 'select' | 'start' | 'ls' | 'rs' | 'dpadUp' | 'dpadDown' | 'dpadLeft' | 'dpadRight'`
  - `GamepadState`: `{ isConnected: boolean; controllerType: ControllerType; buttons: Record<StandardButton, boolean>; justPressed: Record<StandardButton, boolean>; justReleased: Record<StandardButton, boolean>; leftStick: { x: number; y: number }; rightStick: { x: number; y: number }; triggers: { left: number; right: number }; triggerHaptic: (intensity?: number, durationMs?: number) => void }`
  - `detectControllerType(id: string): ControllerType`
  - `processStickAxes(rawX: number, rawY: number, deadzone?: number): { x: number; y: number }`

- [ ] **Step 1: Write the failing test**

Create `tests/gamepad-service.check.ts`:
```typescript
import { detectControllerType, processStickAxes, mapStandardGamepadButtons } from '@/services/gamepadService';

let passed = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

// 1. Controller detection heuristics
ok(detectControllerType('Xbox 360 Controller (XInput STANDARD GAMEPAD)') === 'xbox', 'detects Xbox 360 controller');
ok(detectControllerType('Xbox Wireless Controller (045e)') === 'xbox', 'detects Xbox Wireless controller');
ok(detectControllerType('Sony Interactive Entertainment Wireless Controller (054c)') === 'playstation', 'detects DualShock / DualSense');
ok(detectControllerType('PS4 DualShock 4 Wireless Controller') === 'playstation', 'detects PS4 controller');
ok(detectControllerType('Nintendo Switch Pro Controller (057e)') === 'switch', 'detects Switch Pro');
ok(detectControllerType('Unknown USB Gamepad') === 'generic', 'detects generic pad');

// 2. Deadzone processing
const centered = processStickAxes(0.05, -0.08, 0.18);
ok(centered.x === 0 && centered.y === 0, 'deadzone eliminates micro-drift');

const deflected = processStickAxes(0.8, -0.6, 0.18);
ok(deflected.x > 0.7 && deflected.y < -0.5, 'preserves valid stick deflection');

// 3. Standard button mapping
const mockButtons = Array.from({ length: 17 }, (_, i) => ({ pressed: i === 0, value: i === 0 ? 1 : 0 }));
const mapped = mapStandardGamepadButtons(mockButtons as any);
ok(mapped.south === true && mapped.east === false, 'maps button 0 to south');

console.log(`gamepad-service: all ${passed} checks passed`);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/esbuild tests/gamepad-service.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-gamepad-service.cjs --alias:@=./src && node /tmp/rst-gamepad-service.cjs`
Expected: FAIL with missing module `@/services/gamepadService`.

- [ ] **Step 3: Implement Gamepad types and service**

Create `src/types/gamepad.ts`:
```typescript
export type ControllerType = 'xbox' | 'playstation' | 'switch' | 'generic';

export type ControllerLayoutPreference = 'auto' | 'xbox' | 'playstation' | 'switch' | 'generic';

export type StandardButton =
  | 'south'
  | 'east'
  | 'west'
  | 'north'
  | 'lb'
  | 'rb'
  | 'lt'
  | 'rt'
  | 'select'
  | 'start'
  | 'ls'
  | 'rs'
  | 'dpadUp'
  | 'dpadDown'
  | 'dpadLeft'
  | 'dpadRight';

export interface GamepadStickState {
  x: number;
  y: number;
}

export interface GamepadSnapshot {
  isConnected: boolean;
  controllerType: ControllerType;
  buttons: Record<StandardButton, boolean>;
  justPressed: Record<StandardButton, boolean>;
  justReleased: Record<StandardButton, boolean>;
  leftStick: GamepadStickState;
  rightStick: GamepadStickState;
  triggers: { left: number; right: number };
}
```

Create `src/services/gamepadService.ts` and `src/hooks/useGamepad.ts` providing polling, deadzones, haptics, and active input mode tracking.

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/esbuild tests/gamepad-service.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-gamepad-service.cjs --alias:@=./src && node /tmp/rst-gamepad-service.cjs`
Expected: PASS with 8 checks passed.

---

### Task 2: Vector SVG GamepadGlyph Component & SettingsModal Integration (`recording-studio-tycoon-49i.2`)

**Files:**
- Create: `src/components/ui/GamepadGlyph.tsx`
- Modify: `src/components/modals/SettingsModal.tsx`
- Modify: `src/contexts/SettingsContext.tsx`
- Test: `tests/gamepad-glyph.check.ts`

**Interfaces:**
- Consumes: `ControllerType`, `StandardButton` from `src/types/gamepad.ts`
- Produces:
  - `<GamepadGlyph button={StandardButton} controllerType?: ControllerType size?: 'xs' | 'sm' | 'md' | 'lg' />`
  - Settings fields: `controllerLayout: ControllerLayoutPreference`, `gamepadHaptics: boolean`

- [ ] **Step 1: Write the failing test**

Create `tests/gamepad-glyph.check.ts`:
```typescript
import { getButtonLabel } from '@/components/ui/GamepadGlyph';

let passed = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

ok(getButtonLabel('south', 'xbox') === 'A', 'Xbox south is A');
ok(getButtonLabel('east', 'xbox') === 'B', 'Xbox east is B');
ok(getButtonLabel('south', 'playstation') === '✕', 'PlayStation south is Cross');
ok(getButtonLabel('east', 'playstation') === '○', 'PlayStation east is Circle');
ok(getButtonLabel('south', 'switch') === 'B', 'Switch south is B');
ok(getButtonLabel('east', 'switch') === 'A', 'Switch east is A');
ok(getButtonLabel('south', 'generic') === 'S', 'Generic south is S');

console.log(`gamepad-glyph: all ${passed} checks passed`);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/esbuild tests/gamepad-glyph.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-gamepad-glyph.cjs --alias:@=./src && node /tmp/rst-gamepad-glyph.cjs`
Expected: FAIL with missing module `@/components/ui/GamepadGlyph`.

- [ ] **Step 3: Implement GamepadGlyph & Settings Integration**

Implement `src/components/ui/GamepadGlyph.tsx` with scalable vector badges:
- Colors:
  - Xbox: Green A (`#10b981`), Red B (`#ef4444`), Blue X (`#3b82f6`), Yellow Y (`#eab308`).
  - PlayStation: Cyan Cross, Red Circle, Pink Square, Green Triangle.
  - Switch: Classic red/cyan accents.
  - Generic: Sleek slate-800 badges with silver markings.
Add layout dropdown and haptics toggle to `SettingsContext` and `SettingsModal.tsx`.

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/esbuild tests/gamepad-glyph.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-gamepad-glyph.cjs --alias:@=./src && node /tmp/rst-gamepad-glyph.cjs`
Expected: PASS with 7 checks passed.

---

### Task 3: Spatial Navigation, Focus Manager & Dock Bumper Cycling (`recording-studio-tycoon-49i.3`)

**Files:**
- Create: `src/contexts/GamepadNavContext.tsx`
- Modify: `src/components/MainGameContent.tsx`
- Modify: `src/components/GameLayout.tsx`
- Create: `src/components/ui/GamepadHUD.tsx`
- Test: `tests/gamepad-navigation.check.ts`

**Interfaces:**
- Consumes: `useGamepad`, `GamepadGlyph`
- Produces:
  - `GamepadNavProvider`: tracks active focus, captures bumper events to cycle dock tabs (`LB`/`RB`), trigger scrolling (`LT`/`RT`), and handles global `X` (Quick Session Work) and `Y` (Advance Day).
  - `<GamepadHUD />`: contextual prompt bar showing available actions.

- [ ] **Step 1: Write the failing test**

Create `tests/gamepad-navigation.check.ts`:
```typescript
import { getNextDockTab, getPreviousDockTab, DOCK_TABS } from '@/contexts/GamepadNavContext';

let passed = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

ok(DOCK_TABS.length === 7, 'has 7 primary dock tabs');
ok(getNextDockTab('bookings') === 'session', 'bookings next is session');
ok(getNextDockTab('career') === 'bookings', 'career wraps to bookings');
ok(getPreviousDockTab('bookings') === 'career', 'bookings prev wraps to career');
ok(getPreviousDockTab('session') === 'bookings', 'session prev is bookings');

console.log(`gamepad-navigation: all ${passed} checks passed`);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/esbuild tests/gamepad-navigation.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-gamepad-navigation.cjs --alias:@=./src && node /tmp/rst-gamepad-navigation.cjs`
Expected: FAIL.

- [ ] **Step 3: Implement GamepadNavContext & GamepadHUD**

Implement `GamepadNavContext.tsx` with:
- `DOCK_TABS = ['bookings', 'session', 'studio', 'staff', 'bands', 'charts', 'career']`
- Spatial focus traversal on D-Pad and Left Stick
- Bumper tab switching
- Trigger scrolling on active scroll areas
- Focus ring styling: `ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950 shadow-[0_0_12px_rgba(251,191,36,0.6)]`

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/esbuild tests/gamepad-navigation.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-gamepad-navigation.cjs --alias:@=./src && node /tmp/rst-gamepad-navigation.cjs`
Expected: PASS with 5 checks passed.

---

### Task 4: Radial Studio Action Wheel Interface (`recording-studio-tycoon-49i.4`)

**Files:**
- Create: `src/components/ui/RadialActionWheel.tsx`
- Modify: `src/components/MainGameContent.tsx`
- Test: `tests/radial-wheel.check.ts`

**Interfaces:**
- Consumes: `leftStick`, `triggers`, `triggerHaptic` from `useGamepad`
- Produces:
  - `<RadialActionWheel isOpen={boolean} activeAngle={number} onSelect={(tab) => void} onClose={() => void} />`
  - `getRadialSliceIndex(stickX: number, stickY: number, slices: number): number | null`

- [ ] **Step 1: Write the failing test**

Create `tests/radial-wheel.check.ts`:
```typescript
import { getRadialSliceFromStick, RADIAL_SLICES } from '@/components/ui/RadialActionWheel';

let passed = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

ok(RADIAL_SLICES.length === 8, '8 radial slice options');
// Stick pointing straight up (0, -1) -> North (Bookings)
const northSlice = getRadialSliceFromStick(0, -1);
ok(northSlice?.id === 'bookings', 'North slice is bookings');

// Stick pointing right (1, 0) -> East (Gear)
const eastSlice = getRadialSliceFromStick(1, 0);
ok(eastSlice?.id === 'studio', 'East slice is studio gear');

// Neutral / center returns null
ok(getRadialSliceFromStick(0.05, 0.05) === null, 'neutral stick returns null');

console.log(`radial-wheel: all ${passed} checks passed`);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/esbuild tests/radial-wheel.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-radial-wheel.cjs --alias:@=./src && node /tmp/rst-radial-wheel.cjs`
Expected: FAIL.

- [ ] **Step 3: Implement RadialActionWheel component**

Build circular overlay featuring:
- Sleek studio console aesthetics with vintage amber glow
- 8 slices: Bookings, Session, Gear, Artists, Crew, Charts, Career, Settings
- Smooth angle pointer responding to Left Stick with tactile haptics on slice change
- Quick activation when `LT` held or `R3` clicked.

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/esbuild tests/radial-wheel.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-radial-wheel.cjs --alias:@=./src && node /tmp/rst-radial-wheel.cjs`
Expected: PASS with 5 checks passed.

---

### Task 5: MPC Beat Pad Minigame (`recording-studio-tycoon-49i.5`)

**Files:**
- Create: `src/components/minigames/BeatPadGame.tsx`
- Modify: `src/components/minigames/MinigameManager.tsx`
- Test: `tests/beat-pad-game.check.ts`

**Interfaces:**
- Produces:
  - `<BeatPadGame minigameId="beat-pad" onComplete={(score, success) => void} onClose={() => void} />`
  - Scoring & timing logic: `gradePadHit(actualMs: number, targetMs: number): { grade: 'Perfect' | 'Great' | 'Good' | 'Miss'; points: number }`

- [ ] **Step 1: Write the failing test**

Create `tests/beat-pad-game.check.ts`:
```typescript
import { gradePadHit, calculateBeatPadScore } from '@/components/minigames/BeatPadGame';

let passed = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

ok(gradePadHit(1000, 1010).grade === 'Perfect', 'within 25ms is Perfect');
ok(gradePadHit(1000, 1040).grade === 'Great', 'within 50ms is Great');
ok(gradePadHit(1000, 1080).grade === 'Good', 'within 90ms is Good');
ok(gradePadHit(1000, 1200).grade === 'Miss', 'beyond 90ms is Miss');

const perfectScore = calculateBeatPadScore([200, 200, 200, 200, 200]);
ok(perfectScore === 1000, '5 perfects give 1000 points');

console.log(`beat-pad-game: all ${passed} checks passed`);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/esbuild tests/beat-pad-game.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-beat-pad-game.cjs --alias:@=./src && node /tmp/rst-beat-pad-game.cjs`
Expected: FAIL.

- [ ] **Step 3: Implement BeatPadGame**

Build `BeatPadGame.tsx` with:
- 4 glowing MPC-style pads with dynamic controller face button labels (A/B/X/Y or ✕/○/□/△)
- Audio synthesis for Kick, Snare, Hi-Hat, Clap using Tone.js / Web Audio
- Scrolling note highway / rhythm bars
- Controller rumble on downbeats
- Final score calculation yielding Creativity and Technical bonuses.

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/esbuild tests/beat-pad-game.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-beat-pad-game.cjs --alias:@=./src && node /tmp/rst-beat-pad-game.cjs`
Expected: PASS with 5 checks passed.

---

### Task 6: Reel-to-Reel Tape Jog & Splice Minigame (`recording-studio-tycoon-49i.6`)

**Files:**
- Create: `src/components/minigames/TapeJogGame.tsx`
- Modify: `src/components/minigames/MinigameManager.tsx`
- Test: `tests/tape-jog-game.check.ts`

**Interfaces:**
- Produces:
  - `<TapeJogGame minigameId="tape-jog" onComplete={(score, success) => void} onClose={() => void} />`
  - Tape alignment & splice grading: `gradeTapeSplice(markedIn: number, markedOut: number, targetIn: number, targetOut: number): { accuracy: number; points: number }`

- [ ] **Step 1: Write the failing test**

Create `tests/tape-jog-game.check.ts`:
```typescript
import { gradeTapeSplice, calculateScrubSpeed } from '@/components/minigames/TapeJogGame';

let passed = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

// Exact splice match
const perfect = gradeTapeSplice(40, 60, 40, 60);
ok(perfect.accuracy === 100 && perfect.points === 250, 'exact splice gives 100% and 250 pts');

// Near-miss splice
const near = gradeTapeSplice(38, 62, 40, 60);
ok(near.accuracy >= 90 && near.points >= 200, 'near splice gives high points');

// Stick scrub speed conversion
ok(calculateScrubSpeed(0.8) > calculateScrubSpeed(0.2), 'higher stick deflection yields faster scrub');
ok(calculateScrubSpeed(-0.8) < 0, 'negative deflection scrubs backward');

console.log(`tape-jog-game: all ${passed} checks passed`);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/esbuild tests/tape-jog-game.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-tape-jog-game.cjs --alias:@=./src && node /tmp/rst-tape-jog-game.cjs`
Expected: FAIL.

- [ ] **Step 3: Implement TapeJogGame**

Build `TapeJogGame.tsx` with:
- Dual spinning tape spools rendered with SVG/Canvas
- Left/Right analog stick scrub with simulated tape scrub playback sound
- `LT`/`RT` trigger marker placement for In/Out points
- `A` / `✕` razor slice animation with tape splice sound and haptic pulse.

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/esbuild tests/tape-jog-game.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-tape-jog-game.cjs --alias:@=./src && node /tmp/rst-tape-jog-game.cjs`
Expected: PASS with 4 checks passed.

---

### Task 7: Dual-Stick Console Fader Ride & Stereo Pan Minigame (`recording-studio-tycoon-49i.7`)

**Files:**
- Create: `src/components/minigames/ConsoleRideGame.tsx`
- Modify: `src/components/minigames/MinigameManager.tsx`
- Test: `tests/console-ride-game.check.ts`

**Interfaces:**
- Produces:
  - `<ConsoleRideGame minigameId="console-ride" onComplete={(score, success) => void} onClose={() => void} />`
  - Fader & Pan calculations: `evaluateMixOutput(faderVal: number, panVal: number, trackLevel: number, targetPan: number): { inSweetSpot: boolean; isClipping: boolean; scoreDelta: number }`

- [ ] **Step 1: Write the failing test**

Create `tests/console-ride-game.check.ts`:
```typescript
import { evaluateMixOutput, calculateConsoleRideScore } from '@/components/minigames/ConsoleRideGame';

let passed = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

// Target RMS sweet spot (level ~50, pan ~0)
const sweetSpot = evaluateMixOutput(50, 0, 50, 0);
ok(sweetSpot.inSweetSpot === true && sweetSpot.isClipping === false, 'level in sweet spot');

// Clipping (>92 output level)
const clipping = evaluateMixOutput(95, 0, 80, 0);
ok(clipping.isClipping === true, 'detects digital clipping');

// Off-center pan
const uncentered = evaluateMixOutput(50, 40, 50, -40);
ok(uncentered.inSweetSpot === false, 'panning mismatch is not sweet spot');

console.log(`console-ride-game: all ${passed} checks passed`);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/esbuild tests/console-ride-game.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-console-ride-game.cjs --alias:@=./src && node /tmp/rst-console-ride-game.cjs`
Expected: FAIL.

- [ ] **Step 3: Implement ConsoleRideGame**

Build `ConsoleRideGame.tsx` featuring:
- Industrial console strip with motorized vertical fader and circular pan knob
- Left Stick vertical axis controls fader smoothly
- Right Stick horizontal axis controls stereo pan
- Dual VU meters with needle bounce
- Urgency rumble haptics when output enters clipping red zone.

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/esbuild tests/console-ride-game.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-console-ride-game.cjs --alias:@=./src && node /tmp/rst-console-ride-game.cjs`
Expected: PASS with 4 checks passed.

---

### Task 8: MinigameManager Integration, Dynamic HUD Badges & Verification Suite (`recording-studio-tycoon-49i.8`)

**Files:**
- Modify: `src/components/minigames/MinigameManager.tsx`
- Modify: `src/components/MainGameContent.tsx`
- Modify: `src/components/ActiveProject.tsx`
- Modify: `scripts/run-checks.sh`
- Test: `tests/gamepad-suite.check.ts`

**Interfaces:**
- Updates `MinigameType` union to include `'beat-pad' | 'tape-jog' | 'console-ride'`
- Connects dynamic prompt badges in main action buttons
- Adds all gamepad checks to `scripts/run-checks.sh`.

- [ ] **Step 1: Write the failing suite test**

Create `tests/gamepad-suite.check.ts`:
```typescript
import { detectControllerType } from '@/services/gamepadService';
import { getButtonLabel } from '@/components/ui/GamepadGlyph';
import { DOCK_TABS } from '@/contexts/GamepadNavContext';
import { RADIAL_SLICES } from '@/components/ui/RadialActionWheel';

let passed = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

ok(detectControllerType('Xbox') === 'xbox', 'Xbox detection');
ok(getButtonLabel('south', 'xbox') === 'A', 'Xbox A label');
ok(DOCK_TABS.length === 7, '7 dock tabs');
ok(RADIAL_SLICES.length === 8, '8 radial slices');

console.log(`gamepad-suite: all ${passed} integration checks passed`);
```

- [ ] **Step 2: Integrate MinigameManager & HUD Prompts**
- Wire new minigames into `MinigameManager.tsx` switch statement and reward calculations.
- Add `<GamepadHUD />` and inline `<GamepadGlyph />` prompts to `MainGameContent.tsx` and `ActiveProject.tsx`.
- Add test checks to `scripts/run-checks.sh`.

- [ ] **Step 3: Run full verification test suite**

Run: `pnpm test`
Expected: All test checks pass, including newly added gamepad checks.
