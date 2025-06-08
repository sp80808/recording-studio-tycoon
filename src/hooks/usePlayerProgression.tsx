
import { useCallback } from 'react';
import { GameState, PlayerAttributes } from '@/types/game';
import { toast } from '@/hooks/use-toast';
import { spendPerkPoint as utilSpendPerkPoint } from '@/utils/gameUtils';

export const usePlayerProgression = (gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState>>) => {
  const checkAndHandleLevelUp = useCallback(() => {
    if (gameState.playerData.xp >= gameState.playerData.xpToNextLevel) {
      const levelsGained = Math.floor(gameState.playerData.xp / gameState.playerData.xpToNextLevel);
      const remainingXP = gameState.playerData.xp % gameState.playerData.xpToNextLevel;
      const newLevel = gameState.playerData.level + levelsGained;
      
      setGameState(prev => ({
        ...prev,
        playerData: {
          ...prev.playerData,
          level: newLevel,
          xp: remainingXP,
          perkPoints: prev.playerData.perkPoints + levelsGained,
          xpToNextLevel: 100 + (newLevel - 1) * 50 // Scaling XP requirement
        }
      }));

      toast({
        title: "🎉 Level Up!",
        description: `You are now level ${newLevel}! You gained ${levelsGained} perk point${levelsGained > 1 ? 's' : ''}!`,
        duration: 4000
      });

      return true;
    }
    return false;
  }, [gameState.playerData, setGameState]);

  const levelUpPlayer = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      playerData: {
        ...prev.playerData,
        level: prev.playerData.level + 1,
        perkPoints: prev.playerData.perkPoints + 1,
        xpToNextLevel: prev.playerData.xpToNextLevel + 50
      }
    }));

    toast({
      title: "Level Up!",
      description: `You are now level ${gameState.playerData.level + 1}! You gained a perk point.`,
    });
  }, [gameState.playerData.level, setGameState]);

  const spendPerkPoint = useCallback((attribute: keyof PlayerAttributes): GameState => {
    if (gameState.playerData.perkPoints <= 0) {
      return gameState;
    }

    const updatedGameState = utilSpendPerkPoint(gameState, attribute);

    toast({
      title: "Attribute Upgraded!",
      description: `${String(attribute)} increased to ${updatedGameState.playerData.attributes[attribute]}`,
    });

    return updatedGameState;
  }, [gameState]);

  return {
    levelUpPlayer,
    spendPerkPoint,
    checkAndHandleLevelUp
  };
};
