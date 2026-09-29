import React from 'react';
import { motion, type Transition } from 'framer-motion';
import { motionSpring } from '@/lib/motion/tokens';
import { useMotionCapabilities } from '@/lib/motion/capabilities';

export type MotionPanelDirection = 'right' | 'left' | 'up' | 'down' | 'scale' | 'fade';

export interface MotionPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /**
   * Direction/mode of animation:
   * - 'right': contextual drawer slide-in from right edge (default)
   * - 'left': drawer slide-in from left edge
   * - 'up': bottom sheet slide-up
   * - 'down': top notification/drawer drop-down
   * - 'scale': centered modal card scale/pop
   * - 'fade': pure opacity fade
   */
  direction?: MotionPanelDirection;
  /** Custom transition to override motionSpring.drawer */
  transition?: Transition;
  className?: string;
}

export const MotionPanel = React.forwardRef<HTMLDivElement, MotionPanelProps>(
  (
    {
      children,
      direction = 'right',
      transition,
      className = '',
      ...rest
    },
    ref
  ) => {
    const { reducedMotion } = useMotionCapabilities();

    // Reduced motion variants: instant fade only, zero spatial displacement
    const reducedVariants = {
      initial: { opacity: 0 },
      animate: { opacity: 1, x: 0, y: 0, scale: 1 },
      exit: { opacity: 0 },
    };

    // Full motion variants based on direction
    const fullVariants = {
      right: {
        initial: { x: '100%', opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: '100%', opacity: 0 },
      },
      left: {
        initial: { x: '-100%', opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: '-100%', opacity: 0 },
      },
      up: {
        initial: { y: '100%', opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: { y: '100%', opacity: 0 },
      },
      down: {
        initial: { y: '-100%', opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: { y: '-100%', opacity: 0 },
      },
      scale: {
        initial: { scale: 0.95, y: 15, opacity: 0 },
        animate: { scale: 1, y: 0, opacity: 1 },
        exit: { scale: 0.95, y: 15, opacity: 0 },
      },
      fade: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      },
    };

    const variants = reducedMotion ? reducedVariants : fullVariants[direction];
    const resolvedTransition = reducedMotion
      ? { duration: 0 }
      : (transition ?? motionSpring.drawer);

    return (
      <motion.div
        ref={ref}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        transition={resolvedTransition}
        className={className}
        {...(rest as any)}
      >
        {children}
      </motion.div>
    );
  }
);

MotionPanel.displayName = 'MotionPanel';
