# System Patterns: Recording Studio Tycoon

**Version:** 0.2
**Date:** 2025-06-11
**Related Document:** `projectbrief.md`, `productContext.md`, `MULTI_PROJECT_AUTOMATION_PLAN.md`, `PROJECT_MANAGEMENT_WORKFLOW.md`

## 1. System Architecture Overview

The game is a single-player, client-side application built with React and TypeScript, focusing on managing a recording studio. The architecture is evolving to support complex simulations including multi-project management and staff automation.

**Key Architectural Considerations:**
*   **State Management:** A robust state management solution is crucial. Currently uses custom React hooks and Context API. The introduction of `EnhancedGameState` (from `MULTI_PROJECT_AUTOMATION_PLAN.md`) for managing multiple concurrent projects, staff automation states, and animation states will significantly increase complexity, potentially requiring more advanced solutions or careful structuring of existing ones.
*   **Component-Based UI:** The UI is built using reusable React components for game elements, menus, and the new multi-project dashboard.
*   **Game Loop & Time Progression:** A central game loop (managed via `useGameLogic` and related hooks) manages time progression, event updates, and AI actions, including the new automated work cycles for staff.
*   **Data Structures:** Clear and well-defined TypeScript interfaces for game entities (equipment, artists, staff, projects) are essential. The `Project` structure is detailed in `PROJECT_MANAGEMENT_WORKFLOW.md` and will be central to the multi-project system.
*   **Modularity:** Game systems (e.g., recording, mixing, research, finance, multi-project management, staff automation) are designed as modularly as possible using custom hooks and services.
*   **Staff Automation Engine:** A dedicated engine (`StaffAutomationEngine.ts` as planned) will handle autonomous work by staff members, including optimal staff assignment, smart focus calculation, and automatic stage transitions for projects.
*   **Advanced Animation System:** An integrated system (`ProjectAnimationController.ts` as planned) will provide visual feedback for staff activity, project progress, and focus adjustments in the multi-project environment.

## 2. Key Technical Decisions

*   **Language:** TypeScript.
*   **Framework:** React (confirmed by existing codebase).
*   **Styling:** Tailwind CSS is the primary utility CSS framework, supplemented by plain CSS/CSS Modules for component-specific styles. The emoji-stylized design influences styling choices.
*   **Persistence:** LocalStorage for saving game state. The save/load system will need to be updated to handle the `EnhancedGameState` structure.
*   **Animation:** CSS animations/transitions for UI effects. JavaScript-driven animations (potentially using `requestAnimationFrame` and a dedicated controller) for complex game-logic-tied animations, especially for the multi-project automation feedback.
*   **State Management (Re-evaluation):** While custom hooks and Context API are in use, the significant increase in state complexity with multi-project automation may necessitate a review to ensure performance and maintainability. Options like Zustand or Jotai could be considered if current methods become unwieldy, or a more rigorously structured custom hook/context system.

## 3. Design Patterns in Use (or to be introduced)

*   **Entity-Component-System (ECS) (Conceptual):** Remains a useful mental model for game entities.
*   **Observer Pattern:** For handling events and updating UI in response to state changes (e.g., project progress, staff activity).
*   **State Pattern:** For managing states of equipment, artists, and now projects (e.g., active, pending, completed, automated vs. manual).
*   **Factory Pattern:** For creating instances of game entities.
*   **Singleton Pattern:** For global managers or services like `TimeManager`, `ProjectManagerService`, or `StaffAutomationEngine`.
*   **Strategy Pattern:** Potentially for different staff assignment algorithms, focus allocation strategies within the `StaffAutomationEngine`, or different automation modes (Full Auto, Semi-Auto).
*   **Command Pattern:** Could be useful for queuing actions related to automated tasks or player commands in the multi-project system.

## 4. Component Relationships (High-Level)

*   **`useGameState` / `useGameLogic` (Core Hooks):** Orchestrate the overall game state (`EnhancedGameState`), game loop, and interactions between different systems.
*   **`UIManager` (UI Components):** Renders the game state, including the new multi-project dashboard and project cards, and handles player input.
*   **`DataStore` (Implicit via `useGameState`):** Holds all game data, now structured according to `EnhancedGameState` to support multiple projects, automation settings, and animation states.
*   **`TimeSystem`:** Manages game time, day/night cycles, and timed events, including triggering automated work cycles.
*   **`ProjectManagerService` (Planned):** Manages the lifecycle of multiple concurrent projects, including creation, scheduling, prioritization, and capacity calculation.
*   **`StaffAutomationEngine` (Planned):** Manages autonomous work by staff on assigned projects. Includes sub-systems for:
    *   `StaffAssignmentOptimizer`
    *   `SmartFocusCalculator`
    *   `WorkloadBalancer`
*   **`ProjectAnimationController` (Planned):** Manages and triggers visual feedback animations for project work, staff activity, and progress on the UI.
*   **`EquipmentSystem`:** Manages equipment data, state, and interactions, now potentially utilized across multiple concurrent projects.
*   **`ArtistSystem` / `StaffSystem` (e.g., `useStaffManagement`):** Manages artist and staff data, mood, skills, energy, and assignments, now crucial for the automation engine.
*   **`RecordingSystem` / `ProductionSystem` (Conceptual, part of `useStageWork`):** Manages the process of work stages within projects, now potentially invoked by the automation engine.
*   **`ResearchSystem`:** Manages equipment modification research.

## 5. Critical Implementation Paths

*   **Core Game Loop & Time Progression:** Ensuring smooth progression with potentially many automated actions per time step.
*   **State Management for Multi-Project System:** Preventing bugs related to inconsistent or incorrect state across multiple concurrent projects. Ensuring efficient updates to `EnhancedGameState`.
*   **UI Responsiveness & Clarity:** Keeping the UI performant, especially the multi-project dashboard. Clearly conveying information about multiple projects and automation status.
*   **Data Integrity:** Ensuring game data (especially multi-project state) is saved and loaded correctly.
*   **Animation System Performance:** Implementing a flexible and performant animation system for visual feedback on automated tasks without degrading UI responsiveness.
*   **Equipment Modification System:** Designing and implementing the UI and logic for researching and applying equipment mods.
*   **Staff Automation AI:** Developing robust and balanced algorithms for staff assignment, focus allocation, and workload management.
*   **Concurrency Management:** Handling potential conflicts or dependencies if staff/equipment are shared or if actions across projects have overlapping effects.
*   **Performance of Automated Cycles:** Ensuring that processing automated work for multiple projects per game tick is efficient.
