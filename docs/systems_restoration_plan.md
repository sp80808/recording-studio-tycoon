# Systems Restoration Plan

**Date:** June 11, 2025
**Lead Systems Engineer:** Cline
**Objective:** Restore core loop integrity, development environment stability, and overhaul mobile navigation.

## I. Critical Error Resolution

### A. SaveSystemContext 500 Error

**Hypothesis:** The error likely stems from an issue during the initialization or update of the `SaveSystemContext`, potentially related to `useEffect` dependencies, `localStorage` interaction during Hot Module Reload (HMR), or race conditions.

**Plan:**

1.  **Examine `src/contexts/SaveSystemContext.tsx`:**
    *   Review all `useEffect` hooks for correct dependency arrays. Ensure no unintended infinite loops are triggered during HMR.
    *   Scrutinize interactions with `localStorage` (`getItem`, `setItem`, `removeItem`). Wrap parsing logic (`JSON.parse`) in `try...catch` blocks to handle potentially malformed data, especially during HMR when state might be inconsistent.
    *   Ensure that any initial state loading from `localStorage` gracefully handles cases where the data might be missing or `null`.
2.  **HMR Stability:**
    *   If direct `localStorage` access during module initialization is problematic for HMR, consider deferring `localStorage` reads until after the initial render or using a more robust hydration strategy.
    *   Temporarily disable parts of the save/load logic during HMR cycles if specific operations are identified as culprits, to isolate the issue.
3.  **State Initialization and Dependencies:**
    *   Verify that the context provider initializes its state completely before any consumers attempt to access it.
    *   Check for dependencies on other contexts or global states that might not be stable during an HMR update.
4.  **Logging and Debugging:**
    *   Add detailed console logs at critical points in `SaveSystemContext.tsx` (initialization, load, save, effect triggers) to trace the execution flow during HMR and pinpoint where the 500 error originates.
    *   Utilize React DevTools to inspect context values and component lifecycles during HMR.

### B. AudioContext User Gesture Requirement

**Hypothesis:** Background music fails because the `AudioContext` is not initiated or resumed via a user gesture, as required by modern browsers.

**Plan:**

1.  **Identify Initiation Point:**
    *   Locate where audio playback (especially background music) is first attempted in `src/utils/audioSystem.ts` or its consumers.
2.  **Implement User Gesture Trigger:**
    *   The `SplashScreen.tsx` or `TutorialModal.tsx` (if it's one of the first interactive elements) are good candidates. Alternatively, a general "Click to Continue" button on the initial load screen.
    *   Modify `src/utils/audioSystem.ts` to include a function like `initializeAudioAfterGesture()`.
    *   This function will call `audioContext.resume()` if it's suspended, or initialize the main `AudioContext` and start playback of the first track (e.g., background music).
    *   Call `initializeAudioAfterGesture()` from an event handler (e.g., `onClick`) attached to the chosen user interaction element.
3.  **State Management for Audio Initialization:**
    *   Maintain a state variable (e.g., `isAudioInitializedByUser: boolean`) within the `AudioContext` or a related state management hook.
    *   Prevent automatic playback attempts until this flag is true.
    *   Provide a clear visual cue or button for the user to initiate audio if it hasn't started.
4.  **Error Handling:**
    *   Ensure that if `audioContext.resume()` fails (though unlikely if tied to a direct user gesture), it's caught gracefully and logged, rather than crashing the application.

## II. Core Loop Restoration

**Hypothesis:** The game loop progression failure is likely a symptom of the `SaveSystemContext 500 Error` preventing state updates, or potentially a new bug introduced in the recently modified "Work Progression Enhancement System."

**Plan:**

1.  **Prioritize Critical Error Fixes:** Address the `SaveSystemContext 500 Error` and `AudioContext` issue first. Stability in these systems is paramount for reliable state updates.
2.  **Verify State Persistence:** Once the `SaveSystemContext` is stable, thoroughly test if game state changes (e.g., `project.currentStageIndex`, `stage.workUnitsCompleted`, `player.energy`) are correctly saved to `localStorage` and reloaded.
3.  **Trace "Complete Work" Logic:**
    *   Set breakpoints or add extensive logging in `src/hooks/useStageWork.tsx`, `src/hooks/useProjectManagement.tsx`, and `src/components/ActiveProject.tsx` (or wherever the "Complete Work" button logic resides).
    *   Follow the execution path when the button is clicked:
        *   Confirm work units are calculated correctly.
        *   Verify `stage.workUnitsCompleted` is incremented.
        *   Check conditions for stage completion (`stage.workUnitsCompleted >= stage.workUnitsBase`).
        *   Confirm `project.currentStageIndex` is advanced.
        *   Verify `player.energy` is deducted.
        *   Ensure all relevant state update functions (e.g., from `useGameState`) are called with correct values.
4.  **Examine Recent Changes:**
    *   Pay close attention to the "Work Progression Enhancement System" modifications. Review the commits or diffs related to `src/utils/stageUtils.ts`, `ActiveProject.tsx`, and `useStageWork.tsx` for potential logic errors.
5.  **Test Scenarios:**
    *   Test completing a stage.
    *   Test completing the last stage of a project.
    *   Test scenarios where player energy is insufficient.
    *   Test with different project types/difficulties if logic varies.

## III. Mobile UX Overhaul Blueprint

**Objective:** Implement swipe-based navigation for mobile viewports without affecting the desktop tabbed UI.

**Plan:**

1.  **Create `useIsMobile` Hook:**
    *   Develop a custom hook (e.g., `src/hooks/useIsMobile.ts`) that listens to `window.resize` events and uses `window.matchMedia('(max-width: 768px)')` (or a suitable breakpoint) to determine if the view is mobile.
    *   The hook should return a boolean state (`isMobile`).
2.  **Conditional UI Rendering in `MainGameContent.tsx` (or equivalent layout component):**
    *   Use the `useIsMobile` hook.
    *   If `isMobile` is `false`: Render the existing tab navigation and content display.
    *   If `isMobile` is `true`:
        *   Hide the desktop tab navigation (e.g., using Tailwind's `hidden md:flex`).
        *   Render a swipeable container.
3.  **Implement Swipeable Container:**
    *   **Structure:** The container will wrap the components that represent the different views (Studio, Skills, etc.). Each view component will be a "slide."
    *   **Styling:** Use CSS Flexbox or Grid to lay out slides horizontally. The container will have `overflow-x: hidden`.
    *   **Touch Event Handling (Custom Implementation):**
        *   State: `currentIndex` (active slide), `translateX` (for visual swipe effect).
        *   `onTouchStart`: Record `event.touches[0].clientX` and current `Date.now()`.
        *   `onTouchMove`: Calculate `deltaX = event.touches[0].clientX - touchStartX`. Update `translateX` to visually move the slides. Prevent vertical scroll if a horizontal swipe is detected.
        *   `onTouchEnd`: Calculate `deltaX` and `deltaTime`. If `Math.abs(deltaX)` is greater than a swipe threshold (e.g., 50px) or if swipe velocity (`deltaX / deltaTime`) is high enough:
            *   If `deltaX < 0` (swipe left): Increment `currentIndex` (if not last slide).
            *   If `deltaX > 0` (swipe right): Decrement `currentIndex` (if not first slide).
            *   Animate the transition to the new `currentIndex` (snap effect).
        *   Else (swipe not significant): Animate back to the `translateX` for the current `currentIndex`.
    *   **Accessibility:** Ensure swipe actions can also be triggered by keyboard for accessibility if possible, or provide alternative navigation for mobile keyboard users.
4.  **Navigation Indicators (Mobile):**
    *   Below the swipeable area, render a series of dots, highlighting the dot corresponding to the `currentIndex`.
5.  **Performance and Smoothness:**
    *   Use `transform: translateX()` for animations as it's more performant than animating `left` or `margin`.
    *   Apply `will-change: transform` to the swipeable content during active swipe.
    *   Throttle `touchmove` events if necessary, though usually not required for simple translateX.
6.  **Desktop UI Integrity:**
    *   Rigorously test that the desktop UI remains completely unchanged and fully functional. All mobile-specific logic and components must be conditionally rendered/applied.
7.  **Alternative (Library):**
    *   If custom implementation proves too complex or time-consuming, consider a lightweight library like `swiper/react` or `react-swipeable-views`, ensuring it doesn't add significant bundle size. Evaluate based on features vs. overhead. Given the desire for a "smooth and intuitive" experience, a well-crafted custom solution can offer more control.

This plan will be executed in phases as outlined in the initial task request.
