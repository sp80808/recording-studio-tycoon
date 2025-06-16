# Current Task: Phase 2 Enhancements - Dynamic Market & Reputation Systems

## Status: Starting Phase 2 (16/06/2025)

## Previously Completed (Staff Assignment & Post-Update Integration)
- [x] Staff Assignment UX Improvements (Completed 16/06/2025)
- [x] Store Interface Enhancement (Completed 16/06/2025)
- [x] Post-Update Review and Refinement (Completed 16/06/2025)
  - Verified Charts Panel System
  - Verified Equipment Detail System
  - Verified Advanced Animation System
  - Verified New Minigames (Effect Chain, Acoustic Treatment, Instrument Layering)
  - Updated relevant documentation

## Current Focus: Phase 2 Enhancements

### 1. Dynamic Market Trends & Sub-Genre Evolution
- [ ] Define `MarketTrend` Interface (genreId, subGenreId, popularity, trendDirection)
- [ ] Define `SubGenre` structure and association with main Genres
- [ ] Create `MarketService`
  - [ ] Logic for periodic `MarketTrend` updates (time, player releases, global events)
  - [ ] Methods to query current popularity for Genre/SubGenre
- [ ] Integration with Projects & Charts
  - [ ] Modify Appeal/ChartScore of `OriginalMusicProject` based on trends
  - [ ] Influence `ContractProject` value based on trends
- [ ] Conceptualize UI Feedback (e.g., "Music Industry Report" component, `useMarketTrends` hook)

### 2. Reputation & Relationship Management (Clients/Artists/Labels)
- [ ] Define `Client` / `RecordLabel` Interfaces (id, name, relationshipScore, preferredGenres/Moods)
- [ ] Create `RelationshipService`
  - [ ] Manage `relationshipScore` for entities
  - [ ] Methods for `increaseRelationship` / `decreaseRelationship`
  - [ ] Logic for updates based on project completion, success, favors
- [ ] Tiered Contract Generation
  - [ ] Modify `ContractGenerationService` to use relationships for contract offers
- [ ] Consequences of Low Relationship (blacklisting, negative PR)

### 3. Studio Perks & Specializations
- [ ] Define `StudioPerk` Interface (id, name, description, category, unlockConditions, effects)
- [ ] Create `StudioUpgradeService`
  - [ ] Manage available and unlocked perks
  - [ ] Logic for applying perk effects to game state
  - [ ] UI for perk tree/list (conceptual)

## Next Steps
1. Begin implementation of "Dynamic Market Trends & Sub-Genre Evolution".
2. Define necessary TypeScript interfaces and data structures.
3. Develop the `MarketService` for managing market dynamics.
4. Plan integration points with existing game systems.
