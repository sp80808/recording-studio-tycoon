# Core Loop Implementation Plan: Skill System & Animated Project Review

**Version:** 1.0
**Date:** 2025-06-11

## 1. Data Structure Architecture

### 1.1. Skill Definition

Each skill will have an `xp`, `level`, and `xpToNextLevel` property.

```typescript
interface Skill {
  xp: number;
  level: number;
  xpToNextLevel: number;
}
```

### 1.2. Expanded Skill Set

The following skills will be implemented:

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
*   `Management`

### 1.3. Updated Player Data Structure (`src/types/game.ts`)

The `PlayerData` interface will be updated to include the new `skills` object.

```typescript
// Existing PlayerData interface in src/types/game.ts
export interface PlayerData {
  xp: number; // Overall player XP, distinct from skill XP
  level: number; // Overall player level
  xpToNextLevel: number;
  perkPoints: number;
  attributes: PlayerAttributes;
  dailyWorkCapacity: number;
  reputation: number;
  lastMinigameType?: string;
  skills: { // NEW
    songwriting: Skill;
    rhythm: Skill;
    tracking: Skill;
    mixing: Skill;
    mastering: Skill;
    tapeSplicing: Skill;
    vocalComping: Skill;
    soundDesign: Skill;
    sampleWarping: Skill;
    management: Skill;
  };
}
```

### 1.4. Updated Staff Data Structure (`src/types/game.ts`)

The `StaffMember` interface's `skills` property will be updated to use the new `Skill` interface and include the defined skills (excluding `Management`).

```typescript
// Existing StaffMember interface in src/types/game.ts
export interface StaffMember {
  id: string;
  name: string;
  role: 'Engineer' | 'Producer' | 'Songwriter';
  primaryStats: {
    creativity: number;
    technical: number;
    speed: number;
  };
  xpInRole: number; // Overall role XP, distinct from skill XP
  levelInRole: number; // Overall role level
  genreAffinity: { genre: string; bonus: number } | null;
  energy: number;
  mood: number;
  salary: number;
  status: 'Idle' | 'Working' | 'Resting' | 'Training' | 'Researching';
  assignedProjectId: string | null;
  trainingEndDay?: number;
  trainingCourse?: string;
  researchingModId?: string | null;
  researchEndDay?: number;
  skills: { // UPDATED
    songwriting: Skill;
    rhythm: Skill;
    tracking: Skill;
    mixing: Skill;
    mastering: Skill;
    tapeSplicing: Skill;
    vocalComping: Skill;
    soundDesign: Skill;
    sampleWarping: Skill;
  };
}
```
*(Note: The existing `skills?: { [skillName: string]: number }` will be replaced by this structured approach).*

### 1.5. XP Curve Formula

The XP needed for the next level for each skill will be calculated as:
`xpToNextLevel = Math.floor(100 * Math.pow(currentLevel, 1.5))`

## 2. Project Report Object Definition

This object will hold the results of a completed project and drive the review screen.

```typescript
export interface ProjectReportSkillEntry {
  skillName: string;
  initialXp: number;
  xpGained: number;
  finalXp: number;
  initialLevel: number;
  finalLevel: number;
  xpToNextLevelBefore: number;
  xpToNextLevelAfter: number;
  levelUps: number; // Number of times this skill leveled up
  score: number; // 0-100, skill contribution to project quality
}

export interface ProjectReport {
  projectId: string;
  projectTitle: string;
  overallQualityScore: number; // 0-100, final calculated quality
  moneyGained: number;
  reputationGained: number;
  playerManagementXpGained: number; // If staff worked
  skillBreakdown: ProjectReportSkillEntry[];
  reviewSnippet: string; // e.g., "Groundbreaking sound design, but the rhythm section feels a little loose."
  assignedPerson: { // Details of who worked on it
    type: 'player' | 'staff';
    id: string;
    name: string;
  };
}
```

## 3. Game Pacing & Animation Strategy (Critical)

The project review sequence is the "dopamine hit" for the player. It must be fast, visually exciting, and rewarding.

**Sequence:**
1.  **Screen Transition:** A quick, engaging transition to the "Project Review" screen/modal. Sound effect: "whoosh" or "success chime."
2.  **Initial Display:** Show project title, client, and perhaps a static "Calculating Results..." message briefly.
3.  **Skill-by-Skill Animation (Core Loop):**
    *   For each relevant skill involved in the project:
        *   Display skill name (e.g., "Mixing").
        *   **XP Bar Fill:** Animate the XP bar for that skill.
            *   The bar starts at `initialXp % xpToNextLevelBefore`.
            *   It rapidly fills towards `(initialXp + xpGained) % xpToNextLevelAfter`.
            *   If `xpGained` is large, the bar might fill up completely, trigger a level-up flash, reset, and continue filling. This can happen multiple times.
            *   Animation: Smooth, quick fill (e.g., 0.3 - 0.5 seconds per bar fill, faster if multiple level-ups). Use a bright, satisfying color.
            *   Sound: Rapid "tick-tick-tick" or "power-up" sound as the bar fills.
        *   **Level-Up Flash:** If `finalLevel > initialLevel`:
            *   The "Lvl X" display next to the skill name flashes brightly (e.g., gold or white).
            *   A distinct "level up" sound effect plays (e.g., "ding!", "shine").
            *   The level number ticks up quickly.
            *   This should be very prominent and satisfying.
        *   **Score Ticker:** Display the skill's `score` (0-100). This number should rapidly tick upwards from 0 (or a low base) to its final value. Sound: Fast numerical ticking.
    *   This process repeats for each skill, one after another, maintaining a quick rhythm. The entire skill breakdown should take only a few seconds (e.g., 3-5 seconds depending on number of skills).
4.  **Overall Quality Score Animation:**
    *   A larger display for "Overall Quality."
    *   The score (0-100) ticks up rapidly from 0 to `overallQualityScore`.
    *   A progress bar might also fill alongside the number.
    *   Sound: More significant ticking/filling sounds, culminating in a "final score" chime.
5.  **Rewards Display:**
    *   Money Gained: Number ticks up. Sound: "Cha-ching" or coin sounds.
    *   Reputation Gained: Number ticks up. Sound: "Applause" or "positive chime."
    *   Player XP (Management or Direct): Number ticks up / XP bar fills.
6.  **Review Snippet:** The `reviewSnippet` text types out quickly, like a teletype effect.
7.  **"Continue" Button:** Appears after animations complete.

**Technical Implementation Notes for Animation:**
*   **Framework:** Use React state updates to drive numerical changes. For smooth bar fills and visual effects, CSS transitions/animations are preferred for performance. JavaScript `requestAnimationFrame` can be used for more complex sequences if needed, but aim for CSS first.
*   **Timing:** Use `setTimeout` or CSS animation delays to chain animations sequentially.
*   **Easing:** Employ "ease-out" or "ease-in-out" easing functions for animations to feel more natural and impactful.
*   **Visuals:** Bright colors, particle effects (subtle), and clear visual hierarchy. The numbers and bars should be the focus.
*   **Sound Design:** Crucial for enhancing the rewarding feel. Each animation step should have corresponding audio feedback.

## 4. Game Loop Flowchart (Text-Based)

```
[ Project In Progress ]
          |
          v
[ Work Units Complete? ] --(No)--> [ Continue Project Work ]
          | (Yes)
          v
[ Call generateProjectReview() ]
    (Calculates skill scores, XP gains, level-ups, overall quality, rewards.
     Does NOT update global GameState. Returns ProjectReport object.)
          |
          v
[ UI: Trigger Project Review Screen/Modal ]
    (Pass ProjectReport data to this screen)
          |
          v
[ Animate Review Screen ]
    (Display skill XP bars filling, level-ups flashing, scores ticking up,
     overall quality ticking up, rewards appearing, review snippet typing out)
          |
          v
[ Player Clicks "Continue" on Review Screen ]
          |
          v
[ Call actual completeProject() in useProjectManagement ]
    (Uses data from the generated ProjectReport)
          |
          v
[ Grant XP & Rewards ]
    (Update PlayerData: skill XP, skill levels, Management XP if applicable)
    (Update StaffMember: skill XP, skill levels if applicable)
    (Update GameState: money, reputation, overall player XP)
          |
          v
[ Check for Player Level-Up (Overall) ]
          |
          v
[ Return to Main Game Screen ]
```

## 5. File Structure & Key Functions

*   **`src/types/game.ts`**: Update `PlayerData`, `StaffMember` interfaces. Add `Skill`, `ProjectReportSkillEntry`, `ProjectReport` interfaces.
*   **`src/utils/skillUtils.ts` (NEW)**:
    *   `calculateXpToNextLevel(currentLevel: number): number`
    *   `grantSkillXp(currentSkill: Skill, amount: number): { updatedSkill: Skill, levelUps: number }` (handles multiple level-ups)
    *   `initializeSkillsPlayer(): PlayerData['skills']`
    *   `initializeSkillsStaff(): StaffMember['skills']`
*   **`src/utils/projectReviewUtils.ts` (NEW)**:
    *   `generateProjectReview(project: Project, assignedPerson: { type: 'player' | 'staff', id: string, name: string, skills: PlayerData['skills'] | StaffMember['skills'] }, equipmentQuality: number): ProjectReport`
        *   This function will contain the core logic for calculating scores for each relevant skill based on level, equipment, and randomness.
        *   It will determine XP gained for each skill.
        *   It will generate the `reviewSnippet`.
*   **`src/hooks/useProjectManagement.tsx`**:
    *   Modify `completeProject()`:
        *   It will now be called *after* the review animation.
        *   It will take the `ProjectReport` as an argument (or the raw project and person details to re-calculate or verify).
        *   It will use the `ProjectReport` data to grant actual XP (player overall, management), money, and reputation.
        *   It will call `grantSkillXp` from `skillUtils.ts` for player/staff skills.
*   **`src/components/modals/ProjectReviewModal.tsx` (NEW)**:
    *   The React component responsible for displaying and animating the project review based on `ProjectReport` data.
*   **`src/hooks/useGameLogic.tsx`**:
    *   The `handlePerformDailyWork()` function in `useStageWork` (called by `useGameLogic`) signals project completion.
    *   `useGameLogic` will need to manage the state to show/hide the `ProjectReviewModal.tsx`.
    *   When `handlePerformDailyWork` indicates completion, `useGameLogic` should:
        1.  Call `generateProjectReview()`.
        2.  Set state to display `ProjectReviewModal` with the report data.
        3.  The modal, upon closing (player clicks "Continue"), will trigger the actual `completeProject` call (likely via a callback passed from `Index.tsx` or `useGameLogic.tsx`).
*   **`src/data/initialGameState.ts` (or similar setup file)**:
    *   Update initial player and staff data to include the initialized skills objects.
*   **`docs/skill_system_readme.md` (NEW)**: Documentation explaining the skill system, XP, and project review flow.

This plan provides a comprehensive roadmap for implementing the core skill system and the animated project review sequence.
