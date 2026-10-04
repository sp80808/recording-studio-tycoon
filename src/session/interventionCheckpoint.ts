import type { GameState, Project, SessionIntervention } from '@/types/game';
import { shouldAutoTriggerMinigame } from '@/utils/minigameUtils';
import { createSeededRandom } from '@/simulation/seededRandom';

/** Foreground Project owns intervention metadata; preserve every other mirror field. */
export function mirrorInterventionState(primary: Project, mirror: Project): Project {
  if (primary.id !== mirror.id ||
      (JSON.stringify(primary.interventionCheckpoint) === JSON.stringify(mirror.interventionCheckpoint) &&
       JSON.stringify(primary.resolvedInterventionStageKeys) === JSON.stringify(mirror.resolvedInterventionStageKeys))) return mirror;
  return { ...mirror, interventionCheckpoint: primary.interventionCheckpoint, resolvedInterventionStageKeys: primary.resolvedInterventionStageKeys };
}

export function currentIntervention(project: Project | null, now: number): SessionIntervention | null {
  const pending = project?.interventionCheckpoint?.pending;
  if (!project || !pending || project.awaitingReview || pending.projectId !== project.id ||
      pending.stageIndex !== project.currentStageIndex || pending.expiresAt <= now ||
      project.stages[project.currentStageIndex]?.completed ||
      (project.resolvedInterventionStageKeys ?? []).includes(`${project.id}-${pending.stageIndex}`)) return null;
  return pending;
}

/** Resolution is idempotent and cannot consume a different pending choice. */
export function resolveIntervention(project: Project, opportunityId: string): Project {
  const checkpoint = project.interventionCheckpoint;
  const pending = checkpoint?.pending;
  if (!checkpoint || !pending || pending.id !== opportunityId) return project;
  const resolved = new Set(project.resolvedInterventionStageKeys ?? []);
  if (pending.projectId === project.id) resolved.add(`${project.id}-${pending.stageIndex}`);
  return { ...project, interventionCheckpoint: { ...checkpoint, pending: null }, resolvedInterventionStageKeys: [...resolved] };
}

/** Claim and resolve in the same authoritative update that applies a reward. */
export function claimInterventionReward(project: Project, opportunityId: string, now: number): Project | null {
  if (currentIntervention(project, now)?.id !== opportunityId) return null;
  return resolveIntervention(project, opportunityId);
}

/** Persist both the examined bucket and any pending choice, without applying rewards. */
export function advanceInterventionCheckpoint(project: Project, state: GameState, now: number): Project {
  const pending = project.interventionCheckpoint?.pending;
  if (pending) {
    if (currentIntervention(project, now)) return project;
    return resolveIntervention(project, pending.id);
  }
  const stage = project.stages[project.currentStageIndex];
  if (!stage || stage.completed || project.awaitingReview ||
      (project.resolvedInterventionStageKeys ?? []).includes(`${project.id}-${project.currentStageIndex}`)) return project;
  const bucket = Math.floor(project.workSessionCount || 0);
  const checkpoint = project.interventionCheckpoint;
  if (bucket <= 0 || (checkpoint?.stageIndex === project.currentStageIndex && checkpoint.workBucket >= bucket)) return project;
  const trigger = shouldAutoTriggerMinigame(project, state,
    project.focusAllocation || { performance: 33, soundCapture: 33, layering: 34 }, bucket,
    createSeededRandom(`${project.id}:intervention:${project.currentStageIndex}:${bucket}`));
  return { ...project, interventionCheckpoint: {
    stageIndex: project.currentStageIndex,
    workBucket: bucket,
    pending: trigger ? {
      id: `intervention-${project.id}-${project.currentStageIndex}-${bucket}`,
      projectId: project.id,
      stageIndex: project.currentStageIndex,
      type: trigger.minigameType,
      reason: trigger.triggerReason,
      priority: trigger.priority,
      expiresAt: now + 90_000,
    } : null,
  } };
}
