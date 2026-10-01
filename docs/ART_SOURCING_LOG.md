# Art Sourcing Log — Flight Cases, Mods, Equipment Art, Collectibles

Single log for where every sprite / variant / sticker / emblem comes from,
what is bundled vs procedural, and what is deferred to the later roadmap.
Policy: **CC0 only** for anything bundled. No GPL / NC / ND assets in the repo.

## 1. Flight cases (`src/data/flightCases.ts`)

5 tiers, all rendered in-code (CSS/SVG) by `CrateUnboxingModal` today — no
binary download required. PNG paths under `public/assets/crates/` are reserved
targets; dropping a file in lights up the tier with zero code changes.

| Tier | Drop sources | CC0 source pack | URL |
|---|---|---|---|
| Yard-Sale Cardboard Box | yard_sale, level_reward | OGA Boxes and crates (svg + pngs) | https://opengameart.org/content/cc0-resources |
| Roadworn Flight Case | s_grade_take, yard_sale, dealer | OGA Crates 32x32 sheet (6 variants) | https://opengameart.org/content/crates-3 |
| Tour Trunk | s_grade_take, auction, dealer | Kenney Generic Items | https://opengameart.org/content/generic-items |
| Vintage Flight Crate | chore_streak, s_grade_take | OGA Crate and barrel (.blend) | https://opengameart.org/content/crate-and-barrel-no-pun-intended |
| Holy Grail Vault | auction, level_reward | OGA Sci-Fi Shipping Crate (PBR .glb) | https://opengameart.org/content/sci-fi-shipping-crate |

Legacy compat: `GameState.pendingCrates` tiers (`standard` /
`vintage_flight_case`) map via `legacyTierToFlightCase()` — `standard` →
`road_case`. No save migration needed.

## 2. Equipment mods (`src/data/equipmentMods.ts`)

12 mods (was 1). All **in-house original designs, CC0** — art is a CSS/SVG
faceplate variant + `iconOverride`, so no external source to attribute:

- UREI 1176 Rev A (existing), Shurely capsule swap, condenser tube stage,
  ribbon active boost, Telefunken spring tank, Fairychild SC-HPF, SSL black EQ,
  Moog filter-drive, Fender hot-rail, 808 sub-drop, NS-10 tissue trick,
  Scarlett clock upgrade.

Research costs scale 120–900 / 3–12 days by tier.

## 3. Equipment art (`src/data/equipmentArt.ts` + `equipmentSprites.ts`)

57 unique equipment ids (equipment.ts ∪ eraEquipment.ts) — **every one** has
an entry: base sprite path, alts, fallback emoji, tint, CC0 source, 3 CSS
variants (Stock / Roadworn / Studio Black + category specials: Tube Glow,
Neon Skin), wear support + emblem slot flag.

Category → source mapping:

| Category | Source pack | License |
|---|---|---|
| Instruments (guitar, keys, drums) | Kenney Generic Items + OGA Misc and Tool Items + OGA Instrument Pixel Art | CC0 |
| Outboard / mixer / recorder / interface / monitor | OGA Hifi System (receiver, equalizer, tape-deck, turntable, speakers) | CC0 |
| Software / plugins | Kenney Game Icons (105 icons) | CC0 |
| Room dressing (backgrounds, not per-item) | Kenney Furniture Kit + Roguelike Indoor pack | CC0 |

Sprite files are **targets** under `public/assets/items/` — the loader falls
back to emoji + tint when a PNG is absent, so art can land incrementally.
Sourcing queue (in priority order):

1. Trim Kenney Generic Items PNGs → `public/assets/items/` (guitar, keyboard, drum).
2. Trim OGA Hifi System PNGs → `public/assets/items/` (receiver, equalizer, tape-deck, speakers).
3. Trim Kenney Medals + OGA Award Icons → `public/assets/collectibles/`.
4. Evaluate Kenney Furniture Kit isometric renders for studio background layers.

## 4. Emblems / skins / stickers / level collectibles (`src/data/collectibles.ts`)

12 defs alongside the main sprites. `status: 'shipped'` = data + CSS
rendering works today; `status: 'roadmap'` = data scaffold only, UI deferred:

- Emblems: First Take (shipped), Gold Record (shipped), Rock Wing + Circuit (roadmap).
- Skins: Studio Black + Tube Glow (shipped via art variants), Neon Pulse (roadmap PNG).
- Stickers: 3-day streak + S-grade foil (shipped), 30-day tour crew (roadmap).
- Level trophies: Bronze Console + Gold Mic (roadmap, shelf scene).

Sources: Kenney Medals (CC0), Buch OGA Medals (CC0), OGA CC0 Award Icons
(CC0), Kenney Game Icons (CC0), OGA Cyber Inventory Mega Pack (CC0, neon
treatments). The CC-BY `Flag, emblem, badge` pack was evaluated and
**rejected for bundling** (attribution friction) — noted here only.

## 5. Later roadmap (3D models, animation, UI wiring)

Tracked in `COLLECTIBLES_ROADMAP` (exported from `collectibles.ts`) and the
beads issue `recording-studio-tycoon-art.X` (3D models + skins/sticker UI):

- 3D model viewer for flight cases (Sci-Fi Shipping Crate .glb + Crate-and-barrel .blend as base meshes).
- 3D gear models: Kenney Furniture Kit / City Kit CC0 .obj/.fbx/.glb for room dressing.
- Animated variants (VU bounce, tube flicker) — artist pass or Higgsfield generation.
- Skins equip UI, sticker slotting UI, shelf display scene (PixiJS).
- AI-generated filler (Higgsfield `higgsfield-generate` skill) ONLY where no CC0 equivalent exists; must be logged here as in-house CC0.

## 6. Image-generation connectors available

- `higgsfield-generate` skill (GPT Image 2 / Seedance / Nano Banana) — reserved for gaps with no CC0 coverage; nothing generated this pass because CC0 covers all current needs.
- Web search + fetch (Kenney.nl, OpenGameArt.org) — used this pass; URLs above verified live Sept 2026.
- No binary assets downloaded this pass (keeps the diff reviewable); PNG trimming is queue item 1–3 above.

## 8. Signature studio props (door, wall clock, mic stand, mug, notepad, stool, music stand)

Kenney.nl / OpenGameArt were unreachable from the build environment, so these
these were drawn in-house. License: **In-house (CC0)**. Source SVGs live in
`public/assets/props/*.svg`; PNGs are 2x renders via
`scripts/render-prop-sprites.cjs`. Loaded by `src/components/studio/propSprites.ts`;
the scene falls back to the original procedural drawing if a texture is missing.

| Sprite | File | Used in |
| --- | --- | --- |
| Studio door | `public/assets/props/door.png` | `WebGLCanvas.tsx` (left wall, sheared into wall plane) |
| Wall clock face | `public/assets/props/wall-clock.png` | `studioDecor.ts` `buildWallClock` (hands stay live) |
| Booth mic stand | `public/assets/props/mic-stand.png` | `studioDecor.ts` `buildLiveBooth` |
| Booth stool | `public/assets/props/stool.png` | `studioDecor.ts` `buildLiveBooth` |
| Booth music stand | `public/assets/props/music-stand.png` | `studioDecor.ts` `buildLiveBooth` |
| Desk mug | `public/assets/props/mug.png` | `studioDecor.ts` `buildDeskProps` |
| Desk notepad | `public/assets/props/notepad.png` | `studioDecor.ts` `buildDeskProps` (sheared onto desk plane) |

Swap for Kenney/OGA CC0 art later by replacing the PNGs (same sizes).

Second batch (same in-house CC0 pipeline, same folder):

| Sprite | File | Used in |
| --- | --- | --- |
| Floor rug | `public/assets/props/rug.png` | `studioDecor.ts` `buildRug` (sheared onto floor plane) |
| Brass floor lamp (1960s) | `public/assets/props/brass-lamp.png` | `studioDecor.ts` era prop |
| Lava lamp (2000s) | `public/assets/props/lava-lamp.png` | `studioDecor.ts` era prop (animated blobs still drawn on top) |
| Ring light (2020s) | `public/assets/props/ring-light.png` | `studioDecor.ts` era prop |

Third batch (in-house CC0):

- Trophy wall plaques (`trophy-gold|platinum|award.png`) replace the procedural plaques in `buildWallDressing`, sheared into the right-wall plane. Not yet screenshot-verified in-game (needs earned trophies).
- Booking icons in `public/assets/icons/booking/` (`brief`, `fit-S|A|B|C`, `approach-safe`, `approach-moonshot`) are standalone SVGs, deliberately not wired in, so the booking enquiry card work in #101 can import them.

## 7. In-house reward sprites (CC0)

`public/assets/rewards/coin.svg`, `xp-star.svg`, `spark.svg` were hand-drawn as SVG
for this project (no external source, no AI generation) and are released CC0. Used by
`RewardFlights` for cash/XP loot travel.

## 9. Asset factory sample sources (issues #78, #79)

Procedurally drawn in-house (rectangles, no third-party art). License: **In-house (CC0)**.

| Asset | Source | Output |
| --- | --- | --- |
| `npc/sample-engineer` (idle/work/celebrate, feet pivot) | `assets-src/npc/sample-engineer/` (Aseprite-format JSON + PNG, written by `scripts/assets/make-samples.ts`) | `public/assets/atlases/npc/sample-engineer.*` |
| `gear/sample-monitor` (idle/powered) | `assets-src/gear/sample-monitor/frames/` (Blender-style loose frames) | `public/assets/atlases/gear/sample-monitor.*` |
| `layer/npc-parts` (40 tintable NPC parts: body, hair, tops, lowers, shoes, faces, headphones) | `scripts/assets/make-layer-parts.ts` -> `assets-src/layer/npc-parts/frames/` | `public/assets/atlases/layer/npc-parts.*` |

Every built atlas has a `*.provenance.json` (schema in `docs/ASSET_PIPELINE.md`). Real Aseprite/Blender exports have not been run through the pipeline yet.

## 10. Studio models rendered in Blender (`tools/blender`, `public/assets/studio`)

In-house original low-poly models, CC0, no external source. Rendered headless from the scripts in
`tools/blender` (see its README) so they can be regenerated or restyled.

| Asset | Files | Used by |
|---|---|---|
| Crew characters: 18 tintable layers x 4 facings x 2 poses (idle, working) | `characters/*.png` | `characters.ts`, `WebGLCanvas.tsx` |
| Mixing console, one body per studio tier (1-5) with fader/meter anchors | `console_t1..5.png`, `console.json` | `studioSprites.ts`, `WebGLCanvas.tsx` |
| Vocal booth: interior and glass/frame layers | `booth_back.png`, `booth_front.png`, `booth.json` | `studioDecor.ts` (`buildLiveBooth`) |
| Brass wall clock dial | `clock_face.png`, `clock.json` | `studioDecor.ts` (`buildWallClock`) |

Every asset has a procedural Graphics fallback if its PNG fails to load.

## 11. Console-tier deck gear (issue #81, tiers 2-5)

In-house original, CC0, no external source. Drawn procedurally in Pixi (`WebGLCanvas.tsx`, `gearSpriteAnimation.ts`); no new image files.

| Asset | Source | Used by |
|---|---|---|
| Outboard tape-deck plate, valve glow lamps, status LEDs (tiers 2-5) | Pixi Graphics, drawn in code | `WebGLCanvas.tsx` (`buildScene`) |
| Tier-tinted reel frames (silver, blue-steel, gold) | Same 8-frame procedural reel as tier 1, tinted per tier | `consoleTierGear.ts` |
