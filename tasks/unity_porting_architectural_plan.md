# Unity C# Porting Architectural Plan

## Overview
This document outlines the high-level architectural plan for systematically translating and integrating core gameplay mechanics, UI systems, and essential game logic from the legacy React/TypeScript codebase (`src`) into the Unity C# project. The goal is to leverage Unity's native capabilities for enhanced flexibility, performance, and a more robust game development experience.

## Identified Remaining Features for Porting

Based on the analysis of the `src` directory and the `tasks/tasks_plan.md`, the following core gameplay mechanics, UI systems, and essential game logic need to be ported or further developed in Unity C#:

### Core Gameplay Mechanics
1.  **Save System Improvements**: Comprehensive save/load functionality including cloud sync, multiple save slots, versioning, auto-save optimization, play time tracking, encryption, cross-device sync, data compression, incremental saves, export/import, analytics, conflict resolution, and backup system. (Currently handled by [`src/contexts/SaveSystemContext.tsx`](src/contexts/SaveSystemContext.tsx) and `src/utils/saveLoadUtils.ts`).
2.  **Band Management**: Player band creation, member management (hiring/firing, session musicians), band training, and tour initiation/progression. (Logic in [`src/hooks/useBandManagement.tsx`](src/hooks/useBandManagement.tsx), UI in [`src/components/BandManagement.tsx`](src/components/BandManagement.tsx)).
3.  **Studio Expansion**: Logic for building, upgrading, and managing studio rooms and equipment slots. (Mentioned in PRD, UI component [`src/components/StudioExpansion.tsx`](src/components/StudioExpansion.tsx) exists).
4.  **Detailed Project Progression**: Advanced project lifecycle management, including original song creation, detailed stage progression, and automated work allocation. (Logic in [`src/services/ProjectManager.ts`](src/services/ProjectManager.ts) and [`src/hooks/useProjectManagement.tsx`](src/hooks/useProjectManagement.tsx), UI in [`src/components/ProgressiveProjectInterface.tsx`](src/components/ProgressiveProjectInterface.tsx)).
5.  **Advanced Staff Interactions**: Beyond basic assignment, this includes detailed staff needs (e.g., morale, energy), specific training outcomes, and unique abilities. (Related to [`src/components/StaffAssignmentSection.tsx`](src/components/StaffAssignmentSection.tsx) and `src/utils/staffUtils.ts`).
6.  **Market Dynamics & Charts**: Integration of player songs into charts, development of a comprehensive chart progression and influence system, and dynamic market trend evolution. (Logic in [`src/services/marketService.ts`](src/services/marketService.ts) and [`src/hooks/useMarketTrends.ts`](src/hooks/useMarketTrends.ts), UI in [`src/components/MarketTrendsPanel.tsx`](src/components/MarketTrendsPanel.tsx)).
7.  **Audio System Specifics**: Full integration of all game audio (BGM, SFX, minigame audio) into Unity's native audio system, including sound loading, playback, and global mute control. (Currently managed by [`src/hooks/useSound.ts`](src/hooks/useSound.ts)).
8.  **Tutorial System Expansion**: Expanding feedback with actionable tips and color cues, and adding example tutorial scripts for various minigames and features. (Unity has `TutorialManager.cs` and `TutorialOverlay.cs`, but more content and integration are needed, based on `src/data/tutorials` and `src/components/tutorial`).
9.  **Scoring System Expansion**: Further development of the scoring and feedback system to provide more detailed and actionable insights. (Unity has `ScoringManager.cs`, but expansion is needed).

### UI Systems
1.  **Full UI Integration**: Rebuilding all remaining React UI components (modals, panels, dashboards, specific minigame UIs, game header, layout) using Unity's native UI systems (UGUI/UI Toolkit). (Extensive components in `src/components/`).
2.  **UX Enhancements**: Implementing responsive design, accessibility features, performance optimizations, mobile-friendly controls, keyboard shortcuts, and gamepad support. (General UI/UX goals from PRD).

### Essential Game Logic
1.  **Relationship Management**: Logic for client management, record label relations, dynamic contract generation, and comprehensive industry reputation tracking. (Logic in `src/services/relationshipService.ts`, types in `src/types/relationships.ts`).
2.  **Studio Perks & Specializations**: Implementation of perk trees, studio specializations, an industry prestige system, and achievement milestones. (Logic in `src/services/studioUpgradeService.ts`, types in `src/types/studioPerks.ts`).
3.  **PolAI Integration**: Implementation of a service for Pollinations.AI API calls (image, text, audio) and integration with UI for features like album art generation, dynamic news/reviews, band logo generation, creative writing assistance, TTS, dynamic NPC dialogue, dynamic event images, along with robust error handling, loading states, and caching. (Detailed in [`docs/POLAI_API_INTEGRATION_PLAN.md`](docs/POLAI_API_INTEGRATION_PLAN.md)).

## Proposed Unity C# Equivalents and Design Considerations

For each identified feature, the approach will involve creating dedicated C# scripts (MonoBehaviours for managers, plain C# classes for data models, and ScriptableObjects for static data definitions) within the `RecordingStudioTycoon_UnityPoC/Assets/Scripts/` directory, following established Unity design patterns.

### General Design Principles:
*   **Singleton Pattern**: For central managers (e.g., `SaveManager`, `BandManager`, `MarketManager`, `StudioManager`, `RelationshipManager`, `PerkManager`, `AudioManager`, `PolAIService`).
*   **Event-Driven Architecture**: For decoupled communication between game systems and UI (e.g., managers raising events that UI components subscribe to).
*   **ScriptableObject Pattern**: For defining static game data (e.g., `BandTemplateSO`, `ProjectTemplateSO`, `StaffTemplateSO`, `StudioUpgradeSO`, `PerkTreeSO`, `MilestoneSO`, `GenreDataSO`, `AudioClipSO`, `TutorialSequenceSO`, `TutorialStepSO`). This allows for data-driven design and easy content creation/modification.
*   **Serializable Classes**: For dynamic game state data that needs to be saved (e.g., `BandData`, `ProjectData`, `StaffMemberData`, `MarketTrendData`, `ContractData`, `StudioPerkData`). These will be part of or referenced by `GameState.cs`.
*   **Clear Separation of Concerns**: Game logic in dedicated system managers, UI logic in separate UI scripts that interact with managers.

### File Organization within `RecordingStudioTycoon_UnityPoC/Assets/Scripts/`:
*   `Assets/Scripts/Systems/`: Contains core game system managers (e.g., `Save/`, `Band/`, `Studio/`, `Project/`, `Staff/`, `Market/`, `Audio/`, `Tutorial/`, `Scoring/`, `Relationship/`, `Perks/`).
*   `Assets/Scripts/DataModels/`: Contains serializable C# classes for dynamic game data (e.g., `BandData.cs`, `ProjectData.cs`, `StaffMemberData.cs`).
*   `Assets/ScriptableObjects/`: Contains ScriptableObject definitions for static game data (e.g., `BandTemplateSO.cs`, `ProjectTemplateSO.cs`, `StaffTemplateSO.cs`).
*   `Assets/Scripts/UI/`: Contains C# scripts for Unity UI components, organized by feature (e.g., `UI/MainUI.cs`, `UI/Modals/`, `UI/Panels/`, `UI/Common/`, `UI/Band/`, `UI/Project/`).
*   `Assets/Scripts/Services/`: For external service integrations like `PolAI/PolAIService.cs`.
*   `Assets/Scripts/Utils/`: For general utility functions (e.g., `SaveUtils.cs`, `ProjectUtils.cs`).

## High-Level Integration Plan (Phased Approach)

The porting process will follow a phased approach, prioritizing foundational and core gameplay systems before moving to more complex and external integrations.

```mermaid
graph TD
    A[Phase 0: Foundation (Completed/Ongoing)] --> B(Core GameState & GameManager in C#)
    B --> C(Basic UI Framework in Unity)
    B --> D(ScriptableObjects for Core Data)
    B --> E(Scoring & Tutorial Managers in C#)

    C --> F(Phase 1: Core Gameplay Loops)
    D --> F
    E --> F

    F --> G(Save System)
    F --> H(Project Management System)
    F --> I(Staff Management System)
    F --> J(Band Management System)
    F --> K(Audio System)

    G --> L(Phase 2: Advanced Systems & UI)
    H --> L
    I --> L
    J --> L
    K --> L

    L --> M(Market Dynamics & Charts)
    L --> N(Studio Expansion & Perks)
    L --> O(Relationship Management)
    L --> P(Expanded Minigames)
    L --> Q(Full UI Integration)

    M --> R(Phase 3: External Integrations & Polish)
    N --> R
    O --> R
    P --> R
    Q --> R

    R --> S(PolAI Integration)
    R --> T(Advanced UI/UX Features)
    R --> U(Performance Optimization & Testing)
```

### Phase 0: Foundation (Completed/Ongoing)
*   **Status**: Largely completed as per `tasks/active_context.md`.
*   **Focus**: Establish the basic Unity project structure, core `GameManager.cs` and `GameState.cs`, initial Unity UI framework, and foundational ScriptableObjects for basic game data. Basic `ScoringManager.cs` and `TutorialManager.cs` are also in place.
*   **Key Deliverables**: Stable core game loop, basic data management, and placeholder UI.

### Phase 1: Core Gameplay Loops
*   **Focus**: Port the essential gameplay mechanics that drive the primary game loop and player interaction.
*   **Dependencies**: Requires a stable Phase 0 foundation.
*   **Key Deliverables**:
    *   **Save System**: Implement `SaveManager.cs` with local save/load, auto-save, and versioning.
    *   **Project Management System**: Fully port `ProjectManager.cs` logic, including project creation, detailed stage progression, and completion. Implement associated Unity UI for active project display and project lists.
    *   **Staff Management System**: Fully port `StaffManager.cs` logic, including hiring, training, and assignment. Implement Unity UI for staff management and assignment sections.
    *   **Band Management System**: Implement `BandManager.cs` for band creation, member management, and basic tour initiation. Implement Unity UI for band management panels and related modals.
    *   **Audio System**: Implement `AudioManager.cs` to manage background music and core sound effects using Unity's Audio System.

### Phase 2: Advanced Systems & UI
*   **Focus**: Port more complex game systems that add depth and strategic elements, and systematically integrate the remaining UI components.
*   **Dependencies**: Requires stable Phase 1 systems.
*   **Key Deliverables**:
    *   **Market Dynamics & Charts**: Implement `MarketManager.cs` for dynamic trend evolution, song chart calculations, and player influence. Develop Unity UI for market trends panels and chart displays.
    *   **Studio Expansion & Perks**: Implement `StudioManager.cs` and `PerkManager.cs` for studio upgrades, perk trees, specializations, and prestige. Develop corresponding Unity UI for upgrade menus and perk displays.
    *   **Relationship Management**: Implement `RelationshipManager.cs` for client/label interactions, dynamic contract generation, and reputation tracking. Develop Unity UI for relationship interfaces.
    *   **Expanded Minigames**: Port the remaining minigame logic from the `src/components/minigames` into C# components. Ensure full integration with the existing `ScoringManager` and `TutorialManager`.
    *   **Full UI Integration**: Systematically rebuild all remaining React UI components (e.g., complex modals, multi-project dashboards, specific game views) using Unity UI Toolkit/UGUI, ensuring they interact correctly with their C# system managers. Focus on responsive design and basic accessibility.

### Phase 3: External Integrations & Polish
*   **Focus**: Integrate external services, implement advanced UI/UX features, and conduct comprehensive testing and optimization.
*   **Dependencies**: Requires stable Phase 2 systems.
*   **Key Deliverables**:
    *   **PolAI Integration**: Implement `PolAIService.cs` to handle all API calls to Pollinations.AI. Integrate this service with relevant Unity UI elements for features like album art generation, dynamic news/reviews, and other AI-driven content.
    *   **Save System Enhancements**: Implement advanced save features such as cloud save synchronization, multiple save slots, encryption, compression, and export/import functionalities within `SaveManager.cs`.
    *   **Advanced UI/UX Features**: Implement mobile-friendly controls, keyboard shortcuts, gamepad support, and conduct further performance optimizations for the Unity UI.
    *   **Comprehensive Testing & Balancing**: Conduct extensive unit, integration, and system testing for all ported features. Perform thorough game balancing to ensure an engaging and fair player experience.