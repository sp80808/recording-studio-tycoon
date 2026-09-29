import React from 'react';
import { motion } from 'framer-motion';
import { useMotionCapabilities } from '@/lib/motion/capabilities';

export interface GlowSweepProps {
  /** Color theme for the sweep ray: amber, cyan, gold, emerald */
  tone?: 'amber' | 'cyan' | 'gold' | 'emerald';
  /** Cycle duration in seconds */
  duration?: number;
  /** Whether the effect runs continuously or once */
  repeat?: boolean;
  className?: string;
}

const TONE_GRADIENTS: Record<NonNullable<GlowSweepProps['tone']>, string> = {
  amber: 'linear-gradient(105deg, transparent 20%, rgba(245, 158, 11, 0.4) 50%, transparent 80%)',
  cyan: 'linear-gradient(105deg, transparent 20%, rgba(6, 182, 212, 0.4) 50%, transparent 80%)',
  gold: 'linear-gradient(105deg, transparent 20%, rgba(251, 191, 36, 0.5) 50%, transparent 80%)',
  emerald: 'linear-gradient(105deg, transparent 20%, rgba(16, 185, 129, 0.4) 50%, transparent 80%)',
};

/**
 * OriginKit-derived reward/card shimmer: a subtle directional light ray
 * sweeping across an element to signify rarity or completion.
 * Renderer: Pure CSS GPU-composited transform/opacity. Zero canvas allocation.
 */
export const GlowSweep: React.FC<GlowSweepProps> = ({
  tone = 'amber',
  duration = 2.4,
  repeat = true,
  className = '',
}) => {
  const { reducedMotion, decorativeMotion, isTabVisible } = useMotionCapabilities();

  if (reducedMotion || !decorativeMotion || !isTabVisible) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit] z-10 ${className}`}
    >
      <motion.div
        initial={{ x: '-150%', opacity: 0 }}
        animate={{ x: '150%', opacity: [0, 1, 0] }}
        transition={{
          duration,
          repeat: repeat ? Infinity : 0,
          repeatDelay: 1.5,
          ease: 'easeInOut',
        }}
        style={{
          background: TONE_GRADIENTS[tone],
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
};
