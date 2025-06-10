import { ProjectStage, WorkUnit, StageEvent, MinigameTrigger, StaffMember, MinigameType } from '@/types/game';
import { v4 as uuidv4 } from 'uuid';

/**
 * Adds a work unit to a project stage
 */
export function addWorkUnit(
  stage: ProjectStage,
  type: 'creativity' | 'technical',
  value: number,
  source: 'player' | 'staff',
  sourceId?: string
): WorkUnit {
  return {
    type,
    value,
    source,
    sourceId,
    timestamp: Date.now()
  };
}

/**
 * Calculates the total work progress for a stage
 */
export function calculateStageProgress(stage: ProjectStage): number {
  return Math.min(1, stage.workUnitsCompleted / stage.workUnitsBase);
}

/**
 * Checks and triggers minigames based on stage completion
 */
/**
 * Checks and triggers stage events
 */
export function checkStageEvents(stage: ProjectStage): StageEvent[] {
  return stage.specialEvents.filter(event => {
    // Only trigger if the event is not already active and its condition is met
    if (event.active) return false;
    return event.triggerCondition(stage);
  }).map(event => ({ ...event, active: true })); // Mark event as active once triggered
}

/**
 * Applies focus area bonuses to work units
 */
export function applyFocusBonuses(
  stage: ProjectStage,
  workUnit: WorkUnit
): number {
  let bonusValue = workUnit.value;
  
  // Apply stage bonuses
  if (workUnit.type === 'creativity' && stage.stageBonuses.creativity) {
    bonusValue *= (1 + stage.stageBonuses.creativity * 0.1);
  }
  if (workUnit.type === 'technical' && stage.stageBonuses.technical) {
    bonusValue *= (1 + stage.stageBonuses.technical * 0.1);
  }
  
  return Math.floor(bonusValue);
}

/**
 * Calculates quality score for a stage
 */
export function calculateStageQuality(stage: ProjectStage): number {
  const progress = stage.workUnitsCompleted / stage.workUnitsBase;
  const qualityMultiplier = 1 + (progress * 0.5); // More progress = better quality
  
  // Apply stage bonuses to quality
  const bonusMultiplier = 1 + 
    (stage.stageBonuses.creativity || 0) * 0.1 + 
    (stage.stageBonuses.technical || 0) * 0.1;
  
  return Math.floor(100 * progress * qualityMultiplier * bonusMultiplier);
}

/**
 * Calculates time efficiency for a stage
 */
export function calculateTimeEfficiency(stage: ProjectStage): number {
  const progress = stage.workUnitsCompleted / stage.workUnitsBase;
  const efficiencyMultiplier = 1 + (progress * 0.3); // More progress = better efficiency
  
  // Apply stage bonuses to efficiency
  const bonusMultiplier = 1 + 
    (stage.stageBonuses.technical || 0) * 0.15; // Technical bonuses help efficiency more
  
  return Math.floor(100 * progress * efficiencyMultiplier * bonusMultiplier);
}

export function checkSkillRequirements(stage: ProjectStage, staff: StaffMember): boolean {
  for (const [skill, requiredLevel] of Object.entries(stage.requiredSkills)) {
    const staffSkillLevel = staff.skills[skill] || 0;
    if (staffSkillLevel < (requiredLevel as number)) {
      return false;
    }
  }
  return true;
}

export function checkMinigameTrigger(stage: ProjectStage): MinigameTrigger | null {
  if (!stage.minigameTriggerId) return null;
  
  // Note: In a full implementation, these minigame definitions would likely
  // come from a central data source or utility function, not hardcoded here.
  const minigameDefinitions: Omit<MinigameTrigger, 'id'>[] = [
    {
      type: 'mixing',
      difficulty: 3,
      rewards: [
        { type: 'quality', value: 15 },
        { type: 'efficiency', value: 10 }
      ],
      triggerReason: 'A mixing challenge has been triggered!'
    },
    {
      type: 'mastering',
      difficulty: 4,
      rewards: [
        { type: 'quality', value: 20 },
        { type: 'reputation', value: 5 }
      ],
      triggerReason: 'A mastering challenge awaits!'
    }
    // Add other minigame definitions here as needed
  ];
  
  const definition = minigameDefinitions.find(def => def.type === stage.minigameTriggerId); // Assuming minigameTriggerId stores the type
  
  if (definition) {
    return {
      id: uuidv4(), // Generate a unique ID for this triggered instance
      ...definition
    };
  }

  return null;
}

/**
 * Triggers a special event for a stage, if conditions are met.
 * This function should be called after checking `checkStageEvents`.
 */
export function triggerSpecialEvent(stage: ProjectStage, eventId: string): StageEvent | null {
  const event = stage.specialEvents.find(e => e.id === eventId);
  if (event && !event.active && event.triggerCondition(stage)) {
    event.active = true; // Mark as active to prevent re-triggering
    return event;
  }
  return null;
}

export function applyEventEffects(stage: ProjectStage, event: StageEvent, choiceIndex: number): void {
  const choice = event.choices[choiceIndex];
  if (!choice) return;
  
  choice.effects.forEach(effect => {
    switch (effect.type) {
      case 'quality':
        stage.qualityMultiplier *= (1 + effect.value / 100);
        break;
      case 'efficiency':
        stage.timeMultiplier *= (1 + effect.value / 100);
        break;
      // Other effects are handled by the game state
    }
  });
}
