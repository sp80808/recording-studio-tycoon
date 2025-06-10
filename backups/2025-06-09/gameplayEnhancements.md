# Gameplay Enhancements Plan

## Overview

The goal of this plan is to enhance the gameplay loop of Recording Studio Tycoon, making it more animated, satisfying, and fun. This will be achieved by incorporating visual and auditory feedback, as well as new interactive elements.

## Core Principles

*   **Immediate Feedback:** Provide instant visual and auditory cues for player actions and game events.
*   **Progress Visualization:** Clearly show progress and rewards in an engaging way.
*   **Impactful Moments:** Highlight significant achievements (level-ups, project completion, milestones) with special effects.

## Areas for Enhancement

### Visual Feedback & Animations

*   **Resource Gains/Losses:**
    *   Animate money, creativity, and technical point changes (e.g., using `AnimatedNumber.tsx` for numbers, and small particle bursts or icons floating up/down for visual impact).
    *   Particle effects when C/T points are generated during project work.
*   **Project Progress:**
    *   Visual indicators of work being done on a project stage (e.g., a progress bar filling, small animations on the "Work on Stage" button).
    *   Subtle animations on staff members when they are actively working.
*   **Level Ups & Milestones:**
    *   Grand particle bursts and celebratory animations for player level-ups and milestone achievements.
    *   Temporary visual overlays or banners.
*   **Mini-Games:**
    *   Enhanced visual feedback within mini-games (e.g., more dynamic waveforms, clearer indicators of success/failure).
    *   Small "success" or "fail" animations upon mini-game completion.
*   **Equipment/Upgrades:**
    *   Visual confirmation (e.g., a brief glow or particle effect) when equipment is purchased or an upgrade is applied.

### Auditory Feedback (Sound Effects)

*   **UI Interactions:**
    *   Subtle click sounds for buttons and menu navigation.
    *   Distinct sounds for opening/closing modals.
*   **Resource Changes:**
    *   "Coin" sound for money gain, a softer sound for money loss.
    *   Distinct sounds for C/T point accumulation.
*   **Game Events:**
    *   Satisfying "ding" or "chime" for project stage completion.
    *   "Fanfare" sound for project completion.
    *   "Level up" sound for player progression.
    *   Sounds for successful/failed mini-game attempts.
*   **Ambient Sounds:**
    *   Consider subtle background studio ambiance (e.g., quiet hum of equipment, distant music) to enhance immersion.

## Technical Approach

*   **Leverage Existing Components/Hooks:**
    *   `src/components/AnimatedNumber.tsx`: For animating numerical displays.
    *   `src/hooks/useParticleBurst.tsx`: For particle effects.
    *   `src/hooks/useSound.ts`: For integrating sound effects.
    *   `project/src/animations.ts`: Investigate this file for existing animation utilities.
*   **Integration Points:**
    *   Modify `useStageWork.tsx` to trigger visual/auditory feedback when C/T points are generated.
    *   Update `useProjectManagement.tsx` for project completion animations/sounds.
    *   Enhance `usePlayerProgression.tsx` for level-up and milestone effects.
    *   Integrate sounds into UI components (buttons, modals).
*   **New Components/Utilities (if needed):**
    *   A generic `ParticleEmitter` component for reusable particle effects.
    *   A `SoundPlayer` utility or context if `useSound.ts` needs expansion.

## Next Steps

1.  Investigate `project/src/animations.ts` to understand existing animation capabilities.
2.  Begin implementing particle effects for C/T point gains during project work.
3.  Add basic sound effects for UI interactions (e.g., button clicks).
