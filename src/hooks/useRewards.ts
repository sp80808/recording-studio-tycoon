import { useState, useCallback } from 'react';
import { MinigameReward, Achievement, PlayerProgress } from '@/types/game';
import { calculateMinigameRewards, applyRewards, checkAchievements } from '@/utils/rewardManager';

export interface UseRewardsReturn {
  playerProgress: PlayerProgress;
  recentRewards: MinigameReward[];
  recentAchievements: Achievement[];
  processMinigameCompletion: (
    score: number,
    difficulty: number,
    minigameType: string
  ) => void;
  resetRecentRewards: () => void;
}

export const useRewards = (initialProgress: PlayerProgress): UseRewardsReturn => {
  const [playerProgress, setPlayerProgress] = useState<PlayerProgress>(initialProgress);
  const [recentRewards, setRecentRewards] = useState<MinigameReward[]>([]);
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([]);

  const processMinigameCompletion = useCallback((
    score: number,
    difficulty: number,
    minigameType: string
  ) => {
    // Calculate rewards
    const rewards = calculateMinigameRewards(score, difficulty, minigameType);
    setRecentRewards(rewards);

    // Apply rewards to progress
    const newProgress = applyRewards(rewards, playerProgress);

    // Check for new achievements
    const newAchievements = checkAchievements(newProgress, minigameType, score);
    if (newAchievements.length > 0) {
      setRecentAchievements(newAchievements);
      // Add new achievements to progress
      newProgress.achievements.push(...newAchievements);
    }

    // Update progress
    setPlayerProgress(newProgress);
  }, [playerProgress]);

  const resetRecentRewards = useCallback(() => {
    setRecentRewards([]);
    setRecentAchievements([]);
  }, []);

  return {
    playerProgress,
    recentRewards,
    recentAchievements,
    processMinigameCompletion,
    resetRecentRewards
  };
}; 