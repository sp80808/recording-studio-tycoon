import { useCallback } from 'react';
import { GameState } from '@/types/game';
import { PerformanceRating } from '@/types/performance';
import { toast } from '@/components/ui/use-toast';
import { RewardsToast } from '@/components/RewardsToast';

interface BandRewards {
  money: number;
  experience: number;
  fanGain: number;
  specialEvents: string[];
}

interface UseBandRewardsProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
}

export const useBandRewards = ({ gameState, setGameState }: UseBandRewardsProps) => {
  const calculateRewards = useCallback((performance: PerformanceRating, venueSize: number): BandRewards => {
    // Base rewards calculation
    const baseMoney = Math.floor(performance.overall * 100 * venueSize);
    const baseExperience = Math.floor(performance.overall * 50);
    const baseFanGain = Math.floor(performance.overall * 20 * venueSize);

    // Special event chances based on performance
    const specialEvents: string[] = [];
    if (performance.overall >= 90) {
      specialEvents.push('Record Label Interest');
    }
    if (performance.creativity >= 85) {
      specialEvents.push('Viral Performance');
    }
    if (performance.technical >= 90) {
      specialEvents.push('Industry Recognition');
    }
    if (performance.stagePresence >= 85) {
      specialEvents.push('Fan Meet & Greet');
    }

    // Bonus multipliers for exceptional performances
    const moneyMultiplier = performance.overall >= 95 ? 1.5 : 1;
    const experienceMultiplier = performance.overall >= 90 ? 1.3 : 1;
    const fanMultiplier = performance.overall >= 85 ? 1.4 : 1;

    return {
      money: Math.floor(baseMoney * moneyMultiplier),
      experience: Math.floor(baseExperience * experienceMultiplier),
      fanGain: Math.floor(baseFanGain * fanMultiplier),
      specialEvents
    };
  }, []);

  const applyRewards = useCallback((bandId: string, rewards: BandRewards) => {
    setGameState((prevState: GameState) => {
      const band = prevState.bands.find((b) => b.id === bandId);
      if (!band) return prevState;

      // Update band stats
      const updatedBand = {
        ...band,
        experience: band.experience + rewards.experience,
        fans: band.fans + rewards.fanGain
      };

      // Update game state
      const updatedState: GameState = {
        ...prevState,
        money: prevState.money + rewards.money,
        bands: prevState.bands.map((b) => b.id === bandId ? updatedBand : b)
      };

      // Show rewards toast
      toast({
        title: "Performance Rewards",
        description: <RewardsToast {...rewards} />
      });

      return updatedState;
    });
  }, [setGameState]);

  const getRewardMultipliers = useCallback((performance: PerformanceRating) => {
    return {
      money: performance.overall >= 95 ? 1.5 : 1,
      experience: performance.overall >= 90 ? 1.3 : 1,
      fans: performance.overall >= 85 ? 1.4 : 1
    };
  }, []);

  return {
    calculateRewards,
    applyRewards,
    getRewardMultipliers
  };
}; 