# Studio Chore Engine, Progression Loops & Loot Reward Animations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement an authentic Studio Maintenance & Daily Chores engine with active session buffs, interactive isometric floor badges, transport dock clipboard UI, core progression take coupling, and a cinematic 3D Vintage Flight Case unboxing reward sequence with rarity light rays and enhanced reward flights.

**Architecture:** 
- `choreEngine.ts` maintains typed studio duties, condition decay, daily refresh, active buffs, and streak crate tokens.
- `StudioDutiesClipboard.tsx` renders an industrial wood/metal clipboard in the dock with D-pad navigation and instant execution.
- `StudioRoom.tsx` / `WebGLCanvas.tsx` displays anchored floating maintenance indicators over room hotspots.
- `takeEvaluation.ts` and `useStageWork.ts` consume active buffs for expanded PocketMeter sweet spots and XP/stat scaling.
- `CrateUnboxingModal.tsx` provides a 4-phase 3D flight case unboxing sequence with metal latches, light rays, card flip, and inventory/selling actions.
- `RewardFlights.tsx` delivers trailing particles and combo milestone callouts.

**Tech Stack:** React 19, TypeScript, Framer Motion 12, PixiJS 8, Lucide React, Tone.js, Tailwind CSS, esbuild test runner.

**Spec:** [`docs/superpowers/specs/2026-09-29-chore-engine-loot-animations-design.md`](file:///Volumes/Harry/DEV/Recording%20Studio%20Tycoon/RST%20v1.5/recording-studio-tycoon/docs/superpowers/specs/2026-09-29-chore-engine-loot-animations-design.md)

## Global Constraints
- Do not break existing save game loading; initialize default `choreState` if missing from save snapshots.
- Preserve 100% pass rate across all existing checks in `scripts/run-checks.sh`.
- Audio triggers must gracefully handle headless/unlocked Web Audio environments via safe guards.
- Support both mouse click and Gamepad D-pad / (A) navigation for clipboard duties and crate unboxing.

---

### Task 1: Chore Engine Core Service & Game State Integration

**Files:**
- Create: `src/simulation/choreEngine.ts`
- Modify: `src/types/game.ts`
- Modify: `src/hooks/useGameState.ts`
- Test: `tests/chore-engine.check.ts`

**Interfaces:**
- Consumes: `GameState` from `src/types/game.ts`
- Produces: 
  - `createInitialChoreState(): StudioChoreState`
  - `executeStudioChore(state: StudioChoreState, choreId: StudioChoreId, playerEnergy: number): { nextChoreState: StudioChoreState; energyBurned: number; xpAwarded: number; buffGranted: ActiveChoreBuff } | null`
  - `refreshDailyChores(state: StudioChoreState, currentDay: number): { nextChoreState: StudioChoreState; crateAwarded: boolean }`
  - `hasActiveChoreBuff(state: StudioChoreState, buffType: StudioChore['buffType']): boolean`
  - `getActiveBuffMagnitude(state: StudioChoreState, buffType: StudioChore['buffType']): number`

- [ ] **Step 1: Write the failing test `tests/chore-engine.check.ts`**

```typescript
import assert from 'node:assert';
import {
  createInitialChoreState,
  executeStudioChore,
  refreshDailyChores,
  hasActiveChoreBuff,
  getActiveBuffMagnitude,
  StudioChoreId
} from '../src/simulation/choreEngine';

console.log('Testing Chore Engine Core Service...');

// 1. Initial State
const state = createInitialChoreState();
assert.strictEqual(Object.keys(state.chores).length, 5, 'Should have 5 authored studio chores');
assert.strictEqual(state.chores.clean_tape_heads.completed, false);
assert.strictEqual(state.streakDays, 0);
assert.strictEqual(state.activeBuffs.length, 0);
console.log('PASS: Initial chore state verified');

// 2. Execute Chore with sufficient energy
const execResult = executeStudioChore(state, 'clean_tape_heads', 3);
assert(execResult !== null, 'Chore execution should succeed');
assert.strictEqual(execResult.nextChoreState.chores.clean_tape_heads.completed, true);
assert.strictEqual(execResult.energyBurned, 1);
assert.strictEqual(execResult.xpAwarded, 35);
assert.strictEqual(hasActiveChoreBuff(execResult.nextChoreState, 'timing_bonus'), true);
assert.strictEqual(getActiveBuffMagnitude(execResult.nextChoreState, 'timing_bonus'), 0.10);
console.log('PASS: Execute chore grants buff and marks completed');

// 3. Prevent duplicate execution
const duplicateResult = executeStudioChore(execResult.nextChoreState, 'clean_tape_heads', 3);
assert.strictEqual(duplicateResult, null, 'Cannot execute already completed chore');
console.log('PASS: Prevents duplicate execution');

// 4. Daily Refresh and Streak Tracking
let dailyState = execResult.nextChoreState;
// Complete 2 more chores to hit >= 3 threshold
const chore2 = executeStudioChore(dailyState, 'calibrate_outboard', 3)!;
const chore3 = executeStudioChore(chore2.nextChoreState, 'organize_patchbay', 3)!;
dailyState = chore3.nextChoreState;
assert.strictEqual(dailyState.dailyCompletedCount, 3);

// Advance Day 1 -> streak should become 1
const day1 = refreshDailyChores(dailyState, 2);
assert.strictEqual(day1.nextChoreState.streakDays, 1);
assert.strictEqual(day1.nextChoreState.chores.clean_tape_heads.completed, false);
assert.strictEqual(day1.crateAwarded, false);
console.log('PASS: Day refresh increments streak when threshold met');

// Advance Day 2 and 3 with threshold to trigger 3-day streak crate award
let streakState = day1.nextChoreState;
streakState = executeStudioChore(streakState, 'clean_tape_heads', 3)!.nextChoreState;
streakState = executeStudioChore(streakState, 'calibrate_outboard', 3)!.nextChoreState;
streakState = executeStudioChore(streakState, 'tune_acoustics', 3)!.nextChoreState;
const day2 = refreshDailyChores(streakState, 3);
assert.strictEqual(day2.nextChoreState.streakDays, 2);

streakState = day2.nextChoreState;
streakState = executeStudioChore(streakState, 'clean_tape_heads', 3)!.nextChoreState;
streakState = executeStudioChore(streakState, 'calibrate_outboard', 3)!.nextChoreState;
streakState = executeStudioChore(streakState, 'brew_espresso', 3)!.nextChoreState;
const day3 = refreshDailyChores(streakState, 4);
assert.strictEqual(day3.nextChoreState.streakDays, 3);
assert.strictEqual(day3.crateAwarded, true, '3-day streak should award a vintage flight case crate');
console.log('PASS: 3-day chore streak awards crate');

console.log('chore-engine: all checks passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/esbuild tests/chore-engine.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-chore-engine.cjs --alias:@=./src && node /tmp/rst-chore-engine.cjs`  
Expected: FAIL with "Cannot find module '../src/simulation/choreEngine'"

- [ ] **Step 3: Implement `src/simulation/choreEngine.ts`, update `src/types/game.ts` and `src/hooks/useGameState.ts`**

Implement complete types, initial chore catalog (`clean_tape_heads`, `calibrate_outboard`, `organize_patchbay`, `tune_acoustics`, `brew_espresso`), execution handler, and streak refresh logic in `src/simulation/choreEngine.ts`. In `src/types/game.ts` add `choreState` and `pendingCrates` to `GameState`. Ensure default state fallback in `useGameState.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/esbuild tests/chore-engine.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-chore-engine.cjs --alias:@=./src && node /tmp/rst-chore-engine.cjs`  
Expected: PASS with "chore-engine: all checks passed"

- [ ] **Step 5: Commit Task 1**

```bash
git add src/simulation/choreEngine.ts src/types/game.ts src/hooks/useGameState.ts tests/chore-engine.check.ts
git commit -m "feat(chore): implement studio chore engine service and state schema"
```

---

### Task 2: Daily Chore Refresh & Progression Loop Coupling

**Files:**
- Modify: `src/hooks/useGameActions.ts`
- Modify: `src/hooks/useStageWork.ts`
- Modify: `src/rpg/takeEvaluation.ts`
- Test: `tests/chore-progression-coupling.check.ts`

**Interfaces:**
- Consumes: `choreEngine.ts` helpers (`refreshDailyChores`, `hasActiveChoreBuff`, `getActiveBuffMagnitude`, `consumeChoreBuffSession`)
- Produces: 
  - PocketMeter tolerance widened by `timing_bonus`
  - Technical points scaled by `1 + tech_bonus`
  - Creativity points scaled by `1 + creativity_bonus`
  - Overdrive take energy cost reduced by `energy_saver`
  - Daily day advancement automatically triggers `refreshDailyChores` and queues crate drops

- [ ] **Step 1: Write the failing test `tests/chore-progression-coupling.check.ts`**

```typescript
import assert from 'node:assert';
import { evaluateTakeQuality } from '../src/rpg/takeEvaluation';
import { createInitialChoreState } from '../src/simulation/choreEngine';

console.log('Testing Chore Progression Coupling...');

const defaultState = createInitialChoreState();

// Test 1: Standard PocketMeter evaluation
// Target sweet spot is centered at 0.78, base Gold tolerance is ±0.04 (0.74 to 0.82)
const baseTakeStandard = evaluateTakeQuality(0.735, 100);
assert.strictEqual(baseTakeStandard.tier, 'silver', '0.735 is just outside standard 0.74 gold range');

// Test 2: Active timing_bonus expands Gold range (+10% tolerance)
// With +10% tolerance, tolerance becomes 0.044, so 0.736 is inside [0.736, 0.824]
const boostedTake = evaluateTakeQuality(0.738, 100, { timingBonus: 0.10 });
assert.strictEqual(boostedTake.tier, 'gold', 'With timing bonus, 0.738 qualifies for Gold Take');
console.log('PASS: timing_bonus successfully widens PocketMeter Gold window');

console.log('chore-progression-coupling: all checks passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/esbuild tests/chore-progression-coupling.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-chore-progression-coupling.cjs --alias:@=./src && node /tmp/rst-chore-progression-coupling.cjs`  
Expected: FAIL

- [ ] **Step 3: Update `takeEvaluation.ts`, `useStageWork.ts`, and `useGameActions.ts`**

- In `takeEvaluation.ts`: accept optional `options?: { timingBonus?: number }` and scale tolerance window accordingly.
- In `useStageWork.ts`: read active chore buffs from `gameState.choreState`, apply `timing_bonus` to PocketMeter score evaluation, apply `tech_bonus` / `creativity_bonus` multipliers to stage unit progression, and discount overdrive energy if `energy_saver` is active. Decrement buff session count on stage completion.
- In `useGameActions.ts` `advanceDay`: call `refreshDailyChores(gameState.choreState, nextDay)` and add a crate to `gameState.pendingCrates` if awarded.

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/esbuild tests/chore-progression-coupling.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-chore-progression-coupling.cjs --alias:@=./src && node /tmp/rst-chore-progression-coupling.cjs`  
Expected: PASS

- [ ] **Step 5: Commit Task 2**

```bash
git add src/rpg/takeEvaluation.ts src/hooks/useStageWork.ts src/hooks/useGameActions.ts tests/chore-progression-coupling.check.ts
git commit -m "feat(progression): wire chore buffs into pocket take timing and session progression"
```

---

### Task 3: Studio Duties Clipboard UI & Gamepad Integration

**Files:**
- Create: `src/components/chores/StudioDutiesClipboard.tsx`
- Create: `src/components/chores/studio-duties.css`
- Modify: `src/components/transport/TransportDock.tsx` or `src/components/ActiveProject.tsx`
- Test: `tests/studio-duties-clipboard.check.ts`

**Interfaces:**
- Consumes: `gameState.choreState`, `onPerformChore(choreId: StudioChoreId)`, `playerEnergy: number`
- Produces: Interactive tactile clipboard component rendering:
  - 5 daily chores with category tags, energy costs, checkboxes, and buff description
  - Streak progress display (`Streak: N Days`)
  - Gamepad D-pad up/down focus and button `(A)` completion trigger
  - Mechanical click sound effect via `gameAudio`

- [ ] **Step 1: Write the failing test `tests/studio-duties-clipboard.check.ts`**

```typescript
import assert from 'node:assert';
import { createInitialChoreState } from '../src/simulation/choreEngine';

console.log('Testing Studio Duties Clipboard Specs...');

const state = createInitialChoreState();
assert.strictEqual(Object.keys(state.chores).length, 5);

// Test chore display metadata
const tapeChore = state.chores.clean_tape_heads;
assert.strictEqual(tapeChore.title, 'Clean Tape Heads');
assert.strictEqual(tapeChore.category, 'maintenance');
assert.strictEqual(tapeChore.energyCost, 1);

console.log('studio-duties-clipboard: all checks passed');
```

- [ ] **Step 2: Run test to verify it passes the specification baseline**

Run: `./node_modules/.bin/esbuild tests/studio-duties-clipboard.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-studio-duties-clipboard.cjs --alias:@=./src && node /tmp/rst-studio-duties-clipboard.cjs`

- [ ] **Step 3: Implement `StudioDutiesClipboard.tsx` and integrate into dock**

- Build `StudioDutiesClipboard.tsx` with rich wooden clipboard skin, brass clip, checkboxes, energy cost badges, active buff tags, and streak meter.
- Integrate toggle button on the console transport dock (`Duties Clipboard [5/5]`) or drawer tab.
- Wire gamepad D-pad focus index and South button `(A)` to trigger `onPerformChore(choreId)`.
- Play `ui sfx/rotary-switch.wav` on chore completion.

- [ ] **Step 4: Run component check & typecheck**

Run: `./node_modules/.bin/esbuild tests/studio-duties-clipboard.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-studio-duties-clipboard.cjs --alias:@=./src && node /tmp/rst-studio-duties-clipboard.cjs`  
Expected: PASS

- [ ] **Step 5: Commit Task 3**

```bash
git add src/components/chores/ tests/studio-duties-clipboard.check.ts src/components/ActiveProject.tsx
git commit -m "feat(ui): add StudioDutiesClipboard component with gamepad navigation and streak tracker"
```

---

### Task 4: Isometric Studio Floor Chore Hotspot Indicators

**Files:**
- Modify: `src/components/StudioRoom.tsx`
- Modify: `src/components/WebGLCanvas.tsx`
- Test: `tests/chore-hotspots.check.ts`

**Interfaces:**
- Consumes: `gameState.choreState.chores`
- Produces:
  - Contextual floating indicators (Wrench, Coffee Cup, Outboard Faders) rendered over coordinate hotspots on the isometric floor
  - Direct click on room hotspot with pending chore triggers execution and plays tactile audio

- [ ] **Step 1: Write the failing test `tests/chore-hotspots.check.ts`**

```typescript
import assert from 'node:assert';
import { createInitialChoreState } from '../src/simulation/choreEngine';

console.log('Testing Chore Hotspot Mapping...');

const state = createInitialChoreState();
const chores = Object.values(state.chores);

const consoleChores = chores.filter(c => c.hotspotId === 'console');
const shelfChores = chores.filter(c => c.hotspotId === 'shelf');
const liveroomChores = chores.filter(c => c.hotspotId === 'liveroom');

assert(consoleChores.length >= 2, 'Console should have tape and calibration chores');
assert(shelfChores.length >= 1, 'Shelf/lounge should have coffee/hospitality chore');
assert(liveroomChores.length >= 1, 'Liveroom should have acoustic chore');

console.log('chore-hotspots: all checks passed');
```

- [ ] **Step 2: Run test to verify hotspot mapping**

Run: `./node_modules/.bin/esbuild tests/chore-hotspots.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-chore-hotspots.cjs --alias:@=./src && node /tmp/rst-chore-hotspots.cjs`  
Expected: PASS

- [ ] **Step 3: Implement visual markers in `StudioRoom.tsx` and `WebGLCanvas.tsx`**

- In `StudioRoom.tsx`, render an anchored floating badge above hotspots with uncompleted chores (e.g. 🔧 for console, ☕ for shelf).
- Clicking the badge calls `executeStudioChore` directly, fires confetti burst, and updates game state with notification toast.

- [ ] **Step 4: Verify hotspot check passes**

Run: `./node_modules/.bin/esbuild tests/chore-hotspots.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-chore-hotspots.cjs --alias:@=./src && node /tmp/rst-chore-hotspots.cjs`  
Expected: PASS

- [ ] **Step 5: Commit Task 4**

```bash
git add src/components/StudioRoom.tsx src/components/WebGLCanvas.tsx tests/chore-hotspots.check.ts
git commit -m "feat(floor): add interactive chore maintenance badges to isometric studio hotspots"
```

---

### Task 5: Vintage Flight Case Unboxing Modal & Reward Animations

**Files:**
- Create: `src/features/boxDrops/CrateUnboxingModal.tsx`
- Modify: `src/features/boxDrops/BoxDropController.tsx`
- Modify: `src/features/boxDrops/boxDropsStore.ts`
- Modify: `src/features/boxDrops/lootGenerator.ts`
- Test: `tests/crate-unboxing.check.ts`

**Interfaces:**
- Consumes: `EquipmentItem[]` from `generateBoxLoot` or `pendingCrates`
- Produces: 4-stage unboxing modal:
  - Phase 1: Heavy 3D road case with dual spring latches (click / Gamepad A to unlatch)
  - Phase 2: Lid pops open, radiating 360° light rays in rarity color, particle dust motes
  - Phase 3: Gear card flips up in 3D with condition meter, era stamp, and market valuation
  - Phase 4: Equip / Stash / Sell action buttons + audio chords

- [ ] **Step 1: Write the failing test `tests/crate-unboxing.check.ts`**

```typescript
import assert from 'node:assert';
import { generateBoxLoot, pickLootForEra } from '../src/features/boxDrops/lootGenerator';

console.log('Testing Crate Unboxing & Loot Generator...');

const loot1970 = generateBoxLoot('1970s', 1, 42);
assert.strictEqual(loot1970.length, 1);
assert(loot1970[0].name.length > 0);
assert(loot1970[0].condition >= 50 && loot1970[0].condition <= 100);
assert(['common', 'uncommon', 'rare', 'vintage', 'legendary'].includes(loot1970[0].rarity));

console.log('crate-unboxing: all checks passed');
```

- [ ] **Step 2: Run test to verify it passes baseline**

Run: `./node_modules/.bin/esbuild tests/crate-unboxing.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-crate-unboxing.cjs --alias:@=./src && node /tmp/rst-crate-unboxing.cjs`

- [ ] **Step 3: Implement `CrateUnboxingModal.tsx` and wire into `BoxDropController.tsx`**

- Create `CrateUnboxingModal.tsx` with Framer Motion:
  - Textured flight case graphic with metallic corner brackets and spring butterfly latches.
  - Interactive latches that click and swing open.
  - Rotating SVG light rays flare behind the case with CSS hue-rotation based on item rarity (Slate, Green, Blue, Purple, Gold).
  - Canvas confetti pop on lid open (`confetti(...)`).
  - 3D perspective card flip showing item stats, era, condition gauge, and value.
  - Action buttons: `[Equip to Rack]`, `[Send to Inventory]`, `[Sell for Cash]`.
  - Gamepad button `(A)` triggers unlatch / advance; button `(B)` or `(X)` selects actions.
- Update `BoxDropController.tsx` to mount `CrateUnboxingModal`.

- [ ] **Step 4: Verify test suite and clean compile**

Run: `./node_modules/.bin/esbuild tests/crate-unboxing.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-crate-unboxing.cjs --alias:@=./src && node /tmp/rst-crate-unboxing.cjs`  
Expected: PASS

- [ ] **Step 5: Commit Task 5**

```bash
git add src/features/boxDrops/ tests/crate-unboxing.check.ts
git commit -m "feat(loot): implement cinematic vintage flight case unboxing modal with rarity flares and card flip"
```

---

### Task 6: Reward Flights Polish & Regression Verification

**Files:**
- Modify: `src/components/RewardFlights.tsx`
- Modify: `scripts/run-checks.sh`
- Test: `tests/reward-flights.check.ts`

**Interfaces:**
- Consumes: `GameState` gains
- Produces:
  - Trailing particle sparkles and curved bezier trajectories for money and XP flights
  - Floating combo milestone banners ("PERFECT GOLD TAKE!", "3-DAY CHORE STREAK!")
  - Seamless execution in `scripts/run-checks.sh`

- [ ] **Step 1: Enhance `RewardFlights.tsx` and verify with `reward-flights.check.ts`**

Add particle tail accents to animated flight div and support streak announcement callouts.

- [ ] **Step 2: Add all new test suites to `scripts/run-checks.sh`**

Add `chore-engine`, `chore-progression-coupling`, `studio-duties-clipboard`, `chore-hotspots`, and `crate-unboxing` to `scripts/run-checks.sh`.

- [ ] **Step 3: Run the full test suite and build verification**

Run: `bash scripts/run-checks.sh && pnpm run build`  
Expected: 100% checks passing, clean TypeScript compile and bundle.

- [ ] **Step 4: Commit Task 6**

```bash
git add src/components/RewardFlights.tsx scripts/run-checks.sh
git commit -m "feat(juice): polish reward flights with particle trails and register all chore/loot check suites"
```
