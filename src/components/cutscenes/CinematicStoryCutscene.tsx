import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { CareerCutsceneChoice } from './careerCutscenes';

interface Payload {
  title: string;
  loreBrief?: string;
  chapter?: string;
  /** Small label above the title ("Career moment", "A new act", "Epilogue"). */
  kicker?: string;
  speaker?: string;
  speakerTitle?: string;
  speakerInitials?: string;
  /** Portrait ring / accent colour (hex). Defaults to brass. */
  accent?: string;
  location?: string;
  lines?: string[];
  choices?: CareerCutsceneChoice[];
  /** Optional recap chips shown on the final beat (epilogue). */
  stats?: Array<{ label: string; value: string }>;
  /** Label of the last button when there are no choices. */
  finalLabel?: string;
}

interface Props {
  payload: Payload;
  onComplete: (choice?: CareerCutsceneChoice) => void;
}

const initialsFrom = (name?: string) =>
  (name ?? '?')
    .replace(/^Dr\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

/**
 * Full-screen story beat: act openings, rival encounters and the campaign epilogue.
 * Flat ink surface, hairline borders, one accent colour taken from the speaker — flat, no layered panels.
 */
export function CinematicStoryCutscene({ payload, onComplete }: Props) {
  const reduceMotion = useReducedMotion();
  const [lineIndex, setLineIndex] = useState(0);
  const continueRef = useRef<HTMLButtonElement>(null);
  const lines = payload.lines?.length ? payload.lines : [payload.loreBrief ?? 'A new chapter begins.'];
  const hasChoices = Boolean(payload.choices?.length);
  const showingChoice = hasChoices && lineIndex >= lines.length;
  const lastLine = lineIndex === lines.length - 1;
  const accent = payload.accent ?? '#e6b866';
  const advance = useCallback(
    () => setLineIndex((index) => Math.min(index + 1, hasChoices ? lines.length : lines.length - 1)),
    [lines.length, hasChoices],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onComplete();
        return;
      }
      if (showingChoice || !['Enter', ' '].includes(e.key)) return;
      e.preventDefault();
      if (lastLine && !hasChoices) onComplete();
      else advance();
    };
    window.addEventListener('keydown', onKey);
    continueRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [advance, onComplete, showingChoice, lastLine, hasChoices]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="story-cutscene-title"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.35 }}
      className="fixed inset-0 z-[240] flex items-center justify-center bg-[#0a0907]/95 p-4 sm:p-8"
      onMouseDown={(event) => event.target === event.currentTarget && onComplete()}
    >
      <motion.section
        initial={reduceMotion ? false : { y: 18, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        className="rst-surface grid max-h-[92dvh] w-full max-w-4xl overflow-y-auto md:grid-cols-[16rem_1fr]"
      >
        <aside className="flex flex-col justify-between gap-8 border-b border-[var(--rst-line)] bg-black/25 p-6 md:min-h-[28rem] md:border-b-0 md:border-r md:p-7">
          <div>
            <p className="rst-kicker" style={{ color: accent }}>{payload.chapter ?? 'Studio story'}</p>
            {payload.location && <p className="rst-muted mt-3 text-xs uppercase tracking-[0.14em]">{payload.location}</p>}
          </div>
          <div>
            <div
              aria-hidden="true"
              className="rst-serif mb-4 grid h-20 w-20 place-items-center rounded-full border-2 text-3xl"
              style={{ borderColor: `${accent}99`, color: accent, background: `${accent}12` }}
            >
              {payload.speakerInitials ?? initialsFrom(payload.speaker)}
            </div>
            <p className="rst-serif text-2xl text-[var(--rst-ivory)]">{payload.speaker ?? 'The Visitor'}</p>
            {payload.speakerTitle && <p className="rst-muted mt-1 text-xs leading-relaxed">{payload.speakerTitle}</p>}
          </div>
        </aside>

        <div className="flex min-h-[22rem] flex-col p-6 sm:p-9 md:p-11">
          <p className="rst-kicker">{payload.kicker ?? 'Career moment'}</p>
          <motion.h1
            id="story-cutscene-title"
            initial={reduceMotion ? false : { y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="rst-title mt-2 text-3xl sm:text-5xl"
          >
            {payload.title}
          </motion.h1>

          <div aria-live="polite" className="flex flex-1 items-center py-8">
            {!showingChoice ? (
              <motion.p
                key={lineIndex}
                initial={reduceMotion ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                className="max-w-2xl font-[var(--rst-serif)] text-lg leading-8 text-[var(--rst-ivory)] sm:text-xl"
              >
                {lines[lineIndex]}
              </motion.p>
            ) : (
              <div className="w-full">
                <p className="rst-kicker mb-4">Choose your studio creed</p>
                <div className="grid gap-3">
                  {payload.choices?.map((choice) => (
                    <button key={choice.id} onClick={() => onComplete(choice)} className="rst-option text-left">
                      <span className="block font-semibold text-[var(--rst-ivory)]">{choice.label}</span>
                      <span className="rst-muted mt-1 block text-sm leading-relaxed">{choice.outcome}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!showingChoice && lastLine && payload.stats && payload.stats.length > 0 && (
            <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-5" aria-label="Career recap">
              {payload.stats.map((s) => (
                <div key={s.label} className="rounded-lg border border-[var(--rst-line)] bg-black/25 p-2 text-center">
                  <div className="rst-serif text-lg text-[var(--rst-brass-200)]">{s.value}</div>
                  <div className="rst-kicker !text-[9px] leading-tight">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {lines.map((_, i) => (
                <span
                  key={i}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: i === Math.min(lineIndex, lines.length - 1) ? 22 : 6,
                    background: i <= lineIndex ? accent : 'rgba(243,236,221,0.16)',
                  }}
                />
              ))}
            </div>
            {!showingChoice && (
              <button
                ref={continueRef}
                onClick={lastLine && !hasChoices ? () => onComplete() : advance}
                className="rst-btn rst-btn-primary"
              >
                {lastLine ? (hasChoices ? 'Choose a creed' : payload.finalLabel ?? 'Continue') : 'Continue'}
              </button>
            )}
          </div>
          <p className="rst-muted mt-4 text-right text-[10px] uppercase tracking-[0.16em]">Enter to advance · Esc to skip</p>
        </div>
      </motion.section>
    </motion.div>
  );
}
