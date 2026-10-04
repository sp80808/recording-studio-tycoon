import type { StudioHotspotId } from '@/components/WebGLCanvas';
import type { MinigameType } from '@/components/minigames/MinigameManager';
import type { GameState } from '@/types/game';

export interface WorldSessionActionDescriptor {
  actionId: string;
  worldTarget: StudioHotspotId;
  label: string;
  enabled: boolean;
  disabledReason?: string;
}

export interface WorldInterventionOpportunity {
  id: string;
  projectId: string;
  stageIndex: number;
  type: MinigameType;
  reason: string;
}

type SessionActionState = Pick<GameState, 'activeProject' | 'availableProjects'>;

const LIVE_ROOM_INTERVENTIONS = new Set<MinigameType>([
  'rhythm',
  'vocal',
  'acoustic',
  'layering',
  'vocal-tuning',
  'live-recording',
  'punch-in',
  'vocal-comp',
  'lyric-focus',
]);

const GEAR_INTERVENTIONS = new Set<MinigameType>([
  'waveform',
  'effectchain',
  'maintenance',
  'tape-jog',
  'tape-splicing',
  'sampling',
  'fault-hunt',
]);

/** Physical owner for an existing optional intervention. No gameplay state is inferred here. */
export function worldTargetForIntervention(type: MinigameType): StudioHotspotId {
  if (LIVE_ROOM_INTERVENTIONS.has(type)) return 'liveRoom';
  if (GEAR_INTERVENTIONS.has(type)) return 'shelf';
  return 'console';
}

export function describePhoneAnswerAction(state: SessionActionState): WorldSessionActionDescriptor {
  if (state.activeProject) {
    return {
      actionId: 'phone:answer',
      worldTarget: 'phone',
      label: 'Answer enquiry',
      enabled: false,
      disabledReason: 'Finish the live session before booking another artist.',
    };
  }

  const waiting = state.availableProjects.length;
  return {
    actionId: 'phone:answer',
    worldTarget: 'phone',
    label: waiting === 1 ? 'Answer enquiry' : `Answer ${waiting} enquiries`,
    enabled: waiting > 0,
    disabledReason: waiting > 0 ? undefined : 'No enquiries are waiting.',
  };
}

export function describeConsoleSessionAction(state: SessionActionState): WorldSessionActionDescriptor {
  const project = state.activeProject;
  if (!project) {
    return {
      actionId: 'console:open-session',
      worldTarget: 'console',
      label: 'Open session',
      enabled: false,
      disabledReason: 'Book an artist from the studio phone first.',
    };
  }

  if (project.awaitingReview) {
    return {
      actionId: 'console:review',
      worldTarget: 'console',
      label: 'Review & release',
      enabled: true,
    };
  }

  const stage = project.stages?.[project.currentStageIndex ?? 0];
  const allWorkDone = project.stages?.length > 0 && project.stages.every(candidate => candidate.completed);
  if (!stage || stage.completed || allWorkDone) {
    return {
      actionId: 'console:record',
      worldTarget: 'console',
      label: 'Record at console',
      enabled: false,
      disabledReason: 'The current session stage is complete.',
    };
  }

  return {
    actionId: 'console:record',
    worldTarget: 'console',
    label: stage.workUnitsCompleted > 0 ? 'Continue recording' : 'Record at console',
    enabled: true,
  };
}

export function describeWorldInterventionAction(
  state: SessionActionState,
  opportunity: WorldInterventionOpportunity,
): WorldSessionActionDescriptor {
  const project = state.activeProject;
  const descriptor: WorldSessionActionDescriptor = {
    actionId: `intervention:${opportunity.id}`,
    worldTarget: worldTargetForIntervention(opportunity.type),
    label: opportunity.reason,
    enabled: true,
  };

  if (!project) {
    return { ...descriptor, enabled: false, disabledReason: 'No live session can receive this intervention.' };
  }
  if (project.id !== opportunity.projectId || project.currentStageIndex !== opportunity.stageIndex) {
    return { ...descriptor, enabled: false, disabledReason: 'This intervention belongs to another session stage.' };
  }

  const stage = project.stages?.[project.currentStageIndex ?? 0];
  if (!stage || stage.completed || project.awaitingReview) {
    return { ...descriptor, enabled: false, disabledReason: 'The current session stage is complete.' };
  }
  return descriptor;
}
