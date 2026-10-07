import React, { useEffect, useState } from 'react';
import type { Project, SessionIntervention } from '@/types/game';
import { deriveSessionBeat } from '@/session/sessionBeat';

interface SessionBeatBannerProps {
  project: Project;
  intervention?: SessionIntervention | null;
}

/** How long a new beat's full card stays open before it folds into a chip (#194: world cues carry the rest). */
export const BEAT_CARD_OPEN_MS = 4_500;

export const SessionBeatBanner: React.FC<SessionBeatBannerProps> = ({ project, intervention }) => {
  const session = deriveSessionBeat(project, intervention);
  const beatKey = `${session.projectId}:${session.beat}:${session.label}`;
  const [compact, setCompact] = useState(false);

  // Each new beat opens the card briefly, then it folds away so the studio stays the focus.
  useEffect(() => {
    setCompact(false);
    const timer = window.setTimeout(() => setCompact(true), BEAT_CARD_OPEN_MS);
    return () => window.clearTimeout(timer);
  }, [beatKey]);

  return (
    <div
      className={`pointer-events-none absolute left-3 top-[96px] z-10 max-w-[min(25rem,calc(100%-2rem))] rounded-md border border-amber-200/25 bg-stone-950/80 text-stone-100 shadow-lg backdrop-blur-sm transition-[padding,opacity] duration-300 motion-reduce:transition-none ${compact ? 'px-2 py-1 opacity-80' : 'px-3 py-2'}`}
      role="status"
      aria-live="polite"
      data-testid="session-beat"
      data-rst-session-beat={session.beat}
      data-rst-session-beat-compact={compact}
    >
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200/80">
        <span className="size-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.9)]" aria-hidden="true" />
        {compact ? (
          <span>{session.label}</span>
        ) : (
          <>
            <span>Session beat</span>
            <span className="text-stone-500">·</span>
            <span>{session.beat}</span>
          </>
        )}
      </div>
      {!compact && (
        <>
          <p className="mt-1 text-sm font-semibold">{session.label}</p>
          <p className="text-xs text-stone-300">{session.detail}</p>
        </>
      )}
    </div>
  );
};

export default SessionBeatBanner;
