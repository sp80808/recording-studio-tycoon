# Unity C# Porting Architectural Plan

This document outlines the high-level plan for systematically translating and integrating remaining core gameplay mechanics, UI systems, and essential game logic from the legacy React/TypeScript codebase (`src`) into the Unity C# project.

## Identified Remaining Features from `src` (React/TypeScript) to be ported to Unity C#

Based on the analysis of the `src` directory, `src/hooks/`, and `src/services/`, the following key features require porting:

1.  **Band Management System:**
    *   Creation of player bands.
    *   Managing band members (hiring, firing, assigning session musicians).
    *   Band training and skill development.
    *   Tour scheduling and processing (`useTourManagement.ts`, `useTourScheduling.ts`).
    *   Song creation and release mechanics (`useSongManagement.tsx`).
    *   Band performance calculation and rewards (`useBandPerformance.ts`, `useBandRewards.ts`).
    *   Band reputation tracking (`useBandReputation.ts`).

2.  **Detailed Project Progression & Workflows:**
    *   Multi-project handling and capacity management (`useMultiProjectManagement.tsx`, `ProjectManager.ts`).
    *   Project automation features (e.g., automated staff assignments, daily work execution).
    *   Calculation of optimal staff assignments for projects.
    *   Project completion logic and reporting (`useProjectManagement.ts`, `useProjectManagement.tsx`).

3.  **Market Dynamics & Charts System:**
    *   Dynamic market trend simulation and updates (`useMarketTrends.ts`, `marketService.ts`).
    *   Genre popularity tracking and evolution.
    *   Song chart progression and influence system (`useChartPanelData.ts`, `useChartAudio.ts`).
    *   Audio playback for chart clips.

4.  **Staff Interactions & Training:**
    *   Comprehensive staff hiring and candidate refreshing (`useStaffManagement.ts`, `useStaffManagement.tsx`).
    *   Staff assignment and unassignment to projects.
    *   Staff training progression and skill development.
    *   Staff mood and effectiveness calculations.
    *   Giving bonuses to staff.

5.  **Studio Perks & Upgrades / Progression System:**
    *   Player XP and level progression (`usePlayerProgression.tsx`).
    *   Era transitions and content unlocks (`ProgressionSystem.ts`).
    *   Studio perk trees and specializations (`useStudioPerks.tsx`, `useStudioUpgrades.ts`, `studioUpgradeService.ts`).
    *   Achievement milestones tracking.
    *   Studio expansion purchases (`useStudioExpansion.tsx`).

6.  **Reputation & Relationship Management:**
    *   Dynamic interactions with artists, record labels, and clients (`useRelationships.ts`, `relationshipService.ts`).
    *   Contract generation and management.
    *   Industry reputation tracking and impact on gameplay.
    *   Player favor system.

7.  **Audio System Specifics:**
    *   Management of background music, sound effects, and minigame-specific audio (`useBackgroundMusic.tsx`, `useSound.ts`).
    *   Audio fading and volume control.

8.  **Tutorial System:**
    *   Full integration of tutorial data and step-by-step logic (`useTutorial.ts`).
    *   Displaying tooltips and highlighting UI elements.

9.  **Complex UI Logic & Components:**
    *   Porting of intricate UI interactions and components beyond basic prefabs (e.g., `AnimatedProjectCard.tsx`, `MarketTrendsPanel.tsx`, `StaffManagementPanel.tsx`, `ProgressiveProjectInterface.tsx`, `RewardDisplay.tsx`, various chart components).
    *   Ensuring proper data binding and event handling between C# game logic and Unity UI elements.
    *   Toast notifications (`useToast.ts`).

## Proposed Unity C# Equivalents and Design Considerations

For each identified feature, the approach involves translating the existing React/TypeScript logic into C# classes, leveraging Unity's component-based architecture, and utilizing appropriate design patterns.

*   **Data Models:**
    *   Existing C# data models (e.g., `PlayerData.cs`, `StaffMember.cs`, `ProjectStage.cs`, `MarketTrends.cs`, `OriginalTrackProject.cs`, `LevelUpDetails.cs`) will be extended or new ones created to fully represent the game state.
    *   Static game data (equipment, staff, project templates, eras, perks, market trends) will primarily be defined using Unity `ScriptableObject` assets (e.g., `EquipmentData.cs`, `StaffData.cs`, `MarketTrendData.cs`, `StudioPerkData.cs`, `EraData.cs`, `ProgressionData.cs`).
    *   Complex data structures like dictionaries will continue to use `SerializableDictionary.cs` for proper Unity serialization.

*   **Managers (C# MonoBehaviours - Singletons):**
    *   Dedicated C# MonoBehaviours, often implemented as Singletons, will manage the core logic for each system.
    *   Examples: `BandManager.cs`, `ProjectManager.cs` (for multi-project logic), `StaffManager.cs`, `MarketManager.cs`, `ProgressionManager.cs`, `RelationshipManager.cs`, `AudioManager.cs`, `TutorialManager.cs`.
    *   These managers will interact with `GameManager.cs` and `GameState.cs` to update and retrieve game state.

*   **UI Integration (Unity UI Toolkit/UGUI):**
    *   Individual UI components will be implemented as C# MonoBehaviours.
    *   These components will subscribe to events triggered by the game managers for real-time updates (Observer Pattern).
    *   They will also directly access public properties of `GameManager.Instance.GameState` or other manager Singletons to retrieve current game state information.
    *   User interactions (button clicks, slider changes) will directly trigger public methods on `UIManager.cs` or relevant game managers.
    *   Complex UI elements like waveform displays, fader controls, and knob controls will be rebuilt using Unity's native UI capabilities.

*   **Design Patterns:**
    *   **Singleton Pattern:** For global services like `GameManager`, `AudioManager`, `SaveSystem`, `ScoringManager`, `TutorialManager`.
    *   **Observer Pattern:** For decoupled communication between game systems and UI (e.g., `GameManager` triggering `OnGameStateChanged` events that UI components subscribe to).
    *   **Factory Pattern:** For creating instances of game entities (e.g., staff candidates, projects, equipment).
    *   **ScriptableObject Pattern:** For data-driven design, separating static game data from runtime logic.
    *   **Strategy Pattern:** Potentially for different minigame mechanics or project outcomes.

*   **File Organization within Unity Project:**
    *   `RecordingStudioTycoon_UnityPoC/Assets/Scripts/Core/`: Core game logic (`GameManager.cs`, `GameState.cs`, `SaveSystem.cs`).
    *   `RecordingStudioTycoon_UnityPoC/Assets/Scripts/DataModels/`: C# classes for dynamic game data.
    *   `RecordingStudioTycoon_UnityPoC/Assets/ScriptableObjects/`: ScriptableObject definitions and instances for static game data.
    *   `RecordingStudioTycoon_UnityPoC/Assets/Scripts/Systems/`: Subdirectories for each major game system (e.g., `Project/`, `Staff/`, `Market/`, `Progression/`, `Band/`, `Relationship/`, `Audio/`, `Tutorial/`, `Minigame/`).
    *   `RecordingStudioTycoon_UnityPoC/Assets/Scripts/UI/`: C# scripts for UI components and `UIManager.cs`. Subdirectories for common UI elements (`Common/`) and modals (`Modals/`).
    *   `RecordingStudioTycoon_UnityPoC/Assets/Scripts/Utils/`: Helper static C# classes (e.g., `ProgressionUtils.cs`, `StaffUtils.cs`, `BandUtils.cs`, `ProjectUtils.cs`).

## High-Level Integration Plan (Phased Approach)

The porting process will follow a phased approach, prioritizing core dependencies and critical gameplay loops to ensure a stable and playable build at each stage.

```mermaid
graph TD
    A[Phase 0: Core Foundation (Already in Progress/Complete)] --> B(GameManager & GameState C#)
    B --> C(Basic UI Manager & Player Interaction)
    B --> D(ScriptableObjects & Data Models)

    C --> E[Phase 1: Core Gameplay Loops]
    D --> E

    E --> F(Project Management System)
    E --> G(Staff Management System)
    E --> H(Basic UI for Projects & Staff)

    F --> I[Phase 2: Economic & Progression Systems]
    G --> I

    I --> J(Market Dynamics & Charts System)
    I --> K(Studio Perks & Upgrades)
    I --> L(Reputation & Relationship Management)
    I --> M(Financial Management)

    J --> N[Phase 3: Advanced Gameplay & UI]
    K --> N
    L --> N
    M --> N

    N --> O(Band Management & Tours)
    N --> P(Advanced Minigame Integration)
    N --> Q(Full UI/UX Implementation)
    N --> R(Audio System Enhancements)
    N --> S(Tutorial System Integration)

    O --> T[Phase 4: Polish & Expansion]
    P --> T
    Q --> T
    R --> T
    S --> T

    T --> U(Expanded Content)
    T --> V(Performance Optimization)
    T --> W(Extensive Testing & Balancing)
    T --> X(Cloud Save & Multiplayer Considerations)
```

**Detailed Phased Approach:**

*   **Phase 0: Core Foundation (Already in Progress/Complete)**
    *   Rebuild `GameManager.cs` and `GameState.cs` in C#.
    *   Implement basic `UIManager.cs` for scene/panel management.
    *   Create foundational `ScriptableObject` assets and C# data model files.
    *   Establish basic player character and interaction logic.

*   **Phase 1: Core Gameplay Loops (Project & Staff)**
    *   **Project Management System:** Port `useProjectManagement.ts`, `useMultiProjectManagement.tsx`, and `ProjectManager.ts` logic to C#. Implement project creation, daily work progression, and completion.
    *   **Staff Management System:** Port `useStaffManagement.ts`, `useStaffManagement.tsx` logic to C#. Implement staff hiring, assignment, unassignment, and basic training.
    *   **Basic UI for Projects & Staff:** Create Unity UI elements to display active projects, staff lists, and enable basic interactions (e.g., assigning staff).

*   **Phase 2: Economic & Progression Systems**
    *   **Market Dynamics & Charts System:** Port `useMarketTrends.ts`, `marketService.ts`, `useChartPanelData.ts`, `useChartAudio.ts` logic. Implement dynamic market trends, genre popularity, and song chart mechanics.
    *   **Studio Perks & Upgrades / Progression System:** Port `usePlayerProgression.tsx`, `ProgressionSystem.ts`, `useStudioPerks.tsx`, `useStudioUpgrades.ts`, `studioUpgradeService.ts`, `useStudioExpansion.tsx` logic. Implement player XP, level-ups, era transitions, studio perks, specializations, and milestones.
    *   **Reputation & Relationship Management:** Port `useRelationships.ts`, `relationshipService.ts` logic. Implement client/label interactions, contract generation, and industry reputation.
    *   **Financial Management:** Ensure all income and expenses are correctly integrated with the `GameState` and UI.

*   **Phase 3: Advanced Gameplay & UI**
    *   **Band Management & Tours:** Port `useBandManagement.tsx`, `useSongManagement.tsx`, `useBandPerformance.ts`, `useBandReputation.ts`, `useBandRewards.ts`, `useTourManagement.ts`, `useTourScheduling.ts` logic. Implement band creation, member management, song creation/release, touring, and associated rewards/reputation.
    *   **Advanced Minigame Integration:** Rebuild remaining minigames in Unity C# (e.g., `BeatMakingGame.tsx`, `MasteringGame.tsx`, `MixingBoardGame.tsx`, `VocalRecordingGame.tsx`, `WaveformSculpting.tsx`, `EQMatching.tsx`, `MicrophonePlacement.tsx`, `RhythmTimingGame.tsx`, `SoundWaveGame.tsx`, `RoutingRackMinigame.tsx`). Integrate with `ScoringManager.cs`.
    *   **Full UI/UX Implementation:** Rebuild all complex UI components from `src/components/` (e.g., `AnimatedProjectCard.tsx`, `MarketTrendsPanel.tsx`, `StaffManagementPanel.tsx`, `ProgressiveProjectInterface.tsx`, `RewardDisplay.tsx`, `ProjectCompletionCelebration.tsx`, `SplashScreen.tsx`, `TourCompletionToast.tsx`, `TutorialModal.tsx`, `XPProgressBar.tsx`, chart components, modals like `LevelUpModal.tsx`, `RecruitmentModal.tsx`, `StaffModal.tsx`, `StudioModal.tsx`, `TrainingModal.tsx`). Ensure responsive design and animations.
    *   **Audio System Enhancements:** Implement detailed audio management for all game sounds, background music, and minigame-specific audio using Unity's Audio System.
    *   **Tutorial System Integration:** Port `useTutorial.ts` logic and integrate with `TutorialManager.cs` and `TutorialOverlay.cs` for interactive tutorials.

*   **Phase 4: Polish & Expansion**
    *   **Expanded Content:** Plan for integration of new locations, special events, and seasonal/holiday content.
    *   **Performance Optimization:** Continuous optimization of C# code and Unity engine features.
    *   **Extensive Testing & Balancing:** Thorough testing of all ported systems and game balancing.
    *   **Cloud Save & Multiplayer Considerations:** Implement robust cloud save functionality (replacing Supabase with C# SDKs for Firebase/PlayFab) and lay groundwork for potential multiplayer features.