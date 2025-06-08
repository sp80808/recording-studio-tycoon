
import { useCallback } from 'react';
import { GameState, PlayerAttributes } from '@/types/game';
import { toast } from '@/hooks/use-toast';

export const usePlayerProgression = (gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState>>) => {
  
  const calculateXPToNextLevel = (level: number): number => {
    return 100 + (level - 1) * 50; // Base 100, +50 per level
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
      newPerkPoints += 2; // 2 perk points per level
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
