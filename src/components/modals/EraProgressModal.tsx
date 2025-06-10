import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { GameState } from '@/types/game';
import { getEraProgress } from '@/utils/eraProgression';
import { getNextEvent as getNextHistoricalEvent } from '@/utils/historicalEvents';

interface EraProgressModalProps {
  gameState: GameState;
  isOpen: boolean;
  onClose: () => void;
  triggerEraTransition: () => void;
}

export const EraProgressModal: React.FC<EraProgressModalProps> = ({ 
  gameState, 
  isOpen, 
  onClose, 
  triggerEraTransition 
}) => {
  const { currentEra, nextEra, progressPercent, canTransition } = getEraProgress(gameState);
  const nextHistoricalEvent = getNextHistoricalEvent(gameState);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gray-800 border-gray-600 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <span className="text-2xl">{currentEra.icon}</span>
            Era Progression Timeline
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Era Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">{currentEra.name}</h3>
              <Badge className="bg-amber-600 text-white">
                Year: {gameState.currentYear}
              </Badge>
            </div>
            <p className="text-gray-300">{currentEra.description}</p>
            
            {/* Era Features */}
            <div>
              <h4 className="font-semibold text-gray-300 mb-2">Era Features:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {currentEra.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="text-green-400">✓</span>
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            {/* Available Genres */}
            <div>
              <h4 className="font-semibold text-gray-300 mb-2">Popular Genres:</h4>
              <div className="flex flex-wrap gap-2">
                {currentEra.availableGenres.map((genre) => (
                  <Badge key={genre} className="bg-purple-600 text-white">
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Progress to Next Era */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-gray-300">Era Progress</h4>
              <span className="text-sm text-gray-400">{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
          </div>

          {/* Next Era Preview */}
          {nextEra && (
            <div className="bg-gray-700/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{nextEra.icon}</span>
                <div>
                  <h4 className="font-bold text-green-400">Next Era: {nextEra.name}</h4>
                  <p className="text-sm text-gray-400">{nextEra.description}</p>
                </div>
              </div>

              {/* Requirements */}
              <div>
                <h5 className="text-sm font-semibold text-gray-300 mb-2">Unlock Requirements:</h5>
                <div className="grid grid-cols-2 gap-2">
                  {nextEra.unlockRequirements.minReputation && (
                    <div className="text-xs flex justify-between bg-gray-600/50 rounded px-2 py-1">
                      <span>Reputation:</span>
                      <span className={gameState.reputation >= nextEra.unlockRequirements.minReputation ? 'text-green-400' : 'text-red-400'}>
                        {gameState.reputation}/{nextEra.unlockRequirements.minReputation}
                      </span>
                    </div>
                  )}
                  {nextEra.unlockRequirements.minLevel && (
                    <div className="text-xs flex justify-between bg-gray-600/50 rounded px-2 py-1">
                      <span>Level:</span>
                      <span className={gameState.playerData.level >= nextEra.unlockRequirements.minLevel ? 'text-green-400' : 'text-red-400'}>
                        {gameState.playerData.level}/{nextEra.unlockRequirements.minLevel}
                      </span>
                    </div>
                  )}
                  {nextEra.unlockRequirements.minDays && (
                    <div className="text-xs flex justify-between bg-gray-600/50 rounded px-2 py-1">
                      <span>Days:</span>
                      <span className={gameState.currentDay >= nextEra.unlockRequirements.minDays ? 'text-green-400' : 'text-red-400'}>
                        {gameState.currentDay}/{nextEra.unlockRequirements.minDays}
                      </span>
                    </div>
                  )}
                  {nextEra.unlockRequirements.completedProjects && (
                    <div className="text-xs flex justify-between bg-gray-600/50 rounded px-2 py-1">
                      <span>Projects:</span>
                      <span className={Math.floor(gameState.reputation / 5) >= nextEra.unlockRequirements.completedProjects ? 'text-green-400' : 'text-red-400'}>
                        {Math.floor(gameState.reputation / 5)}/{nextEra.unlockRequirements.completedProjects}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* What's Coming */}
              <div>
                <h5 className="text-sm font-semibold text-gray-300 mb-2">Coming Features:</h5>
                <div className="space-y-1">
                  {nextEra.features.slice(0, 3).map((feature, index) => (
                    <div key={index} className="text-xs text-blue-400 flex items-center gap-2">
                      <span>→</span>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              {/* New Genres */}
              <div>
                <h5 className="text-sm font-semibold text-gray-300 mb-2">New Genres:</h5>
                <div className="flex flex-wrap gap-1">
                  {nextEra.availableGenres.filter(genre => !currentEra.availableGenres.includes(genre)).map((genre) => (
                    <Badge key={genre} className="bg-blue-600 text-white text-xs">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Upcoming Historical Event */}
          {nextHistoricalEvent && (
            <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-400 mb-2">📰 Upcoming Historical Event:</h4>
              <div className="space-y-2">
                <p className="text-sm text-gray-300">{nextHistoricalEvent.title}</p>
                <div className="text-xs text-gray-400">
                  Expected in {nextHistoricalEvent.triggerDay - gameState.currentDay} days ({nextHistoricalEvent.year})
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {canTransition ? (
              <Button 
                onClick={() => {
                  triggerEraTransition();
                  onClose();
                }}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                🚀 Advance to {nextEra?.name}
              </Button>
            ) : (
              <Button 
                disabled
                className="flex-1 bg-gray-600 text-gray-400 cursor-not-allowed"
              >
                {nextEra ? 'Requirements Not Met' : 'Latest Era Reached'}
              </Button>
            )}
            
            <Button 
              onClick={onClose}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
