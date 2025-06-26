import { GameSettings } from './settings-context-types';

export const defaultSettings: GameSettings = {
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