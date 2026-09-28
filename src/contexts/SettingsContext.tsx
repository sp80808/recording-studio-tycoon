import React, { useState, useEffect, ReactNode } from 'react';
import { useTheme } from 'next-themes';
import { gameAudio } from '../utils/audioSystem';
import i18n from '../i18n'; // Corrected import
import { SettingsContext, GameSettings, useSettings } from './settings-context-types';
import { defaultSettings } from '../data/defaultSettings';

export { useSettings };

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<GameSettings>(defaultSettings);

  const updateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    // Single source of truth: push volume/mute straight into the audio
    // engine so sliders move gain nodes, not just React state (k6e.1).
    // Only defined keys cross over — never clobber live volumes with undefined.
    const { masterVolume, sfxVolume, musicVolume, sfxEnabled, musicEnabled } = newSettings;
    const audioPatch: {
      masterVolume?: number;
      sfxVolume?: number;
      musicVolume?: number;
      sfxEnabled?: boolean;
      musicEnabled?: boolean;
    } = {};
    if (masterVolume !== undefined) audioPatch.masterVolume = masterVolume;
    if (sfxVolume !== undefined) audioPatch.sfxVolume = sfxVolume;
    if (musicVolume !== undefined) audioPatch.musicVolume = musicVolume;
    if (sfxEnabled !== undefined) audioPatch.sfxEnabled = sfxEnabled;
    if (musicEnabled !== undefined) audioPatch.musicEnabled = musicEnabled;
    if (Object.keys(audioPatch).length > 0) gameAudio.updateSettings(audioPatch);
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    gameAudio.updateSettings({ ...defaultSettings });
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
