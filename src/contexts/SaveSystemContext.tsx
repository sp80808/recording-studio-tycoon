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
import { getVersionInfo, compareVersions } from '../utils/versionUtils';
import { migrateAndInitializeGameState } from '../utils/gameStateUtils'; // ADDED

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
}

export const SaveSystemProvider: React.FC<SaveSystemProviderProps> = ({ children }) => {
  const { settings } = useSettings();

  const saveGame = useCallback((gameState: GameState) => {
    try {
      const versionInfo = getVersionInfo();
      const saveData = {
        gameState,
        timestamp: Date.now(),
        ...versionInfo,
        saveFormat: 'v2' // For future migration tracking
      };
      
      localStorage.setItem('recordingStudioTycoonSave', JSON.stringify(saveData));
      console.log(`Game saved successfully - Version ${versionInfo.version}`);
    } catch (error) {
      console.error('Failed to save game:', error);
    }
  }, []);

  const loadGame = useCallback((): GameState | null => {
    try {
      const savedData = localStorage.getItem('recordingStudioTycoonSave');
      if (!savedData) return null;
      
      const parsed = JSON.parse(savedData);
      const currentVersionInfo = getVersionInfo();
      
      // Version compatibility checking
      if (parsed.version && parsed.version !== currentVersionInfo.version) {
        const versionComparison = compareVersions(parsed.version, currentVersionInfo.version);
        if (versionComparison < 0) {
          console.warn(`Loading save from older version: ${parsed.version} -> ${currentVersionInfo.version}`);
          // Future: Add migration logic here
        } else if (versionComparison > 0) {
          console.warn(`Loading save from newer version: ${parsed.version} -> ${currentVersionInfo.version}`);
          // Handle downgrade scenario
        }
      }
      
      console.log(`Game loaded successfully - Save Version: ${parsed.version || 'legacy'}`);
      // ADDED: Migrate and initialize the loaded game state
      const migratedGameState = migrateAndInitializeGameState(parsed.gameState);
      return migratedGameState;
    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  }, []);

  const resetGame = useCallback(() => {
    try {
      localStorage.removeItem('recordingStudioTycoonSave');
      console.log('Game progress reset');
    } catch (error) {
      console.error('Failed to reset game:', error);
    }
  }, []);

  const hasSavedGame = useCallback((): boolean => {
    return localStorage.getItem('recordingStudioTycoonSave') !== null;
  }, []);

  const exportGameStateToString = useCallback((gameState: GameState): string | null => {
    try {
      const versionInfo = getVersionInfo();
      const saveData = {
        gameState,
        timestamp: Date.now(),
        ...versionInfo,
        saveFormat: 'v2_text_export' // Indicate it's a text export
      };
      const jsonString = JSON.stringify(saveData);
      // Basic obfuscation: Base64 encode
      return btoa(jsonString); 
    } catch (error) {
      console.error('Failed to export game state to string:', error);
      return null;
    }
  }, []);

  const loadGameFromString = useCallback((saveString: string): GameState | null => {
    try {
      // Basic de-obfuscation: Base64 decode
      const jsonString = atob(saveString); 
      const parsed = JSON.parse(jsonString);
      const currentVersionInfo = getVersionInfo();
      
      // Version compatibility checking (similar to loadGame)
      if (parsed.version && parsed.version !== currentVersionInfo.version) {
        const versionComparison = compareVersions(parsed.version, currentVersionInfo.version);
        if (versionComparison < 0) {
          console.warn(`Loading save from older version (string): ${parsed.version} -> ${currentVersionInfo.version}`);
          // Future: Add migration logic here
        } else if (versionComparison > 0) {
          console.warn(`Loading save from newer version (string): ${parsed.version} -> ${currentVersionInfo.version}`);
          // Handle downgrade scenario
        }
      }
      
      console.log(`Game loaded from string successfully - Save Version: ${parsed.version || 'legacy_text'}`);
      // ADDED: Migrate and initialize the loaded game state from string
      const migratedGameState = migrateAndInitializeGameState(parsed.gameState);
      return migratedGameState;
    } catch (error) {
      console.error('Failed to load game from string:', error);
      // TODO: Consider adding a user-facing notification for invalid save string
      return null;
    }
  }, []);

  // Auto-save functionality
  useEffect(() => {
    let autoSaveInterval: NodeJS.Timeout;
    
    if (settings.autoSave) {
      // Auto-save every 30 seconds
      autoSaveInterval = setInterval(() => {
        // This will be called from the main game component
        const event = new CustomEvent('autoSave');
        window.dispatchEvent(event);
      }, 30000);
    }

    return () => {
      if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
      }
    };
  }, [settings.autoSave]);

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
