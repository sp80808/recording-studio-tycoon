import React, { useState, useEffect, ReactNode } from 'react';
import { useTheme } from 'next-themes';
import { gameAudio } from '../utils/audioSystem';
import i18n from '../i18n'; // Corrected import
import { SettingsContext, GameSettings } from './settings-context-types';
import { defaultSettings } from '@/data/defaultSettings';

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<GameSettings>(defaultSettings);

  const updateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  const markMinigameTutorialAsSeen = (minigameId: string) => {
    setSettings(prev => ({
      ...prev,
      seenMinigameTutorials: {
        ...prev.seenMinigameTutorials,
        [minigameId]: true,
      },
    }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, markMinigameTutorialAsSeen }}>
      {children}
    </SettingsContext.Provider>
  );
};
