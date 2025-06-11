# System Patterns: Recording Studio Tycoon

**Version:** 0.1
**Date:** 2025-06-11
**Related Document:** `projectbrief.md`, `productContext.md`

## 1. System Architecture Overview

The game is expected to be a single-player, client-side application, likely built with a modern JavaScript framework (e.g., React, Vue, or Svelte) for the UI, and plain JavaScript/TypeScript for game logic.

**Key Architectural Considerations:**
*   **State Management:** A robust state management solution will be crucial for handling game data (finances, equipment, artists, projects, time, etc.). This could be a dedicated library (Redux, Zustand, Pinia) or framework-provided solutions.
*   **Component-Based UI:** The UI will be built using reusable components to represent different game elements (studio rooms, equipment, artist profiles, menus).
*   **Game Loop:** A central game loop will manage time progression, event updates, and AI actions.
*   **Data Structures:** Clear and well-defined data structures for game entities (equipment, artists, staff, songs, projects) are essential.
*   **Modularity:** Game systems (e.g., recording, mixing, research, finance) should be designed as modularly as possible to allow for easier expansion and maintenance.

## 2. Key Technical Decisions (Anticipated)

*   **Language:** JavaScript/TypeScript.
*   **Framework:** To be determined by existing codebase (likely React given `App.tsx` and `*.tsx` files).
*   **Styling:** CSS-in-JS, utility CSS (like Tailwind CSS), or traditional CSS, depending on existing patterns. The emoji-stylized design will influence styling choices.
*   **Persistence:** LocalStorage for saving game state, potentially with options for export/import.
*   **Animation:** CSS animations/transitions for simple UI effects. JavaScript-driven animation for more complex or game-logic-tied animations (e.g., sprite-like emoji animations).

## 3. Design Patterns in Use (or to be introduced)

*   **Entity-Component-System (ECS) (Conceptual):** While not a strict ECS, the idea of entities (equipment, artists) having components (stats, state, mods) that are processed by systems (recording system, maintenance system) is a useful mental model.
*   **Observer Pattern:** For handling events and updating UI elements in response to state changes (e.g., artist happiness changes triggering an animation).
*   **State Pattern:** Useful for managing states of equipment (e.g., normal, broken, modified) or artists (e.g., happy, neutral, unhappy).
*   **Factory Pattern:** For creating instances of game entities like equipment or artists, especially if they have complex initialization.
*   **Singleton Pattern:** For global managers like a `GameManager` or `TimeManager`.

## 4. Component Relationships (High-Level)

*   **`GameManager` (or equivalent main game logic hook/context):** Orchestrates the game state, game loop, and interactions between different systems.
*   **`UIManager` (or UI components):** Renders the game state and handles player input.
*   **`DataStore` (or state management solution):** Holds all game data.
*   **`TimeSystem`:** Manages game time, day/night cycles, and timed events.
*   **`EquipmentSystem`:** Manages equipment data, state (including condition, mods), and interactions.
*   **`ArtistSystem`:** Manages artist data, mood, skills, and interactions.
*   **`RecordingSystem`:** Manages the process of recording tracks, involving artists, equipment, and engineers.
*   **`ResearchSystem`:** Manages the new equipment modification research process.

## 5. Critical Implementation Paths

*   **Core Game Loop:** Ensuring the game progresses smoothly and events are handled correctly.
*   **State Management:** Preventing bugs related to inconsistent or incorrect game state.
*   **UI Responsiveness:** Keeping the UI performant and providing good feedback.
*   **Data Integrity:** Ensuring game data is saved and loaded correctly.
*   **Animation System:** Implementing a flexible way to add visual flair to emojis and UI elements without performance degradation.
*   **Equipment Modification System:** Designing a data structure that allows for equipment to have base stats and then be augmented or altered by modifications. This includes how mods are researched, applied, and how they affect gameplay.
