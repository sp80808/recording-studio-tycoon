import React, { useEffect, useState } from 'react';

export interface VUMeterProps {
  /** 0 to 1 activity level or audio signal strength */
  level?: number;
  /** Whether the studio or channel is active */
  isActive?: boolean;
  /** Display label (e.g. 'CH 1', 'MASTER', 'L/R') */
  label?: string;
  /** Size variant */
  size?: 'sm' | 'md';
  className?: string;
}

const TOTAL_SEGMENTS = 10;
// Segments 0-6: green, 7-8: yellow, 9: red (clipping)
const getSegmentColor = (index: number, active: boolean): string => {
  if (!active) return 'bg-slate-800';
  if (index === 9) return 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]';
  if (index >= 7) return 'bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.6)]';
  return 'bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.5)]';
};

export const VUMeter: React.FC<VUMeterProps> = ({
  level = 0.5,
  isActive = true,
  label,
  size = 'md',
  className = '',
}) => {
  const [leftValue, setLeftValue] = useState(0);
  const [rightValue, setRightValue] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setLeftValue(0);
      setRightValue(0);
      return;
    }

    // Natural audio wobble simulation around the activity level
    const interval = setInterval(() => {
      const base = Math.max(0, Math.min(1, level));
      const wobbleL = base * (0.65 + Math.random() * 0.35);
      const wobbleR = base * (0.65 + Math.random() * 0.35);
      setLeftValue(wobbleL);
      setRightValue(wobbleR);
    }, 75);

    return () => clearInterval(interval);
  }, [isActive, level]);

  const leftActiveCount = Math.round(leftValue * TOTAL_SEGMENTS);
  const rightActiveCount = Math.round(rightValue * TOTAL_SEGMENTS);

  const segmentHeight = size === 'sm' ? 'h-1' : 'h-1.5';
  const meterWidth = size === 'sm' ? 'w-2.5' : 'w-3.5';

  return (
    <div className={`inline-flex flex-col items-center bg-slate-950/80 p-1.5 rounded border border-slate-800 shadow-inner ${className}`}>
      {label && <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono mb-1">{label}</span>}
      <div className="flex gap-1 items-end">
        {/* Left Channel */}
        <div className={`flex flex-col-reverse gap-0.5 ${meterWidth}`}>
          {Array.from({ length: TOTAL_SEGMENTS }).map((_, i) => (
            <div
              key={`L-${i}`}
              className={`w-full ${segmentHeight} rounded-[1px] transition-colors duration-75 ${getSegmentColor(i, i < leftActiveCount)}`}
            />
          ))}
        </div>
        {/* Right Channel */}
        <div className={`flex flex-col-reverse gap-0.5 ${meterWidth}`}>
          {Array.from({ length: TOTAL_SEGMENTS }).map((_, i) => (
            <div
              key={`R-${i}`}
              className={`w-full ${segmentHeight} rounded-[1px] transition-colors duration-75 ${getSegmentColor(i, i < rightActiveCount)}`}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-between w-full text-[8px] text-slate-500 font-mono mt-0.5 px-0.5">
        <span>L</span>
        <span>R</span>
      </div>
    </div>
  );
};
