
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface XPProgressBarProps {
  currentXP: number;
  xpToNext: number;
  level: number;
  className?: string;
  showNumbers?: boolean;
  animated?: boolean;
  currentXPLab?: string; // Add prop for XP label
}

export const XPProgressBar: React.FC<XPProgressBarProps> = ({
  currentXP,
  xpToNext,
  level,
  className = "",
  showNumbers = true,
  animated = true,
  currentXPLab = "XP" // Default to "XP"
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
          <span className="text-xs text-stone-400">{safeCurrentXP}/{safeXpToNext} {currentXPLab}</span>
        )}
      </div>
      
      <div className="relative group">
        <Progress 
          value={progressPercentage} 
          className={`h-4 bg-stone-700/50 border border-stone-600 ${animated ? 'transition-all duration-700' : ''}`}
          aria-label="Player experience progress"
        />
        
        {/* Solid brass fill; near a level-up it breathes once instead of shimmering */}
        <div 
          className={`absolute inset-0 rounded-full bg-[var(--rst-brass-400)]
                     ${isNearLevelUp ? 'animate-pulse opacity-95' : 'opacity-85'} 
                     ${animated ? 'transition-all duration-700' : ''}`}
          style={{ width: `${progressPercentage}%` }}
        />
        
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
              progressPercentage >= milestone ? 'bg-teal-400' : 'bg-stone-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
