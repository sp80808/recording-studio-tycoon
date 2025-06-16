import { useCallback } from 'react';
import { GameState, Band } from '@/types/game';
import { PerformanceRating } from '@/types/performance';
import { toast } from '@/components/ui/use-toast';

interface UseBandReputationProps {
  gameState: GameState;
  setGameState: (updater: (prevState: GameState) => GameState) => void;
}

export const useBandReputation = ({ gameState, setGameState }: UseBandReputationProps) => {
  // Calculate reputation gain from a performance
  const calculateReputationGain = useCallback((performance: PerformanceRating, band: Band): number => {
    const baseGain = performance.overall * 0.5; // Base gain from overall performance
    const genreBonus = performance.genreMatch * 0.3; // Bonus for genre match
    const technicalBonus = performance.technical * 0.2; // Bonus for technical execution
    const creativityBonus = performance.creativity * 0.2; // Bonus for creativity
    const stagePresenceBonus = performance.stagePresence * 0.2; // Bonus for stage presence

    // Calculate total gain
    const totalGain = Math.floor(
      baseGain + genreBonus + technicalBonus + creativityBonus + stagePresenceBonus
    );

    // Apply band's current reputation as a multiplier (diminishing returns)
    const reputationMultiplier = Math.max(0.5, 1 - (band.reputation / 1000));
    return Math.floor(totalGain * reputationMultiplier);
  }, []);

  // Update band reputation after a performance
  const updateBandReputation = useCallback((bandId: string, performance: PerformanceRating): void => {
    const band = gameState.playerBands.find(b => b.id === bandId);
    if (!band) {
      toast({
        title: "Error",
        description: "Band not found",
        variant: "destructive"
      });
      return;
    }

    const reputationGain = calculateReputationGain(performance, band);
    
    setGameState(prev => ({
      ...prev,
      playerBands: prev.playerBands.map(b =>
        b.id === bandId
          ? {
              ...b,
              reputation: b.reputation + reputationGain,
              performanceHistory: [
                ...(b.performanceHistory || []),
                {
                  date: prev.currentDay,
                  rating: performance,
                  reputationGain
                }
              ]
            }
          : b
      )
    }));

    // Show feedback to the player
    toast({
      title: "Performance Review",
      description: `Band reputation ${reputationGain >= 0 ? 'increased' : 'decreased'} by ${Math.abs(reputationGain)} points.`,
      variant: reputationGain >= 0 ? "default" : "destructive"
    });
  }, [gameState, setGameState, calculateReputationGain]);

  // Get band's reputation level
  const getReputationLevel = useCallback((reputation: number): string => {
    if (reputation >= 1000) return "Legendary";
    if (reputation >= 750) return "Famous";
    if (reputation >= 500) return "Well-known";
    if (reputation >= 250) return "Rising";
    if (reputation >= 100) return "Local";
    return "Unknown";
  }, []);

  // Get band's reputation progress to next level
  const getReputationProgress = useCallback((reputation: number): { next: number; progress: number } => {
    const levels = [0, 100, 250, 500, 750, 1000];
    const currentLevelIndex = levels.findIndex(level => reputation < level) - 1;
    const currentLevelThreshold = levels[currentLevelIndex] || 0;
    const nextLevelThreshold = levels[currentLevelIndex + 1] || levels[levels.length - 1];
    
    return {
      next: nextLevelThreshold,
      progress: ((reputation - currentLevelThreshold) / (nextLevelThreshold - currentLevelThreshold)) * 100
    };
  }, []);

  return {
    calculateReputationGain,
    updateBandReputation,
    getReputationLevel,
    getReputationProgress
  };
}; 