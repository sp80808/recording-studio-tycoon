# System Architecture

## Overview
This document describes the high-level architecture of the Recording Studio Tycoon game, outlining its main components, their relationships, and the overall workflow.

```mermaid
flowchart TD
    User[Player Interaction] --> UI[User Interface (React Components)]
    UI --> GameLogic[Game Logic (Hooks & Utilities)]
    GameLogic --> GameState[Game State Management (Zustand/Context)]
    GameLogic --> Data[Game Data (JSON/TS files)]
    GameLogic --> SaveSystem[Save System (Local/Cloud)]
    GameLogic --> AudioSystem[Audio System]
    GameLogic --> MinigameSystem[Minigame System]
    GameLogic --> ProgressionSystem[Progression System]
    GameLogic --> StaffSystem[Staff Management System]
    GameLogic --> ProjectSystem[Project Management System]
    GameLogic --> RewardSystem[Reward System]
    GameLogic --> ChartSystem[Charts & Market System]
    GameLogic --> BandSystem[Band & Song Creation System]

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
```

## Component Relationships
- **User Interface (UI)**: Built with React, it provides the visual and interactive elements for the player. It interacts with the Game Logic to display information and trigger actions.
- **Game Logic**: Contains the core game rules, calculations, and state transitions. It orchestrates interactions between various systems.
- **Game State Management**: Manages the global state of the game, ensuring data consistency across components.
- **Game Data**: Static data for equipment, staff, projects, etc., stored in structured files.
- **Save System**: Handles saving and loading game progress to local storage and potentially cloud storage (Supabase).
- **Audio System**: Manages all in-game audio, including background music, sound effects, and minigame-specific audio.
- **Minigame System**: Manages the various interactive minigames, their logic, and integration with the main game loop.
- **Progression System**: Tracks player and studio progress, manages era transitions, and unlocks new content.
- **Staff Management System**: Handles staff hiring, training, skill development, and assignment to projects, including new specialized roles.
- **Project Management System**: Oversees the lifecycle of music projects, from creation to completion and release, including original song production.
- **Reward System**: Distributes rewards (XP, money, items) based on player actions and project outcomes.
- **Charts & Market System**: Simulates the music industry market, including genre trends, song chart performance, and artist contact opportunities.
- **Band & Song Creation System**: Manages player-created bands, song development, and their journey to chart success.

## Dependencies
- UI components depend on Game Logic and Game State.
- Game Logic depends on Game Data, Save System, Audio System, Minigame System, Progression System, Staff System, Project System, Reward System, and Chart System.
- Save System depends on Cloud Storage (Supabase) and Local Storage APIs.
- Minigame System depends on individual minigame components and their specific logic.
- Progression System depends on player actions and game events.
- Staff System depends on staff data and training configurations.
- Project System depends on project templates and staff availability.
- Reward System depends on project outcomes and minigame performance.
- Chart System depends on game events and simulated market dynamics.
- Band & Song Creation System depends on player actions, staff skills, and market trends.

## Workflow of the Solution
1. **Game Initialization**: On startup, the game loads saved data (or starts a new game), initializes the game state, and sets up the UI.
2. **Player Actions**: Players interact with the UI to manage their studio, hire staff, start projects, play minigames, etc.
3. **Game Logic Processing**: Player actions trigger updates in the Game Logic, which processes the changes, updates the game state, and triggers relevant system interactions (e.g., staff work, project progress, reward calculation).
4. **State Updates & UI Re-render**: Changes in the game state cause the UI to re-render, reflecting the current status of the studio, projects, and staff.
5. **Background Systems**: Systems like Audio, Progression, Charts, and Save System operate in the background, providing continuous feedback, managing long-term progress, and ensuring data persistence.
6. **Minigame Engagement**: When a minigame is initiated, the Minigame System takes over, providing interactive challenges that influence project quality and player skills.
7. **Event Handling**: Dynamic events (market shifts, staff challenges) are introduced by the Game Logic, requiring player adaptation and strategic decisions.
8. **Game Loop**: The game continuously cycles through player input, logic processing, and UI updates, creating a dynamic and interactive experience.