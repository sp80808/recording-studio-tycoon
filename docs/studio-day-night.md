# Studio day / night + window indication

**Status:** Wired to the wall clock (2026-10-01)  
**Code:** `src/components/studio/studioDecorConfig.ts` (math), `WebGLCanvas.tsx` (ticker), `studioDecor.ts` (shaft / practicals)

## What existed before

| Piece | Behaviour |
|-------|-----------|
| Wall clock | Hands from `day * 137 + t * 4` (12h face) |
| Night tint | Independent **90s sine** on era grade overlay |
| Window shaft / motes | `getDayness(t)` — same 90s sine, **not** clock-linked |
| Window pane | Static fill `0x8fbfe6` |
| HUD / `advanceDay` | `gameState.currentDay` via `StudioRoom` → `state.day` |

Clock and lighting disagreed; the window never showed day vs night.

## What ships now

One minute stream drives **hands + dayness + window sky + night tint + shaft/practicals**:

```
minutes = floor(currentDay * 137 + tSeconds * 4)
wall face  = minutes % 720          (12h)
lighting   = minutes % 1440         (24h)
```

`currentDay` only offsets the stream (so mornings differ after advance-day). It does **not** replace the session clock. HUD day label and `advanceDay` are unchanged.

### Phase map (24h)

| Phase | Clock | Minutes | Look |
|-------|-------|---------|------|
| morning | 05:00–10:00 | 300–600 | Warm sky, rising shaft |
| day | 10:00–17:00 | 600–1020 | Clear sky (`0x8fbfe6` at noon), full shaft |
| evening | 17:00–21:00 | 1020–1260 | Amber → violet sky, falling shaft |
| night | 21:00–05:00 | 1260–1440 ∪ 0–300 | Deep sky, dim shaft, stronger tint, brighter practicals |

**Dayness** is a smooth cosine peaked at noon (not a hard step). **Night tint alpha** = `0.03 + (1 - dayness) * 0.22`. Interior lamp pools scale up as dayness falls.

### Reduced motion

When reduce-motion is on: dayness freezes at `REDUCED_MOTION_DAYNESS` (0.88), window sky snaps to noon, motes stop drifting. Wall hands may still tick.

### Coordination

Drinks / candle-table and booth album-art agents share `WebGLCanvas` — this change only touches the window pane graphics, night-tint alpha, and `buildDecorLights` ambient argument. Avoid rebuilding those layers for unrelated props.

## Verification

```bash
./node_modules/.bin/esbuild tests/studio-day-night.check.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-studio-day-night.cjs --alias:@=./src
node /tmp/rst-studio-day-night.cjs
```

In-game: watch the right-wall window and room tint track the left-wall clock through a few minutes of real time; advance a day and confirm the face/lighting offset jumps without breaking the HUD day counter.
