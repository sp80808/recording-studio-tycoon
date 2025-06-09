
import { useState } from 'react';
import { GameState, initialGameState } from '@/types/game';
import { useLocalStorage } from './useLocalStorage';

export const useGameState = () => {
  const [gameState, setGameState] = useLocalStorage<GameState>('musicStudioTycoon_gameState', {
    ...initialGameState,
    playerData: {
      ...initialGameState.playerData,
      completedProjects: 0
    }
  });

  const updateGameState = (newState: Partial<GameState> | ((prev: GameState) => GameState)) => {
    if (typeof newState === 'function') {
      setGameState(newState);
    } else {
      setGameState(prev => ({ ...prev, ...newState }));
    }
  };

  const resetGameState = () => {
    setGameState({
      ...initialGameState,
      playerData: {
        ...initialGameState.playerData,
        completedProjects: 0
      }
    });
  };

  return {
    gameState,
    setGameState,
    updateGameState,
    resetGameState
  };
};
