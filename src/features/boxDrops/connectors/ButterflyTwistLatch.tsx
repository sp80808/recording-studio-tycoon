import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface ButterflyTwistLatchProps {
  side: 'left' | 'right';
  isOpen: boolean;
  onToggle: () => void;
  disabled?: boolean;
  accentColor?: string;
}

export const ButterflyTwistLatch: React.FC<ButterflyTwistLatchProps> = ({
  side,
  isOpen,
  onToggle,
  disabled = false,
  accentColor = '#f59e0b',
}) => {
  const reduceMotion = useReducedMotion();

  // Rotation: 0deg when locked, 90deg when open
  const wingRotation = isOpen ? (side === 'left' ? -90 : 90) : 0;

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-label={`${side} butterfly twist latch (${isOpen ? 'unlatched' : 'locked'})`}
      className="relative flex flex-col items-center justify-center p-2 rounded focus:outline-none focus:ring-2 focus:ring-amber-400 group cursor-pointer transition-transform active:scale-95 disabled:cursor-not-allowed"
    >
      {/* Recessed mounting dish plate */}
      <div className="w-14 h-18 bg-gradient-to-b from-stone-800 via-stone-900 to-stone-950 border-2 border-stone-600 rounded-sm shadow-[inset_0_2px_8px_rgba(0,0,0,0.85)] relative flex flex-col items-center justify-between p-1.5">
        {/* Chrome mounting rivets in four corners */}
        <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-stone-300 border border-stone-700 shadow-xs" />
        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-stone-300 border border-stone-700 shadow-xs" />
        <div className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-stone-300 border border-stone-700 shadow-xs" />
        <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-stone-300 border border-stone-700 shadow-xs" />

        {/* Top Strike Hook Plate */}
        <div className="w-7 h-2.5 bg-gradient-to-b from-stone-400 to-stone-600 rounded-xs border border-stone-300 flex items-center justify-center shadow-xs">
          <div className="w-3.5 h-0.5 bg-stone-900 rounded-full" />
        </div>

        {/* Center Butterfly Wing (Rotates 90 degrees with spring physics) */}
        <div className="relative w-10 h-10 flex items-center justify-center">
          {/* Circular mounting bezel */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-stone-700 via-stone-500 to-stone-800 border border-stone-400 shadow-inner flex items-center justify-center">
            <div className="w-3.5 h-3.5 rounded-full bg-stone-950 border border-stone-600" />
          </div>

          {/* Stamped steel butterfly wing handle */}
          <motion.div
            animate={{
              rotate: wingRotation,
              y: isOpen ? (side === 'left' ? -2 : -2) : 0,
            }}
            transition={
              reduceMotion
                ? { duration: 0.1 }
                : { type: 'spring', stiffness: 350, damping: 20 }
            }
            className="absolute inset-0 flex items-center justify-center pointer-events-none drop-shadow-md"
          >
            <div className="w-9 h-4 bg-gradient-to-r from-stone-300 via-stone-100 to-stone-300 rounded-xs border border-stone-400 shadow flex items-center justify-between px-1">
              <div className="w-1.5 h-2 rounded-xs bg-stone-500" />
              <div className="w-2 h-2 rounded-full bg-stone-700 border border-stone-400" />
              <div className="w-1.5 h-2 rounded-xs bg-stone-500" />
            </div>
          </motion.div>
        </div>

        {/* Bottom Latch status indicator LED */}
        <div className="flex items-center gap-1">
          <div
            className={`w-1.5 h-1.5 rounded-full border transition-colors ${
              isOpen
                ? 'bg-emerald-400 border-emerald-200 shadow-[0_0_5px_#34d399]'
                : 'bg-rose-500 border-rose-300 shadow-[0_0_4px_#f43f5e]'
            }`}
          />
          <span className="text-[7.5px] font-mono font-bold uppercase tracking-tighter text-stone-300">
            {isOpen ? 'FREE' : 'LOCK'}
          </span>
        </div>
      </div>

      <span className="text-[8px] font-mono font-semibold uppercase text-stone-400 mt-1">
        {side} LATCH
      </span>
    </button>
  );
};
