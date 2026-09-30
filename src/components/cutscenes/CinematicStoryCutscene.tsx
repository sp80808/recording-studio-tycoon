import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { CareerCutsceneChoice } from './careerCutscenes';

interface Payload {
  title: string;
  loreBrief?: string;
  chapter?: string;
  speaker?: string;
  speakerTitle?: string;
  location?: string;
  lines?: string[];
  choices?: CareerCutsceneChoice[];
}

interface Props {
  payload: Payload;
  onComplete: (choice?: CareerCutsceneChoice) => void;
}

export function CinematicStoryCutscene({ payload, onComplete }: Props) {
  const reduceMotion = useReducedMotion();
  const [lineIndex, setLineIndex] = useState(0);
  const continueRef = useRef<HTMLButtonElement>(null);
  const lines = payload.lines?.length ? payload.lines : [payload.loreBrief ?? 'A new chapter begins.'];
  const showingChoice = lineIndex >= lines.length;
  const advance = useCallback(
    () => setLineIndex((index) => Math.min(index + 1, lines.length)),
    [lines.length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onComplete();
      if (!showingChoice && ['Enter', ' '].includes(e.key)) advance();
    };
    window.addEventListener('keydown', onKey);
    continueRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [advance, onComplete, showingChoice]);

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
          className="relative grid w-full max-w-4xl overflow-hidden rounded-2xl border border-amber-300/25 bg-[#151310] text-white shadow-[0_28px_100px_rgba(0,0,0,.8)] md:grid-cols-[17rem_1fr]"
        >
          <aside className="relative min-h-48 overflow-hidden border-b border-amber-300/15 bg-gradient-to-br from-[#332313] via-[#181715] to-[#0e0c0a] p-7 md:min-h-[30rem] md:border-b-0 md:border-r">
            <div aria-hidden="true" className="absolute -right-16 top-12 h-52 w-52 rounded-full border-[22px] border-amber-100/5 shadow-[0_0_0_18px_rgba(245,158,11,.04)]" />
            <div className="relative flex h-full flex-col justify-between gap-8">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-300/70">{payload.chapter ?? 'Studio story'}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.16em] text-white/45">{payload.location}</p>
              </div>
              <div>
                <div className="mb-4 grid h-20 w-20 place-items-center rounded-full border border-amber-200/25 bg-black/40 font-serif text-3xl text-amber-200 shadow-[0_0_36px_rgba(245,158,11,.12)]">SV</div>
                <p className="font-serif text-2xl text-amber-100">{payload.speaker ?? 'The Visitor'}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/45">{payload.speakerTitle}</p>
              </div>
            </div>
          </aside>

          <div className="flex min-h-[24rem] flex-col p-6 sm:p-9 md:p-11">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-300/60">Career moment</p>
            <motion.h1
            id="story-cutscene-title"
            initial={reduceMotion ? false : { y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mt-2 font-serif text-3xl tracking-wide text-amber-100 sm:text-5xl"
          >
            {payload.title}
          </motion.h1>
            <div aria-live="polite" className="flex flex-1 items-center py-8">
              {!showingChoice ? (
                <motion.p
                  key={lineIndex}
                  initial={reduceMotion ? false : { opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="max-w-2xl text-lg leading-8 text-stone-200 sm:text-xl"
                >
                  {lines[lineIndex]}
                </motion.p>
              ) : (
                <div className="w-full">
                  <p className="mb-4 text-sm uppercase tracking-[0.18em] text-amber-200/70">Choose your studio creed</p>
                  <div className="grid gap-3">
                    {payload.choices?.map((choice) => (
                      <button key={choice.id} onClick={() => onComplete(choice)} className="group rounded-lg border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-amber-300/45 hover:bg-amber-300/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
                        <span className="block font-semibold text-white">{choice.label}</span>
                        <span className="mt-1 block text-sm leading-relaxed text-white/50 group-hover:text-white/70">{choice.outcome}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {!showingChoice && (
              <button ref={continueRef} onClick={advance} className="self-end rounded-md border border-amber-300/35 bg-amber-300/10 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-amber-100 transition hover:bg-amber-300/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
                {lineIndex === lines.length - 1 ? 'Choose a creed' : 'Continue'}
              </button>
            )}
            <p className="mt-4 text-right text-[10px] uppercase tracking-[0.16em] text-white/30">Enter to advance · Esc to skip</p>
          </div>
        </motion.section>
      </motion.div>
  );
}
