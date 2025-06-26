import React, { createContext, useContext } from 'react';
import { GameState } from '@/types/game';

export interface SaveSystemContextType {
  saveGame: (gameState: GameState) => void;
  loadGame: () => GameState | null;
  resetGame: () => void;
  hasSavedGame: () => boolean;
  exportGameStateToString: (gameState: GameState) => string | null; // New function
  loadGameFromString: (saveString: string) => GameState | null; // New function
}

export const SaveSystemContext = createContext<SaveSystemContextType | undefined>(undefined);

export const useSaveSystem = () => {
  const context = useContext(SaveSystemContext);
  if (!context) {
    throw new Error('useSaveSystem must be used within a SaveSystemProvider');
  }
  return context;
};