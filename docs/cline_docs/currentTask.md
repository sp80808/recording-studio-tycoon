# Current Task: New Minigame Implementation - Lyric Focus (Completed) & Phase 2 Enhancements

## Status: Lyric Focus Complete, Starting Phase 2 Enhancements (16/06/2025)

## Previously Completed
- [x] Staff Assignment UX Improvements (Completed 16/06/2025)
- [x] Store Interface Enhancement (Completed 16/06/2025)
- [x] Post-Update Review and Refinement (Completed 16/06/2025)

## Lyric Focus Minigame - COMPLETED ✅ (16/06/2025)

### Design & Documentation (Phase 1)
- [x] Brainstormed Lyric Focus minigame concept.
- [x] Created Minigame Design Document: `docs/minigames/LyricFocusGame.md`.
- [x] Updated `projectRoadmap.md` to include Lyric Focus game.

### Implementation (Phase 2)
- [x] Defined TypeScript interfaces for Lyric Focus game (`Keyword`, `Theme`, `LyricFocusGameState` in `src/types/miniGame.ts`).
- [x] Added `'lyricFocus'` to `MinigameType` in `src/types/miniGame.ts`.
- [x] Created data for keywords and themes in `src/data/lyricFocusData.ts`.
- [x] Developed the `LyricFocusGame.tsx` React component.
  - [x] UI for theme display, keyword selection, timer, score.
  - [x] Gameplay logic (keyword pool generation, selection handling, scoring).
- [x] Integrated with `MinigameManager.tsx`.
- [x] Added `minigameTriggerId: 'lyricFocus'` to relevant `ProjectStage` templates in `src/data/projectTemplates.ts`.
- [x] Updated `src/components/minigames/index.ts` to export the new game.
- [x] Updated `minigameTutorials` in `src/components/minigames/index.ts` with tutorial content for Lyric Focus.

### Post-Implementation (Phase 3)
- [ ] Test Lyric Focus minigame functionality thoroughly. (User task)
- [ ] Balance scoring and difficulty. (User task)
- [x] Updated `codebaseSummary.md` with details of the new minigame component and types.

## Current Focus: Phase 2 Enhancements (As per original prompt)

### 1. Dynamic Market Trends & Sub-Genre Evolution
- [x] Define `MarketTrend` Interface (genreId, subGenreId, popularity, trendDirection) - Verified in `src/types/charts.ts`
- [x] Define `SubGenre` structure and association with main Genres - Verified in `src/types/charts.ts`
- [x] Create `MarketService` (`src/services/marketService.ts`) - Initial structure and mock data created. (16/06/2025)
  - [-] Logic for periodic `MarketTrend` updates (time, player releases, global events) - Refined placeholder logic in `updateAllMarketTrends`. (16/06/2025)
  - [x] Methods to query current popularity for Genre/SubGenre combinations - Implemented. (16/06/2025)
- [x] Integration with Projects & Charts (16/06/2025)
  - [x] Modify Appeal/ChartScore of `OriginalMusicProject` releases based on trends - Implemented in `src/utils/bandUtils.ts` (`calculateReviewScore`).
  - [x] Influence `ContractProject` value based on trends - Implemented in `src/utils/projectUtils.ts` (`generateNewProjects` payout calculation).
- [x] Conceptualize UI Feedback (e.g., "Music Industry Report" component, `useMarketTrends` hook). - Initial `MusicIndustryReport.tsx` component created. `useMarketTrends` hook needs review/integration. (16/06/2025)

### 2. Reputation & Relationship Management (Clients/Artists/Labels)
- [x] Define `Client` / `RecordLabel` Interfaces (id, name, relationshipScore, preferredGenres/Moods) - Created in `src/types/relationships.ts`. (16/06/2025)
- [x] Create `RelationshipService` (`src/services/relationshipService.ts`) - Initial structure created. (16/06/2025)
  - [x] Manage `relationshipScore` for all Client and RecordLabel entities - Basic storage and retrieval in place. (16/06/2025)
  - [x] Methods for `increaseRelationship(entityId, amount, reason)` and `decreaseRelationship(entityId, amount, reason)` - Implemented. (16/06/2025)
  - [x] Logic to trigger these updates based on Project completion (quality, timeliness) - Integrated into `useGameState.ts` via `relationshipService.handleProjectCompletion`. (16/06/2025)
  - [x] Logic for `OriginalMusicProject` success (if label involved) refined in `relationshipService.ts`. (16/06/2025)
  - [x] Placeholder logic for player-initiated "favors" added to `relationshipService.ts`. (16/06/2025)
- [x] Tiered Contract Generation (Initial implementation for payout/rep modification and entity sourcing)
  - [x] Modify `ContractGenerationService` (i.e., `generateNewProjects` in `src/utils/projectUtils.ts`) to simulate influence of relationshipScore on contract value/rep for certain client types. (16/06/2025)
  - [x] `generateNewProjects` in `src/utils/projectUtils.ts` updated to accept `GameState` and use `clients` & `recordLabels` for basic provider selection. `GameState` type in `src/types/game.ts` updated. (16/06/2025)
  - [-] Further refine to source projects from specific entities based on relationship (More sophisticated selection logic is a TODO).
- [x] Consequences of Low Relationship (blacklisting, negative PR events)
  - [x] Conceptualized blacklisting and PR event mechanics.
  - [x] Added `isBlacklisted` to `RelationshipStats` and `PREvent` types to `src/types/relationships.ts`. (16/06/2025)
  - [x] Added `activePREvents` to `GameState` in `src/types/game.ts`. (16/06/2025)
  - [x] Added `checkAndApplyBlacklisting` and placeholder `triggerPREvent` to `relationshipService.ts`. (16/06/2025)

### 3. Studio Perks & Specializations
- [x] Define `StudioPerk` Interface (id, name, description, category, unlockConditions, effects) - Created in `src/types/studioPerks.ts`. (16/06/2025)
- [x] Create `StudioUpgradeService` (`src/services/studioUpgradeService.ts`) - Initial structure created. (16/06/2025)
  - [x] Manage available and unlocked perks - Basic logic for `getAvailablePerks`, `canUnlockPerk`, `unlockPerk`, `getOwnedPerks` implemented. (16/06/2025)
  - [x] Logic for applying perk effects to game state - `applyAllPerkEffects` in `studioUpgradeService.ts` reviewed and `AggregatedPerkModifiers` in `src/types/game.ts` updated for clarity. Integration with other game systems is ongoing. (16/06/2025)
  - [x] UI for perk tree/list (conceptual) - Documented in `docs/cline_docs/perkSystemUI.md`. (16/06/2025)

## Next Steps
1.  **Implement UI for Perk System**: Based on `docs/cline_docs/perkSystemUI.md`.
2.  **Integrate Perk Effects**: Ensure modifiers from `aggregatedPerkModifiers` are used by relevant game systems (e.g., project payout, quality calculations, staff training).
3.  **Refine Tiered Contract Generation**: Implement more sophisticated logic for selecting contract providers in `generateNewProjects` based on relationship scores, genre preferences, and entity profiles.
4.  **Develop PR Event System**: Flesh out `triggerPREvent` in `RelationshipService`, define `PREvent` templates, and integrate PR event display and effects into the game.
5.  **Flesh out Player-Initiated Favors**: Design specific favor types, their costs/benefits, and UI for interaction.
6.  **Band/Song Creation Features**: Begin work on player band creation, song development, and chart integration as per `tasks/tasks_plan.md`.
7.  **Save System**: Prioritize implementation of a robust save/load system as per `projectRoadmap.md`.
8.  Test and balance all newly implemented Phase 2 features.
>>>>>>> REPLACE
