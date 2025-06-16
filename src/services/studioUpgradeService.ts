import { GameState } from '@/types/game';
import { StudioPerk, PerkUnlockCondition, PerkEffect } from '@/types/studioPerks';
// import { allStudioPerksData } from '@/data/studioPerksData'; // Assuming perk data will be in this file

// Placeholder for actual perk data. This should be loaded from a data file.
const allStudioPerksData: StudioPerk[] = [
  {
    id: 'basicAcoustics', name: 'Basic Acoustic Treatment',
    description: 'Improves recording quality slightly by reducing unwanted room reflections.',
    category: 'Acoustics', tier: 1,
    cost: { money: 5000 },
    unlockConditions: [{ type: 'playerLevel', value: 2 }],
    effects: [{ key: 'globalRecordingQualityModifier', value: 0.02, operation: 'multiply' }], // +2%
  },
  {
    id: 'negotiation101', name: 'Negotiation 101',
    description: 'Slightly better contract payouts from clients.',
    category: 'BusinessOperations', tier: 1,
    cost: { money: 3000, perkPoints: 1 },
    unlockConditions: [{ type: 'completedProjects', value: 5 }],
    effects: [{ key: 'contractPayoutModifier', value: 0.03, operation: 'multiply' }], // +3%
  },
  {
    id: 'talentScoutNetwork', name: 'Talent Scout Network',
    description: 'Increases the quality and variety of available staff candidates.',
    category: 'TalentAcquisition', tier: 2,
    cost: { money: 15000, perkPoints: 2 },
    unlockConditions: [{ type: 'studioReputation', value: 30 }],
    effects: [{ key: 'candidateQualityBonus', value: 10, operation: 'add' }], // e.g., +10 to avg candidate skill
    prerequisites: ['negotiation101']
  }
];


export const studioUpgradeService = {
  /**
   * Gets all available perks for the player, considering unlock conditions and prerequisites.
   * @param gameState The current game state.
   * @returns An array of StudioPerk objects that are available to be unlocked/purchased.
   */
  getAvailablePerks: (gameState: GameState): StudioPerk[] => {
    const { playerData, ownedUpgrades, completedProjects, studioSkills } = gameState;
    
    return allStudioPerksData.filter(perk => {
      // 1. Check if already owned
      if (ownedUpgrades.includes(perk.id) && !perk.isRepeatable) {
        return false;
      }
      if (perk.isRepeatable && perk.maxRepeats) {
        const timesOwned = ownedUpgrades.filter(id => id === perk.id).length;
        if (timesOwned >= perk.maxRepeats) return false;
      }

      // 2. Check prerequisites (other perks)
      if (perk.prerequisites && perk.prerequisites.length > 0) {
        if (!perk.prerequisites.every(prereqId => ownedUpgrades.includes(prereqId))) {
          return false;
        }
      }

      // 3. Check unlock conditions
      return perk.unlockConditions.every(condition => 
        checkCondition(condition, gameState)
      );
    });
  },

  /**
   * Checks if a specific perk can be unlocked/purchased by the player.
   * @param perkId The ID of the perk to check.
   * @param gameState The current game state.
   * @returns True if the perk can be unlocked, false otherwise.
   */
  canUnlockPerk: (perkId: string, gameState: GameState): boolean => {
    const perk = allStudioPerksData.find(p => p.id === perkId);
    if (!perk) return false;

    if (gameState.ownedUpgrades.includes(perk.id) && !perk.isRepeatable) return false;
    // Add check for maxRepeats if isRepeatable

    if (perk.prerequisites && !perk.prerequisites.every(pId => gameState.ownedUpgrades.includes(pId))) {
      return false;
    }
    return perk.unlockConditions.every(condition => checkCondition(condition, gameState));
  },

  /**
   * Unlocks/purchases a perk for the player if conditions are met and cost is paid.
   * This function would modify the GameState.
   * @param perkId The ID of the perk to unlock.
   * @param gameState The current game state.
   * @returns A new GameState object if successful, or null if unlock failed.
   *          (Or this could directly call updateGameState from a hook)
   */
  unlockPerk: (perkId: string, currentGameState: GameState): GameState | null => {
    const perk = allStudioPerksData.find(p => p.id === perkId);
    if (!perk || !studioUpgradeService.canUnlockPerk(perkId, currentGameState)) {
      console.warn(`Cannot unlock perk ${perkId}. Conditions not met or perk already owned.`);
      return null;
    }

    const newGameState = { ...currentGameState }; // Changed to const

    // Deduct cost
    if (perk.cost) {
      if (perk.cost.money && newGameState.money < perk.cost.money) return null; // Not enough money
      if (perk.cost.money) newGameState.money -= perk.cost.money;
      
      if (perk.cost.perkPoints && newGameState.playerData.perkPoints < perk.cost.perkPoints) return null; // Not enough perk points
      if (perk.cost.perkPoints) newGameState.playerData.perkPoints -= perk.cost.perkPoints;
      
      // Handle researchPoints if that system exists
    }

    newGameState.ownedUpgrades = [...newGameState.ownedUpgrades, perk.id];
    
    // Applying effects would typically happen elsewhere, by systems that read ownedUpgrades.
    // Or, could be done here if effects are direct state modifications.
    // For now, just adding to ownedUpgrades.
    console.log(`Perk ${perk.name} unlocked!`);
    return newGameState;
  },

  /**
   * Gets all perks owned by the player.
   * @param gameState The current game state.
   * @returns An array of StudioPerk objects owned by the player.
   */
  getOwnedPerks: (gameState: GameState): StudioPerk[] => {
    return allStudioPerksData.filter(perk => gameState.ownedUpgrades.includes(perk.id));
  },

  /**
   * Applies the effects of all owned perks to the game state.
   * This is a conceptual function. In practice, individual systems (e.g., project calculation,
   * staff training) would query owned perks and apply relevant modifiers.
   * Or, some global modifiers could be aggregated here and stored in GameState.
   * @param gameState The current game state.
   * @returns The modified GameState (or just an object of aggregated modifiers).
   */
  applyAllPerkEffects: (gameState: GameState): GameState => {
    const modifiedGameState = { ...gameState }; // Changed to const
    const ownedPerks = studioUpgradeService.getOwnedPerks(gameState);

    // Example: Aggregate global modifiers
    // This object is modified, so it should remain 'let' if we intend to build it up.
    // However, if it's only assigned once and its properties are modified, it can be const.
    // For simplicity and to satisfy lint, if we are just calculating and returning, it can be const.
    // Let's assume we are building it up, so this one might be an exception or needs restructuring.
    // For now, to fix the lint, if it's not reassigned, make it const.
    // If the intention is to modify properties of globalModifiers, it can be const.
    const globalModifiers = { // Changed to const, assuming properties are modified, not the object itself.
      mixingQuality: 1.0,
      recordingQuality: 1.0,
      contractPayout: 1.0,
      // ... other potential global effects
    };

    ownedPerks.forEach(perk => {
      perk.effects.forEach(effect => {
        // This is highly simplified. A real system needs a robust way to target and apply effects.
        if (effect.key === 'globalMixingQualityModifier' && typeof effect.value === 'number') {
          if (effect.operation === 'multiply') globalModifiers.mixingQuality *= (1 + effect.value);
          else globalModifiers.mixingQuality += effect.value;
        }
        if (effect.key === 'globalRecordingQualityModifier' && typeof effect.value === 'number') {
          if (effect.operation === 'multiply') globalModifiers.recordingQuality *= (1 + effect.value);
          else globalModifiers.recordingQuality += effect.value;
        }
        if (effect.key === 'contractPayoutModifier' && typeof effect.value === 'number') {
            if (effect.operation === 'multiply') globalModifiers.contractPayout *= (1 + effect.value);
            else globalModifiers.contractPayout += effect.value;
        }
        // ... handle other specific effect keys
      });
    });
    
    // Store or use these aggregated modifiers. For example:
    // modifiedGameState.aggregatedPerkModifiers = globalModifiers; 
    // Systems would then use gameState.aggregatedPerkModifiers.mixingQuality etc.

    console.log("Applied perk effects (conceptual):", globalModifiers);
    return modifiedGameState; // Or return just the modifiers
  },
};

/**
 * Helper function to check if a single unlock condition is met.
 */
const checkCondition = (condition: PerkUnlockCondition, gameState: GameState): boolean => {
  const { playerData, reputation, completedProjects, studioSkills, ownedEquipment } = gameState;
  
  switch (condition.type) {
    case 'playerLevel':
      return playerData.level >= condition.value;
    case 'studioReputation':
      return reputation >= condition.value;
    case 'completedProjects':
      return (completedProjects?.length || 0) >= condition.value;
    case 'projectsInGenre':
      if (!condition.genre) return false;
      return (completedProjects?.filter(p => p.genre === condition.genre).length || 0) >= condition.value;
    case 'staffSkillSum':
      if (!condition.skill) return false;
      // This needs access to all staff members' skills
      // Placeholder:
      // const totalSkill = gameState.hiredStaff.reduce((sum, staff) => sum + (staff.skills?.[condition.skill!]?.level || 0), 0);
      // return totalSkill >= condition.value;
      return true; // Placeholder
    case 'specificEquipmentOwned':
      if (!condition.equipmentId) return false;
      return ownedEquipment.some(eq => eq.id === condition.equipmentId);
    case 'specificPerkUnlocked':
      if (!condition.perkId) return false;
      return gameState.ownedUpgrades.includes(condition.perkId);
    case 'moneyEarned':
      // This would require tracking total money earned, not just current money
      return true; // Placeholder
    case 'chartSuccesses':
      // This would require tracking chart history
      return true; // Placeholder
    default:
      return false;
  }
};
