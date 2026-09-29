import React, { useState, useEffect, ReactNode } from 'react';
import { gameAudio } from '../utils/audioSystem';
import { SettingsContext, GameSettings, useSettings } from './settings-context-types';
import { defaultSettings } from '../data/defaultSettings';
import { gameEvents } from '../engine/gameEventBus';

export { useSettings };

const SETTINGS_STORAGE_KEY = 'rst_game_settings';

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<GameSettings>(() => {
    if (typeof localStorage === 'undefined') return defaultSettings;
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...defaultSettings, ...parsed };
      }
    } catch (e) {
      console.warn('[SettingsProvider] Failed to parse stored settings:', e);
    }
    return defaultSettings;
  });

  const updateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
        }
      } catch (err) {
        console.warn('[SettingsProvider] Failed to persist settings to localStorage:', err);
      }

      // Emit event through engine bus for decoupled systems (PixiJS canvas, audio, tick engine)
      gameEvents.emit('settings:changed', { changed: newSettings, all: updated });

      return updated;
    });

    // Single source of truth: push volume/mute straight into audio engine
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
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(defaultSettings));
      }
    } catch (err) {
      console.warn('[SettingsProvider] Failed to clear settings from localStorage:', err);
    }
    gameEvents.emit('settings:changed', { changed: defaultSettings, all: defaultSettings });
    gameAudio.updateSettings({ ...defaultSettings });
  };

  const markMinigameTutorialAsSeen = (minigameId: string) => {
    updateSettings({
      seenMinigameTutorials: {
        ...settings.seenMinigameTutorials,
        [minigameId]: true,
      },
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, markMinigameTutorialAsSeen }}>
      {children}
    </SettingsContext.Provider>
  );
};
