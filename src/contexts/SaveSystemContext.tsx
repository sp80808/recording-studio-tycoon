import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useSettings } from './SettingsContext';

interface SaveSystemContextType {
  saveGame: (gameState: any) => void;
  loadGame: () => any | null;
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

  const saveGame = (gameState: any) => {
    try {
      const saveData = {
        gameState,
        timestamp: Date.now(),
        version: '1.0.0'
      };
      
      localStorage.setItem('recordingStudioTycoonSave', JSON.stringify(saveData));
      console.log('Game saved successfully');
    } catch (error) {
      console.error('Failed to save game:', error);
    }
  };

  const loadGame = (): any | null => {
    try {
      const savedData = localStorage.getItem('recordingStudioTycoonSave');
      if (!savedData) return null;
      
      const parsed = JSON.parse(savedData);
      console.log('Game loaded successfully');
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
