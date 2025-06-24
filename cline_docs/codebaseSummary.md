# Codebase Summary

This document provides a high-level overview of the project structure, key components, and their interactions.

## Key Components and Their Interactions

### 1. `WebGLCanvas.tsx`
- **Purpose:** Acts as the central bridge between React and PIXI.js.
- **Responsibilities:**
    - Initializes the PIXI Application.
    - Manages the main game state (`GameState`).
    - Instantiates and arranges all major PIXI.js UI components.
    - Contains the main game loop (`setInterval`) for updating game state and animations.
    - Handles window resizing to ensure a responsive layout.

### 2. PIXI.js UI Components (`src/pixi-ui/`)
- **Purpose:** A collection of reusable UI components built with PIXI.js.
- **Key Components:**
    - `PixiGameHeader`: Displays top-level game stats (money, reputation, etc.).
    - `PixiProjectCardsContainer`: Manages and displays active project cards.
    - `PixiMarketTrendsPanel`: Shows current music genre trends.
    - `PixiStaffWellbeingPanel`: Displays staff mood and burnout levels.
    - `PixiStudioPerksPanel`: Allows players to view and unlock studio upgrades.
    - `PixiEventNotifier`: Displays notifications for random game events.
- **Interaction:** These components are instantiated in `WebGLCanvas.tsx` and updated with data from the main `gameState`.

### 3. Game Mechanics (`src/game-mechanics/`)
- **Purpose:** Contains the core logic for the game's systems.
- **Key Systems:**
    - `random-events.ts`: Manages the evaluation and triggering of random events.
    - `studio-perks.ts`: Handles the logic for unlocking and applying studio upgrades.
- **Interaction:** These services are instantiated in `WebGLCanvas.tsx` and are driven by the game state.

## Data Flow
1.  **Game State:** The primary `gameState` is held in `WebGLCanvas.tsx` using a React `useState` hook.
2.  **Game Loop:** A `setInterval` in `WebGLCanvas.tsx` periodically updates the `gameState`.
3.  **UI Updates:** When the `gameState` changes, `WebGLCanvas.tsx` passes the updated data to the relevant PIXI.js components, which then re-render themselves.
4.  **User Input:** User interactions within the PIXI.js canvas (e.g., clicking a button) are handled by event listeners on the PIXI components, which can trigger state changes or other game logic.

## External Dependencies
- **`react` & `react-dom`:** For building the main application structure.
- **`pixi.js`:** For all 2D rendering and canvas management.
- **`typescript`:** For static typing and improved code quality.
- **`vite`:** As the development server and build tool.

## Recent Significant Changes
- **UI Migration:** The core UI has been migrated from a previous implementation to a new PIXI.js-based architecture.
- **Componentization:** The UI has been broken down into modular, reusable PIXI.js components.
- **Integration of Game Mechanics:** The random event and studio perk systems have been integrated into the main application loop.
