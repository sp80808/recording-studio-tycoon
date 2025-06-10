import React, { createContext, useContext, useState, useCallback } from 'react';
import { MiniGame, MiniGameProgress, MiniGameContext as IMiniGameContext } from '@/types/miniGame';
import { usePlayerProgression } from '@/hooks/usePlayerProgression';
import { GameState } from '@/types/game';

const MiniGameContext = createContext<IMiniGameContext | null>(null);

export const useMiniGame = () => {
  const context = useContext(MiniGameContext);
  if (!context) {
    throw new Error('useMiniGame must be used within a MiniGameProvider');
  }
  return context;
};

interface MiniGameProviderProps {
  children: React.ReactNode;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

export const MiniGameProvider: React.FC<MiniGameProviderProps> = ({
  children,
  gameState,
  setGameState,
}) => {
  const [currentGame, setCurrentGame] = useState<MiniGame | null>(null);
  const [progress, setProgress] = useState<MiniGameProgress>({
    level: 1,
    highScore: 0,
    completionCount: 0,
    unlockedFeatures: [],
    lastAttempt: 0,
  });

  const { addXP } = usePlayerProgression(gameState, setGameState);

  const startGame = useCallback((gameId: string) => {
    // TODO: Load game data from a central registry
    const game: MiniGame = {
      id: gameId,
      name: 'Waveform Matching',
      description: 'Match the target waveform shape',
      type: 'sound',
      difficulty: 'beginner',
      unlockLevel: 2,
      rewards: {
        xp: 100,
        attributes: {
          technicalAptitude: 1,
          creativeIntuition: 1,
        },
      },
      maxAttempts: 3,
      cooldown: 30,
    };

    setCurrentGame(game);
    setProgress(prev => ({
      ...prev,
      lastAttempt: Date.now(),
    }));
  }, []);

  const endGame = useCallback((score: number) => {
    if (!currentGame) return;

    const newHighScore = Math.max(progress.highScore, score);
    const newCompletionCount = progress.completionCount + 1;

    setProgress(prev => ({
      ...prev,
      highScore: newHighScore,
      completionCount: newCompletionCount,
    }));

    // Apply rewards
    addXP(currentGame.rewards.xp);
    
    // Update player attributes
    setGameState(prev => ({
      ...prev,
      playerData: {
        ...prev.playerData,
        attributes: {
          ...prev.playerData.attributes,
          ...currentGame.rewards.attributes,
        },
      },
    }));

    setCurrentGame(null);
  }, [currentGame, progress, addXP, setGameState]);

  const updateProgress = useCallback((newProgress: Partial<MiniGameProgress>) => {
    setProgress(prev => ({
      ...prev,
      ...newProgress,
    }));
  }, []);

  return (
    <MiniGameContext.Provider
      value={{
        currentGame,
        progress,
        startGame,
        endGame,
        updateProgress,
      }}
    >
      {children}
    </MiniGameContext.Provider>
  );
}; 