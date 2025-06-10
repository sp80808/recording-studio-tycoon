import React from 'react';
import { Progress } from '@/components/ui/progress';

interface XPProgressBarProps {
  xp: number;
  xpToNextLevel: number;
  level: number;
  className?: string;
  showNumbers?: boolean;
  animated?: boolean;
}

export const XPProgressBar: React.FC<XPProgressBarProps> = ({
  xp,
  xpToNextLevel,
  level,
  className = "",
  showNumbers = true,
  animated = true
}) => {
  const progressPercentage = (xp / xpToNextLevel) * 100;
  
  return (
    <div className={`xp-progress-container ${className}`}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-semibold text-purple-300">Level {level}</span>
        {showNumbers && (
          <span className="text-xs text-gray-400">{xp}/{xpToNextLevel} XP</span>
        )}
      </div>
      <div className="relative">
        <Progress 
          value={progressPercentage} 
          className={`h-3 bg-gray-700 ${animated ? 'transition-all duration-500' : ''}`}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-400 rounded-full opacity-75 animate-pulse" 
             style={{ width: `${progressPercentage}%` }}></div>
        {progressPercentage > 50 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-white drop-shadow-lg">
              {Math.round(progressPercentage)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
