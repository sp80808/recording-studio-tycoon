# Blender sprite pipeline

Low-poly isometric art for the studio scene, rendered headless from Blender (tested on 5.2) into
`public/assets/studio`. Everything is authored in game tile coordinates and rendered with the
scene's 2:1 projection, so a sprite lands on `iso(x, y)` with no hand-tuning.

```bash
B=/Applications/Blender.app/Contents/MacOS/Blender
$B -b --python tools/blender/make_characters.py   # 144 tintable layers (18 layers x 4 facings x 2 poses)
$B -b --python tools/blender/make_console.py      # console_t1..t5.png + console.json anchors
$B -b --python tools/blender/make_booth.py        # booth_back.png / booth_front.png + booth.json
$B -b --python tools/blender/make_clock.py        # clock_face.png (hands stay live in Pixi)
```

Pass `-- <names>` to `make_characters.py` / `make_console.py` to re-render a subset.
`rst_iso.py` holds the shared camera, palette and helpers (`G()`, `box_g()`, ...). One game tile is one
Blender unit and renders at 2x (drawn at scale 0.5).

**Characters** are layers stacked bottom to top at one origin: skin, face, shoes, bottom, top, hair,
accessories. Tintable layers are rendered white so `sprite.tint` multiplies to the right shade. Each
layer above the skin is cut by the body (holdout), so any mix of styles composites correctly. Keep
hair above the shoulders. Add a style by building its geometry in `make_characters.py`, re-rendering,
and listing it in `src/components/studio/characters.ts`.

**Console** sprites bake the body, knobs, speakers, displays and rack. Fader caps and VU ladders are
Pixi overlays; `console.json` gives their positions in 1x pixels from the desk's floor centre.

`preview/*.html` are throwaway contact sheets: serve the repo root (`python3 -m http.server`) and open them.
