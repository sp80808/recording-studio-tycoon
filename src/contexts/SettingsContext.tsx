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
  const { setTheme } = useTheme();

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('gameSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        const initializedSettings = {
          ...defaultSettings,
          ...parsed,
          seenMinigameTutorials: parsed.seenMinigameTutorials || {},
          language: parsed.language || 'en',
        };
        setSettings(initializedSettings);
        if (initializedSettings.language) {
          i18n.changeLanguage(initializedSettings.language);
        }
      } catch (error) {
        console.warn('Failed to load settings:', error);
        setSettings(defaultSettings); // Fallback to default if parsing fails
      }
    } else {
      setSettings(defaultSettings);
      i18n.changeLanguage(defaultSettings.language); // Set default language on initial load
    }
  }, []); // Removed i18n from dependency array as it's stable

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('gameSettings', JSON.stringify(settings));
    setTheme(settings.theme);
    
    if (i18n.language !== settings.language) {
      i18n.changeLanguage(settings.language);
    }

    gameAudio.updateSettings({
      masterVolume: settings.masterVolume,
      sfxVolume: settings.sfxVolume,
      musicVolume: settings.musicVolume,
      sfxEnabled: settings.sfxEnabled,
      musicEnabled: settings.musicEnabled
    });
  }, [settings, setTheme]); // settings object itself is a dependency

  const updateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    // localStorage.removeItem('gameSettings'); // This is handled by the useEffect saving defaultSettings
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