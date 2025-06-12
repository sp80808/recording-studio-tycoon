
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

  // VOCAL RECORDING TRIGGERS - High priority for vocal stages with quality mics
  if (ownedEquipmentIds.some(id => id.includes('mic') && !id.includes('basic')) && 
      (stageName.includes('vocal') || stageName.includes('recording') || project.genre === 'Pop')) {
    triggers.push({
      minigameType: 'vocal',
      triggerReason: 'Vocal recording stage detected - nail that perfect take!',
      priority: 10,
      focusThreshold: { type: 'performance', min: 40 }
    });
  }

  // RHYTHM GAME TRIGGERS - For performance-heavy stages and genres
  if ((focusAllocation.performance >= 60 && (stageName.includes('recording') || stageName.includes('performance'))) ||
      (['Rock', 'Hip-hop'].includes(project.genre) && stageName.includes('recording'))) {
    triggers.push({
      minigameType: 'rhythm',
      triggerReason: `${project.genre} performance stage - perfect your timing!`,
      priority: 8,
      focusThreshold: { type: 'performance', min: 50 }
    });
  }

  // MIXING BOARD TRIGGERS - For layering and mixing stages
  if (stageName.includes('mixing') || stageName.includes('layering') || 
      (focusAllocation.layering >= 50 && stageName.includes('production'))) {
    triggers.push({
      minigameType: 'mixing',
      triggerReason: 'Complex mixing stage - time to balance the tracks!',
      priority: 9,
      focusThreshold: { type: 'layering', min: 40 }
    });
  }

  // WAVEFORM ANALYSIS - With professional audio interfaces
  if (ownedEquipmentIds.some(id => id.includes('interface') || id.includes('apogee')) && 
      focusAllocation.soundCapture >= 60) {
    triggers.push({
      minigameType: 'waveform',
      triggerReason: 'Professional interface detected - optimize your sound capture!',
      priority: 9,
      focusThreshold: { type: 'soundCapture', min: 60 }
    });
  }

  // BEAT MAKING - For Hip-hop and Electronic production stages
  if (['Hip-hop', 'Electronic'].includes(project.genre) && 
      (stageName.includes('production') || stageName.includes('beat') || stageName.includes('sequencing'))) {
    triggers.push({
      minigameType: 'beatmaking',
      triggerReason: `${project.genre} beat production - create some killer rhythms!`,
      priority: 8
    });
  }

  // MASTERING - For final stages with high-end equipment
  if ((stageName.includes('mastering') || stageName.includes('final') || isLastStage) &&
      ownedEquipmentIds.some(id => id.includes('mastering') || id.includes('ssl') || id.includes('yamaha'))) {
    triggers.push({
      minigameType: 'mastering',
      triggerReason: 'Final mastering stage - polish this track to perfection!',
      priority: 10
    });
  }

  // GENRE-SPECIFIC ENHANCED TRIGGERS
  
  // Electronic music with synthesizers
  if (project.genre === 'Electronic' && 
      ownedEquipmentIds.some(id => id.includes('synth') || id.includes('moog')) &&
      (stageName.includes('sound design') || stageName.includes('sequencing'))) {
    triggers.push({
      minigameType: 'waveform',
      triggerReason: 'Electronic synthesis stage - craft unique sounds!',
      priority: 8
    });
  }

  // Rock projects with guitar equipment
  if (project.genre === 'Rock' && 
      ownedEquipmentIds.some(id => id.includes('fender') || id.includes('guitar')) &&
      stageName.includes('recording')) {
    triggers.push({
      minigameType: 'rhythm',
      triggerReason: 'Rock recording with guitar gear - time to rock out!',
      priority: 7
    });
  }

  // Pop vocal production
  if (project.genre === 'Pop' && 
      (stageName.includes('vocal') || stageName.includes('production'))) {
    triggers.push({
      minigameType: 'vocal',
      triggerReason: 'Pop vocal production - capture that commercial sound!',
      priority: 9
    });
  }

  // Acoustic projects - more likely to use waveform analysis
  if (project.genre === 'Acoustic' && 
      stageName.includes('recording')) {
    triggers.push({
      minigameType: 'waveform',
      triggerReason: 'Acoustic recording - capture every nuance!',
      priority: 7
    });
  }

  // EFFECT CHAIN BUILDING - For production stages with effects processing
  if (stageName.includes('production') || stageName.includes('effects') || stageName.includes('processing')) {
    triggers.push({
      minigameType: 'effectchain',
      triggerReason: 'Effects processing stage - build the perfect effect chain!',
      priority: 8,
      focusThreshold: { type: 'layering', min: 40 }
    });
  }

  // INSTRUMENT LAYERING - For arrangement and orchestration stages
  if (stageName.includes('arrangement') || stageName.includes('orchestration') || 
      stageName.includes('layering') || stageName.includes('composition') ||
      (focusAllocation.layering >= 60 && stageName.includes('production'))) {
    triggers.push({
      minigameType: 'layering',
      triggerReason: 'Arrangement stage detected - layer instruments for the perfect mix!',
      priority: 8,
      focusThreshold: { type: 'layering', min: 45 }
    });
  }

  // Genre-specific layering triggers
  if ((['Electronic', 'Hip-hop'].includes(project.genre) && stageName.includes('production')) ||
      (project.genre === 'Rock' && stageName.includes('overdub')) ||
      (project.genre === 'Pop' && stageName.includes('arrangement'))) {
    triggers.push({
      minigameType: 'layering',
      triggerReason: `${project.genre} layering challenge - balance the frequencies!`,
      priority: 7,
      focusThreshold: { type: 'layering', min: 40 }
    });
  }

  // High difficulty project fallback
  if (project.difficulty >= 7 && stageProgress >= 0.75 && triggers.length === 0) {
    triggers.push({
      minigameType: 'mixing',
      triggerReason: 'High difficulty project nearing completion - master the complex mix!',
      priority: 6
    });
  }

  // Sort by priority (highest first) and return top 3 to avoid overwhelming
  return triggers.sort((a, b) => b.priority - a.priority).slice(0, 3);
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
  
  // ENHANCED Anti-spam logic: prevent back-to-back minigames
  const isEarlyGame = gameState.playerData.level < 4;
  const lastWorkSession = project.workSessionCount || 0;
  
  // Track the last minigame type to prevent repetition
  const lastMinigameType = gameState.playerData.lastMinigameType || '';
  
  // In early game, require minimum gap between minigames per project
  if (isEarlyGame && lastWorkSession < 3) {
    console.log('🚫 Early game anti-spam: preventing minigame (need at least 3 work sessions)');
    return null;
  }
  
  // Prevent triggering on consecutive work sessions in early game
  if (isEarlyGame && workCount < 2) {
    console.log('🚫 Early game anti-spam: preventing consecutive minigame triggers');
    return null;
  }
  
  // IMPROVED: Prevent same minigame type from triggering repeatedly
  const availableTypes = triggers.filter(trigger => trigger.minigameType !== lastMinigameType);
  const selectedTriggers = availableTypes.length > 0 ? availableTypes : triggers;
  
  // Select a trigger based on variety - not always the highest priority
  let selectedTrigger = selectedTriggers[0];
  
  // Add more randomness to trigger selection to ensure variety
  if (selectedTriggers.length > 1) {
    const randomIndex = Math.floor(Math.random() * Math.min(selectedTriggers.length, 3));
    selectedTrigger = selectedTriggers[randomIndex];
  }
  
  // Enhanced auto-trigger logic with stricter conditions
  // Always trigger on final stages with high-priority minigames (but respect early game limits)
  if (isLastStage && selectedTrigger.priority >= 9 && (!isEarlyGame || lastWorkSession >= 5)) {
    return selectedTrigger;
  }
  
  // Trigger when stage is 85%+ complete (increased threshold)
  if (stageProgress >= 0.85 && selectedTrigger.priority >= 8 && (!isEarlyGame || workCount >= 4)) {
    return selectedTrigger;
  }
  
  // INCREASED intervals to reduce spam - trigger every 4-6 work sessions for high priority minigames
  const highPriorityInterval = isEarlyGame ? 6 : 4;
  if (selectedTrigger.priority >= 9 && workCount % highPriorityInterval === 0 && workCount > 0) {
    return selectedTrigger;
  }
  
  // Trigger every 6-8 work sessions for medium priority (much increased interval)
  const mediumPriorityInterval = isEarlyGame ? 8 : 6;
  if (selectedTrigger.priority >= 7 && workCount % mediumPriorityInterval === 0 && workCount > 0) {
    return selectedTrigger;
  }

  return null;
};
