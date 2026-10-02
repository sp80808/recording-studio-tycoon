import React from 'react';
import type { Project } from '@/types/game';

type SessionBeat = 'arrival' | 'setup' | 'soundcheck' | 'recording' | 'playback' | 'decision' | 'wrap';

interface SessionBeatBannerProps {
  project: Project;
}

function getSessionBeat(project: Project): { beat: SessionBeat; label: string; detail: string } {
  if (project.awaitingReview) return { beat: 'wrap', label: 'Wrap', detail: 'The take is ready for a final listen.' };

  const stage = project.stages?.[project.currentStageIndex ?? 0];
  const stageName = stage?.stageName?.toLowerCase() ?? '';
  const progress = stage ? stage.workUnitsCompleted / Math.max(1, stage.workUnitsBase) : 0;

  if (stageName.includes('master')) return { beat: 'playback', label: 'Playback', detail: 'Check the final balance before release.' };
  if (stageName.includes('mix')) return { beat: progress > 0.7 ? 'playback' : 'decision', label: progress > 0.7 ? 'Playback' : 'Decision', detail: progress > 0.7 ? 'Listen for the room and lock the balance.' : 'A mix choice is waiting at the console.' };
  if (stageName.includes('record') || stageName.includes('track')) return { beat: progress > 0 ? 'recording' : 'soundcheck', label: progress > 0 ? 'Recording' : 'Soundcheck', detail: progress > 0 ? 'The room is capturing takes.' : 'Set levels, then roll the room.' };
  return { beat: 'setup', label: 'Setup', detail: 'Get the room and crew ready for the next beat.' };
}

export const SessionBeatBanner: React.FC<SessionBeatBannerProps> = ({ project }) => {
  const session = getSessionBeat(project);

  return (
    <div className="pointer-events-none absolute left-4 top-4 z-10 max-w-[min(25rem,calc(100%-2rem))] rounded-md border border-amber-200/25 bg-stone-950/80 px-3 py-2 text-stone-100 shadow-lg backdrop-blur-sm" role="status" aria-live="polite" data-testid="session-beat">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200/80">
        <span className="size-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.9)]" aria-hidden="true" />
        <span>Session beat</span>
        <span className="text-stone-500">·</span>
        <span>{session.beat}</span>
      </div>
      <p className="mt-1 text-sm font-semibold">{session.label}</p>
      <p className="text-xs text-stone-300">{session.detail}</p>
    </div>
  );
};

export default SessionBeatBanner;
