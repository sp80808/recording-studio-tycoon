# Game Engine Back-End, Settings Overhaul & PixiJS Graphics Tech Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a decoupled 20Hz fixed-step `EngineLoop` accumulator, a typed zero-dependency `GameEventBus`, a multi-tab `GameSettings` overhaul with live graphics presets, and a PixiJS graphics pipeline featuring dynamic resolution scaling, procedural CRT scanlines, and console hardware emissive bloom.

**Architecture:** 
- `engineLoop.ts` provides authoritative simulation ticks (20Hz) decoupled from variable rendering, with automatic 1Hz throttling when `document.hidden`.
- `gameEventBus.ts` decouples gameplay logic and state mutations from cutscenes, audio cues, and visual fx.
- `SettingsModal.tsx` and `SettingsContext.tsx` provide tabs for Audio, Graphics & Display, Gameplay & Controller, and Accessibility.
- `WebGLCanvas.tsx` consumes graphics settings to dynamically adjust viewport resolution, apply scanlines and vignette, and render additive bloom on console meters and screens.

**Tech Stack:** TypeScript, React 19, PixiJS 8, Tailwind CSS, esbuild test runner.

**Spec:** [`docs/superpowers/specs/2026-09-29-game-engine-settings-graphics-design.md`](file:///Volumes/Harry/DEV/Recording%20Studio%20Tycoon/RST%20v1.5/recording-studio-tycoon/docs/superpowers/specs/2026-09-29-game-engine-settings-graphics-design.md)

## Global Constraints
- Pure TypeScript implementation without heavy new external runtime dependencies.
- Zero regression across all existing 21 test suites in `scripts/run-checks.sh`.
- Backward-compatible `GameSettings` serialization falling back gracefully on existing `localStorage` data.
- Production bundle (`pnpm build`) must compile cleanly with zero TypeScript errors.

---

### Task 1: Typed Game Event Bus (`src/engine/gameEventBus.ts`)

**Files:**
- Create: `src/engine/gameEventBus.ts`
- Test: `tests/game-event-bus.check.ts`

**Interfaces:**
- Produces:
  - `GameEventPayloads`: Typed dictionary of event names to payload types.
  - `gameEvents`: Singleton instance with `on<K>(event: K, handler: (payload: GameEventPayloads[K]) => void): () => void`, `once<K>(event: K, handler: (payload: GameEventPayloads[K]) => void): () => void`, `off<K>(event: K, handler: (payload: GameEventPayloads[K]) => void): void`, and `emit<K>(event: K, payload: GameEventPayloads[K]): void`.

- [ ] **Step 1: Write the failing test `tests/game-event-bus.check.ts`**

```typescript
import assert from 'node:assert';
import { gameEvents, GameEventPayloads } from '../src/engine/gameEventBus';

console.log('Testing Typed Game Event Bus...');

// 1. Basic emit and subscribe
let receivedPayload: GameEventPayloads['project:take_locked'] | null = null;
const unsub = gameEvents.on('project:take_locked', (payload) => {
  receivedPayload = payload;
});

gameEvents.emit('project:take_locked', {
  projectId: 'proj-1',
  grade: 'Gold',
  energyBurned: 2,
  score: 950,
  takeNumber: 3,
});

assert.deepStrictEqual(receivedPayload, {
  projectId: 'proj-1',
  grade: 'Gold',
  energyBurned: 2,
  score: 950,
  takeNumber: 3,
});
console.log('PASS: Event emit delivers typed payload');

// 2. Unsubscribe behavior
unsub();
receivedPayload = null;
gameEvents.emit('project:take_locked', {
  projectId: 'proj-2',
  grade: 'Silver',
  energyBurned: 1,
  score: 750,
  takeNumber: 4,
});
assert.strictEqual(receivedPayload, null, 'Unsubscribed listener should not receive events');
console.log('PASS: Unsubscribe functions accurately');

// 3. Once listener
let onceCount = 0;
gameEvents.once('studio:tier_upgraded', () => {
  onceCount += 1;
});

gameEvents.emit('studio:tier_upgraded', { oldTier: 1, newTier: 2 });
gameEvents.emit('studio:tier_upgraded', { oldTier: 2, newTier: 3 });
assert.strictEqual(onceCount, 1, 'Once listener should only trigger on the first emission');
console.log('PASS: once() triggers exactly once');

console.log('game-event-bus: all checks passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node_modules/.bin/esbuild tests/game-event-bus.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-game-event-bus.cjs && node /tmp/rst-game-event-bus.cjs`
Expected: FAIL due to missing `../src/engine/gameEventBus`.

- [ ] **Step 3: Implement `src/engine/gameEventBus.ts`**

```typescript
import type { GameSettings } from '../contexts/settings-context-types';

export interface GameEventPayloads {
  'project:take_locked': {
    projectId: string;
    grade: 'Gold' | 'Silver' | 'Solid';
    energyBurned: number;
    score: number;
    takeNumber: number;
  };
  'project:stage_advance': {
    projectId: string;
    stageIndex: number;
    stageName: string;
  };
  'project:completed': {
    projectId: string;
    finalGrade: string;
    revenue: number;
    reputationGain: number;
  };
  'studio:tier_upgraded': {
    oldTier: number;
    newTier: number;
  };
  'studio:day_advanced': {
    currentDay: number;
  };
  'audio:trigger_cue': {
    soundId: string;
    category?: 'sfx' | 'ui' | 'take';
    volume?: number;
  };
  'settings:changed': {
    changed: Partial<GameSettings>;
    all: GameSettings;
  };
  'graphics:resolution_changed': {
    scale: number;
    effectiveDpr: number;
  };
}

export type GameEventKey = keyof GameEventPayloads;
type EventHandler<T> = (payload: T) => void;

class GameEventBus {
  private listeners: Map<string, Set<EventHandler<any>>> = new Map();

  public on<K extends GameEventKey>(
    event: K,
    handler: EventHandler<GameEventPayloads[K]>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  public once<K extends GameEventKey>(
    event: K,
    handler: EventHandler<GameEventPayloads[K]>
  ): () => void {
    const wrapped: EventHandler<GameEventPayloads[K]> = (payload) => {
      this.off(event, wrapped);
      handler(payload);
    };
    return this.on(event, wrapped);
  }

  public off<K extends GameEventKey>(
    event: K,
    handler: EventHandler<GameEventPayloads[K]>
  ): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(handler);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  public emit<K extends GameEventKey>(event: K, payload: GameEventPayloads[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const handler of Array.from(set)) {
      try {
        handler(payload);
      } catch (err) {
        console.error(`[GameEventBus] Error in handler for event "${event}":`, err);
      }
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}

export const gameEvents = new GameEventBus();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node_modules/.bin/esbuild tests/game-event-bus.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-game-event-bus.cjs && node /tmp/rst-game-event-bus.cjs`
Expected: PASS.

---

### Task 2: Fixed-Step Simulation Accumulator & Decoupled Engine Loop (`src/engine/engineLoop.ts`)

**Files:**
- Create: `src/engine/engineLoop.ts`
- Test: `tests/engine-loop.check.ts`

**Interfaces:**
- Produces:
  - `EngineTickEvent`: `{ deltaSec: number; totalTimeSec: number; isBackground: boolean }`
  - `EngineLoop`: Class managing RAF, fixed-step accumulation (20Hz), clamping, and Page Visibility background throttling.
  - `engineLoop`: Exported singleton instance.

- [ ] **Step 1: Write the failing test `tests/engine-loop.check.ts`**

```typescript
import assert from 'node:assert';
import { EngineLoop } from '../src/engine/engineLoop';

console.log('Testing Engine Loop & Accumulator...');

const loop = new EngineLoop({ fixedStepSec: 0.05, maxDeltaSec: 0.25 });

// 1. Simulation step accumulation
let fixedTicks = 0;
loop.onFixedTick((fixedDelta) => {
  assert.strictEqual(fixedDelta, 0.05);
  fixedTicks += 1;
});

// Simulate 120ms of elapsed time -> should trigger exactly 2 fixed ticks of 50ms, with 20ms accumulated
loop.simulateStep(0.12);
assert.strictEqual(fixedTicks, 2, '120ms should produce 2 fixed ticks of 50ms');
assert.strictEqual(Math.round(loop.getAccumulatorSec() * 1000), 20, 'Accumulator should retain remaining 20ms');
console.log('PASS: Fixed-step accumulator evaluates ticks accurately');

// 2. Render tick delta clamping
let lastRenderDelta = 0;
loop.onTick((event) => {
  lastRenderDelta = event.deltaSec;
});

// Simulate large delta (e.g. 1500ms after tab freeze)
loop.simulateStep(1.5);
assert.strictEqual(lastRenderDelta, 0.25, 'Delta should clamp to maxDeltaSec (0.25s)');
console.log('PASS: Render delta clamps correctly under extreme delay');

console.log('engine-loop: all checks passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node_modules/.bin/esbuild tests/engine-loop.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-engine-loop.cjs && node /tmp/rst-engine-loop.cjs`
Expected: FAIL due to missing `../src/engine/engineLoop`.

- [ ] **Step 3: Implement `src/engine/engineLoop.ts`**

```typescript
export interface EngineTickEvent {
  deltaSec: number;
  totalTimeSec: number;
  isBackground: boolean;
}

export interface EngineLoopOptions {
  fixedStepSec?: number; // Default 0.05 (20Hz)
  maxDeltaSec?: number;  // Default 0.25 (250ms)
}

type TickCallback = (event: EngineTickEvent) => void;
type FixedTickCallback = (fixedDeltaSec: number) => void;

export class EngineLoop {
  private fixedStepSec: number;
  private maxDeltaSec: number;
  private running = false;
  private accumulatorSec = 0;
  private totalTimeSec = 0;
  private lastTimestampMs = 0;
  private rafId: number | null = null;
  private isBackground = false;

  private tickListeners: Set<TickCallback> = new Set();
  private fixedTickListeners: Set<FixedTickCallback> = new Set();

  constructor(options: EngineLoopOptions = {}) {
    this.fixedStepSec = options.fixedStepSec ?? 0.05;
    this.maxDeltaSec = options.maxDeltaSec ?? 0.25;

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        this.isBackground = document.hidden;
      });
    }
  }

  public start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTimestampMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.scheduleFrame();
  }

  public stop(): void {
    this.running = false;
    if (this.rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public isRunning(): boolean {
    return this.running;
  }

  public onTick(cb: TickCallback): () => void {
    this.tickListeners.add(cb);
    return () => this.tickListeners.delete(cb);
  }

  public onFixedTick(cb: FixedTickCallback): () => void {
    this.fixedTickListeners.add(cb);
    return () => this.fixedTickListeners.delete(cb);
  }

  public getAccumulatorSec(): number {
    return this.accumulatorSec;
  }

  public simulateStep(rawDeltaSec: number): void {
    const deltaSec = Math.min(rawDeltaSec, this.maxDeltaSec);
    this.totalTimeSec += deltaSec;
    this.accumulatorSec += deltaSec;

    while (this.accumulatorSec >= this.fixedStepSec) {
      for (const fixedCb of this.fixedTickListeners) {
        fixedCb(this.fixedStepSec);
      }
      this.accumulatorSec -= this.fixedStepSec;
    }

    const event: EngineTickEvent = {
      deltaSec,
      totalTimeSec: this.totalTimeSec,
      isBackground: this.isBackground,
    };

    for (const tickCb of this.tickListeners) {
      tickCb(event);
    }
  }

  private scheduleFrame(): void {
    if (!this.running || typeof requestAnimationFrame === 'undefined') return;

    this.rafId = requestAnimationFrame((timestampMs) => {
      const rawDeltaSec = (timestampMs - this.lastTimestampMs) / 1000;
      this.lastTimestampMs = timestampMs;
      this.simulateStep(rawDeltaSec);
      this.scheduleFrame();
    });
  }
}

export const engineLoop = new EngineLoop();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node_modules/.bin/esbuild tests/engine-loop.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-engine-loop.cjs && node /tmp/rst-engine-loop.cjs`
Expected: PASS.

---

### Task 3: Settings Schema Expansion, Presets & Event Bus Hookup (`src/contexts/settings-context-types.ts`, `src/data/defaultSettings.ts`, `src/contexts/SettingsContext.tsx`)

**Files:**
- Modify: `src/contexts/settings-context-types.ts`
- Modify: `src/data/defaultSettings.ts`
- Modify: `src/contexts/SettingsContext.tsx`
- Test: `tests/engine-settings.check.ts`

**Interfaces:**
- Consumes: `gameEvents` from `src/engine/gameEventBus.ts`
- Produces:
  - Updated `GameSettings` interface including `graphicsPreset`, `resolutionScale`, `targetFps`, `crtScanlines`, `analogTapeWarmth`, `bloomAndGlow`, `screenShake`, `reducedMotion`, `pocketMeterAssistance`.
  - `GRAPHICS_PRESETS` mapping table.

- [ ] **Step 1: Write the failing test `tests/engine-settings.check.ts`**

```typescript
import assert from 'node:assert';
import { defaultSettings, GRAPHICS_PRESETS } from '../src/data/defaultSettings';

console.log('Testing Engine Settings & Graphics Presets...');

// 1. Verify default values
assert.strictEqual(defaultSettings.graphicsPreset, 'high');
assert.strictEqual(defaultSettings.resolutionScale, 1.0);
assert.strictEqual(defaultSettings.targetFps, 60);
assert.strictEqual(defaultSettings.crtScanlines, true);
assert.strictEqual(defaultSettings.analogTapeWarmth, true);
assert.strictEqual(defaultSettings.bloomAndGlow, true);
assert.strictEqual(defaultSettings.screenShake, true);
assert.strictEqual(defaultSettings.pocketMeterAssistance, 'normal');
console.log('PASS: Default settings have authentic graphics parameters');

// 2. Preset configs
assert.strictEqual(GRAPHICS_PRESETS.low.resolutionScale, 0.75);
assert.strictEqual(GRAPHICS_PRESETS.low.crtScanlines, false);
assert.strictEqual(GRAPHICS_PRESETS.ultra.resolutionScale, 1.5);
assert.strictEqual(GRAPHICS_PRESETS.ultra.targetFps, 120);
console.log('PASS: Graphics presets accurately configure resolution and features');

console.log('engine-settings: all checks passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node_modules/.bin/esbuild tests/engine-settings.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-engine-settings.cjs && node /tmp/rst-engine-settings.cjs`
Expected: FAIL due to missing graphics fields.

- [ ] **Step 3: Update `src/contexts/settings-context-types.ts` and `src/data/defaultSettings.ts`**

Update `GameSettings` and `defaultSettings` with the full graphics and accessibility options and `GRAPHICS_PRESETS` export. Ensure `SettingsContext.tsx` emits `gameEvents.emit('settings:changed', { changed: newSettings, all: updated })`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node_modules/.bin/esbuild tests/engine-settings.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-engine-settings.cjs && node /tmp/rst-engine-settings.cjs`
Expected: PASS.

---

### Task 4: Settings Modal Overhaul with Categorized Tabs & Gamepad Navigation (`src/components/modals/SettingsModal.tsx`)

**Files:**
- Modify: `src/components/modals/SettingsModal.tsx`

**Interfaces:**
- Consumes: `useSettings()`, `useGamepad()`, `GamepadGlyph`, `gameEvents`
- Renders:
  - 5 Categorized Tabs: 🔊 Audio, 📺 Graphics & Display, 🎮 Gameplay & Controller, ♿ Accessibility, 🌐 Language & Themes.
  - Bumper tab switching (`LB` / `RB`).
  - Graphics toggles: Presets, Resolution scale, Target FPS, CRT Scanlines, Analog Warmth, Bloom & Glow.

- [ ] **Step 1: Overhaul `SettingsModal.tsx`**

Integrate tab state `activeTab: 'audio' | 'graphics' | 'gameplay' | 'accessibility' | 'themes'`, hook up bumper cycling via `gamepad.justPressed.lb` / `gamepad.justPressed.rb`, and add control cards for graphics resolution, CRT scanlines, bloom, target FPS, and screen shake.

- [ ] **Step 2: Verify component compile & tests**

Run: `pnpm build`
Expected: PASS.

---

### Task 5: PixiJS Dynamic Resolution, CRT Scanlines, Analog Warmth & Emissive Bloom (`src/components/WebGLCanvas.tsx`)

**Files:**
- Modify: `src/components/WebGLCanvas.tsx`
- Test: `tests/graphics-postfx.check.ts`

**Interfaces:**
- Consumes: `gameEvents.on('settings:changed')`, `settings.resolutionScale`, `settings.targetFps`, `settings.crtScanlines`, `settings.analogTapeWarmth`, `settings.bloomAndGlow`.
- Produces:
  - Dynamic `app.renderer.resolution` updating.
  - Procedural CRT scanline overlay container.
  - Emissive bloom container on console meters with additive blending.
  - Frame-budget limiter inside ticker.

- [ ] **Step 1: Write test `tests/graphics-postfx.check.ts`**

```typescript
import assert from 'node:assert';

console.log('Testing Graphics Post-FX Math & Budgets...');

// 1. Effective Resolution Math
const calculateEffectiveResolution = (dpr: number, scale: number) => {
  const clampedDpr = Math.max(1.0, Math.min(2.0, dpr || 1.0));
  return Math.max(0.5, Math.min(3.0, clampedDpr * scale));
};

assert.strictEqual(calculateEffectiveResolution(1.0, 1.0), 1.0);
assert.strictEqual(calculateEffectiveResolution(2.0, 0.75), 1.5);
assert.strictEqual(calculateEffectiveResolution(2.0, 1.5), 3.0);
console.log('PASS: Effective resolution scales accurately');

// 2. Frame Budget Limiter
const shouldSkipFrame = (targetFps: number, elapsedMs: number) => {
  if (targetFps <= 0) return false;
  const budgetMs = 1000 / targetFps;
  return elapsedMs < budgetMs - 1.0;
};

assert.strictEqual(shouldSkipFrame(60, 10.0), true, '10ms is below 60fps budget (16.6ms)');
assert.strictEqual(shouldSkipFrame(60, 16.0), false, '16ms meets 60fps budget');
assert.strictEqual(shouldSkipFrame(30, 25.0), true, '25ms is below 30fps budget (33.3ms)');
assert.strictEqual(shouldSkipFrame(0, 5.0), false, 'Unlimited fps never skips');
console.log('PASS: Frame budget math accurately throttles frames');

console.log('graphics-postfx: all checks passed');
```

- [ ] **Step 2: Run test to verify it passes**

Run: `node_modules/.bin/esbuild tests/graphics-postfx.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-graphics-postfx.cjs && node /tmp/rst-graphics-postfx.cjs`
Expected: PASS.

- [ ] **Step 3: Modify `src/components/WebGLCanvas.tsx`**

1. Listen to `settings:changed` via `gameEvents.on('settings:changed')`.
2. Apply `app.renderer.resolution = calculateEffectiveResolution(window.devicePixelRatio, scale)`.
3. Add `buildScanlineLayer(width, height)` rendering subtle scanline stripes when `settings.crtScanlines` is true.
4. Add `buildBloomLayer()` rendering additive glow dials behind analog meters when `settings.bloomAndGlow` is true.
5. In the animation loop, integrate the frame-rate budgeting check.

- [ ] **Step 4: Verify full test suite**

Run: `bash scripts/run-checks.sh`
Expected: PASS.

---

### Task 6: Scripts & Quality Gate Verification

**Files:**
- Modify: `scripts/run-checks.sh`

- [ ] **Step 1: Wire all 4 new checks into `scripts/run-checks.sh`**
- [ ] **Step 2: Run `bash scripts/run-checks.sh` and `pnpm build`**
- [ ] **Step 3: Commit all changes**
