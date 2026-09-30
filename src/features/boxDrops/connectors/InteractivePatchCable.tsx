import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Cable, Zap } from 'lucide-react';
import type { Rarity } from '../lootGenerator';
import type { PatchSocket } from './HardwarePatchPanel';

interface InteractivePatchCableProps {
  isPatched: boolean;
  onTogglePatch: (target?: PatchSocket) => void;
  rarity: Rarity;
  activeSocket?: PatchSocket;
  disabled?: boolean;
}

export const InteractivePatchCable: React.FC<InteractivePatchCableProps> = ({
  isPatched,
  onTogglePatch,
  rarity,
  activeSocket = 'trs',
  disabled = false,
}) => {
  const reduceMotion = useReducedMotion();

  const cableColorMap: Record<Rarity, { main: string; glow: string; text: string; label: string }> = {
    legendary: { main: '#fbbf24', glow: 'rgba(251, 191, 36, 0.7)', text: 'text-amber-400', label: 'Gold Mogami TT Patch' },
    vintage: { main: '#c084fc', glow: 'rgba(192, 132, 252, 0.7)', text: 'text-purple-400', label: 'Vintage Cloth Bantam' },
    rare: { main: '#22d3ee', glow: 'rgba(34, 211, 238, 0.7)', text: 'text-cyan-400', label: 'Studio Pro XLR Line' },
    uncommon: { main: '#34d399', glow: 'rgba(52, 211, 153, 0.7)', text: 'text-emerald-400', label: 'Balanced TRS Patch' },
    common: { main: '#94a3b8', glow: 'rgba(148, 163, 184, 0.6)', text: 'text-stone-300', label: 'Standard Studio Cord' },
  };
  const cord = cableColorMap[rarity] || cableColorMap.common;

  const isXlr = activeSocket === 'xlr';
  const curvePath = isPatched
    ? isXlr
      ? 'M 40 48 C 100 54, 160 48, 205 28'
      : 'M 40 48 C 110 54, 185 50, 245 28'
    : 'M 40 48 C 100 58, 150 56, 210 44';

  const plugTargetX = isPatched ? (isXlr ? 24 : 64) : 30;
  const plugTargetY = isPatched ? -10 : 8;

  return (
    <div className="w-full flex flex-col items-center my-1 select-none">
      {/* SVG Canvas for Dynamic Curved Studio Patch Cable */}
      <div className="relative w-full h-14 flex items-center justify-center overflow-visible">
        <svg
          viewBox="0 0 360 56"
          className="w-full h-full overflow-visible pointer-events-none"
        >
          <defs>
            <filter id={`glow-${rarity}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Underlay Shadow */}
          <path
            d={curvePath}
            fill="none"
            stroke="rgba(0,0,0,0.7)"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* Outer Braided Cable Sleeve */}
          <path
            d={curvePath}
            fill="none"
            stroke="#1c1917"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Inner Colored Cable Core */}
          <path
            d={curvePath}
            fill="none"
            stroke={cord.main}
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeDasharray="4 2"
            filter={isPatched ? `url(#glow-${rarity})` : undefined}
          />

          {/* Signal flow animated pulses when patched */}
          {isPatched && !reduceMotion && (
            <motion.path
              d={curvePath}
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="8 20"
              animate={{ strokeDashoffset: [-56, 0] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
            />
          )}
        </svg>

        {/* Heavy-Duty Metallic Connector Plug (Interactive) */}
        <motion.div
          animate={
            reduceMotion
              ? {
                  x: plugTargetX,
                  y: isPatched ? -8 : 6,
                  rotate: isPatched ? -22 : -10,
                }
              : {
                  x: plugTargetX,
                  y: plugTargetY,
                  rotate: isPatched ? -24 : [-12, -8, -12],
                  scale: isPatched ? 1 : [1, 1.05, 1],
                }
          }
          transition={
            isPatched
              ? { type: 'spring', stiffness: 420, damping: 22 }
              : {
                  rotate: { repeat: Infinity, duration: 2.8, ease: 'easeInOut' },
                  scale: { repeat: Infinity, duration: 2.8, ease: 'easeInOut' },
                }
          }
          onClick={() => onTogglePatch()}
          className="absolute z-20 flex items-center cursor-pointer group focus:outline-none"
        >
          {/* Rubber Strain-Relief Spring Boot */}
          <div className="w-4 h-3 bg-gradient-to-r from-stone-900 to-stone-800 rounded-l-xs flex items-center justify-around px-0.5 border border-stone-700">
            <span className="w-0.5 h-full bg-stone-600 rounded-full" />
            <span className="w-0.5 h-full bg-stone-600 rounded-full" />
            <span className="w-0.5 h-full bg-stone-600 rounded-full" />
          </div>

          {/* Die-cast Nickel Barrel with knurled diamond grip */}
          <div className="w-7 h-4 bg-gradient-to-b from-stone-300 via-stone-100 to-stone-400 rounded-xs border border-stone-400 flex items-center justify-center shadow-md relative">
            <span className="text-[6px] font-mono font-black text-stone-900 tracking-tighter">
              {isXlr ? 'XLR' : 'TRS'}
            </span>
            <div className="absolute inset-x-1 inset-y-0.5 border-y border-stone-500/40 pointer-events-none" />
          </div>

          {/* Insulating sleeve ring */}
          <div className="w-1 h-3.5 bg-stone-950" />

          {/* Gold-Plated Shaft, Ring, and Tip */}
          <div className="flex items-center">
            <div className="w-3.5 h-2.5 bg-gradient-to-b from-yellow-300 via-amber-300 to-yellow-500 border-y border-amber-600" />
            <div className="w-0.8 h-2.5 bg-black" />
            <div className="w-2 h-2.5 bg-gradient-to-b from-yellow-300 via-amber-300 to-yellow-500 border-y border-amber-600" />
            <div className="w-0.8 h-2.5 bg-black" />
            <div className="w-2.5 h-2 bg-gradient-to-r from-amber-400 to-yellow-200 rounded-r-full border-r border-amber-600 shadow-xs" />
          </div>

          {/* Spark Burst on Mating */}
          {isPatched && !reduceMotion && (
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: [0, 1.8, 0], opacity: [1, 0.8, 0] }}
              transition={{ duration: 0.4 }}
              className="absolute -right-2 w-6 h-6 rounded-full pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${cord.main} 20%, transparent 70%)`,
              }}
            />
          )}
        </motion.div>
      </div>

      {/* Tactile Control & Connection Trigger Bar */}
      <div className="w-full flex items-center justify-between gap-2 px-1">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onTogglePatch()}
          aria-label={isPatched ? 'Disconnect audio patch cable' : 'Connect audio patch cable to audition gear'}
          className={`flex-1 py-1.5 px-3 rounded-sm border font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
            isPatched
              ? 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-stone-950 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
              : 'bg-stone-900 hover:bg-stone-800 text-stone-200 border-stone-700 hover:border-amber-400'
          }`}
        >
          {isPatched ? (
            <>
              <Zap size={14} className="fill-stone-950" />
              <span>PATCHED ({isXlr ? 'XLR BALANCED' : '1/4" INSERT'}) • UNPLUG</span>
            </>
          ) : (
            <>
              <Cable size={14} className={cord.text} />
              <span>CONNECT PATCH CABLE (AUDITION)</span>
            </>
          )}
        </button>

        <span className="text-[10px] font-mono text-stone-400 hidden sm:inline-block">
          {cord.label}
        </span>
      </div>
    </div>
  );
};
