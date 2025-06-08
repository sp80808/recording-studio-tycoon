import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GameState } from '@/types/game';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { XPProgressBar } from '@/components/XPProgressBar';

interface GameHeaderProps {
  gameState: GameState;
  onManageStaff?: () => void;
  onOpenSettings?: () => void;
  onOpenRecruitment?: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({ gameState, onManageStaff, onOpenSettings, onOpenRecruitment }) => {
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
          {/* Recruitment Center Button - show when level >= 2 */}
          {gameState.playerData.level >= 2 && onOpenRecruitment && (
            <Button
              onClick={onOpenRecruitment}
              variant="outline"
              size="sm"
              className="bg-purple-600/20 border-purple-500 text-purple-300 hover:bg-purple-600/30"
            >
              👥 Recruitment Center
            </Button>
          )}

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
