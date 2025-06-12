import { PlayerAttributes } from './game';

export type MinigameType =
  | 'rhythm_timing'
  | 'mixing_board'
  | 'sound_wave'
  | 'beat_making'
  | 'vocal_recording'
  | 'mastering'
  | 'effect_chain'
  | 'midi_programming'
  | 'digital_mixing'
  | 'sample_editing'
  | 'sound_design'
  | 'acoustic_tuning'
  | 'audio_restoration'
  | 'analog_console'
  | 'four_track_recording'
  | 'tape_splicing'
  | 'microphone_placement'
  | 'mastering_chain'
  | 'sound_design_synthesis';

export interface MinigameTriggerDefinition {
  type: MinigameType;
  triggerReason: string;
  priority: number;
  era: 'analog' | 'digital';
  requiredEquipment: string[];
  requiredSkillLevel: number;
  requiredStages: string[];
}

export interface MiniGameProps {
  onComplete: (score: number) => void;
  difficulty: number;
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
