import { useState, useCallback } from 'react';
import { useGameState } from './useGameState';
import { MinigameType } from '@/types/miniGame'; // Corrected import path
import { toast } from '@/hooks/use-toast';
import { gameAudio } from '@/utils/audioSystem';

interface MinigameRewards {
  creativityBonus: number;
  technicalBonus: number;
  xpBonus: number;
  moneyBonus: number;
}

const MINIGAME_REWARDS: Record<MinigameType, (score: number) => MinigameRewards> = {
  rhythm_timing: (score: number) => ({
    creativityBonus: Math.round(score * 0.5),
    technicalBonus: Math.round(score * 0.2),
    xpBonus: Math.round(score * 0.4),
    moneyBonus: Math.round(score * 6)
  }),
  mixing_board: (score: number) => ({
    creativityBonus: Math.round(score * 0.3),
    technicalBonus: Math.round(score * 0.5),
    xpBonus: Math.round(score * 0.4),
    moneyBonus: Math.round(score * 10)
  }),
  sound_wave: (score: number) => ({
    creativityBonus: Math.round(score * 0.3),
    technicalBonus: Math.round(score * 0.4),
    xpBonus: Math.round(score * 0.3),
    moneyBonus: Math.round(score * 7)
  }),
  beat_making: (score: number) => ({
    creativityBonus: Math.round(score * 0.6),
    technicalBonus: Math.round(score * 0.3),
    xpBonus: Math.round(score * 0.5),
    moneyBonus: Math.round(score * 9)
  }),
  vocal_recording: (score: number) => ({
    creativityBonus: Math.round(score * 0.5),
    technicalBonus: Math.round(score * 0.4),
    xpBonus: Math.round(score * 0.4),
    moneyBonus: Math.round(score * 8)
  }),
  mastering: (score: number) => ({
    creativityBonus: Math.round(score * 0.2),
    technicalBonus: Math.round(score * 0.6),
    xpBonus: Math.round(score * 0.3),
    moneyBonus: Math.round(score * 12)
  }),
  effect_chain: (score: number) => ({
    creativityBonus: Math.round(score * 0.4),
    technicalBonus: Math.round(score * 0.4),
    xpBonus: Math.round(score * 0.3),
    moneyBonus: Math.round(score * 8)
  }),
  acoustic_tuning: (score: number) => ({
    creativityBonus: Math.round(score * 0.5),
    technicalBonus: Math.round(score * 0.3),
    xpBonus: Math.round(score * 0.4),
    moneyBonus: Math.round(score * 6)
  }),
  midi_programming: (score: number) => ({
    creativityBonus: Math.round(score * 0.3),
    technicalBonus: Math.round(score * 0.4),
    xpBonus: Math.round(score * 0.3),
    moneyBonus: Math.round(score * 7)
  }),
  digital_mixing: (score: number) => ({
    creativityBonus: Math.round(score * 0.3),
    technicalBonus: Math.round(score * 0.5),
    xpBonus: Math.round(score * 0.4),
    moneyBonus: Math.round(score * 10)
  }),
  sample_editing: (score: number) => ({
    creativityBonus: Math.round(score * 0.4),
    technicalBonus: Math.round(score * 0.3),
    xpBonus: Math.round(score * 0.3),
    moneyBonus: Math.round(score * 7)
  }),
  sound_design: (score: number) => ({
    creativityBonus: Math.round(score * 0.5),
    technicalBonus: Math.round(score * 0.3),
    xpBonus: Math.round(score * 0.4),
    moneyBonus: Math.round(score * 8)
  }),
  audio_restoration: (score: number) => ({
    creativityBonus: Math.round(score * 0.2),
    technicalBonus: Math.round(score * 0.6),
    xpBonus: Math.round(score * 0.3),
    moneyBonus: Math.round(score * 9)
  }),
  analog_console: (score: number) => ({
    creativityBonus: Math.round(score * 0.3),
    technicalBonus: Math.round(score * 0.5),
    xpBonus: Math.round(score * 0.4),
    moneyBonus: Math.round(score * 10)
  }),
  four_track_recording: (score: number) => ({
    creativityBonus: Math.round(score * 0.4),
    technicalBonus: Math.round(score * 0.2),
    xpBonus: Math.round(score * 0.3),
    moneyBonus: Math.round(score * 6)
  }),
  tape_splicing: (score: number) => ({
    creativityBonus: Math.round(score * 0.3),
    technicalBonus: Math.round(score * 0.3),
    xpBonus: Math.round(score * 0.2),
    moneyBonus: Math.round(score * 5)
  }),
  microphone_placement: (score: number) => ({
    creativityBonus: Math.round(score * 0.4),
    technicalBonus: Math.round(score * 0.4),
    xpBonus: Math.round(score * 0.4),
    moneyBonus: Math.round(score * 8)
  }),
  mastering_chain: (score: number) => ({
    creativityBonus: Math.round(score * 0.2),
    technicalBonus: Math.round(score * 0.7),
    xpBonus: Math.round(score * 0.3),
    moneyBonus: Math.round(score * 15)
  }),
  sound_design_synthesis: (score: number) => ({
    creativityBonus: Math.round(score * 0.6),
    technicalBonus: Math.round(score * 0.2),
    xpBonus: Math.round(score * 0.5),
    moneyBonus: Math.round(score * 9)
  }),
  layering: (score: number) => ({
    creativityBonus: Math.round(score * 0.6),
    technicalBonus: Math.round(score * 0.4),
    xpBonus: Math.round(score * 0.5),
    moneyBonus: Math.round(score * 10)
  }),
  pedalboard: (score: number) => ({
    creativityBonus: Math.round(score * 0.4),
    technicalBonus: Math.round(score * 0.4),
    xpBonus: Math.round(score * 0.3),
    moneyBonus: Math.round(score * 8)
  }),
  patchbay: (score: number) => ({
    creativityBonus: Math.round(score * 0.3),
    technicalBonus: Math.round(score * 0.5),
    xpBonus: Math.round(score * 0.4),
    moneyBonus: Math.round(score * 10)
  }),
  hybrid_mixing: (score: number) => ({
    creativityBonus: Math.round(score * 0.4),
    technicalBonus: Math.round(score * 0.4),
    xpBonus: Math.round(score * 0.4),
    moneyBonus: Math.round(score * 11)
  }),
  digital_distribution: (score: number) => ({
    creativityBonus: Math.round(score * 0.1),
    technicalBonus: Math.round(score * 0.2),
    xpBonus: Math.round(score * 0.2),
    moneyBonus: Math.round(score * 20)
  }),
  social_media_promotion: (score: number) => ({
    creativityBonus: Math.round(score * 0.2),
    technicalBonus: Math.round(score * 0.1),
    xpBonus: Math.round(score * 0.2),
    moneyBonus: Math.round(score * 18)
  }),
  streaming_optimization: (score: number) => ({
    creativityBonus: Math.round(score * 0.2),
    technicalBonus: Math.round(score * 0.3),
    xpBonus: Math.round(score * 0.3),
    moneyBonus: Math.round(score * 15)
  }),
  ai_mastering: (score: number) => ({
    creativityBonus: Math.round(score * 0.1),
    technicalBonus: Math.round(score * 0.8),
    xpBonus: Math.round(score * 0.2),
    moneyBonus: Math.round(score * 10)
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
