import { GameState, Project, FocusAllocation, PlayerAttributes } from '@/types/game'; // Added PlayerAttributes
import { MinigameType } from '@/types/miniGame';

interface MinigameTriggerDefinition {
  minigameType: MinigameType;
  triggerReason: string;
  priority: number;
  era: Era; // Reusing the Era type from src/types/game.ts
  equipmentRequired?: string[];
  stageRequired?: string[]; // Stage names
  focusThreshold?: { type: keyof FocusAllocation | keyof PlayerAttributes; min: number };
  genreBonus?: string[];
  cooldown?: number; // Number of projects
}

// Ensure MinigameType values here match those in src/types/miniGame.ts
const minigameTriggers: MinigameTriggerDefinition[] = [
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
    stageRequired: ['sequencing', 'production'], 
    focusThreshold: { type: 'creativeIntuition', min: 35 }, 
    genreBonus: ['Electronic', 'Pop']
  },
  {
    minigameType: 'sampleEditing',
    triggerReason: 'Sample manipulation challenge',
    priority: 6,
    era: 'digital',
    equipmentRequired: ['sampler'],
    stageRequired: ['production'],
    focusThreshold: { type: 'creativeIntuition', min: 30 },
    genreBonus: ['Hip-hop', 'Electronic']
  },
  {
    minigameType: 'effectChain',
    triggerReason: 'Effect processing challenge',
    priority: 8,
    era: 'internet',
    equipmentRequired: ['effects_rack'], 
    stageRequired: ['mixing', 'production'],
    focusThreshold: { type: 'creativeIntuition', min: 40 }
  },
  {
    minigameType: 'masteringChain',
    triggerReason: 'Mastering process challenge',
    priority: 9,
    era: 'internet',
    equipmentRequired: ['mastering_equipment'], 
    stageRequired: ['mastering'],
    focusThreshold: { type: 'technicalAptitude', min: 45 } 
  },
  {
    minigameType: 'acousticTuning', 
    triggerReason: 'Room acoustics challenge',
    priority: 7,
    era: 'internet', 
    equipmentRequired: ['acoustic_treatment'],
    stageRequired: ['studio_setup', 'recording'], 
    focusThreshold: { type: 'technicalAptitude', min: 35 }
  },
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
    stageRequired: ['release_preparation', 'distribution'],
    focusThreshold: { type: 'businessAcumen', min: 40 } 
  },
  {
    minigameType: 'socialMediaPromotion',
    triggerReason: 'Social media promotion challenge',
    priority: 7,
    era: 'streaming',
    stageRequired: ['marketing', 'promotion'],
    focusThreshold: { type: 'businessAcumen', min: 35 }
  },
  {
    minigameType: 'aiMastering',
    triggerReason: 'AI-powered mastering challenge',
    priority: 8,
    era: 'streaming',
    equipmentRequired: ['ai_mastering_software'],
    stageRequired: ['mastering'],
    focusThreshold: { type: 'technicalAptitude', min: 40 }
  },
  {
    minigameType: 'streamingOptimization',
    triggerReason: 'Streaming platform optimization challenge',
    priority: 9,
    era: 'streaming',
    stageRequired: ['release_preparation', 'distribution'],
    focusThreshold: { type: 'businessAcumen', min: 45 }
  },
  { 
    minigameType: 'lyricFocus',
    triggerReason: 'Lyrical theme refinement',
    priority: 7,
    era: 'analog', 
    stageRequired: ['songwriting', 'lyrics'],
    focusThreshold: { type: 'creativeIntuition', min: 30 }
  }
];

export const getMinigameTriggers = (gameState: GameState, project: Project): MinigameTriggerDefinition[] => {
  return minigameTriggers.filter(trigger => {
    if (trigger.era !== gameState.currentEra) { 
      return false;
    }

    if (trigger.equipmentRequired) {
      const hasRequiredEquipment = trigger.equipmentRequired.every(equipmentId =>
        gameState.ownedEquipment.some(equipment => equipment.id === equipmentId)
      );
      if (!hasRequiredEquipment) {
        return false;
      }
    }

    if (trigger.stageRequired && project.stages.length > 0 && project.currentStageIndex < project.stages.length) {
      const currentStage = project.stages[project.currentStageIndex];
      if (!trigger.stageRequired.includes(currentStage.stageName.toLowerCase())) { 
        return false;
      }
    } else if (trigger.stageRequired) { 
        return false;
    }
    
    if (trigger.focusThreshold) {
      let currentFocusValue: number | undefined;
      const thresholdType = trigger.focusThreshold.type;

      if (thresholdType in gameState.focusAllocation) {
        currentFocusValue = gameState.focusAllocation[thresholdType as keyof FocusAllocation];
      } else if (thresholdType in gameState.playerData.attributes) {
        currentFocusValue = gameState.playerData.attributes[thresholdType as keyof PlayerAttributes];
      }
      
      if (typeof currentFocusValue !== 'number' || currentFocusValue < trigger.focusThreshold.min) {
        return false;
      }
    }

    if (trigger.genreBonus && !trigger.genreBonus.includes(project.genre)) {
      return false;
    }

    if (trigger.cooldown && gameState.lastMinigameTriggers && Array.isArray(gameState.completedProjects)) {
      const lastTriggeredProjectCount = gameState.lastMinigameTriggers[trigger.minigameType];
      if (typeof lastTriggeredProjectCount === 'number' && (gameState.completedProjects.length - lastTriggeredProjectCount) < trigger.cooldown) {
        return false;
      }
    }
    return true;
  });
};

export const getMinigameFrequency = (project: Project): number => {
  if (project.difficulty <= 3) return 1; 
  if (project.difficulty <= 7) return 2; 
  return 3; 
};

export const adjustMinigameDifficulty = (
  baseDifficulty: number, 
  playerLevel: number,
  projectComplexity: number 
): number => {
  const levelAdjustment = (playerLevel / 20); 
  const complexityAdjustment = (projectComplexity / 20); 

  const adjustedDifficulty = baseDifficulty - levelAdjustment + complexityAdjustment; // Changed let to const
  return Math.max(1, Math.min(10, Math.round(adjustedDifficulty)));
};

export const getMinigameRewards = (
  minigameType: MinigameType,
  difficulty: number, 
  playerLevel: number
): { creativity: number; technical: number; xp: number } => {
  const baseRewards = { creativity: 0, technical: 0, xp: 0 };

  switch (minigameType) {
    case 'rhythmTiming': baseRewards.technical = 2; baseRewards.xp = 10; break;
    case 'mixingBoard': baseRewards.technical = 3; baseRewards.creativity = 1; baseRewards.xp = 20; break;
    case 'tapeSplicing': baseRewards.technical = 4; baseRewards.creativity = 2; baseRewards.xp = 30; break;
    case 'fourTrackRecording': baseRewards.technical = 4; baseRewards.creativity = 2; baseRewards.xp = 30; break;
    case 'analogConsole': baseRewards.technical = 5; baseRewards.creativity = 1; baseRewards.xp = 40; break;
    case 'midiProgramming': baseRewards.technical = 3; baseRewards.creativity = 3; baseRewards.xp = 25; break;
    case 'hybridMixing': baseRewards.technical = 4; baseRewards.creativity = 2; baseRewards.xp = 35; break;
    case 'digitalDistribution': baseRewards.creativity = 1; baseRewards.xp = 30; break; 
    case 'socialMediaPromotion': baseRewards.creativity = 2; baseRewards.xp = 25; break; 
    case 'streamingOptimization': baseRewards.technical = 2; baseRewards.xp = 35; break; 
    case 'aiMastering': baseRewards.technical = 5; baseRewards.creativity = 1; baseRewards.xp = 45; break;
    case 'lyricFocus': baseRewards.creativity = 3; baseRewards.xp = 20; break;
    case 'microphonePlacement': baseRewards.technical = 3; baseRewards.xp = 15; break;
    case 'effectChain': baseRewards.creativity = 2; baseRewards.technical = 2; baseRewards.xp = 25; break;
    case 'masteringChain': baseRewards.technical = 4; baseRewards.xp = 35; break;
    case 'acousticTuning': baseRewards.technical = 3; baseRewards.xp = 20; break; 
    case 'beatMaking': baseRewards.creativity = 4; baseRewards.xp = 25; break;
    case 'digitalMixing': baseRewards.technical = 3; baseRewards.creativity = 1; baseRewards.xp = 30; break;
    case 'pedalboard': baseRewards.creativity = 3; baseRewards.technical = 1; baseRewards.xp = 20; break; 
    case 'instrumentLayering': baseRewards.creativity = 4; baseRewards.technical = 2; baseRewards.xp = 30; break;
    case 'mastering': baseRewards.technical = 5; baseRewards.xp = 50; break; 
    case 'patchbay': baseRewards.technical = 2; baseRewards.xp = 15; break;
    case 'sampleEditing': baseRewards.creativity = 2; baseRewards.technical = 2; baseRewards.xp = 20; break;
    case 'soundWave': baseRewards.technical = 1; baseRewards.creativity = 1; baseRewards.xp = 10; break;
    case 'vocalRecording': baseRewards.technical = 3; baseRewards.creativity = 1; baseRewards.xp = 25; break;
      
    default:
      console.warn(`No specific rewards defined for minigame type: ${minigameType}`);
      baseRewards.xp = 10; 
      break;
  }

  const difficultyMultiplier = 1 + ((difficulty - 5) / 10); 
  const levelMultiplier = 1 + (playerLevel / 20); 

  return {
    creativity: Math.max(0, Math.round(baseRewards.creativity * difficultyMultiplier * levelMultiplier)),
    technical: Math.max(0, Math.round(baseRewards.technical * difficultyMultiplier * levelMultiplier)),
    xp: Math.max(0, Math.round(baseRewards.xp * difficultyMultiplier * levelMultiplier))
  };
};
