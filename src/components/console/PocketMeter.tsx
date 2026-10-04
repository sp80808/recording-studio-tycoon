import { StatIcon } from '@/components/icons/GameIcons';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { useGamepad } from '@/hooks/useGamepad';
import { useSettings } from '@/contexts/settings-context-types';
import { GamepadGlyph } from '@/components/ui/GamepadGlyph';
import { getTakeGoldWindow } from '@/rpg/takeEvaluation';

export interface PocketMeterProps {
  isArmed: boolean;
  isPaused?: boolean;
  onLock: (needlePosition: number) => void;
  timingBonus?: number;
  className?: string;
}

export const POCKET_METER_TIMING = {
  // Keep the gold crossing readable without turning the session into a wait:
  // at the centre of the sweep the 15% pocket is crossed in roughly 100ms.
  cycleSeconds: 1.8,
  // Needle starts low and swings up through the pocket — every arm opens with
  // a visible approach beat before the first Gold chance (~0.57s).
  startPhase: -Math.PI / 2,
  // Give the player a little over one full pass before the safe fallback.
  autoLockSeconds: 3.2,
} as const;

/** Sweep geometry, exported so pacing checks can re-derive the crossing time. */
export const POCKET_METER_SWEEP = {
  center: 0.53,
  amplitude: 0.41,
} as const;

export const PocketMeter: React.FC<PocketMeterProps> = ({
  isArmed,
  isPaused = false,
  onLock,
  timingBonus = 0,
  className = '',
}) => {
  const { settings } = useSettings();
  const gamepad = useGamepad({
    preferredLayout: settings?.controllerLayout,
    hapticsEnabled: settings?.gamepadHaptics,
  });
  const { triggerHaptic, leftStick, isConnected } = gamepad;
  const scrubRef = useRef(leftStick.x);
  scrubRef.current = leftStick.x;

  // The drawn pocket and the graded pocket are the same shared window
  // (Settings → PocketMeter Timing Window Assist + chore timing bonus).
  const goldWindow = getTakeGoldWindow(timingBonus, settings.pocketMeterAssistance);
  const { min: goldMin, max: goldMax } = goldWindow;

  // Live values the rAF sweep must read through refs. `gamepad`, `onLock` and
  // the window are fresh identities on every render, and this component
  // re-renders each frame while the needle moves: subscribing the sweep effect
  // to them reset its start clock every frame, parking the needle at the arc
  // start and making Gold (and the auto-lock fallback) unreachable.
  const pocketRef = useRef(goldWindow);
  pocketRef.current = goldWindow;
  const onLockRef = useRef(onLock);
  onLockRef.current = onLock;
  const hapticRef = useRef(triggerHaptic);
  hapticRef.current = triggerHaptic;

  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;
  const pausedTimeAccumulatorRef = useRef(0);
  const pauseStartRef = useRef<number | null>(null);

  const [needlePos, setNeedlePos] = useState(0.2); // 0.0 to 1.0
  const [autoLockLeft, setAutoLockLeft] = useState(1); // 1 → 0 until the safe fallback
  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lockedRef = useRef(false);
  const currentPosRef = useRef(0.2);
  const wasInPocketRef = useRef(false);

  const systemReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reducedMotionUi = settings.reducedMotion || systemReducedMotion;

  useEffect(() => {
    if (!isArmed) {
      setNeedlePos(0.2);
      currentPosRef.current = 0.2;
      setAutoLockLeft(1);
      lockedRef.current = false;
      wasInPocketRef.current = false;
      pausedTimeAccumulatorRef.current = 0;
      pauseStartRef.current = null;
      return;
    }

    lockedRef.current = false;
    wasInPocketRef.current = false;
    startTimeRef.current = performance.now();
    pausedTimeAccumulatorRef.current = 0;
    pauseStartRef.current = null;
    setAutoLockLeft(1);

    if (settings.reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const pocket = pocketRef.current;
      const accessiblePosition = (pocket.min + pocket.max) / 2;
      setNeedlePos(accessiblePosition);
      currentPosRef.current = accessiblePosition;
      const timeout = window.setTimeout(() => {
        if (!lockedRef.current && !isPausedRef.current) {
          lockedRef.current = true;
          onLockRef.current(accessiblePosition);
        }
      }, POCKET_METER_TIMING.autoLockSeconds * 1000);
      return () => window.clearTimeout(timeout);
    }

    // Readable sweep with enough reaction time for Gold locks (not twitchy).
    const tick = (now: number) => {
      if (lockedRef.current) return;

      if (isPausedRef.current) {
        if (pauseStartRef.current === null) {
          pauseStartRef.current = now;
        }
        animRef.current = requestAnimationFrame(tick);
        return;
      }

      if (pauseStartRef.current !== null) {
        pausedTimeAccumulatorRef.current += (now - pauseStartRef.current);
        pauseStartRef.current = null;
      }

      const elapsed = (now - startTimeRef.current - pausedTimeAccumulatorRef.current) / 1000;

      if (elapsed >= POCKET_METER_TIMING.autoLockSeconds) {
        lockedRef.current = true;
        setAutoLockLeft(0);
        onLockRef.current(currentPosRef.current);
        return;
      }

      // Smooth oscillation around the faceplate centre. startPhase opens each arm
      // low so the first pocket visit is a visible approach, not an ambush.
      const pos = POCKET_METER_SWEEP.center + POCKET_METER_SWEEP.amplitude * Math.sin((elapsed * Math.PI * 2) / POCKET_METER_TIMING.cycleSeconds + POCKET_METER_TIMING.startPhase);
      currentPosRef.current = Math.max(0.05, Math.min(0.98, pos));
      setNeedlePos(currentPosRef.current);
      setAutoLockLeft(Math.max(0, 1 - elapsed / POCKET_METER_TIMING.autoLockSeconds));

      // Tactile groove haptics: pulse gently when entering the Pocket zone
      const pocket = pocketRef.current;
      const inPocketNow = currentPosRef.current >= pocket.min && currentPosRef.current <= pocket.max;
      if (inPocketNow && !wasInPocketRef.current) {
        hapticRef.current(0.2, 0.4, 40);
      }
      wasInPocketRef.current = inPocketNow;

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isArmed, settings.reducedMotion]);

  const isInPocket = !isPaused && needlePos >= goldMin && needlePos <= goldMax;
  const meterFeedback = isPaused
    ? 'CALIBRATION PAUSED'
    : isInPocket
      ? (timingBonus > 0 ? 'IN THE POCKET (CALIBRATED)' : 'IN THE POCKET')
      : needlePos < goldMin ? 'COMING UP' : 'TOO HOT';
  const needleState: 'below' | 'pocket' | 'above' | 'paused' = isPaused
    ? 'paused'
    : isInPocket
      ? 'pocket'
      : needlePos < goldMin
        ? 'below'
        : 'above';
  const needleBarClass =
    needleState === 'pocket'
      ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,1)]'
      : needleState === 'below'
        ? 'bg-teal-300 shadow-[0_0_7px_rgba(94,234,212,0.85)]'
        : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.95)]';
  const needleTipClass =
    needleState === 'pocket'
      ? 'bg-amber-300 shadow-[0_0_7px_rgba(251,191,36,0.95)]'
      : needleState === 'below'
        ? 'bg-teal-200 shadow-[0_0_6px_rgba(94,234,212,0.9)]'
        : 'bg-red-500 shadow-[0_0_7px_rgba(239,68,68,0.95)]';

  const handleMeterClick = useCallback(() => {
    if (!isArmed || lockedRef.current || isPausedRef.current) return;
    lockedRef.current = true;

    const pos = currentPosRef.current;
    const pocket = pocketRef.current;

    // Tactile lock rumble + celebration only where grading will actually award Gold
    if (pos >= pocket.min && pos <= pocket.max) {
      hapticRef.current(0.6, 0.9, 130);
      confetti({
        particleCount: 28,
        spread: 62,
        origin: { y: 0.65 },
        colors: ['#f59e0b', '#fbbf24', '#fcd34d', '#ffffff'],
        disableForReducedMotion: true,
        ticks: 70,
        gravity: 1.35,
        scalar: 0.75,
        zIndex: 100
      });
    } else {
      hapticRef.current(0.2, 0.3, 60);
    }

    onLockRef.current(pos);
  }, [isArmed]);

  // Keyboard parity with the gamepad lock: Space or Enter anywhere while armed.
  useEffect(() => {
    if (!isArmed) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || (event.key !== ' ' && event.key !== 'Enter')) return;
      if (isPausedRef.current) return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      // Focused controls (Stand down, the Lock Take button) keep native key semantics.
      if (target?.closest('button, input, select, textarea, [role="button"]')) return;
      event.preventDefault();
      handleMeterClick();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isArmed, handleMeterClick]);

  // Gamepad A button or Right Trigger locks the armed take
  useEffect(() => {
    if (!isArmed || lockedRef.current || isPausedRef.current || !gamepad.isConnected) return;
    if (gamepad.justPressed.south || gamepad.justPressed.rt || gamepad.triggers.right > 0.6) {
      handleMeterClick();
    }
  }, [isArmed, gamepad.isConnected, gamepad.justPressed.south, gamepad.justPressed.rt, gamepad.triggers.right, handleMeterClick]);


  return (
    <div
      onClick={handleMeterClick}
      className={`relative bg-stone-950 border border-stone-700/80 p-2 rounded-[2px] shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] select-none cursor-pointer transition-all ${className}`}
      title={isPaused ? 'Take Calibration Paused' : isArmed ? 'Click to Lock Take in the Pocket!' : 'Analog Calibration Gauge'}
    >
      {/* Rackmount hardware corner hex bolts */}
      <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-stone-700 border border-stone-600 shadow-inner flex items-center justify-center text-[7px] text-stone-400 font-mono">
        +
      </div>
      <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-stone-700 border border-stone-600 shadow-inner flex items-center justify-center text-[7px] text-stone-400 font-mono">
        +
      </div>

      {/* Meter Header Label */}
      <div className="flex justify-between items-center px-3 mb-1 text-[9px] font-mono tracking-widest text-stone-400">
        <span>TAKE CALIBRATION</span>
        <span aria-live="polite" className={isPaused ? 'text-amber-300 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30 animate-pulse' : isInPocket ? 'text-amber-400 font-bold' : needlePos > goldMax ? 'text-red-400 font-bold' : 'text-teal-300 font-bold'}>
          {meterFeedback}
        </span>
        <span>+4 dBu</span>
      </div>

      {/* Analog Faceplate */}
      <div
        className="relative h-14 bg-gradient-to-b from-amber-950/20 via-stone-900 to-stone-950 border border-stone-800 rounded-[2px] overflow-hidden flex flex-col justify-between p-1.5"
        role="meter"
        aria-label="Take timing meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(needlePos * 100)}
        aria-valuetext={`${meterFeedback}. Target is ${Math.round(goldMin * 100)} to ${Math.round(goldMax * 100)}.`}
        data-needle-state={needleState}
      >
        {/* Arc Track / Pocket Highlight */}
        <div className="relative w-full h-4 bg-stone-800/80 rounded-[1px] overflow-hidden flex">
          {/* Normal range */}
          <div style={{ width: `${Math.max(0, goldMin - 0.20) * 100}%` }} className="h-full bg-stone-700/50" />
          {/* Warm zone */}
          <div style={{ width: `${(goldMin - Math.max(0, goldMin - 0.20)) * 100}%` }} className="h-full bg-emerald-600/40 border-l border-emerald-500/30" />
          {/* The Pocket Sweet Spot (amber/gold glowing) */}
          <div
            style={{ width: `${(goldMax - goldMin) * 100}%` }}
            className={`h-full bg-amber-500/80 border-x border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] flex items-center justify-center transition-all ${timingBonus > 0 ? 'ring-1 ring-amber-300' : ''}`}
            title={timingBonus > 0 ? `Tape Heads Cleaned: +${Math.round(timingBonus * 100)}% Sweet Spot` : 'Standard Sweet Spot'}
          >
            <span className="text-[7px] font-black text-stone-950 uppercase tracking-tighter">
              {timingBonus > 0 ? '+CAL' : 'POCKET'}
            </span>
          </div>
          {/* Hot zone */}
          <div style={{ width: `${(1 - goldMax) * 100}%` }} className="h-full bg-red-600/40 border-l border-red-500/40" />
        </div>

        {/* Needle Marker Indicator */}
        <div className="relative w-full h-6 flex items-center">
          <div
            className={`absolute top-0 bottom-0 w-1.5 ${needleBarClass}`}
            style={{ left: `${needlePos * 100}%`, transform: 'translateX(-50%)' }}
          >
            <div className={`w-3 h-3 -top-1.5 -left-0.75 absolute rounded-full ${needleTipClass}`} />
          </div>
        </div>

        {/* Silk-screened dB tick marks */}
        <div className="flex justify-between text-[8px] font-mono text-stone-500 px-1">
          <span>-20dB</span>
          <span>-10dB</span>
          <span>-3dB</span>
          <span className="text-amber-400 font-bold">0dB</span>
          <span className="text-red-400">+6dB</span>
        </div>
      </div>

      {/* Auto-lock fallback drain: the console check always resolves itself. */}
      {!reducedMotionUi && (
        <div className="mt-1" data-testid="auto-lock-drain">
          <div className="flex items-center justify-between text-[7px] font-mono tracking-widest text-stone-500">
            <span>AUTO-LOCK</span>
            {autoLockLeft <= 0.25 && <span className="text-red-400 font-bold animate-pulse">LOCKING…</span>}
          </div>
          <div className="h-0.5 w-full bg-stone-800/80 overflow-hidden">
            <div
              className={autoLockLeft <= 0.25 ? 'h-full bg-red-500/80' : 'h-full bg-teal-400/50'}
              style={{ width: `${autoLockLeft * 100}%` }}
            />
          </div>
        </div>
      )}


      {/* Dynamic 60fps Lock Button */}
      <button
        type="button"
        data-rst-surface="contextual" data-rst-action-id="console:lock-take" data-rst-world-target="console"
        onClick={(e) => {
          e.stopPropagation();
          handleMeterClick();
        }}
        aria-label={`Lock take. ${meterFeedback}. Target is ${Math.round(goldMin * 100)} to ${Math.round(goldMax * 100)}.`}
        className={`w-full py-3 mt-2 font-black tracking-wider uppercase text-sm rounded-[2px] border transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${
          isInPocket
            ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-stone-950 border-amber-300 shadow-[0_0_18px_rgba(251,191,36,0.8)] animate-pulse'
            : 'bg-gradient-to-r from-stone-800 to-stone-700 text-amber-300 border-stone-600 hover:border-amber-400/60 shadow-md'
        }`}
      >
        {gamepad.isConnected && gamepad.lastInputType === 'gamepad' && (
          <GamepadGlyph button="south" size="xs" />
        )}
        <span><StatIcon name={isInPocket ? 'flame' : 'goal'} /></span>
        <span>{isInPocket ? 'LOCK GOLD TAKE!' : needlePos < goldMin ? 'LOW — AIM FOR GOLD' : 'HOT — AIM FOR GOLD'}</span>
      </button>
    </div>
  );
};

