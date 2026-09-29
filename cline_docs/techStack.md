# Tech Stack (cline_docs)

Comprehensive technical stack and architecture for Recording Studio Tycoon (v0.4.0).

---

## Architecture & Frameworks

| Domain | Technology | Notes |
| :--- | :--- | :--- |
| **Language** | TypeScript 5.x | Strict mode enabled |
| **UI Framework** | React 19 | Hooks, Context, Concurrent rendering |
| **Build & Bundler** | Vite 5.x | Fast HMR, Rollup production bundles |
| **Package Manager** | pnpm 12.x | Strict dependency isolation, `devEngines` |
| **2D Engine** | PixiJS 8 | True isometric canvas, procedural room, tier desks |
| **Audio Synthesis** | Tone.js 15 | Polyphonic genre chords, transport automation |
| **Audio Effects** | Kenney UI SFX | Authentic mechanical clicks & fader slides |
| **Juice & Particles** | Canvas Confetti | Hit song and milestone celebrations |
| **Animation** | Framer Motion 12 | Smooth layout springs and modal transitions |
| **Controller Input** | W3C Gamepad API | 60fps polling, SVG glyphs, spatial focus |
| **Issue Tracking** | Beads (`.beads/`) | Distributed local-first Dolt tracker |

---

## Key Dependency Modules

- `tone`: Web Audio synthesis framework
- `pixi.js` & `@pixi/react`: WebGL/WebGPU 2D rendering
- `canvas-confetti`: Particle confetti effects
- `lucide-react`: Modern SVG icon library
- `clsx` & `tailwind-merge`: Dynamic utility class composition
- `zod`: Schema declaration and validation
