# UX / Visual Iterative Plan

**Date:** 2026-09-29  
**Goal:** Short, prioritized iterations over HUD/viewport, splash, isometric room polish, and later visual expansions.  
**Base audit:** [pixi-presentation-audit.md](./pixi-presentation-audit.md).  
**Related:** [UI_UX_OVERHAUL_CONSIDERATIONS.md](./UI_UX_OVERHAUL_CONSIDERATIONS.md), [STUDIO_STRIP_AUDIT.md](./STUDIO_STRIP_AUDIT.md), [multi-room-blueprints.md](./multi-room-blueprints.md), [visual_studio_plan.md](./visual_studio_plan.md).

Storyline stays free; monetisation stays optional cosmetics/gear only (see flight-case ADR).

---

## Priority legend

| Tag | Meaning |
|-----|---------|
| **P0** | Playability / correctness / screenshot blockers |
| **P1** | High polish, next sprint after P0 |
| **P2** | Expansions / nicer-to-have once P0–P1 land |

---

## P0 — Fix first

### HUD / viewport scaling
1. **Guarantee Work / Overdrive dock visibility** in windowed short viewports (Issue #54 path): reduce `StudioRoom` min clamp when `ActiveProject` is open, or make middle column a flex scroll with pinned dock — do not require fullscreen. *(partial — dock clearance CSS var landed; Session drawer uses viewport-aware widths)*
2. ~~**Unify hotspot IDs**~~ — **done**: `StudioRoom` gamepad list/names and `choreEngine` chore hotspots now use the Pixi ids (`liveRoom`, `tv`); live-room badge reads the authored chore so older saves still show it.
3. ~~**Reposition DEV chrome**~~ — **done** (`5eaed315`): Settings opt-in, defaults OFF.
4. ~~**Tag living studio canvas**~~ — **done**: `id="pixi-studio-canvas"` + `data-engine="pixi"`.

### Isometric room (screenshot blockers)
5. ~~**Mic z-order**~~ — **done**: mic drawn before glass, deeper tile-Y.
6. ~~**Add a door**~~ — **done**: left-wall door between clock & TV + floor threshold.
7. ~~**Clock foreshortening**~~ — **done**: ellipse + skew/scale on left wall plane.

### Splash
8. ~~**Splash → game handoff**~~ — **done**: `studio-boot-gate` skeleton/progress between splash and floor; splash enter fades.

### Adaptive coach / Session
- First Session coach host: `first-session-guide.css` breakpoints (~375 / 768 / 1100 / 1400) + hide during `data-chrome-busy=take-calibration` (toast merge `9a98ad7e`).
- Session drawer: wider viewport caps (`ContextDrawer` session width) to reduce empty side margins.

---

## P1 — Next polish pass

### HUD / viewport
1. ~~**World-anchored chore badges**~~ — **done** for the console and live-room badges: `WebGLCanvas` reports hotspot screen anchors (`onHotspotAnchors`, only when they move) and `StudioRoom` pins the badges to them. The lounge chip stays in the top-right stack.
2. **Safe-area insets** for camera reset / year label vs notch and strip shell ([DESKTOP_STRIP_SHELL.md](./architecture/DESKTOP_STRIP_SHELL.md)).
3. **Resolution / FPS settings** already exist — expose a “Performance” preset that forces CRT/bloom off + lower `targetFps` for integrated GPUs (document in Settings UX, no second WebGL).

### Splash
4. ~~**Brand-first hero**~~ — **done**: a real studio still (captured from the game, `public/assets/splash-studio.jpg`) sits above the title with softly faded edges; one primary CTA group, tips stay in the footer.
5. ~~**Era picker preview**~~ — **done**: each era card shows the room's left wall, right wall and accent colours from `ERA_GRADES`.

### Isometric room
6. ~~**Depth bands**~~ — **done**: `Z` bands in `WebGLCanvas` (`world` by add order, `depth + y` for staff and free-standing tier props, `fx` for lights, bloom and idle hints). The console desk (with its props and phone) y-sorts with the staff at its front-left corner, so staff behind it are hidden and staff in front draw over it. The booth glass stays in the world band: no staff spot is inside the booth, so a separate glass band would change nothing visible yet.
7. **Swap 2–3 signature props to sprites** (mic stand, door, clock) from curated packs documented in `visual_studio_plan.md` / `equipmentArt.ts`, keeping everything else procedural.
8. ~~**Idle hint + hover glow** contrast~~ — **done**: idle hints get a dark keyline under the coloured ring and hover glows peak at full alpha.

### Particles / reward FX
9. Keep `PixiParticleBurst` as Canvas 2D one-shots; never promote to continuous WebGL. Cap concurrent bursts to 1.

---

## P2 — Future visual expansions

1. **Multi-room blueprint map** (bird’s-eye) — see [multi-room-blueprints.md](./multi-room-blueprints.md); iso remains per-room detail view.
2. **Client enter/exit animations** through the door once adjacency exists (non-blocking, skippable, respects reduced motion).
3. **Equipment shelf sprites** driven by owned gear IDs (`equipmentSpriteMap`) instead of colored bars.
4. **Optional Pixi HUD panels** from `src/pixi-ui/*` only if they share the **same** Application as the studio — never mount `PixiProjectCardsBridge` as a second continuous WebGL during play.
5. **Era lighting kits** (practicals, neon at tier 5) as data-driven overlays, not hard-coded one-offs only.
6. **Cosmetic room skins / flight-case vanity** (paid optional) that recolor trim/rug without changing narrative unlocks.

---

## Iteration cadence (suggested)

| Sprint | Focus | Exit criteria |
|--------|-------|---------------|
| A | P0 viewport + hotspot IDs + DEV collision | Windowed laptop can always reach Work; gamepad ids match Pixi |
| B | P0 room polish (mic, door, clock) | Screenshot checklist passes |
| C | P1 depth bands + splash continuity | Pan/zoom badges stay sensible; splash→play no clip |
| D+ | P2 multi-room blueprint + cosmetics | Blueprint navigates unlocked rooms; storyline still free |

---

## Explicit non-goals (this plan)

- Do not rewrite React modals into Pixi.
- Do not add a second continuous WebGL/Three viewport over the studio.
- Do not soft-gate story, eras, or campaign acts behind purchases.
