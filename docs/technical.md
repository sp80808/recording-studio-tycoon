# Technical Documentation

## Development Environment and Stack

### Technologies Used
- **Primary Game Engine & Logic**: Unity 3D with C#
- **Core Game Logic & State Management**: Unity 3D with C# (modular, data-driven, event-driven architecture)
- **User Interface (Primary)**: Unity's native UI systems (UGUI or UI Toolkit)
- **Styling**: Unity UI styling (e.g., UXML/USS, native UI components)
- **State Management**: Centralized `GameState` (C#) for persistence, managed by `GameManager` and specialized managers.
- **Routing**: Unity Scene Management, C# navigation logic
- **Build Tool**: Unity Editor and Build System
- **Testing**: Unity Test Framework (for C#)
- **Cloud Integration**: C# SDKs for cloud services (e.g., Firebase, PlayFab) for robust cloud saves and advanced features.
- **Animations**: Unity Animation System, C# animation control.
- **Charting**: C# charting libraries or custom Unity UI rendering, with integrated audio playback.
- **Internationalization**: Unity Localization System (C#).
- **Input Handling**: Unity Input System (C#).
- **Multiplayer**: Unity Networking (e.g., Netcode for GameObjects) or dedicated C# backend services for real-time multiplayer.
- **Advanced AI**: C# AI implementations within Unity (e.g., Unity ML-Agents, custom behavior trees).
- **Virtual Reality**: Unity XR Interaction Toolkit (C#).
- **Mobile Platform**: Unity's multi-platform build capabilities (C#).

### Core Components (C#)
- **`GameManager.cs`**: Acts as the central orchestrator, delegating responsibilities to specialized managers (e.g., `RelationshipManager`, `MinigameManager`, `MarketManager`, `ProgressionManager`, `TourManager`, `FinanceManager`, `RewardManager`, `ChartAudioManager`). It uses new events to communicate state changes and trigger actions across the system.
- **`GameState.cs`**: Extensively expanded to include new fields for Studio Perks, Era Progression, Focus Allocation, detailed Skill Tracking, Unlocked Features, Training, Expansion, Milestone tracking, Band and Song Management, Studio Specializations, Industry Prestige, and High Score tracking. It remains the centralized data structure for persistence.
- **`SaveSystem.cs`**: Now includes versioning to ensure backward compatibility and smooth updates across game versions.
- **Specialized Managers**: New and updated managers (e.g., `RelationshipManager`, `MinigameManager`, `MarketManager`, `ProgressionManager`, `TourManager`, `FinanceManager`, `RewardManager`, `ChartAudioManager`) handle specific game functionalities, delegating responsibilities from `GameManager`. Their method signatures and event parameters have been updated to support new features.
- **ScriptableObjects**: Increased use of ScriptableObjects for configuration and static game data (e.g., `MarketTrendData`, `ChartsData`, `ProgressionData`, `StudioPerkData`, `EraData`), promoting a data-driven design.
- **Utility Scripts**: Located in `Assets/Scripts/Utils/`, these static C# classes provide helper functions for various game aspects:
    - `BandUtils.cs`: For generating session musicians and managing band-related data.
    - `ProjectUtils.cs`: For generating new projects based on game state.
    - `ProgressionUtils.cs`: For calculating player XP requirements and managing progression.
    - `StaffUtils.cs`: For generating staff candidates and managing staff-related data.
    - `EraProgression.cs`: Manages the progression through different music eras.
    - `MinigameTriggers.cs`: Handles triggers for various minigames.
    - `RewardManager.cs`: Manages the distribution of rewards.
    - `CloudSaveUtils.cs`: Utilities for cloud saving.
    - `EquipmentUtils.cs`: Utilities for equipment management.
    - `GameUtils.cs`: General game utilities.
    - `PlayerUtils.cs`: Utilities for player-related data.
    - `ProjectReviewUtils.cs`: Utilities for project review.
    - `ProjectWorkUtils.cs`: Utilities for project work.
    - `SerializableDictionary.cs`: Custom dictionary for Unity serialization.

### Development Setup (Unity Specific)
1.  **Unity Project Setup**: Follow the steps in `userInstructions/setup_unity_reactunity_poc.md` to create and configure the Unity project.
2.  **Unity Editor**: Develop C# scripts and design UI directly within the Unity Editor. Run the Unity Editor in Play Mode to test game functionality and UI.

### Key Technical Decisions (Unity Native)
- **Modular, Data-Driven, and Event-Driven Design**: A clear shift towards a highly modular architecture where `GameManager` orchestrates interactions between specialized, independent managers. Data is primarily driven by ScriptableObjects, and communication between systems is event-driven for loose coupling.
- **Centralized `GameState` for Persistence**: `GameState.cs` serves as the single, comprehensive source of truth for all dynamic game data, ensuring consistent persistence across sessions with versioning.
- **Delegation of Responsibilities**: `GameManager` delegates complex functionalities to specialized managers, improving code organization, maintainability, and scalability.
- **Increased Use of ScriptableObjects**: For static data and configurations, promoting easier content creation and balancing.
- **Refined Event-Driven Logic**: Especially for the Relationship System and consolidated Market/Chart systems, enabling flexible and responsive interactions.
- **Separation of Concerns**: Game logic and state management are primarily handled in C# within Unity. UI rendering and interaction are handled by dedicated C# UI scripts and Unity's native UI system.
- **Single Source of Truth (Game State)**: `GameManager.Instance.GameState` remains the central source of truth for all dynamic game data.
- **Event-Driven Communication**: Favor C# events for decoupled communication between game systems and UI.

### Design Patterns in Use
- **Observer Pattern**: Extensively used for event handling and state changes (e.g., notifications, game events, updates from specialized managers).
- **Factory Pattern**: For creating instances of game entities (e.g., staff, projects, equipment, bands, songs).
- **Singleton Pattern**: For managing global services like `GameManager`, `AudioSystem`, `SaveSystem`, `RelationshipManager`, `MinigameManager`, `MarketManager`, `ProgressionManager`, `TourManager`, `FinanceManager`, `RewardManager`, `ChartAudioManager`.
- **Strategy Pattern**: For implementing different minigame mechanics or project outcomes.
- **ScriptableObject Pattern**: Heavily utilized for data-driven design, separating data from logic and enabling easy configuration and content management.
- **Command Pattern**: (Potentially for undo/redo or complex player actions).
- **State Pattern**: (For managing different states of game entities or systems).
- **Dependency Injection**: (For managing dependencies between services and components).

### Technical Constraints
- **Performance**: Optimizing for smooth animations and responsive UI, especially on lower-end devices and mobile platforms.
- **Scalability**: Designing systems to accommodate future content expansions (new eras, equipment, minigames, locations, events) and potential multiplayer features.
- **Maintainability**: Writing clean, well-documented, and testable code.
- **Offline Support**: Enhanced offline functionality for core gameplay, with cloud sync requiring internet.
- **Security**: Implementing encryption for save data and secure communication for multiplayer features.
- **Cross-Platform Compatibility**: Ensuring consistent experience across desktop, web, and mobile (if implemented).
- **Data Management**: Efficient handling of large save files and incremental updates.

## Minigame Scoring and Feedback System
- `ScoringManager` (singleton):
  - Handles score, accuracy, and feedback updates for all minigames.
  - Exposes events for UI to subscribe to real-time and end-of-minigame updates.
  - Minigames call `UpdateScore` and `CompleteMinigame` to trigger feedback.
  - Supports actionable tips and color cues for user actions.

## Tutorial Overlay System
- `TutorialManager` (singleton):
  - Manages tutorial steps, progress, and completion state.
  - Allows minigames to register and start tutorials.
  - Exposes events for UI to update overlays.
- `TutorialOverlay` (UI):
  - Displays tooltips and highlights UI elements for each tutorial step.
  - Dims background and provides navigation controls.
  - Finds UI elements by name or tag for highlighting.

## PolAI Integration: Image and Text Generation
- `PolAiService` exposes `GenerateAlbumArt` for async album art generation via Pollinations.AI image API, integrated with `AlbumArtGeneratorUI` for user-driven album art creation and assignment.
- `PolAiService` exposes `GenerateTextAsync(string prompt)` for async text generation via Pollinations.AI API.
- `TextGenerationManager` (singleton) provides async, cached methods for generating reviews, news, bios, and descriptions.
- Uses prompt templates for each use case (review, news, bio, description).
- Caches results in-memory to minimize API calls.
- UI panels (album/song info, news feed, band member info, item info) call TextGenerationManager for dynamic text content.
- Handles error states and loading indicators in UI.

## UI/UX Enhancements for PolAI Features
- News feed panel (MainMenuPanel): Unicode icons, separators, scrollable container, fade-in animation, and highlighted latest item for AI-generated news.
- Description panels (ProjectCardUI, StudioPanel): Section headers with icons, rounded/light background boxes, larger italicized text, and fade-in animation for AI-generated descriptions.
- All enhancements are commented in code for easy future adjustment.
