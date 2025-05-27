
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
  processStageWork: () => void;
}

export const ActiveProject: React.FC<ActiveProjectProps> = ({
  gameState,
  focusAllocation,
  setFocusAllocation,
  processStageWork
}) => {
  const orbContainerRef = useRef<HTMLDivElement>(null);

  if (!gameState.activeProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8 text-center bg-black/50 backdrop-blur-sm border-gray-600">
          <div className="text-6xl mb-4">🎵</div>
          <h2 className="text-2xl font-bold mb-2 text-white">Studio Ready</h2>
          <p className="text-gray-300">Select a project from the left panel to get started</p>
          {gameState.playerData.level < 2 && (
            <p className="text-yellow-400 mt-2 text-sm">Reach level 2 to unlock staff recruitment!</p>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Project Dashboard */}
      <Card className="p-6 bg-black/50 backdrop-blur-sm border-gray-600">
        <h2 className="text-2xl font-bold mb-2 text-white">Working on: {gameState.activeProject.title}</h2>
        <div className="text-lg mb-4 text-gray-200">
          Stage {gameState.activeProject.currentStageIndex + 1} of {gameState.activeProject.stages.length}: {gameState.activeProject.stages[gameState.activeProject.currentStageIndex].stageName}
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div id="creativity-points" className="text-center">
            <div className="text-3xl mb-2">💙</div>
            <div className="text-xl font-bold text-white">{gameState.activeProject.accumulatedCPoints}</div>
            <div className="text-sm text-gray-300">Creativity</div>
          </div>
          <div id="technical-points" className="text-center">
            <div className="text-3xl mb-2">💚</div>
            <div className="text-xl font-bold text-white">{gameState.activeProject.accumulatedTPoints}</div>
            <div className="text-sm text-gray-300">Technical</div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Focus Allocation:</h3>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-2 text-gray-200">
                <span>Performance</span>
                <span>{focusAllocation.performance}%</span>
              </div>
              <Slider
                value={[focusAllocation.performance]}
                onValueChange={(value) => setFocusAllocation(prev => ({ ...prev, performance: value[0] }))}
                max={100}
                step={1}
              />
            </div>

            <div>
              <div className="flex justify-between mb-2 text-gray-200">
                <span>Sound Capture</span>
                <span>{focusAllocation.soundCapture}%</span>
              </div>
              <Slider
                value={[focusAllocation.soundCapture]}
                onValueChange={(value) => setFocusAllocation(prev => ({ ...prev, soundCapture: value[0] }))}
                max={100}
                step={1}
              />
            </div>

            <div>
              <div className="flex justify-between mb-2 text-gray-200">
                <span>Layering</span>
                <span>{focusAllocation.layering}%</span>
              </div>
              <Slider
                value={[focusAllocation.layering]}
                onValueChange={(value) => setFocusAllocation(prev => ({ ...prev, layering: value[0] }))}
                max={100}
                step={1}
              />
            </div>
          </div>

          <Button onClick={processStageWork} className="w-full bg-purple-600 hover:bg-purple-700 text-white" size="lg">
            Complete {gameState.activeProject.stages[gameState.activeProject.currentStageIndex].stageName} & Proceed
          </Button>
        </div>

        <div className="mt-4">
          <div className="text-sm text-gray-300 mb-2">Stage Progress</div>
          <Progress 
            value={(gameState.activeProject.stages[gameState.activeProject.currentStageIndex].workUnitsCompleted / gameState.activeProject.stages[gameState.activeProject.currentStageIndex].workUnitsBase) * 100} 
          />
        </div>
      </Card>

      {/* Orb Animation Container */}
      <div ref={orbContainerRef} className="absolute inset-0 pointer-events-none z-10"></div>
    </div>
  );
};
