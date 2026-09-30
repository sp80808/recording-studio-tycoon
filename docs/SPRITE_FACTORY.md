# Sprite factory (issue #78)

## Identity and determinism
An NPC is identified by `NpcVisualIdentity { seed, role, era, appearanceVersion }` (`npcAppearance.ts`). `resolveNpcAppearance(identity)` rebuilds the same serialisable `ModularNpcDefinition` every time, using the repo's `createSeededRandom` (no `Math.random`). Saving the identity (or the whole definition, which embeds `appearanceVersion`) is enough for save/load. To change how looks are generated, add `generateV2` and register it in `GENERATORS`; saved NPCs keep their version, and unknown future versions fall back to the newest known one. Legacy data without a version reads as version 1.

## Data, not code
All pools live in `npcAppearanceData.ts` as typed tables with era weighting (`[value, weight]`), so invalid enum values are compile errors. The old prototype issues are fixed: a colour cast into a hair-shape pool (`'bleached_blonde' as any`), a private duplicate RNG, hard-coded pools inside the generator, and era pools that ignored body/outerwear/shoes. Bald is now a real weighted option and bald NPCs can get a beard.
Approximate size of the look space (v1): builds x skin x faces x era hair/colour/facial x tops x lowers x shoes x outerwear x glasses x jewellery x 12 clothing palettes x 8 lower x 6 shoe colours -> far beyond what needs authoring; the test generates 400 NPCs of one role/era and expects >380 distinct looks.

## Renderer separation
Definitions are plain JSON. `npcLayers.ts` turns a definition into an ordered layer stack (`body/afro`-style variant keys + tints) usable by both the DOM/SVG `ModularSpriteRenderer` and a Pixi layered renderer; `resolveLayerFrames` drops missing optional layers and reports missing required ones so callers fall back to the DOM renderer.

## Animation states
`idle walk waiting working recording mixing break celebrate leaving` (`npcAnimation.ts`), each with an atlas tag fallback chain ending at `idle`. Presentation only: nothing authoritative waits on a clip. The DOM renderer collapses them onto its four existing motions (`domMotionFor`); `headbob` is kept as a legacy alias.

## Layered Pixi vs DOM/SVG
- **Layered NPC art:** `assets-src/layer/npc-parts` holds 40 in-house CC0 parts (3 builds, 6 lowers, 6 shoes, 8 tops, 9 hair shapes, 6 faces, shadow, headphones) drawn white/grey on the shared 32x48 canvas. `scripts/assets/make-layer-parts.ts` regenerates them; `createLayeredNpc` (`pixiNpc.ts`) tints them from the NPC definition. A test builds 300 generated NPCs and asserts every required layer has art. Glasses, facial hair, jewellery, outerwear and most role props have no part art yet, so those optional layers are skipped (the DOM renderer still draws them). Blender-made parts can replace or add to these through the `layer` kind.
- **Benchmark** (`node scripts/bench/npc-render-bench.cjs`, headless Chromium with SwiftShader software GL, 4 s window, 3 animated NPCs of the same seeds in each renderer at 3x scale). Main-thread time is the reliable signal; fps under software GL is limited by CPU rasterisation, not by what a real GPU would do:

| NPCs | Pixi fps | DOM fps | Pixi main-thread ms/frame | DOM main-thread ms/frame |
| --- | --- | --- | --- | --- |
| 3 | 60.3 | 60.0 | 0.97 | 1.57 |
| 6 | 29.5 | 60.3 | 1.11 | 1.97 |
| 12 | 18.3 | 60.3 | 0.92 | 3.47 |

  Pixi's main-thread cost stays flat (~1 ms/frame) while DOM/SVG grows with NPC count (1.6 -> 3.5 ms/frame). Pixi's fps drop at 6 and 12 NPCs comes from the software-GL fill cost of ~15 overlapping layer sprites per NPC, which I expect (but have not verified) to vanish on real GPUs. So: the benchmark supports layered Pixi for main-thread cost, is inconclusive on GPU throughput, and needs a real-device run (phone + laptop) before it is treated as the final adoption call. Recommendation: use layered Pixi for the Living Studio (where the Pixi scene already exists), keep DOM/SVG for UI portraits, and cut draw cost by baking layers into one texture per NPC if a device run shows fill-rate limits.

**Baked NPCs (engine thread, software GL, same bench):** `bakeLayeredNpc` (`pixiNpc.ts`) renders the layer stack into one texture and one Sprite. Animation only bobs/scales the whole figure, so nothing is lost. Results for the `pixibaked` mode: 12 NPCs 60.0 fps (layered Pixi 37.5 that run), 6 NPCs 60.0, 3 NPCs 60.0. This supports the overdraw theory. The layers already share one atlas, so they batch; the cost was fill from ~15 overlapping sprites per NPC. Bake is opt-in for callers (no studio-floor caller exists yet); offscreen culling is not needed at this scale.

## Spine: defer
Decision: **defer Spine, keep layered Pixi.** Reasons (from public information; re-verify versions/pricing before any adoption): the Spine Pixi v8 runtime targets newer Pixi 8.x than the pinned 8.10.1 and the issue forbids upgrading Pixi just for this; Spine needs a paid Editor licence for authoring and runtime use requires a valid licence for the project; the runtime adds bundle weight versus zero extra dependencies for atlas layers; and RST's characters are small 32x48 sprites where per-layer tinting already gives variety. Revisit only if skeletal blending or mesh deformation becomes a requirement.
