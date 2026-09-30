import React, { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { useGamepad } from '@/hooks/useGamepad';
import { useSettings } from '@/contexts/settings-context-types';
import { GamepadGlyph } from '@/components/ui/GamepadGlyph';

interface PocketMeterProps {
  isArmed: boolean;
  onLock: (needlePosition: number) => void;
  timingBonus?: number;
  className?: string;
}

export const POCKET_METER_TIMING = {
  // A subtle readability-friendly speed increase for quicker session flow.
  cycleSeconds: 1.6,
  autoLockSeconds: 3.3,
} as const;

export const PocketMeter: React.FC<PocketMeterProps> = ({
  isArmed,
  onLock,
  timingBonus = 0,
  className = ''
}) => {
  const { settings } = useSettings();
  const gamepad = useGamepad({
    preferredLayout: settings?.controllerLayout,
    hapticsEnabled: settings?.gamepadHaptics,
  });

  const expansion = 0.15 * Math.max(0, timingBonus);
  const goldMin = Math.max(0, 0.70 - expansion);
  const goldMax = Math.min(1, 0.85 + expansion);

  const [needlePos, setNeedlePos] = useState(0.2); // 0.0 to 1.0
  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lockedRef = useRef(false);
  const currentPosRef = useRef(0.2);
  const wasInPocketRef = useRef(false);

  useEffect(() => {
    if (!isArmed) {
      setNeedlePos(0.2);
      currentPosRef.current = 0.2;
      lockedRef.current = false;
      return;
    }

    lockedRef.current = false;
    startTimeRef.current = performance.now();

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const accessiblePosition = (goldMin + goldMax) / 2;
      setNeedlePos(accessiblePosition);
      currentPosRef.current = accessiblePosition;
      const timeout = window.setTimeout(() => {
        if (!lockedRef.current) {
          lockedRef.current = true;
          onLock(accessiblePosition);
        }
      }, POCKET_METER_TIMING.autoLockSeconds * 1000);
      return () => window.clearTimeout(timeout);
    }

    // Readable sweep with enough reaction time for Gold locks (not twitchy).
    const tick = (now: number) => {
      if (lockedRef.current) return;
      const elapsed = (now - startTimeRef.current) / 1000;

      if (elapsed >= POCKET_METER_TIMING.autoLockSeconds) {
        lockedRef.current = true;
        onLock(currentPosRef.current);
        return;
      }

      // Smooth oscillation: center at 0.53, amplitude 0.41
      const pos = 0.53 + 0.41 * Math.sin((elapsed * Math.PI * 2) / POCKET_METER_TIMING.cycleSeconds);
      currentPosRef.current = Math.max(0.05, Math.min(0.98, pos));
      setNeedlePos(currentPosRef.current);

      // Tactile groove haptics: pulse gently when entering the Pocket zone
      const inPocketNow = currentPosRef.current >= goldMin && currentPosRef.current <= goldMax;
      if (inPocketNow && !wasInPocketRef.current) {
        gamepad.triggerHaptic(0.2, 0.4, 40);
      }
      wasInPocketRef.current = inPocketNow;

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isArmed, onLock, gamepad, goldMin, goldMax]);

  const isInPocket = needlePos >= goldMin && needlePos <= goldMax;
  const meterFeedback = isInPocket
    ? (timingBonus > 0 ? 'IN THE POCKET (CALIBRATED)' : 'IN THE POCKET')
    : needlePos < goldMin ? 'COMING UP' : 'TOO HOT';

  const handleMeterClick = useCallback(() => {
    if (!isArmed || lockedRef.current) return;
    lockedRef.current = true;
    
    const pos = currentPosRef.current;
    
    // Tactile lock rumble
    if (pos >= goldMin && pos <= goldMax) {
      gamepad.triggerHaptic(0.6, 0.9, 130);
      confetti({
        particleCount: 35,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#f59e0b', '#fbbf24', '#fcd34d', '#ffffff'],
        disableForReducedMotion: true,
        ticks: 120,
        gravity: 1.2,
        scalar: 0.8,
        zIndex: 100
      });
    } else {
      gamepad.triggerHaptic(0.2, 0.3, 60);
    }

    onLock(pos);
  }, [isArmed, onLock, gamepad]);

  // Gamepad A button or Right Trigger locks the armed take
  useEffect(() => {
    if (!isArmed || lockedRef.current || !gamepad.isConnected) return;
    if (gamepad.justPressed.south || gamepad.justPressed.rt || gamepad.triggers.right > 0.6) {
      handleMeterClick();
    }
  }, [isArmed, gamepad.isConnected, gamepad.justPressed.south, gamepad.justPressed.rt, gamepad.triggers.right, handleMeterClick]);

  return (
    <div
      onClick={handleMeterClick}
      className={`relative bg-stone-950 border border-stone-700/80 p-2 rounded-[2px] shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] select-none cursor-pointer transition-all ${className}`}
      title={isArmed ? 'Click to Lock Take in the Pocket!' : 'Analog Calibration Gauge'}
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
        <span aria-live="polite" className={isInPocket ? 'text-amber-400 font-bold' : needlePos > goldMax ? 'text-red-400 font-bold' : 'text-teal-300 font-bold'}>
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
            className="absolute top-0 bottom-0 w-1 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,1)] transition-all duration-75"
            style={{ left: `${needlePos * 100}%`, transform: 'translateX(-50%)' }}
          >
            <div className="w-2.5 h-2.5 -top-1 -left-0.75 absolute bg-red-500 rounded-full shadow-[0_0_6px_rgba(239,68,68,0.9)]" />
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

      {/* Dynamic 60fps Lock Button */}
      <button
        type="button"
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
        <span>{isInPocket ? '🔥' : '🎯'}</span>
        <span>{isInPocket ? 'LOCK GOLD TAKE!' : needlePos < goldMin ? 'LOW — AIM FOR GOLD' : 'HOT — AIM FOR GOLD'}</span>
      </button>
    </div>
  );
};
