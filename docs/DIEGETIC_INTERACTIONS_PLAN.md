# Diegetic Studio Interactions Plan

**Scope:** split RST interaction into two families — *minigames* (occasional
30–90 s focused challenges) and *diegetic micro-interactions* (2–20 s, performed
directly on objects/NPCs in the studio while the world stays visible).
**Status:** PLAN ONLY. No dependencies installed, no code written.

RST already has **29 minigame types** wrapped by `MinigameManager` in a `Dialog`.
The newer direction is "the studio is the controller."

---

## 1. Two interaction families

| | Minigames | Diegetic interactions |
|---|---|---|
| Duration | 30–90 s | 2–20 s |
| Where | Dialog overlay | Directly on the object/NPC |
| World | Hidden/behind modal | Stays visible |
| When | Occasional challenge | Frequent, during ordinary work |

## 2. Diegetic interaction catalogue (29 ideas)

Patchbay routing · Mic placement · Preamp setup · Headphone cue mix · Talkback ·
Punch-in transport · Cable fault hunt · Mic stand balancing · Drum tuning · Drum
mic phase alignment · Guitar cab placement · Monitor setup · Feedback hunt ·
Acoustic clap test · Tape threading · Tape calibration · Sampler trimming ·
Console recall · Rack installation · Power sequencing · Scratchy pot maintenance ·
Tube/fuse replacement · Cable coiling · Flight-case loading · Modular synth patching ·
Compressor setting · Channel labelling · Session teardown · Gear unboxing ·
Record plaque mounting.

## 3. Migration, not duplication

Existing games already contain most of the underlying scoring concepts:
`GainStagingGame`, `PhaseCheckGame`, `FaultHuntGame`, `AcousticTreatmentGame`,
`TapeJogGame`, `TapeSplicingGame`, `FaderRideGame`, `ConsoleRideGame`,
`FlightCasePackingGame`, `SamplingSequencingGame`, `BeatPadGame`,
`GearMaintenanceGame`, `BusMergeGame`, `ChainRecallGame`, `VocalCompGame`.

Instead of: *click console → modal opens → Gain Staging Game*
Do: *click preamp → camera eases closer → gain knob + meter interactive in-place
→ adjust → LED settles green → engineer nods → session resumes.*

## 4. New tooling (none installed yet)

- **wavesurfer.js** (v8, TS + Regions/Timeline/Minimap/Envelope/Record/Spectrogram
  plugins) — tape editing, sample trimming, vocal comping, punch-in, waveform
  repair. Absent from node_modules.
- **Meyda** (MIT) — real-time/offline Web Audio feature extraction for optional
  "listen rather than eyeball" mechanics. Absent.
- **JZZ** (MIT) — MIDI in/out, MPE, MIDI 2.0 for optional "use my controller"
  mode (MIDI pads → BeatPad, CC → console faders/knobs). Absent.
- **Matter.js** (MIT) — physics, but only locally: mic stands, floppy patch
  cables, flight cases, unboxing. Absent.
- **p2-es** — alternative 2D physics; not needed if Matter is chosen.
- **@use-gesture** — DOM-only drag/pinch/wheel/hover; NOT over the main Pixi
  canvas (RST has custom touch/pan + `touchAction='none'`).
- **Tweakpane** — dev-only tuning pane for shader intensity, fader inertia,
  mic sweet-spot widths, controller deadzones, particles, camera impulse,
  meter ballistics. Absent.
- **PixiJS Devtools** — dev workflow for debugging dozens of interactable
  objects. Absent.
- **NexusUI** — MIT web-audio musical interfaces; reference material for tactile
  dials/sliders/sequencers/meters, not for visuals directly.

## 5. Haptics — reuse what exists, do not add a library

RST already has `hapticTick()` in `src/utils/mobilePlatform.ts` (Android web
vibration; iOS has no web API) and `gamepadService.ts` already drives
`vibrationActuator.playEffect('dimal-rumble', ...)`. A Capacitor scaffold exists
noting `@capacitor/haptics` for a later native wrapper. Do NOT install another
haptics library.

## 6. Reusable `TactileFeedback` service

```ts
tactile.detent()
tactile.patchInsert()
tactile.faderStop()
tactile.buttonLatch()
tactile.clipWarning()
tactile.successLock()
tactile.gearImpact()
```

Each triggers a combination of: tiny object movement, SFX, gamepad rumble,
mobile haptic, glow/outline/filter response, optional particles.

## 7. Real-world input (progressive enhancement, never required)

- MIDI controller → maps notes/pads to samplers, CC to focused knobs/faders.
- Microphone → optional tuner, transient/rhythm detection, clap-test modes.
  Meyda/Aubio-style local analysis.
- Avoid camera/video gimmicks unless they clearly improve the studio fantasy.

## 8. Implementation order

1. Create `WorldInteraction` alongside `MinigameManager` — keeps Pixi studio
   mounted, locks only the relevant hotspot, returns the same score/outcome
   contract existing games use.
2. Convert Gain Staging + Phase Check into console/preamp interactions.
3. Build patch cables + patchbay (reusable for routing, troubleshooting,
   synths, outboard).
4. Add mic placement (covers vocals, guitar cabs, drums, room mics).
5. Integrate Wavesurfer; migrate Punch-In, Tape, Sampling, Vocal Comp toward
   physical transport/waveform objects.
6. Add cue mix / talkback / session-setup beats (artist + engineer involvement).
7. Prototype JZZ MIDI mapping for BeatPad + one console fader.
8. Then Matter.js locally for cables, stands, unboxing, case packing.

## 9. North-star session

*artist arrives → engineer plugs mic → player positions it → XLR visually runs to
preamp → set phantom/gain → give headphone cue mix → hold talkback → press Record
→ ride one problem moment → playback waveform → punch/comp if needed → lock take
→ artist reacts → engineer tears down gear.*

## 10. Licenses

- wavesurfer.js: BSD-3
- Meyda: MIT
- JZZ: MIT
- Matter.js: MIT
- p2-es: MIT
- @use-gesture: MIT
- Tweakpane: MIT
- NexusUI: MIT
- PixiJS Devtools: MIT