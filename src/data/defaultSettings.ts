import { GameSettings } from '../contexts/settings-context-types';

export const GRAPHICS_PRESETS: Record<GameSettings['graphicsPreset'], Partial<GameSettings>> = {
  low: {
    graphicsPreset: 'low',
    resolutionScale: 0.75,
    targetFps: 30,
    crtScanlines: false,
    analogTapeWarmth: false,
    bloomAndGlow: false,
  },
  medium: {
    graphicsPreset: 'medium',
    resolutionScale: 1.0,
    targetFps: 60,
    crtScanlines: false,
    analogTapeWarmth: true,
    bloomAndGlow: false,
  },
  high: {
    graphicsPreset: 'high',
    resolutionScale: 1.0,
    targetFps: 60,
    crtScanlines: true,
    analogTapeWarmth: true,
    bloomAndGlow: true,
  },
  ultra: {
    graphicsPreset: 'ultra',
    resolutionScale: 1.5,
    targetFps: 120,
    crtScanlines: true,
    analogTapeWarmth: true,
    bloomAndGlow: true,
  },
};

export const defaultSettings: GameSettings = {
  masterVolume: 0.7,
  sfxVolume: 0.8,
  musicVolume: 0.5,
  sfxEnabled: true,
  musicEnabled: true,
  graphicsPreset: 'high',
  resolutionScale: 1.0,
  targetFps: 60,
  crtScanlines: false,
  analogTapeWarmth: true,
  bloomAndGlow: true,
  difficulty: 'medium',
  autoSave: true,
  controllerLayout: 'auto', // Match glyphs to the connected controller
  gamepadHaptics: true, // Rumble feedback when supported
  tutorialCompleted: false,
  seenMinigameTutorials: {}, // Initialize as empty object
  screenShake: true,
  reducedMotion: false,
  pocketMeterAssistance: 'normal',
  theme: 'default',
  language: 'en', // Default language
  // Floating DEV chrome — always off until explicitly enabled in Settings
  devShowBoxDropButton: false,
  devShowPerfHud: false,
};