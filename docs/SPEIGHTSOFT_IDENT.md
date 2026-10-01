# Speightsoft Studio Ident

A reusable startup ident for Speightsoft games.

## Intent

The mark is a continuous **signal/cable S**: part software trace, part audio cable, part game-system boot glyph. The animation assembles the signal, adds a brief chromatic registration offset, resolves the `SPEIGHTSOFT` wordmark, then clears quickly.

Target full-motion runtime: **~2.45 seconds**.

## Implementation

- `src/components/branding/SpeightsoftIdent.tsx`
- `src/components/branding/SpeightsoftIdent.css`
- `public/brand/speightsoft-mark.svg`

The RST integration mounts the game immediately and places the ident above it. That lets route/data/assets begin loading while the branding animation is playing instead of adding a blocking boot delay.

## Visual component lineage

The ident intentionally stays inside RST's approved visual stack:

- **Framer Motion 12** — finite SVG draw, opacity, scale, and exit transitions.
- **OriginKit-derived `TextScramble`** — wordmark decode.
- **OriginKit-derived `GlowSweep`** — one-shot optical sweep.
- Original Speightsoft SVG signal mark and layout.

No GSAP, Lottie, Three.js, Anime.js, secondary WebGL, or continuous canvas loop is added.

## Interaction + accessibility

- Pointer press anywhere on the intro skips it.
- `Escape`, `Enter`, or `Space` skips it.
- `prefers-reduced-motion` resolves the mark immediately and reduces the hold to <=900ms.
- If the document becomes hidden, the ident exits instead of continuing decorative motion.
- Scrambling text is aria-hidden; assistive tech receives a stable `Speightsoft` label.

## Reuse in other React games

Copy the branding component + CSS + SVG and provide equivalents for `TextScramble` / `GlowSweep`, or replace those two helpers with local CSS/text transitions. Keep the SVG signal mark unchanged for brand consistency.

The component accepts:

```tsx
<SpeightsoftIdent
  durationMs={2450}
  onComplete={() => {
    // optional hook
  }}
/>
```

For non-React builds, use `public/brand/speightsoft-mark.svg` as the canonical static mark and reproduce the same sequence in the target engine.
