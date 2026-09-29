# Tech Stack

This document outlines the core technologies and dependencies powering Recording Studio Tycoon (v0.4.0).

---

## 💻 Core Technologies

*   **Programming Language:** TypeScript 5.x
*   **Frontend Framework:** React 19 (`react`, `react-dom`)
*   **Build Tool & Dev Server:** Vite 5.x with Hot Module Replacement
*   **Package Manager:** pnpm 12.x (enforced via `packageManager` and `devEngines`)

---

## 🎨 Graphics, Animation & UI

*   **2D Isometric Canvas:** PixiJS 8 (`pixi.js`, `@pixi/react`)
*   **Animation & Motion:** Framer Motion 12 (`framer-motion`, `motion-dom`)
*   **Component Primitives:** Radix UI (`@radix-ui/*`), shadcn/ui components
*   **Styling:** Tailwind CSS 3.x with `tailwind-merge`, `clsx`, and custom CSS modules
*   **Particle Effects:** `canvas-confetti`
*   **Icons:** Lucide React (`lucide-react`)

---

## 🔊 Audio & Music Synthesis

*   **Polyphonic Synthesis:** Tone.js 15 (`tone`) for genre-specific chords and dynamic synthesis
*   **Audio Core:** Web Audio API (`standardized-audio-context`)
*   **Tactile SFX:** Authentic Kenney tactile mechanical switch clicks and fader slides
*   **Audio Unlock:** Custom user-gesture unlocking listener wired to global state

---

## 🎮 Input & Hardware Navigation

*   **Gamepad API:** Native W3C Gamepad API with 60fps polling loop
*   **Gamepad Service:** Custom `gamepadService.ts` with controller layout detection (Xbox, PlayStation, Nintendo Switch, Steam Deck)
*   **Haptic Actuator:** Rumble feedback support on supported controllers
*   **Spatial UI Navigation:** `GamepadNavContext.tsx` and `RadialActionWheel.tsx`

---

## 📊 State Management & Data

*   **Server State & Querying:** TanStack React Query (`@tanstack/react-query`)
*   **Form Validation:** React Hook Form (`react-hook-form`) + Zod (`zod`)
*   **Local State:** React Hooks & Contexts (`useGameState`, `useGameLogic`, `GamepadNavContext`)
*   **Simulation Determinism:** Seeded Mulberry32 pseudo-random number generator (`seededRandom.ts`)

---

## 🧪 Testing & Quality Assurance

*   **Automation Runner:** esbuild node test runner (`scripts/run-checks.sh`)
*   **End-to-End Testing:** Playwright Chromium runner
*   **Task & Issue Tracking:** Beads (`.beads/`) local-first issue tracker