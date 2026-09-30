# PixiJS Presentation Audit

**Date:** 2026-09-29  
**Scope:** Read-only audit of the living isometric studio and related Pixi/canvas surfaces.  
**Primary sources:** `src/components/WebGLCanvas.tsx`, `src/components/StudioRoom.tsx`, `src/components/PixiProjectCardsBridge.tsx`, `src/pixi-ui/*`, `src/features/boxDrops/fx/PixiParticleBurst.tsx`, `src/lib/motion/qualification.ts`.

Cross-links: [pixijs-migration-plan.md](./pixijs-migration-plan.md), [visual_studio_plan.md](./visual_studio_plan.md), [UI_UX_OVERHAUL_CONSIDERATIONS.md](./UI_UX_OVERHAUL_CONSIDERATIONS.md), [ux-visual-iterative-plan.md](./ux-visual-iterative-plan.md), [multi-room-blueprints.md](./multi-room-blueprints.md).

---

## 1. Renderers in play

| Surface | Tech | Role | Mount path |
|--------|------|------|------------|
| Living studio floor | **PixiJS v8 `Application`** (WebGL) | Continuous diegetic home screen | `StudioRoom` → `WebGLCanvas` |
| React HUD chrome | DOM / Tailwind | Labels, enquiry chip, chore badges, camera reset, gamepad hints, inspectors | `StudioRoom.tsx` overlays |
| Project cards (legacy) | Separate Pixi `Application` | Card strip UI (Graphics + Sprite textures) | `PixiProjectCardsBridge` + `src/pixi-ui/*` |
| Box-drop FX | **Canvas 2D** (not Pixi despite the name) | One-shot particle bursts | `PixiParticleBurst.tsx` |
| Motion qualification | DOM overlay + registry | Perf / WebGL exclusivity audit | `qualification.ts` + `PerformanceOverlay` |

**Invariant (code):** `src/lib/motion/qualification.ts` requires a single continuous GPU owner — the Pixi living studio. Secondary continuous WebGL is disqualified (`SecondaryWebGLStudio`). Approved canvases must be tagged `id="pixi-studio-canvas"`, `data-engine="pixi"`, or `data-approved-webgl="true"`.

**Status (2026-09-29 polish):** `WebGLCanvas` now tags the living studio canvas with `id="pixi-studio-canvas"` and `data-engine="pixi"`. Booth mic draws behind glass; left-wall door + foreshortened clock + half-tile prop snaps landed.

---

## 2. Layer stack (iso room)

Built in `buildScene()` inside `WebGLCanvas.tsx`. Two roots on `app.stage`:

1. **`root`** — world space (pan/zoom applied)  
2. **`overlayRoot`** — screen space (`eventMode = 'none'`, not panned)

### World (`root`) draw order (add order; then `sortableChildren = true` for staff)

| Order | Layer | Implementation |
|------:|-------|----------------|
| 1 | Back walls + acoustic panels | Procedural `Graphics` |
| 2 | Window | `Graphics` |
| 3 | Charts TV + EQ bars | `Container` + `Graphics` + hotspot |
| 4 | Wall clock + hand | `Container` + `Graphics` + hotspot |
| 5 | Floor tiles + rug | Checkerboard `isoQuad` fills |
| 6 | Window spill / desk contact shadow | `Graphics` |
| 7 | Floor outline | `Graphics` stroke |
| 8 | Live room glass + mic | `liveWrap` + hotspot (`liveRoom`) |
| 9 | Gear shelf | Tier-extended shelf + colored gear blocks |
| 10 | Mixing console (+ VU, channels, outboard) | Large procedural desk |
| 11 | Studio phone | Desk-corner phone + ring pulse |
| 12 | Staff / artist figures | `Container`s with `zIndex = spot.y` |
| 13 | Tier furniture (2–5) | Plants, sofa, panels, neon, gold trim |
| 14 | Bloom | Additive `bloomLayer` + `dynamicBloomG` |

### Screen (`overlayRoot`)

| Order | Layer | Notes |
|------:|-------|-------|
| 1 | Era / day-night tint | Full-viewport rect; alpha animated ~90s cycle |
| 2 | Vignette | Concentric ellipse strokes; settings: `analogTapeWarmth` |
| 3 | CRT scanlines | Horizontal 1px lines; settings: `crtScanlines` |

React overlays sit **above** the canvas in DOM (`StudioRoom`), including inspector, tier flash, and floating badges.

---

## 3. Cameras & fit

- **Fit-to-viewport:** hardcoded world bounds `{ minX: -196, maxX: 224, minY: -135, maxY: 215 }` with responsive insets (`topInset` 116/68, `bottomInset` 96/160). `fitScale = min(widthFit, heightFit, 2.4)`.
- **Camera state:** `{ x, y, zoom }` on `cameraRef`; applied as `root.scale = baseScale * zoom`, `root.position = basePosition + pan`.
- **Zoom range:** `0.75` … `2.6`. Focal zoom via wheel+ctrl, Safari gesture, two-finger pinch; pan via two-finger / wheel / gamepad RS.
- **Reset:** `resetCameraKey` prop, double-click, gamepad R3, and DOM “center camera” button in `StudioRoom`.
- **Rebuild triggers:** container `ResizeObserver`, structural key `staffOnFloor|ownedEquipment|eraId|roomTier`.

HUD chrome in `MainGameContent` clamps room height (`clamp(320px, 42vh, 500px)` desktop) — see [UI_UX_OVERHAUL_CONSIDERATIONS.md](./UI_UX_OVERHAUL_CONSIDERATIONS.md). Fit math inset for that strip, but short windowed viewports still starve the work panel below.

---

## 4. Assets vs procedural Graphics

**Studio floor is almost entirely procedural Pixi `Graphics` + `Text`.** No `Sprite` / texture atlas is loaded in `WebGLCanvas.tsx`. Palette constants (`COLORS`, `ERA_GRADES`) and tier console profiles drive look.

**Sprite / asset paths exist but are not wired into the living room:**

- `src/data/equipmentSprites.ts` / `equipmentArt.ts` — item PNG targets under `public/assets/items/`
- `src/features/sprites/*` — modular sprite / atlas pipeline (future)
- `src/pixi-ui/PixiProjectCard.ts` — uses `Sprite` + `Texture` / `Assets` for card chrome

**2026-09-30 update:** the gear shelf is now wired to a small optional dressing
layer (`src/components/studio/studioAssets.ts`) that resolves an owned
equipment id to `equipmentArt.ts`'s sprite path and swaps a shelf slot from a
procedural bar to a `Sprite` if (and only if) the texture actually loads.
Since no PNGs are committed under `public/assets/items/` yet, every slot
still renders the (now slightly more varied) procedural bar today — see
`assets/README.md` for why no new binary assets were added this pass (no
outbound network access) and how this layer lights up once real files land.

**`PixiParticleBurst`** uses Canvas 2D primitives (rect/circle/line), not Pixi particles — name is historical.

---

## 5. Hit targets / hotspots

| Pixi id (`StudioHotspotId`) | Visual | Interaction |
|----------------------------|--------|-------------|
| `console` | Mixing desk | Opens console focus (`onConsoleFocus`) — no inspector |
| `phone` | Desk phone | Bookings / enquiries when wired; else inspector |
| `liveRoom` | Glass + mic | Inspector / chores |
| `clock` | Wall clock | Inspector (day / challenges) |
| `tv` | Wall TV | Inspector (charts) |
| `shelf` | Gear shelf | Inspector / gear |

Hotspots: invisible filled `Graphics` hit areas (`alpha = 0`, `eventMode = 'static'`), hover glow tween, idle pulse hints on phone/console after 8s (`IDLE_HINT_DELAY_MS`). Gesture guard suppresses tap after two-finger pan.

### ID mismatch (gamepad / chores)

`StudioRoom.tsx` gamepad list uses **`liveroom`** and **`crt`**, while Pixi emits **`liveRoom`** and **`tv`**. Chore badge for live room calls `handleHotspot('liveRoom')` (correct Pixi id), but `STUDIO_HOTSPOTS` / `HOTSPOT_NAMES` use lowercase/aliases. Controllers focusing “CRT” or “Live Room” may not match emitted ids.

---

## 6. Performance hotspots

| Area | Risk | Notes |
|------|------|-------|
| Per-frame `Graphics.clear` + redraw | Medium | VU bars, TV bars, bloom redraw every accepted ticker frame |
| CRT scanline construction | Medium at rebuild | One `rect` per pitch row across full height; rebuilt on resize/structural rebuild |
| Scene rebuild | High when frequent | Full destroy/rebuild on resize & structural key — not incremental |
| Channel strip density | Low–medium | Tier-scaled knobs/faders as many small fills |
| Second Pixi app | High if mounted in-game | `PixiProjectCardsBridge` violates GPU exclusivity if used during studio play |
| Particle burst | Bounded | Canvas 2D one-shot; cancelled under reduced motion; ~1ms estimated in registry |
| FPS throttle | Mitigated | `shouldSkipFrame` + settings `targetFps`; ticker no-ops when `document.hidden` |
| Settings toggles | Mitigated | CRT / vignette / bloom visibility gated by `SettingsContext` |

Frame budget policy: UI motion ≤ 2.0 ms; Pixi owns the remainder (`UI_MOTION_FRAME_BUDGET_MS` in `qualification.ts`).

---

## 7. Known UX issues (screenshot / visual)

Observed from the original procedural layout; status as of `20cad80a` polish:

1. ~~**Mic z-order**~~ — **Fixed:** mic is authored before the isolation glass (deeper tile-Y) so it reads inside the booth.
2. ~~**Flat clock**~~ — **Fixed:** foreshortened ellipse + skew/scale on the left wall plane.
3. ~~**Missing door**~~ — **Fixed:** left-wall door between clock & TV with floor threshold (enter/exit anchor).
4. ~~**DEV overlay collision**~~ — **Fixed** (`5eaed315`): floating Spawn/Perf chrome defaults OFF; Settings → System opt-in only.
5. ~~**Hotspot alias drift**~~ — **Fixed** (2026-09-30 presentation-hardening pass): `StudioRoom.tsx`'s `STUDIO_HOTSPOTS`/`HOTSPOT_NAMES` now use the canonical `liveRoom`/`tv` spellings; regression check in `tests/pixi-presentation-hardening.check.ts`.
6. ~~**Canvas approval tagging**~~ — **Fixed:** living studio canvas tagged `id="pixi-studio-canvas"` + `data-engine="pixi"`.
7. ~~**Staff/furniture depth bands**~~ — **Fixed**: every top-level scene child now gets an explicit `zIndex` via a shared `Z` namespace (`Z.world`/`Z.depth`/`Z.fx` in `WebGLCanvas.tsx`) — `world` by add order, `depth + iso-Y` for staff and free-standing tier props, `fx` for lights/bloom/idle hints — so tier furniture (plant/sofa/rig) sorts correctly against staff instead of always painting behind them. Tier-3 sofa and road-case are split into separately zIndexed objects rather than sharing one Graphics block.
8. ~~**Second Pixi app**~~ — Verified still unused: `PixiProjectCardsBridge` is not imported anywhere in the app tree today; `tests/pixi-presentation-hardening.check.ts` now asserts this so a future PR can't silently reintroduce it.
9. ~~**World-anchored chore badges**~~ (P1 item, §6 below) — **Fixed**: `WebGLCanvas` reports hotspot screen anchors via an `onHotspotAnchors` callback (only firing when a hotspot's bounds actually move); `StudioRoom`'s console/live-room duty badges pin to them via an `anchorStyle()` helper, falling back to the earlier fixed-corner classes before the first anchor arrives (and on phone-width viewports).

---

## 8. `StudioRoom` presentation shell

- Derives `StudioSceneState` (activity, staff, equipment, day, era, tier) from `GameState`.
- Tier-up: flash overlay, screen shake, toast, `TierUpgradeAnimation`.
- Floating chore badges are DOM, not Pixi — can misalign when the canvas is panned/zoomed.
- Camera center control is DOM-only (does not move with world pan).

---

## 9. `src/pixi-ui/*` summary

Reusable Pixi UI kit (mostly Graphics/Text panels): `PixiButton`, `PixiLabel`, `PixiTextField`, `PixiGameHeader`, financial / market / relationship / staff / perks / artist panels, `PixiProjectCard` / `PixiAnimatedProjectCard` / `PixiProjectCardsContainer` (object pool + Ticker). Bridged by `PixiProjectCardsBridge` as a **second** application — treat as optional/legacy relative to the living studio exclusivity rule.

---

## 10. Audit verdict

The living studio is a solid procedural Pixi scene with era grades, tier furniture, post-FX, and solid input (touch/wheel/gamepad). Visual fidelity is Graphics-first; asset sprites are prepared but unused on the floor. Highest-impact polish: depth sorting (mic/glass), isometric wall props (clock), a readable door for room adjacency, HUD/DEV collision, hotspot id unification, and canvas approval tags — without introducing a second continuous WebGL surface.
