import React, { useRef, useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { motionSpring } from '@/lib/motion/tokens';

export interface MagneticPressProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Max pixel displacement pull (default: 4px) */
  pullDistance?: number;
  /** Spring physics preset */
  disabled?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

/**
 * OriginKit-derived tactile micro-motion: subtle spring attraction toward cursor
 * followed by a crisp mechanical press depression.
 * Renderer: DOM / CSS Transform (zero GPU canvas overhead).
 */
export const MagneticPress: React.FC<MagneticPressProps> = ({
  children,
  pullDistance = 4,
  disabled = false,
  className = '',
  onClick,
  ...rest
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const shouldReduceMotion = useReducedMotion();

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || shouldReduceMotion || !ref.current) return;
      const { left, top, width, height } = ref.current.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      const deltaX = (e.clientX - centerX) / (width / 2);
      const deltaY = (e.clientY - centerY) / (height / 2);
      setPosition({
        x: Math.max(-pullDistance, Math.min(pullDistance, deltaX * pullDistance)),
        y: Math.max(-pullDistance, Math.min(pullDistance, deltaY * pullDistance)),
      });
    },
    [disabled, shouldReduceMotion, pullDistance]
  );

  const handleMouseLeave = useCallback(() => {
    setPosition({ x: 0, y: 0 });
  }, []);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={disabled ? undefined : onClick}
      animate={shouldReduceMotion ? {} : { x: position.x, y: position.y }}
      whileTap={disabled || shouldReduceMotion ? undefined : { scale: 0.96, y: position.y + 1 }}
      transition={motionSpring.press}
      className={`inline-block select-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      {...(rest as any)}
    >
      {children}
    </motion.div>
  );
};
