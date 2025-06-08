
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GameState } from '@/types/game';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { XPProgressBar } from '@/components/XPProgressBar';

interface GameHeaderProps {
  gameState: GameState;
  onManageStaff?: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({ gameState, onManageStaff }) => {
  return (
    <Card className="bg-gray-900/90 border-gray-600 p-4 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-lg">💰</span>
            <AnimatedCounter value={gameState.money} prefix="$" className="text-green-400 font-bold" />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-blue-400 text-lg">⭐</span>
            <AnimatedCounter value={gameState.reputation} suffix=" Rep" className="text-blue-400 font-bold" />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 text-lg">📅</span>
            <span className="text-yellow-400 font-bold">Day {gameState.currentDay}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-purple-400 text-lg">👥</span>
            <span className="text-purple-400 font-bold">{gameState.hiredStaff.length} Staff</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-orange-400 text-lg">⚡</span>
            <span className="text-orange-400 font-bold">{gameState.playerData.perkPoints} Perk Points!</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Manage Staff Button - moved here from bottom */}
          {gameState.hiredStaff.length > 0 && onManageStaff && (
            <Button
              onClick={onManageStaff}
              variant="outline"
              size="sm"
              className="bg-blue-600/20 border-blue-500 text-blue-300 hover:bg-blue-600/30"
            >
              👥 Manage Staff ({gameState.hiredStaff.length})
            </Button>
          )}

          <div className="text-right">
            <div className="text-white font-bold text-lg">Level {gameState.playerData.level}</div>
            <XPProgressBar 
              currentXP={gameState.playerData.xp} 
              maxXP={gameState.playerData.xpToNextLevel} 
              className="w-32"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
