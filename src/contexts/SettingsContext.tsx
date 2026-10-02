import { applyFeelAttributes } from '@/lib/motion/feelMode';
import React, { useState, useEffect, ReactNode } from 'react';
import { gameAudio } from '../utils/audioSystem';
import { SettingsContext, GameSettings, useSettings } from './settings-context-types';
import { defaultSettings, GRAPHICS_PRESETS } from '../data/defaultSettings';
import { isCoarsePointer, setHapticsEnabled } from '../utils/mobilePlatform';
import { gameEvents } from '../engine/gameEventBus';
import { toastGate } from '../lib/toastGate';
import i18n from '../i18n';
import { resolveSupportedLocale } from '../i18n/supportedLocales';

export { useSettings };

const SETTINGS_STORAGE_KEY = 'rst_game_settings';

const TEXT_SCALE_PERCENT: Record<GameSettings['textScale'], number> = {
  small: 90,
  normal: 100,
  large: 115,
  xl: 130,
};

function resolveLanguage(raw: unknown): string {
  return resolveSupportedLocale(raw);
}

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
        // DEV chrome is opt-in only — never treat missing/legacy values as enabled
        return {
          ...defaultSettings,
          ...parsed,
          language: resolveLanguage(parsed.language ?? defaultSettings.language),
          devShowBoxDropButton: parsed.devShowBoxDropButton === true,
          devShowPerfHud: parsed.devShowPerfHud === true,
        };
      }
    } catch (e) {
      console.warn('[SettingsProvider] Failed to parse stored settings:', e);
    }
    // First launch on a touch device: start on the lighter graphics preset (no bloom, 1x resolution)
    if (isCoarsePointer()) return { ...defaultSettings, ...GRAPHICS_PRESETS.medium };
    return defaultSettings;
  });

  // Keep i18next in sync with the persisted Settings language (including first paint)
  useEffect(() => {
    const lng = resolveLanguage(settings.language);
    if (i18n.language !== lng) {
      void i18n.changeLanguage(lng);
    }
  }, [settings.language]);

  // Mirror motion mode onto <html> so feel.css honours the in-game setting, not just the OS query
  useEffect(() => {
    applyFeelAttributes(document.documentElement, settings);
  }, [settings.reducedMotion, settings.graphicsPreset]);

  // Text size: scale the root font-size so rem-based UI follows; also toggle haptics + toast filtering
  useEffect(() => {
    const scale = TEXT_SCALE_PERCENT[settings.textScale] ?? 100;
    document.documentElement.style.fontSize = scale === 100 ? '' : `${scale}%`;
  }, [settings.textScale]);

  useEffect(() => {
    document.documentElement.setAttribute('data-high-contrast', settings.highContrast ? 'true' : 'false');
  }, [settings.highContrast]);

  useEffect(() => {
    setHapticsEnabled(settings.hapticsEnabled !== false);
  }, [settings.hapticsEnabled]);

  useEffect(() => {
    toastGate.level = settings.toastLevel ?? 'all';
  }, [settings.toastLevel]);

  const updateSettings = (newSettings: Partial<GameSettings>) => {
    const normalised: Partial<GameSettings> = { ...newSettings };
    if (newSettings.language !== undefined) {
      normalised.language = resolveLanguage(newSettings.language);
    }

    setSettings((prev) => {
      const updated = { ...prev, ...normalised };
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
        }
      } catch (err) {
        console.warn('[SettingsProvider] Failed to persist settings to localStorage:', err);
      }

      gameEvents.emit('settings:changed', { changed: normalised, all: updated });

      return updated;
    });

    const { masterVolume, sfxVolume, musicVolume, sfxEnabled, musicEnabled } = normalised;
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
    void i18n.changeLanguage(resolveLanguage(defaultSettings.language));
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
