import { GameState } from '@/types/game';

export const useGameActions = (gameState: GameState, setGameState: (state: GameState) => void) => {
  const advanceDay = () => {
    setGameState({
      ...gameState,
      currentDay: gameState.currentDay + 1
    });
  };

  const collectMoney = (amount: number) => {
    setGameState({
      ...gameState,
      playerData: {
        ...gameState.playerData,
        money: gameState.playerData.money + amount
      }
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
    collectMoney,
    addMoney,
    addReputation,
    addXP,
    addAttributePoints,
    addSkillXP,
    addPerkPoint
  };
}; 