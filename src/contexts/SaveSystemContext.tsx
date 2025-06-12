/**
 * @fileoverview Save system context with version tracking and compatibility checking
 * @version 0.3.1 
 * @author Recording Studio Tycoon Development Team
 * @created 2025-06-01
 * @modified 2025-06-11 
 * @lastModifiedBy Cline
 */

import React, { createContext, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useSettings } from './SettingsContext';
import { GameState } from '@/types/game';
import { saveGame as utilSaveGame, loadGame as utilLoadGame, deleteSave as utilDeleteSave, hasSaveGame as utilHasSaveGame, exportSave as utilExportSave, importSave as utilImportSave } from '../utils/saveLoadUtils';

interface SaveSystemContextType {
  saveGame: (gameState: GameState) => void;
  loadGame: () => GameState | null;
  resetGame: () => void;
  hasSavedGame: () => boolean;
  exportGameStateToString: (gameState: GameState) => string | null; // New function
  loadGameFromString: (saveString: string) => GameState | null; // New function
}

const SaveSystemContext = createContext<SaveSystemContextType | undefined>(undefined);

export const useSaveSystem = () => {
  const context = useContext(SaveSystemContext);
  if (!context) {
    throw new Error('useSaveSystem must be used within a SaveSystemProvider');
  }
  return context;
};

interface SaveSystemProviderProps {
  children: ReactNode;
  gameState: GameState;
  setGameState: (state: GameState | ((prevState: GameState) => GameState)) => void;
}

export const SaveSystemProvider: React.FC<SaveSystemProviderProps> = ({ children, gameState, setGameState }) => {
  const { settings } = useSettings();

  const saveGame = useCallback((gameState: GameState) => {
    if (utilSaveGame(gameState)) {
      console.log('Game saved successfully via utilSaveGame');
    } else {
      console.error('Failed to save game via utilSaveGame');
    }
  }, []);

  const loadGame = useCallback((): GameState | null => {
    const loadedState = utilLoadGame();
    if (loadedState) {
      console.log('Game loaded successfully via utilLoadGame');
    } else {
      console.warn('No game to load or failed to load via utilLoadGame');
    }
    return loadedState;
  }, []);

  const resetGame = useCallback(() => {
    if (utilDeleteSave()) {
      console.log('Game progress reset via utilDeleteSave');
    } else {
      console.error('Failed to reset game via utilDeleteSave');
    }
  }, []);

  const hasSavedGame = useCallback((): boolean => {
    return utilHasSaveGame();
  }, []);

  const exportGameStateToString = useCallback((gameState: GameState): string | null => {
    try {
      const exportedString = utilExportSave();
      console.log('Game state exported to string successfully via utilExportSave');
      return exportedString;
    } catch (error) {
      console.error('Failed to export game state to string via utilExportSave:', error);
      return null;
    }
  }, []);

  const loadGameFromString = useCallback((saveString: string): GameState | null => {
    try {
      utilImportSave(saveString);
      const loadedState = utilLoadGame(); // Load after import
      if (loadedState) {
        console.log('Game loaded from string successfully via utilLoadGame');
      } else {
        console.error('Failed to load game from string after import via utilLoadGame');
      }
      return loadedState;
    } catch (error) {
      console.error('Failed to import or load game from string:', error);
      return null;
    }
  }, []);

  // Auto-save functionality
  useEffect(() => {
    let autoSaveInterval: NodeJS.Timeout | undefined;
    
    if (settings.autoSave) {
      autoSaveInterval = setInterval(() => {
        utilSaveGame(gameState);
        console.log('Auto-saved game state.');
      }, 30000); // Auto-save every 30 seconds
    }

    return () => {
      if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
      }
    };
  }, [settings.autoSave, gameState]);

  return (
    <SaveSystemContext.Provider value={{ 
      saveGame, 
      loadGame, 
      resetGame, 
      hasSavedGame, 
      exportGameStateToString, 
      loadGameFromString 
    }}>
      {children}
    </SaveSystemContext.Provider>
  );
};
