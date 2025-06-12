import { ProjectStage, WorkUnit, StageEvent, MinigameTrigger, StaffMember, PlayerData, FocusAllocation } from '@/types/game'; 
import { MinigameType } from '@/types/miniGame'; // Import MinigameType from miniGame.ts

export const calculateWorkUnitsGained = (
  playerData: PlayerData,
  focusAllocation: FocusAllocation,
  currentStage: ProjectStage,
  assignedStaff: StaffMember[]
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
    const moodEffectiveness = staff.mood / 100; // 0-1 scale
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

  return {
    creativityGained: Math.floor(creativityGain),
    technicalGained: Math.floor(technicalGain)
  };
};

export const checkMinigameTrigger = (currentStage: ProjectStage, currentDay: number): MinigameTrigger | null => {
  if (!currentStage.minigameTriggers || currentStage.minigameTriggers.length === 0) {
    return null;
  }

  // Filter for active triggers that haven't been triggered recently
  const availableTriggers = currentStage.minigameTriggers.filter(trigger => {
    // Example condition: trigger every 3 days if not recently triggered
    return !trigger.lastTriggered || (currentDay - trigger.lastTriggered > 3);
  });

  if (availableTriggers.length === 0) {
    return null;
  }

  // Select a random trigger from available ones
  const randomIndex = Math.floor(Math.random() * availableTriggers.length);
  return availableTriggers[randomIndex];
};

export const getMinigameTypeForStage = (stageName: string): MinigameType | null => {
  switch (stageName) {
    case 'Recording':
    case 'Vocal Recording':
      return 'vocal_recording';
    case 'Mixing':
      return 'mixing_board'; // Changed to full MinigameType
    case 'Mastering':
      return 'mastering';
    case 'Sound Design':
      return 'sound_design';
    case 'Acoustic Treatment':
      return 'acoustic_tuning';
    case 'Audio Restoration':
      return 'audio_restoration';
    case 'Analog Console':
      return 'analog_console';
    case 'Microphone Placement':
      return 'microphone_placement';
    case 'Mastering Chain':
      return 'mastering_chain';
    case 'Sound Design Synthesis':
      return 'sound_design_synthesis';
    case 'Guitar Pedal Board':
      return 'pedalboard';
    case 'Patch Bay Puzzle':
      return 'patchbay';
    default:
      return null;
  }
};
