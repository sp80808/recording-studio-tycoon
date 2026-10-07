/**
 * @fileoverview Save system context with version tracking and compatibility checking
 * @version 0.3.1 
 * @author Recording Studio Tycoon Development Team
 * @created 2025-06-01
 * @modified 2025-06-11 
 * @lastModifiedBy Cline
 */

import React, { useEffect, ReactNode, useCallback } from 'react';
import { useSettings } from './SettingsContext';
import { getVersionInfo, compareVersions } from '../utils/versionUtils';
import { migrateAndInitializeGameState } from '../utils/gameStateUtils';
import { 
  SaveSystemContext, 
  useSaveSystem, 
  LoadedGameSnapshot 
} from './save-system-context-types';
import { GameState } from '@/types/game';
// Bead 89o.8: strip spoofed entitlement claims; never clear ledger on reset.
import {
  GAME_SAVE_STORAGE_KEY,
  resetGameSavePreservingLedger,
  sanitizeImportedSaveEnvelope,
} from '@/monetization/saveIsolation';
import { debugLog } from '@/utils/debugLog';

export { useSaveSystem };
export type { LoadedGameSnapshot };

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
      debugLog(`Game saved successfully - Version ${versionInfo.version}`);
    } catch (error) {
      console.error('Failed to save game:', error);
    }
  }, []);

  const loadGameSnapshot = useCallback((): LoadedGameSnapshot | null => {
    try {
      const savedData = localStorage.getItem('recordingStudioTycoonSave');
      if (!savedData) return null;
      
      const parsedRaw = JSON.parse(savedData);
      // Additive 89o.8: drop spoof entitlement keys before migration.
      const { cleaned: parsed } = sanitizeImportedSaveEnvelope(
        parsedRaw && typeof parsedRaw === 'object' ? parsedRaw : {},
      );
      const currentVersionInfo = getVersionInfo();
      
      // Version compatibility checking
      if (parsed.version && parsed.version !== currentVersionInfo.version) {
        const versionComparison = compareVersions(String(parsed.version), currentVersionInfo.version);
        if (versionComparison < 0) {
          console.warn(`Loading save from older version: ${parsed.version} -> ${currentVersionInfo.version}`);
        } else if (versionComparison > 0) {
          console.warn(`Loading save from newer version: ${parsed.version} -> ${currentVersionInfo.version}`);
        }
      }
      
      debugLog(`Game loaded successfully - Save Version: ${parsed.version || 'legacy'}`);
      const migratedGameState = migrateAndInitializeGameState(parsed.gameState as GameState);
      const savedAt = Number.isFinite(parsed.timestamp) ? Number(parsed.timestamp) : Date.now();

      return {
        gameState: migratedGameState,
        savedAt
      };
    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  }, []);

  const loadGame = useCallback((): GameState | null => {
    return loadGameSnapshot()?.gameState ?? null;
  }, [loadGameSnapshot]);

  const resetGame = useCallback(() => {
    try {
      // 89o.8: clear career save only — entitlement ledger cache survives.
      resetGameSavePreservingLedger(localStorage, GAME_SAVE_STORAGE_KEY);
      debugLog('Save data cleared');
    } catch (error) {
      console.error('Failed to clear save data:', error);
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
        saveFormat: 'v2'
      };
      return btoa(JSON.stringify(saveData));
    } catch (error) {
      console.error('Failed to export game state to string:', error);
      return null;
    }
  }, []);

  const loadGameFromString = useCallback((saveString: string): GameState | null => {
    try {
      const decodedString = atob(saveString);
      const parsedRaw = JSON.parse(decodedString);
      const { cleaned: parsed } = sanitizeImportedSaveEnvelope(
        parsedRaw && typeof parsedRaw === 'object' ? parsedRaw : {},
      );
      const currentVersionInfo = getVersionInfo();

      if (parsed.version && parsed.version !== currentVersionInfo.version) {
        const versionComparison = compareVersions(String(parsed.version), currentVersionInfo.version);
        if (versionComparison < 0) {
          console.warn(`Loading exported save from older version: ${parsed.version} -> ${currentVersionInfo.version}`);
        } else if (versionComparison > 0) {
          console.warn(`Loading exported save from newer version: ${parsed.version} -> ${currentVersionInfo.version}`);
        }
      }

      debugLog(`Game loaded successfully from string - Save Version: ${parsed.version || 'legacy'}`);
      return migrateAndInitializeGameState(parsed.gameState as GameState);
    } catch (error) {
      console.error('Failed to load game from string:', error);
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
      loadGameSnapshot,
      resetGame, 
      hasSavedGame, 
      exportGameStateToString, 
      loadGameFromString 
    }}>
      {children}
    </SaveSystemContext.Provider>
  );
};