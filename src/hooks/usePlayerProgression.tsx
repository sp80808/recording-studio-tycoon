
import { useCallback } from 'react';
import { GameState, PlayerAttributes } from '@/types/game';
import { toast } from '@/hooks/use-toast';

export const usePlayerProgression = (gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState>>) => {
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

  const spendPerkPoint = useCallback((attribute: keyof PlayerAttributes) => {
    if (gameState.playerData.perkPoints <= 0) return;

    setGameState(prev => ({
      ...prev,
      playerData: {
        ...prev.playerData,
        perkPoints: prev.playerData.perkPoints - 1,
        attributes: {
          ...prev.playerData.attributes,
          [attribute]: prev.playerData.attributes[attribute] + 1
        }
      }
    }));

    toast({
      title: "Attribute Upgraded!",
      description: `${attribute} increased to ${gameState.playerData.attributes[attribute] + 1}`,
    });
  }, [gameState.playerData, setGameState]);

  return {
    levelUpPlayer,
    spendPerkPoint
  };
};
