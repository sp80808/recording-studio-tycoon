# Technical Documentation

## Development Environment and Stack

### Technologies Used
- **Primary Game Engine & Logic**: Unity 3D with C#
- **Core Game Logic & State Management**: C# (`GameManager.cs`, `GameState.cs`)
- **User Interface (Primary)**: Unity's native UI systems (UGUI or UI Toolkit)
- **User Interface (Secondary/Optional)**: (Removed - no longer using ReactUnity)
- **Styling**: Unity UI styling (e.g., UXML/USS, native UI components)
- **State Management**: C# `GameState` and `GameManager` in Unity.
- **Routing**: Unity Scene Management, C# navigation logic
- **Build Tool**: Unity Editor and Build System
- **Testing**: Unity Test Framework (for C#)
- **Cloud Integration**: C# SDKs for cloud services (e.g., Firebase, PlayFab) for robust cloud saves and advanced features.
- **Animations**: Unity Animation System, C# animation control.
- **Charting**: C# charting libraries or custom Unity UI rendering.
- **Internationalization**: Unity Localization System (C#).
- **Input Handling**: Unity Input System (C#).
- **Multiplayer**: Unity Networking (e.g., Netcode for GameObjects) or dedicated C# backend services for real-time multiplayer.
- **Advanced AI**: C# AI implementations within Unity (e.g., Unity ML-Agents, custom behavior trees).
- **Virtual Reality**: Unity XR Interaction Toolkit (C#).
- **Mobile Platform**: Unity's multi-platform build capabilities (C#).

### Unity Environment and ReactUnity Integration

This section details the specific technical setup for the Unity game engine and its integration with ReactUnity for UI rendering. While ReactUnity is an *optional* UI framework for specific complex elements, the core game logic and much of the UI will be built natively in C# within Unity.

#### Core Components (C#)
- **`GameManager.cs`**: A Singleton MonoBehaviour responsible for initializing the game, managing overall game flow, and orchestrating interactions between various game systems. It acts as the primary interface for C# game logic and data, triggering events (`OnGameStateChanged`, `OnPlayerLevelUp`) to notify relevant Unity UI components or ReactUnity elements of state modifications.
- **`GameState.cs`**: A serializable class (`[System.Serializable]`) that defines the entire game's state. It holds all dynamic data, including player data, studio information, projects, staff, and more. It is managed by `GameManager` and updated by various game systems. Complex data structures like dictionaries are handled using a custom `SerializableDictionary` to ensure proper Unity serialization.
- **Utility Scripts**: Located in `Assets/Scripts/Utils/`, these static C# classes provide helper functions for various game aspects:
    - `BandUtils.cs`: For generating session musicians and managing band-related data.
    - `ProjectUtils.cs`: For generating new projects based on game state.
    - `ProgressionUtils.cs`: For calculating player XP requirements and managing progression.
    - `StaffUtils.cs`: For generating staff candidates and managing staff-related data.

#### UI Data Flow (C# and Unity UI)
- **Event-Driven Updates**: `GameManager` triggers C# events (`OnGameStateChanged`, `OnPlayerLevelUp`, `OnGameDataChanged`) when the `GameState` changes. `UIManager` and other Unity UI components subscribe to these events to receive updated game data and refresh their display.
- **Direct Property Access**: Unity UI components can directly access public properties of `GameManager.Instance` to retrieve current game state information.
- **Direct Method Calls**: User interactions with Unity UI elements (e.g., button clicks, slider changes) directly trigger public methods on `UIManager` or `GameManager` to perform game actions or modify settings.

### Development Setup (Unity Specific)
1.  **Unity Project Setup**: Follow the steps in `userInstructions/setup_unity_reactunity_poc.md` to create and configure the Unity project.
2.  **Unity Editor**: Develop C# scripts and design UI directly within the Unity Editor. Run the Unity Editor in Play Mode to test game functionality and UI.

### Key Technical Decisions (Unity Native)
- **Separation of Concerns**: Game logic and state management are primarily handled in C# within Unity. UI rendering and interaction are handled by dedicated C# UI scripts and Unity's native UI system.
- **Single Source of Truth (Game State)**: `GameManager.Instance.GameState` remains the central source of truth for all dynamic game data.
- **Event-Driven Communication**: Favor C# events for decoupled communication between game systems and UI.

### Design Patterns in Use
- **Observer Pattern**: For event handling and state changes (e.g., notifications, game events).
- **Factory Pattern**: For creating instances of game entities (e.g., staff, projects, equipment).
- **Singleton Pattern**: For managing global services like the Audio System or Save System.
- **Strategy Pattern**: For implementing different minigame mechanics or project outcomes.
- **ScriptableObject Pattern**: For data-driven design, separating data from logic.

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
