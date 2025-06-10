import React from 'react';
import { motion } from 'framer-motion';
import { BaseMinigameProps } from '@/types/game';

export const BaseMinigame: React.FC<BaseMinigameProps> = ({
  type,
  difficulty,
  onComplete,
  onFail,
  onClose,
  children,
  title,
  description
}) => {
  const [score, setScore] = React.useState(0);
  const [timeLeft, setTimeLeft] = React.useState(60); // Base time in seconds
  const [isActive, setIsActive] = React.useState(true);

  React.useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          setIsActive(false);
          onFail();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, onFail]);

  const handleComplete = (finalScore: number) => {
    setIsActive(false);
    setScore(finalScore);
    onComplete(finalScore);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="relative w-full max-w-4xl bg-gray-900 rounded-lg shadow-xl p-6 m-4"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{title || 'Production Challenge'}</h2>
            {description && (
              <p className="text-gray-400">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="relative">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}; 