# Multi-Room Blueprints

**Date:** 2026-09-29  
**Status:** Design blueprint (docs only — no runtime change in this drop).  
**Depends on:** living iso room in `WebGLCanvas.tsx`; booking/economy rooms in `src/utils/studioRoomUtils.ts` + `StudioRoom` type in `src/types/game.ts`.  
**Related:** [pixi-presentation-audit.md](./pixi-presentation-audit.md), [ux-visual-iterative-plan.md](./ux-visual-iterative-plan.md), [docs/superpowers/specs/2026-09-29-flight-case-monetisation-adr.md](./superpowers/specs/2026-09-29-flight-case-monetisation-adr.md).

---

## 1. Product rules

- **Storyline stays free.** Expanding rooms, entering doors, and map navigation never require payment.
- **Monetisation = optional cosmetics / skinned gear / vanity only** (rugs, neon skins, framed art, flight-case vanity). No paywalled adjacency, no paid room unlocks that gate narrative.
- Economy already sells operational suites (`vocal-suite`, `live-room`, `mix-suite`) with soft progression gates (level, expansion limit, funds). Visual multi-room should **mirror** that unlock state, not invent a second progression currency.

---

## 2. Current state (code)

| Layer | Today |
|-------|--------|
| Economy rooms | `createDefaultStudioRooms()` — Studio A + 3 purchasable suites (`studioRoomUtils.ts`) |
| Booking | `bookingRoomId` / `findAvailableStudioRoom` — concurrent capacity |
| Gear seating | Per-`roomId` slots (`equipmentSlots.ts`, `GearRackBoard.tsx`) |
| Visual floor | **One** procedural iso room in `WebGLCanvas` (tier 1–5 cosmetics on the same footprint) |
| Door / map | **None** in Pixi scene |

So: multi-room exists as **simulation + UI lists**, not as a navigable spatial facility yet.

---

## 3. Target UX: two scales

### A. Per-room isometric (detail)

Keep the current `TILE_W=56`, `TILE_H=28`, `ROOM_W×ROOM_D` style scene as the **detail camera** for the active room. Each `StudioRoomType` gets a **layout profile** (furniture presets + hotspot set), not a unique engine.

Suggested layout profiles:

| `StudioRoomType` | Footprint feel | Hotspot emphasis |
|------------------|----------------|------------------|
| `project-studio` | Current 8×7 control room | console, phone, shelf, tv, clock, live glass |
| `vocal-suite` | Narrower booth-forward | mic/booth, shelf, small desk, phone |
| `live-room` | Deeper floor, less desk | live floor, iso mics, amp wall, clock |
| `mix-suite` | Desk-heavy, dark | console++, outboard racks, monitors, tv |

### B. Facility blueprint (bird’s-eye / top-down)

When the player owns **more than one** unlocked room (or opens “Studio Map”), show a **schematic top-down** of the facility:

- Orthographic rectangles (or light isometric “chip” tiles) for rooms
- Corridor / lobby as connector cells
- Door glyphs on shared edges
- Active room highlighted; locked rooms silhouetted with unlock affordance (existing purchase rules)

Blueprint is **navigation + fantasy**, not a second full sim. Clicking a room either:

1. Switches the iso detail scene’s layout profile + `roomId` context, or  
2. Opens the existing RightPanel / gear-rack room picker (short-term bridge).

---

## 4. Coordinate mapping: grid ↔ iso ↔ top-down

Reuse the existing helpers from `WebGLCanvas.tsx`:

```text
iso(x, y) = {
  x: (x - y) * (TILE_W / 2),
  y: (x + y) * (TILE_H / 2),
}
```

### Local room space

- Tile coords `(tx, ty)` in `[0, ROOM_W) × [0, ROOM_D)` are **local to a room**.
- World iso pixel = `iso(tx, ty)` then `* fitScale` + camera, as today.

### Facility space (blueprint)

Introduce integer **facility cells** `(fx, fy)` on a coarse grid (e.g. 1 cell ≈ one room module):

```text
RoomInstance {
  id: StudioRoom.id
  type: StudioRoomType
  origin: { fx, fy }      // top-left of room footprint on facility grid
  size:   { w, h }        // in facility cells (e.g. 2×2)
  doors:  DoorSpec[]      // edges shared with neighbors / corridor
}
```

**Mapping rules:**

1. **Top-down render:** draw room rect at `(fx * CELL, fy * CELL)` in blueprint Pixi/DOM layer (prefer **DOM/SVG or shared Pixi app** — never a second continuous WebGL).
2. **Iso detail:** ignore `fx,fy` while inside a room; only local `(tx,ty)` matter.
3. **Door anchor in iso:** place door prop at a fixed local edge (e.g. mid of `ty = ROOM_D` open side) so every layout profile has a stable “exit” hotspot `door`.
4. **Enter animation (future):** animate a character sprite from door local tile toward a stand point; facility map can show a token moving `fx,fy` → neighbor during travel (skippable).

Inverse (screen → tile), for completeness:

```text
// Given iso pixel (px, py) in room-local space before camera:
tx = (px / (TILE_W/2) + py / (TILE_H/2)) / 2
ty = (py / (TILE_H/2) - px / (TILE_W/2)) / 2
```

---

## 5. Room adjacency & doors

### Graph model

```text
FacilityGraph {
  nodes: RoomInstance[] | CorridorNode[]
  edges: { fromId, toId, doorId, fromEdge, toEdge }[]
}
```

- Default starter facility: `studio-a` only; door leads to **locked corridor stub** (visual tease) until another suite unlocks.
- On unlock of `vocal-suite` / `live-room` / `mix-suite`, attach predetermined `origin` slots from a **hand-authored blueprint template** (not procedural sprawl in v1).

### Door behaviour (phased)

| Phase | Behaviour |
|-------|-----------|
| 0 (now / P0 polish) | Draw door prop; tap opens inspector “Facility” or map sheet |
| 1 | Door switches active iso layout to adjacent unlocked room |
| 2 | Optional short walk / fade transition; clients/artists can path through doors into stands |

Doors are **hotspots**, not loading screens. Travel must respect `prefers-reduced-motion` (instant swap).

### Client enter fantasy

Later (P2): spawn client sprites at door → path to console/live marks. Non-blocking; never delays booking confirmation. Cosmetic skins may change client outfits; they must not alter quest/story availability.

---

## 6. Suggested facility template (v1)

```text
        [ Vocal Suite ]
              |
[ Mix Suite ]—[ Lobby ]—[ Studio A (start) ]
              |
        [ Live Room ]
```

- Lobby/corridor is non-bookable flavor (or later: waiting-room minigame — out of scope).
- Blueprint cells ~ equal size for readability; iso footprints may differ per type.

---

## 7. Data ownership

| Concern | Source of truth |
|---------|-----------------|
| Unlocked? | `GameState.studioRooms[].unlocked` |
| Booked? | Project `bookingRoomId` + occupancy helpers |
| Seated gear | Equipment slots by `roomId` |
| Visual layout | New `roomLayoutProfiles` config (proposed) keyed by `StudioRoomType` + tier |
| Cosmetics | Entitlements / vanity flags — overlay recolors only |

Avoid duplicating unlock flags inside Pixi.

---

## 8. Rendering constraints

From motion qualification (`qualification.ts`):

- **One** continuous Pixi WebGL owner (living studio / shared app).
- Blueprint map should be DOM/SVG **or** a mode swap inside the same Application (destroy/rebuild room vs map container) — not `PixiProjectCardsBridge`-style second app during play.
- Ephemeral FX stay Canvas 2D one-shots (`PixiParticleBurst`).

---

## 9. Implementation slices (docs → code later)

1. **Door prop + `door` hotspot** on current iso layout (visual only).  
2. **`roomLayoutProfiles`** data + switch by selected `roomId` without facility map.  
3. **Blueprint overlay** reading `getOperationalStudioRooms`.  
4. **Adjacency travel** + optional enter animation.  
5. **Cosmetic skins** for rugs/neon/door styles (paid optional).

---

## 10. Out of scope

- Free-form player-built floor plans in v1  
- Paywalled corridors or story acts  
- Full building sim (utilities, HVAC)  
- Separate Three.js building viewer  
