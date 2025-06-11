# Skill System, XP, and Project Review Documentation

**Version:** 1.0
**Date:** 2025-06-11

## 1. Overview

This document outlines the RPG-style skill system, experience points (XP) mechanics, and the animated project review sequence implemented in "Recording Studio Tycoon." This system is designed to provide a core gameplay loop with a satisfying payoff for player effort.

## 2. Skill System Architecture

### 2.1. Skill Definition

Each skill, for both the player and staff members, is defined by the following properties:

```typescript
interface Skill {
  xp: number;            // Current experience points for this skill
  level: number;         // Current level of this skill
  xpToNextLevel: number; // Total XP required to reach the next level
}
```

### 2.2. Skill Set

The game implements the following skills, categorized for clarity:

**Foundational:**
*   `Songwriting`
*   `Rhythm`
*   `Tracking`
*   `Mixing`
*   `Mastering`

**Technical/Analogue:**
*   `TapeSplicing`
*   `VocalComping`

**Creative/Digital:**
*   `SoundDesign`
*   `SampleWarping`

**Player-Only:**
*   `Management` (This skill is exclusive to the player character)

### 2.3. Data Structure Integration

*   **Player (`PlayerData` in `src/types/game.ts`):**
    *   A `skills` object is added, mapping each skill name (from the list above) to a `Skill` object.
    *   Player's overall `xp` and `level` are distinct from individual skill XP/levels.
*   **Staff (`StaffMember` in `src/types/game.ts`):**
    *   The existing `skills` object is updated to map skill names (excluding `Management`) to `Skill` objects.
    *   Staff also have `xpInRole` and `levelInRole` for their general role progression, separate from specific production skills.

### 2.4. XP Curve

The experience points required for a skill to advance to the next level are calculated using the formula:
`xpToNextLevel = Math.floor(100 * Math.pow(currentLevel, 1.5))`
This ensures a progressively increasing XP requirement for higher levels.

### 2.5. Skill Initialization

*   **Player:** All player skills are initialized at Level 1 with 0 XP via `initializeSkillsPlayer()` in `src/utils/skillUtils.ts` when a new game starts (within `createDefaultGameState` in `src/hooks/useGameState.tsx`).
*   **Staff:** Staff skills are initialized similarly at Level 1 with 0 XP via `initializeSkillsStaff()` in `src/utils/skillUtils.ts`. This function should be called when new staff candidates are generated or when a staff member is hired.

## 3. Project Mechanics & XP Granting

### 3.1. "Project Complete" Trigger

*   When a project's work units are completed (determined by `performDailyWork` in `src/hooks/useStageWork.tsx`), a signal is sent up to `src/pages/Index.tsx`.
*   `Index.tsx` then calls `handleShowProjectReview`.

### 3.2. Generating the Project Report (`generateProjectReview`)

*   The `handleShowProjectReview` function in `Index.tsx` calls `generateProjectReview` (located in `src/utils/projectReviewUtils.ts`).
*   This function takes the completed `Project` object, details of the `assignedPerson` (player or staff), an `equipmentQuality` score, `currentPlayerData`, and `allStaffMembers`.
*   **Logic:**
    1.  Determines the relevant skills for the project based on the project type and the skills of the assigned person.
    2.  For each relevant skill:
        *   Calculates a `score` (0-100) based on the person's skill level, equipment quality, project difficulty, and a random factor.
        *   Calculates `skillXpGained` based on this score and project difficulty.
        *   Uses `grantSkillXp` (from `src/utils/skillUtils.ts`) to add the XP to the skill, potentially leveling it up multiple times.
    3.  Calculates an `overallQualityScore` for the project based on the average of individual skill scores and accumulated C/T points from the project.
    4.  Calculates `moneyGained` and `reputationGained` based on the project's base payout/rep and the `overallQualityScore`.
    5.  If a staff member completed the project, calculates `playerManagementXpGained` for the player.
    6.  Generates a dynamic `reviewSnippet` text based on the scores.
    7.  Returns a `ProjectReport` object containing all this information. This report does *not* immediately update the global game state.

### 3.3. Displaying the Animated Review Screen

*   After `generateProjectReview` returns the `ProjectReport`, `Index.tsx` sets state to display the `ProjectReviewModal` (`src/components/modals/ProjectReviewModal.tsx`), passing the report data to it.
*   The `ProjectReviewModal` is responsible for the animated display sequence (see Section 4).

### 3.4. Finalizing Completion & Granting XP/Rewards (`completeProject`)

*   When the player clicks "Continue" (or similar) in the `ProjectReviewModal`, its `onClose` handler triggers `handleFinalizeProjectCompletion` in `Index.tsx`.
*   `handleFinalizeProjectCompletion` calls the `completeProject` function (from `useProjectManagement`, exposed via `useGameLogic`).
*   The `completeProject` function now takes the `ProjectReport` as its primary argument.
*   **Logic:**
    1.  Uses `moneyGained` and `reputationGained` from the report to update the global game state (`gameState.money`, `gameState.reputation`).
    2.  If the player worked on the project:
        *   Iterates through `skillBreakdown` in the report. For each skill, updates the corresponding skill in `playerData.skills` with its new `xp`, `level`, and `xpToNextLevel`.
        *   Grants overall player XP (e.g., `playerData.xp += (25 + Math.floor(overallQualityScore / 10))`).
    3.  If a staff member worked on the project:
        *   Iterates through `skillBreakdown`. For each skill, updates the corresponding skill in the specific `StaffMember` object's `skills`.
        *   Grants general role XP (`xpInRole`) to the staff member.
        *   If `playerManagementXpGained` is greater than 0, grants this XP to the player's `Management` skill using `grantSkillXp`.
    4.  Unassigns staff from the completed project.
    5.  Removes the active project and generates new available projects.
    6.  After these state updates, any necessary checks for overall player level-ups are performed (typically handled by `usePlayerProgression` reacting to `playerData.xp` changes).

## 4. Animated Project Review Sequence

The `ProjectReviewModal` implements the following animated sequence to provide a rewarding experience:

1.  **Modal Transition:** The modal appears with a quick, engaging transition. Sound: `review_start`.
2.  **Initial Display:** Project title is displayed. A "Calculating..." message might show briefly.
3.  **Skill-by-Skill Animation:** For each skill in the `ProjectReport.skillBreakdown`:
    *   The `SkillDisplay` sub-component handles individual skill animation.
    *   **XP Bar Fill:** The XP bar animates from its state before XP gain towards its new state. Sound: `xp_tick_fast`.
    *   **Level-Up Flash:** If a skill levels up, the "Lvl X" display flashes, and the level number ticks up. Sound: `level_up_skill`. This can occur multiple times if multiple level-ups happen for one skill.
    *   **Score Ticker:** The skill's contribution score (0-100) rapidly ticks up. Sound: `score_tick`.
    *   Animations are sequenced one skill after another.
4.  **Overall Quality Score Animation:**
    *   The "Overall Quality" score (0-100) ticks up rapidly, shown via `AnimatedNumber`.
    *   A main progress bar also fills to represent this score. Sound: `score_total_tick`.
5.  **Rewards Display:**
    *   Money Gained, Reputation Gained, and Player Management XP (if applicable) tick up using `AnimatedNumber`. Sound: `purchase` (for money), other positive chimes.
6.  **Review Snippet:** The `reviewSnippet` text types out with a teletype effect. Sound: `text_scroll` (typing), `text_complete`.
7.  **"Continue" Button:** Appears once all animations are complete. Sound: `review_complete`.

This sequence is managed by `useEffect` hooks and state changes within `ProjectReviewModal.tsx`, using `setTimeout` for delays and `requestAnimationFrame` (within `AnimatedNumber`) for smooth numerical ticking. CSS transitions are used for bar fills.

## 5. Key Files Involved

*   **Types:**
    *   `src/types/game.ts` (defines `Skill`, `PlayerData`, `StaffMember`, `ProjectReport`, `ProjectReportSkillEntry`)
*   **Utilities:**
    *   `src/utils/skillUtils.ts` (handles XP curve, granting skill XP, skill initialization)
    *   `src/utils/projectReviewUtils.ts` (handles `generateProjectReview` logic)
    *   `src/utils/audioSystem.ts` (provides sound effects)
*   **Hooks:**
    *   `src/hooks/useGameState.tsx` (initializes player skills)
    *   `src/hooks/useProjectManagement.tsx` (modified `completeProject` function)
    *   `src/hooks/useGameLogic.tsx` (orchestrates calls, manages modal visibility state)
    *   `src/hooks/useStageWork.tsx` (signals project work unit completion)
*   **Components:**
    *   `src/pages/Index.tsx` (handles project completion callback, shows modal)
    *   `src/components/modals/ProjectReviewModal.tsx` (displays the animated review)
    *   `src/components/ui/progress.tsx` (used for XP bars - assumed)
    *   `src/components/ui/button.tsx` (used for continue button - assumed)
*   **Data:**
    *   Potentially `src/data/initialGameState.ts` or similar if not handled entirely by `useGameState.tsx`.

This system aims to create a satisfying core loop where players invest in projects and are rewarded with a visually and audibly exciting review sequence that clearly shows their progression and achievements.
