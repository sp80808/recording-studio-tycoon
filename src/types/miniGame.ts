import { PlayerAttributes } from './game';

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
  | 'aiMastering';

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

export interface MinigameTriggerDefinition {
  type: MinigameType;
  difficulty: number;
  requiredSkills?: Record<string, number>;
  reward: {
    qualityBonus: number;
    timeBonus: number;
    xpBonus: number;
  };
}

// Minigame-specific interfaces
export interface VocalRecordingState extends MinigameState {
  pitchAccuracy: number;
  timingAccuracy: number;
  breathControl: number;
  currentPhrase: number;
  totalPhrases: number;
}

export interface MixingBoardState extends MinigameState {
  channelLevels: Record<string, number>;
  effects: Record<string, boolean>;
  panPositions: Record<string, number>;
  masterLevel: number;
}

export interface MasteringState extends MinigameState {
  eqBands: Record<string, number>;
  compression: {
    threshold: number;
    ratio: number;
    attack: number;
    release: number;
  };
  limiting: {
    threshold: number;
    ceiling: number;
  };
}

export interface SoundDesignState extends MinigameState {
  oscillators: Record<string, {
    waveform: string;
    frequency: number;
    amplitude: number;
  }>;
  filters: Record<string, {
    type: string;
    cutoff: number;
    resonance: number;
  }>;
  effects: Record<string, {
    type: string;
    parameters: Record<string, number>;
  }>;
}

export interface MidiProgrammingState extends MinigameState {
  currentPattern: number;
  totalPatterns: number;
  noteGrid: boolean[][];
  velocityGrid: number[][];
  selectedInstrument: string;
}

export interface PatchBayState extends MinigameState {
  connections: Array<{
    source: string;
    destination: string;
    type: string;
  }>;
  availablePorts: string[];
  requiredConnections: Array<{
    source: string;
    destination: string;
    type: string;
  }>;
}

export interface DigitalDistributionState extends MinigameState {
  platforms: Record<string, {
    selected: boolean;
    optimization: number;
    reach: number;
  }>;
  marketingBudget: number;
  targetAudience: Record<string, number>;
}

export interface SocialMediaPromotionState extends MinigameState {
  platforms: Record<string, {
    followers: number;
    engagement: number;
    contentQuality: number;
  }>;
  campaignBudget: number;
  targetMetrics: Record<string, number>;
}

export interface StreamingOptimizationState extends MinigameState {
  platforms: Record<string, {
    optimization: number;
    reach: number;
    conversion: number;
  }>;
  metadata: {
    title: string;
    artist: string;
    genre: string[];
    mood: string[];
    tags: string[];
  };
}

export interface AIMasteringState extends MinigameState {
  style: string;
  intensity: number;
  referenceTracks: string[];
  processingChain: Array<{
    type: string;
    parameters: Record<string, number>;
  }>;
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

export interface WaveformProps {
  type: WaveformType;
  frequency: number;
  amplitude: number;
  phase: number;
  onMatch?: (accuracy: number) => void;
}

export interface WaveformState {
  currentShape: WaveformProps;
  targetShape: WaveformProps;
  matchAccuracy: number;
}

export interface MiniGameProgression {
  unlockedGames: string[];
  completedGames: string[];
  currentLevel: number;
  totalScore: number;
  achievements: string[];
}

export interface MiniGameContext {
  currentGame: MiniGame | null;
  progress: MiniGameProgress;
  startGame: (gameId: string) => void;
  endGame: (score: number) => void;
  updateProgress: (progress: Partial<MiniGameProgress>) => void;
}

export interface WaveformLayer {
  id: string;
  type: WaveformType;
  frequency: number;
  amplitude: number;
  phase: number;
  enabled: boolean;
}

export interface EQBand {
  id: string;
  frequency: number;
  gain: number;
  q: number;
  type: 'lowShelf' | 'highShelf' | 'peak' | 'notch';
  enabled: boolean;
}

export interface TargetEQ {
  id: string;
  name: string;
  description: string;
  complexity: number;
  bands: EQBand[];
  audioSample: string; // URL to the audio sample
}

export interface EQMatchResult {
  accuracy: number;
  bandMatches: {
    [bandId: string]: {
      frequencyAccuracy: number;
      gainAccuracy: number;
      qAccuracy: number;
    };
  };
}
