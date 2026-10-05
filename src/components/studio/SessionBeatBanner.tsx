import React, { useEffect, useRef, useState } from 'react';
import type { Project, SessionIntervention } from '@/types/game';
import {
  PLAYBACK_HOLD_MS,
  artistPresenceAt,
  deriveDepartureBeat,
  deriveSessionBeat,
  isRoutineBeat,
} from '@/session/sessionBeat';
import { TAKE_FEEDBACK_EVENT, type TakeFeedbackDetail, type TakeGrade } from '@/utils/takeFeedback';

interface SessionBeatBannerProps {
  /** Live project, or null between sessions (the banner stays mounted to show the artist leaving). */
  project: Project | null;
  intervention?: SessionIntervention | null;
  /** While false, routine beats (setup / soundcheck / recording) stay quiet; moments that need the player still show. */
  showRoutine?: boolean;
}

const hasWorkStarted = (p: Project) => p.stages.some(s => s.workUnitsCompleted > 0);
const prefersReducedMotion = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Compact session guidance over the studio. Presentation only: it derives the beat from authoritative project
 * state plus three transient checkpoints (artist walking in, a take just locked, artist walking out) and never
 * writes anything back. It is guidance, not chrome — routine beats can be hidden once the loop is learned.
 */
export const SessionBeatBanner: React.FC<SessionBeatBannerProps> = ({ project, intervention, showRoutine = true }) => {
  const [now, setNow] = useState(() => performance.now());
  const [marks, setMarks] = useState<{ id: string; start: number | null; end: number | null; project: Project | null }>({
    id: '', start: null, end: null, project: null,
  });
  const [take, setTake] = useState<{ at: number; grade: TakeGrade } | null>(null);

  // Session edges: remember when this project appeared (unless resumed mid-work) and when it left.
  useEffect(() => {
    const t = performance.now();
    setMarks(prev => {
      if (project) {
        if (prev.id === project.id && prev.end == null) return { ...prev, project };
        return { id: project.id, start: hasWorkStarted(project) ? t - 10_000 : t, end: null, project };
      }
      if (prev.project && prev.end == null) return { ...prev, end: t };
      return prev;
    });
  }, [project]);

  useEffect(() => {
    const onTake = (e: Event) => {
      const detail = (e as CustomEvent<TakeFeedbackDetail>).detail;
      if (detail) setTake({ at: performance.now(), grade: detail.grade });
    };
    window.addEventListener(TAKE_FEEDBACK_EVENT, onTake);
    return () => window.removeEventListener(TAKE_FEEDBACK_EVENT, onTake);
  }, []);

  // Tick only while a transient window can still close.
  const reduceMotion = prefersReducedMotion();
  const presence = artistPresenceAt({ sessionStartedAt: marks.start, sessionEndedAt: marks.end, now, reduceMotion });
  const takeActive = take != null && now - take.at < PLAYBACK_HOLD_MS;
  const transient = presence === 'entering' || presence === 'leaving' || takeActive;
  useEffect(() => {
    if (!transient) return;
    const id = window.setInterval(() => setNow(performance.now()), 150);
    return () => window.clearInterval(id);
  }, [transient]);
  useEffect(() => { setNow(performance.now()); }, [project, take]);

  const view = project
    ? deriveSessionBeat(project, intervention, { artistPresence: presence, takeJustLocked: takeActive ? take!.grade : null })
    : presence === 'leaving' && marks.project
      ? deriveDepartureBeat(marks.project)
      : null;

  if (!view || (!showRoutine && isRoutineBeat(view))) return null;
  const urgent = Boolean(view.attentionReason);

  return (
    <div
      className="pointer-events-none absolute left-3 top-[96px] z-10 max-w-[min(23rem,calc(100%-2rem))] rounded-xl border bg-[rgba(24,20,16,0.82)] px-3 py-2 text-[var(--rst-ivory)] backdrop-blur-sm"
      style={{ borderColor: urgent ? 'var(--rst-brass-400)' : 'var(--rst-line-strong)' }}
      role="status"
      aria-live="polite"
      data-testid="session-beat"
      data-rst-session-beat={view.beat}
    >
      <div className="rst-kicker flex items-center gap-2 !text-[10px]">
        <span className={`size-1.5 rounded-full bg-[var(--rst-brass-400)] ${urgent ? 'motion-safe:animate-pulse' : ''}`} aria-hidden="true" />
        <span>Session</span>
        <span className="text-stone-500" aria-hidden="true">·</span>
        <span>{view.label}</span>
      </div>
      <p className="mt-1 text-sm leading-snug text-[var(--rst-ivory-soft)]">{view.detail}</p>
    </div>
  );
};

export default SessionBeatBanner;
