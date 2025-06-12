import { GameState, Project, FocusAllocation } from '@/types/game';
import { MinigameType } from '@/types/miniGame';

interface MinigameTriggerDefinition {
  minigameType: MinigameType;
  triggerReason: string;
  priority: number;
  era: 'analog' | 'digital' | 'internet' | 'streaming';
  equipmentRequired?: string[];
  stageRequired?: string[];
  focusThreshold?: { type: keyof FocusAllocation; min: number };
}

// Update minigame types to match centralized definition
const minigameTriggers: MinigameTriggerDefinition[] = [
  {
    minigameType: 'rhythm_timing',
    triggerReason: 'Perfect timing is crucial for this track',
    priority: 5,
    era: 'analog',
    focusThreshold: { type: 'performance', min: 30 }
  },
  {
    minigameType: 'vocal_recording',
    triggerReason: 'Vocal pitch correction needed',
    priority: 6,
    era: 'analog',
    stageRequired: ['vocal_recording', 'vocal_editing']
  },
  {
    minigameType: 'sound_wave',
    triggerReason: 'Waveform matching required',
    priority: 4,
    era: 'analog',
    focusThreshold: { type: 'soundCapture', min: 25 }
  },
  {
    minigameType: 'beat_making',
    triggerReason: 'Beat creation challenge',
    priority: 7,
    era: 'digital',
    focusThreshold: { type: 'layering', min: 35 }
  },
  {
    minigameType: 'mastering',
    triggerReason: 'Mastering challenge',
    priority: 8,
    era: 'digital',
    stageRequired: ['mastering']
  },
  {
    minigameType: 'effect_chain',
    triggerReason: 'Effect chain optimization',
    priority: 6,
    era: 'digital',
    focusThreshold: { type: 'soundCapture', min: 30 }
  },
  {
    minigameType: 'acoustic_tuning',
    triggerReason: 'Acoustic treatment challenge',
    priority: 5,
    era: 'analog',
    focusThreshold: { type: 'performance', min: 25 }
  },
  {
    minigameType: 'microphone_placement',
    triggerReason: 'Microphone placement challenge',
    priority: 4,
    era: 'analog',
    stageRequired: ['recording']
  },
  {
    minigameType: 'mastering_chain',
    triggerReason: 'Mastering chain optimization',
    priority: 7,
    era: 'digital',
    stageRequired: ['mastering']
  },
  {
    minigameType: 'sound_design_synthesis',
    triggerReason: 'Sound design challenge',
    priority: 6,
    era: 'digital',
    focusThreshold: { type: 'layering', min: 30 }
  },
  {
    minigameType: 'pedalboard',
    triggerReason: 'Pedalboard configuration challenge',
    priority: 5,
    era: 'analog',
    equipmentRequired: ['guitar_pedalboard']
  },
  {
    minigameType: 'patchbay',
    triggerReason: 'Patchbay routing challenge',
    priority: 6,
    era: 'analog',
    equipmentRequired: ['patchbay']
  }
];

export const getMinigameTriggers = (gameState: GameState, project: Project): MinigameTriggerDefinition[] => {
  // Filter triggers based on game state and project requirements
  return minigameTriggers.filter(trigger => {
    // Check era compatibility
    if (trigger.era !== gameState.currentEra) {
      return false;
    }

    // Check equipment requirements
    if (trigger.equipmentRequired) {
      const hasRequiredEquipment = trigger.equipmentRequired.every(equipmentId =>
        gameState.ownedEquipment.some(equipment => equipment.id === equipmentId)
      );
      if (!hasRequiredEquipment) {
        return false;
      }
    }

    // Check stage requirements
    if (trigger.stageRequired && project.stages.length > 0) {
      const currentStage = project.stages[project.currentStageIndex];
      if (!trigger.stageRequired.includes(currentStage.stageName)) {
        return false;
      }
    }

    // Check focus threshold
    if (trigger.focusThreshold) {
      const currentFocus = gameState.focusAllocation[trigger.focusThreshold.type];
      if (typeof currentFocus === 'number' && currentFocus < trigger.focusThreshold.min) {
        return false;
      }
    }

    return true;
  });
};

export const getMinigameRewards = (
  minigameType: MinigameType,
  difficulty: number,
  playerLevel: number
): { creativity: number; technical: number; xp: number } => {
  const baseRewards = {
    creativity: 0,
    technical: 0,
    xp: 0
  };

  // Base rewards based on minigame type
  switch (minigameType) {
    case 'rhythm_timing': // Corrected from 'rhythm' and 'timing'
      baseRewards.technical = 2;
      baseRewards.xp = 1;
      break;
    // case 'pitch': // 'pitch' is not a defined MinigameType. Commenting out for now.
    //   baseRewards.technical = 2; // Or some other logic if it maps to an existing type
    //   baseRewards.xp = 1;
    //   break;
    case 'mixing_board': // Corrected from 'mixing'
      baseRewards.technical = 3;
      baseRewards.creativity = 1;
      baseRewards.xp = 2;
      break;
    case 'tape_splicing':
    case 'four_track_recording':
      baseRewards.technical = 4;
      baseRewards.creativity = 2;
      baseRewards.xp = 3;
      break;
    case 'analog_console':
      baseRewards.technical = 5;
      baseRewards.creativity = 1;
      baseRewards.xp = 4;
      break;
    case 'midi_programming':
      baseRewards.technical = 3;
      baseRewards.creativity = 3;
      baseRewards.xp = 2;
      break;
    case 'hybrid_mixing':
      baseRewards.technical = 4;
      baseRewards.creativity = 2;
      baseRewards.xp = 3;
      break;
    case 'digital_distribution':
    case 'social_media_promotion':
      baseRewards.creativity = 4;
      baseRewards.technical = 2;
      baseRewards.xp = 3;
      break;
    case 'streaming_optimization':
    case 'ai_mastering':
      baseRewards.technical = 5;
      baseRewards.creativity = 3;
      baseRewards.xp = 4;
      break;
  }

  // Scale rewards based on difficulty and player level
  const difficultyMultiplier = 1 + (difficulty * 0.2);
  const levelMultiplier = 1 + (playerLevel * 0.1);

  return {
    creativity: Math.round(baseRewards.creativity * difficultyMultiplier * levelMultiplier),
    technical: Math.round(baseRewards.technical * difficultyMultiplier * levelMultiplier),
    xp: Math.round(baseRewards.xp * difficultyMultiplier * levelMultiplier)
  };
};
