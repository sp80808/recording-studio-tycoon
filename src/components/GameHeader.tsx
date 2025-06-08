import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GameState } from '@/types/game';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { XPProgressBar } from '@/components/XPProgressBar';

interface GameHeaderProps {
  gameState: GameState;
  onOpenSettings?: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({ gameState, onOpenSettings }) => {
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
          {/* Settings Button */}
          {onOpenSettings && (
            <Button
              onClick={onOpenSettings}
              variant="outline"
              size="sm"
              className="bg-gray-600/20 border-gray-500 text-gray-300 hover:bg-gray-600/30"
            >
              ⚙️
            </Button>
          )}

          <div className="text-right">
            <div className="text-white font-bold text-lg">Level {gameState.playerData.level}</div>
            <XPProgressBar 
              currentXP={gameState.playerData.xp} 
              xpToNext={gameState.playerData.xpToNextLevel}
              level={gameState.playerData.level}
              className="w-32"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
