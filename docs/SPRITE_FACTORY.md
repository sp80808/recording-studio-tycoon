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

## Layered Pixi vs DOM/SVG: status
- Done: atlas -> `AnimatedSprite` path (`pixiAtlasLoader.ts`) is tested headless, and the layer-stack build costs ~0.005-0.01 ms per frame for 3/6/12 NPCs (`tests/sprite-factory.check.ts`).
- **Not done:** an on-screen render benchmark of layered Pixi vs DOM/SVG at 3/6/12 NPCs, and a complete layered NPC drawn from authored layer art (there is no per-layer art yet; the Blender character work is the intended source). The issue's acceptance items for those stay open. Recommendation until measured: keep DOM/SVG for UI portraits, use layered Pixi atlases for the Living Studio once layer art exists.

## Spine: defer
Decision: **defer Spine, keep layered Pixi.** Reasons (from public information; re-verify versions/pricing before any adoption): the Spine Pixi v8 runtime targets newer Pixi 8.x than the pinned 8.10.1 and the issue forbids upgrading Pixi just for this; Spine needs a paid Editor licence for authoring and runtime use requires a valid licence for the project; the runtime adds bundle weight versus zero extra dependencies for atlas layers; and RST's characters are small 32x48 sprites where per-layer tinting already gives variety. Revisit only if skeletal blending or mesh deformation becomes a requirement.
