# Current Task: Plan Unity Game Engine Integration

## Current Objectives
- Analyze the feasibility and approach for bridging the existing React/TypeScript project ("Recording Studio Tycoon") into the Unity game engine.
- Evaluate potential bridging technologies, specifically OneJS (based on the provided PDF) and Preactor (based on the provided GitHub link), and any other relevant alternatives.
- Develop a high-level plan for this integration, considering UI, game logic, and multi-platform porting (Windows, Mac, Android, iOS).
- Document this plan, including architectural considerations, potential challenges, and next steps.

## Relevant Context
- **Project:** Recording Studio Tycoon (currently a web application using React and TypeScript).
- **Goal:** Port the game to native desktop and mobile platforms using Unity.
- **Provided Resources:**
    - PDF detailing OneJS for React/TailwindCSS in Unity.
    - GitHub link for Preactor (Unity/React bridging).
- **Task Reference in projectRoadmap.md:** "Plan and Design Unity Game Engine Integration"

## Next Steps
1. **Initiate Proof of Concept (PoC) for ReactUnity/core:**
    - Set up a new Unity project (or a dedicated directory within the current project for the PoC).
    - Install ReactUnity/core package.
    - Create a basic React project structure for Unity integration.
    - Implement a simple UI element from "Recording Studio Tycoon" (e.g., display a static list of staff names).
    - Test basic rendering and communication between a C# script in Unity and a React component.
2.  Evaluate PoC results for ReactUnity/core.
3.  If necessary, conduct a similar PoC for OneJS.
4.  Based on PoC(s), select the preferred bridging technology.
5.  Refine the detailed integration plan and architecture.
6.  Update all relevant documentation (`cline_docs`, `docs/`, `tasks/`).
