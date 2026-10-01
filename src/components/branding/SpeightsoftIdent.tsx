import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { GlowSweep } from '@/components/motion/origin/GlowSweep';
import { TextScramble } from '@/components/motion/origin/TextScramble';
import './SpeightsoftIdent.css';

export interface SpeightsoftIdentProps {
  /** Total time the full-motion ident remains mounted before exiting. */
  durationMs?: number;
  /** Called after the exit transition has fully completed. */
  onComplete?: () => void;
}

const SIGNAL_PATH =
  'M 88 27 H 43 C 29 27 21 34 21 44 C 21 54 29 59 43 59 H 76 C 91 59 99 66 99 77 C 99 89 90 96 75 96 H 30';

const FULL_MOTION_DURATION_MS = 2450;
const REDUCED_MOTION_DURATION_MS = 900;

/**
 * Speightsoft studio ident.
 *
 * Design language:
 * - SVG "signal cable" S monogram
 * - bounded chromatic registration/glitch pass
 * - OriginKit-derived TextScramble + GlowSweep
 * - no canvas, WebGL, image assets, or additional animation runtimes
 *
 * The calling game can mount underneath this full-screen overlay so boot work
 * continues while the ident plays.
 */
export const SpeightsoftIdent: React.FC<SpeightsoftIdentProps> = ({
  durationMs = FULL_MOTION_DURATION_MS,
  onComplete,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const reducedMotion = Boolean(shouldReduceMotion);
  const [mounted, setMounted] = useState(true);
  const [visible, setVisible] = useState(true);
  const [wordReady, setWordReady] = useState(reducedMotion);
  const [sweepReady, setSweepReady] = useState(false);
  const completionFired = useRef(false);

  const finish = useCallback(() => {
    setVisible(false);
  }, []);

  useEffect(() => {
    const timers: number[] = [];
    const resolvedDuration = reducedMotion
      ? Math.min(durationMs, REDUCED_MOTION_DURATION_MS)
      : durationMs;

    if (!reducedMotion) {
      timers.push(window.setTimeout(() => setWordReady(true), 560));
      timers.push(window.setTimeout(() => setSweepReady(true), 1080));
    } else {
      setWordReady(true);
    }

    timers.push(window.setTimeout(finish, resolvedDuration));

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
        finish();
      }
    };

    const onVisibilityChange = () => {
      // Decorative startup motion should never continue burning frames in a hidden tab.
      if (document.visibilityState === 'hidden') {
        finish();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      timers.forEach(window.clearTimeout);
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [durationMs, finish, reducedMotion]);

  const handleExitComplete = useCallback(() => {
    setMounted(false);
    if (!completionFired.current) {
      completionFired.current = true;
      onComplete?.();
    }
  }, [onComplete]);

  if (!mounted) return null;

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {visible && (
        <motion.section
          className="speightsoft-ident"
          aria-label="Speightsoft"
          role="img"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: reducedMotion ? 1 : 1.018,
            filter: reducedMotion ? 'blur(0px)' : 'blur(5px)',
          }}
          transition={{
            duration: reducedMotion ? 0.12 : 0.3,
            ease: [0.16, 1, 0.3, 1],
          }}
          onPointerDown={finish}
        >
          <div className="speightsoft-ident__grid" aria-hidden="true" />
          <motion.div
            className="speightsoft-ident__flare"
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.55 }}
            animate={
              reducedMotion
                ? { opacity: 0.13, scale: 1 }
                : {
                    opacity: [0, 0.34, 0.16],
                    scale: [0.55, 1.08, 1],
                  }
            }
            transition={{ duration: reducedMotion ? 0 : 1.05, ease: 'easeOut' }}
          />

          <motion.div
            className="speightsoft-ident__lockup"
            initial={{ y: reducedMotion ? 0 : 8 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="speightsoft-ident__mark-shell">
              <motion.svg
                className="speightsoft-ident__mark"
                viewBox="0 0 120 120"
                aria-hidden="true"
                initial={{ scale: reducedMotion ? 1 : 0.94 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
              >
                <defs>
                  <linearGradient id="speightsoft-signal" x1="18" y1="22" x2="104" y2="101">
                    <stop offset="0%" stopColor="#f8fafc" />
                    <stop offset="44%" stopColor="#dff7ff" />
                    <stop offset="72%" stopColor="#ddd6fe" />
                    <stop offset="100%" stopColor="#f8fafc" />
                  </linearGradient>
                </defs>

                <motion.rect
                  x="11.5"
                  y="11.5"
                  width="97"
                  height="97"
                  rx="28"
                  className="speightsoft-ident__frame"
                  initial={reducedMotion ? false : { pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.68, ease: [0.16, 1, 0.3, 1] }}
                />

                {!reducedMotion && (
                  <>
                    <motion.path
                      d={SIGNAL_PATH}
                      className="speightsoft-ident__ghost speightsoft-ident__ghost--cyan"
                      initial={{ pathLength: 0, opacity: 0, x: -3 }}
                      animate={{
                        pathLength: 1,
                        opacity: [0, 0.52, 0],
                        x: [-3, 1.5, 0],
                      }}
                      transition={{ duration: 0.86, delay: 0.1, ease: 'easeOut' }}
                    />
                    <motion.path
                      d={SIGNAL_PATH}
                      className="speightsoft-ident__ghost speightsoft-ident__ghost--magenta"
                      initial={{ pathLength: 0, opacity: 0, x: 3 }}
                      animate={{
                        pathLength: 1,
                        opacity: [0, 0.38, 0],
                        x: [3, -1.5, 0],
                      }}
                      transition={{ duration: 0.86, delay: 0.13, ease: 'easeOut' }}
                    />
                  </>
                )}

                <motion.path
                  d={SIGNAL_PATH}
                  className="speightsoft-ident__signal"
                  initial={reducedMotion ? false : { pathLength: 0, opacity: 0.45 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{
                    duration: reducedMotion ? 0 : 0.76,
                    delay: reducedMotion ? 0 : 0.12,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                />

                <motion.circle
                  cx="88"
                  cy="27"
                  r="3.5"
                  className="speightsoft-ident__node"
                  initial={reducedMotion ? false : { scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: reducedMotion ? 0 : 0.64, type: 'spring', stiffness: 360, damping: 20 }}
                />
                <motion.circle
                  cx="30"
                  cy="96"
                  r="3.5"
                  className="speightsoft-ident__node"
                  initial={reducedMotion ? false : { scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: reducedMotion ? 0 : 0.7, type: 'spring', stiffness: 360, damping: 20 }}
                />
              </motion.svg>

              {sweepReady && (
                <GlowSweep tone="cyan" duration={0.72} repeat={false} className="speightsoft-ident__sweep" />
              )}
            </div>

            <div className="speightsoft-ident__word-slot">
              {wordReady && (
                <motion.div
                  aria-hidden="true"
                  initial={reducedMotion ? false : { opacity: 0, y: 6, letterSpacing: '0.42em' }}
                  animate={{ opacity: 1, y: 0, letterSpacing: '0.28em' }}
                  transition={{ duration: reducedMotion ? 0 : 0.46, ease: [0.16, 1, 0.3, 1] }}
                >
                  <TextScramble
                    text="SPEIGHTSOFT"
                    speed={22}
                    characterSet="ABCDEFGHJKLMNPQRSTUVWXYZ0123456789"
                    className="speightsoft-ident__word"
                  />
                </motion.div>
              )}
            </div>

            <motion.div
              className="speightsoft-ident__rule"
              aria-hidden="true"
              initial={reducedMotion ? false : { scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: reducedMotion ? 0 : 0.52, delay: reducedMotion ? 0 : 1.02, ease: [0.16, 1, 0.3, 1] }}
            />

            <motion.span
              className="speightsoft-ident__tag"
              aria-hidden="true"
              initial={reducedMotion ? false : { opacity: 0, y: 3 }}
              animate={{ opacity: 0.64, y: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.35, delay: reducedMotion ? 0 : 1.18 }}
            >
              PLAY / MAKE / REPEAT
            </motion.span>
          </motion.div>

          <span className="sr-only">Speightsoft</span>
        </motion.section>
      )}
    </AnimatePresence>
  );
};

export default SpeightsoftIdent;
