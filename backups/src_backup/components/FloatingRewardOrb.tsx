import React from 'react';
import { motion } from 'framer-motion';

interface FloatingRewardOrbProps {
  currentTheme: 'modern' | 'vintage' | 'dark' | 'light';
}

export const FloatingRewardOrb: React.FC<FloatingRewardOrbProps> = ({ currentTheme }) => {
  const themeColors = {
    modern: 'bg-blue-500',
    vintage: 'bg-amber-500',
    dark: 'bg-purple-500',
    light: 'bg-blue-400'
  };

  return (
    <motion.div
      className={`fixed bottom-4 right-4 w-16 h-16 ${themeColors[currentTheme]} rounded-full shadow-lg flex items-center justify-center text-white text-2xl`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      🎁
    </motion.div>
  );
}; 