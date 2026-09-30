import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Rarity } from '@/features/boxDrops/lootGenerator';
import { RARITY_FX_POLICY } from './rewardFx';

interface RarityMaterialSweepProps {
  rarity: Rarity;
  className?: string;
}

const RARITY_GRADIENTS: Record<Rarity, string> = {
  common: 'from-transparent via-stone-400/25 to-transparent',
  uncommon: 'from-transparent via-emerald-400/30 to-transparent',
  rare: 'from-transparent via-sky-400/40 to-transparent',
  vintage: 'from-transparent via-amber-400/50 to-transparent',
  legendary: 'from-transparent via-purple-400/60 to-transparent',
};

/**
 * Rarity Material Sweep Component
 * Sweeps a specular light gleam once (one-shot, settles) across the unboxed hardware card, tailored to the item's rarity.
 */
export const RarityMaterialSweep: React.FC<RarityMaterialSweepProps> = ({
  rarity,
  className = '',
}) => {
  const reducedMotion = useReducedMotion();

  if (reducedMotion || !RARITY_FX_POLICY[rarity].sweep) return null;

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden rounded-sm ${className}`}>
      <motion.div
        initial={{ x: '-120%', skewX: -25 }}
        animate={{ x: '220%', skewX: -25 }}
        transition={{
          duration: 1.1,
          ease: 'easeInOut',
        }}
        className={`absolute inset-y-0 w-1/2 bg-gradient-to-r ${RARITY_GRADIENTS[rarity]} blur-[1px]`}
      />
    </div>
  );
};
