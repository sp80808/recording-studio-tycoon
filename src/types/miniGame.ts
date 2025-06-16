import { PlayerAttributes } from './game';
import { MusicGenre } from './charts';

export type MinigameType = 
  // Core Recording Minigames
  | 'vocalRecording'
  | 'microphonePlacement'
  | 'fourTrackRecording'
  | 'tapeSplicing'
  
  // Mixing & Production Minigames
  | 'mixingBoard'
  | 'analogConsole'
  | 'digitalMixing'
  | 'hybridMixing'
  | 'effectChain'
  | 'pedalboard'
  | 'patchbay'
  
  // Mastering & Processing Minigames
  | 'mastering'
  | 'masteringChain'
  | 'audioRestoration'
  | 'acousticTuning'
  
  // Creative & Technical Minigames
  | 'rhythmTiming'
  | 'beatMaking'
  | 'soundWave'
  | 'soundDesign'
  | 'soundDesignSynthesis'
  | 'midiProgramming'
  | 'sampleEditing'
  | 'instrumentLayering'
  | 'layering'
  
  // Modern Era Minigames
  | 'digitalDistribution'
  | 'socialMediaPromotion'
  | 'streamingOptimization'
  | 'aiMastering'
  
  // Songwriting Minigames
  | 'lyricFocus';

export interface MinigameTrigger {
  type: MinigameType;
  difficulty: number;
  reward: {
    qualityBonus: number;
    timeBonus: number;
    xpBonus: number;
  };
}

export interface MinigameResult {
  success: boolean;
  score: number;
  qualityBonus: number;
  timeBonus: number;
  xpBonus: number;
  feedback: string;
}

export interface MinigameState {
  isActive: boolean;
  currentType: MinigameType | null;
  difficulty: number;
  timeRemaining: number;
  score: number;
  progress: number;
}

export type MiniGameDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type WaveformType = 'sine' | 'square' | 'triangle';

export interface MiniGame {
  id: string;
  name: string;
  description: string;
  type: MinigameType;
  difficulty: MiniGameDifficulty;
  unlockLevel: number;
  rewards: MiniGameReward;
  maxAttempts: number;
  cooldown: number; // in minutes
}

export interface MiniGameReward {
  xp: number;
  attributes: Partial<PlayerAttributes>;
  unlocks?: string[];
  reputation?: number;
}

export interface MiniGameProgress {
  level: number;
  highScore: number;
  completionCount: number;
  unlockedFeatures: string[];
  lastAttempt: number;
}

// Interfaces for LyricFocusGame
export interface LyricFocusKeyword {
  id: string;
  text: string;
  relevance: 'high' | 'medium' | 'low' | 'distractor'; // For scoring
  isGolden?: boolean; // Optional "perfect match" keyword
}

export interface LyricFocusTheme {
  id: string;
  name: string; // e.g., "Summer Romance", "Social Justice Anthem"
  genre: MusicGenre; // Use MusicGenre type from charts.ts
  mood: string; // e.g., "Upbeat", "Melancholic", "Aggressive"
  description: string; // Brief description of the theme
  coreConcepts: string[]; // e.g., ["Love", "Beach", "Freedom"]
  keywords: LyricFocusKeyword[]; // Pool of keywords for this theme
}

export interface LyricFocusGameState extends MinigameState {
  targetTheme: LyricFocusTheme;
  availableKeywords: LyricFocusKeyword[];
  selectedKeywords: LyricFocusKeyword[];
  maxSelections: number;
}
