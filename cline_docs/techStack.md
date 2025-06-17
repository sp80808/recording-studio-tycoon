# Technology Stack and Architecture Decisions

## Current Web Application Stack
- **Frontend Framework:** React
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Assumed, based on PDF context, to be confirmed)
- **Build Tool:** Vite (Inferred from `vite.config.ts`)
- **Package Manager:** npm (Inferred from `package-lock.json`) or bun (Inferred from `bun.lockb`) - To be confirmed.

## Planned Unity Integration Stack
- **Game Engine:** Unity
- **UI Bridging Technology:** TBD (Investigating OneJS, Preactor, others)
  - **OneJS Details (from PDF):**
    - Uses Jint (C# JavaScript engine)
    - Interprets transpiled TypeScript
    - Uses Unity's UI Toolkit as DOM structure
    - Allows C#/JS interoperability
    - Potential limitations: Some CSS transitions, scroll overflow (requires Scrollview element)
    - Cost: $70 USD (Unity Asset Store)
  - **Preactor Details (from GitHub):**
    - (Information still pending)
  - **ReactUnity/core Details (from user summary & GitHub):**
    - Enables declarative UI in Unity3D using React.
    - Renders to UGUI (via `ReactRendererUGUI` component).
    - Likely uses QuickJS engine (based on `com.reactunity.quickjs` package).
    - Supports TypeScript, Redux, i18next, react-router.
    - Supports a subset of CSS and Flexbox.
    - Requirements: Node 20 (dev only), Unity 2021.3, TMPro v3.
    - Cost: Free (Open Source).
    - Known Issue: Low documentation coverage.
- **Cross-Platform Export:** Windows, Mac, Android, iOS (via Unity)

## Architectural Decisions
- **UI Rendering in Unity:** To be determined based on the chosen bridging technology. The goal is to reuse as much of the existing React/TS UI components as possible.
- **State Management:** Determine how state will be managed between the React UI and Unity game logic. The OneJS PDF provides an example using `useEventfulState` and C# events.
- **Communication Layer:** Define the interface and methods for communication between the TypeScript/JavaScript UI code and C# Unity scripts.

## Justifications
- (To be filled as decisions are made)
