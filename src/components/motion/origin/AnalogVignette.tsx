import React from 'react';
import { motion } from 'framer-motion';
import { useMotionCapabilities } from '@/lib/motion/capabilities';

export interface AnalogVignetteProps {
  /** Vignette intensity preset */
  intensity?: 'subtle' | 'warm' | 'crt';
  className?: string;
}

const VIGNETTE_STYLES = {
  subtle: 'radial-gradient(circle, transparent 65%, rgba(0, 0, 0, 0.45) 100%)',
  warm: 'radial-gradient(circle, rgba(245, 158, 11, 0.02) 60%, rgba(30, 15, 5, 0.6) 100%)',
  crt: 'radial-gradient(circle, transparent 55%, rgba(0, 0, 0, 0.7) 100%)',
};

/**
 * OriginKit-derived lightweight ambient vintage vignette:
 * Simulates analog tube/CRT falloff at viewport edges without canvas or shader passes.
 * Renderer: CSS GPU-composited radial gradient.
 */
export const AnalogVignette: React.FC<AnalogVignetteProps> = ({
  intensity = 'warm',
  className = '',
}) => {
  const { reducedMotion, decorativeMotion, isTabVisible } = useMotionCapabilities();

  if (reducedMotion || !decorativeMotion || !isTabVisible) {
    return null;
  }

  return (
    <motion.div
      aria-hidden="true"
      initial={{ opacity: 0.8 }}
      animate={{ opacity: [0.75, 0.85, 0.75] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      className={`fixed inset-0 pointer-events-none z-30 ${className}`}
      style={{
        background: VIGNETTE_STYLES[intensity],
      }}
    />
  );
};
