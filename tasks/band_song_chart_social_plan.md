# Detailed Plan: Band & Song Creation, Chart Integration, and Social Network

This document outlines the plan for implementing player band creation, song creation and release mechanics, integrating player songs into the charts, developing chart progression/influence, and adding a "parody social network" with stats and eye candy.

## Existing System Overview (Relevant Components)

*   **Bands and Songs:**
    *   `src/types/bands.ts`: Defines `Band`, `BandRelease`, `SessionMusician`, and `OriginalTrackProject`. `Band` includes properties like `fame`, `notoriety`, `reputation`, `experience`, `fans`, `pastReleases`, and `isPlayerCreated`. `OriginalTrackProject` serves as the core structure for song projects, with `stages`, `accumulatedCPoints`, `accumulatedTPoints`, and `workSessionCount`.
    *   `src/types/charts.ts`: Defines `Song` (with `title`, `artist`, `genre`, `releaseDate`, `quality`, `hypeScore`, `playerProduced`), `ChartEntry`, `Chart`, `MusicGenre`, `Artist`, `MarketTrend`, and `ChartsGameState`.
    *   `src/utils/bandUtils.ts`: Contains `generateBandName`, `generateAIBand`, `generateSessionMusicians`, `calculateReviewScore`, `calculateTotalSales`, and `updateBandStats`. This file is crucial for band and song mechanics.
    *   `src/data/artistsData.ts`: Contains `Artist` data, which includes `popularity`, `reputation`, `socialMediaFollowers`.
    *   `src/data/projectTemplates.ts`: Defines `ProjectTemplate` and `StageTemplate`, used to generate `Project` instances. `OriginalTrackProject` is a type of `Project`.
    *   `src/utils/projectUtils.ts`: Contains `generateNewProjects`, which uses `projectTemplates` and `generateAIBand`.

*   **Charts and Market:**
    *   `src/services/marketService.ts`: Manages `MarketTrend` and `SubGenre` popularity, and updates trends based on player projects.
    *   `src/types/charts.ts`: `ChartsGameState` holds `availableCharts`, `contactedArtists`, `marketTrends`, `playerInfluence`, `industryReputation`, `discoveredArtists`, `completedCollaborations`, and `chartHistory`.

*   **Progression and Rewards:**
    *   `src/utils/progressionUtils.ts`: Handles player XP, leveling, attributes, and studio skills.
    *   `src/utils/rewardManager.ts`: Calculates and applies rewards from minigames and achievements.

*   **Social Network (Parody):**
    *   No explicit "social network" system or types currently exist. The `Artist` type in `src/types/charts.ts` has `socialMediaFollowers`, which can be a starting point.

## Inferences and Assumptions

*   **Player Band Creation:**
    *   Players will define band name and genre.
    *   Band members will initially be represented by a simplified structure or names, with deeper integration (skills, mood) as a future enhancement. Band members will gain experience and improve based on song releases and performances.
*   **Song Creation Mechanics:**
    *   `OriginalTrackProject` is suitable for song production.
    *   Song quality and hype will be determined by `baseQuality`, `assignedStaffSkills`, `popularity`, and potentially marketing efforts.
*   **Song Release and Chart Integration:**
    *   A completed `OriginalTrackProject` triggers a release.
    *   Initial buzz will be influenced by `hypeScore`, `Band` fame/reputation, and player marketing.
    *   Chart position will be determined by song quality, hype, band stats, market trends, player influence, and time on chart.
*   **"Parody Social Network":**
    *   "Stats" will include band followers, song likes/shares, trending topics, and news feeds.
    *   "Eye candy" will involve UI animations, popularity graphs, and dynamic feed content.
    *   It will directly impact song hype, band fame/reputation, and potentially unlock new opportunities.

## Detailed Plan

### Phase 1: Core Band & Song Mechanics

**Goal 1: Implement Player Band Creation**
*   **Description:** Allow players to create their own bands, defining basic attributes.
*   **Sub-tasks:**
    *   **1.1 UI for Band Creation:** Develop a modal or dedicated screen (`src/components/modals/BandCreationModal.tsx` can be enhanced) for players to input band name and select a genre.
    *   **1.2 Update `Band` Type:** Ensure `src/types/bands.ts` `Band` interface is robust enough for player-created bands (e.g., `isPlayerCreated: boolean`).
    *   **1.3 Band Initialization Logic:** Create a utility function (e.g., in `src/utils/bandUtils.ts`) to initialize a new player band with default stats, similar to `generateAIBand`.
    *   **1.4 Integrate into Game State:** Add a `playerBands: Band[]` array to `GameState` in `src/types/game.ts`.
    *   **1.5 Band Member Management (Initial):** For simplicity, initially, band members could be represented by a simple array of names or a basic `BandMember` interface. Deeper integration with `StaffMember` or `SessionMusician` can be a later enhancement.

**Goal 2: Implement Song Creation Mechanics**
*   **Description:** Allow players to initiate and manage the production of original songs for their bands.
*   **Sub-tasks:**
    *   **2.1 UI for Song Project Initiation:** Create a UI element (e.g., a button on the band management screen) to start a new `OriginalTrackProject` for a selected player band.
    *   **2.2 Project Template for Original Songs:** Create a new `ProjectTemplate` in `src/data/projectTemplates.ts` specifically for "Original Song Production" with predefined stages (e.g., Composition, Recording, Mixing, Mastering).
    *   **2.3 Adapt `Project` Creation:** Modify `generateNewProjects` or create a new function in `src/utils/projectUtils.ts` to generate `OriginalTrackProject` instances, linking them to the player's band.
    *   **2.4 Staff Assignment to Song Projects:** Ensure existing staff assignment mechanics can be used for `OriginalTrackProject` stages, contributing `creativity` and `technical` points.
    *   **2.5 Minigame Integration:** Ensure minigames can be triggered during song production stages, influencing `quality` and `hype`.

**Goal 3: Implement Song Release Mechanics**
*   **Description:** Allow players to release completed songs and simulate their initial impact.
*   **Sub-tasks:**
    *   **3.1 Release Trigger:** Implement logic to mark an `OriginalTrackProject` as "releasable" once all stages are completed.
    *   **3.2 Release UI:** Create a simple UI (e.g., a button on the completed project modal) to trigger a song release.
    *   **3.3 Song Finalization:** When released, finalize the `Song` object (from `src/types/charts.ts`) by calculating its final `quality` (based on `accumulatedCPoints`, `accumulatedTPoints`, staff skills, equipment, minigame performance) and initial `hypeScore`.
    *   **3.4 Store Released Songs:** Add a `releasedSongs: Song[]` array to `GameState` or a new `SongManager` service.
    *   **3.5 Initial Sales/Buzz Calculation:** Use `calculateTotalSales` from `src/utils/bandUtils.ts` (or a new function) to simulate initial sales/buzz based on song quality, band fame, and initial hype.

### Phase 2: Chart Integration & Social Network

**Goal 4: Integrate Player Songs into Charts**
*   **Description:** Player-released songs should appear and progress on the in-game music charts.
*   **Sub-tasks:**
    *   **4.1 Chart Update Logic:** Enhance `marketService.updateAllMarketTrends` or create a new `chartService` to include logic for updating song charts.
    *   **4.2 Player Song Chart Entry:** When a song is released, create a `ChartEntry` for it and add it to relevant `Chart` objects in `ChartsGameState`.
    *   **4.3 Chart Position Calculation:** Develop a robust algorithm for determining a song's chart position, considering:
        *   Song `quality` and `hypeScore`.
        *   Band `fame` and `reputation`.
        *   Current `MarketTrend` for the song's `genre` and `subGenre`.
        *   Player's `playerInfluence` and `industryReputation`.
        *   Time on chart (`weeksOnChart`).
        *   Random fluctuations.
    *   **4.4 Chart Movement:** Implement logic to calculate `ChartMovement` and `positionChange` for each song on the chart during daily/weekly updates.
    *   **4.5 UI for Charts Panel:** Enhance `src/components/ChartsPanel.tsx` to display player-created songs on the charts, including their position, movement, and relevant stats.

**Goal 5: Develop Chart Progression and Influence System**
*   **Description:** Allow player actions to influence chart dynamics and unlock new chart tiers.
*   **Sub-tasks:**
    *   **5.1 Player Influence Mechanics:** Define how player actions (e.g., successful releases, high-quality projects, marketing efforts) increase `playerInfluence` in `ChartsGameState`.
    *   **5.2 Unlocking New Charts:** Implement conditions (e.g., `playerInfluence` thresholds, specific milestones) to unlock new `ChartRegion`s (local, regional, national, international) as defined in `src/types/charts.ts`.
    *   **5.3 Dynamic Chart Behavior:** Ensure charts react to market trends, global events, and the success/failure of both player and AI-generated songs.

**Goal 6: Implement "Parody Social Network" with Stats and Eye Candy**
*   **Description:** Create a visual and interactive social media feed that reflects in-game events and influences game mechanics.
*   **Sub-tasks:**
    *   **6.1 Social Network Data Structure:** Define new types (e.g., `SocialPost`, `SocialFeedEntry`) to represent social media activity.
    *   **6.2 Event-Driven Posts:** Integrate game events (song releases, chart movements, band performances, studio upgrades) to automatically generate social media posts.
    *   **6.3 "Stats" Display:**
        *   Display band followers (from `Band.fans`).
        *   Display song likes/shares (new property on `Song` or `BandRelease`).
        *   Implement trending topics based on genre popularity or recent successful releases.
        *   Show "news" about player and AI artists.
    *   **6.4 "Eye Candy" Visualizations:**
        *   Animated notifications for new followers/likes.
        *   Simple graphs showing band fame/fan growth over time.
        *   Visual cues for trending genres.
    *   **6.5 Player Interaction (Initial):** Allow basic player interaction, such as "promoting" a song (which could consume money and boost hype).
    *   **6.6 Influence on Game Mechanics:** Ensure social network activity directly impacts `hypeScore`, `Band.fame`, `Band.reputation`, and potentially `Artist` demand levels.

## Architecture Diagram (High-Level)

```mermaid
graph TD
    A[Player Actions] --> B(UI Components)
    B --> C{Game Logic & State Management}
    C --> D[Band Management System]
    C --> E[Song Production System]
    C --> F[Chart & Market System]
    C --> G[Social Network System]
    D --> H[Band Data (src/types/bands.ts)]
    E --> I[Project Data (src/types/game.ts, src/data/projectTemplates.ts)]
    E --> J[Minigame System]
    F --> K[Chart Data (src/types/charts.ts)]
    F --> L[Market Service (src/services/marketService.ts)]
    G --> M[Social Network Data (New Types)]
    G --> N[Artist Data (src/data/artistsData.ts)]
    H --> F
    I --> F
    J --> E
    K --> B
    L --> F
    N --> G
    F --> G
    D --> E
```

## Dependencies and Interactions:

*   **Band Management System:**
    *   Depends on `Band` types, `bandUtils`, `GameState`.
    *   Interacts with `Song Production System` to initiate new song projects.
    *   Influences `Chart & Market System` (band fame/reputation affects song chart performance).
    *   Influences `Social Network System` (band activity generates social posts).
*   **Song Production System:**
    *   Depends on `OriginalTrackProject` types, `Project` types, `projectTemplates`, `staffUtils`, `minigameUtils`.
    *   Interacts with `Staff Management System` (staff assignment).
    *   Interacts with `Minigame System` (minigame triggers during stages).
    *   Outputs completed `Song` objects to `Chart & Market System`.
*   **Chart & Market System:**
    *   Depends on `Song`, `Chart`, `MarketTrend` types, `marketService`.
    *   Receives `Song` data from `Song Production System`.
    *   Influences `Band Management System` (chart success boosts band fame/reputation).
    *   Provides data to `Social Network System` (chart movements, trending genres).
*   **Social Network System:**
    *   Depends on new social network types, `Artist` data.
    *   Receives input from `Band Management System` (player band activity), `Song Production System` (song releases), `Chart & Market System` (chart updates).
    *   Influences `Song Production System` (hype), `Band Management System` (fame/reputation).

## Trade-offs:

*   **Complexity vs. Detail:** The plan aims for a detailed implementation but will prioritize core functionality first. Some deeper integrations (e.g., individual band member skills, complex social network interactions) will be considered future enhancements to manage scope.
