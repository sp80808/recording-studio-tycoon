import React from 'react';
import { motion } from 'framer-motion';
import { motionDuration, motionEasing } from '@/lib/motion/tokens';
import { useMotionCapabilities } from '@/lib/motion/capabilities';

export type MotionRevealDirection = 'up' | 'down' | 'left' | 'right' | 'none';

export interface MotionRevealProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Delay in seconds before animation starts (default: 0) */
  delay?: number;
  /** Stagger index for staggered lists (multiplied by staggerDelay) */
  staggerIndex?: number;
  /** Stagger step in seconds per item (default: 0.05) */
  staggerDelay?: number;
  /** Duration in seconds (default: motionDuration.reveal = 0.45) */
  duration?: number;
  /** Entrance slide direction: up (default), down, left, right, none */
  direction?: MotionRevealDirection;
  /** Travel distance in pixels (default: 16) */
  distance?: number;
  className?: string;
  as?: 'div' | 'span' | 'li' | 'section' | 'article';
}

export const MotionReveal = React.forwardRef<HTMLDivElement, MotionRevealProps>(
  (
    {
      children,
      delay = 0,
      staggerIndex,
      staggerDelay = 0.05,
      duration = motionDuration.reveal,
      direction = 'up',
      distance = 16,
      className = '',
      as = 'div',
      ...rest
    },
    ref
  ) => {
    const { reducedMotion } = useMotionCapabilities();
    const totalDelay = delay + (staggerIndex !== undefined ? staggerIndex * staggerDelay : 0);

    const getInitialOffset = () => {
      switch (direction) {
        case 'up':
          return { y: distance };
        case 'down':
          return { y: -distance };
        case 'left':
          return { x: distance };
        case 'right':
          return { x: -distance };
        case 'none':
        default:
          return {};
      }
    };

    const initial = reducedMotion
      ? { opacity: 1, x: 0, y: 0 }
      : { opacity: 0, ...getInitialOffset() };

    const animate = { opacity: 1, x: 0, y: 0 };

    const transition = reducedMotion
      ? { duration: 0 }
      : {
          duration,
          delay: totalDelay,
          ease: motionEasing.settle,
        };

    const Component = (as === 'li'
      ? motion.li
      : as === 'span'
        ? motion.span
        : as === 'section'
          ? motion.section
          : as === 'article'
            ? motion.article
            : motion.div) as any;

    return (
      <Component
        ref={ref}
        initial={initial}
        animate={animate}
        transition={transition}
        className={className}
        {...rest}
      >
        {children}
      </Component>
    );
  }
);

MotionReveal.displayName = 'MotionReveal';
