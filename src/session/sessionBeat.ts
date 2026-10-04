import { worldTargetForIntervention } from './worldSessionActions';
import type { Project, SessionIntervention } from '@/types/game';

export type SessionBeat =
  | 'arrival'
  | 'setup'
  | 'soundcheck'
  | 'recording'
  | 'playback'
  | 'decision'
  | 'wrap'
  | 'departure';

export type SessionVerb =
  | 'admit'
  | 'assign'
  | 'soundcheck'
  | 'record'
  | 'playback'
  | 'resolve'
  | 'lock'
  | 'wrap';

export type SessionTarget = 'door' | 'artist' | 'engineer' | 'console' | 'mic' | 'rack';

export interface SessionBeatView {
  beat: SessionBeat;
  projectId: string;
  primaryTarget: SessionTarget;
  primaryAction?: SessionVerb;
  secondaryActions?: SessionVerb[];
  attentionReason?: string;
  label: string;
  detail: string;
}

export function deriveSessionBeat(project: Project, intervention?: SessionIntervention | null): SessionBeatView {
  if (project.awaitingReview || (project.stages.length > 0 && project.stages.every(stage => stage.completed))) {
    return {
      beat: 'wrap', projectId: project.id, primaryTarget: 'console', primaryAction: 'wrap',
      label: 'Wrap', detail: 'The take is ready for a final listen.', attentionReason: 'Review the take before settlement.',
    };
  }

  if (intervention && intervention.projectId === project.id && intervention.stageIndex === project.currentStageIndex && !project.stages[project.currentStageIndex]?.completed) {
    const target = worldTargetForIntervention(intervention.type);
    return { beat: 'decision', projectId: project.id, primaryTarget: target === 'liveRoom' ? 'mic' : target === 'shelf' ? 'rack' : 'console', primaryAction: 'resolve', label: 'Opportunity', detail: intervention.reason };
  }

  const stage = project.stages?.[project.currentStageIndex ?? 0];
  const stageName = stage?.stageName?.toLowerCase() ?? '';
  const progress = stage ? stage.workUnitsCompleted / Math.max(1, stage.workUnitsBase) : 0;

  if (progress > 0 && stageName.includes('master')) {
    return { beat: 'playback', projectId: project.id, primaryTarget: 'console', primaryAction: 'playback', label: 'Playback', detail: 'Check the final balance before release.' };
  }
  if (progress > 0 && stageName.includes('mix')) {
    return { beat: 'playback', projectId: project.id, primaryTarget: 'console', primaryAction: 'playback', secondaryActions: ['lock'], label: 'Playback', detail: 'Listen for the room and lock the balance.' };
  }
  if (stageName.includes('record') || stageName.includes('track')) {
    const recording = progress > 0;
    return {
      beat: recording ? 'recording' : 'soundcheck', projectId: project.id,
      primaryTarget: recording ? 'mic' : 'console', primaryAction: recording ? 'lock' : 'soundcheck',
      label: recording ? 'Recording' : 'Soundcheck',
      detail: recording ? 'The room is capturing takes.' : 'Set levels, then roll the room.',
    };
  }
  if (progress > 0) {
    const performerOwned = /vocal|performance|live|instrument/.test(stageName);
    return {
      beat: 'recording', projectId: project.id,
      primaryTarget: performerOwned ? 'mic' : 'console', primaryAction: 'lock',
      label: 'Recording',
      detail: stage?.stageName ? `${stage.stageName} is under way. Listen, then lock the take.` : 'The session is under way. Listen, then lock the take.',
    };
  }
  return {
    beat: 'setup', projectId: project.id, primaryTarget: 'engineer', primaryAction: 'assign',
    label: 'Setup', detail: 'Get the room and crew ready for the next beat.',
  };
}
