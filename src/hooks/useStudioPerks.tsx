import { useState, useEffect, useCallback } from 'react';
import { useGameState } from './useGameState';
import { StudioPerk } from '@/types/studioPerks';
import { studioUpgradeService } from '@/services/studioUpgradeService';
import { toast } from '@/components/ui/use-toast';

export interface UseStudioPerksReturn {
  availablePerks: StudioPerk[];
  ownedPerks: StudioPerk[];
  canUnlock: (perkId: string) => boolean;
  unlockPerk: (perkId: string) => void;
  isLoading: boolean;
}

export const useStudioPerks = (): UseStudioPerksReturn => {
  const { gameState, setGameState } = useGameState(); // Reverted to setGameState
  const [availablePerks, setAvailablePerks] = useState<StudioPerk[]>([]);
  const [ownedPerks, setOwnedPerks] = useState<StudioPerk[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (gameState) {
      setIsLoading(true);
      setAvailablePerks(studioUpgradeService.getAvailablePerks(gameState));
      setOwnedPerks(studioUpgradeService.getOwnedPerks(gameState));
      setIsLoading(false);
    }
  }, [gameState]);

  const canUnlock = useCallback((perkId: string): boolean => {
    if (!gameState) return false;
    return studioUpgradeService.canUnlockPerk(perkId, gameState);
  }, [gameState]);

  const unlockPerk = useCallback((perkId: string): void => {
    if (!gameState) {
      toast({ title: "Error", description: "Game state not available.", variant: "destructive" });
      return;
    }
    
    const currentMoney = gameState.money;
    const currentPerkPoints = gameState.playerData.perkPoints;
    // Find perk from allStudioPerksData directly or ensure getAvailablePerks is efficient
    const perkToUnlock = studioUpgradeService.getAvailablePerks(gameState).find(p => p.id === perkId);


    if (!perkToUnlock) {
        toast({ title: "Error", description: "Perk not found or not available.", variant: "destructive" });
        return;
    }

    if (!studioUpgradeService.canUnlockPerk(perkId, gameState)) { // Double check conditions server-side
        toast({ title: "Unlock Failed", description: `Conditions to unlock ${perkToUnlock.name} are not met.`, variant: "destructive" });
        return;
    }

    if (perkToUnlock.cost?.money && currentMoney < perkToUnlock.cost.money) {
        toast({ title: "Not enough money", description: `You need $${perkToUnlock.cost.money.toLocaleString()} to unlock ${perkToUnlock.name}.`, variant: "destructive" });
        return;
    }
    if (perkToUnlock.cost?.perkPoints && currentPerkPoints < perkToUnlock.cost.perkPoints) {
        toast({ title: "Not enough Perk Points", description: `You need ${perkToUnlock.cost.perkPoints} Perk Points to unlock ${perkToUnlock.name}.`, variant: "destructive" });
        return;
    }

    const updatedGameState = studioUpgradeService.unlockPerk(perkId, gameState);
    if (updatedGameState) {
      setGameState(updatedGameState); // Use setGameState
      toast({ title: "Perk Unlocked!", description: `${perkToUnlock.name} has been unlocked.` });
    } else {
      // Error toast is likely handled within unlockPerk, but as a fallback:
      toast({ title: "Unlock Failed", description: `Could not unlock ${perkToUnlock.name}. An unexpected error occurred.`, variant: "destructive" });
    }
  }, [gameState, setGameState]); // Reverted to setGameState in dependency array

  return {
    availablePerks,
    ownedPerks,
    canUnlock,
    unlockPerk,
    isLoading,
  };
};
