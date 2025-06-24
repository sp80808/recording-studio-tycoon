# Current Task: Implement Project Lifecycle Logic

## Objective
Wire up the project lifecycle to the UI, enabling players to start, progress, and complete projects. This task marks the beginning of Phase 2 and corresponds to the "Implement project lifecycle logic" item in `projectRoadmap.md`.

## Context
With the UI migrated to PIXI.js, the next step is to implement the core gameplay loop. The current implementation uses mock data and simple intervals to animate project cards. This task will replace that with a proper game mechanic.

## Next Steps
1.  **Create `ProjectService.ts`:** Develop a new service to manage the state of all active projects. This service will handle starting new projects, processing work, and completing them.
2.  **Integrate into `WebGLCanvas.tsx`:** Replace the mock project data and animation interval with the new `ProjectService`. The service will be the single source of truth for project state.
3.  **Update Game State:** When a project is completed, the service will update the `GameState` with the results, including money and reputation gains, and generate a `ProjectReport`.
4.  **Reflect Changes in UI:** Ensure that the `PixiProjectCardsContainer` and `PixiFinancialsPanel` update to reflect the changes in the game state.
