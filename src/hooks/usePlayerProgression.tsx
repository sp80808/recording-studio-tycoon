
import { useCallback } from 'react';
import { GameState, PlayerAttributes } from '@/types/game';
import { toast } from '@/hooks/use-toast';

export const usePlayerProgression = (gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState>>) => {
  
  const calculateXPToNextLevel = (level: number): number => {
    // Logarithmic progression to prevent exponential scaling
    // Early levels are reasonable, but higher levels require exponentially more XP
    const baseXP = 100;
    const growthFactor = 1.4; // Exponential multiplier
    const levelOffset = Math.max(0, level - 1);
    
    return Math.floor(baseXP * Math.pow(growthFactor, levelOffset * 0.7));
  };

  const checkAndHandleLevelUp = useCallback(() => {
    const { playerData } = gameState;
    let newLevel = playerData.level;
    let newXP = playerData.xp;
    let newPerkPoints = playerData.perkPoints;
    let leveledUp = false;

    // Handle multiple level ups
    while (newXP >= calculateXPToNextLevel(newLevel)) {
      newXP -= calculateXPToNextLevel(newLevel);
      newLevel++;
      // Reduced perk points to balance progression
      const perkPointsToAdd = newLevel <= 10 ? 2 : (newLevel <= 25 ? 1 : 0);
      newPerkPoints += perkPointsToAdd;
      leveledUp = true;
      
      toast({
        title: "🎉 Level Up!",
        description: `Welcome to Level ${newLevel}! +2 Perk Points earned!`,
        duration: 4000
      });
    }

    if (leveledUp) {
      setGameState(prev => ({
        ...prev,
        playerData: {
          ...prev.playerData,
          level: newLevel,
          xp: newXP,
          xpToNextLevel: calculateXPToNextLevel(newLevel),
          perkPoints: newPerkPoints,
          dailyWorkCapacity: prev.playerData.attributes.focusMastery + 3 + newLevel - 1 // Increase capacity with level
        }
      }));
    }
  }, [gameState, setGameState]);

  const levelUpPlayer = useCallback(() => {
    checkAndHandleLevelUp();
  }, [checkAndHandleLevelUp]);

  const spendPerkPoint = useCallback((attribute: keyof PlayerAttributes): GameState => {
    const updatedGameState = {
      ...gameState,
      playerData: {
        ...gameState.playerData,
        perkPoints: gameState.playerData.perkPoints - 1,
        attributes: {
          ...gameState.playerData.attributes,
          [attribute]: gameState.playerData.attributes[attribute] + 1
        }
      }
    };

    // Update daily work capacity if focusMastery was upgraded
    if (attribute === 'focusMastery') {
      updatedGameState.playerData.dailyWorkCapacity = updatedGameState.playerData.attributes.focusMastery + 3 + updatedGameState.playerData.level - 1;
    }

    return updatedGameState;
  }, [gameState]);

  return {
    levelUpPlayer,
    spendPerkPoint,
    checkAndHandleLevelUp
  };
};
