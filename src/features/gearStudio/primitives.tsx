import React from 'react';
import { motion } from 'framer-motion';
import { Power } from 'lucide-react';

/** Reusable hardware primitives (#81). Themeable via props; no game state inside. */

export const JewelLamp: React.FC<{ on: boolean; color?: string; flicker?: boolean; reducedMotion?: boolean }> = ({
  on, color = '#ef4444', flicker = false, reducedMotion = false,
}) => (
  <div
    data-testid="jewel-lamp"
    className={`w-4 h-4 rounded-full border border-stone-900 flex items-center justify-center ${
      on && flicker && !reducedMotion ? 'animate-pulse' : ''
    }`}
    style={on ? { background: color, boxShadow: `0 0 8px ${color}` } : { background: '#292524' }}
  >
    <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
  </div>
);

export const RotaryKnob: React.FC<{
  value: number; label: string; caption?: string; onStep?: () => void; title?: string;
}> = ({ value, label, caption, onStep, title }) => (
  <div className="flex flex-col items-center">
    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">{label}</span>
    <div
      className="w-14 h-14 rounded-full bg-gradient-to-br from-stone-700 via-stone-800 to-stone-950 border-2 border-stone-500 shadow-md relative flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
      onClick={onStep}
      title={title}
    >
      <motion.div style={{ rotate: -135 + value * 270 }} className="absolute top-1.5 w-1 h-4 bg-stone-200 rounded-full" />
      <span className="text-[8px] font-black text-amber-400">{Math.round(value * 100)}</span>
    </div>
    {caption && <span className="text-[8px] text-stone-500 mt-1">{caption}</span>}
  </div>
);

export const ToggleSwitch: React.FC<{ on: boolean; onToggle: () => void; label?: string }> = ({ on, onToggle, label = 'Power Switch' }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={label}
    className="w-6 h-8 rounded-xs border border-stone-600 bg-stone-950 flex flex-col items-center justify-between p-1 cursor-pointer transition-transform active:scale-95"
  >
    <div className={`w-3.5 h-3 rounded-2xs transition-all ${on ? 'bg-amber-400 -translate-y-0.5' : 'bg-stone-600 translate-y-1'}`} />
    <Power size={9} className={on ? 'text-amber-400' : 'text-stone-500'} />
  </button>
);

export function PushButtonBank<T extends string | number>({
  options, selected, allIn = false, onSelect, format = (o: T) => String(o),
}: {
  options: readonly T[]; selected: T | null; allIn?: boolean; onSelect: (o: T) => void; format?: (o: T) => string;
}) {
  return (
    <div className="grid grid-cols-2 gap-1 w-full">
      {options.map((o) => (
        <button
          key={String(o)}
          type="button"
          onClick={() => onSelect(o)}
          className={`py-1 text-[8px] font-black rounded-2xs border transition-all ${
            selected === o || allIn
              ? 'bg-stone-100 text-stone-950 border-stone-400 shadow-inner'
              : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
          }`}
        >
          {format(o)}
        </button>
      ))}
    </div>
  );
}

export const VUMeter: React.FC<{
  level: number; powered: boolean; reducedMotion?: boolean; ticks?: string[]; overloadZone?: boolean;
}> = ({ level, powered, reducedMotion = false, ticks = ['-20', '-10', '-7', '-3', '0', '+3'], overloadZone = true }) => {
  const angle = powered ? -42 + level * 84 : -45;
  return (
    <div className="w-full h-20 bg-amber-100 border-2 border-stone-800 rounded-t-lg shadow-inner relative overflow-hidden flex flex-col justify-end px-2 pb-1">
      <div className="absolute inset-x-2 top-2 h-7 border-b border-stone-700 flex justify-between text-[7px] font-bold text-stone-800">
        {ticks.map((t, i) => (
          <span key={t} className={i === ticks.length - 1 && overloadZone ? 'text-red-700 font-black' : undefined}>{t}</span>
        ))}
      </div>
      {overloadZone && <div className="absolute right-2 top-2 w-7 h-1.5 bg-red-600/70 rounded-xs" />}
      {powered && <div className="absolute inset-0 bg-amber-300/35 pointer-events-none" />}
      <div className="relative w-full h-1 flex justify-center items-end">
        <motion.div
          animate={{ rotate: angle }}
          transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 220, damping: 14 }}
          style={{ originX: 0.5, originY: 1 }}
          className="w-0.5 h-14 bg-red-700 rounded-t-full shadow-sm"
        />
      </div>
      <div className="w-5 h-2.5 bg-stone-900 rounded-t-full mx-auto z-10" />
    </div>
  );
};

export const LedMeter: React.FC<{ level: number; segments?: number; powered: boolean }> = ({ level, segments = 8, powered }) => (
  <div className="flex gap-0.5" role="meter" aria-valuenow={Math.round(level * 100)}>
    {Array.from({ length: segments }, (_, i) => {
      const lit = powered && i / segments < level;
      const hot = i >= segments - 2;
      return (
        <div
          key={i}
          className={`w-1.5 h-3 rounded-2xs ${lit ? (hot ? 'bg-red-500' : 'bg-emerald-400') : 'bg-stone-800'}`}
        />
      );
    })}
  </div>
);

/** Reel rotation is pure CSS and only spins while `spinning`; settles static otherwise. */
export const TapeReelPair: React.FC<{ spinning: boolean; reverse?: boolean; reducedMotion?: boolean }> = ({ spinning, reverse = false, reducedMotion = false }) => {
  const run = spinning && !reducedMotion;
  const reel = (
    <div
      className="w-10 h-10 rounded-full border-2 border-stone-500 bg-stone-900 flex items-center justify-center"
      style={run ? { animation: `spin 1.6s linear infinite ${reverse ? 'reverse' : 'normal'}` } : undefined}
    >
      <div className="w-1.5 h-6 bg-stone-400 rounded-full" />
      <div className="absolute w-6 h-1.5 bg-stone-400 rounded-full" />
    </div>
  );
  return <div data-testid="tape-reel-pair" className="flex gap-3 relative">{reel}{reel}</div>;
};

export const VacuumTubeGlow: React.FC<{ powered: boolean; warmth?: number }> = ({ powered, warmth = 0.7 }) => (
  <div
    data-testid="vacuum-tube"
    className="w-4 h-8 rounded-t-full border border-stone-600"
    style={powered ? { background: `rgba(251,146,60,${0.3 + warmth * 0.5})`, boxShadow: `0 0 ${6 + warmth * 8}px rgba(251,146,60,0.7)` } : { background: '#1c1917' }}
  />
);

export const TransportButtons: React.FC<{
  transport: 'stopped' | 'play' | 'record' | 'rewind'; onChange: (t: 'stopped' | 'play' | 'record' | 'rewind') => void;
}> = ({ transport, onChange }) => (
  <div className="flex gap-1 text-[8px] font-black">
    {(['rewind', 'stopped', 'play', 'record'] as const).map((t) => (
      <button
        key={t}
        type="button"
        onClick={() => onChange(t)}
        className={`px-1.5 py-1 rounded-2xs border ${
          transport === t ? (t === 'record' ? 'bg-red-600 text-white border-red-400' : 'bg-stone-100 text-stone-950 border-stone-400') : 'bg-stone-800 text-stone-300 border-stone-700'
        }`}
      >
        {t === 'stopped' ? 'STOP' : t.toUpperCase()}
      </button>
    ))}
  </div>
);

export const RackFaceplate: React.FC<{ children: React.ReactNode; className?: string; scratchOpacity?: number }> = ({ children, className = '', scratchOpacity = 0 }) => (
  <div className={`w-full bg-stone-900 border-2 border-stone-700 rounded-sm shadow-2xl p-3 select-none text-stone-200 font-mono relative overflow-hidden ${className}`}>
    {['top-2 left-1.5', 'bottom-2 left-1.5', 'top-2 right-1.5', 'bottom-2 right-1.5'].map((pos) => (
      <div key={pos} className={`absolute ${pos} w-2 h-4 rounded-xs border border-stone-500 bg-stone-950/80 flex items-center justify-center`}>
        <div className="w-1 h-2 bg-stone-400 rounded-full" />
      </div>
    ))}
    {children}
    {scratchOpacity > 0 && (
      <div
        data-testid="scratch-overlay"
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: scratchOpacity, backgroundImage: 'repeating-linear-gradient(115deg, transparent 0 7px, rgba(255,255,255,0.18) 7px 8px)' }}
      />
    )}
  </div>
);
