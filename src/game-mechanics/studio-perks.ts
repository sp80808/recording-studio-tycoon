import { GameState } from './common.types'; // Assuming GameState provides necessary context
import { GenreId, SkillId } from './common.types';

export type PerkCategory = "Acoustics" | "Talent Acquisition" | "Marketing" | "ProductionWorkflow" | "Financial";

export interface StudioPerkEffect {
  // Examples: 'mixingQualityBonus', 'staffHappinessBonus', 'contractValueMultiplier', 'researchSpeedBonus'
  attribute: string; 
  value: number; // Can be a percentage (e.g., 0.05 for 5%) or a flat value
  type: 'percentage' | 'flat';
  // Optional: scope (e.g., specific genre, specific room type)
  scope?: string; 
}

export interface UnlockCondition {
  type: 'studioReputation' | 'completedProjectsInGenre' | 'staffSkillSum' | 'researchPoints' | 'specificPerkUnlocked';
  threshold?: number;
  genreId?: GenreId;
  skillId?: SkillId;
  perkId?: string; // For prerequisite perks
  // count?: number; // For conditions like 'complete X projects'
}

export interface StudioPerk {
  id: string;
  name: string;
  description: string;
  category: PerkCategory;
  unlockConditions: UnlockCondition[];
  effects: StudioPerkEffect[];
  cost?: number; // Optional cost in game currency or research points
  // icon?: string; // Path to an icon for UI
  // flavorText?: string;
  isUnlocked: boolean;
  isActive: boolean; // Some perks might be toggleable, though most are passive once unlocked
}

/**
 * StudioUpgradeService: Manages unlocking and applying studio perks.
 */
export class StudioUpgradeService {
  private allPerks: Map<string, StudioPerk> = new Map(); // Loaded from game data
  private unlockedPerkIds: Set<string> = new Set();

  constructor(initialPerks: StudioPerk[]) {
    initialPerks.forEach(perk => {
      this.allPerks.set(perk.id, { ...perk, isUnlocked: false, isActive: false });
    });
  }

  /**
   * Checks if all conditions for a perk are met.
   * @param perkId - The ID of the perk to check.
   * @param gameState - Current global game state for checking conditions.
   */
  canUnlockPerk(perkId: string, gameState: GameState): boolean {
    const perk = this.allPerks.get(perkId);
    if (!perk || perk.isUnlocked) return false;

    for (const condition of perk.unlockConditions) {
      switch (condition.type) {
        case 'studioReputation':
          if (gameState.studioReputation < (condition.threshold || 0)) return false;
          break;
        case 'completedProjectsInGenre':
          const projectsInGenre = gameState.completedProjects.filter(
            p => p.genreId === condition.genreId
          ).length;
          if (projectsInGenre < (condition.threshold || 0)) return false;
          break;
        case 'staffSkillSum':
          let totalSkill = 0;
          gameState.staff.forEach(staffMember => {
            totalSkill += staffMember.skills.get(condition.skillId!) || 0;
          });
          if (totalSkill < (condition.threshold || 0)) return false;
          break;
        case 'specificPerkUnlocked':
          if (!this.unlockedPerkIds.has(condition.perkId!)) return false;
          break;
        // case 'researchPoints': // Assuming research points are part of gameState or player resources
        //   if (gameState.researchPoints < (condition.threshold || 0)) return false;
        //   break;
        default:
          return false; // Unknown condition type
      }
    }
    return true;
  }

  /**
   * Unlocks a perk if conditions are met and deducts any cost.
   * @param perkId - The ID of the perk to unlock.
   * @param gameState - Current game state (used for deducting cost, if any).
   * @returns True if perk was successfully unlocked, false otherwise.
   */
  unlockPerk(perkId: string, gameState: GameState): boolean {
    const perk = this.allPerks.get(perkId);
    if (!perk || !this.canUnlockPerk(perkId, gameState)) {
      return false;
    }

    // Deduct cost (e.g., from gameState.playerMoney or gameState.researchPoints)
    if (perk.cost /* && gameState.playerMoney >= perk.cost */) {
      // gameState.playerMoney -= perk.cost;
    } else if (perk.cost) {
      // return false; // Not enough resources
    }

    perk.isUnlocked = true;
    perk.isActive = true; // Most perks are active immediately
    this.unlockedPerkIds.add(perkId);
    // gameEventManager.triggerEvent('PerkUnlocked', { perkName: perk.name });
    return true;
  }

  /**
   * Gets all available perks (both locked and unlocked).
   */
  getAllPerks(): StudioPerk[] {
    return Array.from(this.allPerks.values());
  }

  /**
   * Gets all currently unlocked and active perks.
   */
  getActivePerks(): StudioPerk[] {
    return Array.from(this.unlockedPerkIds)
      .map(id => this.allPerks.get(id)!)
      .filter(perk => perk.isActive);
  }

  /**
   * Calculates the total effect value for a given attribute from all active perks.
   * @param attributeName - The name of the attribute (e.g., 'mixingQualityBonus').
   * @param baseValue - The base value of the attribute before perks.
   * @param scope - Optional scope to filter perks (e.g., a specific GenreId).
   */
  getAggregatedEffectValue(attributeName: string, baseValue: number, scope?: string): number {
    let modifiedValue = baseValue;
    let percentageBonus = 1.0;
    let flatBonus = 0;

    this.getActivePerks().forEach(perk => {
      perk.effects.forEach(effect => {
        if (effect.attribute === attributeName && (!effect.scope || effect.scope === scope)) {
          if (effect.type === 'percentage') {
            percentageBonus += effect.value;
          } else if (effect.type === 'flat') {
            flatBonus += effect.value;
          }
        }
      });
    });
    
    modifiedValue = (baseValue + flatBonus) * percentageBonus;
    return modifiedValue;
  }
}

/*
Integration with Game Systems:

1. Applying Effects:
   - When a relevant calculation occurs (e.g., calculating project quality, staff happiness, contract negotiation):
     // Example: Modifying Mixing Quality for a project
     // let baseMixingQuality = calculateBaseMixingQuality(staffSkills, equipment);
     // finalMixingQuality = studioUpgradeService.getAggregatedEffectValue('mixingQualityBonus', baseMixingQuality, project.genreId);

     // Example: Modifying Staff Happiness
     // let baseHappiness = calculateBaseHappiness(salary, workHours);
     // finalHappiness = studioUpgradeService.getAggregatedEffectValue('staffHappinessBonus', baseHappiness);

2. UI for Perks:
   - A "Studio Upgrades" or "Perks Tree" screen.
   - Display perks, their descriptions, costs, unlock conditions, and effects.
   - Allow players to click to unlock perks if they meet criteria and have resources.
   - Show which perks are currently active.

   // Conceptual React Hook for UI
   // src/hooks/useStudioPerks.ts
   import { useState, useEffect, useCallback } from 'react';
   import { studioUpgradeServiceInstance } from '../services'; // Singleton instance
   import { StudioPerk } from '../game-mechanics/studio-perks';
   import { gameStateInstance } from '../game-state'; // Access to global game state

   export function useStudioPerks() {
     const [allPerks, setAllPerks] = useState<StudioPerk[]>([]);
     const [unlockedPerks, setUnlockedPerks] = useState<StudioPerk[]>([]);

     const refreshPerks = useCallback(() => {
       setAllPerks(studioUpgradeServiceInstance.getAllPerks());
       setUnlockedPerks(studioUpgradeServiceInstance.getActivePerks());
     }, []);

     useEffect(() => {
       refreshPerks();
       // Potentially subscribe to game state changes or events that might affect perk unlockability
     }, [refreshPerks]);

     const attemptUnlockPerk = (perkId: string) => {
       // const currentGameState = gameStateInstance.getCurrentState(); // Get current game state
       // const success = studioUpgradeServiceInstance.unlockPerk(perkId, currentGameState);
       // if (success) {
       //   refreshPerks(); 
       //   // Potentially update game state if cost was deducted
       // }
       // return success;
       return false; // Placeholder
     };

     return { allPerks, unlockedPerks, canUnlockPerk: studioUpgradeServiceInstance.canUnlockPerk, attemptUnlockPerk, refreshPerks };
   }
*/
