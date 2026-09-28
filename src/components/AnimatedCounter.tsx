
import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1000,
  className = "",
  prefix = "",
  suffix = ""
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const current = useRef(value);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const from = current.current;
    if (reducedMotion || duration <= 0) {
      current.current = value;
      setDisplayValue(value);
      return;
    }
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      current.current = Math.round(from + easeOutQuart * (value - from));
      setDisplayValue(current.current);
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration, reducedMotion]);

  return (
    <span className={`animated-counter ${className}`}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
};
