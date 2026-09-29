import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface ChassisGroundClipProps {
  isDetached: boolean;
  onDetach: () => void;
  disabled?: boolean;
}

export const ChassisGroundClip: React.FC<ChassisGroundClipProps> = ({
  isDetached,
  onDetach,
  disabled = false,
}) => {
  const reduceMotion = useReducedMotion();

  return (
    <button
      type="button"
      onClick={onDetach}
      disabled={disabled}
      aria-label={`Studio chassis grounding clamp (${isDetached ? 'detached' : 'grounded'})`}
      className="flex flex-col items-center group cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-400 p-1 rounded disabled:cursor-not-allowed select-none"
    >
      <div className="relative flex items-center justify-center">
        {/* Chassis brass grounding stud & wingnut */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-700 via-amber-500 to-yellow-600 border border-amber-300 shadow flex items-center justify-center">
          <div className="w-3.5 h-3.5 rounded-full bg-stone-900 border border-amber-600 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
          </div>
        </div>

        {/* Heavy copper alligator clip with braided ground strap */}
        <motion.div
          animate={
            isDetached
              ? { x: 12, y: -10, rotate: 30, opacity: 0.8 }
              : { x: 0, y: 0, rotate: 0, opacity: 1 }
          }
          transition={
            reduceMotion
              ? { duration: 0.1 }
              : { type: 'spring', stiffness: 320, damping: 20 }
          }
          className="absolute z-20 flex items-center pointer-events-none"
        >
          {/* Copper jaws biting stud */}
          <div className="w-6 h-4 bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 rounded-l-xs border border-amber-400 shadow-xs flex items-center justify-between px-0.5">
            <div className="w-1 h-2 bg-stone-900 rounded-xs" />
            <div className="w-1 h-2 bg-amber-300 rounded-xs" />
          </div>

          {/* Braided copper ground strap ribbon */}
          <div className="w-7 h-2 bg-gradient-to-r from-amber-700 via-yellow-700 to-stone-800 border-y border-amber-500/60" />
        </motion.div>
      </div>

      <div className="flex items-center gap-1 mt-1">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isDetached ? 'bg-emerald-400' : 'bg-amber-400 shadow-[0_0_3px_#fbbf24]'
          }`}
        />
        <span className="text-[7.5px] font-mono uppercase tracking-tight text-stone-300 font-bold">
          {isDetached ? 'UNGROUNDED' : 'CHASSIS BOND'}
        </span>
      </div>
    </button>
  );
};
