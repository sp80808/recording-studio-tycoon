# Unity UI Porting Plan: React to ReactUnity

This document outlines the phased approach and key considerations for porting the existing React-based UI of Recording Studio Tycoon to a Unity environment using ReactUnity.

## 1. Goal

To seamlessly integrate the interactive and data-rich UI of the web application into the Unity game engine, leveraging ReactUnity for rendering and interactivity, while maintaining a single source of truth for UI components as much as possible.

## 2. Phases of Porting

### Phase 1: Proof of Concept (PoC) - Staff List

**Objective:** Validate the basic integration of React components within Unity and establish foundational data flow.

*   **Component Selection:** `StaffList` (or a simplified version of it).
    *   **Rationale:** This component involves displaying a list of items with associated data, which is a common UI pattern and will allow us to test data passing from C# to React, and potentially simple interactions (e.g., clicking a staff member).
*   **Steps (expanding on `userInstructions/setup_unity_reactunity_poc.md`):
    1.  **Create PoC Component:** Develop a minimal `StaffListPoc.tsx` in `src/unity_poc_components/` in the main web project.
        *   This component will initially use dummy data or hardcoded values.
        *   Focus on basic rendering and styling that can be easily translated to ReactUnity's styling system.
    2.  **Synchronization:** Implement a build/copy script (e.g., using `rsync` or a simple Node.js script) to automatically copy `StaffListPoc.tsx` (and its dependencies) to the Unity project's React app directory (e.g., `RecordingStudioTycoon_UnityPoC/react-ui/src/components/`).
    3.  **Integrate into Unity React App:** Modify `RecordingStudioTycoon_UnityPoC/react-ui/src/index.tsx` to import and render `StaffListPoc.tsx`.
    4.  **C# to React Data Passing (Initial):**
        *   In Unity, create a C# script (e.g., `StaffDataLoader.cs`) attached to the `ReactRendererUGUI` GameObject or a parent.
        *   This script will expose a method to pass data (e.g., a JSON string representing staff data) to the ReactUnity renderer.
        *   Explore `ReactUnity.UGUI.ReactRenderer.Properties` or `ReactUnity.Scripting.IVMBridge` for data injection.
    5.  **React to C# Communication (Initial):** Implement a simple callback mechanism from ReactUnity to C# (e.g., clicking a staff member triggers a Unity event).
        *   Investigate `ReactUnity.UGUI.ReactRenderer.Event` or similar event handling within ReactUnity.
    6.  **Styling:** Apply basic styles using ReactUnity's styling properties (similar to CSS).

### Phase 2: Core UI Components Porting

**Objective:** Systematically port essential game UI components.

*   **Component Identification:** Prioritize components based on criticality and dependencies.
    *   **High Priority:** Game main menu, basic HUD elements (money, time), resource display (e.g., `ResourceDisplay.tsx`), simple modals.
    *   **Medium Priority:** Project management UI (`ActiveProject.tsx`, `ProjectCard.tsx`), simpler minigames UI.
    *   **Lower Priority:** Complex charts (`charts/`), advanced minigames UI.
*   **Migration Strategy:**
    *   **Direct Porting:** For simpler, stateless or prop-driven components, attempt direct translation of JSX and styles.
    *   **Refactoring/Rewriting:** For components with complex state management, side effects, or heavy DOM manipulation, consider refactoring them to be more Unity-friendly or rewriting them from scratch within the ReactUnity paradigm.
*   **Data Flow Refinement:** Establish a robust data binding system.
    *   **UniDirectional Flow:** Primarily C# to React for game state, with React triggering C# actions.
    *   **Serialization:** Define clear data models (TypeScript interfaces/types) that can be serialized/deserialized between C# (e.g., JSON.NET) and React.
    *   **State Management:** Decide if global state (e.g., Redux, Zustand) in React will be mirrored or managed purely in Unity C# with React as a view layer.

### Phase 3: Asset Management & Integration

**Objective:** Ensure all visual and audio assets are correctly handled and displayed.

*   **Images:**
    *   **Unity Sprites/Textures:** Load images as Unity Sprites or Textures and expose them to ReactUnity.
    *   **Web-based Assets:** Investigate if ReactUnity can directly reference assets from the web project's `public` folder (less ideal for Unity game builds).
*   **Audio:**
    *   Manage background music and sound effects through Unity's Audio Mixer and expose trigger functions to React components.
*   **Fonts:** Ensure custom fonts used in the web UI are imported and correctly configured in Unity (TextMeshPro).

### Phase 4: Interactions & Input Handling

**Objective:** Replicate all user interactions and input mechanisms.

*   **Button/Click Events:** Standard ReactUnity event handling for UI elements.
*   **Drag & Drop:** Implement drag-and-drop functionalities using Unity's event system or ReactUnity's equivalents.
*   **Keyboard Shortcuts:** Map web UI keyboard shortcuts to Unity's Input System and pass relevant events to ReactUnity.

### Phase 5: Performance Optimization & Testing

**Objective:** Ensure the ported UI performs well and is thoroughly tested.

*   **Performance Monitoring:** Utilize Unity's Profiler to identify UI rendering bottlenecks.
*   **Batching/Optimization:** Apply ReactUnity-specific optimizations (e.g., proper use of `shouldComponentUpdate`, memoization, avoiding unnecessary re-renders).
*   **Unit/Integration Tests:**
    *   **React App:** Continue using Jest/React Testing Library for unit testing individual React components within the `react-ui` project.
    *   **Unity:** Implement Play Mode tests in Unity to verify C# to React data flow and React to C# interaction.
*   **Cross-Platform Compatibility:** Test UI on target platforms (PC, Mac, potentially mobile if applicable).

## 3. Key Considerations

*   **Styling Parity:** How to maintain consistent styling between the original web UI and ReactUnity (CSS-like vs. UXML/USS).
*   **Animation:** Porting existing CSS animations or using Unity's animation system/ReactUnity's animation features.
*   **Modularity:** Keep React components highly modular and decoupled for easier porting and reuse.
*   **Error Handling & Logging:** Implement robust error handling and logging mechanisms across the Unity-ReactUnity bridge.
*   **Build Process:** Automate the build process for both the ReactUnity app and the Unity project for consistent deployments.
*   **Hot Reloading/Development Workflow:** Optimize the development loop for faster iterations (e.g., hot reloading for React components in Unity).

## 4. Future Enhancements

*   **Tooling:** Explore ReactUnity's inspector tools for debugging UI in Unity.
*   **Asset Bundles:** For larger UIs, consider using Unity Asset Bundles to load ReactUnity UI components dynamically.
*   **Localization:** Integrate Unity's localization system with React for multi-language support.

This plan will be a living document, updated as we progress and encounter new challenges or opportunities. 