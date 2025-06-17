# System Architecture

## Overview
This document describes the high-level architecture of the Recording Studio Tycoon game. It outlines a comprehensive rebuild within the Unity game engine using C#, emphasizing a modular, data-driven, and event-driven system design. The core components, their relationships, and the overall workflow reflect this Unity-centric approach, with `GameManager` acting as a central orchestrator delegating to specialized managers.

## PolAI (Pollinations.AI) Integration
- Centralized `PolAiService` module for all API calls (image, text, audio).
- **Album art generation**: Implemented and integrated with UI for generating and assigning album art to projects/albums using PolAI image API.
- `TextGenerationManager` singleton manages all text generation requests (reviews, news, bios, descriptions), handles prompt engineering, caching, and error handling.
- UI integration for album art, band logo, dynamic news/reviews, TTS, and more.
- `TextGenerationManager` connects to UI panels for album/song reviews, news feed, band member bios, and item descriptions, providing async, cached text content.
- Follows phased rollout: album art and text/news first, then logo, TTS, dialogue, accessibility.
- Uses referrer-based authentication for frontend calls.
- Error handling, loading states, and caching are part of the integration.
- News feed panel (MainMenuPanel) displays AI-generated news with icons, separators, scrollable container, fade-in animation, and highlighted latest item.
- Album/song and studio description panels feature section headers with icons, rounded/light background boxes, larger italicized text, and fade-in animation for updates.
- All enhancements are implemented with comments for easy future adjustments.

```mermaid
flowchart TD
    User[Player Interaction] --> UnityUI[User Interface (Unity UGUI/UI Toolkit)]
    UnityUI --> GameManager[Game Manager (C#)]
    GameManager --> GameState[Game State (C# Data Structures)]
    GameManager --> SaveSystem[Save System (C#)]
    GameManager --> Data[Game Data (ScriptableObjects/C# Classes)]
    GameManager --> AudioSystem[Audio System (Unity Audio)]
    GameManager --> MinigameSystem[Minigame System (C#)]
    GameManager --> ProgressionSystem[Progression System (C#)]
    GameManager --> StaffSystem[Staff Management System (C#)]
    GameManager --> ProjectSystem[Project Management System (C#)]
    GameManager --> RewardSystem[Reward System (C#)]
    GameManager --> ChartSystem[Charts & Market System (C#)]
    GameManager --> BandSystem[Band & Song Creation System (C#)]
    GameManager --> MarketTrendsSystem[Dynamic Market Trends System (C#)]
    GameManager --> RelationshipSystem[Reputation & Relationship Management (C#)]
    GameManager --> StudioUpgradeSystem[Studio Perks & Specializations (C#)]
    GameManager --> InputSystem[Input System (Unity Input)]
    GameManager --> UIManager[UI/UX Manager (C#)]
    GameManager --> LocalizationSystem[Localization (C#)]
    GameManager --> PerformanceOptimization[Performance Optimization (C#)]
    GameManager --> TourSystem[Tour Management System (C#)]
    GameManager --> FinanceSystem[Finance Management System (C#)]

    SaveSystem --> Local[Local Storage]
    SaveSystem --> Cloud[Cloud Storage (e.g., Firebase, PlayFab - C# SDKs)]

    AudioSystem --> SFX[Sound Effects]
    AudioSystem --> BGM[Background Music]
    AudioSystem --> MinigameAudio[Minigame Specific Audio]
    AudioSystem --> ChartAudio[Chart Audio Playback]

    MinigameSystem --> MinigameComponents[Individual Minigame Components (C#)]
    MinigameSystem --> MinigameLogic[Minigame Specific Logic (C#)]

    ProgressionSystem --> EraProgression[Era Progression]
    ProgressionSystem --> PlayerProgression[Player XP & Skills]
    ProgressionSystem --> Unlocks[Content Unlocks]
    ProgressionSystem --> Training[Training System]

    StaffSystem --> StaffHiring[Staff Hiring]
    StaffSystem --> StaffTraining[Staff Training]
    StaffSystem --> StaffAssignment[Staff Assignment]

    ProjectSystem --> ProjectCreation[Project Creation]
    ProjectSystem --> ProjectStages[Project Stages]
    ProjectSystem --> ProjectCompletion[Project Completion]
    ProjectSystem --> MilestoneTracking[Milestone Tracking]

    RewardSystem --> XP[Experience Points]
    RewardSystem --> Money[In-game Currency]
    RewardSystem --> Items[Unlockable Items/Equipment]

    ChartSystem --> MarketTrends[Market Trends]
    ChartSystem --> SongCharts[Song Charts]
    ChartSystem --> GenrePopularity[Genre Popularity]
    ChartSystem --> AudioPlayback[Audio Playback for Charts]

    MarketTrendsSystem --> SubGenreEvolution[Sub-Genre Evolution]
    MarketTrendsSystem --> TrendAnalysis[Market Analysis]
    MarketTrendsSystem --> PlayerMarketImpact[Player Market Impact]

    RelationshipSystem --> ClientManagement[Client Management]
    RelationshipSystem --> RecordLabelRelations[Record Label Relations]
    RelationshipSystem --> ContractGeneration[Dynamic Contract Generation]
    RelationshipSystem --> ReputationTracking[Industry Reputation]
    RelationshipSystem --> Blacklisting[Blacklisting]
    RelationshipSystem --> PlayerFavors[Player Favors]

    StudioUpgradeSystem --> PerkTrees[Studio Perk Trees]
    StudioUpgradeSystem --> Specializations[Studio Specializations]
    StudioUpgradeSystem --> IndustryPrestige[Industry Prestige System]
    StudioUpgradeSystem --> StudioExpansion[Studio Expansion]

    TourSystem --> TourScheduling[Tour Scheduling]
    TourSystem --> TourManagement[Tour Management]

    FinanceSystem --> IncomeExpenses[Income & Expenses Tracking]
    FinanceSystem --> BudgetManagement[Budget Management]

```

## Component Relationships
- **User Interface (Unity UI)**: The UI is built primarily using Unity's native UI systems (UGUI or UI Toolkit). It interacts directly with C# game logic components, subscribing to events from `GameManager` and specialized managers for real-time updates.
- **Game Manager (C#)**: The central orchestrator of all game logic and state. `GameManager.cs` manages game flow, system interactions, and serves as the primary interface for all game actions and data access. It delegates responsibilities to specialized managers and uses new events to communicate state changes.
- **Game State (C#)**: `GameState.cs` defines the comprehensive data structure for the entire game's state, extensively expanded to include new features. It is managed and updated by the `GameManager` and other C# game systems, with versioning handled by `SaveSystem`.
- **Game Data (C#)**: Static game data (equipment, staff, projects, progression, perks, eras, market trends, charts) is defined using Unity ScriptableObjects and custom C# classes, promoting a data-driven design.
- **Save System (C#)**: Re-implemented in C# with versioning, leveraging Unity's capabilities and potentially C# SDKs for cloud services (e.g., Firebase, PlayFab) for advanced features.
- **Audio System (Unity Audio)**: All audio management (SFX, BGM, minigame audio, chart audio playback) is handled natively within Unity's Audio System.
- **Minigame System (C#)**: Minigames and their logic are fully rebuilt in C# within Unity, leveraging Unity's physics and rendering capabilities. `MinigameManager` has updated method signatures and event parameters.
- **Progression System (C#)**: Player and studio progression, era transitions, content unlocks, and training are driven by C# logic.
- **Staff Management System (C#)**: Staff hiring, training, skill development, and assignment are implemented in C#.
- **Project Management System (C#)**: The lifecycle of music projects, including milestone tracking, is managed by C# logic.
- **Reward System (C#)**: Rewards (XP, money, items) are calculated and distributed by C# logic.
- **Charts & Market System (C#)**: The music industry market simulation, including genre trends, song chart performance, and audio playback, is rebuilt in C#. `MarketManager` and `ChartAudioManager` have updated functionalities.
- **Dynamic Market Trends System (C#)**: Advanced market simulation logic is in C#, with enhanced charts and audio playback.
- **Reputation & Relationship Management (C#)**: This system includes blacklisting and player favors, with `RelationshipManager` having updated method signatures and event parameters.
- **Studio Perks & Specializations (C#)**: The deep progression system for studio perks, specializations, industry prestige, and studio expansion is in C#.
- **Tour Management System (C#)**: Manages tour scheduling and overall tour progression.
- **Finance Management System (C#)**: Tracks income, expenses, and budget.
- **Input System (Unity Input)**: All user input (keyboard, mouse, gamepad) is handled via Unity's native Input System.
- **UI/UX Manager (C#)**: A C# component to manage responsive design, accessibility, performance, and overall UI/UX within Unity.
- **Localization System (C#)**: A C# implementation for multi-language support.
- **Performance Optimization (C#)**: Continuous optimization efforts focus on C# code and Unity engine features.

## Dependencies
- All core game systems (Game Logic, Game State, Save System, Audio System, Minigame System, Progression System, Staff System, Project System, Reward System, Chart System, Market Trends System, Relationship System, Studio Upgrade System, Tour System, Finance System, Input System, UI/UX Manager, Localization System, Performance Optimization) primarily depend on Unity Engine APIs and C# libraries.
- UI components (UnityUI) primarily interact with the C# `GameManager` and specialized managers.
- Cloud saving may depend on C# SDKs for chosen cloud providers (e.g., Firebase, PlayFab).
- External data (e.g., from PolAI) is loaded and parsed by C#.
- ScriptableObjects are extensively used for data configuration, reducing hardcoded dependencies.

## Workflow of the Solution
1. **Unity Engine Initialization**: On startup, Unity initializes, loads scenes, and activates core C# MonoBehaviours like `GameManager`.
2. **Game Initialization (C#)**: `GameManager` loads saved game data (with versioning via `SaveSystem`), initializes the `GameState` (now extensively expanded), and sets up all C# game systems and specialized managers.
3. **Player Actions (Unity Input & UI)**: Players interact with Unity-native UI elements. Input is processed by Unity's Input System and directed to relevant C# game logic, often triggering methods on specialized managers.
4. **Game Logic Processing (C#)**: Player actions trigger methods in `GameManager` and other C# game systems/specialized managers. This C# logic processes changes, updates the `GameState`, and performs calculations (e.g., staff work, project progress, reward calculation, relationship changes, market trend updates).
5. **State Updates & UI Rendering (C# & Unity UI)**: Changes in the `GameState` are communicated via new events from `GameManager` and specialized managers, which Unity's UI components subscribe to for real-time visual feedback.
6. **Background Systems (C#)**: C# implementations of Audio (including chart audio playback), Progression (including era progression and training), Charts (with enhanced market trends), Save System (with versioning), Relationship System (with blacklisting and favors), Studio Upgrade System (with perks and expansion), Tour System, and Finance System operate continuously, managing long-term progress and data persistence within the Unity environment.
7. **Minigame Engagement (C# & Unity)**: Minigames are initiated and controlled by C# logic, leveraging Unity's scene management and physics, influencing game outcomes. `MinigameManager` handles their specific logic and events.
8. **Event Handling (C#)**: Dynamic events and challenges are managed and triggered by C# game logic, often involving interactions between multiple specialized managers.
9. **Game Loop (Unity)**: The Unity game engine continuously executes the game loop, driven by C# scripts for input processing, logic updates, rendering, and physics, providing a robust and interactive experience.
