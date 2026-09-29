import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Rarity } from '@/features/boxDrops/lootGenerator';
import { Sparkles, Disc3, Radio, Zap } from 'lucide-react';

interface AnimatedGearFlourishProps {
  rarity: Rarity;
  era: string;
  name: string;
  className?: string;
}

/**
 * Animated Gear Flourish Component
 * Provides an authored visual burst (spinning tape reel, glowing vacuum tube filament, or digital LED bar)
 * when equipment materializes from silhouette into reality.
 */
export const AnimatedGearFlourish: React.FC<AnimatedGearFlourishProps> = ({
  rarity,
  era,
  name,
  className = '',
}) => {
  const reducedMotion = useReducedMotion();

  const isTapeGear = name.toLowerCase().includes('tape') || name.toLowerCase().includes('reel');
  const isTubeGear = era.includes('1960') || era.includes('1970') || rarity === 'vintage';

  return (
    <div className={`relative flex items-center justify-center p-3 select-none ${className}`}>
      {/* Tape Reel Animation */}
      {isTapeGear ? (
        <div className="flex items-center gap-3">
          <motion.div
            animate={reducedMotion ? {} : { rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }}
            className="w-12 h-12 rounded-full border-2 border-stone-400 bg-stone-900 flex items-center justify-center text-amber-400 shadow-md"
          >
            <Disc3 size={28} />
          </motion.div>
          <div className="w-10 h-0.5 bg-amber-900 border-b border-amber-500/50" />
          <motion.div
            animate={reducedMotion ? {} : { rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }}
            className="w-12 h-12 rounded-full border-2 border-stone-400 bg-stone-900 flex items-center justify-center text-amber-400 shadow-md"
          >
            <Disc3 size={28} />
          </motion.div>
        </div>
      ) : isTubeGear ? (
        /* Vacuum Tube Filament Glow */
        <div className="flex items-center gap-3">
          {[1, 2].map((tube) => (
            <div
              key={tube}
              className="w-9 h-14 rounded-t-full border border-amber-500/40 bg-gradient-to-b from-amber-950/40 to-stone-950 relative flex flex-col items-center justify-center overflow-hidden shadow-[0_0_12px_rgba(245,158,11,0.2)]"
            >
              {/* Glass Reflection */}
              <div className="absolute top-1 left-1 w-1.5 h-6 bg-white/20 rounded-full blur-[0.5px]" />
              {/* Glowing Filament */}
              <motion.div
                animate={
                  reducedMotion
                    ? {}
                    : {
                        opacity: [0.6, 1.0, 0.75],
                        scale: [0.95, 1.05, 0.95],
                      }
                }
                transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                className="w-2.5 h-6 bg-gradient-to-b from-amber-300 via-orange-500 to-red-600 rounded-full blur-[1px] shadow-[0_0_8px_#f59e0b]"
              />
              <Zap size={10} className="text-amber-300 absolute bottom-1" />
            </div>
          ))}
        </div>
      ) : (
        /* Digital Studio Signal & LED Meter Flourish */
        <div className="flex flex-col items-center gap-1.5 bg-stone-950 border border-stone-800 rounded px-4 py-2">
          <div className="flex items-center gap-1">
            <Radio size={12} className="text-cyan-400 animate-pulse" />
            <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
              HARDWARE SIGNAL ACQUIRED
            </span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((led) => (
              <motion.div
                key={led}
                animate={
                  reducedMotion
                    ? {}
                    : {
                        opacity: [0.3, 1, 0.4],
                      }
                }
                transition={{
                  repeat: Infinity,
                  duration: 0.6,
                  delay: led * 0.08,
                }}
                className={`w-2 h-3 rounded-2xs ${
                  led > 6 ? 'bg-red-500' : led > 4 ? 'bg-amber-400' : 'bg-emerald-400'
                } shadow-sm`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
