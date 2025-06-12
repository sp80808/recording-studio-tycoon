import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { GameState } from '@/types/game';
import { getEraProgress } from '@/utils/eraProgression';

interface EraProgressProps {
  gameState: GameState;
  triggerEraTransition: () => void;
}

export const EraProgress: React.FC<EraProgressProps> = ({ gameState, triggerEraTransition }) => {
  const { currentEra, nextEra, progressPercent, canTransition } = getEraProgress(gameState);

  return (
    <Card className="bg-gray-800/90 border-gray-600 p-4 mb-4">
      <h3 className="text-lg font-bold text-white mb-3">🎵 Era Progression</h3>
      
      <div className="space-y-3">
        {/* Current Era */}
        <div>
          <div className="text-sm font-medium text-gray-300">Current Era</div>
          <div className="text-white font-bold">{currentEra.name}</div>
          <div className="text-xs text-gray-400">{currentEra.description}</div>
          <div className="text-xs text-blue-400 mt-1">Year: {gameState.currentYear}</div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Era Progress</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <Progress 
            value={progressPercent} 
            className="h-2"
            aria-label="Era progression progress"
          />
        </div>

        {/* Next Era */}
        {nextEra && (
          <div className="mt-4">
            <div className="text-sm font-medium text-gray-300">Next Era</div>
            <div className="text-green-400 font-bold">{nextEra.name}</div>
            <div className="text-xs text-gray-400">{nextEra.description}</div>
            
            {/* Requirements */}
            <div className="mt-2 space-y-1">
              <div className="text-xs text-gray-500">Requirements:</div>
              {nextEra.unlockRequirements.minReputation && (
                <div className="text-xs flex justify-between">
                  <span>Reputation:</span>
                  <span className={gameState.reputation >= nextEra.unlockRequirements.minReputation ? 'text-green-400' : 'text-red-400'}>
                    {gameState.reputation}/{nextEra.unlockRequirements.minReputation}
                  </span>
                </div>
              )}
              {nextEra.unlockRequirements.minLevel && (
                <div className="text-xs flex justify-between">
                  <span>Level:</span>
                  <span className={gameState.playerData.level >= nextEra.unlockRequirements.minLevel ? 'text-green-400' : 'text-red-400'}>
                    {gameState.playerData.level}/{nextEra.unlockRequirements.minLevel}
                  </span>
                </div>
              )}
              {nextEra.unlockRequirements.minDays && (
                <div className="text-xs flex justify-between">
                  <span>Days:</span>
                  <span className={gameState.currentDay >= nextEra.unlockRequirements.minDays ? 'text-green-400' : 'text-red-400'}>
                    {gameState.currentDay}/{nextEra.unlockRequirements.minDays}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transition Button */}
        {canTransition && (
          <Button 
            onClick={triggerEraTransition}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white mt-3"
          >
            🚀 Advance to {nextEra?.name}
          </Button>
        )}

        {!nextEra && (
          <div className="text-center text-gray-400 text-sm mt-3">
            🏆 You've reached the latest era! Continue building your legacy.
          </div>
        )}
      </div>
    </Card>
  );
};
