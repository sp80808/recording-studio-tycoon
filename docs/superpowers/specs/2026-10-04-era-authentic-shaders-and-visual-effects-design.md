# Era-Authentic Shaders and Visual Effects Design Specification

**Date:** 2026-10-04  
**Status:** Approved  
**Author:** Antigravity & User  
**Target Surface:** Living Studio Canvas (`WebGLCanvas.tsx`), Charts TV, Outboard Gear, 80s Minigame Screens  
**Tech Stack:** PixiJS v8 (`pixi.js@^8.10.1`), TypeScript, WebGL GLSL ES 3.0, React 19  

---

## 1. Overview & Core Philosophy

The visual presentation of *Recording Studio Tycoon* spans multiple historical eras (from 1960s valve analog to modern 2020s streaming facilities). Visual effects and shaders must strictly observe **historical and physical authenticity**:

1. **No Anachronistic Shaders:** The 1960s and 1970s analog eras must not display full-screen CRT scanlines or digital artifacts. Full-screen scanline overlays are completely removed.
2. **Diegetic Display Targeting:** CRT, scanline, and phosphor shaders are restricted exclusively to in-world screens:
   - The left-wall **Charts TV** in `WebGLCanvas.tsx` (active only during the `digital80s` and later eras).
   - Diegetic computer / sampler / synthesizer displays in 1980s minigames (e.g. `SamplingSequencingGame`, `MidiProgrammingGame`, `SoundWaveGame`).
3. **Period-Accurate Atmospheric Effects:**
   - **Volumetric Sunlight (Godrays):** Sunlight streaming through the right-wall studio window onto the floor, dynamically responding to the studio wall clock (dawn, noon, sunset, moonlight).
   - **Thermionic Tube Glow:** Warm tungsten/orange cathode emission (2200K–2700K) on analog console meter bridges and rackmount valve preamplifiers that pulses with audio saturation and session activity.
   - **Chore Micro-Atmosphere:** Organic rising steam above the espresso cup on the candle table after completing the `brew_espresso` chore.
4. **Single GPU Owner Invariant:** All WebGL operations run exclusively within the primary canvas (`#pixi-studio-canvas`, `data-engine="pixi"`). No secondary WebGL contexts are permitted.

---

## 2. Architecture & File Structure

All shaders are implemented as zero-dependency PixiJS v8 `Filter` instances using `Filter.from({ gl: { ... } })` in a dedicated directory:

```text
src/lib/render/shaders/
├── godrayFilter.ts          # Volumetric sunbeam & window light shaft filter
├── tubeGlowFilter.ts        # Thermionic valve cathode emissive bloom
├── diegeticCrtFilter.ts     # Screen-space CRT & phosphor shader for 80s TV & displays
├── steamNoiseFilter.ts      # 2D Simplex noise steam for espresso chore
└── index.ts                 # Clean barrel export
```

---

## 3. Shader Modules Specification

### 3.1 Volumetric Window Godrays (`godrayFilter.ts`)

*   **Role:** Replaces static isometric geometry in `studioLightShaft.ts` with atmospheric optical sunbeams that illuminate the room floor and floating dust motes.
*   **GLSL Logic:**
    - Computes sun/moon screen-space origin from `getCelestialPosition(minutesOfDay)` in `studioWindowView.ts`.
    - Samples across ray vectors toward the center with exponential falloff and exposure weighting:
      $$\text{RayColor} = \sum_{i=0}^{15} \text{texture}(uv - i \cdot \Delta uv) \cdot \text{decay}^i \cdot \text{weight}$$
    - Blends dynamically with time of day:
      - **Morning (06:00–10:00):** Warm golden slant (`0xffc27a`), long shadow stretch.
      - **Noon (11:00–14:00):** Bright crisp white-yellow (`0xfff0c0`), concentrated core.
      - **Evening / Golden Hour (17:00–20:00):** Deep amber-ruby (`0xff7a45`), low angle.
      - **Night (21:00–05:00):** Faint cool moonlit slate (`0x4a6d8c`), subtle starlight shimmer.
*   **Uniforms:**
    - `uLightPosition`: `vec2` (screen coordinates of celestial body).
    - `uRayStrength`: `float` (derived from `getShaftStrength(minutesOfDay)`).
    - `uRayColor`: `vec3` (era and time-of-day chromatic tint).
    - `uTime`: `float` (seconds, drives micro-turbulent atmospheric drift).

### 3.2 Diegetic Screen CRT Shader (`diegeticCrtFilter.ts`)

*   **Role:** Applied strictly to the Charts TV surface (`tvWrap` in `WebGLCanvas.tsx`) and computer screens in 1980s minigames.
*   **Activation Condition:** Active only when `eraId === 'digital80s' || eraId === 'internet2000s'` AND `settings.crtScanlines === true`.
*   **GLSL Logic:**
    1. **Localized Barrel Curvature:** Curved glass reflection inside monitor frame bounds.
    2. **Scanline Rasterization:** High-frequency horizontal pitch raster without CPU geometry generation.
    3. **Sub-pixel Chromatic Aberration:** Red/Cyan fringing at screen margins.
    4. **Phosphor Persistence:** Subtle exponential phosphor trail when chart items or waveforms update.
*   **Uniforms:**
    - `uPitch`: `float` (default $3.0\text{px}$).
    - `uScanlineAlpha`: `float` (default $0.25$).
    - `uCurvature`: `float` (default $0.06$).
    - `uPhosphorColor`: `vec3` (monochrome green/amber or full RGB mask).

### 3.3 Thermionic Tube Glow Filter (`tubeGlowFilter.ts`)

*   **Role:** Warm analog filament glow on console channel strips, meter bridges, and outboard gear.
*   **Activation Condition:** Prominent in `analog60s`; transitions to cooler LED indicators in `internet2000s` and `streaming2020s`.
*   **GLSL Logic:**
    - Multi-layer emissive bloom centered on valve sockets and analog VU meter bulbs.
    - Dynamic drive modulation: filament intensity breathes (+15%) during session takes when `hasActiveProject` is true and `activity` rises.
*   **Uniforms:**
    - `uGlowColor`: `vec3` (warm $2400\text{K}$ amber for 60s, cooler tones for modern tiers).
    - `uIntensity`: `float` (scaled by activity and saturation).
    - `uFlicker`: `float` (micro-hum from mains frequency $50\text{ Hz}$ / $60\text{ Hz}$).

### 3.4 Chore Espresso Steam Shader (`steamNoiseFilter.ts`)

*   **Role:** Delicate wisps of steam curling from the coffee mug on the candle table.
*   **Activation Condition:** Active only when `coffeeSteaming === true` (derived from `choreState.chores.brew_espresso.completed`).
*   **GLSL Logic:** 2D Simplex noise turbulence translated vertically with exponential vertical fade.

---

## 4. Full-Screen Cleanup in `WebGLCanvas.tsx`

*   **Removal:** The full-screen `crtLayer` loop (`crtG.rect(...)` across all screen rows) is removed completely.
*   **Preservation:** Screen-space `vignetteLayer` and `nightTintLayer` are retained on `overlayRoot` for global day/night ambient lighting, but free of scanline contamination.

---

## 5. Settings, Motion & Performance Integration

*   **`settings.reducedMotion`:**
    - Freezes `uTime` in all shaders (no filament hum, no turbulent steam drift, static light shaft).
    - Sets Godray strength to constant soft ambient fill without pulsation.
*   **`settings.crtScanlines`:**
    - Enables/disables `diegeticCrtFilter` on the Charts TV and minigame displays.
*   **Performance Budgets:**
    - Zero per-frame memory allocation or geometry reallocation.
    - GPU shader execution time budget $< 0.8\text{ ms}$ on standard mobile/desktop GPUs.
    - Headless fallback: In environments without WebGL (e.g. Node test runner), filters no-op cleanly without throwing.

---

## 6. Verification Plan

1. **Automated Verification:**
   - Run typecheck: `pnpm run typecheck`
   - Run linter: `pnpm run lint`
   - Run project test suite: `pnpm test`
2. **Visual & Diegetic Verification:**
   - In `analog60s`: Control room renders clean wooden surfaces with natural window sunbeam and warm tube filaments; zero scanlines present.
   - In `digital80s`: Left-wall Charts TV shows authentic CRT raster scanlines and phosphor glow.
   - Day/Night cycle: Window beam shifts from dawn slant to noon glare to golden sunset to cool night beam.
   - Chore interaction: Brewing espresso visibly produces rising steam on the candle table.
