
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

  // Enhanced trigger logic based on stage types and equipment
  const stageName = currentStage.stageName.toLowerCase();
  const isLastStage = project.currentStageIndex >= project.stages.length - 2;
  const stageProgress = currentStage.workUnitsCompleted / currentStage.workUnitsBase;

  // Rhythm game triggers - for performance-heavy stages
  if (focusAllocation.performance >= 60 && (stageName.includes('recording') || stageName.includes('performance'))) {
    triggers.push({
      minigameType: 'rhythm',
      triggerReason: 'High performance focus during recording - perfect your timing!',
      priority: 8,
      focusThreshold: { type: 'performance', min: 60 }
    });
  }

  // Mixing board triggers - for layering and mixing stages
  if (focusAllocation.layering >= 50 && 
      (stageName.includes('mixing') || stageName.includes('layering') || stageName.includes('production'))) {
    triggers.push({
      minigameType: 'mixing',
      triggerReason: 'Complex layering detected - time to balance the mix!',
      priority: 9,
      focusThreshold: { type: 'layering', min: 50 }
    });
  }

  // Waveform analysis with professional audio interfaces
  if (ownedEquipmentIds.some(id => id.includes('interface') || id.includes('apogee')) && 
      focusAllocation.soundCapture >= 70) {
    triggers.push({
      minigameType: 'waveform',
      triggerReason: 'Professional interface detected - optimize your sound capture!',
      priority: 10,
      focusThreshold: { type: 'soundCapture', min: 70 }
    });
  }

  // Beat making for Hip-hop and Electronic genres
  if (['Hip-hop', 'Electronic'].includes(project.genre) && 
      (stageName.includes('production') || stageName.includes('beat'))) {
    triggers.push({
      minigameType: 'beatmaking',
      triggerReason: `${project.genre} production stage - create some killer beats!`,
      priority: 8,
      stageRequired: ['production']
    });
  }

  // Vocal recording with quality microphones
  if (ownedEquipmentIds.some(id => id.includes('mic') && !id.includes('basic')) && 
      focusAllocation.performance >= 50 &&
      (stageName.includes('vocal') || stageName.includes('recording'))) {
    triggers.push({
      minigameType: 'vocal',
      triggerReason: 'Quality microphone + vocal stage - nail that perfect take!',
      priority: 9,
      focusThreshold: { type: 'performance', min: 50 }
    });
  }

  // Mastering with high-end equipment on final stages
  if (ownedEquipmentIds.some(id => id.includes('mastering') || id.includes('ssl') || id.includes('yamaha')) && 
      (stageName.includes('mastering') || isLastStage)) {
    triggers.push({
      minigameType: 'mastering',
      triggerReason: 'Final stage with pro equipment - polish this track to perfection!',
      priority: 10
    });
  }

  // Genre-specific enhanced triggers
  if (project.genre === 'Electronic' && ownedEquipmentIds.some(id => id.includes('synth') || id.includes('moog'))) {
    triggers.push({
      minigameType: 'waveform',
      triggerReason: 'Electronic music + synthesizer = sound design opportunity!',
      priority: 8
    });
  }

  if (project.genre === 'Rock' && ownedEquipmentIds.some(id => id.includes('fender') || id.includes('guitar'))) {
    triggers.push({
      minigameType: 'rhythm',
      triggerReason: 'Rock project with guitar gear - time to rock out!',
      priority: 7
    });
  }

  // High difficulty project triggers
  if (project.difficulty >= 7 && stageProgress >= 0.75) {
    triggers.push({
      minigameType: 'mixing',
      triggerReason: 'High difficulty project nearing completion - master the complex mix!',
      priority: 9
    });
  }

  // Sort by priority (highest first)
  return triggers.sort((a, b) => b.priority - a.priority);
};

export const shouldAutoTriggerMinigame = (
  project: Project,
  gameState: GameState,
  focusAllocation: FocusAllocation,
  workCount: number
): MinigameTrigger | null => {
  const triggers = getTriggeredMinigames(project, gameState, focusAllocation);
  
  if (triggers.length === 0) return null;

  const currentStage = project.stages[project.currentStageIndex];
  const isLastStage = project.currentStageIndex >= project.stages.length - 2;
  const stageProgress = currentStage ? (currentStage.workUnitsCompleted / currentStage.workUnitsBase) : 0;
  
  const topTrigger = triggers[0];
  
  // Enhanced auto-trigger logic
  // Always trigger on final stages with high-priority minigames
  if (isLastStage && topTrigger.priority >= 9) {
    return topTrigger;
  }
  
  // Trigger when stage is 75%+ complete
  if (stageProgress >= 0.75 && topTrigger.priority >= 8) {
    return topTrigger;
  }
  
  // Trigger every 2-3 work sessions for high priority minigames
  if (topTrigger.priority >= 9 && workCount % 2 === 0) {
    return topTrigger;
  }
  
  // Trigger every 3 work sessions for medium priority
  if (topTrigger.priority >= 7 && workCount % 3 === 0) {
    return topTrigger;
  }

  return null;
};
