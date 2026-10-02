import type { Project } from '@/types/game';

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

export function deriveSessionBeat(project: Project): SessionBeatView {
  if (project.awaitingReview) {
    return {
      beat: 'wrap', projectId: project.id, primaryTarget: 'console', primaryAction: 'wrap',
      label: 'Wrap', detail: 'The take is ready for a final listen.', attentionReason: 'Review the take before settlement.',
    };
  }

  const stage = project.stages?.[project.currentStageIndex ?? 0];
  const stageName = stage?.stageName?.toLowerCase() ?? '';
  const progress = stage ? stage.workUnitsCompleted / Math.max(1, stage.workUnitsBase) : 0;

  if (stageName.includes('master')) {
    return { beat: 'playback', projectId: project.id, primaryTarget: 'console', primaryAction: 'playback', label: 'Playback', detail: 'Check the final balance before release.' };
  }
  if (stageName.includes('mix')) {
    const playback = progress > 0.7;
    return {
      beat: playback ? 'playback' : 'decision', projectId: project.id,
      primaryTarget: 'console', primaryAction: playback ? 'playback' : 'resolve',
      secondaryActions: playback ? ['lock'] : ['playback'],
      label: playback ? 'Playback' : 'Decision',
      detail: playback ? 'Listen for the room and lock the balance.' : 'A mix choice is waiting at the console.',
    };
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
  return {
    beat: 'setup', projectId: project.id, primaryTarget: 'engineer', primaryAction: 'assign',
    label: 'Setup', detail: 'Get the room and crew ready for the next beat.',
  };
}
