import { useState, useEffect } from 'react';
import { GameState, FocusAllocation } from '@/types/game';
import { ProgressionSystem } from '@/services/ProgressionSystem';
import { resolvePlayerLevelUps } from '@/utils/playerUtils';
import { createDefaultGameState, createNewGameState, type EraInitOptions } from '@/utils/newGameState';

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);

  const [focusAllocation, setFocusAllocation] = useState<FocusAllocation>({
    performance: 50,
    soundCapture: 50,
    layering: 50
  });

  const initializeGameState = (options?: Partial<EraInitOptions>): GameState => createNewGameState(options);

  // Update game state to reflect progression changes
  const updateGameStateWithProgression = (newGameState: GameState): GameState => {
    newGameState = resolvePlayerLevelUps(newGameState);
    const maxConcurrentProjects = ProgressionSystem.getMaxConcurrentProjects(newGameState);
    const isMultiProjectUnlocked = ProgressionSystem.shouldUnlockMultiProject(newGameState);
    
    const activeProjects =
      isMultiProjectUnlocked &&
      newGameState.activeProject &&
      !newGameState.activeProjects.some(project => project.id === newGameState.activeProject?.id)
        ? [newGameState.activeProject, ...newGameState.activeProjects]
        : newGameState.activeProjects;

    return {
      ...newGameState,
      activeProjects,
      maxConcurrentProjects,
      automation: {
        ...newGameState.automation!,
        // Enable basic automation when multi-project is unlocked
        enabled: isMultiProjectUnlocked && newGameState.automation!.enabled,
        mode: isMultiProjectUnlocked && newGameState.automation!.mode === 'off' 
          ? 'basic' 
          : newGameState.automation!.mode
      }
    };
  };

  // Initialize with default state if no era is selected (for backward compatibility)
  useEffect(() => {
    if (!gameState) {
      const defaultState = initializeGameState();
      setGameState(defaultState);
    }
  }, []);

  return {
    gameState: gameState || createDefaultGameState(),
    setGameState: (state: GameState | ((prev: GameState) => GameState)) => {
      if (typeof state === 'function') {
        setGameState(prev => {
          const newState = state(prev || createDefaultGameState());
          return updateGameStateWithProgression(newState);
        });
      } else {
        setGameState(updateGameStateWithProgression(state));
      }
    },
    focusAllocation,
    setFocusAllocation,
    initializeGameState
  };
};
