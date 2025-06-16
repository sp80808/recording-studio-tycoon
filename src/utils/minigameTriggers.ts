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
  genreBonus?: string[]; // Genres that get bonus trigger chance
  cooldown?: number; // Projects before this minigame can trigger again
}

// Update minigame triggers to match the new plan
const minigameTriggers: MinigameTriggerDefinition[] = [
  // Analog Era Minigames
  {
    minigameType: 'tapeSplicing',
    triggerReason: 'Tape editing and splicing challenge',
    priority: 8,
    era: 'analog',
    equipmentRequired: ['tape_machine', 'splicing_block'],
    stageRequired: ['editing'],
    focusThreshold: { type: 'soundCapture', min: 30 },
    cooldown: 2
  },
  {
    minigameType: 'fourTrackRecording',
    triggerReason: 'Multi-track recording challenge',
    priority: 9,
    era: 'analog',
    equipmentRequired: ['four_track_recorder'],
    stageRequired: ['recording'],
    focusThreshold: { type: 'performance', min: 40 },
    cooldown: 2
  },
  {
    minigameType: 'microphonePlacement',
    triggerReason: 'Microphone positioning challenge',
    priority: 7,
    era: 'analog',
    equipmentRequired: ['microphone'],
    stageRequired: ['recording'],
    focusThreshold: { type: 'soundCapture', min: 25 }
  },
  {
    minigameType: 'analogConsole',
    triggerReason: 'Analog mixing console challenge',
    priority: 8,
    era: 'analog',
    equipmentRequired: ['analog_console'],
    stageRequired: ['mixing'],
    focusThreshold: { type: 'layering', min: 35 },
    genreBonus: ['Rock', 'Jazz']
  },

  // Digital Era Minigames
  {
    minigameType: 'digitalMixing',
    triggerReason: 'Digital mixing challenge',
    priority: 8,
    era: 'digital',
    equipmentRequired: ['digital_console', 'daw'],
    stageRequired: ['mixing'],
    focusThreshold: { type: 'layering', min: 40 },
    genreBonus: ['Pop', 'Electronic']
  },
  {
    minigameType: 'midiProgramming',
    triggerReason: 'MIDI sequencing challenge',
    priority: 7,
    era: 'digital',
    equipmentRequired: ['midi_controller'],
    stageRequired: ['sequencing'],
    focusThreshold: { type: 'creativity', min: 35 },
    genreBonus: ['Electronic', 'Pop']
  },
  {
    minigameType: 'sampleEditing',
    triggerReason: 'Sample manipulation challenge',
    priority: 6,
    era: 'digital',
    equipmentRequired: ['sampler'],
    stageRequired: ['production'],
    focusThreshold: { type: 'creativity', min: 30 },
    genreBonus: ['Hip-Hop', 'Electronic']
  },

  // Internet Era Minigames
  {
    minigameType: 'effectChain',
    triggerReason: 'Effect processing challenge',
    priority: 8,
    era: 'internet',
    equipmentRequired: ['effects_rack'],
    stageRequired: ['production'],
    focusThreshold: { type: 'creativity', min: 40 }
  },
  {
    minigameType: 'masteringChain',
    triggerReason: 'Mastering process challenge',
    priority: 9,
    era: 'internet',
    equipmentRequired: ['mastering_equipment'],
    stageRequired: ['mastering'],
    focusThreshold: { type: 'technical', min: 45 }
  },
  {
    minigameType: 'acousticTuning',
    triggerReason: 'Room acoustics challenge',
    priority: 7,
    era: 'internet',
    equipmentRequired: ['acoustic_treatment'],
    stageRequired: ['studio_setup'],
    focusThreshold: { type: 'technical', min: 35 }
  },

  // Modern Era Minigames
  {
    minigameType: 'hybridMixing',
    triggerReason: 'Hybrid mixing challenge',
    priority: 9,
    era: 'streaming',
    equipmentRequired: ['analog_console', 'daw'],
    stageRequired: ['mixing'],
    focusThreshold: { type: 'layering', min: 45 }
  },
  {
    minigameType: 'digitalDistribution',
    triggerReason: 'Digital distribution challenge',
    priority: 8,
    era: 'streaming',
    equipmentRequired: ['internet_connection'],
    stageRequired: ['release_preparation'],
    focusThreshold: { type: 'business', min: 40 }
  },
  {
    minigameType: 'socialMediaPromotion',
    triggerReason: 'Social media promotion challenge',
    priority: 7,
    era: 'streaming',
    equipmentRequired: ['social_media_accounts'],
    stageRequired: ['marketing'],
    focusThreshold: { type: 'business', min: 35 }
  },

  // Streaming Era Minigames
  {
    minigameType: 'aiMastering',
    triggerReason: 'AI-powered mastering challenge',
    priority: 8,
    era: 'streaming',
    equipmentRequired: ['ai_mastering_software'],
    stageRequired: ['mastering'],
    focusThreshold: { type: 'technical', min: 40 }
  },
  {
    minigameType: 'streamingOptimization',
    triggerReason: 'Streaming platform optimization challenge',
    priority: 9,
    era: 'streaming',
    equipmentRequired: ['streaming_platform_accounts'],
    stageRequired: ['release_preparation'],
    focusThreshold: { type: 'business', min: 45 }
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

    // Check genre bonus
    if (trigger.genreBonus && !trigger.genreBonus.includes(project.genre)) {
      return false;
    }

    // Check cooldown
    if (trigger.cooldown) {
      const lastTriggered = gameState.lastMinigameTriggers?.[trigger.minigameType];
      if (lastTriggered && gameState.completedProjects - lastTriggered < trigger.cooldown) {
        return false;
      }
    }

    return true;
  });
};

// Helper function to determine minigame frequency based on project size
export const getMinigameFrequency = (project: Project): number => {
  switch (project.difficulty) {
    case 1: return 2; // Small projects: 2 minigames
    case 2: return 3; // Medium projects: 3 minigames
    case 3: return 4; // Large projects: 4 minigames
    default: return 3;
  }
};

// Helper function to adjust difficulty based on player level and equipment
export const adjustMinigameDifficulty = (
  baseDifficulty: number,
  playerLevel: number,
  equipmentQuality: number,
  projectComplexity: number
): number => {
  const levelAdjustment = Math.max(0, (playerLevel - 1) * 0.1); // 10% reduction per level
  const equipmentAdjustment = Math.max(0, (equipmentQuality - 1) * 0.15); // 15% reduction per quality level
  const complexityAdjustment = (projectComplexity - 1) * 0.2; // 20% increase per complexity level

  return Math.max(1, Math.min(10,
    baseDifficulty * (1 - levelAdjustment - equipmentAdjustment + complexityAdjustment)
  ));
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
