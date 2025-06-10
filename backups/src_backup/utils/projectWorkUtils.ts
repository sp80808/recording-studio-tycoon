import { GameState, ProjectStage, WorkUnit, StageEvent, MinigameTrigger } from '@/types/game';
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
  const workUnit: WorkUnit = {
    id: uuidv4(),
    type,
    value,
    source,
    sourceId,
    timestamp: Date.now()
  };

  stage.workUnits.push(workUnit);
  stage.workUnitsCompleted += value;

  return workUnit;
}

/**
 * Calculates the total work progress for a stage
 */
export function calculateStageProgress(stage: ProjectStage): number {
  return Math.min(1, stage.workUnitsCompleted / stage.workUnitsRequired);
}

/**
 * Checks and triggers minigames based on stage completion
 */
export function checkMinigameTriggers(stage: ProjectStage): MinigameTrigger[] {
  if (stage.minigameTriggerId && calculateStageProgress(stage) >= 1) {
    const trigger = availableMinigames.find(minigame => minigame.id === stage.minigameTriggerId);
    if (trigger) return [trigger];
  }
  return [];
}

/**
 * Checks and triggers stage events
 */
export function checkStageEvents(stage: ProjectStage): StageEvent[] {
  return stage.specialEvents.filter(event => {
    if (event.active) return false;
    return event.triggerCondition(stage);
  });
}

/**
 * Applies focus area bonuses to work units
 */
export function applyFocusBonuses(
  stage: ProjectStage,
  workUnit: WorkUnit
): number {
  const relevantFocusAreas = stage.focusAreas.filter(area => {
    if (workUnit.type === 'creativity') {
      return area.name.toLowerCase().includes('creative') || 
             area.name.toLowerCase().includes('arrangement');
    }
    return area.name.toLowerCase().includes('technical') || 
           area.name.toLowerCase().includes('quality');
  });

  const totalBonus = relevantFocusAreas.reduce((sum, area) => {
    return sum + (area.allocation / 100) * area.bonusMultiplier;
  }, 1);

  return workUnit.value * totalBonus;
}

/**
 * Calculates quality score for a stage
 */
export function calculateStageQuality(stage: ProjectStage): number {
  const workUnitsByType = stage.workUnits.reduce((acc, unit) => {
    acc[unit.type] = (acc[unit.type] || 0) + unit.value;
    return acc;
  }, {} as Record<string, number>);

  const creativityScore = workUnitsByType.creativity || 0;
  const technicalScore = workUnitsByType.technical || 0;

  // Balance between creativity and technical work
  const balance = Math.min(creativityScore, technicalScore) / Math.max(creativityScore, technicalScore);
  
  // Apply stage quality multiplier
  const baseQuality = (creativityScore + technicalScore) / stage.workUnitsRequired;
  return baseQuality * balance * stage.qualityMultiplier;
}

/**
 * Calculates time efficiency for a stage
 */
export function calculateTimeEfficiency(stage: ProjectStage): number {
  const totalWorkUnits = stage.workUnits.length;
  if (totalWorkUnits === 0) return 1;

  const timeSpan = stage.workUnits[totalWorkUnits - 1].timestamp - stage.workUnits[0].timestamp;
  const expectedTime = stage.workUnitsRequired * 1000; // Assuming 1 work unit = 1 second

  return Math.min(1, expectedTime / timeSpan) * stage.timeMultiplier;
}
