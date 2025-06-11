# Implementation Plan: Recording Studio Tycoon Enhancements

## I. Overview

This plan details the steps to implement "Feature Set 1: Living Studio (Visuals & Animation)" and "Feature Set 2: Historical Evolution & Equipment Mods" into Recording Studio Tycoon.

## II. Preparatory Steps & Data Structure Modifications

Before implementing specific features, the following data structures need to be updated:

1.  **Artist Mood:**
    *   **File to Modify:** `src/types/charts.ts`
    *   **Change:** Add a `mood` (or `happiness`) field to the `Artist` interface.
        ```typescript
        export interface Artist {
          // ... existing fields
          mood: number; // e.g., 0-100, where 100 is very happy
        }
        ```
    *   **File to Modify:** `src/data/artistsData.ts`
    *   **Change:** Add a default `mood` value (e.g., 70) to all artists in the `artistsDatabase`.
    *   **New Logic (Conceptual):** Game events (successful recordings, project failures, specific interactions) will need to be identified or created to modify this `mood` value.

2.  **Equipment Condition:**
    *   **File to Modify:** `src/types/game.ts`
    *   **Change:** Add a `condition` field to the `Equipment` interface.
        ```typescript
        export interface Equipment {
          // ... existing fields
          condition: number; // e.g., 0-100, where 100 is perfect condition
        }
        ```
    *   **File to Modify:** `src/data/eraEquipment.ts` (and `src/data/equipment.ts` if it's also used for player's owned equipment state)
    *   **Change:** When equipment is added to `GameState.ownedEquipment`, it should initialize with a default `condition` (e.g., 100).
    *   **New Logic (Conceptual):** Game events (usage, time passing, failed maintenance minigames) will decrease `condition`. A new "maintenance" action/minigame might be needed to restore it.

3.  **Equipment Modification System Data Structure:**
    *   **File to Modify:** `src/types/game.ts` (or a new `src/types/equipmentMods.ts`)
    *   **Change:** Define new interfaces for modifications.
        ```typescript
        export interface EquipmentMod {
          id: string;
          name: string; // e.g., "Rev A / Blue Stripe Mod"
          description: string;
          modifiesEquipmentId: string; // ID of the base equipment it applies to
          statChanges: Partial<Equipment['bonuses']>; // How it changes the base equipment's bonuses
          // Potentially visual changes:
          // iconOverride?: string; 
          // nameSuffix?: string; // e.g., "(Rev A)"
          researchRequirements: {
            engineerSkill: string; // e.g., 'Electronics' or 'Advanced Engineering'
            engineerSkillLevel: number;
            researchTime: number; // in game days or work units
            cost: number;
          };
        }

        // Extend Equipment interface or player's owned equipment state
        export interface Equipment {
          // ... existing fields
          appliedModId?: string | null; // ID of the currently applied mod
        }
        ```
    *   **New File:** `src/data/equipmentMods.ts`
    *   **Content:** Define available mods, starting with the "Rev A / Blue Stripe" for the UREI 1176.
        ```typescript
        import { EquipmentMod } from '@/types/game'; // or '@/types/equipmentMods'

        export const availableMods: EquipmentMod[] = [
          {
            id: 'urei1176_rev_a',
            name: 'UREI 1176 "Rev A / Blue Stripe" Mod',
            description: 'Modifies the UREI 1176 to the aggressive "Blue Stripe" characteristics, known for faster attack and unique color.',
            modifiesEquipmentId: 'urei_1176_compressor', // Assuming an ID for the base 1176
            statChanges: { 
              // Example changes:
              speedBonus: (currentSpeedBonus = 0) => currentSpeedBonus + 5, // Faster attack
              creativityBonus: (currentCreativity = 0) => currentCreativity + 3, // More "color"
              technicalBonus: (currentTech = 0) => currentTech + 2,
            },
            // iconOverride: '🎛️✨', // Optional: if the emoji should change
            researchRequirements: {
              engineerSkill: 'Electronics', // Placeholder skill
              engineerSkillLevel: 3,
              researchTime: 10, // e.g., 10 game days
              cost: 500,
            }
          }
          // ... other mods
        ];
        ```
    *   **Note:** The UREI 1176 itself needs to be added to `src/data/eraEquipment.ts` if it doesn't exist. Its emoji is 🎛️.

## III. Feature Set 1: Living Studio (Visuals & Animation)

This will primarily involve leveraging the existing animation system described in `docs/VISUAL_POLISH_ANIMATION_SYSTEM.md` and `src/components/EnhancedAnimationStyles.tsx`.

1.  **Recording Animation (릴 - Tape Machine):**
    *   **File to Modify:** The React component responsible for displaying the tape machine emoji during recording sessions.
    *   **Logic:** When a recording session is active for that specific tape machine, apply a CSS animation (e.g., a subtle rotation or a "spinning reels" effect using pseudo-elements or an SVG overlay if emojis are hard to animate directly).
    *   **Animation:** Could be a simple CSS keyframe animation. If direct emoji animation is tricky, consider replacing the emoji with an animatable SVG temporarily or overlaying an animated SVG.

2.  **Mixing Animation (🎛️ - Mixing Console):**
    *   **File to Modify:** The React component displaying the mixing console during mixing.
    *   **Logic:** When mixing is active, apply a subtle animation to the faders (if the emoji is detailed enough, or use an overlay). This might involve small, intermittent vertical movements on parts of the emoji.
    *   **Animation:** CSS keyframes.

3.  **Artist Moods (✨ or 🎵):**
    *   **File to Modify:** The React component displaying artists in the studio.
    *   **Logic:**
        *   When an artist's `mood` (added in preparatory steps) increases significantly or crosses a "happy" threshold, trigger a brief animation.
        *   Use a component similar to `AnimatedStatBlobs` or `ProjectCompletionCelebration` to spawn a ✨ or 🎵 emoji that appears above the artist and fades out.
    *   **Component:** May need a new small component `ArtistMoodEffect.tsx`.

4.  **Equipment Status (💨 or ⚠️):**
    *   **File to Modify:** The React component displaying equipment in the studio.
    *   **Logic:**
        *   When an equipment's `condition` (added in preparatory steps) drops below a certain threshold (e.g., < 30 for "poor", < 10 for "broken"), display a pulsing ⚠️ emoji above or near it.
        *   If it breaks (condition 0), display a 💨 emoji.
        *   Use existing CSS classes like `.animate-pulse`.
    *   **Component:** May involve conditional rendering within the equipment display component.

5.  **Day/Night Cycle:**
    *   **File to Modify:** The main game layout component (e.g., `src/components/MainGameContent.tsx` or `src/App.tsx`).
    *   **Logic:**
        *   Based on `GameState.currentDay` (or a more granular time-of-day variable if it exists/is added), smoothly transition background colors.
        *   This could be a set of 4-6 key background colors (dawn, day, dusk, night).
        *   Use CSS transitions on the background color property.
    *   **Styling:** Define these background colors, possibly in Tailwind config or a global CSS file.

## IV. Feature Set 2: Historical Evolution & Equipment Mods

1.  **New Historical Equipment:**
    *   **File to Modify:** `src/data/eraEquipment.ts`
    *   **Action:** Add new entries to the `availableEquipment` array for:
        *   **1960s:**
            *   EMT 140 Plate Reverb (Decide on an emoji, e.g., ⚙️ or a new one)
            *   Fairchild 670 Compressor (The existing "Fairchild 660" is very similar. Clarify if this should be a distinct item or if the 660 entry should be updated to 670. For now, assume adding a new 670 if it has distinct properties or introduction year).
        *   **1970s:**
            *   SSL 4000 Series Console (🎛️)
            *   Lexicon 224 Digital Reverb (The existing "Lexicon 'Lex-Icon' 224" is listed for 1982. Clarify if this should be moved to 1970s or if a distinct 1970s model is intended. Assume for now, if the task implies a 1970s introduction, this entry might need its `availableFrom` year adjusted, or a new, earlier version added).
    *   **Details for each:** `id`, `name`, `category` ('outboard' or 'mixer'), `price`, `historicalPrice`, `availableFrom` (e.g., 1960, 1965, 1970, 1975 as appropriate), `description`, `eraDescription`, `bonuses`, `icon`, `isVintage: true`.

2.  **Equipment Modification System:**
    *   **UREI 1176 Compressor:**
        *   First, ensure the base UREI 1176 Compressor exists in `src/data/eraEquipment.ts`. If not, add it (Category: 'outboard', Icon: 🎛️). Let's assume its ID will be `urei_1176_compressor`.
    *   **Research Action for Engineers:**
        *   **File to Modify:** UI component for engineer actions/management.
        *   **New UI Element:** Add a "Research Mod" button or option.
        *   **Logic:**
            *   Player selects an engineer and a piece of moddable equipment they own.
            *   A list of available (but not yet researched) mods for that equipment is shown (from `src/data/equipmentMods.ts`).
            *   Player selects a mod to research.
            *   Engineer becomes "Busy" researching for `researchTime`. Cost is deducted.
            *   Requires a new `StaffMember.status` like `'Researching'` or use `'Working'` with a specific project type.
            *   Track research progress (could be a simple timer or work units).
    *   **Applying the Mod:**
        *   **File to Modify:** Equipment management UI (perhaps `EquipmentDetailModal.tsx`).
        *   **Logic:**
            *   Once a mod is researched (need a way to track researched mods in `GameState`, e.g., `unlockedMods: string[]`), if the player owns the base equipment, an "Apply Mod" option appears.
            *   Applying the mod updates the `appliedModId` field on the player's specific instance of that equipment in `GameState.ownedEquipment`.
            *   The equipment's stats, name (e.g., adding suffix), and potentially icon should dynamically update based on the applied mod. This requires a helper function:
                ```typescript
                // In a utility file e.g., src/utils/equipmentUtils.ts
                import { Equipment, EquipmentMod } from '@/types/game'; // or relevant types
                import { availableMods } from '@/data/equipmentMods'; // Assuming this path

                export function getModifiedEquipmentStats(baseEquipment: Equipment): Equipment {
                  if (!baseEquipment.appliedModId) {
                    return baseEquipment;
                  }
                  const mod = availableMods.find(m => m.id === baseEquipment.appliedModId);
                  if (!mod) {
                    return baseEquipment;
                  }

                  let modifiedBonuses = { ...baseEquipment.bonuses };
                  if (mod.statChanges) {
                    for (const key in mod.statChanges) {
                      const bonusKey = key as keyof Equipment['bonuses'];
                      const change = mod.statChanges[bonusKey];
                      if (typeof change === 'function') {
                        // @ts-ignore
                        modifiedBonuses[bonusKey] = change(baseEquipment.bonuses[bonusKey] || 0);
                      } else if (typeof change === 'object' && bonusKey === 'genreBonus') {
                        // @ts-ignore
                        modifiedBonuses.genreBonus = { ...(baseEquipment.bonuses.genreBonus || {}), ...change };
                      } else {
                        // @ts-ignore
                        modifiedBonuses[bonusKey] = (baseEquipment.bonuses[bonusKey] || 0) + change;
                      }
                    }
                  }
                  
                  return {
                    ...baseEquipment,
                    name: `${baseEquipment.name} ${mod.nameSuffix || `(${mod.name})`}`, // Or a more sophisticated naming
                    icon: mod.iconOverride || baseEquipment.icon,
                    bonuses: modifiedBonuses,
                  };
                }
                ```
    *   **UI Indication:**
        *   The equipment name should change (e.g., "UREI 1176 (Rev A / Blue Stripe)").
        *   The UI should clearly show the modified stats.
        *   Perhaps a small "Modded" badge or icon on the equipment display.

## V. Documentation Updates

*   As new systems (especially Equipment Mods) are implemented, update:
    *   `memory-bank/activeContext.md`
    *   `memory-bank/progress.md`
    *   `memory-bank/systemPatterns.md` (if new architectural patterns emerge)
    *   Relevant files in `docs/` if they exist (e.g., if there's an equipment system design doc). The user specifically mentioned updating "relevant documentation files".

## VI. File Modification Summary (Anticipated)

*   `src/types/charts.ts` (add `mood` to `Artist`)
*   `src/types/game.ts` (add `
