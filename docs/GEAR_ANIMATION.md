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

## Not done yet (remaining #81 acceptance items)
- Pixi `AnimatedSprite` prototype, 1/6/20 gear benchmark, Rive decision (current leaning: defer; one canvas per gear is out of scope), wiring the sprite adapter into the Living Studio, and #80 flight-case FX hardening (`AnimatedGearFlourish` infinite loops, seeded particles).
