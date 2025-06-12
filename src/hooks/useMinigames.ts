import { useState, useCallback } from 'react';
import { useGameState } from './useGameState';
import { MinigameType } from '@/components/minigames/MinigameManager';
import { toast } from '@/hooks/use-toast';
import { gameAudio } from '@/utils/audioSystem';

interface MinigameRewards {
  creativityBonus: number;
  technicalBonus: number;
  xpBonus: number;
  moneyBonus: number;
}

const MINIGAME_REWARDS: Record<MinigameType, (score: number) => MinigameRewards> = {
  mixing: (score) => ({
    creativityBonus: Math.round(score * 0.3),
    technicalBonus: Math.round(score * 0.5),
    xpBonus: Math.round(score * 0.4),
    moneyBonus: Math.round(score * 10)
  }),
  recording: (score) => ({
    creativityBonus: Math.round(score * 0.4),
    technicalBonus: Math.round(score * 0.3),
    xpBonus: Math.round(score * 0.5),
    moneyBonus: Math.round(score * 8)
  }),
  mastering: (score) => ({
    creativityBonus: Math.round(score * 0.2),
    technicalBonus: Math.round(score * 0.6),
    xpBonus: Math.round(score * 0.3),
    moneyBonus: Math.round(score * 12)
  }),
  rhythm: (score) => ({
    creativityBonus: Math.round(score * 0.5),
    technicalBonus: Math.round(score * 0.2),
    xpBonus: Math.round(score * 0.4),
    moneyBonus: Math.round(score * 6)
  }),
  waveform: (score) => ({
    creativityBonus: Math.round(score * 0.3),
    technicalBonus: Math.round(score * 0.4),
    xpBonus: Math.round(score * 0.3),
    moneyBonus: Math.round(score * 7)
  }),
  beatmaking: (score) => ({
    creativityBonus: Math.round(score * 0.6),
    technicalBonus: Math.round(score * 0.3),
    xpBonus: Math.round(score * 0.5),
    moneyBonus: Math.round(score * 9)
  }),
  vocal: (score) => ({
    creativityBonus: Math.round(score * 0.5),
    technicalBonus: Math.round(score * 0.4),
    xpBonus: Math.round(score * 0.4),
    moneyBonus: Math.round(score * 8)
  }),
  effect_chain: (score: number) => ({ // For GuitarPedalBoardGame, changed key and typed score
    creativityBonus: Math.round(score * 0.4),
    technicalBonus: Math.round(score * 0.4), // Adjusted technical bonus to match new entry
    xpBonus: Math.round(score * 0.3),
    moneyBonus: Math.round(score * 7)
  }),
  acoustic: (score) => ({
    creativityBonus: Math.round(score * 0.5),
    technicalBonus: Math.round(score * 0.3),
    xpBonus: Math.round(score * 0.4),
    moneyBonus: Math.round(score * 6)
  }),
  layering: (score) => ({
    creativityBonus: Math.round(score * 0.6),
    technicalBonus: Math.round(score * 0.4),
    xpBonus: Math.round(score * 0.5),
    moneyBonus: Math.round(score * 10)
  }),
  // effect_chain is now handled above, this section is effectively merged/replaced
  patch_bay: (score: number) => ({ // For PatchBayGame, typed score
    creativityBonus: Math.round(score * 0.3),
    technicalBonus: Math.round(score * 0.5),
    xpBonus: Math.round(score * 0.3),
    moneyBonus: Math.round(score * 8)
  })
};

export const useMinigames = () => {
  const { gameState, updateGameState } = useGameState();
  const [activeMinigame, setActiveMinigame] = useState<MinigameType | null>(null);
  const [minigameDifficulty, setMinigameDifficulty] = useState(1);

  const startMinigame = useCallback((type: MinigameType, difficulty: number = 1) => {
    setActiveMinigame(type);
    setMinigameDifficulty(difficulty);
    gameAudio.playUISound('start');
  }, []);

  const completeMinigame = useCallback((type: MinigameType, score: number) => {
    const rewards = MINIGAME_REWARDS[type](score);
    
    updateGameState(prev => ({
      ...prev,
      playerData: {
        ...prev.playerData,
        xp: prev.playerData.xp + rewards.xpBonus,
        attributes: {
          ...prev.playerData.attributes,
          creativeIntuition: Math.min(100, prev.playerData.attributes.creativeIntuition + rewards.creativityBonus),
          technicalAptitude: Math.min(100, prev.playerData.attributes.technicalAptitude + rewards.technicalBonus)
        }
      },
      money: prev.money + rewards.moneyBonus
    }));

    toast({
      title: "🎵 Minigame Complete!",
      description: `You earned:
        • ${rewards.creativityBonus} Creativity
        • ${rewards.technicalBonus} Technical
        • ${rewards.xpBonus} XP
        • $${rewards.moneyBonus}`,
      duration: 5000
    });

    gameAudio.playSuccess();
    setActiveMinigame(null);
  }, [updateGameState]);

  const closeMinigame = useCallback(() => {
    setActiveMinigame(null);
    gameAudio.playUISound('close');
  }, []);

  return {
    activeMinigame,
    minigameDifficulty,
    startMinigame,
    completeMinigame,
    closeMinigame
  };
};
