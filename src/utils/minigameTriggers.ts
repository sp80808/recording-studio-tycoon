import { GameState, MinigameType, Project, FocusAllocation } from '@/types/game';

interface MinigameTriggerDefinition {
  minigameType: MinigameType;
  triggerReason: string;
  priority: number;
  era: 'analog' | 'digital' | 'internet' | 'streaming';
  equipmentRequired?: string[];
  stageRequired?: string[];
  focusThreshold?: { type: keyof FocusAllocation; min: number };
  skillRequired?: { type: string; level: number };
}

export const getMinigameTriggers = (gameState: GameState, project: Project): MinigameTriggerDefinition[] => {
  const triggers: MinigameTriggerDefinition[] = [];
  const { player, ownedEquipment } = gameState;
  const ownedEquipmentIds = ownedEquipment.map(eq => eq.id);
  const currentEra = player.era;

  // Core minigames - available in all eras
  triggers.push({
    minigameType: 'rhythm',
    triggerReason: 'Perfect timing is crucial for this track',
    priority: 5,
    era: currentEra,
    focusThreshold: { type: 'performance', min: 30 }
  });

  triggers.push({
    minigameType: 'pitch',
    triggerReason: 'Vocal pitch correction needed',
    priority: 6,
    era: currentEra,
    stageRequired: ['vocal_recording', 'vocal_editing']
  });

  // Analog Era minigames
  if (currentEra === 'analog') {
    if (ownedEquipmentIds.some(id => id.includes('tape'))) {
      triggers.push({
        minigameType: 'tape_splicing',
        triggerReason: 'Tape editing required for this section',
        priority: 8,
        era: 'analog',
        equipmentRequired: ['tape_machine'],
        skillRequired: { type: 'editing', level: 2 }
      });
    }

    if (ownedEquipmentIds.some(id => id.includes('console'))) {
      triggers.push({
        minigameType: 'analog_console',
        triggerReason: 'Mixing on analog console',
        priority: 2,
        era: 'analog',
        equipmentRequired: ['analog_console'],
        skillRequired: { type: 'mixing', level: 3 },
        stageRequired: ['mixing', 'mastering']
      });
    }

    if (ownedEquipmentIds.some(id => id.includes('four_track'))) {
      triggers.push({
        minigameType: 'four_track_recording',
        triggerReason: 'Four track recording and bouncing challenge',
        priority: 9,
        era: 'analog',
        equipmentRequired: ['four_track_recorder'],
        skillRequired: { type: 'recording', level: 3 },
        stageRequired: ['recording', 'editing']
      });
    }
  }

  // Digital Era minigames
  if (currentEra === 'digital') {
    if (ownedEquipmentIds.some(id => id.includes('midi'))) {
      triggers.push({
        minigameType: 'midi_programming',
        triggerReason: 'MIDI Programming Challenge',
        priority: 2,
        era: 'digital',
        equipmentRequired: ['midi_controller', 'digital_workstation'],
        skillRequired: { type: 'programming', level: 3 },
        stageRequired: ['recording', 'editing']
      });
    }

    if (ownedEquipmentIds.some(id => id.includes('digital'))) {
      triggers.push({
        minigameType: 'hybrid_mixing',
        triggerReason: 'Digital/Analog hybrid mixing challenge',
        priority: 8,
        era: 'digital',
        equipmentRequired: ['digital_console'],
        skillRequired: { type: 'mixing', level: 3 }
      });
    }

    triggers.push(
      {
        type: 'midi_programming',
        triggerReason: 'MIDI Programming Challenge',
        priority: 2,
        era: 'digital',
        requiredEquipment: ['midi_controller', 'digital_workstation'],
        requiredSkillLevel: 3,
        requiredStages: ['recording', 'editing']
      },
      {
        type: 'digital_mixing',
        triggerReason: 'Digital Mixing Challenge',
        priority: 3,
        era: 'digital',
        requiredEquipment: ['digital_workstation', 'audio_interface'],
        requiredSkillLevel: 4,
        requiredStages: ['mixing', 'mastering']
      },
      {
        type: 'sample_editing',
        triggerReason: 'Sample Editing Challenge',
        priority: 4,
        era: 'digital',
        requiredEquipment: ['digital_workstation', 'sample_library'],
        requiredSkillLevel: 4,
        requiredStages: ['editing', 'production']
      },
      {
        type: 'sound_design',
        triggerReason: 'Sound Design Challenge',
        priority: 5,
        era: 'digital',
        requiredEquipment: ['digital_workstation', 'synthesizer'],
        requiredSkillLevel: 5,
        requiredStages: ['production', 'post_production']
      },
      {
        type: 'audio_restoration',
        triggerReason: 'Audio Restoration Challenge',
        priority: 3,
        era: 'digital',
        requiredEquipment: ['digital_workstation', 'audio_interface'],
        requiredSkillLevel: 4,
        requiredStages: ['mixing', 'mastering']
      }
    );
  }

  // Internet Era minigames
  if (currentEra === 'internet') {
    triggers.push({
      minigameType: 'digital_distribution',
      triggerReason: 'Optimize release for digital platforms',
      priority: 6,
      era: 'internet',
      skillRequired: { type: 'marketing', level: 2 }
    });

    triggers.push({
      minigameType: 'social_media_promotion',
      triggerReason: 'Create engaging social media content',
      priority: 5,
      era: 'internet',
      skillRequired: { type: 'marketing', level: 1 }
    });
  }

  // Streaming Era minigames
  if (currentEra === 'streaming') {
    triggers.push({
      minigameType: 'streaming_optimization',
      triggerReason: 'Optimize audio for streaming platforms',
      priority: 7,
      era: 'streaming',
      skillRequired: { type: 'mastering', level: 3 }
    });

    triggers.push({
      minigameType: 'ai_mastering',
      triggerReason: 'AI-assisted mastering challenge',
      priority: 8,
      era: 'streaming',
      equipmentRequired: ['ai_mastering_suite'],
      skillRequired: { type: 'mastering', level: 4 }
    });
  }

  return triggers;
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
    case 'rhythm':
    case 'pitch':
    case 'timing':
      baseRewards.technical = 2;
      baseRewards.xp = 1;
      break;
    case 'mixing':
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