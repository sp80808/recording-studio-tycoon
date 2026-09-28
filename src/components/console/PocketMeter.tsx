import React, { useEffect, useRef, useState } from 'react';

interface PocketMeterProps {
  isArmed: boolean;
  onLock: (needlePosition: number) => void;
  className?: string;
}

export const PocketMeter: React.FC<PocketMeterProps> = ({
  isArmed,
  onLock,
  className = ''
}) => {
  const [needlePos, setNeedlePos] = useState(0.2); // 0.0 to 1.0
  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lockedRef = useRef(false);
  const currentPosRef = useRef(0.2);

  useEffect(() => {
    if (!isArmed) {
      setNeedlePos(0.2);
      currentPosRef.current = 0.2;
      lockedRef.current = false;
      return;
    }

    lockedRef.current = false;
    startTimeRef.current = performance.now();

    // Smooth sinusoidal needle swing across 0.12 to 0.94 with cycle of ~1.2s
    const tick = (now: number) => {
      if (lockedRef.current) return;
      const elapsed = (now - startTimeRef.current) / 1000;

      // Auto-lock fallback after 2.5s
      if (elapsed >= 2.5) {
        lockedRef.current = true;
        onLock(currentPosRef.current);
        return;
      }

      // Smooth oscillation: center at 0.53, amplitude 0.41
      const pos = 0.53 + 0.41 * Math.sin(elapsed * Math.PI * 1.8);
      currentPosRef.current = Math.max(0.05, Math.min(0.98, pos));
      setNeedlePos(currentPosRef.current);
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isArmed, onLock]);

  const isInPocket = needlePos >= 0.70 && needlePos <= 0.85;

  const handleMeterClick = () => {
    if (!isArmed || lockedRef.current) return;
    lockedRef.current = true;
    onLock(currentPosRef.current);
  };

  return (
    <div
      onClick={handleMeterClick}
      className={`relative bg-slate-950 border border-slate-700/80 p-2 rounded-[2px] shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] select-none cursor-pointer transition-all ${className}`}
      title={isArmed ? 'Click to Lock Take in the Pocket!' : 'Analog Calibration Gauge'}
    >
      {/* Rackmount hardware corner hex bolts */}
      <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-slate-700 border border-slate-600 shadow-inner flex items-center justify-center text-[7px] text-slate-400 font-mono">
        +
      </div>
      <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-slate-700 border border-slate-600 shadow-inner flex items-center justify-center text-[7px] text-slate-400 font-mono">
        +
      </div>

      {/* Meter Header Label */}
      <div className="flex justify-between items-center px-3 mb-1 text-[9px] font-mono tracking-widest text-slate-400">
        <span>TAKE CALIBRATION</span>
        <span className={isInPocket ? 'text-amber-400 font-bold animate-pulse' : 'text-slate-500'}>
          {isInPocket ? '⚡ IN THE POCKET' : 'RMS LEVEL'}
        </span>
        <span>+4 dBu</span>
      </div>

      {/* Analog Faceplate */}
      <div className="relative h-14 bg-gradient-to-b from-amber-950/20 via-slate-900 to-slate-950 border border-slate-800 rounded-[2px] overflow-hidden flex flex-col justify-between p-1.5">
        {/* Arc Track / Pocket Highlight */}
        <div className="relative w-full h-4 bg-slate-800/80 rounded-[1px] overflow-hidden flex">
          {/* 0% to 50%: Normal range (cyan/slate) */}
          <div className="w-[50%] h-full bg-slate-700/50" />
          {/* 50% to 70%: Warm zone (emerald) */}
          <div className="w-[20%] h-full bg-emerald-600/40 border-l border-emerald-500/30" />
          {/* 70% to 85%: The Pocket Sweet Spot (amber/gold glowing) */}
          <div className="w-[15%] h-full bg-amber-500/80 border-x border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] flex items-center justify-center">
            <span className="text-[7px] font-black text-slate-950 uppercase tracking-tighter">POCKET</span>
          </div>
          {/* 85% to 100%: Hot zone (red) */}
          <div className="w-[15%] h-full bg-red-600/40 border-l border-red-500/40" />
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
        <div className="flex justify-between text-[8px] font-mono text-slate-500 px-1">
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
        aria-label="Work on Project - Lock Take"
        className={`w-full py-3 mt-2 font-black tracking-wider uppercase text-sm rounded-[2px] border transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${
          isInPocket
            ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 border-amber-300 shadow-[0_0_18px_rgba(251,191,36,0.8)] animate-pulse'
            : 'bg-gradient-to-r from-slate-800 to-slate-700 text-amber-300 border-slate-600 hover:border-amber-400/60 shadow-md'
        }`}
      >
        <span>{isInPocket ? '🔥' : '🎯'}</span>
        <span>{isInPocket ? 'LOCK TAKE IN THE POCKET!' : 'LOCK TAKE!'}</span>
      </button>
    </div>
  );
};
