import React from 'react';
import { motion } from 'framer-motion';
import { motionSpring } from '@/lib/motion/tokens';
import { useMotionCapabilities } from '@/lib/motion/capabilities';
import { GlowSweep } from '../origin/GlowSweep';

export interface MotionRewardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Whether the reward pop is active (default: true) */
  active?: boolean;
  /** Delay in seconds before reward pop triggers (default: 0) */
  delay?: number;
  /** Whether to mount celebratory shine sweep */
  glow?: boolean;
  /** Color theme for glow sheen */
  glowTone?: 'gold' | 'amber' | 'cyan' | 'emerald';
  className?: string;
  onAnimationComplete?: () => void;
}

export const MotionReward = React.forwardRef<HTMLDivElement, MotionRewardProps>(
  (
    {
      children,
      active = true,
      delay = 0,
      glow = false,
      glowTone = 'gold',
      className = '',
      onAnimationComplete,
      ...rest
    },
    ref
  ) => {
    const { reducedMotion, heavyEffects } = useMotionCapabilities();

    const initial = reducedMotion
      ? { opacity: 0 }
      : { scale: 0.7, opacity: 0, y: 10 };

    const animate = active
      ? reducedMotion
        ? { opacity: 1, scale: 1, y: 0 }
        : { scale: 1, opacity: 1, y: 0 }
      : initial;

    const transition = reducedMotion
      ? { duration: 0 }
      : { ...motionSpring.reward, delay };

    return (
      <motion.div
        ref={ref}
        initial={initial}
        animate={animate}
        transition={transition}
        onAnimationComplete={onAnimationComplete}
        className={`relative ${className}`}
        {...(rest as any)}
      >
        {children}
        {glow && active && heavyEffects && !reducedMotion && (
          <GlowSweep tone={glowTone} repeat={false} />
        )}
      </motion.div>
    );
  }
);

MotionReward.displayName = 'MotionReward';
