# Engine audit and WebGPU (2026-09-30)

## Stack on main
- Pixi 8.21.0, one `Application` (studio floor) guarded by `pixiGuard` (single renderer invariant).
- `PixiProjectCardsBridge` still builds its own legacy `new Application({...})` but is excluded by the guard while the floor is mounted.
- Vite 5 with a `pixi` vendor chunk, React 19, Tone.js audio.
- `tsc --noEmit -p tsconfig.app.json`: 91 errors on main, none in WebGLCanvas or the renderer module (tsc cleanup owned by #104 round 2).

## Change
`src/lib/render/rendererChoice.ts` picks the Pixi backend. Default stays **WebGL**. WebGPU is opt-in with `?renderer=webgpu` or `localStorage['rst.renderer']='webgpu'`; `auto` uses WebGPU when `navigator.gpu.requestAdapter()` succeeds, else WebGL. Pixi falls back if WebGPU init fails. The canvas exposes `data-renderer` so tests can assert the backend.

## Measurements (headless Chromium, software rendering, so only indicative)
Studio floor after "Open the studio", 2s rAF sample, 1280x800, SwiftShader:

| mode | backend | fps |
|---|---|---|
| webgl | webgl | 4.5 |
| webgpu | webgpu | 34 |
| auto | webgpu | 28.5 |

Under WebGPU the console showed `Instance dropped in popErrorScope` and, in one run, a `createBuffer ... too large when mappedAtCreation` error. These are probably SwiftShader limits but are unverified on real GPUs, which is why WebGPU is not the default yet.

## Next steps
1. Try `?renderer=webgpu` on real hardware (Chrome desktop, Android) and compare frame times; flip the default to `auto` if visuals match.
2. NPC layer slowdown (29.5 fps at 6 NPCs, 18.3 at 12 under software WebGL, from #103): likely fill cost from overlapping layers. Candidates: bake NPC layers into one texture or atlas, reduce overdrawn alpha layers, cull offscreen sprites. Not yet profiled here.
3. Clear the tsc debt, then consider a fixed-timestep simulation loop and a versioned save schema.
