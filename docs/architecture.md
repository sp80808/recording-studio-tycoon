# System Architecture

## Overview
This document describes the high-level architecture of the Recording Studio Tycoon game, outlining its main components, their relationships, and the overall workflow.

## UI/UX Update: App Icon

- The app icon and manifest have been updated to use a music symbol emoji (🎵) for a more musical and modern look. This change is implemented using an inline SVG in the HTML, providing a consistent appearance across platforms without the need for generated icon files.

```mermaid
flowchart TD
    User[Player Interaction] --> UI[User Interface (React Components)]
    UI --> GameLogic[Game Logic (Hooks & Utilities)]
    GameLogic --> GameState[Game State Management (Zustand/Context)]
    GameLogic --> Data[Game Data (JSON/TS files)]
    GameLogic --> SaveSystem[Save System (Local/Cloud, Advanced Features)]
    GameLogic --> AudioSystem[Audio System]
    GameLogic --> MinigameSystem[Minigame System (Expanded)]
    GameLogic --> ProgressionSystem[Progression System (Expanded Content)]
    GameLogic --> StaffSystem[Staff Management System]
    GameLogic --> ProjectSystem[Project Management System]
    GameLogic --> RewardSystem[Reward System]
    GameLogic --> ChartSystem[Charts & Market System (Player Song Integration)]
    GameLogic --> BandSystem[Band & Song Creation System]
    GameLogic --> MarketTrendsSystem[Dynamic Market Trends System]
    GameLogic --> RelationshipSystem[Reputation & Relationship Management]
    GameLogic --> StudioUpgradeSystem[Studio Perks & Specializations]
    GameLogic --> UIManager[UI/UX Manager (Responsive, Accessible)]
    GameLogic --> MultiplayerSystem[Multiplayer System (Future)]
    GameLogic --> AISystem[Advanced AI System (Future)]
    GameLogic --> VRSystem[VR Support (Future)]
    GameLogic --> MobileOptimization[Mobile Platform Optimization (Future)]

    SaveSystem --> Cloud[Cloud Storage (Supabase)]
    SaveSystem --> Local[Local Storage]

    AudioSystem --> SFX[Sound Effects]
    AudioSystem --> BGM[Background Music]
    AudioSystem --> MinigameAudio[Minigame Specific Audio]

    MinigameSystem --> MinigameComponents[Individual Minigame Components]
    MinigameSystem --> MinigameLogic[Minigame Specific Logic]

    ProgressionSystem --> EraProgression[Era Progression]
    ProgressionSystem --> PlayerProgression[Player XP & Skills]
    ProgressionSystem --> Unlocks[Content Unlocks]

    StaffSystem --> StaffHiring[Staff Hiring]
    StaffSystem --> StaffTraining[Staff Training]
    StaffSystem --> StaffAssignment[Staff Assignment]

    ProjectSystem --> ProjectCreation[Project Creation]
    ProjectSystem --> ProjectStages[Project Stages]
    ProjectSystem --> ProjectCompletion[Project Completion]

    RewardSystem --> XP[Experience Points]
    RewardSystem --> Money[In-game Currency]
    RewardSystem --> Items[Unlockable Items/Equipment]

    ChartSystem --> MarketTrends[Market Trends]
    ChartSystem --> SongCharts[Song Charts]
    ChartSystem --> GenrePopularity[Genre Popularity]

    MarketTrendsSystem --> SubGenreEvolution[Sub-Genre Evolution]
    MarketTrendsSystem --> TrendAnalysis[Market Analysis]
    MarketTrendsSystem --> PlayerMarketImpact[Player Market Impact]

    RelationshipSystem --> ClientManagement[Client Management]
    RelationshipSystem --> RecordLabelRelations[Record Label Relations]
    RelationshipSystem --> ContractGeneration[Dynamic Contract Generation]
    RelationshipSystem --> ReputationTracking[Industry Reputation]

    StudioUpgradeSystem --> PerkTrees[Studio Perk Trees]
    StudioUpgradeSystem --> Specializations[Studio Specializations]
    StudioUpgradeSystem --> IndustryPrestige[Industry Prestige System]
    StudioUpgradeSystem --> MilestoneTracking[Achievement Milestones]
```

## Component Relationships
- **User Interface (UI)**: Built with React, it provides the visual and interactive elements for the player. It interacts with the Game Logic to display information and trigger actions.
- **Game Logic**: Contains the core game rules, calculations, and state transitions. It orchestrates interactions between various systems.
- **Game State Management**: Manages the global state of the game, ensuring data consistency across components.
- **Game Data**: Static data for equipment, staff, projects, etc., stored in structured files.
- **Save System**: Handles saving and loading game progress to local storage and cloud storage (Supabase), with advanced features like multiple slots, versioning, auto-save, encryption, compression, incremental saves, export/import, analytics, conflict resolution, and backup.
- **User Interface (UI) / UX Manager**: Manages responsive design, accessibility, performance, mobile-friendly controls, keyboard shortcuts, and gamepad support.
- **Core Gameplay Enhancements**: Includes modules for band management and studio expansion.
- **Phase 2 Systems Integration**: Ensures full UI integration, extensive testing and balancing, and player feedback integration for advanced systems.
- **Minigame System**: Manages various interactive minigames, their logic, and integration with the main game loop, including new minigames for equipment maintenance, staff training, band practice, studio maintenance, and customer service.
- **Expanded Content System**: Manages integration of new locations, special events, and seasonal/holiday content.
- **Band & Song Creation System**: Manages player-created bands, song development, and their journey to chart success, including integration of player songs into charts and a chart progression/influence system.
- **Future Systems (Multiplayer, AI, VR, Mobile)**: High-level components for potential future expansion.
- **Audio System**: Manages all in-game audio, including background music, sound effects, and minigame-specific audio.
- **Progression System**: Tracks player and studio progress, manages era transitions, and unlocks new content.
- **Staff Management System**: Handles staff hiring, training, skill development, and assignment to projects, including new specialized roles.
- **Project Management System**: Oversees the lifecycle of music projects, from creation to completion and release, including original song production.
- **Reward System**: Distributes rewards (XP, money, items) based on player actions and project outcomes.
- **Charts & Market System**: Simulates the music industry market, including genre trends, song chart performance, and artist contact opportunities.
- **Dynamic Market Trends System**: Advanced market simulation with sub-genre evolution, trend analysis, and player impact on market dynamics.
- **Reputation & Relationship Management**: Comprehensive system for managing relationships with clients, record labels, and industry entities.
- **Studio Perks & Specializations**: Deep progression system allowing studios to unlock perks, specialize in genres, and build industry prestige.

## Dependencies
- UI components depend on Game Logic and Game State, and the new UI/UX Manager.
- Game Logic depends on Game Data, Save System, Audio System, Minigame System, Progression System, Staff System, Project System, Reward System, Chart System, Market Trends System, Relationship System, Studio Upgrade System, and potentially Multiplayer, AI, VR, and Mobile Optimization systems.
- Save System depends on Cloud Storage (Supabase) and Local Storage APIs, with expanded dependencies for encryption, compression, and conflict resolution.
- Minigame System depends on individual minigame components and their specific logic, including new minigame types.
- Progression System depends on player actions and game events, and the Expanded Content System.
- Staff System depends on staff data and training configurations, and new training minigames.
- Project System depends on project templates and staff availability, and band management.
- Reward System depends on project outcomes and minigame performance.
- Chart System depends on game events and simulated market dynamics, and player song integration.
- Band & Song Creation System depends on player actions, staff skills, market trends, and chart integration.
- Market Trends System depends on time progression, player successes, and random market events.
- Relationship System depends on project completion quality, client preferences, and player reputation.
- Studio Upgrade System depends on player progression, achievements, and unlocked milestones.
- Phase 2 Systems Integration depends on all Phase 2 systems and UI components.
- Multiplayer, AI, VR, and Mobile Optimization systems will have their own dependencies as they are developed.

## Workflow of the Solution
1. **Game Initialization**: On startup, the game loads saved data (or starts a new game), initializes the game state, and sets up the UI.
2. **Player Actions**: Players interact with the UI to manage their studio, hire staff, start projects, play minigames, etc.
3. **Game Logic Processing**: Player actions trigger updates in the Game Logic, which processes the changes, updates the game state, and triggers relevant system interactions (e.g., staff work, project progress, reward calculation).
4. **State Updates & UI Re-render**: Changes in the game state cause the UI to re-render, reflecting the current status of the studio, projects, and staff.
5. **Background Systems**: Systems like Audio, Progression, Charts, and Save System operate in the background, providing continuous feedback, managing long-term progress, and ensuring data persistence.
6. **Minigame Engagement**: When a minigame is initiated, the Minigame System takes over, providing interactive challenges that influence project quality and player skills.
7. **Event Handling**: Dynamic events (market shifts, staff challenges) are introduced by the Game Logic, requiring player adaptation and strategic decisions.
8. **Game Loop**: The game continuously cycles through player input, logic processing, and UI updates, creating a dynamic and interactive experience.
