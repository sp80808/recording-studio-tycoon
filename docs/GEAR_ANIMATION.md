# Gear animation layer (#81)

Flow: authoritative equipment state -> `GearVisualState` (`src/features/gearStudio/gearVisualState.ts`) -> renderer.
Visuals never write equipment condition.

## Fidelity levels
| Level | Where | Budget |
|---|---|---|
| `living-studio` | Pixi world | tiny indicators, 4 Hz, consume `GearSpriteVisualState`, no DOM hardware |
| `inspector` | inspector / flight case | detailed faceplate, 8 Hz meters, interactive controls |
| `minimal` | Focus/Minimal, reduced motion | static indicators, no timers |

## Shipped in this slice
- Primitives: VUMeter, LedMeter, JewelLamp, RotaryKnob, ToggleSwitch, PushButtonBank, TapeReelPair, VacuumTubeGlow, TransportButtons, RackFaceplate.
- `InteractiveStudioRackGear` rebuilt on them; `Math.random` + 120 ms interval replaced by `useDemoMeter` (seeded, 250 ms step, paused when tab hidden, no timer when off or reduced motion).
- 10-archetype registry, condition bands (pristine/used/worn/failing) with flicker, meter noise, scratch overlay and warning LED.
- Serializable `GearSpriteVisualState` adapter (no React/Pixi imports).

## AnimatedSprite spike
`gearSpriteAnimation.ts` builds an 8-frame tape-reel `AnimatedSprite` from Pixi Graphics textures (one shared frame set per renderer). `applyReelState` stops and parks on frame 0 when off, stopped or reduced-motion, so a static reel costs no ticker work. Authored frames beat runtime DOM animation for in-world indicators: one texture swap per tick, no React renders, no layout. Status: mounted in the Living Studio (`WebGLCanvas.tsx`, tier-1 tape machine). Reels are parked on frame 0 unless a project is active and motion is allowed; they are advanced from the scene ticker (`autoUpdate: false`), so the `targetFps` cap and the hidden-tab early return apply.

## Performance contract (Node CPU only; no GPU or browser in the cloud session)
Measured by `tests/gear-bench.check.ts` (state mapping + meter sampling):
| Scenario | Updates/s | CPU per simulated second |
|---|---|---|
| 1 inspector (8 Hz) | 8 | 0.03 ms |
| 6 in-world (4 Hz) | 24 | 0.08 ms |
| 20 in-world (4 Hz) | 80 | 0.09 ms |
Budgets asserted: 20 in-world < 5 ms CPU/s and <= 80 updates/s. Minimal fidelity = 0 updates; reduced motion stops the meter timer and parks the reel; hidden tab clears the meter interval. Pixi frame cost and React commit counts still need a browser run (follow-up).

## Rive decision: defer
Adds a WASM runtime and a per-canvas lifecycle, needs a separate authoring workflow and needs its own accessibility fallback. Motion + SVG/CSS (inspector) and Pixi AnimatedSprite (world) already cover every case in #81 with no new dependency. Revisit only for a single bounded inspector/reward object if authored state-machine interaction is wanted.

## #80 reward FX (same PR)
`fx/rewardFx.ts`: renderer-independent preset/request types, per-rarity effect budgets (common none, uncommon sweep, rare sweep + small burst, vintage/legendary add family flourish), data-driven gear families with bounded cycles, seeded FX randomness, 4 s hard cap. `PixiParticleBurst` is now seeded, cancels when the tab is hidden, and completes once. `RarityMaterialSweep` is one-shot; `AnimatedGearFlourish` settles after a few cycles. Renderer decision: keep the lightweight Canvas 2D burst for now (Pixi is not mounted over normal gameplay, and #80 forbids a second persistent WebGL renderer). Still open: wiring `RARITY_FX_POLICY` into `FlightCaseReveal` (belongs with #96/#76 to avoid conflicts), removing the duplicate `canvas-confetti`, the dev gallery, and #74 qualification.

## Browser evidence (headless Chromium, software WebGL via SwiftShader; not a real GPU)
Driven with Playwright against the real game (new 1960s studio -> Open the studio), 1440x900, three 6 s rAF samples each:
| Build | Mean frame time per run |
|---|---|
| main (static ellipse reels) | 361, 391, 350 ms |
| this branch (AnimatedSprite reels, idle/parked) | 332, 369, 379 ms |
Software GL runs the whole scene at about 2.7 fps, so absolute numbers mean nothing, but the two builds are within run-to-run noise: parked sprite reels add no measurable per-frame cost. Screenshot: `docs/img/gear-reels-living-studio.png`.

Not measured: playing-state reel cost (needs a booked session), React commit counts for the inspector, and real-GPU numbers. These remain follow-ups on #81.
