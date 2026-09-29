import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface SnakeCableConnectorProps {
  isDisconnected: boolean;
  onDisconnect: () => void;
  disabled?: boolean;
  tierAccent?: string;
}

export const SnakeCableConnector: React.FC<SnakeCableConnectorProps> = ({
  isDisconnected,
  onDisconnect,
  disabled = false,
  tierAccent = '#06b6d4',
}) => {
  const reduceMotion = useReducedMotion();

  return (
    <button
      type="button"
      onClick={onDisconnect}
      disabled={disabled}
      aria-label={`Studio multi-pin audio snake connector (${isDisconnected ? 'disconnected' : 'mated'})`}
      className="flex flex-col items-center group cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-400 p-1 rounded disabled:cursor-not-allowed select-none"
    >
      <div className="relative flex items-center justify-center">
        {/* Receptacle collar in case wall */}
        <div className="w-11 h-11 rounded-full bg-gradient-to-b from-stone-700 via-stone-800 to-stone-950 border-2 border-stone-500 shadow-inner flex items-center justify-center">
          {/* Keyed alignment notch (red dot) */}
          <div className="absolute top-1 w-1.5 h-1.5 rounded-full bg-rose-500 border border-white shadow-xs" />

          {/* Internal multi-pin socket grid */}
          <div className="w-7 h-7 rounded-full bg-stone-900 border border-stone-700 flex flex-wrap items-center justify-center gap-0.5 p-1">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className={`w-1 h-1 rounded-full ${
                  isDisconnected ? 'bg-stone-700' : 'bg-amber-400 shadow-[0_0_2px_#fbbf24]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Plug Housing with spring detent ring (pulls back when disconnected) */}
        <motion.div
          animate={
            isDisconnected
              ? { x: -14, y: 12, rotate: -25, opacity: 0.85 }
              : { x: 0, y: 0, rotate: 0, opacity: 1 }
          }
          transition={
            reduceMotion
              ? { duration: 0.1 }
              : { type: 'spring', stiffness: 300, damping: 22 }
          }
          className="absolute z-20 flex items-center pointer-events-none"
        >
          {/* Knurled aluminum coupling nut */}
          <div className="w-5 h-7 bg-gradient-to-r from-stone-400 via-stone-200 to-stone-400 rounded-xs border border-stone-500 shadow flex flex-col justify-between py-0.5 px-0.5">
            <div className="w-full h-0.5 bg-stone-600" />
            <div className="w-full h-0.5 bg-stone-600" />
            <div className="w-full h-0.5 bg-stone-600" />
          </div>

          {/* Rubber strain-relief boot & thick shielded snake cable */}
          <div className="w-6 h-5 bg-stone-900 rounded-r-sm border-y border-r border-stone-700 flex items-center">
            <div className="w-full h-2.5 bg-stone-950 border-y border-stone-800" />
          </div>
        </motion.div>
      </div>

      <div className="flex items-center gap-1 mt-1">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isDisconnected ? 'bg-emerald-400' : 'bg-cyan-400 animate-pulse'
          }`}
        />
        <span className="text-[7.5px] font-mono uppercase tracking-tight text-stone-300 font-bold">
          {isDisconnected ? 'SNAKE OFF' : 'AUDIO BUS IN'}
        </span>
      </div>
    </button>
  );
};
