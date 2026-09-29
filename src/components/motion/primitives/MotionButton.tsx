import React, { useRef, useState, useCallback } from 'react';
import { motion, type Transition } from 'framer-motion';
import { motionSpring } from '@/lib/motion/tokens';
import { useMotionCapabilities } from '@/lib/motion/capabilities';

export interface MotionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  /** Whether button exerts magnetic attraction toward cursor (default: false) */
  magnetic?: boolean;
  /** Max pixel displacement pull when magnetic is enabled (default: 3px) */
  magneticPull?: number;
  /** Scale factor during press depression (default: 0.96) */
  tapScale?: number;
  /** Custom transition to override motionSpring.press */
  transition?: Transition;
  className?: string;
}

export const MotionButton = React.forwardRef<HTMLButtonElement, MotionButtonProps>(
  (
    {
      children,
      magnetic = false,
      magneticPull = 3,
      tapScale = 0.96,
      transition,
      disabled = false,
      className = '',
      onMouseMove,
      onMouseLeave,
      type = 'button',
      ...rest
    },
    ref
  ) => {
    const internalRef = useRef<HTMLButtonElement | null>(null);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const { reducedMotion } = useMotionCapabilities();

    const handleMouseMove = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        onMouseMove?.(e);
        if (!magnetic || disabled || reducedMotion) return;
        const target = internalRef.current;
        if (!target) return;
        const rect = target.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = (e.clientX - centerX) / (rect.width / 2);
        const deltaY = (e.clientY - centerY) / (rect.height / 2);
        setOffset({
          x: Math.max(-magneticPull, Math.min(magneticPull, deltaX * magneticPull)),
          y: Math.max(-magneticPull, Math.min(magneticPull, deltaY * magneticPull)),
        });
      },
      [magnetic, disabled, reducedMotion, magneticPull, onMouseMove]
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        onMouseLeave?.(e);
        if (magnetic && !reducedMotion) {
          setOffset({ x: 0, y: 0 });
        }
      },
      [magnetic, reducedMotion, onMouseLeave]
    );

    const setRefs = useCallback(
      (node: HTMLButtonElement | null) => {
        internalRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        }
      },
      [ref]
    );

    const resolvedTransition = reducedMotion
      ? { duration: 0 }
      : (transition ?? motionSpring.press);

    return (
      <motion.button
        ref={setRefs}
        type={type}
        disabled={disabled}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={reducedMotion ? {} : { x: offset.x, y: offset.y }}
        whileHover={disabled || reducedMotion ? undefined : { y: offset.y - 1 }}
        whileTap={disabled || reducedMotion ? undefined : { scale: tapScale, y: offset.y + 1 }}
        transition={resolvedTransition}
        className={`select-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        {...(rest as any)}
      >
        {children}
      </motion.button>
    );
  }
);

MotionButton.displayName = 'MotionButton';
