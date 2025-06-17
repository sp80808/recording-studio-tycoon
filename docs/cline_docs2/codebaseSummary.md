# Codebase Summary

## Overview
This document provides a high-level summary of the "Recording Studio Tycoon" project structure and key components. It will be updated to reflect the integration with Unity.

## Current Web Application Structure (To be detailed further)
- **Frontend:** React components, TypeScript logic.
  - **Key Directories (from `environment_details`):**
    - `src/components/`
    - `src/contexts/`
    - `src/data/`
    - `src/hooks/`
    - `src/integrations/`
    - `src/lib/`
    - `src/pages/`
    - `src/providers/`
    - `src/reducers/`
    - `src/services/`
    - `src/types/`
    - `src/utils/`
- **State Management:** (To be identified - e.g., Context API, Redux, Zustand)
- **Build System:** Vite

## Planned Unity Integration Structure
- **Unity Project:** Standard Unity project structure.
- **Bridged UI:** React/TypeScript components rendered within Unity via a chosen bridging technology (e.g., OneJS, Preactor).
  - Location of transpiled JS/TS code for Unity: (e.g., `{ProjectDir}/OneJS` as per OneJS PDF)
- **Native C# Scripts:** For core game logic, Unity-specific interactions, and communication with the bridged UI.

## Key Components and Their Interactions (To be detailed)
- (Example: Player Management, Studio Management, Song Creation, Staff Hiring, etc. - based on existing game features)

## Data Flow (To be detailed)
- How data moves between the UI (React/TS) and the game logic (Unity C#).
- How game state is persisted and loaded.

## External Dependencies
- **Current Web App:** (List key npm packages from `package.json`)
- **Unity Integration:**
  - Unity Engine
  - Chosen UI Bridging Asset (e.g., OneJS, Preactor)
  - Any other Unity Asset Store packages or third-party libraries.

## Recent Significant Changes
- Initializing `cline_docs` for project documentation.
- Planning phase for Unity game engine integration.

## User Feedback Integration and Its Impact on Development
- (To be documented as feedback is received and incorporated)

## Additional Reference Documents in `cline_docs`
- `projectRoadmap.md`
- `currentTask.md`
- `techStack.md`
- (Future documents like `styleAesthetic.md` or `wireframes.md` will be listed here)
