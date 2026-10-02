import React, { createContext, useContext } from 'react';
import type { ControllerLayoutPreference } from '@/types/gamepad';

export interface GameSettings {
  // Audio
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  sfxEnabled: boolean;
  musicEnabled: boolean;

  // Graphics & Display
  graphicsPreset: 'low' | 'medium' | 'high' | 'ultra';
  resolutionScale: 0.75 | 1.0 | 1.25 | 1.5 | 2.0;
  targetFps: 30 | 60 | 120 | 0; // 0 = unconstrained/vsync
  crtScanlines: boolean;        // Procedural retro scanline & curvature layer
  analogTapeWarmth: boolean;    // Warm color grading, subtle vignette
  bloomAndGlow: boolean;        // Console switches, VU meter lights, glowing displays

  // Gameplay & Controller
  difficulty: 'easy' | 'medium' | 'hard';
  autoSave: boolean;
  controllerLayout: ControllerLayoutPreference; // Gamepad glyph + input layout preference (49i.2)
  gamepadHaptics: boolean; // Rumble/haptic feedback on supported controllers (49i.2)
  tutorialCompleted: boolean;
  seenMinigameTutorials: Record<string, boolean>; // Track seen minigame tutorials

  // Accessibility
  screenShake: boolean;         // Celebration/milestone screenshake
  reducedMotion: boolean;       // Honors OS prefers-reduced-motion or manual toggle
  pocketMeterAssistance: 'strict' | 'normal' | 'generous'; // +/- tolerance
  textScale: 'small' | 'normal' | 'large' | 'xl'; // Root font-size multiplier (rem-based UI scales with it)
  hapticsEnabled: boolean;      // Phone vibration ticks (Android/Chromium)
  toastLevel: 'all' | 'important' | 'off'; // Which pop-up notifications are shown

  // Customization & Localization
  theme: 'default' | 'sunrise-studio' | 'neon-nights' | 'retro-arcade';
  language: string; // Added language setting

  /**
   * Dev-only HUD chrome. Defaults OFF so first launch / fresh settings never
   * cover the studio dock. Opt-in from Settings → System → Developer Tools.
   */
  devShowBoxDropButton: boolean;
  devShowPerfHud: boolean;
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