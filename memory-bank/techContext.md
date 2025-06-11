# Tech Context: Recording Studio Tycoon

**Version:** 0.1
**Date:** 2025-06-11
**Related Document:** `projectbrief.md`, `systemPatterns.md`

## 1. Core Technologies (Confirmed & Anticipated)

*   **Programming Language:** TypeScript (based on `.tsx` files and `tsconfig.json` in the provided file list).
*   **UI Framework/Library:** React (based on `App.tsx`, `*.tsx` component files, and common React patterns like hooks `useGameState`, `useGameLogic`).
*   **Build Tool/Bundler:** Vite (based on `vite.config.ts` and `index.html` structure).
*   **Package Manager:** npm (implied by `package-lock.json`) or Bun (implied by `bun.lockb`). The presence of both suggests a potential transition or dual usage, but `bun.lockb` is often more definitive if present and newer. For now, assume Bun might be primary for local dev, npm for broader compatibility or CI.
*   **Styling:**
    *   Tailwind CSS (based on `tailwind.config.ts`, `postcss.config.js`, `index.css` likely importing Tailwind base styles).
    *   Plain CSS/CSS Modules (possible for component-specific styles, `App.css` exists).
*   **Linting/Formatting:** ESLint (based on `eslint.config.js`), Prettier (often used with ESLint, though not explicitly listed, auto-formatting is mentioned as a general concern).
*   **State Management:** Custom React hooks (`useGameState`, `useGameLogic`) and Context API (`SaveSystemContext`, `SettingsContext`) appear to be the primary methods. No external state management library like Redux or Zustand is immediately obvious from the file list.

## 2. Development Setup & Workflow

*   **Local Development Server:** `vite` likely provides this (e.g., `npm run dev` or `bun run dev`).
*   **Build Process:** `vite build` (e.g., `npm run build` or `bun run build`).
*   **Version Control:** Git (implied by `.gitignore`).
*   **IDE/Editor:** VSCode is implied by the environment details.

## 3. Technical Constraints & Considerations

*   **Browser Compatibility:** Target modern browsers. Specifics to be defined if not already.
*   **Performance:**
    *   Efficient state updates in React to prevent unnecessary re-renders, especially with animations and frequent game state changes.
    *   Optimizing animations (CSS transitions/animations preferred for simple tasks, `requestAnimationFrame` for complex JS animations).
    *   Bundle size (Vite helps, but keep an eye on large dependencies).
*   **Maintainability:**
    *   Adherence to existing coding patterns and `DEVELOPMENT_STANDARDS.md` (if it exists and is relevant).
    *   Clear separation of concerns (UI, game logic, data).
    *   Well-commented code, especially for complex logic.
*   **Accessibility (a11y):** While not explicitly requested for this task, good to keep in mind for UI elements. Emoji use needs careful consideration for screen reader users if not purely decorative.

## 4. Key Dependencies (Inferred from file list & common practices)

*   `react`, `react-dom`
*   `tailwindcss`
*   `typescript`
*   `vite`
*   Potentially UI component libraries (e.g., `components/ui/` suggests custom or shadcn-like components).
*   Audio handling utilities (e.g., `src/utils/audioSystem.ts`, `src/utils/soundUtils.ts`).

## 5. Tool Usage Patterns

*   **File Structure:** The project follows a typical `src/` structure with subdirectories for `components`, `contexts`, `data`, `hooks`, `lib`, `pages`, `types`, `utils`.
*   **Data Management:** Game data (artists, equipment) is stored in TypeScript files within `src/data/`.
*   **Type Safety:** TypeScript is used throughout, implying a focus on type safety. `src/types/` directory centralizes type definitions.
*   **Custom Hooks:** Extensive use of custom hooks for encapsulating logic (`useGameLogic`, `usePlayerProgression`, etc.).
*   **Context API:** Used for global state/functions like save system and settings.

## 6. Notes on Existing Codebase (Preliminary based on file names)

*   The game already has systems for eras, equipment, artists, projects, and staff.
*   There's a `MinigameManager` and specific minigames like `GearMaintenanceGame`.
*   UI components are well-organized.
*   Utility functions are separated into `src/utils/`.
*   The presence of `docs/` with many markdown files suggests a commitment to documentation, which is good. The GitHub link provided in the task points to `docs` specifically.
