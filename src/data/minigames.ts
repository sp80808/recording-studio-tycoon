import { MiniGame as Minigame } from '@/types/miniGame';

export const availableMinigames: Minigame[] = [
  {
    id: 'fader_drills',
    name: 'Fader Drills',
    description: 'Timing-based mixing practice to improve fader control',
    duration: 0.5, // 30 minutes in days (0.5 = half day)
    cost: 0.5,
    rewards: {
      mixing: { min: 1, max: 3 },
      ear: { min: 1, max: 2 }
    }
  },
  {
    id: 'patch_bay_puzzle',
    name: 'Patch Bay Puzzle',
    description: 'Connection puzzle to learn signal routing',
    duration: 0.75, // 45 minutes
    cost: 0.75,
    rewards: {
      techKnowledge: { min: 1, max: 3 },
      arrangement: { min: 1, max: 2 }
    }
  },
  {
    id: 'waveform_matching',
    name: 'Waveform Matching',
    description: 'Pattern recognition exercise for phase alignment',
    duration: 0.5,
    cost: 0.5,
    rewards: {
      ear: { min: 1, max: 3 },
      soundDesign: { min: 1, max: 2 }
    }
  },
  {
    id: 'eq_frequency_hunt',
    name: 'EQ Frequency Hunt',
    description: 'Identify and adjust problematic frequencies in a mix',
    duration: 0.75,
    cost: 0.75,
    rewards: {
      mixing: { min: 1, max: 3 },
      techKnowledge: { min: 1, max: 2 }
    }
  },
  {
    id: 'chord_progression_builder',
    name: 'Chord Progression Builder',
    description: 'Create pleasing chord progressions within genre constraints',
    duration: 0.75,
    cost: 0.75,
    rewards: {
      songwriting: { min: 1, max: 3 },
      arrangement: { min: 1, max: 2 }
    }
  },
  {
    id: 'drum_pattern_creator',
    name: 'Drum Pattern Creator',
    description: 'Build drum patterns that match different musical styles',
    duration: 0.5,
    cost: 0.5,
    rewards: {
      arrangement: { min: 1, max: 3 },
      soundDesign: { min: 1, max: 2 }
    }
  },
  {
    id: 'vocal_harmony_trainer',
    name: 'Vocal Harmony Trainer',
    description: 'Practice creating and identifying vocal harmonies',
    duration: 0.75,
    cost: 0.75,
    rewards: {
      ear: { min: 1, max: 3 },
      songwriting: { min: 1, max: 2 }
    }
  },
  {
    id: 'microphone_placement_challenge',
    name: 'Microphone Placement Challenge',
    description: 'Optimize microphone positions for different instruments and vocalists.',
    duration: 1.0, // 1 hour
    cost: 1.0,
    rewards: {
      ear: { min: 2, max: 4 },
      technical: { min: 2, max: 3 },
      qualityBonus: { min: 5, max: 10 }
    }
  },
  {
    id: 'mastering_chain_optimization',
    name: 'Mastering Chain Optimization',
    description: 'Fine-tune a mastering signal chain for maximum loudness and clarity without distortion.',
    duration: 1.5, // 1.5 hours
    cost: 1.5,
    rewards: {
      mastering: { min: 3, max: 5 },
      technical: { min: 3, max: 4 },
      qualityBonus: { min: 10, max: 15 }
    }
  },
  {
    id: 'sound_design_synthesis',
    name: 'Sound Design Synthesis',
    description: 'Create unique sounds from scratch using various synthesis techniques.',
    duration: 1.25, // 1 hour 15 minutes
    cost: 1.25,
    rewards: {
      soundDesign: { min: 3, max: 5 },
      creativity: { min: 2, max: 4 },
      inspirationBonus: { min: 5, max: 10 }
    }
  }
];
