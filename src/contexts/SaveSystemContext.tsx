/**
 * @fileoverview Save system context with version tracking and compatibility checking
 * @version 0.3.0
 * @author Recording Studio Tycoon Development Team
 * @created 2025-06-01
 * @modified 2025-06-08
 * @lastModifiedBy GitHub Copilot
 */

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useSettings } from './SettingsContext';
import { getVersionInfo, compareVersions } from '../utils/versionUtils';
import { GameState } from '@/types/game';

interface SaveData {
  gameState: GameState;
  timestamp: number;
  version: string;
  buildDate: string;
  phase: string;
  features: string[];
  saveFormat: string;
}

interface SaveSystemContextType {
  saveGame: (gameState: GameState) => void;
  loadGame: () => GameState | null;
  resetGame: () => void;
  hasSavedGame: () => boolean;
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

  const saveGame = (gameState: GameState) => {
    try {
      const versionInfo = getVersionInfo();
      const saveData: SaveData = {
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
  };

  const loadGame = (): GameState | null => {
    try {
      const savedData = localStorage.getItem('recordingStudioTycoonSave');
      if (!savedData) return null;
      
      const parsed = JSON.parse(savedData) as SaveData;
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
      return parsed.gameState;
    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  };

  const resetGame = () => {
    try {
      localStorage.removeItem('recordingStudioTycoonSave');
      console.log('Game progress reset');
    } catch (error) {
      console.error('Failed to reset game:', error);
    }
  };

  const hasSavedGame = (): boolean => {
    return localStorage.getItem('recordingStudioTycoonSave') !== null;
  };

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
    <SaveSystemContext.Provider value={{ saveGame, loadGame, resetGame, hasSavedGame }}>
      {children}
    </SaveSystemContext.Provider>
  );
};
