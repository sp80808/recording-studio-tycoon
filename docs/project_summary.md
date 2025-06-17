# Project Summary: Recording Studio Tycoon

This document provides a comprehensive overview of the Recording Studio Tycoon game, summarizing its product requirements, system architecture, technical implementation, and development roadmap.

## 1. Project Overview

Recording Studio Tycoon is a simulation game where players manage and grow their own recording studio. The core objectives include:
- Simulating the experience of managing a recording studio, including financial, staff, and project management.
- Providing engaging gameplay through resource allocation, staff development, and project completion.
- Advancing through different music eras, unlocking new technologies, equipment, and challenges.
- Featuring interactive minigames that enhance skill-based challenges.
- Incorporating a dynamic music market that influences project success and genre popularity.
- Presenting an intuitive and engaging user interface with visual feedback and animations.
- Ensuring robust local and cloud save functionality.

## 2. System Architecture

The game's architecture is component-based, primarily built with React, and structured around several interconnected systems:

- **User Interface (UI)**: React components for player interaction and visual display.
- **Game Logic**: Core rules, calculations, and state transitions, orchestrating system interactions.
- **Game State Management**: Manages global game data consistency (using Zustand/Context).
- **Game Data**: Static data for game entities (equipment, staff, projects).
- **Save System**: Handles persistence to local storage and potentially Supabase for cloud saves.
- **Audio System**: Manages background music, sound effects, and minigame-specific audio.
- **Minigame System**: Manages interactive minigames, their logic, and integration.
- **Progression System**: Tracks player and studio progress, era transitions, and content unlocks.
- **Staff Management System**: Handles hiring, training, assignment, and specialized staff roles.
- **Project Management System**: Oversees music project lifecycles, including original song production.
- **Reward System**: Distributes XP, money, and unlockable items.
- **Charts & Market System**: Simulates music industry trends, song charts, and artist contact.
- **Band & Song Creation System**: Manages player-created bands, song development, and chart success.
- **Dynamic Market Trends System**: Advanced simulation with sub-genre evolution and player impact.
- **Reputation & Relationship Management**: Manages relationships with clients, labels, and industry entities.
- **Studio Perks & Specializations**: Deep progression with perk trees, specializations, and prestige.

**Component Relationships**: UI components interact with Game Logic, which depends on various other systems. Save, Minigame, Progression, Staff, Project, Reward, Chart, Band, Market Trends, Relationship, and Studio Upgrade systems are all interconnected.

**Workflow**: The game initializes by loading save data or starting a new game. Player actions trigger game logic, updating the state and UI. Background systems operate continuously, and minigames offer interactive challenges.

## 3. Technical Stack and Decisions

The game is developed using modern web technologies:

-   **Frontend**: React with TypeScript.
-   **Styling**: Tailwind CSS, Shadcn UI.
-   **State Management**: Zustand, React Context API.
-   **Routing**: React Router DOM.
-   **Build Tool**: Vite.
-   **Testing**: Jest, React Testing Library.
-   **Cloud Integration**: Supabase (for cloud saves).
-   **Animations**: Framer Motion.
-   **Charting**: Recharts.
-   **Internationalization**: i18next (partially implemented).

**App Icon**: The app icon uses an inline SVG music symbol emoji for consistency and simplified maintenance.

**Key Technical Decisions**:
-   **Component-Based Architecture**: Modular and reusable UI.
-   **TypeScript**: Enhanced code quality and maintainability.
-   **Atomic Design Principles**: Scalable UI component organization.
-   **Functional Components and Hooks**: Modern React development practices.
-   **Strict Type Safety and Error Handling**: Robustness and reliability.

**Design Patterns in Use**: Observer, Factory, Singleton, Strategy, Provider.

## 4. Core Gameplay and Systems Highlights

-   **Staff Management**: Comprehensive system for hiring, training, assigning, and developing staff with specialized roles. Includes advanced filtering, sorting, and visual feedback for optimal assignments.
-   **Project Management**: Dynamic project generation, real-time market trend integration, and type-safe handling of genres and subgenres.
-   **Minigames**: Enhanced with a variety of interactive challenges like Microphone Placement, Mastering Chain Optimization, Sound Design Synthesis, and Guitar Pedal Board.
-   **Progressive Project Interface**: Improved UI/UX for active project management.
-   **Era Progression**: Players advance through musical eras, each offering unique challenges and unlocks.
-   **Charts & Market System**: Dynamic market influences genre popularity, artist demand, and project success, with detailed chart functionality.

## 5. Advanced Systems (Phase 2 Implementation)

Recent development has focused on introducing strategic depth:

-   **Dynamic Market Trends**: Comprehensive types and services (`src/types/marketTrends.ts`, `src/services/marketService.ts`) for managing sub-genre evolution, player impact, and contract modifiers.
-   **Reputation & Relationship Management**: Robust types and services (`src/types/relationships.ts`, `src/services/relationshipService.ts`) for managing client/label interactions, contract generation, and industry reputation.
-   **Studio Perks & Specializations**: Extensive types and services (`src/types/studioPerks.ts`, `src/services/studioUpgradeService.ts`) for perk trees, specializations, industry prestige, and achievement milestones.

## 6. Development Roadmap and Progress

The project is currently focusing on enhancing existing systems and implementing planned features.

**Completed / In Progress Features**:
-   Core game mechanics (staff, project, resource management, skill systems, equipment upgrades).
-   Phase 2 Advanced Systems (Market Trends, Relationships, Studio Perks) are largely implemented.
-   Enhanced Minigames (Rhythm-based recording, Mixing board challenges, Microphone Placement, Mastering Chain, Sound Design, Guitar Pedal Board).
-   Expanded content (new equipment, staff roles, project types).
-   Flesh out Band / Song Creation / Charts Functionality (more diverse artists, expanded genre types, enhanced chart logic).
-   Staff Assignment UX Improvements (advanced filtering, sorting, tooltips, performance prediction).

**What's Left to Build (In-Depth Tasks List - Key Items)**:
-   **Save System Improvements**: Cloud sync, multiple save slots, versioning, auto-save, encryption, cross-device sync.
-   **UI/UX Enhancements**: Responsive design, accessibility, performance, mobile-friendly controls, keyboard shortcuts, gamepad support.
-   **Core Gameplay**: Band management, studio expansion.
-   **Phase 2 Systems**: Full UI integration, extensive testing and balancing, player feedback integration.
-   **Advanced Save System**: Data compression, incremental saves, export/import, analytics, conflict resolution, backup.
-   **Enhanced Minigames**: Equipment maintenance, staff training, band practice, studio maintenance, customer service.
-   **Expanded Content**: New locations, special events, seasonal/holiday content.
-   **Band / Song / Charts Functionality**: Player band creation/management, song creation/release mechanics, integration of player songs into charts, chart progression/influence system.
-   **Future Considerations**: Multiplayer features, advanced AI integration, Virtual Reality support, Mobile Platform optimization.

**Current Status**: Initial setup and core mechanics are functional. Focus is on enhancing existing systems and implementing planned features.

**Next Steps**:
1.  Continue with development tasks outlined in the detailed task list.
2.  Regularly review and update documentation.
3.  Implement player band creation and management.
4.  Implement song creation and release mechanics.
5.  Integrate player songs into charts.
6.  Develop chart progression and influence system. 