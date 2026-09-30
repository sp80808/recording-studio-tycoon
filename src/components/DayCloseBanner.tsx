import React, { useEffect, useState } from 'react';
import { Moon, X } from 'lucide-react';
import type { DayCloseBeat } from '@/narrative/dayClose';

interface DayCloseBannerProps {
  beat: DayCloseBeat | null;
  /** Hide while a real decision or cutscene is on screen. */
  suppressed?: boolean;
}

/** How long the line stays before fading on its own. Click, tap or Escape dismisses it sooner. */
const VISIBLE_MS = 6500;

const TONE_CLASS: Record<DayCloseBeat['tone'], string> = {
  good: 'text-emerald-200',
  neutral: 'text-stone-200',
  warn: 'text-amber-200',
};

/**
 * End-of-day line. Never a modal, never blocks input: a single quiet line at the bottom of the screen that
 * belongs to the day that just closed. It is keyed by day, so the next day advance replaces it, and dismissing
 * it is remembered only for that day.
 */
export const DayCloseBanner: React.FC<DayCloseBannerProps> = ({ beat, suppressed = false }) => {
  const [dismissedDay, setDismissedDay] = useState<number | null>(null);
  const day = beat?.day ?? null;
  const visible = beat !== null && !suppressed && dismissedDay !== beat.day;

  useEffect(() => {
    if (!visible || day === null) return undefined;
    const timer = window.setTimeout(() => setDismissedDay(day), VISIBLE_MS);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDismissedDay(day);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [visible, day]);

  if (!visible || !beat) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="day-close-banner"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4"
    >
      <div className="pointer-events-auto flex max-w-md items-start gap-2.5 rounded-md border border-stone-700/70 bg-stone-950/90 px-3.5 py-2.5 text-sm shadow-lg">
        <Moon size={14} className="mt-0.5 shrink-0 text-[var(--rst-brass-300)]" aria-hidden="true" />
        <p className={`min-w-0 leading-snug ${TONE_CLASS[beat.tone]}`}>
          <span className="block text-[10px] uppercase tracking-wider text-stone-500">Day {beat.day - 1} closes</span>
          {beat.text}
        </p>
        <button
          type="button"
          onClick={() => setDismissedDay(beat.day)}
          aria-label="Dismiss end-of-day note"
          className="-mr-1 shrink-0 rounded p-1 text-stone-500 hover:text-stone-200 focus-visible:outline focus-visible:outline-1"
        >
          <X size={12} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
