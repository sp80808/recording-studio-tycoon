import { ProjectStage, WorkUnit, StageEvent, MinigameTrigger, StaffMember, MinigameType, PlayerData, FocusAllocation } from '@/types/game'; // Added PlayerData, FocusAllocation
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
  if (!stage.specialEvents) return []; // Handle optional specialEvents
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
  if (workUnit.type === 'creativity' && stage.stageBonuses?.creativity) { // Handle optional stageBonuses
    bonusValue *= (1 + stage.stageBonuses.creativity * 0.1);
  }
  if (workUnit.type === 'technical' && stage.stageBonuses?.technical) { // Handle optional stageBonuses
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
    (stage.stageBonuses?.creativity || 0) * 0.1 +  // Handle optional stageBonuses
    (stage.stageBonuses?.technical || 0) * 0.1; // Handle optional stageBonuses
  
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
    (stage.stageBonuses?.technical || 0) * 0.15; // Handle optional stageBonuses
  
  return Math.floor(100 * progress * efficiencyMultiplier * bonusMultiplier);
}

export function checkSkillRequirements(stage: ProjectStage, staff: StaffMember): boolean {
  if (!stage.requiredSkills) return true; // If no skills required, always true
  for (const [skill, requiredLevel] of Object.entries(stage.requiredSkills)) {
    const staffSkillLevel = staff.skills?.[skill]?.level || 0; // Handle optional staff.skills
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
  if (!stage.specialEvents) return null; // Handle optional specialEvents
  const event = stage.specialEvents.find(e => e.id === eventId);
  if (event && !event.active && event.triggerCondition(stage)) {
    event.active = true; // Mark as active to prevent re-triggering
    return event;
  }
  return null;
}

export function applyEventEffects(stage: ProjectStage, event: StageEvent, choiceIndex: number): void {
  if (!event.choices) return; // Handle optional choices
  const choice = event.choices[choiceIndex];
  if (!choice) return;
  
  choice.effects.forEach(effect => {
    switch (effect.type) {
      case 'quality':
        stage.qualityMultiplier = (stage.qualityMultiplier || 1) * (1 + effect.value / 100); // Handle optional
        break;
      case 'efficiency':
        stage.timeMultiplier = (stage.timeMultiplier || 1) * (1 + effect.value / 100); // Handle optional
        break;
      // Other effects are handled by the game state
    }
  });
}

/**
 * Calculates the work units gained from a work session.
 */
export function calculateWorkUnitsGained(
  playerData: PlayerData,
  focusAllocation: FocusAllocation,
  currentStage: ProjectStage,
  assignedStaff: StaffMember[]
): { creativityGained: number; technicalGained: number } {
  const baseCreativity = playerData.dailyWorkCapacity * playerData.attributes.creativeIntuition;
  const baseTechnical = playerData.attributes.technicalAptitude;

  let creativityGain = Math.floor(
    baseCreativity * (focusAllocation.performance / 100) * 0.8 +
    baseCreativity * (focusAllocation.layering / 100) * 0.6
  );
  let technicalGain = Math.floor(
    baseTechnical * (focusAllocation.soundCapture / 100) * 0.8 +
    baseTechnical * (focusAllocation.layering / 100) * 0.4
  );

  // Apply staff bonuses
  assignedStaff.forEach(staff => {
    if (staff.status === 'Working' && staff.energy > 0) {
      creativityGain += Math.floor(staff.primaryStats.creativity * 0.5);
      technicalGain += Math.floor(staff.primaryStats.technical * 0.5);
      // Reduce staff energy
      staff.energy = Math.max(0, staff.energy - 10); // Example: 10 energy per work session
    }
  });

  // Apply stage bonuses (if any)
  // Assuming stage.stageBonuses exists and has creativity/technical properties
  // if (currentStage.stageBonuses?.creativity) {
  //   creativityGain *= (1 + currentStage.stageBonuses.creativity / 100);
  // }
  // if (currentStage.stageBonuses?.technical) {
  //   technicalGain *= (1 + currentStage.stageBonuses.technical / 100);
  // }

  return { creativityGained: creativityGain, technicalGained: technicalGain };
}
