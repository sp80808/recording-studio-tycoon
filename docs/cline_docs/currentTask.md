# Current Task: New Minigame Implementation - Lyric Focus

## Status: In Progress (16/06/2025)

## Previously Completed
- [x] Staff Assignment UX Improvements (Completed 16/06/2025)
- [x] Store Interface Enhancement (Completed 16/06/2025)
- [x] Post-Update Review and Refinement (Completed 16/06/2025)

## Current Focus: Lyric Focus Minigame

### Design & Documentation (Phase 1)
- [x] Brainstormed Lyric Focus minigame concept.
- [x] Created Minigame Design Document: `docs/minigames/LyricFocusGame.md`.
- [x] Updated `projectRoadmap.md` to include Lyric Focus game.

### Implementation (Phase 2)
- [ ] Define TypeScript interfaces for Lyric Focus game (`Keyword`, `Theme`, `LyricFocusGameState` in `src/types/miniGame.ts`).
- [ ] Add `'lyricFocus'` to `MinigameType` in `src/types/miniGame.ts`.
- [ ] Create data for keywords and themes (e.g., in `src/data/minigameData.ts` or a new file).
- [ ] Develop the `LyricFocusGame.tsx` React component.
  - [ ] UI for theme display, keyword selection, timer, score.
  - [ ] Gameplay logic (keyword pool generation, selection handling, scoring).
- [ ] Integrate with `MinigameManager.tsx`.
- [ ] Add `minigameTriggerId: 'lyricFocus'` to relevant `ProjectStage` templates in `src/data/projectTemplates.ts`.
- [ ] Update `src/components/minigames/index.ts` to export the new game.
- [ ] Update `minigameTutorials` in `src/components/minigames/index.ts` with tutorial content for Lyric Focus.

### Post-Implementation (Phase 3)
- [ ] Test Lyric Focus minigame functionality thoroughly.
- [ ] Balance scoring and difficulty.
- [ ] Update `codebaseSummary.md` with details of the new minigame component and types.

## Next Steps
1. Define TypeScript interfaces for the Lyric Focus game.
2. Add new `MinigameType`.
3. Create initial data for keywords and themes.
