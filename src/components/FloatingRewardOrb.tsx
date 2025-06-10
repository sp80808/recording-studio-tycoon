
import React, { useEffect, useState } from 'react';

interface FloatingRewardOrbProps {
  type: 'xp' | 'money' | 'reputation';
  amount: number;
  onComplete?: () => void;
}

export const FloatingRewardOrb: React.FC<FloatingRewardOrbProps> = ({
  type,
  amount,
  onComplete
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const getOrbStyle = () => {
    switch (type) {
      case 'xp':
        return 'bg-gradient-to-r from-purple-500 to-cyan-400 text-white';
      case 'money':
        return 'bg-gradient-to-r from-green-500 to-emerald-400 text-white';
      case 'reputation':
        return 'bg-gradient-to-r from-yellow-500 to-orange-400 text-white';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-400 text-white';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'xp': return '⭐';
      case 'money': return '💰';
      case 'reputation': return '🌟';
      default: return '✨';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
      <div className={`
        flex items-center gap-2 px-4 py-2 rounded-full shadow-lg
        ${getOrbStyle()}
        animate-[bounce_0.5s_ease-in-out,fade-in_0.3s_ease-out]
        font-bold text-sm
      `}>
        <span className="text-lg">{getIcon()}</span>
        <span>+{amount} {type.toUpperCase()}</span>
      </div>
    </div>
  );
};
