import React from 'react';
import { MotionNumber } from '@/components/motion/primitives/MotionNumber';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration,
  className = '',
  prefix = '',
  suffix = ''
}) => {
  return (
    <MotionNumber
      value={value}
      className={`animated-counter ${className}`}
      prefix={prefix}
      suffix={suffix}
    />
  );
};
