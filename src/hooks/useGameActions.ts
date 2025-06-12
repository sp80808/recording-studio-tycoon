import { GameState } from '@/types/game';

export const useGameActions = (gameState: GameState, setGameState: (state: GameState) => void) => {
  const advanceDay = () => {
    setGameState({
      ...gameState,
      currentDay: gameState.currentDay + 1
    });
  };

  const performDailyWork = () => {
    // This is a placeholder implementation
    // The actual implementation should be moved from useGameLogic
    return {
      isComplete: false,
      review: null
    };
  };

  const updateGameState = (updater: (prevState: GameState) => GameState) => {
    setGameState(updater(gameState));
  };

  const collectMoney = (amount: number) => {
    setGameState({
      ...gameState,
      money: gameState.money + amount // Money is at the root of GameState
    });
  };

  const addMoney = (amount: number) => {
    collectMoney(amount);
  };

  const addReputation = (amount: number) => {
    setGameState({
      ...gameState,
      playerData: {
        ...gameState.playerData,
        reputation: gameState.playerData.reputation + amount
      }
    });
  };

  const addXP = (amount: number) => {
    setGameState({
      ...gameState,
      playerData: {
        ...gameState.playerData,
        xp: gameState.playerData.xp + amount
      }
    });
  };

  const addAttributePoints = (attribute: keyof GameState['playerData']['attributes']) => {
    setGameState({
      ...gameState,
      playerData: {
        ...gameState.playerData,
        attributes: {
          ...gameState.playerData.attributes,
          [attribute]: gameState.playerData.attributes[attribute] + 1
        }
      }
    });
  };

  const addSkillXP = (skillId: string, amount: number) => {
    setGameState({
      ...gameState,
      studioSkills: {
        ...gameState.studioSkills,
        [skillId]: {
          ...gameState.studioSkills[skillId],
          xp: gameState.studioSkills[skillId].xp + amount
        }
      }
    });
  };

  const addPerkPoint = () => {
    setGameState({
      ...gameState,
      playerData: {
        ...gameState.playerData,
        perkPoints: gameState.playerData.perkPoints + 1
      }
    });
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
    triggerEraTransition: (newEraId: string) => { // Placeholder
      console.log(`Triggering era transition to ${newEraId} (placeholder)`);
      // Actual logic would update gameState.currentEra, gameState.currentYear,
      // gameState.equipmentMultiplier, potentially refresh projects/equipment, etc.
      // This is a complex action and needs to be fully implemented.
      setGameState({
        ...gameState,
        currentEra: newEraId,
        // Reset or adjust other era-specific parts of the state here
      });
    },
    refreshCandidates: () => { // Placeholder, actual candidate generation might be in staffUtils or staffGeneration
        console.log("Refreshing candidates (placeholder in useGameActions)");
        // This should ideally use generateCandidates from staffGeneration
        // setGameState({
        //   ...gameState,
        //   availableCandidates: generateCandidates(3) // Example
        // });
    }
  };
};
