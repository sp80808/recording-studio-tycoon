# OriginKit Integration Guide & Provenance Manifest
*Recording Studio Tycoon — Motion Platform Architecture*
*Date: September 29, 2026 | Milestone: OriginKit Motion Platform (#72)*

---

## 1. Executive Summary & Purpose

Recording Studio Tycoon (RST) adopts [OriginKit](https://www.originkit.dev/) as a **curated source of high-polish animation patterns and React component recipes**. 

Rather than importing an unvetted third-party runtime or mounting competing animation engines, OriginKit components are:
1. **Curated & Vendored**: Selected for specific hardware/studio interactions.
2. **Adapted to RST Tokens**: Bound to `src/lib/motion/tokens.ts` and `src/lib/motion/capabilities.ts`.
3. **Budget-Constrained**: Evaluated against the desktop-companion performance contract (#46).

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
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Zero canvas stacking)
┌───────────────────────────────────┴────────────────────────────────────┐
│                        React Studio OS V2 Shell                        │
│  Framer Motion 12 + Tailwind CSS                                       │
│  - Navigation rails, slide-over management drawers, dialogs            │
│  - Tab switches, accordion states, tooltip hover physics               │
│  - Progress bars, volume faders, focus sliders                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Curated wrappers)
┌───────────────────────────────────┴────────────────────────────────────┐
│                    Curated OriginKit-Derived Effects                   │
│  OriginKit Adaptations (DOM / SVG / CSS Transform)                     │
│  - Tactile hardware button physics (MagneticPress)                     │
│  - Rarity / reward gleams & loot reveal shimmers (GlowSweep)           │
│  - Retro LED text scramble / decode transitions (TextScramble)         │
│  - Vintage cathode vignette / ambient lighting (AnalogVignette)        │
└────────────────────────────────────────────────────────────────────────┘
```

### 🚫 Non-Negotiable Hard Constraints
1. **No Competing WebGL Layer**: Never mount a secondary continuous WebGL/Canvas surface over `WebGLCanvas.tsx`. The PixiJS studio floor holds exclusive priority for GPU render loops during gameplay.
2. **Framer Motion Default**: Ordinary UI transitions (drawers, fades, layout shifts) must use Framer Motion 12 or Tailwind CSS transitions.
3. **No Speculative Dependencies**: Do not install external physics engines (Three.js, Matter.js, GSAP, etc.) without explicit justification, benchmark qualification, and architectural sign-off.
4. **Authoritative State Separation**: Animation completion is never a prerequisite for simulation ticks, economy calculations, or save-state commits.

---

## 3. Directory Structure

```
src/
├── components/
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
└── lib/
    └── motion/
        ├── tokens.ts        # Central duration, spring physics, and easing tokens
        └── capabilities.ts  # Runtime reduced-motion, focus mode, and quality adapter
```

---

## 4. Pilot Component Selection & Qualification Matrix

| Component / Effect | Role in RST | Renderer | Continuous? | Expected Cost | Allowed in Gameplay? | Reduced-Motion Fallback |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **MagneticPress** | Micro-motion for console knobs, pushbuttons, transport buttons | DOM / CSS Transform | No (on-hover only) | Negligible (<0.1ms) | **Yes** | Standard instant button press |
| **GlowSweep** | Collectible loot shimmer, flight crate unlock, S-grade badge | CSS Gradient / GPU Composited | Optional (2-3 loops) | Low (GPU composite) | **Yes** | Static gold/amber border |
| **TextScramble** | Studio tier unlock title, era shift header, CRT readout | DOM Text Nodes | No (one-shot ~300ms) | Low (<0.5ms JS) | **Yes** | Immediate text render |
| **AnalogVignette** | Ambient vintage cathode falloff on splash and milestone cutscenes | CSS Radial Gradient | Yes (slow opacity wave) | Low (single layer) | **Yes** (suppressed in Focus/Minimal) | Completely unmounted |

---

## 5. Provenance & Licensing Manifest

All adopted patterns adhere to commercial/open licensing standards.

| Component | Upstream Source | License | Integration Date | Local Modifications |
| :--- | :--- | :--- | :--- | :--- |
| **MagneticPress** | [OriginKit Magnetic](https://www.originkit.dev/docs/components) | MIT | 2026-09-29 | Adapted to `motionSpring.press`, integrated `useReducedMotion()`, bounded displacement clamp (±4px). |
| **GlowSweep** | [OriginKit Shine/Glow](https://www.originkit.dev/docs/components) | MIT | 2026-09-29 | Removed canvas dependencies; converted to pure CSS GPU-composited gradient with tone palette. |
| **TextScramble** | [OriginKit Text Decode](https://www.originkit.dev/docs/components) | MIT | 2026-09-29 | Replaced timer loops with `setTimeout` accumulator; added instant reduced-motion / hidden-tab resolution. |
| **AnalogVignette** | [OriginKit Ambient](https://www.originkit.dev/docs/components) | MIT | 2026-09-29 | Standardized to CRT/tube studio color temperatures; hooked into `useMotionCapabilities()`. |

---

## 6. Subagent Workflow for Future OriginKit Adoption

When subagents or engineers consider adding a new OriginKit effect:
1. **Audit Existing Stack**: Verify whether Framer Motion 12 or Tailwind 4 can already achieve the effect cleanly.
2. **Search by Interaction Need**: Focus on tactile audio/studio hardware metaphors (dials, faders, meters, tape flutter, metallic flight cases).
3. **Renderer Inspection**: Disqualify any component that requires an unbudgeted secondary WebGL context or continuous unthrottled canvas RAF loop.
4. **Token Adaptation**: Strip hardcoded spring values and bind to `src/lib/motion/tokens.ts`.
5. **Reduced-Motion & Focus Gate**: Wire into `src/lib/motion/capabilities.ts`. Every effect must have an instantaneous or hidden fallback.
6. **Provenance Registration**: Append the component, upstream URL, and license review date to this document.
7. **Regression Benchmark**: Run the qualification suite (`pnpm test`) and verify zero impact on PixiJS frame rates.
