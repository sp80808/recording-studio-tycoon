
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface XPProgressBarProps {
  currentXP: number;
  xpToNext: number;
  level: number;
  className?: string;
  showNumbers?: boolean;
  animated?: boolean;
}

export const XPProgressBar: React.FC<XPProgressBarProps> = ({
  currentXP,
  xpToNext,
  level,
  className = "",
  showNumbers = true,
  animated = true
}) => {
  // FIXED: Prevent NaN by ensuring xpToNext is never 0
  const safeXpToNext = Math.max(1, xpToNext || 1); // Ensure at least 1
  const safeCurrentXP = Math.max(0, Math.min(currentXP || 0, safeXpToNext));
  
  // FIXED: Safe division that prevents NaN
  const progressPercentage = safeXpToNext > 0 ? 
    Math.min(100, Math.max(0, (safeCurrentXP / safeXpToNext) * 100)) : 0;
  
  const isNearLevelUp = progressPercentage > 80;
  
  return (
    <div className={`xp-progress-container ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-purple-300 flex items-center gap-2">
          <span className="text-yellow-400">⭐</span>
          Level {level}
        </span>
        {showNumbers && (
          <span className="text-xs text-gray-400">{safeCurrentXP}/{safeXpToNext} XP</span>
        )}
      </div>
      
      <div className="relative group">
        <Progress 
          value={progressPercentage} 
          className={`h-4 bg-gray-700/50 border border-gray-600 ${animated ? 'transition-all duration-700' : ''}`}
        />
        
        {/* Animated gradient overlay */}
        <div 
          className={`absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-400 to-cyan-300 rounded-full 
                     ${isNearLevelUp ? 'animate-pulse opacity-90' : 'opacity-75'} 
                     ${animated ? 'transition-all duration-700' : ''}`}
          style={{ width: `${progressPercentage}%` }}
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
        </div>
        
        {/* Percentage text - only show when progress is significant */}
        {progressPercentage > 15 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-white drop-shadow-lg">
              {Math.round(progressPercentage)}%
            </span>
          </div>
        )}
        
        {/* Level up ready indicator */}
        {isNearLevelUp && (
          <div className="absolute -top-1 -right-1">
            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
            <div className="absolute top-0 right-0 w-3 h-3 bg-yellow-500 rounded-full"></div>
          </div>
        )}
      </div>
      
      {/* Progress milestone markers */}
      <div className="flex justify-between mt-1 px-1">
        {[25, 50, 75].map(milestone => (
          <div 
            key={milestone}
            className={`w-1 h-1 rounded-full transition-colors duration-300 ${
              progressPercentage >= milestone ? 'bg-cyan-400' : 'bg-gray-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
