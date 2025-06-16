import { useCallback } from 'react';
import { GameState } from '@/types/game';
import { toast } from '@/hooks/use-toast';

export const useStudioExpansion = (
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
) => {
  const purchaseExpansion = useCallback((expansionId: string) => {
    const expansion = gameState.availableExpansions?.find(e => e.id === expansionId);
    
    if (!expansion) {
      toast({
        title: "Expansion Not Found",
        description: "This expansion is not available.",
        variant: "destructive"
      });
      return;
    }

    if (gameState.money < expansion.cost) {
      toast({
        title: "Insufficient Funds",
        description: `You need $${expansion.cost.toLocaleString()} to purchase this expansion.`,
        variant: "destructive"
      });
      return;
    }

    if (gameState.playerData.level < expansion.requirements.level) {
      toast({
        title: "Level Too Low",
        description: `You need to be level ${expansion.requirements.level} to purchase this expansion.`,
        variant: "destructive"
      });
      return;
    }

    if (gameState.reputation < expansion.requirements.reputation) {
      toast({
        title: "Reputation Too Low",
        description: `You need ${expansion.requirements.reputation} reputation to purchase this expansion.`,
        variant: "destructive"
      });
      return;
    }

    if (gameState.ownedUpgrades.includes(expansionId)) {
      toast({
        title: "Already Owned",
        description: "You already own this expansion.",
        variant: "destructive"
      });
      return;
    }

    // Apply expansion benefits
    const updatedStudioSkills = { ...gameState.studioSkills };
    Object.entries(expansion.benefits).forEach(([key, value]) => {
      if (updatedStudioSkills[key]) {
        updatedStudioSkills[key] = {
          ...updatedStudioSkills[key],
          multiplier: (updatedStudioSkills[key].multiplier || 1) * value
        };
      }
    });

    setGameState(prev => ({
      ...prev,
      money: prev.money - expansion.cost,
      ownedUpgrades: [...prev.ownedUpgrades, expansionId],
      studioSkills: updatedStudioSkills
    }));

    toast({
      title: "🎉 Expansion Purchased!",
      description: `You've added ${expansion.name} to your studio!`,
      duration: 3000
    });
  }, [gameState, setGameState]);

  const getExpansionBenefits = useCallback((expansionId: string) => {
    const expansion = gameState.availableExpansions?.find(e => e.id === expansionId);
    if (!expansion) return null;
    return expansion.benefits;
  }, [gameState.availableExpansions]);

  const getTotalStudioMultipliers = useCallback(() => {
    const multipliers: Record<string, number> = {};
    
    // Start with base multipliers
    Object.entries(gameState.studioSkills).forEach(([key, skill]) => {
      multipliers[key] = skill.multiplier || 1;
    });

    // Apply expansion benefits
    gameState.ownedUpgrades.forEach(upgradeId => {
      const expansion = gameState.availableExpansions?.find(e => e.id === upgradeId);
      if (expansion) {
        Object.entries(expansion.benefits).forEach(([key, value]) => {
          if (multipliers[key]) {
            multipliers[key] *= value;
          }
        });
      }
    });

    return multipliers;
  }, [gameState.studioSkills, gameState.ownedUpgrades, gameState.availableExpansions]);

  return {
    purchaseExpansion,
    getExpansionBenefits,
    getTotalStudioMultipliers
  };
}; 