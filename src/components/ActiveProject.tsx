
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { GameState, FocusAllocation } from '@/types/game';
import { MinigameManager, MinigameType } from './minigames/MinigameManager';
import { getTriggeredMinigames } from '@/utils/minigameUtils';
import { AnimatedStatBlobs } from './AnimatedStatBlobs';

interface ActiveProjectProps {
  gameState: GameState;
  focusAllocation: FocusAllocation;
  setFocusAllocation: (allocation: FocusAllocation) => void;
  performDailyWork: () => void;
  onMinigameReward?: (creativityBonus: number, technicalBonus: number, xpBonus: number) => void;
}

export const ActiveProject: React.FC<ActiveProjectProps> = ({
  gameState,
  focusAllocation,
  setFocusAllocation,
  performDailyWork,
  onMinigameReward
}) => {
  const [showMinigame, setShowMinigame] = useState(false);
  const [selectedMinigame, setSelectedMinigame] = useState<MinigameType>('rhythm');
  const [lastGains, setLastGains] = useState<{ creativity: number; technical: number }>({ creativity: 0, technical: 0 });
  const [showBlobAnimation, setShowBlobAnimation] = useState(false);

  if (!gameState.activeProject) {
    return (
      <Card className="flex-1 bg-gray-800/50 border-gray-600 p-6 backdrop-blur-sm">
        <div className="text-center text-gray-400">
          <div className="text-6xl mb-4">🎵</div>
          <h3 className="text-xl font-bold mb-2">No Active Project</h3>
          <p>Select a project from the left panel to start working</p>
        </div>
      </Card>
    );
  }

  const project = gameState.activeProject;
  
  // Calculate progress for current stage
  const currentStage = project.stages[project.currentStageIndex] || project.stages[0];
  const currentStageProgress = currentStage ? (currentStage.workUnitsCompleted / currentStage.workUnitsBase) * 100 : 0;
  
  // Calculate overall project progress
  const totalWorkUnits = project.stages.reduce((total, stage) => total + stage.workUnitsBase, 0);
  const completedWorkUnits = project.stages.reduce((total, stage) => total + stage.workUnitsCompleted, 0);
  const overallProgress = totalWorkUnits > 0 ? (completedWorkUnits / totalWorkUnits) * 100 : 0;

  // Get contextual minigame suggestions
  const triggeredMinigames = getTriggeredMinigames(project, gameState, focusAllocation);
  const suggestedMinigames = triggeredMinigames.slice(0, 3); // Top 3 suggestions

  const handleMinigameReward = (creativityBonus: number, technicalBonus: number, xpBonus: number) => {
    console.log('Minigame rewards:', { creativityBonus, technicalBonus, xpBonus });
    if (onMinigameReward) {
      onMinigameReward(creativityBonus, technicalBonus, xpBonus);
    }
    setShowMinigame(false);
  };

  const handleWork = () => {
    // Store expected gains for animation (simplified calculation)
    const baseCreativity = gameState.playerData.dailyWorkCapacity * gameState.playerData.attributes.creativeIntuition;
    const baseTechnical = gameState.playerData.dailyWorkCapacity * gameState.playerData.attributes.technicalAptitude;
    
    const creativityGain = Math.floor(
      baseCreativity * (focusAllocation.performance / 100) * 0.8 + 
      baseCreativity * (focusAllocation.layering / 100) * 0.6
    );
    const technicalGain = Math.floor(
      baseTechnical * (focusAllocation.soundCapture / 100) * 0.8 + 
      baseTechnical * (focusAllocation.layering / 100) * 0.4
    );

    setLastGains({ creativity: creativityGain, technical: technicalGain });
    setShowBlobAnimation(true);
    
    // Slight delay before calling actual work function for better UX
    setTimeout(() => {
      performDailyWork();
    }, 100);
  };

  const minigameOptions = [
    { id: 'rhythm', name: '🥁 Rhythm Training', description: 'Perfect your timing skills' },
    { id: 'mixing', name: '🎚️ Mixing Board', description: 'Balance the perfect mix' },
    { id: 'waveform', name: '🌊 Waveform Analysis', description: 'Analyze audio patterns' },
    { id: 'beatmaking', name: '🎵 Beat Making', description: 'Create killer drum patterns' },
    { id: 'vocal', name: '🎤 Vocal Recording', description: 'Nail the perfect take' },
    { id: 'mastering', name: '✨ Mastering Challenge', description: 'Polish the final sound' }
  ];

  return (
    <div className="flex-1 space-y-4 relative">
      <Card className="bg-gray-800/50 border-gray-600 p-6 backdrop-blur-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">{project.title}</h3>
            <p className="text-gray-300 text-sm mb-2">{project.genre} • {project.clientType}</p>
            <div className="flex gap-4 text-sm">
              <span className="text-green-400">💰 ${project.payoutBase}</span>
              <span className="text-blue-400">🎵 {project.genre}</span>
              <span className="text-purple-400">⭐ {project.difficulty}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-yellow-400 font-bold">{project.durationDaysTotal} days total</div>
            <div className="text-gray-400 text-sm">Work sessions: {project.workSessionCount || 0}</div>
          </div>
        </div>

        {/* Current Stage Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white font-semibold">
              Current Stage: {currentStage?.stageName || 'Unknown'}
            </span>
            <span className="text-gray-400">
              {currentStage?.workUnitsCompleted || 0}/{currentStage?.workUnitsBase || 0}
            </span>
          </div>
          <Progress value={currentStageProgress} className="h-3 mb-2" />
          {currentStage?.completed && (
            <div className="text-green-400 text-sm">✓ Stage Complete!</div>
          )}
        </div>

        {/* Overall Project Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white font-semibold">Overall Progress</span>
            <span className="text-gray-400">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-3 progress-bar" />
        </div>

        {/* Focus Allocation Sliders */}
        <div className="space-y-4 mb-6">
          <h4 className="text-white font-semibold">Focus Allocation</h4>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-gray-300">🎭 Performance ({focusAllocation.performance}%)</label>
            </div>
            <Slider
              value={[focusAllocation.performance]}
              onValueChange={(value) => setFocusAllocation({...focusAllocation, performance: value[0]})}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-gray-300">🎤 Sound Capture ({focusAllocation.soundCapture}%)</label>
            </div>
            <Slider
              value={[focusAllocation.soundCapture]}
              onValueChange={(value) => setFocusAllocation({...focusAllocation, soundCapture: value[0]})}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-gray-300">🎚️ Layering ({focusAllocation.layering}%)</label>
            </div>
            <Slider
              value={[focusAllocation.layering]}
              onValueChange={(value) => setFocusAllocation({...focusAllocation, layering: value[0]})}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
        </div>

        {/* Contextual Minigame Suggestions */}
        {suggestedMinigames.length > 0 && (
          <div className="mb-6 p-4 bg-blue-900/30 border border-blue-600 rounded-lg">
            <h4 className="text-white font-semibold mb-3">🎯 Suggested Production Activities</h4>
            <div className="space-y-2">
              {suggestedMinigames.map((trigger, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-700/50 rounded">
                  <div>
                    <div className="text-yellow-400 font-medium text-sm">{trigger.triggerReason}</div>
                    <div className="text-gray-400 text-xs">Priority: {trigger.priority}/10</div>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedMinigame(trigger.minigameType);
                      setShowMinigame(true);
                    }}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-xs"
                  >
                    Start
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Minigames Section */}
        <div className="mb-6">
          <h4 className="text-white font-semibold mb-3">🎮 All Production Minigames</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {minigameOptions.map((minigame) => (
              <Button
                key={minigame.id}
                onClick={() => {
                  setSelectedMinigame(minigame.id as MinigameType);
                  setShowMinigame(true);
                }}
                variant="outline"
                className="bg-gray-700/50 hover:bg-gray-600/50 text-white border-gray-600 p-3 h-auto flex flex-col gap-1"
              >
                <div className="text-lg">{minigame.name.split(' ')[0]}</div>
                <div className="text-xs text-gray-300 text-center">{minigame.description}</div>
              </Button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            💡 Play minigames to earn bonus creativity, technical points, and XP!
          </p>
        </div>

        <Button 
          onClick={handleWork}
          disabled={gameState.playerData.dailyWorkCapacity <= 0 || (currentStage?.completed && project.currentStageIndex >= project.stages.length - 1)}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 py-3 text-lg font-bold game-button"
        >
          {gameState.playerData.dailyWorkCapacity > 0 
            ? `🎵 Work on Project (${gameState.playerData.dailyWorkCapacity} energy left)`
            : '😴 No Energy Left (Advance Day to Restore)'
          }
        </Button>
      </Card>

      <MinigameManager
        isOpen={showMinigame}
        onClose={() => setShowMinigame(false)}
        gameType={selectedMinigame}
        onReward={handleMinigameReward}
      />

      {/* Enhanced Animation Container */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {showBlobAnimation && (
          <AnimatedStatBlobs
            creativityGain={lastGains.creativity}
            technicalGain={lastGains.technical}
            onComplete={() => setShowBlobAnimation(false)}
            containerRef={{ current: document.querySelector('.relative') as HTMLDivElement }}
          />
        )}
      </div>
    </div>
  );
};
