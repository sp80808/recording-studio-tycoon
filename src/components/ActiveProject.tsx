
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { GameState, FocusAllocation } from '@/types/game';

interface ActiveProjectProps {
  gameState: GameState;
  focusAllocation: FocusAllocation;
  setFocusAllocation: React.Dispatch<React.SetStateAction<FocusAllocation>>;
  performDailyWork: () => void;
}

export const ActiveProject: React.FC<ActiveProjectProps> = ({
  gameState,
  focusAllocation,
  setFocusAllocation,
  performDailyWork
}) => {
  const orbContainerRef = useRef<HTMLDivElement>(null);

  if (!gameState.activeProject) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <Card className="p-6 sm:p-8 text-center bg-black/50 backdrop-blur-sm border-gray-600 mx-4 max-w-sm">
          <div className="text-4xl sm:text-6xl mb-4">🎵</div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2 text-white">Studio Ready</h2>
          <p className="text-sm sm:text-base text-gray-300">Select a project from above to get started</p>
          {gameState.playerData.level < 2 && (
            <p className="text-yellow-400 mt-2 text-xs sm:text-sm">Reach level 2 to unlock staff recruitment!</p>
          )}
        </Card>
      </div>
    );
  }

  // Additional safety checks for stages
  if (!gameState.activeProject.stages || gameState.activeProject.stages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <Card className="p-6 sm:p-8 text-center bg-black/50 backdrop-blur-sm border-gray-600 mx-4 max-w-sm">
          <div className="text-4xl sm:text-6xl mb-4">⚠️</div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2 text-white">Project Error</h2>
          <p className="text-sm sm:text-base text-gray-300">This project has no stages defined</p>
        </Card>
      </div>
    );
  }

  // Ensure currentStageIndex is valid
  const currentStageIndex = Math.min(
    Math.max(0, gameState.activeProject.currentStageIndex || 0),
    gameState.activeProject.stages.length - 1
  );

  const currentStage = gameState.activeProject.stages[currentStageIndex];

  if (!currentStage) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <Card className="p-6 sm:p-8 text-center bg-black/50 backdrop-blur-sm border-gray-600 mx-4 max-w-sm">
          <div className="text-4xl sm:text-6xl mb-4">⚠️</div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2 text-white">Stage Error</h2>
          <p className="text-sm sm:text-base text-gray-300">Current stage is not available</p>
        </Card>
      </div>
    );
  }

  const isStageComplete = currentStage.workUnitsCompleted >= currentStage.workUnitsBase;
  const progressPercentage = (currentStage.workUnitsCompleted / currentStage.workUnitsBase) * 100;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Active Project Dashboard */}
      <Card className="p-4 sm:p-6 bg-black/50 backdrop-blur-sm border-gray-600">
        <h2 className="text-lg sm:text-2xl font-bold mb-2 text-white break-words">Working on: {gameState.activeProject.title}</h2>
        <div className="text-sm sm:text-lg mb-4 text-gray-200">
          Stage {currentStageIndex + 1} of {gameState.activeProject.stages.length}: {currentStage.stageName}
        </div>
        
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div id="creativity-points" className="text-center">
            <div className="text-2xl sm:text-3xl mb-2">💙</div>
            <div className="text-lg sm:text-xl font-bold text-white">{gameState.activeProject.accumulatedCPoints}</div>
            <div className="text-xs sm:text-sm text-gray-300">Creativity</div>
          </div>
          <div id="technical-points" className="text-center">
            <div className="text-2xl sm:text-3xl mb-2">💚</div>
            <div className="text-lg sm:text-xl font-bold text-white">{gameState.activeProject.accumulatedTPoints}</div>
            <div className="text-xs sm:text-sm text-gray-300">Technical</div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-white">Focus Allocation:</h3>
          
          <div className="space-y-4 sm:space-y-3">
            <div>
              <div className="flex justify-between mb-2 text-sm sm:text-base text-gray-200">
                <span>Performance</span>
                <span className="font-semibold">{focusAllocation.performance}%</span>
              </div>
              <Slider
                value={[focusAllocation.performance]}
                onValueChange={(value) => setFocusAllocation(prev => ({ ...prev, performance: value[0] }))}
                max={100}
                step={1}
                className="touch-manipulation"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2 text-sm sm:text-base text-gray-200">
                <span>Sound Capture</span>
                <span className="font-semibold">{focusAllocation.soundCapture}%</span>
              </div>
              <Slider
                value={[focusAllocation.soundCapture]}
                onValueChange={(value) => setFocusAllocation(prev => ({ ...prev, soundCapture: value[0] }))}
                max={100}
                step={1}
                className="touch-manipulation"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2 text-sm sm:text-base text-gray-200">
                <span>Layering</span>
                <span className="font-semibold">{focusAllocation.layering}%</span>
              </div>
              <Slider
                value={[focusAllocation.layering]}
                onValueChange={(value) => setFocusAllocation(prev => ({ ...prev, layering: value[0] }))}
                max={100}
                step={1}
                className="touch-manipulation"
              />
            </div>
          </div>

          <div className="bg-gray-800/50 p-3 rounded">
            <div className="text-sm text-gray-300 mb-2">Daily Work Capacity: {gameState.playerData.dailyWorkCapacity} Work Units</div>
            <div className="text-xs text-gray-400">Each work session advances 1 day and contributes your full daily capacity to the current stage.</div>
          </div>

          <Button 
            onClick={performDailyWork} 
            disabled={isStageComplete}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white touch-manipulation py-3 sm:py-2 text-sm sm:text-base" 
            size="lg"
          >
            {isStageComplete ? 'Stage Complete - Next Day Will Advance' : `Work on ${currentStage.stageName} (1 Day)`}
          </Button>
        </div>

        <div className="mt-4">
          <div className="text-xs sm:text-sm text-gray-300 mb-2">
            Stage Progress: {currentStage.workUnitsCompleted}/{currentStage.workUnitsBase} Work Units
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2 sm:h-auto"
          />
        </div>
      </Card>

      {/* Orb Animation Container */}
      <div ref={orbContainerRef} className="absolute inset-0 pointer-events-none z-10"></div>
    </div>
  );
};
