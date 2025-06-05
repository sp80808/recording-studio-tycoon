
import { GameState, Project, FocusAllocation } from '@/types/game';
import { MinigameType } from '@/components/minigames/MinigameManager';

export interface MinigameTrigger {
  minigameType: MinigameType;
  triggerReason: string;
  priority: number; // Higher = more important
  equipmentRequired?: string[];
  stageRequired?: string[];
  focusThreshold?: { type: keyof FocusAllocation; min: number };
}

export const getTriggeredMinigames = (
  project: Project,
  gameState: GameState,
  focusAllocation: FocusAllocation
): MinigameTrigger[] => {
  if (!project || !project.stages || project.currentStageIndex >= project.stages.length) {
    return [];
  }

  const currentStage = project.stages[project.currentStageIndex];
  const ownedEquipmentIds = gameState.ownedEquipment.map(e => e.id);
  const triggers: MinigameTrigger[] = [];

  // Rhythm game triggers
  if (focusAllocation.performance >= 70 && currentStage.stageName.toLowerCase().includes('recording')) {
    triggers.push({
      minigameType: 'rhythm',
      triggerReason: 'High performance focus during recording - perfect your timing!',
      priority: 8,
      focusThreshold: { type: 'performance', min: 70 }
    });
  }

  // Mixing board triggers
  if (focusAllocation.layering >= 60 && 
      (currentStage.stageName.toLowerCase().includes('mixing') || 
       currentStage.stageName.toLowerCase().includes('layering'))) {
    triggers.push({
      minigameType: 'mixing',
      triggerReason: 'Heavy layering work detected - time to balance the mix!',
      priority: 9,
      focusThreshold: { type: 'layering', min: 60 }
    });
  }

  // Waveform analysis with audio interface
  if (ownedEquipmentIds.includes('audio_interface_pro') && 
      focusAllocation.soundCapture >= 75) {
    triggers.push({
      minigameType: 'waveform',
      triggerReason: 'Pro audio interface + high sound capture focus = waveform optimization time!',
      priority: 10,
      equipmentRequired: ['audio_interface_pro'],
      focusThreshold: { type: 'soundCapture', min: 75 }
    });
  }

  // Beat making for certain genres
  if (['Hip-hop', 'Electronic'].includes(project.genre) && 
      currentStage.stageName.toLowerCase().includes('production')) {
    triggers.push({
      minigameType: 'beatmaking',
      triggerReason: `${project.genre} production stage - create some killer beats!`,
      priority: 7,
      stageRequired: ['production']
    });
  }

  // Vocal recording with good microphones
  if (ownedEquipmentIds.some(id => id.includes('mic')) && 
      focusAllocation.performance >= 60 &&
      currentStage.stageName.toLowerCase().includes('vocal')) {
    triggers.push({
      minigameType: 'vocal',
      triggerReason: 'Vocal recording stage with quality microphone - nail that perfect take!',
      priority: 8,
      focusThreshold: { type: 'performance', min: 60 }
    });
  }

  // Mastering with high-end equipment
  if (ownedEquipmentIds.includes('mastering_suite') && 
      currentStage.stageName.toLowerCase().includes('mastering')) {
    triggers.push({
      minigameType: 'mastering',
      triggerReason: 'Professional mastering stage - polish this track to perfection!',
      priority: 10,
      equipmentRequired: ['mastering_suite']
    });
  }

  // Additional contextual triggers
  if (project.difficulty >= 8 && focusAllocation.layering >= 80) {
    triggers.push({
      minigameType: 'mixing',
      triggerReason: 'High difficulty project with intense layering - master the complex mix!',
      priority: 9
    });
  }

  if (project.genre === 'Electronic' && ownedEquipmentIds.includes('synthesizer_pro')) {
    triggers.push({
      minigameType: 'waveform',
      triggerReason: 'Electronic music + pro synthesizer = sound design opportunity!',
      priority: 7,
      equipmentRequired: ['synthesizer_pro']
    });
  }

  // Sort by priority (highest first)
  return triggers.sort((a, b) => b.priority - a.priority);
};

export const shouldAutoTriggerMinigame = (
  project: Project,
  gameState: GameState,
  focusAllocation: FocusAllocation,
  workCount: number // How many times they've worked on this project
): MinigameTrigger | null => {
  const triggers = getTriggeredMinigames(project, gameState, focusAllocation);
  
  if (triggers.length === 0) return null;

  // Auto-trigger logic based on work count and conditions
  const topTrigger = triggers[0];
  
  // Trigger every 2-3 work sessions for high priority minigames
  if (topTrigger.priority >= 9 && workCount % 2 === 0) {
    return topTrigger;
  }
  
  // Trigger every 3-4 work sessions for medium priority
  if (topTrigger.priority >= 7 && workCount % 3 === 0) {
    return topTrigger;
  }
  
  // Trigger every 4-5 work sessions for lower priority
  if (topTrigger.priority >= 5 && workCount % 4 === 0) {
    return topTrigger;
  }

  return null;
};
