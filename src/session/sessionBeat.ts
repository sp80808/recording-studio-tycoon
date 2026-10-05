import { worldTargetForIntervention } from './worldSessionActions';
import { CLIENT_ENTER_MS, CLIENT_EXIT_MS } from '@/components/studio/clientDoorTransit';
import type { TakeGrade } from '@/utils/takeFeedback';
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

export type ArtistPresence = 'offsite' | 'entering' | 'present' | 'leaving';

/** Presentation checkpoints the project alone cannot know. All optional: absent = project-only behaviour. */
export interface SessionBeatContext {
  artistPresence?: ArtistPresence;
  /** A take was just locked: the room is listening back. Cleared by the caller after PLAYBACK_HOLD_MS. */
  takeJustLocked?: TakeGrade | null;
}

/** How long the room holds the "listen back" beat after a take is locked. */
export const PLAYBACK_HOLD_MS = 2400;

const PLAYBACK_LINES: Record<TakeGrade, string> = {
  Gold: 'That one rang. Listen back before the next.',
  Silver: 'Tight. Give it a listen.',
  Solid: 'Safe take. Listen for what to push.',
};

/**
 * Where the booked artist is on their way in or out, from wall-clock marks — presentation only.
 * Mirrors the Pixi door transit (enter/exit durations) so the label and the figure agree.
 */
export function artistPresenceAt(opts: {
  sessionStartedAt: number | null;
  sessionEndedAt: number | null;
  now: number;
  reduceMotion?: boolean;
}): ArtistPresence {
  const { sessionStartedAt, sessionEndedAt, now, reduceMotion } = opts;
  if (sessionEndedAt != null) {
    return !reduceMotion && now - sessionEndedAt < CLIENT_EXIT_MS ? 'leaving' : 'offsite';
  }
  if (sessionStartedAt == null) return 'offsite';
  return !reduceMotion && now - sessionStartedAt < CLIENT_ENTER_MS ? 'entering' : 'present';
}

/** Routine beats carry no decision for the player; callers may hide guidance for them once the loop is learned. */
export const isRoutineBeat = (view: SessionBeatView): boolean =>
  ['setup', 'soundcheck', 'recording'].includes(view.beat) && !view.attentionReason;

/** The beat shown while the artist walks out after settlement. The project is already gone from state. */
export function deriveDepartureBeat(project: Pick<Project, 'id' | 'clientName' | 'clientType'>): SessionBeatView {
  return {
    beat: 'departure', projectId: project.id, primaryTarget: 'door',
    label: 'Departure', detail: `${project.clientName || project.clientType || 'The artist'} heads out.`,
  };
}

export function deriveSessionBeat(project: Project, intervention?: SessionIntervention | null, ctx: SessionBeatContext = {}): SessionBeatView {
  if (project.awaitingReview || (project.stages.length > 0 && project.stages.every(stage => stage.completed))) {
    return {
      beat: 'wrap', projectId: project.id, primaryTarget: 'console', primaryAction: 'wrap',
      label: 'Wrap', detail: 'The take is ready for a final listen.', attentionReason: 'Review the take before settlement.',
    };
  }

  if (ctx.artistPresence === 'entering') {
    return {
      beat: 'arrival', projectId: project.id, primaryTarget: 'door',
      label: 'Arrival', detail: `${project.clientName || project.clientType || 'The artist'} is walking in.`,
    };
  }

  if (intervention && intervention.projectId === project.id && intervention.stageIndex === project.currentStageIndex && !project.stages[project.currentStageIndex]?.completed) {
    const target = worldTargetForIntervention(intervention.type);
    return { beat: 'decision', projectId: project.id, primaryTarget: target === 'liveRoom' ? 'mic' : target === 'shelf' ? 'rack' : 'console', primaryAction: 'resolve', label: 'Opportunity', detail: intervention.reason, attentionReason: 'The room is waiting on this call.' };
  }

  if (ctx.takeJustLocked) {
    return {
      beat: 'playback', projectId: project.id, primaryTarget: 'artist', primaryAction: 'record',
      label: 'Playback', detail: PLAYBACK_LINES[ctx.takeJustLocked],
    };
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
