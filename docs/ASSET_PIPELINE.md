# Asset pipeline (issue #79)

Source art -> cleanup -> canonical atlas -> validation -> Pixi-ready atlas + provenance.
Nothing here needs a paid or desktop tool in CI: Aseprite / Blender / Pixelorama are only for **authoring** sources.

```
assets-src/<kind>/<id>/asset.json      metadata + licence + palette (committed)
assets-src/<kind>/<id>/sheet.{png,json}    Aseprite / Pixelorama spritesheet export, OR
assets-src/<kind>/<id>/frames/<tag>_<nnn>.png    loose frames (Blender renders, PNG sequences)
        |  pnpm assets:build
public/assets/atlases/<kind>/<id>.{json,png,provenance.json}   (committed, byte-deterministic)
        |  pnpm assets:validate   (CI: part of `pnpm test`)
```

Commands: `pnpm assets:build [kind/id]`, `pnpm assets:validate` (exit 1 on any error; `ASSETS_JSON=out.json` writes a machine-readable report), `pnpm assets:inspect`.
Issue codes (`FRAME_OUT_OF_BOUNDS`, `PIVOT_INVALID`, `TAG_REQUIRED_MISSING`, `ANIMATION_BAD_REFERENCE`, `CHECKSUM_MISMATCH`, ...) are stable; see `validateAtlasReport`.

## Canonical conventions (enforced by `assetConventions.ts`)

| Kind | Native frame | Pivot | Required tags | Optional tags | Trim |
| --- | --- | --- | --- | --- | --- |
| `npc` | 32x48 | feet (0.5, 1) | `idle` | `walk wait work record mix break celebrate headbob` | no |
| `layer` | 32x48 | feet (0.5, 1) | none (one single-frame tag per part, e.g. `hair_afro`) | any | no |
| `gear` | any, uniform | base (0.5, 1) | `idle` | `powered active broken` | no |
| `prop` | any, uniform | base (0.5, 1) | `idle` | `active` | no |
| `fx` | any | centre (0.5, 0.5) | `play` | `loop` | yes |

- Frame names: `<kind>/<id>/<tag>/<nnn>` (e.g. `npc/engineer/idle/000`). Ids are `kebab-case` / `snake_case`.
- 1px transparent gutter between frames; atlas scale variants are `1` and `2` (`meta.scale`).
- Palette metadata (`paletteId` + `palette[]`) is mandatory in `asset.json`.
- Animation tags map to NPC presentation states in `npcAnimation.ts` (`recording -> record -> work -> idle`), so an atlas with only `idle/work/celebrate` still draws every state.

## Provenance (one schema, shared with #58)

`AssetProvenanceManifest` (schemaVersion 2) is the single schema. Each built atlas gets `<id>.provenance.json` with assetId, sourceType (`aseprite | pixelorama | blender_render | vector_authored | generative_ai_cleaned`), author, licence, sourceUrl (required for external art), tool + version, pipeline steps, source and exported dimensions, palette, frame tags and a sha256 over image + atlas JSON. `validate` fails on missing fields or a checksum that no longer matches the built files. Human-readable sourcing still goes in `docs/ART_SOURCING_LOG.md`.

## Blender renders (Harry's Mac session) and PR #98's loader

- Render each animation as an RGBA 8-bit PNG sequence named `<tag>_<nnn>.png` (`idle_000.png`, `work_001.png`...), same canvas size per asset, transparent background, origin at the feet/base. Drop them in `assets-src/<kind>/<id>/frames/` with an `asset.json` (`sourceType: "blender_render"`, licence, palette, tool = Blender version) and run `pnpm assets:build`.
- No second texture loader: multi-frame atlases load through Pixi's own `Spritesheet`/`Assets` (`pipeline/pixiAtlasLoader.ts`, `loadAtlas` + `createAtlasAnimation`). Single-frame static props keep using PR #98's `propSprites.ts` (`public/assets/props/<id>.png`); a flat prop PNG from Blender just goes there unchanged. `flatPngPath(id)` in `assetConventions.ts` is the shared naming rule. After #98 merges, `propSprites` can read the same `asset.json` ids; until then the two conventions are disjoint by folder (`assets/props/` vs `assets/atlases/`).
- Both samples under `assets-src/` (`npc/sample-engineer` via the Aseprite route, `gear/sample-monitor` via the loose-frame route) are procedurally drawn in-house and were **not** produced by real Aseprite/Blender; they prove the pipeline shape, not those tools' exports.

## Aseprite CLI (when installed; optional)

Author with tags `idle/work/celebrate`, plus an optional 1x1 slice named `pivot` (its `pivot` point sets the feet pivot). Export:

```
aseprite -b hero.aseprite --sheet assets-src/npc/hero/sheet.png --data assets-src/npc/hero/sheet.json \
  --format json-array --list-tags --list-slices --sheet-type rows --inner-padding 0 --shape-padding 1
```

`--scale 2` produces the 2x variant. `normalizeAsepriteExport` renames frames to the canonical scheme and accepts both `json-array` and `json-hash`. Manual fallback without Aseprite: export a PNG sequence from any tool and use the loose-frame route.

## Pixelorama interoperability (spike, partly unverified)

Pixelorama can export spritesheets and PNG sequences, and (recent versions) an Aseprite-shaped JSON with frame tags. The importer assumes the `frames` + `meta.frameTags` shape. **Not yet verified against a real Pixelorama export in this environment** (no desktop tool available); fallback is the PNG-sequence route, which has no metadata dependency. Follow-up: export a sample from Pixelorama and record which of tags, pivots (slices) and durations survive.

## Atlas packing decision: adopt native export + in-repo shelf packer, defer TexturePacker

1. Aseprite's native sheet export when authoring in Aseprite (tags/slices/durations survive).
2. `framePacker.ts` (deterministic shelf packer) for loose frames: zero dependencies, reproducible bytes.
3. TexturePacker: deferred. No measured production advantage at this atlas size (<=512px wide sheets), and it is paid. Revisit if atlases exceed one 2048 page or rotation/trim packing shows real memory wins.

## Generated / AI art cleanup route

Generated frames are not production-ready until they pass the same pipeline:
1. Background removal (hard alpha, no semi-transparent halo).
2. Halo cleanup (erode 1px / remove fringe against the game's backdrop colours).
3. Frame alignment to the canonical canvas; pivot normalised to feet/base.
4. Palette normalisation to the asset's `palette[]` (indexed in Aseprite/Pixelorama).
5. Assign animation tags and export through the normal route.
6. Record `sourceType: "generative_ai_cleaned"`, `generationSteps[]` and the tool/model in `asset.json`; provenance validation rejects generated art without them.
SpritesheetEditor (or similar) may be used as an optional cleanup utility; it is never a runtime or CI dependency.
