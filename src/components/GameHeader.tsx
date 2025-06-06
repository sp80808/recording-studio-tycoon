
import React from 'react';
import { GameState } from '@/types/game';

interface GameHeaderProps {
  gameState: GameState;
}

export const GameHeader: React.FC<GameHeaderProps> = ({ gameState }) => {
  return (
    <div className="bg-gradient-to-r from-black/40 via-purple-900/30 to-black/40 backdrop-blur-sm border-b border-purple-500/30">
      <div className="flex justify-between items-center p-4">
        <div className="flex gap-6 items-center">
          <div className="stat-item text-green-400 font-bold text-lg">
            <span className="text-sm text-gray-300 mr-2">💰</span>
            ${gameState.money}
          </div>
          <div className="stat-item text-blue-400 font-medium">
            <span className="text-sm text-gray-300 mr-2">⭐</span>
            {gameState.reputation} Rep
          </div>
          <div className="stat-item text-yellow-400 font-medium">
            <span className="text-sm text-gray-300 mr-2">📅</span>
            Day {gameState.currentDay}
          </div>
          <div className="stat-item text-orange-400 font-medium">
            <span className="text-sm text-gray-300 mr-2">👥</span>
            {gameState.hiredStaff.length} Staff
          </div>
          {gameState.playerData.perkPoints > 0 && (
            <div className="stat-item text-pink-400 font-bold animate-pulse">
              <span className="text-sm text-gray-300 mr-2">🎯</span>
              {gameState.playerData.perkPoints} Perk Point{gameState.playerData.perkPoints !== 1 ? 's' : ''}!
            </div>
          )}
        </div>
        
        <div className="text-right text-sm">
          <div className="text-white font-bold">Music Studio Tycoon</div>
          <div className="text-gray-400">
            {gameState.activeProject ? `Working: ${gameState.activeProject.title}` : 'No Active Project'}
          </div>
        </div>
      </div>
    </div>
  );
};
