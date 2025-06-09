
import React from 'react';
import { GameState } from '@/types/game';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface LeftPanelProps {
  gameState: GameState;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({ gameState }) => {
  return (
    <div className="w-80 bg-gray-900/90 backdrop-blur-sm border-r border-gray-700 p-4">
      <h2 className="text-lg font-semibold text-white mb-4">Studio Overview</h2>
      
      <div className="space-y-4">
        <Card className="p-3 bg-gray-800/50 border-gray-600">
          <h3 className="text-sm font-semibold text-white mb-2">Current Era</h3>
          <div className="text-white">{gameState.currentEra}</div>
          <div className="text-gray-400 text-sm">Year: {gameState.currentYear}</div>
        </Card>

        <Card className="p-3 bg-gray-800/50 border-gray-600">
          <h3 className="text-sm font-semibold text-white mb-2">Studio Stats</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Staff:</span>
              <span className="text-white">{gameState.hiredStaff.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Equipment:</span>
              <span className="text-white">{gameState.ownedEquipment.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Bands:</span>
              <span className="text-white">{gameState.playerBands.length}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
