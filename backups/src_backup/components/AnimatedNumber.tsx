import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatValue?: (value: number) => string;
  className?: string;
  onComplete?: () => void;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 0.8,
  formatValue = (val) => Math.round(val).toString(),
  className = '',
  onComplete
}) => {
  const [displayValue, setDisplayValue] = React.useState(formatValue(value));

  return (
    <motion.span
      className={className}
      role="text"
      aria-live="polite"
      initial={{ opacity: 1 }}
      animate={{
        opacity: [1, 0.8, 1],
        scale: [1, 1.1, 1],
        transition: { duration: duration }
      }}
      onAnimationComplete={onComplete}
      key={value} // Force animation restart on value change
      onUpdate={(latest) => {
        // Interpolate the value during animation
        const progress = latest.opacity === 0.8 ? 0.5 : 0;
        const currentValue = value + (value - Number(displayValue.replace(/\D/g, ''))) * progress;
        setDisplayValue(formatValue(currentValue));
      }}
    >
      {displayValue}
    </motion.span>
  );
};

// Example usage:
// <AnimatedNumber 
//   value={xp} 
//   formatValue={(val) => `${val} XP`}
//   className="text-2xl font-bold text-yellow-500"
//   onComplete={() => console.log('Animation complete')}
// />
