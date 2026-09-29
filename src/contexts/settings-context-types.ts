import React, { createContext, useContext } from 'react';
import type { ControllerLayoutPreference } from '@/types/gamepad';

export interface GameSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  sfxEnabled: boolean;
  musicEnabled: boolean;
  tutorialCompleted: boolean;
  autoSave: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  theme: 'default' | 'sunrise-studio' | 'neon-nights' | 'retro-arcade';
  seenMinigameTutorials: Record<string, boolean>; // Track seen minigame tutorials
  language: string; // Added language setting
  controllerLayout: ControllerLayoutPreference; // Gamepad glyph + input layout preference (49i.2)
  gamepadHaptics: boolean; // Rumble/haptic feedback on supported controllers (49i.2)
}

export interface SettingsContextType {
  settings: GameSettings;
  updateSettings: (newSettings: Partial<GameSettings>) => void;
  resetSettings: () => void;
  markMinigameTutorialAsSeen: (minigameId: string) => void; // Mark minigame tutorial as seen
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};