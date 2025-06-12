import { Minigame } from '@/types/game';
import { MinigameType } from '@/types/miniGame'; // Import MinigameType

export const availableMinigames: Minigame[] = [
  {
    id: 'fader_drills',
    name: 'Fader Drills',
    description: 'Timing-based mixing practice to improve fader control',
    duration: 0.5, // 30 minutes in days (0.5 = half day)
    cost: 0.5,
    type: 'mixing_board', // Explicitly set type
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
    type: 'patchbay', // Explicitly set type
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
    type: 'sound_wave', // Explicitly set type
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
    type: 'mixing_board', // Explicitly set type
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
    type: 'midi_programming', // Explicitly set type
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
    type: 'beat_making', // Explicitly set type
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
    type: 'vocal_recording', // Explicitly set type
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
    type: 'microphone_placement', // Explicitly set type
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
    type: 'mastering_chain', // Explicitly set type
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
    type: 'sound_design_synthesis', // Explicitly set type
    rewards: {
      soundDesign: { min: 3, max: 5 },
      creativity: { min: 2, max: 4 },
      inspirationBonus: { min: 5, max: 10 }
    }
  },
  {
    id: 'guitar_pedal_board_challenge',
    name: 'Guitar Pedal Board Challenge',
    description: 'Arrange guitar pedals in the correct order to achieve a target tone.',
    duration: 0.75,
    cost: 0.75,
    type: 'pedalboard',
    rewards: {
      technical: { min: 1, max: 3 },
      ear: { min: 1, max: 2 },
      creativity: { min: 1, max: 2 }
    }
  }
];
