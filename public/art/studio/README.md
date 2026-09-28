# Recording Studio Tycoon — Isometric Studio Sprite Pack v1

A first production-oriented art pass for the studio-floor scene, based on the current dark/warm UI direction.

## Goals

- Replace placeholder-like geometric props with clearer, more characterful silhouettes.
- Keep the low-detail tycoon readability of the current scene while making the art feel deliberate rather than temporary.
- Use a consistent 3/4-isometric language, dark outline, warm wood, cool equipment slate, blue screens and amber status lights.
- Keep assets as SVG symbols so they stay crisp at desktop and mobile zoom levels and remain cheap to recolour per era.

## Included sprites

Characters: producer/engineer, artist.

Core gear: mixing console, nearfield monitor, DAW monitor, reel-to-reel, vintage microphone, outboard rack.

Furniture/decor: record shelf, floor lamp, studio chair, acoustic panel, sofa, potted plant, headphones.

## Usage

The sheet is served from `/art/studio/studio-sprites.svg`. Use the reusable React helper:

```tsx
import { StudioSprite } from '@/components/studio/StudioSprite';

<StudioSprite id="mixing-console" size={180} />
```

Or directly:

```html
<svg viewBox="0 0 256 256" width="180" height="180">
  <use href="/art/studio/studio-sprites.svg#mixing-console" />
</svg>
```

## Integration order

1. Console + monitors: highest visual leverage in the current studio scene.
2. Producer/artist characters: improves personality and scale immediately.
3. Reel-to-reel/mic/outboard: communicates recording-studio identity instead of generic office equipment.
4. Furniture/decor: use to reduce dead floor area and make upgrades visibly accumulate.

## Next art pass

Add 2–4 frame idle animations (VU flicker, reel spin, screen meters, head bob), era variants, and room-upgrade tiers. Keep anchors stable so upgraded sprites can swap without repositioning.
