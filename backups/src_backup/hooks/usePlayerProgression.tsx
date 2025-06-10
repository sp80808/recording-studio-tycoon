import { useCallback, useState } from 'react';
import { GameState, PlayerAttributes } from '@/types/game';
import { toast } from '@/hooks/use-toast';
import { getMilestoneReward, isMilestoneLevel, getNextMilestoneLevel } from '@/data/milestones';
import { applyMilestoneRewards } from '@/utils/progressionUtils';

export const usePlayerProgression = (gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState>>) => {
  const [recentXPGain, setRecentXPGain] = useState<number | null>(null);

  const addXP = useCallback((amount: number) => {
    setRecentXPGain(amount);
    setGameState(prev => {
      const newXP = prev.playerData.xp + amount;
      const newXpToNextLevel = prev.playerData.xpToNextLevel;
      
      // Check for level up
      if (newXP >= newXpToNextLevel) {
        const newLevel = prev.playerData.level + 1;
        const newXpToNext = Math.max(1, Math.floor(newXpToNextLevel * 1.5)); // Ensure xpToNextLevel is at least 1
        
        toast({
          title: "Level Up! 🎉",
          description: `You've reached level ${newLevel}! New features and opportunities await!`,
          duration: 5000,
        });

        // Check for milestone level
        if (isMilestoneLevel(newLevel)) {
          const milestone = getMilestoneReward(newLevel);
          if (milestone) {
            toast({
              title: `Milestone Achieved: ${milestone.name}`,
              description: milestone.description,
              duration: 5000,
            });
          }
        }

        // Create updated state with level up changes
        const updatedState = {
          ...prev,
          playerData: {
            ...prev.playerData,
            level: newLevel,
            xp: newXP - newXpToNextLevel, // Carry over excess XP
            xpToNextLevel: newXpToNext,
            perkPoints: prev.playerData.perkPoints + 1,
            attributePoints: prev.playerData.attributePoints + 2,
          }
        };

        // Apply milestone rewards and update milestone progress
        const updatedWithMilestones = {
          ...updatedState,
          milestoneProgress: {
            lastMilestoneLevel: isMilestoneLevel(newLevel) ? newLevel : updatedState.milestoneProgress.lastMilestoneLevel,
            nextMilestoneLevel: getNextMilestoneLevel(newLevel)
          }
        };

        // Apply milestone rewards if this is a milestone level
        if (isMilestoneLevel(newLevel)) {
          const milestone = getMilestoneReward(newLevel);
          if (milestone) {
            return applyMilestoneRewards(updatedWithMilestones, milestone);
          }
        }

        return updatedWithMilestones;
      }

      return {
        ...prev,
        playerData: {
          ...prev.playerData,
          xp: newXP
        }
      };
    });

    // Clear XP gain animation after delay
    setTimeout(() => {
      setRecentXPGain(null);
    }, 2000);
  }, [setGameState]);

  const spendPerkPoint = useCallback((attribute: keyof PlayerAttributes) => {
    if (gameState.playerData.perkPoints <= 0) {
      toast({
        title: "No Perk Points",
        description: "You don't have any perk points to spend!",
        variant: "destructive"
      });
      return;
    }

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
      title: "Attribute Upgraded! ⭐",
      description: `${attribute} increased to ${gameState.playerData.attributes[attribute] + 1}`,
      duration: 3000,
    });
  }, [gameState.playerData]);

  const spendAttributePoint = useCallback((attribute: keyof PlayerAttributes) => {
    if (gameState.playerData.attributePoints <= 0) {
      toast({
        title: "No Attribute Points",
        description: "You don't have any attribute points to spend!",
        variant: "destructive"
      });
      return;
    }

    setGameState(prev => ({
      ...prev,
      playerData: {
        ...prev.playerData,
        attributePoints: prev.playerData.attributePoints - 1,
        attributes: {
          ...prev.playerData.attributes,
          [attribute]: prev.playerData.attributes[attribute] + 1
        }
      }
    }));

    toast({
      title: "Attribute Improved! 📈",
      description: `${attribute} increased to ${gameState.playerData.attributes[attribute] + 1}`,
      duration: 3000,
    });
  }, [gameState.playerData]);

  return {
    playerLevel: gameState.playerData.level,
    playerXP: gameState.playerData.xp,
    xpToNextLevel: gameState.playerData.xpToNextLevel,
    playerAttributes: gameState.playerData.attributes,
    playerSkills: gameState.studioSkills, // Assuming studioSkills are playerSkills in this context
    playerPerks: gameState.playerData.unlockedPerks,
    addXP,
    spendPerkPoint,
    spendAttributePoint,
    recentXPGain
  };
};
