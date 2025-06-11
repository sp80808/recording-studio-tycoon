import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
// GameState and FocusAllocation are imported below with Project
import { MinigameManager, MinigameType } from './minigames/MinigameManager';
import { shouldAutoTriggerMinigame } from '@/utils/minigameUtils';
import { AnimatedStatBlobs } from './AnimatedStatBlobs';
import { OrbAnimationStyles } from './OrbAnimationStyles';
import { ProjectCompletionCelebration } from './ProjectCompletionCelebration';
import { EnhancedAnimationStyles } from './EnhancedAnimationStyles';
import { toast } from '@/hooks/use-toast';
import { playSound } from '@/utils/soundUtils';

import { GameState, FocusAllocation, Project } from '@/types/game'; // GameState, FocusAllocation, Project types

interface ActiveProjectProps {
  gameState: GameState;
  setGameState?: (state: GameState | ((prev: GameState) => GameState)) => void;
  focusAllocation?: FocusAllocation;
  setFocusAllocation?: (allocation: FocusAllocation) => void;
  performDailyWork?: () => { isComplete: boolean; finalProjectData?: Project } | undefined;
  onMinigameReward?: (creativityBonus: number, technicalBonus: number, xpBonus: number, minigameType?: string) => void;
  onProjectComplete?: (completedProject: Project) => void;
  onProjectSelect?: (project: Project) => void;
  autoTriggeredMinigame?: { type: MinigameType; reason: string } | null;
  clearAutoTriggeredMinigame?: () => void;
}

export const ActiveProject: React.FC<ActiveProjectProps> = ({
  gameState,
  setGameState,
  focusAllocation,
  setFocusAllocation,
  performDailyWork,
  onMinigameReward,
  onProjectComplete,
  onProjectSelect,
  autoTriggeredMinigame,
  clearAutoTriggeredMinigame
}) => {
  const [showMinigame, setShowMinigame] = useState(false);
  const [selectedMinigame, setSelectedMinigame] = useState<MinigameType>('rhythm');
  const [lastGains, setLastGains] = useState<{ creativity: number; technical: number }>({ creativity: 0, technical: 0 });
  const [showBlobAnimation, setShowBlobAnimation] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  // This will store the data for the celebration screen
  const [celebrationDisplayData, setCelebrationDisplayData] = useState<{ 
    title: string;
    genre: string;
  } | null>(null);
  // This will store the full project object to pass to onProjectComplete after celebration
  const [projectDataForCompletionCall, setProjectDataForCompletionCall] = useState<Project | null>(null);
  const [pulseAnimation, setPulseAnimation] = useState(false);
  const [completedMinigamesForStage, setCompletedMinigamesForStage] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // Clear auto-triggered minigame when project changes or stage advances
  useEffect(() => {
    if (gameState.activeProject) {
      const currentStageKey = `${gameState.activeProject.id}-${gameState.activeProject.currentStageIndex}`;
      const previousStageKey = Array.from(completedMinigamesForStage).find(key => 
        key.startsWith(`${gameState.activeProject!.id}-`) && key !== currentStageKey
      );
      
      // If we've moved to a new stage, clear the auto-triggered minigame
      if (previousStageKey && !completedMinigamesForStage.has(currentStageKey)) {
        if (clearAutoTriggeredMinigame) {
          clearAutoTriggeredMinigame();
        }
        setPulseAnimation(false);
      }
    }
  }, [gameState.activeProject?.currentStageIndex, completedMinigamesForStage, clearAutoTriggeredMinigame]);

  // Auto-trigger minigames based on project stage and equipment
  useEffect(() => {
    if (gameState.activeProject && !showMinigame && autoTriggeredMinigame) {
      const currentStageKey = `${gameState.activeProject.id}-${gameState.activeProject.currentStageIndex}`;
      
      // Don't trigger if we've already completed a minigame for this stage
      if (completedMinigamesForStage.has(currentStageKey)) {
        return;
      }

      setPulseAnimation(true);
      setTimeout(() => setPulseAnimation(false), 3000);
      
      toast({
        title: "🎯 Production Opportunity!",
        description: autoTriggeredMinigame.reason,
        duration: 5000
      });
      
      // Play notification sound
      playSound('notification.wav', 0.6);
    }
  }, [gameState.activeProject, autoTriggeredMinigame, showMinigame, completedMinigamesForStage]);

  if (!gameState.activeProject) {
    return (
      <Card className="flex-1 bg-gray-800/90 border-gray-600 p-6 backdrop-blur-sm">
        <div className="text-center text-gray-400 animate-fade-in">
          <div className="text-6xl mb-4 animate-pulse">🎵</div>
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

  const handleMinigameReward = (creativityBonus: number, technicalBonus: number, xpBonus: number) => {
    console.log('🎮 Minigame rewards received:', { creativityBonus, technicalBonus, xpBonus, minigameType: selectedMinigame });
    
    // Play success sound
    playSound('success.wav', 0.7);
    
    if (onMinigameReward) {
      onMinigameReward(creativityBonus, technicalBonus, xpBonus, selectedMinigame);
    }
    
    // Mark this stage as having completed a minigame
    const currentStageKey = `${project.id}-${project.currentStageIndex}`;
    setCompletedMinigamesForStage(prev => new Set([...prev, currentStageKey]));
    
    // Close minigame and clear auto-trigger
    setShowMinigame(false);
    if (clearAutoTriggeredMinigame) {
      clearAutoTriggeredMinigame();
    }
    setPulseAnimation(false);
    
    // Show rewarding toast
    toast({
      title: "🎉 Production Challenge Complete!",
      description: `+${creativityBonus} creativity, +${technicalBonus} technical, +${xpBonus} XP`,
      duration: 3000
    });

    // Trigger a work session automatically after minigame completion
    console.log('🔄 Auto-triggering work session after minigame completion...');
    setTimeout(() => {
      performDailyWork();
    }, 1000);
  };

  const handleWork = () => {
    // Play work button click sound
    playSound('click.wav', 0.5);
    
    // Check for auto-triggered minigame opportunity
    if (autoTriggeredMinigame) {
      console.log('🎮 Starting auto-triggered minigame:', autoTriggeredMinigame.type);
      setSelectedMinigame(autoTriggeredMinigame.type);
      setShowMinigame(true);
      playSound('start_minigame.wav', 0.6);
      return;
    }

    // Store expected gains for animation (simplified calculation)
    const baseCreativity = gameState.playerData.dailyWorkCapacity * gameState.playerData.attributes.creativeIntuition;
    const baseTechnical = gameState.playerData.attributes.technicalAptitude;
    
    const creativityGain = Math.floor(
      baseCreativity * (focusAllocation.performance / 100) * 0.8 + 
      baseCreativity * (focusAllocation.layering / 100) * 0.6
    );
    const technicalGain = Math.floor(
      baseTechnical * (focusAllocation.soundCapture / 100) * 0.8 + 
      baseTechnical * (focusAllocation.layering / 100) * 0.4
    );

    console.log('🎯 Setting last gains for animation:', { creativityGain, technicalGain });
    setLastGains({ creativity: creativityGain, technical: technicalGain });
    setShowBlobAnimation(true);
    
    // Call actual work function
    const result = performDailyWork(); // Now returns { isComplete: boolean, finalProjectData?: Project }
    
    if (result?.isComplete && result.finalProjectData) {
      console.log('🎉 Project work units complete! Triggering celebration for:', result.finalProjectData.title);
      playSound('project_complete.wav', 0.8);
      
      // Set data for the celebration display
      setCelebrationDisplayData({
        title: result.finalProjectData.title,
        genre: result.finalProjectData.genre
      });
      // Store the full project data to be used when the celebration is over
      setProjectDataForCompletionCall(result.finalProjectData);
      setShowCelebration(true);
    }
    // If not complete, or if somehow isComplete is true but no finalProjectData, do nothing further here.
  };

  const handleProjectCelebrationComplete = () => {
    console.log('🎊 Celebration complete. Calling onProjectComplete with stored project data.');
    if (onProjectComplete && projectDataForCompletionCall) {
      onProjectComplete(projectDataForCompletionCall);
    }
    setShowCelebration(false);
    setCelebrationDisplayData(null);
    setProjectDataForCompletionCall(null); // Clear the stored project data
  };

  // Check if current stage is complete and ready to advance
  const isCurrentStageComplete = currentStage && currentStage.workUnitsCompleted >= currentStage.workUnitsBase;
  const isProjectComplete = project.stages.every(stage => stage.completed);

  return (
    <>
      <OrbAnimationStyles />
      <EnhancedAnimationStyles />
      
      {/* Animated Stat Blobs */}
      {showBlobAnimation && containerRef.current && (
        <AnimatedStatBlobs
          creativityGain={lastGains.creativity}
          technicalGain={lastGains.technical}
          onComplete={() => {
            console.log('🎨 Blob animation complete.');
            setShowBlobAnimation(false);
            setLastGains({ creativity: 0, technical: 0 });
          }}
          containerRef={containerRef}
        />
      )}
      
      {/* Project Completion Celebration */}
      {showCelebration && celebrationDisplayData && (
        <ProjectCompletionCelebration
          isVisible={showCelebration}
          projectTitle={celebrationDisplayData.title}
          genre={celebrationDisplayData.genre}
          onComplete={handleProjectCelebrationComplete}
        />
      )}
      
      <div ref={containerRef} className="flex-1 space-y-4 relative">
        <Card className="bg-gray-800/50 border-gray-600 p-6 backdrop-blur-sm animate-scale-in">
          <div className="flex justify-between items-start mb-4">
            <div className="animate-fade-in">
              <h3 className="text-xl font-bold text-white mb-1">
                {project.title}
                {gameState.activeProject && !isProjectComplete && (
                  <>
                    <span className="ml-1 text-2xl animate-fader-move" role="img" aria-label="recording">🎤</span>
                  </>
                )}
              </h3>
              <p className="text-gray-300 text-sm mb-2">{project.genre} • {project.clientType}</p>
              <div className="flex gap-4 text-sm">
                <span className="text-green-400 animate-pulse">💰 ${project.payoutBase}</span>
                <span className="text-blue-400">🎵 {project.genre}</span>
                <span className="text-purple-400">⭐ {project.difficulty}</span>
              </div>
            </div>
            <div className="text-right animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="text-yellow-400 font-bold">{project.durationDaysTotal} days total</div>
              <div className="text-gray-400 text-sm">Work sessions: {project.workSessionCount || 0}</div>
              <div className="mt-2 space-y-1">
                <div id="creativity-points" data-creativity-target className="text-blue-400 text-sm">
                  🎨 {project.accumulatedCPoints} creativity
                </div>
                <div id="technical-points" data-technical-target className="text-green-400 text-sm">
                  ⚙️ {project.accumulatedTPoints} technical
                </div>
              </div>
            </div>
          </div>

          {/* Auto-triggered Minigame Notification */}
          {autoTriggeredMinigame && (
            <div className="mb-4 p-4 bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500 rounded-lg animate-scale-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-yellow-400 font-semibold mb-1">🎯 Production Opportunity Ready!</h4>
                  <p className="text-gray-300 text-sm">{autoTriggeredMinigame.reason}</p>
                </div>
                <div className="text-2xl animate-bounce">🎮</div>
              </div>
            </div>
          )}

          {/* Stage Completion Notification */}
          {isCurrentStageComplete && !isProjectComplete && (
            <div className="mb-4 p-4 bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-500 rounded-lg animate-scale-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-green-400 font-semibold mb-1">✅ Stage Complete!</h4>
                  <p className="text-gray-300 text-sm">
                    {currentStage.stageName} finished! Continue working to advance to the next stage.
                  </p>
                </div>
                <div className="text-2xl animate-bounce">🎉</div>
              </div>
            </div>
          )}

          {/* Current Stage Progress */}
          <div className="mb-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-semibold">
                Current Stage: {currentStage?.stageName || 'Unknown'}
              </span>
              <span className="text-gray-400">
                {currentStage?.workUnitsCompleted || 0}/{currentStage?.workUnitsBase || 0}
              </span>
            </div>
            <Progress 
              value={currentStageProgress} 
              className="h-3 mb-2 transition-all duration-500"
              aria-label={`${currentStage?.stageName || 'Current stage'} progress`}
            />
            {currentStage?.completed && (
              <div className="text-green-400 text-sm animate-scale-in">✓ Stage Complete!</div>
            )}
          </div>

          {/* Overall Project Progress */}
          <div className="mb-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-semibold">Overall Progress</span>
              <span className="text-gray-400">{Math.round(overallProgress)}%</span>
            </div>
            <Progress 
              value={overallProgress} 
              className="h-3 progress-bar transition-all duration-500"
              aria-label="Overall project progress"
            />
          </div>

          {/* Focus Allocation Sliders */}
          <div className="space-y-4 mb-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <h4 className="text-white font-semibold">Focus Allocation</h4>
            
            <div className="hover-scale">
              <div className="flex justify-between items-center mb-2">
                <label className="text-gray-300">🎭 Performance ({focusAllocation.performance}%)</label>
              </div>
              <Slider
                value={[focusAllocation.performance]}
                onValueChange={(value) => {
                  playSound('slider.wav', 0.3);
                  setFocusAllocation({...focusAllocation, performance: value[0]});
                }}
                max={100}
                step={5}
                className="w-full transition-all duration-200"
              />
            </div>

            <div className="hover-scale">
              <div className="flex justify-between items-center mb-2">
                <label className="text-gray-300">🎤 Sound Capture ({focusAllocation.soundCapture}%)</label>
              </div>
              <Slider
                value={[focusAllocation.soundCapture]}
                onValueChange={(value) => {
                  playSound('slider.wav', 0.3);
                  setFocusAllocation({...focusAllocation, soundCapture: value[0]});
                }}
                max={100}
                step={5}
                className="w-full transition-all duration-200"
              />
            </div>

            <div className="hover-scale">
              <div className="flex justify-between items-center mb-2">
                <label className="text-gray-300">🎚️ Layering ({focusAllocation.layering}%)</label>
              </div>
              <Slider
                value={[focusAllocation.layering]}
                onValueChange={(value) => {
                  playSound('slider.wav', 0.3);
                  setFocusAllocation({...focusAllocation, layering: value[0]});
                }}
                max={100}
                step={5}
                className="w-full transition-all duration-200"
              />
            </div>
          </div>

          <Button 
            onClick={handleWork}
            disabled={gameState.playerData.dailyWorkCapacity <= 0 || isProjectComplete}
            className={`w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 py-3 text-lg font-bold game-button transition-all duration-300 ${
              pulseAnimation ? 'animate-pulse ring-4 ring-yellow-400/50' : ''
            } ${autoTriggeredMinigame ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' : ''}`}
          >
            {isProjectComplete ? (
              '🎉 Project Complete!'
            ) : autoTriggeredMinigame ? (
              <>🎮 Start Production Challenge!</>
            ) : gameState.playerData.dailyWorkCapacity > 0 ? (
              `🎵 Work on Project (${gameState.playerData.dailyWorkCapacity} energy left)`
            ) : (
              '😴 No Energy Left (Advance Day to Restore)'
            )}
          </Button>
        </Card>

        <MinigameManager
           isOpen={showMinigame}
          onClose={() => {
            setShowMinigame(false);
            if (clearAutoTriggeredMinigame) {
              clearAutoTriggeredMinigame();
            }
            setPulseAnimation(false);
            playSound('close_modal.wav', 0.4);
          }}
          gameType={selectedMinigame}
          onReward={handleMinigameReward}
        />
      </div>
    </>
  );
};
