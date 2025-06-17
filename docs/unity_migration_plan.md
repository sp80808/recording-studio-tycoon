# Unity C# Migration Plan for Recording Studio Tycoon

## Overview
This document outlines a high-level plan for systematically translating and integrating remaining core gameplay mechanics, UI systems, and essential game logic from the legacy React/TypeScript `src` codebase into the Unity C# project. The goal is to achieve a full rebuild in Unity, leveraging its native capabilities for enhanced flexibility, performance, and a robust game development experience.

## Identified Remaining Features for Porting

Based on the analysis of the `src` directory and existing project documentation, the following core gameplay mechanics, UI systems, and essential game logic require porting:

### 1. Core Gameplay Logic & Systems
These are the functional backbones of the game, currently implemented in TypeScript services and hooks.

*   **Project Progression & Management**:
    *   Logic for project creation, stage progression, completion, and associated calculations (e.g., `src/services/ProjectManager.ts`, `src/hooks/useProjectManagement.ts`).
*   **Staff Interactions & Management**:
    *   Hiring, training, skill development, assignment, and staff-project matching logic (e.g., `src/hooks/useStaffManagement.ts`, `src/utils/staffUtils.ts`).
*   **Market Dynamics & Charts**:
    *   Dynamic market trends, sub-genre evolution, player market impact, and chart performance calculations (e.g., `src/services/marketService.ts`, `src/hooks/useMarketTrends.ts`).
*   **Band Management & Song Creation**:
    *   Band creation, member management, song writing, recording, release mechanics, and tour scheduling (e.g., `src/hooks/useBandManagement.tsx`, `src/hooks/useSongManagement.tsx`, `src/hooks/useTourManagement.ts`).
*   **Studio Progression & Perks**:
    *   Logic for studio upgrades, perk trees, specializations, industry prestige, and achievement milestones (e.g., `src/services/studioUpgradeService.ts`, `src/hooks/useStudioUpgrades.ts`).
*   **Reward System**:
    *   Calculation and distribution of XP, in-game currency, and unlockable items (e.g., `src/hooks/useRewards.ts`, `src/utils/rewardBalancer.ts`).
*   **Save System**:
    *   The existing Supabase integration for cloud saves (`src/utils/cloudSaveUtils.ts`) needs to be replaced with a Unity-native C# implementation, potentially using C# SDKs for cloud services like Firebase or PlayFab.
*   **Minigame Specific Logic**:
    *   The unique gameplay logic for each individual minigame (e.g., `src/components/minigames/AcousticTreatmentGame.tsx`, `src/components/minigames/MixingMinigame.tsx`). While the `ScoringManager` and `TutorialManager` are in Unity, the actual minigame mechanics are still in React.
*   **Tutorial System (Data & Specific Logic)**:
    *   The content and step-by-step logic for various tutorials (e.g., `src/data/tutorials/`, `src/reducers/tutorialReducer.ts`, `src/hooks/useTutorial.ts`).
*   **Audio System Specifics**:
    *   Custom audio playback logic for background music, chart clips, and UI sound effects (e.g., `src/utils/audioSystem.ts`, `src/hooks/useBackgroundMusic.tsx`).

### 2. UI Systems & Components
The entire React-based UI needs to be rebuilt using Unity's native UI systems (UGUI or UI Toolkit).

*   **Core Layout & Navigation**:
    *   Overall game layout, header, main content, and right panel (e.g., `src/components/GameLayout.tsx`, `src/components/GameHeader.tsx`, `src/components/MainGameContent.tsx`).
*   **Modals & Dialogs**:
    *   All interactive modals for various game actions, information display, and character/band creation (e.g., `src/components/modals/LevelUpModal.tsx`, `src/components/modals/ProjectReviewModal.tsx`, `src/components/modals/BandCreationModal.tsx`).
*   **Panels & Dashboards**:
    *   Dedicated panels for staff management, market trends, charts, studio perks, and project dashboards (e.g., `src/components/StaffManagementPanel.tsx`, `src/components/MarketTrendsPanel.tsx`, `src/components/MultiProjectDashboard.tsx`).
*   **Interactive Elements**:
    *   Custom UI elements like animated numbers, progress bars, skill displays, and mood indicators (e.g., `src/components/AnimatedNumber.tsx`, `src/components/XPProgressBar.tsx`).
*   **Notification & Toast Systems**:
    *   In-game notifications, rewards toasts, and tour-related messages (e.g., `src/components/NotificationSystem.tsx`, `src/components/RewardsToast.tsx`).
*   **Generic UI Components**:
    *   The extensive set of generic UI components in `src/components/ui/` (buttons, sliders, checkboxes, etc.) will be replaced by Unity's native UI controls or custom C# UI components.

### 3. Data Structures
All data models and static game data need to be translated into C# equivalents.

*   **Game Data Models**:
    *   Translation of TypeScript interfaces and types (e.g., `src/types/project.ts`, `src/types/staff.ts`, `src/types/equipment.ts`, `src/types/band.ts`, `src/types/marketTrends.ts`, `src/types/relationships.ts`, `src/types/studioPerks.ts`) into C# classes, structs, or enums.
*   **Static Game Data**:
    *   Conversion of static data arrays/objects (e.g., `src/data/equipment.ts`, `src/data/artistsData.ts`, `src/data/minigames.ts`, `src/data/projectTemplates.ts`, `src/data/training.ts`, `src/data/chartsData.ts`, `src/data/subGenreData.ts`, `src/data/milestones.ts`) into Unity ScriptableObjects for easy management and serialization within the Unity Editor.

### 4. Utility Functions
General helper functions will be translated into C# utility classes.

*   **General Utilities**:
    *   Functions for date manipulation, equipment calculations, game state manipulation, player progression, and various game-specific helpers (e.g., `src/lib/utils.ts`, `src/utils/dateUtils.ts`, `src/utils/equipmentUtils.ts`, `src/utils/gameUtils.ts`, `src/utils/playerUtils.ts`, `src/utils/progressionUtils.ts`).

## Proposed Unity C# Equivalents

For each identified feature, the implementation in Unity C# will follow established Unity patterns and best practices:

*   **MonoBehaviours**: Used for active game objects, managers that need to interact with Unity's lifecycle (e.g., `Update`, `Start`), and components attached to GameObjects in the scene. Examples include `ProjectManager.cs`, `StaffManager.cs`, `BandManager.cs`, `MarketManager.cs`, `StudioManager.cs`, `RewardManager.cs`, and individual minigame logic scripts.
*   **ScriptableObjects**: Ideal for defining static game data, configurations, and templates. This allows designers to easily create and modify data assets without touching code. Examples include `EquipmentData.cs`, `StaffData.cs`, `ProjectTemplateData.cs`, `MinigameData.cs`, `EraData.cs`, `MarketTrendData.cs`, `StudioPerkData.cs`, `TutorialData.cs`.
*   **C# Classes/Structs**: Used for pure data models that don't require Unity's lifecycle methods or asset management. These will be serializable to be included in `GameState.cs` or other data structures. Examples include `BandMember.cs`, `ProjectDetails.cs`, `StaffMember.cs`, `MarketTrend.cs`, `Relationship.cs`.
*   **Design Patterns**:
    *   **Singleton**: For global managers that need to be accessible from anywhere (e.g., `GameManager`, `ScoringManager`, `TutorialManager`, `AudioManager`, `SaveManager`).
    *   **Event-Driven Architecture**: For decoupled communication between systems and UI. UnityEvents or C# events will be used (e.g., `OnProjectCompleted`, `OnStaffHired`, `OnMarketTrendChanged`).
    *   **Factory Pattern**: For creating instances of dynamic game entities like staff members, projects, or bands.
    *   **Observer Pattern**: For UI elements to react to changes in game state or system events.
*   **Integration Points**:
    *   **UI**: Unity's UGUI or UI Toolkit will be used. UI components will subscribe to C# events from managers or directly access `GameManager.Instance.GameState` for data.
    *   **Audio**: Unity's native Audio System will manage all sound effects and background music. An `AudioManager.cs` singleton will centralize audio playback.
    *   **Save System**: A dedicated `SaveManager.cs` will handle local persistence (e.g., JSON serialization) and integrate with cloud services via their C# SDKs.
    *   **Input System**: Unity's new Input System will be used for all player inputs.
*   **File Organization within `RecordingStudioTycoon_UnityPoC/Assets/Scripts/`**:
    *   `Assets/Scripts/GameLogic/`: Core game managers (`GameManager.cs`, `GameState.cs`).
    *   `Assets/Scripts/Systems/`: Subdirectories for each major game system (e.g., `Project/ProjectManager.cs`, `Staff/StaffManager.cs`, `Market/MarketManager.cs`, `Band/BandManager.cs`, `Studio/StudioManager.cs`, `Rewards/RewardManager.cs`, `Save/SaveManager.cs`, `Audio/AudioManager.cs`, `Minigame/MinigameLogic.cs`, `Tutorial/TutorialLogic.cs`).
    *   `Assets/Scripts/DataModels/`: C# classes for dynamic game data (e.g., `Project.cs`, `StaffMember.cs`, `Band.cs`).
    *   `Assets/ScriptableObjects/`: ScriptableObject definitions (e.g., `EquipmentData.cs`, `StaffData.cs`, `EraData.cs`).
    *   `Assets/Scripts/UI/`: C# scripts for UI components and UI managers (e.g., `UIManager.cs`, `ProjectUI.cs`, `StaffUI.cs`, `ModalManager.cs`).
    *   `Assets/Scripts/Utils/`: Static utility classes (e.g., `GameUtils.cs`, `ProgressionUtils.cs`, `StaffUtils.cs`).

## High-Level Integration Plan (Phased Approach)

The porting process will follow a phased approach, prioritizing core dependencies and critical gameplay loops.

```mermaid
graph TD
    A[Phase 0: Foundation & Data] --> B[Phase 1: Core Gameplay Loops]
    B --> C[Phase 2: Advanced Systems & UI]
    C --> D[Phase 3: Content & Polish]

    subgraph Phase 0: Foundation & Data
        P0_1[Review & Refine Existing Unity Core (GameManager, GameState)]
        P0_2[Translate Static Data to ScriptableObjects (Equipment, Staff, Eras, Minigames, Project Templates)]
        P0_3[Translate Core Data Models to C# Classes (Project, StaffMember, Band, etc.)]
        P0_4[Implement Base Save System (Local Persistence)]
    end

    subgraph Phase 1: Core Gameplay Loops
        P1_1[Project Management System (Creation, Stages, Completion)]
        P1_2[Staff Management System (Hiring, Assignment, Basic Training)]
        P1_3[Reward System (XP, Money, Basic Unlocks)]
        P1_4[Basic UI Integration for P1 Systems (Displaying data, triggering actions)]
        P1_5[Minigame Core Logic (Port one simple minigame fully)]
    end

    subgraph Phase 2: Advanced Systems & UI
        P2_1[Market Dynamics & Charts System (Trends, Charts, Genre Popularity)]
        P2_2[Band Management & Song Creation System (Band Lifecycle, Song Attributes)]
        P2_3[Studio Progression & Perks System (Upgrades, Perk Trees)]
        P2_4[Full UI System Rebuild (All Panels, Modals, Notifications)]
        P2_5[Advanced Save System (Cloud Integration, Multiple Slots)]
        P2_6[Port Remaining Minigame Logic]
        P2_7[Port Tutorial Data & Specific Logic]
        P2_8[Audio System Specifics (BGM, SFX, Minigame Audio)]
    end

    subgraph Phase 3: Content & Polish
        P3_1[Integrate PolAI Features (Album Art, News, etc.)]
        P3_2[Implement Enhanced Minigame Mechanics (Maintenance, Training)]
        P3_3[Expand Content (New Locations, Events)]
        P3_4[Performance Optimization & Bug Fixing]
        P3_5[Localization System Implementation]
        P3_6[Player Feedback Integration & Balancing]
    end
```

**Detailed Phased Approach:**

*   **Phase 0: Foundation & Data (Current/Ongoing)**
    *   **Goal**: Ensure the Unity core is solid and all static and dynamic data structures are correctly translated.
    *   **Dependencies**: None, foundational.
    *   **Tasks**:
        *   Review and refine existing `GameManager.cs` and `GameState.cs` in Unity.
        *   Convert all static data from `src/data/` (e.g., `equipment.ts`, `artistsData.ts`, `minigames.ts`, `projectTemplates.ts`) into Unity ScriptableObjects.
        *   Translate all core data models from `src/types/` into C# classes/structs (e.g., `Project.cs`, `StaffMember.cs`, `Band.cs`).
        *   Implement a basic local save system in Unity C# to persist `GameState`.

*   **Phase 1: Core Gameplay Loops**
    *   **Goal**: Establish the fundamental interactive loops of the game.
    *   **Dependencies**: Phase 0 complete.
    *   **Tasks**:
        *   **Project Management System**: Implement `ProjectManager.cs` to handle project creation, stage progression, and completion logic.
        *   **Staff Management System**: Implement `StaffManager.cs` for hiring, assigning, and basic staff training. Port `staffUtils.ts` logic to C#.
        *   **Reward System**: Implement `RewardManager.cs` to handle XP, money, and basic unlock distribution. Port `rewardBalancer.ts` logic.
        *   **Basic UI Integration**: Create essential Unity UI components to display data and trigger actions for Project, Staff, and Reward systems (e.g., Project List, Staff Roster, XP Bar, Money Display).
        *   **Minigame Core Logic**: Port the logic for one simple minigame (e.g., `AcousticTreatmentGame.tsx`) to a C# MonoBehaviour, integrating it with the existing `ScoringManager.cs`.

*   **Phase 2: Advanced Systems & UI**
    *   **Goal**: Implement the more complex simulation systems and rebuild the full UI.
    *   **Dependencies**: Phase 1 complete.
    *   **Tasks**:
        *   **Market Dynamics & Charts System**: Implement `MarketManager.cs` for dynamic trends, sub-genre evolution, and chart calculations. Port `marketService.ts` logic.
        *   **Band Management & Song Creation System**: Implement `BandManager.cs` and `SongManager.cs` for band lifecycle, song attributes, and tour scheduling. Port relevant `useBandManagement.tsx`, `useSongManagement.tsx`, `useTourManagement.ts` logic.
        *   **Studio Progression & Perks System**: Implement `StudioManager.cs` for upgrades, perk trees, and specializations. Port `studioUpgradeService.ts` logic.
        *   **Full UI System Rebuild**: Systematically rebuild all remaining UI components from `src/components/` and `src/modals/` using Unity's native UI (UGUI/UI Toolkit). This includes all panels, modals, and notification systems.
        *   **Advanced Save System**: Enhance `SaveManager.cs` to include cloud integration (using C# SDKs for Firebase/PlayFab), multiple save slots, and versioning.
        *   **Port Remaining Minigame Logic**: Translate the gameplay logic for all other minigames from `src/components/minigames/` to C# MonoBehaviours.
        *   **Port Tutorial Data & Specific Logic**: Convert tutorial content from `src/data/tutorials/` into ScriptableObjects or C# data structures, and integrate any remaining tutorial-specific logic with `TutorialManager.cs`.
        *   **Audio System Specifics**: Implement `AudioManager.cs` to manage background music, chart audio, and UI sound effects, porting logic from `src/utils/audioSystem.ts` and related hooks.

*   **Phase 3: Content & Polish**
    *   **Goal**: Integrate external services, add remaining content, and refine the overall experience.
    *   **Dependencies**: Phases 0, 1, and 2 largely complete.
    *   **Tasks**:
        *   **Integrate PolAI Features**: Implement the `PolAiService.cs` and integrate its functionalities for album art generation, dynamic news/reviews, etc., as per `docs/POLAI_API_INTEGRATION_PLAN.md`.
        *   **Implement Enhanced Minigame Mechanics**: Add specific minigame mechanics like equipment maintenance, staff training, band practice, studio maintenance, and customer service.
        *   **Expand Content**: Introduce new locations, special events, and seasonal/holiday content.
        *   **Performance Optimization & Bug Fixing**: Conduct thorough profiling and optimization passes on the Unity C# codebase. Address any remaining bugs.
        *   **Localization System Implementation**: Implement Unity's Localization System for multi-language support.
        *   **Player Feedback Integration & Balancing**: Integrate player feedback mechanisms and conduct extensive game balancing.