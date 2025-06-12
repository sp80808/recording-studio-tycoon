import { GameState, PlayerAttributes } from '@/types/game'; // Keep PlayerAttributes if used by addAttributePoints
import { calculatePlayerXpRequirement, PLAYER_MILESTONES, PlayerMilestone } from '@/utils/progressionUtils';
import { LevelUpDetails, PlayerAttributeChange, UnlockedFeatureInfo, PlayerAbilityChange } from '@/types/game';

// Changed setGameState to updateGameState to match the signature from useGameState
// Added triggerLevelUpModal to parameters
export const useGameActions = (
  gameState: GameState, 
  updateGameState: (updater: (prevState: GameState) => GameState) => void,
  triggerLevelUpModal: (details: LevelUpDetails) => void // New parameter
) => {
  const advanceDay = () => {
    updateGameState(prev => ({
      ...prev,
      currentDay: prev.currentDay + 1
    }));
  };

  const performDailyWork = () => {
    // This is a placeholder implementation
    // The actual implementation should be moved from useGameLogic
    return {
      isComplete: false,
      review: null
      // Ensure this return type matches what ActiveProject.tsx expects,
      // especially regarding finalProjectData if that's still a source of errors.
      // Based on current ActiveProject.tsx, it doesn't expect finalProjectData from here.
    };
  };

  const collectMoney = (amount: number) => {
    updateGameState(prev => ({
      ...prev,
      money: prev.money + amount
    }));
  };

  const addMoney = (amount: number) => {
    collectMoney(amount);
  };

  const addReputation = (amount: number) => {
    updateGameState(prev => ({
      ...prev,
      playerData: {
        ...prev.playerData,
        reputation: prev.playerData.reputation + amount
      }
    }));
  };

  const addXP = (amount: number): void => { // Return type is now void
    let levelUpOccurred = false;
    // Access playerData from the latest gameState via a prev state in updater, or ensure gameState prop is always fresh
    // For simplicity in this diff, we'll assume gameState prop is sufficiently up-to-date for initial read.
    const initialPlayerLevel = gameState.playerData.level; 
    let newPlayerLevel = initialPlayerLevel;
    let currentXp = gameState.playerData.xp + amount;
    let xpToNext = gameState.playerData.xpToNextLevel;
    let perkPointsGainedThisLevelUp = 0;
    let attributePointsGainedThisLevelUp = 0;
    
    const collectedUnlockedFeatures: UnlockedFeatureInfo[] = [];
    const collectedAbilityChanges: PlayerAbilityChange[] = [];
    const collectedAttributeChanges: PlayerAttributeChange[] = [];


    while (currentXp >= xpToNext) {
      levelUpOccurred = true;
      newPlayerLevel++;
      currentXp -= xpToNext;
      xpToNext = calculatePlayerXpRequirement(newPlayerLevel);
      
      const milestone: PlayerMilestone | undefined = PLAYER_MILESTONES[newPlayerLevel];
      if (milestone) {
        if (milestone.unlockedFeatures) {
          collectedUnlockedFeatures.push(...milestone.unlockedFeatures);
        }
        if (milestone.abilityChanges) {
          collectedAbilityChanges.push(...milestone.abilityChanges.map(change => ({
            ...change,
            oldValue: change.oldValue !== undefined ? change.oldValue : 'N/A', 
          })));
        }
        perkPointsGainedThisLevelUp += milestone.perkPointsGained || 0;
        attributePointsGainedThisLevelUp += milestone.attributePointsGained || 0;
      }
    }

    // Prepare attribute changes for the modal *before* updating the state
    // This captures the "before" state for attributes that might receive points.
    if (levelUpOccurred && attributePointsGainedThisLevelUp > 0) {
      // This part is tricky: if points are awarded, the modal should show "Attribute Points Gained: X"
      // rather than direct attribute changes, unless milestones *directly* increase attributes.
      // For now, let's assume PLAYER_MILESTONES might directly specify attribute increases.
      // If PLAYER_MILESTONES only gives points, this section needs adjustment.
      // The current PLAYER_MILESTONES doesn't directly give attribute increases, only points.
      // So, `collectedAttributeChanges` would be empty unless we change PLAYER_MILESTONES or how points are handled.
      // For simplicity, we'll assume attribute points are spent by the player later.
      // The modal can show "You gained X attribute points!".
      // If milestones *did* grant direct attribute increases, it would look like:
      // Object.keys(gameState.playerData.attributes).forEach(key => {
      //   const attrKey = key as keyof PlayerAttributes;
      //   const milestoneEffect = MILESTONE_DIRECT_ATTRIBUTE_BONUSES[newPlayerLevel]?.[attrKey] || 0;
      //   if (milestoneEffect > 0) {
      //     collectedAttributeChanges.push({
      //       name: attrKey,
      //       oldValue: gameState.playerData.attributes[attrKey],
      //       newValue: gameState.playerData.attributes[attrKey] + milestoneEffect,
      //     });
      //   }
      // });
    }


    updateGameState(prev => {
      const newPlayerData = {
        ...prev.playerData,
        xp: currentXp,
        level: newPlayerLevel,
        xpToNextLevel: xpToNext,
        perkPoints: prev.playerData.perkPoints + perkPointsGainedThisLevelUp,
        attributePoints: (prev.playerData.attributePoints || 0) + attributePointsGainedThisLevelUp,
      };

      // Apply direct ability changes from milestones to player data
      if (levelUpOccurred) {
        collectedAbilityChanges.forEach(change => {
          if (change.name === 'Daily Work Capacity' && typeof change.newValue === 'number') {
            newPlayerData.dailyWorkCapacity = change.newValue;
          }
          // Add other direct ability changes here if they modify PlayerData directly
        });
      }
      
      return {
        ...prev,
        playerData: newPlayerData,
      };
    });

    if (levelUpOccurred) {
      return {
        newPlayerLevel: newPlayerLevel,
        unlockedFeatures: collectedUnlockedFeatures,
        abilityChanges: collectedAbilityChanges,
        attributeChanges: collectedAttributeChanges, // Will be empty based on current milestone setup
        // ProjectSummaries and StaffHighlights would be complex to gather here.
        // They require tracking state across level-up periods.
        // For V1 of the modal, these can be omitted or simplified.
        projectSummaries: [], 
        staffHighlights: [],
      };
      triggerLevelUpModal(detailsForModal); // Call the trigger function
    }
    // No longer returns LevelUpDetails
  };

  const addAttributePoints = (attribute: keyof GameState['playerData']['attributes']) => {
    updateGameState(prev => {
      if ((prev.playerData.attributePoints || 0) > 0) {
        return {
          ...prev,
          playerData: {
            ...prev.playerData,
            attributes: {
              ...prev.playerData.attributes,
              [attribute]: prev.playerData.attributes[attribute] + 1
            },
            attributePoints: (prev.playerData.attributePoints || 0) - 1,
          }
        };
      }
      return prev; // No points to spend
    });
  };

  const addSkillXP = (skillId: string, amount: number) => {
    updateGameState(prev => ({
      ...prev,
      studioSkills: {
        ...prev.studioSkills,
        [skillId]: {
          ...prev.studioSkills[skillId],
          xp: prev.studioSkills[skillId].xp + amount
          // Actual skill level up logic should be here or in progressionUtils
        }
      }
    }));
  };

  const addPerkPoint = () => { // This function might be redundant if perk points are awarded on level up
    updateGameState(prev => ({
      ...prev,
      playerData: {
        ...prev.playerData,
        perkPoints: prev.playerData.perkPoints + 1
      }
    }));
  };

  return {
    advanceDay,
    performDailyWork,
    updateGameState, 
    collectMoney,
    addMoney,
    addReputation,
    addXP,
    addAttributePoints,
    addSkillXP,
    addPerkPoint,
    triggerEraTransition: (newEraId: string) => { 
      console.log(`Triggering era transition to ${newEraId} (placeholder)`);
      updateGameState(prev => ({
        ...prev,
        currentEra: newEraId,
      }));
    },
    refreshCandidates: () => { 
        console.log("Refreshing candidates (placeholder in useGameActions)");
    }
  };
};
