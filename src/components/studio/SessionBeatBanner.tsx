import React from 'react';
import type { Project, SessionIntervention } from '@/types/game';
import { deriveSessionBeat } from '@/session/sessionBeat';

interface SessionBeatBannerProps {
  project: Project;
  intervention?: SessionIntervention | null;
}

export const SessionBeatBanner: React.FC<SessionBeatBannerProps> = ({ project, intervention }) => {
  const session = deriveSessionBeat(project, intervention);

  return (
    <div className="pointer-events-none absolute left-3 top-[96px] z-10 max-w-[min(25rem,calc(100%-2rem))] rounded-md border border-amber-200/25 bg-stone-950/80 px-3 py-2 text-stone-100 shadow-lg backdrop-blur-sm" role="status" aria-live="polite" data-testid="session-beat" data-rst-session-beat={session.beat}>
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
