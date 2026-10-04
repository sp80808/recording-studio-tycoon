# Era-Authentic Shaders and Visual Effects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement period-accurate, zero-dependency PixiJS v8 shaders for Recording Studio Tycoon—removing anachronistic full-screen scanlines from the 1960s/70s room and introducing diegetic CRT screens for 80s displays, dynamic window sunlight Godrays, and thermionic vacuum tube glow.

**Architecture:** Custom GLSL ES 3.0 fragment shaders packaged into modular PixiJS v8 `Filter` instances under `src/lib/render/shaders/`. CRT effects are confined strictly to in-world monitors (`tvWrap`), while volumetric sunlight and tube cathode glow provide authentic physical atmosphere across all eras without violating the single GPU context exclusivity rule (`#pixi-studio-canvas`).

**Tech Stack:** PixiJS v8 (`pixi.js@^8.10.1`), TypeScript 5.5, WebGL GLSL ES 3.0, React 19, Vite 5.

**Spec:** `docs/superpowers/specs/2026-10-04-era-authentic-shaders-and-visual-effects-design.md`

## Global Constraints

- **Single GPU Context Invariant:** All WebGL operations run exclusively within the primary canvas (`#pixi-studio-canvas`, `data-engine="pixi"`). No secondary WebGL contexts.
- **Zero New Dependencies:** Use built-in PixiJS v8 `Filter.from({ gl: { ... } })` without adding external filter libraries.
- **Settings Reactivity:** Respect `settings.crtScanlines` and `settings.reducedMotion` from `SettingsContext`.
- **Headless Safety:** All shader functions must gracefully handle headless/non-WebGL environments (e.g. Node test runners) without throwing errors.

---

### Task 1: Remove Anachronistic Full-Screen CRT Scanlines

**Files:**
- Modify: `src/components/WebGLCanvas.tsx:1830-1845`
- Test: `tests/render/crtScanlineCleanup.test.ts`

**Interfaces:**
- Consumes: `overlayRoot`, `postFxTuning`, `settings.crtScanlines`.
- Produces: Clean `overlayRoot` containing only the screen-space vignette and day/night tint layers without the full-screen 1px CPU rectangle loop.

- [ ] **Step 1: Write unit test verifying no full-screen scanline geometry is created**

```typescript
// tests/render/crtScanlineCleanup.test.ts
import { describe, it, expect } from 'vitest';
import { getEraPostFxTuning } from '@/components/WebGLCanvas';

describe('CRT Scanline Configuration', () => {
  it('does not define full-screen scanline pitch for analog60s', () => {
    const tuning = getEraPostFxTuning('analog60s');
    expect(tuning).toBeDefined();
    // Scanline alpha should be 0 or omitted for analog60s full-screen overlay
    expect(tuning.scanlineAlpha).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test` (or `npx vitest run tests/render/crtScanlineCleanup.test.ts`)
Expected: FAIL with `tuning.scanlineAlpha` expected 0 but was 0.02.

- [ ] **Step 3: Modify WebGLCanvas.tsx to remove full-screen scanline loop and set analog scanline alpha to 0**

In `src/components/WebGLCanvas.tsx`:
1. Update `getEraPostFxTuning` so `scanlineAlpha` is 0 for `analog60s` (and full-screen overlay is omitted).
2. Remove the CPU `for (let y = 0; y < height; y += pitch)` loop in `buildScene` that appends `crtG` to `overlayRoot`.
3. Retain `vignetteLayer` and `nightTintLayer`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/render/crtScanlineCleanup.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/render/crtScanlineCleanup.test.ts src/components/WebGLCanvas.tsx
git commit -m "fix(render): remove anachronistic full-screen CRT scanlines from living studio"
```

---

### Task 2: Implement Diegetic Screen CRT Shader (`diegeticCrtFilter.ts`)

**Files:**
- Create: `src/lib/render/shaders/diegeticCrtFilter.ts`
- Modify: `src/components/WebGLCanvas.tsx`
- Test: `tests/shaders/diegeticCrtFilter.test.ts`

**Interfaces:**
- Consumes: `Filter.from` from `pixi.js`, `EraPostFxTuning`.
- Produces: `createDiegeticCrtFilter(options)` returning a PixiJS v8 `Filter` that applies curvature, scanlines, and RGB shift localized to in-game screen containers.

- [ ] **Step 1: Write unit test for diegetic CRT filter creation and uniforms**

```typescript
// tests/shaders/diegeticCrtFilter.test.ts
import { describe, it, expect } from 'vitest';
import { createDiegeticCrtFilter } from '@/lib/render/shaders/diegeticCrtFilter';

describe('Diegetic CRT Filter', () => {
  it('creates a Pixi filter with default uniforms', () => {
    const filter = createDiegeticCrtFilter({ pitch: 3.0, scanlineAlpha: 0.25, curvature: 0.05 });
    expect(filter).toBeDefined();
    expect(filter.resources.crtUniforms).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/shaders/diegeticCrtFilter.test.ts`
Expected: FAIL with "Cannot find module '@/lib/render/shaders/diegeticCrtFilter'".

- [ ] **Step 3: Implement `src/lib/render/shaders/diegeticCrtFilter.ts`**

Write GLSL ES 3.0 fragment shader with barrel distortion and scanlines, wrapped in PixiJS v8 `Filter.from()`. Include headless fallback when WebGL is not available.

- [ ] **Step 4: Wire `createDiegeticCrtFilter` onto `tvWrap` (Charts TV) in `WebGLCanvas.tsx`**

Attach filter to `tvWrap.filters` only when `eraId === 'digital80s' || eraId === 'internet2000s'` and `settings.crtScanlines` is true.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/shaders/diegeticCrtFilter.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/render/shaders/diegeticCrtFilter.ts tests/shaders/diegeticCrtFilter.test.ts src/components/WebGLCanvas.tsx
git commit -m "feat(render): add diegetic CRT filter for in-world 80s screen displays"
```

---

### Task 3: Implement Volumetric Window Godrays Shader (`godrayFilter.ts`)

**Files:**
- Create: `src/lib/render/shaders/godrayFilter.ts`
- Modify: `src/components/studio/studioLightShaft.ts`
- Test: `tests/shaders/godrayFilter.test.ts`

**Interfaces:**
- Consumes: `getCelestialPosition` from `studioWindowView.ts`, `minutesOfDay`.
- Produces: `createStudioGodrayFilter()` returning a filter that generates dynamic volumetric light rays emanating from the celestial position through the studio window.

- [ ] **Step 1: Write unit test for Godray filter creation and celestial position tracking**

```typescript
// tests/shaders/godrayFilter.test.ts
import { describe, it, expect } from 'vitest';
import { createStudioGodrayFilter, calculateGodrayColor } from '@/lib/render/shaders/godrayFilter';

describe('Studio Godray Filter', () => {
  it('calculates warm morning color and noon brightness accurately', () => {
    const morning = calculateGodrayColor(480); // 8:00 AM
    const noon = calculateGodrayColor(720);    // 12:00 PM
    expect(morning.r).toBeGreaterThan(0.9);
    expect(noon.r).toBeGreaterThan(0.95);
  });

  it('creates godray filter instance', () => {
    const filter = createStudioGodrayFilter();
    expect(filter).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/shaders/godrayFilter.test.ts`
Expected: FAIL with "Cannot find module '@/lib/render/shaders/godrayFilter'".

- [ ] **Step 3: Implement `src/lib/render/shaders/godrayFilter.ts`**

Implement radial ray-march GLSL fragment shader with light decay and color calculation functions, respecting `reducedMotion`.

- [ ] **Step 4: Integrate Godray filter into `studioLightShaft.ts`**

Attach Godray filter to `patch` container inside `buildLightShaft()`, updating celestial origin and ray strength in `update()`.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/shaders/godrayFilter.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/render/shaders/godrayFilter.ts tests/shaders/godrayFilter.test.ts src/components/studio/studioLightShaft.ts
git commit -m "feat(render): add volumetric window Godrays filter driven by studio clock"
```

---

### Task 4: Implement Thermionic Vacuum Tube Glow Shader (`tubeGlowFilter.ts`)

**Files:**
- Create: `src/lib/render/shaders/tubeGlowFilter.ts`
- Modify: `src/components/WebGLCanvas.tsx`
- Test: `tests/shaders/tubeGlowFilter.test.ts`

**Interfaces:**
- Consumes: `activity`, `hasActiveProject`, `roomTier`, `eraId`.
- Produces: `createTubeGlowFilter()` providing warm analog 2400K cathode emission with dynamic audio saturation breathing.

- [ ] **Step 1: Write unit test for Tube Glow filter**

```typescript
// tests/shaders/tubeGlowFilter.test.ts
import { describe, it, expect } from 'vitest';
import { createTubeGlowFilter, calculateTubeGlowIntensity } from '@/lib/render/shaders/tubeGlowFilter';

describe('Tube Glow Filter', () => {
  it('increases intensity when active project and activity rise', () => {
    const idle = calculateTubeGlowIntensity(0.1, false);
    const active = calculateTubeGlowIntensity(0.9, true);
    expect(active).toBeGreaterThan(idle);
  });

  it('creates tube glow filter instance', () => {
    const filter = createTubeGlowFilter();
    expect(filter).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/shaders/tubeGlowFilter.test.ts`
Expected: FAIL with "Cannot find module '@/lib/render/shaders/tubeGlowFilter'".

- [ ] **Step 3: Implement `src/lib/render/shaders/tubeGlowFilter.ts`**

Implement multi-layer thermionic bloom GLSL shader with 2400K amber core and mains hum flicker.

- [ ] **Step 4: Integrate Tube Glow filter into `WebGLCanvas.tsx`**

Attach filter to `bloomLayer` and update intensity in animation ticker.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/shaders/tubeGlowFilter.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/render/shaders/tubeGlowFilter.ts tests/shaders/tubeGlowFilter.test.ts src/components/WebGLCanvas.tsx
git commit -m "feat(render): add thermionic tube glow filter with dynamic audio breathing"
```

---

### Task 5: Barrel Export, Settings Verification & Full Quality Gates

**Files:**
- Create: `src/lib/render/shaders/index.ts`
- Modify: `src/lib/render/shaders/*` (clean exports)

- [ ] **Step 1: Create barrel export `src/lib/render/shaders/index.ts`**

Export `createDiegeticCrtFilter`, `createStudioGodrayFilter`, and `createTubeGlowFilter`.

- [ ] **Step 2: Run full quality gates**

Run:
1. `pnpm run typecheck`
2. `pnpm run lint`
3. `pnpm test`
4. `pnpm run content:validate`
Expected: All pass with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/render/shaders/index.ts
git commit -m "chore(render): finalize shader module barrel exports and quality verification"
```
