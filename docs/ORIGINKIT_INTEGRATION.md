# OriginKit Integration Guide & Provenance Manifest
*Recording Studio Tycoon — Motion Platform Architecture*
*Date: September 29, 2026 | Milestone: OriginKit Motion Platform (#72, #74)*

---

## 1. Executive Summary & Purpose

Recording Studio Tycoon (RST) adopts [OriginKit](https://www.originkit.dev/) as a **curated source of high-polish animation patterns and React component recipes**. 

Rather than importing an unvetted third-party runtime or mounting competing animation engines, OriginKit components are:
1. **Curated & Vendored**: Selected for specific hardware/studio interactions.
2. **Adapted to RST Tokens**: Bound to `src/lib/motion/tokens.ts` and `src/lib/motion/capabilities.ts`.
3. **Budget-Constrained**: Evaluated against the desktop-companion performance contract (#46) and motion qualification harness (#74).

---

## 2. Architectural Boundaries & System Ownership

RST maintains a strict three-tier ownership split for visual systems:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        In-World Studio Floor                           │
│  PixiJS 8 (WebGL / WebGPU)                                             │
│  - 2D/3D Isometric floor projection & room progression                 │
│  - Physical hardware consoles, tape decks, audio monitors              │
│  - Animated studio engineer, producer, and visiting clients            │
│  - In-world lamps, VU needle indicators, clickable room hotspots       │
└──────────────────────────────────┬─────────────────────────────────────┘
                                    │ (Zero canvas stacking)
┌──────────────────────────────────┴─────────────────────────────────────┐
│                        React Studio OS V2 Shell                        │
│  Framer Motion 12 + Tailwind CSS                                       │
│  - Navigation rails, slide-over management drawers, dialogs            │
│  - Tab switches, accordion states, tooltip hover physics               │
│  - Progress bars, volume faders, focus sliders                         │
└──────────────────────────────────┬─────────────────────────────────────┘
                                    │ (Curated wrappers)
┌──────────────────────────────────┴─────────────────────────────────────┐
│                    Curated OriginKit-Derived Effects                   │
│  OriginKit Adaptations (DOM / SVG / CSS Transform)                     │
│  - Tactile hardware button physics (MagneticPress)                     │
│  - Rarity / reward gleams & loot reveal shimmers (GlowSweep)           │
│  - Retro LED text scramble / decode transitions (TextScramble)         │
│  - Vintage cathode vignette / ambient lighting (AnalogVignette)        │
└────────────────────────────────────────────────────────────────────────┘
```

### 🚫 Non-Negotiable Hard Constraints & Heavyweight GPU Concurrency
1. **Exclusive GPU Viewport Priority (No Competing WebGL Layer)**:
   **Only one heavyweight continuous GPU visual system may own a normal gameplay viewport at a time.**
   The PixiJS living studio floor (`WebGLCanvas.tsx`) holds exclusive priority for GPU render loops during gameplay. Under no circumstances may a secondary continuous WebGL or WebGPU canvas be instantiated or mounted over or alongside the gameplay viewport.
2. **Framer Motion Default**: Ordinary UI transitions (drawers, fades, layout shifts) must use Framer Motion 12 or Tailwind CSS transitions.
3. **No Speculative Dependencies**: Do not install external physics or 3D engines (Three.js, Matter.js, GSAP, Lottie, Anime.js, etc.) without explicit justification, benchmark qualification, and architectural sign-off.
4. **Authoritative State Separation**: Animation completion is never a prerequisite for simulation ticks, economy calculations, or save-state commits.
5. **Zero-Orphan Lifecycle Guarantee**: Every motion primitive and effect must clean up all timer handles, RAF callbacks, and DOM listeners on unmount.

---

## 3. Directory Structure

```
src/
├── components/
│   ├── dev/
│   │   └── PerformanceOverlay.tsx # In-game performance and qualification HUD
│   └── motion/
│       ├── origin/          # Vendored/adapted OriginKit source code
│       │   ├── MagneticPress.tsx
│       │   ├── GlowSweep.tsx
│       │   ├── TextScramble.tsx
│       │   ├── AnalogVignette.tsx
│       │   └── index.ts
│       ├── primitives/      # Game-facing tactile UI building blocks
│       │   └── index.ts     (MotionPanel, MotionButton, etc. - #73)
│       └── effects/         # Contextual juice & celebratory animations
│           └── index.ts     (Reward shimmers, ambient effects)
├── dev/
│   └── motionBenchmark.ts   # CLI and offline qualification benchmark harness
└── lib/
    └── motion/
        ├── tokens.ts        # Central duration, spring physics, and easing tokens
        ├── capabilities.ts  # Runtime reduced-motion, focus mode, and quality adapter
        └── qualification.ts # OriginKit effect budget, registry & runtime audit (#74)
```

---

## 4. Effect Budget Criteria & Qualification Matrix

### Budget Criteria & Invariants
- **Frame Time Budget**: In standard 60 FPS gameplay (16.6ms frame envelope), the PixiJS living studio floor is allocated $\ge 12.0	ext{ms}$. Total React/OriginKit UI motion overhead is capped at $\le 2.0	ext{ms}$, leaving $\ge 2.6	ext{ms}$ for garbage collection and idle margin.
- **Continuous Concurrency Limit**: At most **1** continuous ambient CSS visual effect is permitted during normal gameplay (e.g. `AnalogVignette`). Zero continuous ambient effects are allowed in Focus, Minimal, or Reduced-Motion modes.
- **Hidden Tab Suppression**: When `document.visibilityState === 'hidden'`, ALL continuous or decorative animations must pause, unmount, or settle immediately. Orphan RAF loops are strictly forbidden.
- **Quality Mode Adaptation**:
  - **Normal**: Full tactile feedback, approved continuous ambient effect, and GPU-composited sweeps.
  - **Focus**: Decorative ambient motion and looping shimmers suppressed; essential tactile feedback retained.
  - **Minimal**: Low-tier graphics preset; all ambient sweeps, glows, and vignettes unmounted.
  - **reducedMotion**: Zero duration transitions (`duration: 0`), decorative effects disabled, text decodes resolve synchronously.

### Candidate Effects Qualification Matrix

| Effect | Renderer | Continuous? | Expected cost | Gameplay allowed? | Fallback | Max FPS Target | Tab Hidden Behavior |
| :--- | :--- | :---: | :--- | :---: | :--- | :---: | :--- |
| **MagneticPress** | DOM / CSS Transform | No | Negligible (<0.1ms CPU) | **Yes** | Instant button press (zero pull) | Event-driven | Inactive (no event dispatch) |
| **GlowSweep** | CSS GPU Composite | Optional (looping on rare items) | Low (<0.2ms GPU composite) | **Yes** | Static gold/amber border highlight | 60 FPS | Paused / Unmounted |
| **TextScramble** | DOM Text Node | No (one-shot ~300ms) | Low (<0.5ms JS execution) | **Yes** | Immediate target text render | 33 FPS (30ms ticks) | Settle immediately |
| **AnalogVignette** | CSS Radial Gradient | Yes | Low (<0.2ms GPU composite) | **Yes** (suppressed in Focus/Minimal) | Unmounted | 30 FPS | Unmounted |
| **ParticleBurst** | Canvas 2D / DOM | No (one-shot ~1.5s) | Medium (~1.0ms peak) | **Yes** (milestones only) | Instant toast / audio cue | 60 FPS | Cancelled immediately |
| **VUMeterNeedle** | SVG / CSS Transform | Yes (during audio playback) | Low (<0.3ms CPU) | **Yes** | Static peak LED indicator | 60 FPS | Paused |
| **RewardParticleBurst** | Canvas 2D | No (one-shot, <=1.2s) | Low (<1ms CPU) | No | Skip particles; final card shown | 60 FPS | Cancelled |
| **RarityMaterialSweep** | CSS Transform | No (one-shot) | Negligible | No | No sweep; static card | 60 FPS | Settled |
| **GearFlourish** | DOM / Motion | No (bounded cycles) | Low (<0.3ms CPU) | No | Static family accent | 60 FPS | Settled |
| **GearDemoMeter** | SVG | Yes (inspector only, 4 Hz) | Low (<0.1ms CPU) | **Yes** | Static needle | 4 Hz | Paused |
| **TapeFlutter** | CSS Transform | Yes (during reel scrub) | Low (<0.2ms GPU) | **Yes** (Studio A / Reel) | Static reel graphic | 30 FPS | Paused |
| **FlightCaseGleam** | CSS Gradient | No (one-shot modal reveal) | Low (<0.3ms GPU) | **Yes** (crate modal only) | Static metallic bevel | 60 FPS | Paused |
| **SecondaryWebGLStudio** | WebGL | Yes | Prohibitive (>8.0ms GPU) | **No (DISQUALIFIED)** | Banned — PixiJS studio floor exclusive | 0 FPS | Terminated |
| **CanvasFluidFX** | Canvas 2D | Yes | Prohibitive (>6.0ms CPU/GPU) | **No (DISQUALIFIED)** | Static CSS linear gradient | 0 FPS | Terminated |

---

## 5. Pilot Component Selection & Implementation Details

All active pilot components are implemented in `src/components/motion/origin/` with zero unbudgeted dependencies:
- **MagneticPress** (`MagneticPress.tsx`): Implements magnetic pull using CSS transform matrix with spring damping from `motionSpring.press`. Bounded to $\pm 4	ext{px}$ to preserve cursor accessibility.
- **GlowSweep** (`GlowSweep.tsx`): Pure CSS GPU-composited transform over hardware tone gradients (`amber`, `cyan`, `gold`, `emerald`). Automatically unmounts when tab is hidden or when `reducedMotion` / Focus mode is active.
- **TextScramble** (`TextScramble.tsx`): Incremental DOM text replacement driven by a cancellable `setTimeout` accumulator. Instantly settles to final string on hidden tab or reduced-motion.
- **AnalogVignette** (`AnalogVignette.tsx`): Full-screen fixed CSS radial gradient with subtle breathing opacity (zsh.75 - 0.85$). Gated behind `decorativeMotion` and `isTabVisible`.

---

## 6. Provenance & Licensing Manifest

All adopted patterns adhere to commercial/open licensing standards.

| Component | Upstream Source | License | Integration Date | Local Modifications |
| :--- | :--- | :--- | :--- | :--- |
| **MagneticPress** | [OriginKit Magnetic](https://www.originkit.dev/docs/components) | MIT | 2026-09-29 | Adapted to `motionSpring.press`, integrated `useReducedMotion()`, bounded displacement clamp (±4px). |
| **GlowSweep** | [OriginKit Shine/Glow](https://www.originkit.dev/docs/components) | MIT | 2026-09-29 | Removed canvas dependencies; converted to pure CSS GPU-composited gradient with tone palette. |
| **TextScramble** | [OriginKit Text Decode](https://www.originkit.dev/docs/components) | MIT | 2026-09-29 | Replaced timer loops with `setTimeout` accumulator; added instant reduced-motion / hidden-tab resolution. |
| **AnalogVignette** | [OriginKit Ambient](https://www.originkit.dev/docs/components) | MIT | 2026-09-29 | Standardized to CRT/tube studio color temperatures; hooked into `useMotionCapabilities()`. |

---

## 7. Subagent Workflow for Future OriginKit Adoption

When subagents or engineers consider adding a new OriginKit effect:
1. **Audit Existing Stack**: Verify whether Framer Motion 12 or Tailwind 4 can already achieve the effect cleanly.
2. **Search by Interaction Need**: Focus on tactile audio/studio hardware metaphors (dials, faders, meters, tape flutter, metallic flight cases).
3. **Renderer Inspection**: Disqualify any component that requires an unbudgeted secondary WebGL context or continuous unthrottled canvas RAF loop.
4. **Token Adaptation**: Strip hardcoded spring values and bind to `src/lib/motion/tokens.ts`.
5. **Reduced-Motion & Focus Gate**: Wire into `src/lib/motion/capabilities.ts`. Every effect must have an instantaneous or hidden fallback.
6. **Provenance Registration**: Append the component, upstream URL, and license review date to this document.
7. **Regression Benchmark**: Run the qualification suite (`pnpm test`) and verify zero impact on PixiJS frame rates.
