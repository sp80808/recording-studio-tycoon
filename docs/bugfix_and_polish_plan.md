# Bugfix and Polish Plan - Recording Studio Tycoon

**Date:** June 11, 2025
**Lead Systems Engineer:** GitHub Copilot

This document outlines the plan to address critical bugs, re-architect parts of the UI, and polish the project completion sequence.

## Phase 1: CRITICAL - Core Loop Restoration

**Objective:** Fix critical bugs preventing project completion and restore the core game loop.

**Tasks:**

1.  **Fix Audio Asset Loading (404 Errors):**
    *   **Action:** Investigate `src/utils/soundUtils.ts` (or equivalent audio playback utility) and the `public/audio/` directory.
    *   **Details:**
        *   Verify the existence and correct naming of `click.wav` and `project_complete.wav` in `public/audio/`.
        *   Ensure the `playSound` function correctly constructs paths to `/audio/filename.wav`.
        *   Test audio playback for these files after fixes.
    *   **Affected Files (Likely):** `src/utils/soundUtils.ts` (or `src/utils/audioSystem.ts`), potentially components that directly call audio playback.

2.  **Fix Erroneous API/Asset Requests (404 Errors for `/review_start`, `/xp_tick_fast`, `/score_tick`):**
    *   **Action:** Search the codebase for `fetch` calls or `Audio` instantiations using these paths.
    *   **Details:**
        *   For `/review_start`: If it's an erroneous `fetch` call, remove it. It's likely in the project completion or review modal logic.
        *   For `/xp_tick_fast` and `/score_tick`:
            *   Determine if these are intended to be audio cues.
            *   If yes: Ensure corresponding audio files (e.g., `xp_tick_fast.wav`, `score_tick.wav`) exist in `public/audio/`. Update calls to use the `playSound` utility with correct paths (e.g., `/audio/xp_tick_fast.wav`).
            *   If no (i.e., they are also erroneous `fetch` calls), remove them.
    *   **Affected Files (Likely):** `src/components/modals/ProjectReviewModal.tsx`, components related to XP display or score updates.

3.  **Fix Project State Transition (Clear `activeProject`):**
    *   **Action:** Ensure `activeProject` in `gameState` is set to `null` after the project review is completed via the new "Continue" button.
    *   **Details:**
        *   Locate the function responsible for finalizing a project (e.g., in `src/hooks/useGameLogic.tsx` or `src/hooks/useGameState.tsx`).
        *   Modify `src/components/modals/ProjectReviewModal.tsx` so that clicking the new "Continue" button triggers this project finalization logic.
        *   Verify `activeProject` is cleared, allowing new projects to be selected.
    *   **Affected Files (Likely):** `src/components/modals/ProjectReviewModal.tsx`, `src/hooks/useGameLogic.tsx`, `src/pages/Index.tsx` (or wherever the review modal is controlled and project completion is handled).

## Phase 2: IMPORTANT - UI Layout & Symmetry

**Objective:** Improve main game UI organization and visual balance.

**Tasks:**

1.  **Relocate "Studio Progression" UI Module:**
    *   **Action:** Move the "Studio Progression" component to the right-hand panel.
    *   **Details:**
        *   Identify the "Studio Progression" component (search codebase for likely candidates, e.g., displaying player level, studio reputation, unlocked features).
        *   Modify `src/components/MainGameContent.tsx` to remove it from its current position.
        *   Modify `src/components/RightPanel.tsx` to include the "Studio Progression" component between "Studio Actions" and "Advance Day" sections.
        *   Ensure styling and layout are consistent within the `RightPanel`.
    *   **Affected Files (Likely):** `src/components/MainGameContent.tsx`, `src/components/RightPanel.tsx`, the "Studio Progression" component itself.

2.  **Ensure Panel Symmetry:**
    *   **Action:** Adjust CSS for the left and right panels to be symmetrical in height, aligning with the bottom of the central project window.
    *   **Details:**
        *   In `src/components/MainGameContent.tsx`, review and adjust Tailwind CSS classes for the three main panels.
        *   Use flexbox properties to ensure consistent height and alignment. The side panels should stretch to the full height available or match the central panel's height.
    *   **Affected Files (Likely):** `src/components/MainGameContent.tsx`, potentially `src/index.css` or `src/App.css` if global styles are affecting layout.

## Phase 3: POLISH - Project Review Feel

**Objective:** Enhance the user experience of the project completion and review sequence.

**Tasks:**

1.  **Prevent Secondary Black Text Box on Review Screen:**
    *   **Action:** Identify and hide the "secondary black text box" that appears over the animated review screen.
    *   **Details:**
        *   Inspect `src/components/modals/ProjectReviewModal.tsx` during the review animation to find the element.
        *   Use conditional rendering or CSS to hide this element during the animated phase, or ensure it's layered correctly if it's part of the intended final display.
    *   **Affected Files (Likely):** `src/components/modals/ProjectReviewModal.tsx`.

2.  **Add Prominent "Continue" Button to Review Screen:**
    *   **Action:** Implement a new, green "Continue" button on the project review screen.
    *   **Details:**
        *   Add the button to `src/components/modals/ProjectReviewModal.tsx`.
        *   Style it to be prominent (e.g., green background, clear text).
        *   The game flow must pause on this screen (modal remains active) until this button is clicked. The button's `onClick` handler will trigger the project finalization logic (see Phase 1, Task 3).
    *   **Affected Files (Likely):** `src/components/modals/ProjectReviewModal.tsx`.

3.  **Implement "Casino-Style" Ticking Score Animation:**
    *   **Action:** Animate the final project score display with a ticking number effect.
    *   **Details:**
        *   In `src/components/modals/ProjectReviewModal.tsx`, manage the displayed score using `useState`.
        *   Use `useEffect` to trigger the animation when the final score is available.
        *   Increment the displayed score from 0 (or a low number) to the final score over a set duration. `requestAnimationFrame` or `setInterval/setTimeout` can be used for smooth updates.
    *   **Affected Files (Likely):** `src/components/modals/ProjectReviewModal.tsx`.

4.  **Synchronize Score Animation with XP Bar:**
    *   **Action:** Ensure the score ticking animation and any XP bar animations on the review screen conclude simultaneously.
    *   **Details:**
        *   Determine the duration of the XP bar animation.
        *   Set the duration of the score ticking animation to match.
        *   Trigger both animations to start at the same time.
        *   This might involve passing duration props or using a shared state/event to coordinate.
    *   **Affected Files (Likely):** `src/components/modals/ProjectReviewModal.tsx`.
