# System Architecture

## Overview
This document describes the high-level architecture of the Recording Studio Tycoon game. It now outlines a comprehensive rebuild within the Unity game engine using C#, aiming for enhanced flexibility, performance, and native integration beyond a web-based game engine. The core components, their relationships, and the overall workflow will reflect this Unity-centric approach.

## UI/UX Update: App Icon (Legacy Web Version)

- The app icon and manifest for the *original web version* use a music symbol emoji (🎵) for a more musical and modern look. This change is implemented using an inline SVG in the HTML, providing a consistent appearance across platforms without the need for generated icon files.

## Unity UI Porting Plan (Deprecated - Replaced by Full C# Rebuild)

- The previous detailed plan for porting the existing React-based UI to Unity using ReactUnity (`docs/unity_porting_plan.md`) is now superseded by the decision to undertake a full game rebuild in Unity with C#. While ReactUnity may still be used for certain UI elements, the core game logic and UI framework will be native C# within Unity.

## PolAI (Pollinations.AI) Integration
- Centralized `PolAiService` module for all API calls (image, text, audio).
- **Album art generation**: Implemented and integrated with UI for generating and assigning album art to projects/albums using PolAI image API.
- `TextGenerationManager` singleton manages all text generation requests (reviews, news, bios, descriptions), handles prompt engineering, caching, and error handling.
- UI integration for album art, band logo, dynamic news/reviews, TTS, and more.
- TextGenerationManager connects to UI panels for album/song reviews, news feed, band member bios, and item descriptions, providing async, cached text content.
- Follows phased rollout: album art and text/news first, then logo, TTS, dialogue, accessibility.
- Uses referrer-based authentication for frontend calls.
- Error handling, loading states, and caching are part of the integration.

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

    SaveSystem --> Local[Local Storage]
    SaveSystem --> Cloud[Cloud Storage (e.g., Firebase, PlayFab - C# SDKs)]

    AudioSystem --> SFX[Sound Effects]
    AudioSystem --> BGM[Background Music]
    AudioSystem --> MinigameAudio[Minigame Specific Audio]

    MinigameSystem --> MinigameComponents[Individual Minigame Components (C#)]
    MinigameSystem --> MinigameLogic[Minigame Specific Logic (C#)]

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
- **User Interface (Unity UI)**: The UI will be rebuilt primarily using Unity's native UI systems (UGUI or UI Toolkit). ReactUnity may be used selectively for specific complex elements if beneficial, but the core UI framework will be native C# within Unity. It interacts directly with C# game logic components.
- **Game Manager (C#)**: The central orchestrator of all game logic and state. `GameManager.cs` will manage game flow, system interactions, and serve as the primary interface for all game actions and data access. All core game systems will be implemented in C# and managed by `GameManager`.
- **Game State (C#)**: `GameState.cs` will continue to define the comprehensive data structure for the entire game's state, managed and updated by the `GameManager` and other C# game systems. Serialization will be handled natively by Unity or custom C# serialization.
- **Game Data (C#)**: Static game data (equipment, staff, projects, progression) will be defined using Unity ScriptableObjects and custom C# classes, providing a robust and performant data management system.
- **Save System (C#)**: The save system will be re-implemented in C#, leveraging Unity's capabilities and potentially C# SDKs for cloud services (e.g., Firebase, PlayFab) for advanced features. This will replace the previous Supabase integration for core game saves.
- **Audio System (Unity Audio)**: All audio management (SFX, BGM, minigame audio) will be handled natively within Unity's Audio System.
- **Minigame System (C#)**: Minigames and their logic will be fully rebuilt in C# within Unity, leveraging Unity's physics and rendering capabilities.
- **Progression System (C#)**: Player and studio progression, era transitions, and content unlocks will be driven by C# logic.
- **Staff Management System (C#)**: Staff hiring, training, skill development, and assignment will be implemented in C#.
- **Project Management System (C#)**: The lifecycle of music projects will be managed by C# logic.
- **Reward System (C#)**: Rewards (XP, money, items) will be calculated and distributed by C# logic.
- **Charts & Market System (C#)**: The music industry market simulation, including genre trends and song chart performance, will be rebuilt in C#.
- **Dynamic Market Trends System (C#)**: Advanced market simulation logic will be in C#.
- **Reputation & Relationship Management (C#)**: This system will be implemented in C#.
- **Studio Perks & Specializations (C#)**: The deep progression system for studio perks and specializations will be in C#.
- **Input System (Unity Input)**: All user input (keyboard, mouse, gamepad) will be handled via Unity's native Input System.
- **UI/UX Manager (C#)**: A C# component to manage responsive design, accessibility, performance, and overall UI/UX within Unity.
- **Localization System (C#)**: A C# implementation for multi-language support.
- **Performance Optimization (C#)**: Continuous optimization efforts will focus on C# code and Unity engine features.

## Dependencies
- All core game systems (Game Logic, Game State, Save System, Audio System, Minigame System, Progression System, Staff System, Project System, Reward System, Chart System, Market Trends System, Relationship System, Studio Upgrade System, Input System, UI/UX Manager, Localization System, Performance Optimization) will primarily depend on Unity Engine APIs and C# libraries.
- UI components (UnityUI or ReactUnity) will primarily interact with the C# `GameManager` and `GameState`.
- Cloud saving may depend on C# SDKs for chosen cloud providers (e.g., Firebase, PlayFab).
- External data might be loaded from JSON or other formats, parsed by C#.

## Workflow of the Solution
1. **Unity Engine Initialization**: On startup, Unity initializes, loads scenes, and activates core C# MonoBehaviours like `GameManager`.
2. **Game Initialization (C#)**: `GameManager` loads saved game data (or creates a new default state), initializes the `GameState`, and sets up all C# game systems.
3. **Player Actions (Unity Input & UI)**: Players interact with Unity-native UI elements or ReactUnity components (which call C# methods). Input is processed by Unity's Input System and directed to relevant C# game logic.
4. **Game Logic Processing (C#)**: Player actions trigger methods in `GameManager` and other C# game systems. This C# logic processes changes, updates the `GameState`, and performs calculations (e.g., staff work, project progress, reward calculation).
5. **State Updates & UI Rendering (C# & Unity UI)**: Changes in the `GameState` are reflected directly in Unity's UI components, or communicated to ReactUnity components for re-rendering, ensuring real-time visual feedback.
6. **Background Systems (C#)**: C# implementations of Audio, Progression, Charts, and Save System operate continuously, managing long-term progress and data persistence within the Unity environment.
7. **Minigame Engagement (C# & Unity)**: Minigames are initiated and controlled by C# logic, leveraging Unity's scene management and physics, influencing game outcomes.
8. **Event Handling (C#)**: Dynamic events and challenges are managed and triggered by C# game logic.
9. **Game Loop (Unity)**: The Unity game engine continuously executes the game loop, driven by C# scripts for input processing, logic updates, rendering, and physics, providing a robust and interactive experience.
