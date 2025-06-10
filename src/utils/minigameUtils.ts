import { GameState, Project, FocusAllocation, MinigameType, MinigameTrigger } from '@/types/game';
import { v4 as uuidv4 } from 'uuid';

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

  const stageName = currentStage.stageName.toLowerCase();
  const isLastStage = project.currentStageIndex >= project.stages.length - 2;
  const stageProgress = currentStage.workUnitsCompleted / currentStage.workUnitsBase;

  // VOCAL RECORDING TRIGGERS - High priority for vocal stages with quality mics
  if (ownedEquipmentIds.some(id => id.includes('mic') && !id.includes('basic')) && 
      (stageName.includes('vocal') || stageName.includes('recording') || project.genre === 'Pop')) {
    triggers.push({
      id: uuidv4(),
      type: 'vocal',
      triggerReason: 'Vocal recording stage detected - nail that perfect take!',
      difficulty: 10,
      rewards: calculateMinigameRewards('vocal', 10)
    });
  }

  // RHYTHM GAME TRIGGERS - For performance-heavy stages and genres
  if ((focusAllocation.performance >= 60 && (stageName.includes('recording') || stageName.includes('performance'))) ||
      (['Rock', 'Hip-hop'].includes(project.genre) && stageName.includes('recording'))) {
    triggers.push({
      id: uuidv4(),
      type: 'rhythm',
      triggerReason: `${project.genre} performance stage - perfect your timing!`,
      difficulty: 8,
      rewards: calculateMinigameRewards('rhythm', 8)
    });
  }

  // MIXING BOARD TRIGGERS - For layering and mixing stages
  if (stageName.includes('mixing') || stageName.includes('layering') || 
      (focusAllocation.layering >= 50 && stageName.includes('production'))) {
    triggers.push({
      id: uuidv4(),
      type: 'mixing',
      triggerReason: 'Complex mixing stage - time to balance the tracks!',
      difficulty: 9,
      rewards: calculateMinigameRewards('mixing', 9)
    });
  }

  // WAVEFORM ANALYSIS - With professional audio interfaces
  if (ownedEquipmentIds.some(id => id.includes('interface') || id.includes('apogee')) && 
      focusAllocation.soundCapture >= 60) {
    triggers.push({
      id: uuidv4(),
      type: 'waveform',
      triggerReason: 'Professional interface detected - optimize your sound capture!',
      difficulty: 9,
      rewards: calculateMinigameRewards('waveform', 9)
    });
  }

  // BEAT MAKING - For Hip-hop and Electronic production stages
  if (['Hip-hop', 'Electronic'].includes(project.genre) && 
      (stageName.includes('production') || stageName.includes('beat') || stageName.includes('sequencing'))) {
    triggers.push({
      id: uuidv4(),
      type: 'beatmaking',
      triggerReason: `${project.genre} beat production - create some killer rhythms!`,
      difficulty: 8,
      rewards: calculateMinigameRewards('beatmaking', 8)
    });
  }

  // MASTERING - For final stages with high-end equipment
  if ((stageName.includes('mastering') || stageName.includes('final') || isLastStage) &&
      ownedEquipmentIds.some(id => id.includes('mastering') || id.includes('ssl') || id.includes('yamaha'))) {
    triggers.push({
      id: uuidv4(),
      type: 'mastering',
      triggerReason: 'Final mastering stage - polish this track to perfection!',
      difficulty: 10,
      rewards: calculateMinigameRewards('mastering', 10)
    });
  }

  // GENRE-SPECIFIC ENHANCED TRIGGERS
  
  // Electronic music with synthesizers
  if (project.genre === 'Electronic' && 
      ownedEquipmentIds.some(id => id.includes('synth') || id.includes('moog')) &&
      (stageName.includes('sound design') || stageName.includes('sequencing'))) {
    triggers.push({
      id: uuidv4(),
      type: 'waveform',
      triggerReason: 'Electronic synthesis stage - craft unique sounds!',
      difficulty: 8,
      rewards: calculateMinigameRewards('waveform', 8)
    });
  }

  // Rock projects with guitar equipment
  if (project.genre === 'Rock' && 
      ownedEquipmentIds.some(id => id.includes('fender') || id.includes('guitar')) &&
      stageName.includes('recording')) {
    triggers.push({
      id: uuidv4(),
      type: 'rhythm',
      triggerReason: 'Rock recording with guitar gear - time to rock out!',
      difficulty: 7,
      rewards: calculateMinigameRewards('rhythm', 7)
    });
  }

  // Pop vocal production
  if (project.genre === 'Pop' && 
      (stageName.includes('vocal') || stageName.includes('production'))) {
    triggers.push({
      id: uuidv4(),
      type: 'vocal',
      triggerReason: 'Pop vocal production - capture that commercial sound!',
      difficulty: 9,
      rewards: calculateMinigameRewards('vocal', 9)
    });
  }

  // Acoustic projects - more likely to use waveform analysis
  if (project.genre === 'Acoustic' && 
      stageName.includes('recording')) {
    triggers.push({
      id: uuidv4(),
      type: 'waveform',
      triggerReason: 'Acoustic recording - capture every nuance!',
      difficulty: 7,
      rewards: calculateMinigameRewards('waveform', 7)
    });
  }

  // EFFECT CHAIN BUILDING - For production stages with effects processing
  if (stageName.includes('production') || stageName.includes('effects') || stageName.includes('processing')) {
    triggers.push({
      id: uuidv4(),
      type: 'effectchain',
      triggerReason: 'Effects processing stage - build the perfect effect chain!',
      difficulty: 8,
      rewards: calculateMinigameRewards('effectchain', 8)
    });
  }

  // INSTRUMENT LAYERING - For arrangement and orchestration stages
  if (stageName.includes('arrangement') || stageName.includes('orchestration') || 
      stageName.includes('layering') || stageName.includes('composition') ||
      (focusAllocation.layering >= 60 && stageName.includes('production'))) {
    triggers.push({
      id: uuidv4(),
      type: 'layering',
      triggerReason: 'Arrangement stage detected - layer instruments for the perfect mix!',
      difficulty: 8,
      rewards: calculateMinigameRewards('layering', 8)
    });
  }

  // Genre-specific layering triggers
  if ((['Electronic', 'Hip-hop'].includes(project.genre) && stageName.includes('production')) ||
      (project.genre === 'Rock' && stageName.includes('overdub')) ||
      (project.genre === 'Pop' && stageName.includes('arrangement'))) {
    triggers.push({
      id: uuidv4(),
      type: 'layering',
      triggerReason: `${project.genre} layering challenge - balance the frequencies!`,
      difficulty: 7,
      rewards: calculateMinigameRewards('layering', 7)
    });
  }

  // High difficulty project fallback
  if (project.difficulty >= 7 && stageProgress >= 0.75 && triggers.length === 0) {
    triggers.push({
      id: uuidv4(),
      type: 'mixing',
      triggerReason: 'High difficulty project nearing completion - master the complex mix!',
      difficulty: 6,
      rewards: calculateMinigameRewards('mixing', 6)
    });
  }

  // Sort by priority (highest first) and return top 3 to avoid overwhelming
  return triggers.sort((a, b) => b.difficulty - a.difficulty).slice(0, 3);
};

export const shouldAutoTriggerMinigame = (
  project: Project,
  gameState: GameState,
  focusAllocation: FocusAllocation,
  workCount: number
): MinigameTrigger | null => { // Simplified return type
  const triggers = getTriggeredMinigames(project, gameState, focusAllocation); // Directly use getTriggeredMinigames
  
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
  const availableTypes = triggers.filter(trigger => trigger.type !== lastMinigameType);
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
  if (isLastStage && selectedTrigger.difficulty >= 9 && (!isEarlyGame || lastWorkSession >= 5)) {
    return selectedTrigger;
  }
  
  // Trigger when stage is 85%+ complete (increased threshold)
  if (stageProgress >= 0.85 && selectedTrigger.difficulty >= 8 && (!isEarlyGame || workCount >= 4)) {
    return selectedTrigger;
  }
  
  // INCREASED intervals to reduce spam - trigger every 4-6 work sessions for high priority minigames
  const highPriorityInterval = isEarlyGame ? 6 : 4;
  if (selectedTrigger.difficulty >= 9 && workCount % highPriorityInterval === 0 && workCount > 0) {
    return selectedTrigger;
  }
  
  // Trigger every 6-8 work sessions for medium priority (much increased interval)
  const mediumPriorityInterval = isEarlyGame ? 8 : 6;
  if (selectedTrigger.difficulty >= 7 && workCount % mediumPriorityInterval === 0 && workCount > 0) {
    return selectedTrigger;
  }

  return null;
};

export interface MinigameResult {
  success: boolean;
  score: number;
  rewards: {
    type: 'quality' | 'efficiency' | 'reputation' | 'money' | 'creativity' | 'technical';
    value: number;
  }[];
}

export const MINIGAME_TYPES = {
  MIXING: 'mixing',
  MASTERING: 'mastering',
  RECORDING: 'recording',
  ARRANGEMENT: 'arrangement',
  VOCAL: 'vocal',
  RHYTHM: 'rhythm',
  WAVEFORM: 'waveform',
  BEATMAKING: 'beatmaking',
  EFFECTCHAIN: 'effectchain',
  LAYERING: 'layering',
} as const;

export const MINIGAME_DIFFICULTY_LEVELS = {
  EASY: 1,
  MEDIUM: 2,
  HARD: 3,
  EXPERT: 4
} as const;

export function getMinigameTrigger(type: string, difficulty: number): MinigameTrigger {
  return {
    id: uuidv4(),
    type: type as MinigameType, // Cast to MinigameType
    difficulty,
    rewards: calculateMinigameRewards(type, difficulty),
    triggerReason: `A ${type} challenge at difficulty ${difficulty}!` // Default reason
  };
}

export function calculateMinigameRewards(type: string, difficulty: number) {
  const baseRewards = {
    [MINIGAME_TYPES.MIXING]: [
      { type: 'quality' as const, value: 10 },
      { type: 'efficiency' as const, value: 5 }
    ],
    [MINIGAME_TYPES.MASTERING]: [
      { type: 'quality' as const, value: 15 },
      { type: 'reputation' as const, value: 5 }
    ],
    [MINIGAME_TYPES.RECORDING]: [
      { type: 'quality' as const, value: 12 },
      { type: 'efficiency' as const, value: 8 }
    ],
    [MINIGAME_TYPES.ARRANGEMENT]: [
      { type: 'quality' as const, value: 8 },
      { type: 'reputation' as const, value: 10 }
    ],
    [MINIGAME_TYPES.VOCAL]: [
      { type: 'quality' as const, value: 10 },
      { type: 'reputation' as const, value: 5 }
    ],
    [MINIGAME_TYPES.RHYTHM]: [
      { type: 'efficiency' as const, value: 10 },
      { type: 'quality' as const, value: 5 }
    ],
    [MINIGAME_TYPES.WAVEFORM]: [
      { type: 'quality' as const, value: 12 },
      { type: 'efficiency' as const, value: 3 }
    ],
    [MINIGAME_TYPES.BEATMAKING]: [
      { type: 'quality' as const, value: 8 },
      { type: 'creativity' as const, value: 5 }
    ],
    [MINIGAME_TYPES.EFFECTCHAIN]: [
      { type: 'quality' as const, value: 15 },
      { type: 'technical' as const, value: 5 }
    ],
    [MINIGAME_TYPES.LAYERING]: [
      { type: 'quality' as const, value: 10 },
      { type: 'efficiency' as const, value: 5 }
    ]
  };

  const rewards = baseRewards[type as keyof typeof baseRewards] || baseRewards[MINIGAME_TYPES.MIXING];
  return rewards.map((reward: { type: 'quality' | 'efficiency' | 'reputation' | 'money' | 'creativity' | 'technical'; value: number }) => ({
    ...reward,
    value: Math.floor(reward.value * (1 + (difficulty - 1) * 0.25))
  }));
}

export function evaluateMinigameResult(
  minigame: MinigameTrigger,
  score: number,
  timeBonus: number
): MinigameResult {
  const success = score >= minigame.difficulty * 25;
  const finalScore = Math.floor(score * (1 + timeBonus));
  
  return {
    success,
    score: finalScore,
    rewards: success ? minigame.rewards.map(reward => ({
      ...reward,
      value: Math.floor(reward.value * (finalScore / 100))
    })) : []
  };
}

export function applyMinigameRewards(gameState: GameState, result: MinigameResult): void {
  if (!result.success) return;

  result.rewards.forEach(reward => {
    switch (reward.type) {
      case 'quality':
        if (gameState.activeProject) {
          const currentStage = gameState.activeProject.stages[gameState.activeProject.currentStageIndex];
          currentStage.qualityMultiplier *= (1 + reward.value / 100);
        }
        break;
      case 'efficiency':
        if (gameState.activeProject) {
          const currentStage = gameState.activeProject.stages[gameState.activeProject.currentStageIndex];
          currentStage.timeMultiplier *= (1 + reward.value / 100);
        }
        break;
      case 'reputation':
        gameState.playerData.reputation += reward.value;
        break;
      case 'money':
        gameState.playerData.money += reward.value;
        break;
      case 'creativity':
        gameState.playerData.attributes.creativity += reward.value;
        break;
      case 'technical':
        gameState.playerData.attributes.technical += reward.value;
        break;
    }
  });
}
