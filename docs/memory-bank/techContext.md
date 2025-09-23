# Tech Context: Recording Studio Tycoon

**Version:** 0.3
**Date:** 2025-06-11
**Related Document:** `projectbrief.md`, `systemPatterns.md`, `MULTI_PROJECT_AUTOMATION_PLAN.md`

## 1. Core Technologies (Confirmed & Anticipated)

*   **Programming Language:** TypeScript.
*   **UI Framework/Library:** React.
*   **Build Tool/Bundler:** Vite.
*   **Package Manager:** Bun is likely primary for local development, with npm for broader compatibility or CI (inferred from `bun.lockb` and `package-lock.json`).
*   **Styling:**
    *   Tailwind CSS.
    *   Plain CSS/CSS Modules for component-specific styles.
*   **Linting/Formatting:** ESLint, Prettier (inferred).
*   **Audio System:** Dual audio architecture combining Web Audio API (code-generated sounds) with HTML5 Audio (file-based sounds)
*   **State Management:** Currently custom React hooks (`useGameState`, `useGameLogic`) and Context API. Enhanced work progression system with stage-specific focus allocation and real-time effectiveness scoring integrated.

## 2. Development Setup & Workflow

*   **Local Development Server:** `vite` (e.g., `bun run dev`).
*   **Build Process:** `vite build` (e.g., `bun run build`).
*   **Version Control:** Git.
*   **IDE/Editor:** VSCode.

## 3. Technical Constraints & Considerations

*   **Browser Compatibility:** Target modern browsers.
*   **Performance:**
    *   **State Updates:** Highly efficient state updates are critical with `EnhancedGameState` and multiple concurrent projects. Batching updates, minimizing re-renders (e.g., with `React.memo`, `useCallback`, `useMemo`), and potentially offloading heavy computations from the main thread will be essential.
    *   **Animation:** Optimizing animations for the multi-project dashboard and staff activity indicators. Prefer CSS animations for simple transitions; use `requestAnimationFrame` and a dedicated animation controller (as planned in `ProjectAnimationController.ts`) for complex, synchronized, or game-logic-tied animations. Ensure these do not cause layout thrashing or jank.
    *   **Bundle Size:** Continue monitoring with Vite.
    *   **Automated Work Cycles:** The `StaffAutomationEngine` will process work for multiple projects. This processing must be highly optimized to prevent slowdowns in the game loop, especially as the number of concurrent projects and active staff increases. Consider techniques like time-slicing or ensuring calculations are lightweight.
*   **Maintainability:**
    *   Adherence to `DEVELOPMENT_STANDARDS.md`.
    *   Clear separation of concerns, especially between UI, core game logic (`useGameLogic`), multi-project management (`ProjectManagerService`), and staff automation (`StaffAutomationEngine`).
    *   Well-commented code, particularly for the complex logic within the automation engine and state management.
*   **Accessibility (a11y):** Maintain focus for UI elements, especially with dynamic updates in the multi-project dashboard.

## 4. Key Dependencies (Inferred & Potential)

*   `react`, `react-dom`
*   `tailwindcss`
*   `typescript`
*   `vite`
*   Potentially UI component libraries (e.g., `components/ui/`).
*   Audio handling utilities.
*   **Potential for State Management Libraries:** If custom hooks/context become insufficient, libraries like Zustand or Jotai might be introduced. This would be a significant architectural decision.
*   **Potential for Animation Libraries:** For more complex animation sequences or physics-based effects, libraries like Framer Motion or React Spring could be considered, though the current plan seems to favor custom solutions.

## 5. Tool Usage Patterns

*   **File Structure:** Continues with `src/` structure. New major systems like `ProjectManagerService.ts`, `StaffAutomationEngine.ts`, and `ProjectAnimationController.ts` will likely reside in `src/services/` or `src/systems/`. New UI components like `MultiProjectDashboard.tsx` and `ProjectCard.tsx` will be in `src/components/`.
*   **Data Management:** Game data in `src/data/`. The core game state will be managed via `useGameState` but will now conform to the `EnhancedGameState` structure.
*   **Type Safety:** TypeScript usage remains critical, especially for defining the complex interactions within the multi-project and automation systems.
*   **Custom Hooks:** Will continue to be used for encapsulating UI logic and interacting with core services/systems. New hooks like `useMultiProjectManagement.tsx` (as seen in open tabs) will emerge.
*   **Context API:** May continue for global settings, but its role in managing complex game state needs careful consideration alongside custom hooks or dedicated state libraries.
*   **Services/Controllers:** The introduction of dedicated services/controllers (`ProjectManagerService`, `StaffAutomationEngine`, `ProjectAnimationController`) signifies a shift towards more structured backend logic, even within the client-side application.

## 6. Notes on Existing Codebase (and Evolution)

*   The game has foundational systems for single projects, eras, equipment, artists, and staff.
*   The `MULTI_PROJECT_AUTOMATION_PLAN.md` outlines a significant evolution from a single active project to managing multiple concurrent projects with automated staff. This will involve refactoring existing project management logic (currently in `useProjectManagement.tsx`, `useStageWork.tsx`) to work with project IDs and support concurrency.
*   The animation system will be expanded from simple UI effects to providing detailed feedback for automated processes.
*   The introduction of `ProjectManagerService.ts` (seen in open tabs) indicates that work on the multi-project infrastructure may have already begun or is being actively planned at a code level.
