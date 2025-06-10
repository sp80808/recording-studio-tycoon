import { MiniGame } from '@/types/miniGame';

export const MINI_GAMES: MiniGame[] = [
  {
    id: 'waveform_matching',
    name: 'Waveform Matching',
    description: 'Match the target waveform shape by adjusting frequency, amplitude, and phase.',
    type: 'sound',
    difficulty: 'beginner',
    unlockLevel: 2,
    rewards: {
      xp: 100,
      attributes: {
        technicalAptitude: 1,
        creativeIntuition: 1,
      },
    },
    maxAttempts: 3,
    cooldown: 30,
  },
  {
    id: 'microphone_placement',
    name: 'Microphone Placement',
    description: 'Position microphones optimally for different instruments and recording scenarios.',
    type: 'recording',
    difficulty: 'beginner',
    unlockLevel: 3,
    rewards: {
      xp: 150,
      attributes: {
        technicalAptitude: 2,
      },
    },
    maxAttempts: 3,
    cooldown: 45,
  },
  {
    id: 'waveform_sculpting',
    name: 'Waveform Sculpting',
    description: 'Create complex waveforms by combining and manipulating basic shapes.',
    type: 'sound',
    difficulty: 'intermediate',
    unlockLevel: 12,
    rewards: {
      xp: 200,
      attributes: {
        technicalAptitude: 2,
        creativeIntuition: 2,
      },
    },
    maxAttempts: 3,
    cooldown: 60,
  },
  {
    id: 'level_balancing',
    name: 'Level Balancing',
    description: 'Balance multiple tracks to create a cohesive mix.',
    type: 'mixing',
    difficulty: 'intermediate',
    unlockLevel: 15,
    rewards: {
      xp: 250,
      attributes: {
        technicalAptitude: 2,
        focusMastery: 1,
      },
    },
    maxAttempts: 3,
    cooldown: 60,
  },
  {
    id: 'dynamic_range',
    name: 'Dynamic Range Control',
    description: 'Master the art of compression and limiting for professional sound.',
    type: 'mastering',
    difficulty: 'advanced',
    unlockLevel: 26,
    rewards: {
      xp: 300,
      attributes: {
        technicalAptitude: 3,
        creativeIntuition: 2,
      },
    },
    maxAttempts: 3,
    cooldown: 90,
  },
  {
    id: 'sound_synthesis',
    name: 'Sound Synthesis',
    description: 'Create unique sounds using various synthesis methods.',
    type: 'sound',
    difficulty: 'advanced',
    unlockLevel: 30,
    rewards: {
      xp: 350,
      attributes: {
        creativeIntuition: 3,
        technicalAptitude: 2,
      },
    },
    maxAttempts: 3,
    cooldown: 90,
  },
];

export const getAvailableMiniGames = (playerLevel: number): MiniGame[] => {
  return MINI_GAMES.filter(game => game.unlockLevel <= playerLevel);
};

export const getMiniGameById = (id: string): MiniGame | undefined => {
  return MINI_GAMES.find(game => game.id === id);
};

export const getMiniGamesByType = (type: string): MiniGame[] => {
  return MINI_GAMES.filter(game => game.type === type);
};

export const getMiniGamesByDifficulty = (difficulty: string): MiniGame[] => {
  return MINI_GAMES.filter(game => game.difficulty === difficulty);
}; 