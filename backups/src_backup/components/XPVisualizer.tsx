import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { AnimatedNumber } from './AnimatedNumber';
import { useParticleBurst } from '../hooks/useParticleBurst';

interface XPVisualizerProps {
  xp: number;
  level: number;
  xpForNextLevel: number;
  gainedXP?: number;
}

export const XPVisualizer: React.FC<XPVisualizerProps> = ({
  xp,
  level,
  xpForNextLevel,
  gainedXP
}) => {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progress = (xp / xpForNextLevel) * 100;

  // Trigger particle effect when XP is gained
  // useParticleBurst(progressBarRef, !!gainedXP, {
  //   colors: ['#FFD700', '#FFA500', '#FF6347'],
  //   count: gainedXP ? Math.min(Math.ceil(gainedXP / 10), 20) : 0,
  //   spread: 60
  // });

  return (
    <div className="flex flex-col gap-2 p-4 bg-gray-800 rounded-lg">
      <div className="flex justify-between items-center">
        <span className="text-white font-medium">Level</span>
        <AnimatedNumber
          value={level}
          className="text-2xl font-bold text-yellow-500"
          duration={1.2}
        />
      </div>
      
      <div className="flex justify-between items-center text-sm text-gray-300">
        <AnimatedNumber
          value={xp}
          formatValue={(val) => `${Math.round(val)} XP`}
          className="font-medium"
        />
        <span>{xpForNextLevel} XP</span>
      </div>

      <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          ref={progressBarRef}
          className="absolute h-full bg-gradient-to-r from-yellow-500 to-yellow-400"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{
            type: "spring",
            damping: 15,
            stiffness: 100
          }}
        />
      </div>

      {gainedXP && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute right-0 -top-6"
        >
          <span className="text-green-500 font-bold">+{gainedXP} XP</span>
        </motion.div>
      )}
    </div>
  );
};
