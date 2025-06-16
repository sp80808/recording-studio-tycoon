import { useCallback } from 'react';
import { GameState } from '@/types/game';
import { toast } from '@/hooks/use-toast';

export const useReputation = (
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
) => {
  const updateReputation = useCallback((amount: number) => {
    setGameState(prev => ({
      ...prev,
      reputation: Math.max(0, prev.reputation + amount)
    }));

    if (amount > 0) {
      toast({
        title: "Reputation Increased!",
        description: `Your studio's reputation has increased by ${amount}.`,
        duration: 3000
      });
    } else if (amount < 0) {
      toast({
        title: "Reputation Decreased",
        description: `Your studio's reputation has decreased by ${Math.abs(amount)}.`,
        variant: "destructive",
        duration: 3000
      });
    }
  }, [setGameState]);

  const calculateProjectReputation = useCallback((projectQuality: number) => {
    // Base reputation gain from project quality (0-100)
    const baseReputation = Math.floor(projectQuality / 10);
    
    // Bonus reputation based on current reputation level
    const reputationMultiplier = 1 + (gameState.reputation / 1000);
    
    return Math.floor(baseReputation * reputationMultiplier);
  }, [gameState.reputation]);

  const calculateBandReputation = useCallback((bandFame: number, projectQuality: number) => {
    // Base reputation gain from band fame and project quality
    const baseReputation = Math.floor((bandFame + projectQuality) / 20);
    
    // Bonus reputation based on current reputation level
    const reputationMultiplier = 1 + (gameState.reputation / 1000);
    
    return Math.floor(baseReputation * reputationMultiplier);
  }, [gameState.reputation]);

  return {
    updateReputation,
    calculateProjectReputation,
    calculateBandReputation
  };
}; 