import React, { createContext, useContext } from 'react';
import { GameState } from '@/types/game';

export interface LoadedGameSnapshot {
  gameState: GameState;
  savedAt: number;
}

export interface SaveSystemContextType {
  saveGame: (gameState: GameState) => void;
  loadGame: () => GameState | null;
  loadGameSnapshot: () => LoadedGameSnapshot | null;
  resetGame: () => void;
  hasSavedGame: () => boolean;
  exportGameStateToString: (gameState: GameState) => string | null;
  loadGameFromString: (saveString: string) => GameState | null;
}

export const SaveSystemContext = createContext<SaveSystemContextType | undefined>(undefined);

export const useSaveSystem = () => {
  const context = useContext(SaveSystemContext);
  if (!context) {
    throw new Error('useSaveSystem must be used within a SaveSystemProvider');
  }
  return context;
};