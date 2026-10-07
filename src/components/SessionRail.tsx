import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ChevronRight, CircleDot, Headphones, Users } from 'lucide-react';
import type { GameState } from '@/types/game';
import { getBookedStudioRoom, inferProjectStageKind } from '@/utils/studioRoomUtils';

const kindAccent: Record<string, string> = {
  tracking: '#f0776b',
  mixing: '#5fd0c0',
  mastering: '#c4a1f0',
  production: '#e6b866',
};

interface SessionRailProps {
  gameState: GameState;
  onOpenSession: () => void;
  onOpenBookings: () => void;
}

/**
 * Persistent compact active-session state (GH #41).
 * Room, client, stage, progress, assigned staff and issue indicator —
 * one tap reaches the console. Studio-native language, no emoji.
 */
export const SessionRail: React.FC<SessionRailProps> = ({ gameState, onOpenSession, onOpenBookings }) => {
  const { t } = useTranslation();
  const project = gameState.activeProject;

  // Idle state: the bottom "Book a session" button is the single route to enquiries (it carries the waiting count).
  if (!project) return null;

  const room = getBookedStudioRoom(gameState, project)?.name ?? t('home_main_room');
  const stages = project.stages ?? [];
  const idx = Math.max(0, Math.min(project.currentStageIndex ?? 0, Math.max(0, stages.length - 1)));
  const done = stages.filter((s) => s.completed).length;
  const current = stages[idx];
  const frac = current ? Math.min(1, current.workUnitsCompleted / Math.max(1, current.workUnitsBase)) : 0;
  const progress = stages.length > 0 ? (done + frac) / stages.length : 0;
  const kind = inferProjectStageKind(project);
  const accent = kindAccent[kind] ?? '#e6b866';
  const staff = gameState.hiredStaff.filter((s) => s.assignedProjectId === project.id);
  const staffLabel =
    staff.length === 0 ? t('home_solo_session') : staff.length <= 2 ? staff.map((s) => s.name).join(' · ') : `${staff[0].name} +${staff.length - 1}`;
  const issues = project.unresolvedIssues?.length ?? 0;
  const awaitingReview = Boolean(project.awaitingReview);
  const dailyLeft = gameState.playerData?.dailyWorkCapacity ?? 0;

  return (
    <button
      type="button"
      onClick={onOpenSession}
      className="studio-play-status session-rail-live"
      role="status"
      aria-live="polite"
      data-testid="session-rail"
      aria-label={`Active session: ${project.clientName ?? project.title}, stage ${idx + 1} of ${stages.length}. ${Math.round(progress * 100)} percent complete.${issues > 0 ? ` ${issues} open issues.` : ''}${awaitingReview ? ' Ready to collect release.' : ''}`}
      title="Open session"
    >
      <span className="session-rail-rec" aria-hidden="true" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate font-semibold">
          {project.clientName ?? project.title}
          <span className="session-rail-room"> · {room}</span>
        </span>
        <span className="session-rail-sub">
          <Headphones size={11} aria-hidden="true" />
          <span className="truncate">
            {t('home_stage_progress', { n: idx + 1, total: Math.max(1, stages.length) })}{current ? ` · ${current.stageName}` : ''}
          </span>
          <span aria-hidden="true">·</span>
          <Users size={11} aria-hidden="true" />
          <span className="truncate">{staffLabel}</span>
        </span>
        <span className="session-rail-progress" aria-hidden="true">
          <i style={{ width: `${Math.round(progress * 100)}%`, background: accent }} />
        </span>
      </span>
      {awaitingReview ? (
        <span className="session-rail-flag session-rail-flag--ready">
          <CircleDot size={12} aria-hidden="true" />
          <span>{t('home_review')}</span>
        </span>
      ) : issues > 0 ? (
        <span className="session-rail-flag session-rail-flag--issues">
          <AlertTriangle size={12} aria-hidden="true" />
          <span>{issues}</span>
        </span>
      ) : (
        <span className="shrink-0 text-amber-200/90">{dailyLeft} left</span>
      )}
    </button>
  );
};

export default SessionRail;
