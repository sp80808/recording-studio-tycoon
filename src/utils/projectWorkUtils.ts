import { ProjectStage, WorkUnit, StageEvent, MinigameTrigger, StaffMember, PlayerData, FocusAllocation, GameState } from '@/types/game'; 
import { MinigameType } from '@/types/miniGame'; 

export const calculateWorkUnitsGained = (
  playerData: PlayerData,
  focusAllocation: FocusAllocation,
  currentStage: ProjectStage,
  assignedStaff: StaffMember[],
  gameState: GameState // Ensured gameState parameter is here
) => {
  let creativityGain = playerData.dailyWorkCapacity * playerData.attributes.creativeIntuition;
  let technicalGain = playerData.attributes.technicalAptitude;

  // Apply focus allocation multipliers
  creativityGain = creativityGain * (focusAllocation.performance / 100) * 0.8 + 
                   creativityGain * (focusAllocation.layering / 100) * 0.6;
  technicalGain = technicalGain * (focusAllocation.soundCapture / 100) * 0.8 + 
                  technicalGain * (focusAllocation.layering / 100) * 0.4;

  // Apply staff bonuses
  assignedStaff.forEach(staff => {
    const moodEffectiveness = (staff.mood ?? 50) / 100; // Default mood to 50 if undefined
    creativityGain += staff.primaryStats.creativity * moodEffectiveness;
    technicalGain += staff.primaryStats.technical * moodEffectiveness;
  });

  // Apply stage bonuses
  if (currentStage.stageBonuses) {
    creativityGain *= (1 + (currentStage.stageBonuses.creativity || 0) / 100);
    technicalGain *= (1 + (currentStage.stageBonuses.technical || 0) / 100);
  }

  // Apply quality and time multipliers from stage
  if (currentStage.qualityMultiplier) {
    creativityGain *= currentStage.qualityMultiplier;
    technicalGain *= currentStage.qualityMultiplier;
  }
  if (currentStage.timeMultiplier) {
    creativityGain *= currentStage.timeMultiplier;
    technicalGain *= currentStage.timeMultiplier;
  }

  // Apply perk modifiers
  const perks = gameState.aggregatedPerkModifiers;
  if (perks) {
    let stageSpecificQualityModifier = 1.0;
    if (currentStage.stageName.toLowerCase().includes('recording')) {
      stageSpecificQualityModifier *= (perks.globalRecordingQualityModifier || 1.0);
    } else if (currentStage.stageName.toLowerCase().includes('mixing')) {
      stageSpecificQualityModifier *= (perks.globalMixingQualityModifier || 1.0);
    } else if (currentStage.stageName.toLowerCase().includes('mastering')) {
      stageSpecificQualityModifier *= (perks.globalMasteringQualityModifier || 1.0);
    }
    creativityGain *= stageSpecificQualityModifier;
    technicalGain *= stageSpecificQualityModifier;
  }

  return {
    creativityGained: Math.floor(creativityGain),
    technicalGained: Math.floor(technicalGain)
  };
};

export const checkMinigameTrigger = (currentStage: ProjectStage, currentDay: number): MinigameTrigger | null => {
  if (!currentStage.minigameTriggers || currentStage.minigameTriggers.length === 0) {
    return null;
  }

  const availableTriggers = currentStage.minigameTriggers.filter(trigger => {
    return !trigger.lastTriggered || (currentDay - trigger.lastTriggered > 3);
  });

  if (availableTriggers.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * availableTriggers.length);
  return availableTriggers[randomIndex];
};

export const getMinigameTypeForStage = (stageName: string): MinigameType | null => {
  switch (stageName.toLowerCase()) { // Normalize to lower case for matching
    case 'recording':
    case 'vocal recording':
      return 'vocalRecording'; // Corrected to camelCase
    case 'mixing':
      return 'mixingBoard'; // Corrected
    case 'mastering':
      return 'mastering'; // Assuming this is correct
    case 'sound design':
      return 'soundDesign'; // Corrected
    case 'acoustic treatment':
      return 'acousticTuning'; // Corrected
    case 'audio restoration':
      return 'audioRestoration'; // Corrected
    case 'analog console':
      return 'analogConsole'; // Corrected
    case 'microphone placement':
      return 'microphonePlacement'; // Corrected
    case 'mastering chain':
      return 'masteringChain'; // Corrected
    case 'sound design synthesis':
      return 'soundDesignSynthesis'; // Corrected
    case 'guitar pedal board':
      return 'pedalboard'; // Assuming this is correct
    case 'patch bay puzzle':
      return 'patchbay'; // Assuming this is correct
    default:
      return null;
  }
};
