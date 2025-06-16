# Stability and UI Refactoring Plan

**Version:** 1.0
**Date:** June 16, 2025
**Author:** GitHub Copilot (Lead Systems Engineer)

## 1. Critical Bug Extermination Strategy

This section details the plan to address critical errors preventing stable application deployment.

### 1.1. `ReferenceError: lastMilestone is not defined`

*   **Objective:** Identify the source of this JavaScript error and ensure `lastMilestone` is correctly defined and accessible in its intended scope.
*   **Steps:**
    1.  **Code Search:** Utilize `grep_search` to locate all instances of `lastMilestone` within the `src` directory, focusing on `.ts` and `.tsx` files.
        *   `grep_search query="lastMilestone" includePattern="src/**/*.tsx"`
        *   `grep_search query="lastMilestone" includePattern="src/**/*.ts"`
    2.  **Contextual Analysis:** For each found instance:
        *   Determine if `lastMilestone` is intended to be a state variable, prop, local variable, or part of a larger data structure.
        *   Examine the surrounding code to understand its expected role (e.g., in project progress calculation, player level-up logic, event triggering).
    3.  **Identify Definition Point:** Pinpoint where `lastMilestone` *should* be defined or initialized.
        *   If it's a state variable (e.g., in `useGameState` or a component's local state), ensure it has an initial value.
        *   If it's passed as a prop, trace its origin up the component tree.
        *   If it's a local variable, verify its scope and ensure it's declared before use.
    4.  **Hypothesized Files for Inspection (based on typical game logic):**
        *   `src/hooks/useGameState.ts` (or similar global state management)
        *   `src/hooks/useGameLogic.ts`
        *   `src/hooks/useProjectManagement.ts`
        *   `src/components/ProgressiveProjectInterface.tsx`
        *   `src/components/ProjectList.tsx`
        *   Files related to player experience, leveling, or skill trees.
    5.  **Rectification:**
        *   If `lastMilestone` is missing an initialization, provide a sensible default.
        *   If it's a scoping issue, refactor the code to ensure it's accessible.
        *   If it's a prop-drilling issue, ensure it's passed correctly.
    6.  **Verification:** After applying the fix, run the application and test scenarios related to project completion, player progression, and any other areas where `lastMilestone` might be involved to ensure the error is resolved and the game logic functions as expected.

### 1.2. Audio Asset 404 Errors & Path Correction

*   **Objective:** Eliminate all 404 errors for audio assets by correcting paths in the codebase, ensuring they accurately reflect the file structure in `public/audio/`.
*   **Steps:**
    1.  **Audit `audioSystem.ts`:**
        *   Read `src/utils/audioSystem.ts`.
        *   Focus on the `audioFiles` array within the `preloadAudioFiles` method. This is the primary source of truth for audio asset paths.
    2.  **Verify File Existence:**
        *   Use `list_dir` to get the contents of `public/audio/ui sfx/` and `public/audio/drums/`.
        *   Compare the listed files with the paths defined in `audioSystem.ts`.
    3.  **Path Correction Strategy:**
        *   **Direct Matches:** For files that exist but have path issues (e.g., `warning-chime.wav` in `ui sfx` directory):
            *   Ensure the path in `audioSystem.ts` is an exact match, including spaces in directory names (e.g., `path: '/audio/ui sfx/warning-chime.wav'`). Do not use `%20` or other URL encodings in the string literals within the code. The `fetch` API will handle this correctly.
        *   **Missing Files:** For files referenced in `audioSystem.ts` but not found in the `public/audio/` directories (e.g., `GS_NT_PERC_03.wav` if it's truly missing):
            *   **Option A (Preferred if replacements exist):** Replace the path with an existing, suitable audio file. Add a comment indicating the original file was missing.
            *   **Option B (If no replacement):** Comment out the line referencing the missing audio file. Add a comment indicating the file is missing.
    4.  **Implementation:**
        *   Use `insert_edit_into_file` to modify `src/utils/audioSystem.ts` with the corrected paths and commented-out missing files.
    5.  **Verification:** After changes, run the application and check the browser's developer console Network tab to confirm that all 404 errors for audio files are gone and that sounds play as expected.

## 2. Mobile UI Refactoring Blueprint

This section outlines the plan to refactor the main interface for a touch-first mobile experience.

### 2.1. Mobile Detection Strategy

*   Utilize the existing `src/hooks/useMediaQuery.ts` hook.
*   The hook will check for `(max-width: 768px)` to identify mobile viewports.
*   This boolean state (`isMobile`) will be used in `MainGameContent.tsx` for conditional rendering.

### 2.2. UI Refactoring Visual Block Representation

**Current Desktop UI (Conceptual - 3 Columns):**

```
+-----------------------------------------------------------------------------------+
| GameHeader (Resources, Settings Button)                                           |
+-----------------------------------------------------------------------------------+
| ProjectList (Left Panel) | ProgressiveProjectInterface (Center) | RightPanel (Right Panel) |
| (Projects, Start New)    | (Active Project, Actions, Studio)  | (Staff, Equip, Skills) |
|                          |                                      |                          |
+-----------------------------------------------------------------------------------+
```

**New Mobile UI (Conceptual - Single Column with Arrow Navigation):**

```
+------------------------------------------------------+
| GameHeader (Resources, Settings Button)              |
+------------------------------------------------------+
| <   Current_Tab_Name (e.g., "Studio")   >            |  <- MobileArrowNavigation
+------------------------------------------------------+
|                                                      |
|         Active Panel Content                         |
|         (Projects / Studio / Management)             |
|                                                      |
+------------------------------------------------------+
```

*   **Panels/Tabs on Mobile:**
    1.  **"Projects"**: Content from `ProjectList.tsx`
    2.  **"Studio"**: Content from `ProgressiveProjectInterface.tsx` (Default View)
    3.  **"Management"**: Content from `RightPanel.tsx`
*   The `GameHeader` remains visible on both mobile and desktop.

### 2.3. Component Logic (Mobile)

*   **`MainGameContent.tsx`:**
    *   Will use `isMobile` state from `useMediaQuery`.
    *   Will maintain an `activeMobileTabIndex` state (e.g., 0 for Projects, 1 for Studio, 2 for Management).
    *   **Conditional Rendering:**
        *   If `isMobile`: Renders `MobileArrowNavigation` and a swipeable container holding the three panels. Only the panel corresponding to `activeMobileTabIndex` is fully visible.
        *   If not `isMobile`: Renders the existing 3-column desktop layout.
    *   **Swipe Logic:** Touch event handlers (`onTouchStart`, `onTouchMove`, `onTouchEnd`) on the swipeable container will update `activeMobileTabIndex`.
*   **`MobileArrowNavigation.tsx` (New or Existing Verified Component):**
    *   **Props:** `tabs` (array of `{id, name}`), `activeTabId`, `onNavigate` callback.
    *   Displays current tab name and arrow buttons.
    *   Arrow clicks call `onNavigate` with the new target tab's ID, which in turn updates `activeMobileTabIndex` in `MainGameContent.tsx`.

## 3. Documentation Plan

### 3.1. Code Comments

*   All new and significantly modified code related to bug fixes and the mobile UI refactoring will be thoroughly commented.
*   Comments will explain:
    *   The purpose of the code block.
    *   The logic behind bug fixes (especially for `lastMilestone`).
    *   The state management for mobile navigation.
    *   The mobile detection mechanism.
    *   Conditional rendering logic for mobile vs. desktop.

### 3.2. `MOBILE_UI.md` (New Document)

*   **Location:** `/docs/MOBILE_UI.md`
*   **Contents:**
    1.  **Overview:** Purpose of the mobile-specific UI.
    2.  **Mobile Detection:** Explanation of `useMediaQuery` and breakpoint.
    3.  **Core Components:**
        *   `MobileArrowNavigation.tsx`: Props, logic, styling.
        *   `MainGameContent.tsx`: Role in mobile UI, `activeMobileTabIndex` state, swipe logic, conditional rendering of panels.
    4.  **State Management:** How `activeMobileTabIndex` is controlled by arrows and swipes.
    5.  **Styling:** Notes on Tailwind CSS usage for responsiveness (`md:hidden`, flex properties for panel layout).
    6.  **Maintenance & Extension:**
        *   How to add/modify mobile tabs/panels.
        *   Testing guidelines for mobile (Chrome on Android, Safari on iOS).
    7.  **Browser Compatibility:** Confirmation of target browsers.

This plan prioritizes stability first, then addresses the mobile UI enhancement.
