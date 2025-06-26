import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTheme } from 'next-themes';
import { gameAudio } from '../utils/audioSystem';
import i18n from '../i18n'; // Corrected import

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
}

interface SettingsContextType {
  settings: GameSettings;
  updateSettings: (newSettings: Partial<GameSettings>) => void;
  resetSettings: () => void;
  markMinigameTutorialAsSeen: (minigameId: string) => void; // Mark minigame tutorial as seen
}

const defaultSettings: GameSettings = {
  masterVolume: 0.7,
  sfxVolume: 0.8,
  musicVolume: 0.5,
  sfxEnabled: true,
  musicEnabled: true,
  tutorialCompleted: false,
  autoSave: true,
  difficulty: 'medium',
  theme: 'default',
  seenMinigameTutorials: {}, // Initialize as empty object
  language: 'en', // Default language
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

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
