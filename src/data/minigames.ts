import { Minigame } from '@/types/game';

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
  }
];
