import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { MinigameManager } from './minigames/MinigameManager'; // Removed MinigameType from here
import { MinigameType } from '@/types/miniGame'; // Imported MinigameType directly
import { AnimatedStatBlobs } from './AnimatedStatBlobs';
import { OrbAnimationStyles } from './OrbAnimationStyles';
import { ProjectCompletionCelebration } from './ProjectCompletionCelebration';
import { EnhancedAnimationStyles } from './EnhancedAnimationStyles';
import { toast } from '@/hooks/use-toast';
import { gameAudio } from '@/utils/audioSystem';
import {
  getStageFocusLabels,
  calculateFocusEffectiveness,
  getStageFocusRecommendations
} from '@/utils/stageUtils';
import { getOptimalSliderPositions as getStaffOptimalSliderPositions } from '@/utils/staffAssignmentUtils';
import { useGameState } from '@/hooks/useGameState';
import { useGameActions } from '@/hooks/useGameActions';
import { useProjectManagement } from '@/hooks/useProjectManagement';
import { useStaffManagement } from '@/hooks/useStaffManagement';
import { GameState, FocusAllocation, Project, PlayerData, StaffMember, ProjectReport } from '@/types/game';

interface ActiveProjectProps {
  onMinigameReward?: (creativityBonus: number, technicalBonus: number, xpBonus: number, minigameType?: string) => void;
  onProjectComplete?: (completedProject: Project) => void;
  onProjectSelect?: (project: Project) => void;
  autoTriggeredMinigame?: { type: MinigameType; reason: string } | null;
  clearAutoTriggeredMinigame?: () => void;
}

export const ActiveProject: React.FC<ActiveProjectProps> = ({
  onMinigameReward,
  onProjectComplete,
  autoTriggeredMinigame,
  clearAutoTriggeredMinigame
}) => {
  const { gameState, updateGameState, focusAllocation, setFocusAllocation } = useGameState(); // Changed setGameState to updateGameState
  const { performDailyWork } = useGameActions(gameState, updateGameState); // Changed setGameState to updateGameState
  const { completeProject } = useProjectManagement({ gameState, setGameState: updateGameState }); // Changed setGameState to updateGameState and passed as object
  const { addStaffXP } = useStaffManagement(gameState, updateGameState); // Changed setGameState to updateGameState

  const [showMinigame, setShowMinigame] = useState(false);
  const [selectedMinigame, setSelectedMinigame] = useState<MinigameType>('rhythm_timing'); // Changed default to match types
  const [lastGains, setLastGains] = useState<{ creativity: number; technical: number }>({ creativity: 0, technical: 0 });
  const [showBlobAnimation, setShowBlobAnimation] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationDisplayData, setCelebrationDisplayData] = useState<{
    title: string;
    genre: string;
  } | null>(null);
  const [projectDataForCompletionCall, setProjectDataForCompletionCall] = useState<Project | null>(null);
  const [pulseAnimation, setPulseAnimation] = useState(false);
  const [completedMinigamesForStage, setCompletedMinigamesForStage] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const playerLevel = gameState.playerData.level;
  const canUseOptimalFocusButton = playerLevel >= 3;

  useEffect(() => {
    if (gameState.activeProject) {
      const currentStageKey = `${gameState.activeProject.id}-${gameState.activeProject.currentStageIndex}`;
      const previousStageKey = Array.from(completedMinigamesForStage).find(key =>
        key.startsWith(`${gameState.activeProject!.id}-`) && key !== currentStageKey
      );
      
      if (previousStageKey && !completedMinigamesForStage.has(currentStageKey)) {
        if (clearAutoTriggeredMinigame) {
          clearAutoTriggeredMinigame();
        }
        setPulseAnimation(false);
      }
    }
  }, [gameState.activeProject?.currentStageIndex, completedMinigamesForStage, clearAutoTriggeredMinigame, gameState.activeProject]); // Added gameState.activeProject to dependencies

  useEffect(() => {
    if (gameState.activeProject && !showMinigame && autoTriggeredMinigame) {
      const currentStageKey = `${gameState.activeProject.id}-${gameState.activeProject.currentStageIndex}`;
      if (completedMinigamesForStage.has(currentStageKey)) {
        return;
      }
      setPulseAnimation(true);
      setTimeout(() => setPulseAnimation(false), 3000);
      toast({
        title: "🎯 Production Opportunity!",
        description: autoTriggeredMinigame.reason,
        className: "bg-gray-800 border-gray-600 text-white",
        duration: 5000
      });
      gameAudio.playUISound('notification');
    }
  }, [gameState.activeProject, autoTriggeredMinigame, showMinigame, completedMinigamesForStage, gameAudio]); // Added gameAudio to dependencies

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
  const currentStage = project.stages[project.currentStageIndex] || project.stages[0];
  const currentStageProgress = currentStage ? (currentStage.workUnitsCompleted / currentStage.workUnitsBase) * 100 : 0;

  const assignedStaffToCurrentProject: StaffMember[] = gameState.hiredStaff.filter(
    (staff) => staff.assignedProjectId === project.id
  );

  const stageFocusLabels = getStageFocusLabels(currentStage);
  const optimalFocusFromStaff = getStaffOptimalSliderPositions(assignedStaffToCurrentProject, currentStage);
  
  const effectiveOptimalFocusForCalc = {
      ...optimalFocusFromStaff,
      reasoning: optimalFocusFromStaff.reasoning || "Optimal focus based on staff and stage.",
  };
  const currentFocusAllocation = focusAllocation || { performance: 33, soundCapture: 34, layering: 33 };
  const focusEffectiveness = calculateFocusEffectiveness(currentFocusAllocation, effectiveOptimalFocusForCalc);
  const stageRecommendations = getStageFocusRecommendations(currentStage);
  
  const totalWorkUnits = project.stages.reduce((total, stage) => total + stage.workUnitsBase, 0);
  const completedWorkUnits = project.stages.reduce((total, stage) => total + stage.workUnitsCompleted, 0);
  const overallProgress = totalWorkUnits > 0 ? (completedWorkUnits / totalWorkUnits) * 100 : 0;

  const handleMinigameReward = (creativityBonus: number, technicalBonus: number, xpBonus: number) => {
    console.log('🎮 Minigame rewards received:', { creativityBonus, technicalBonus, xpBonus, minigameType: selectedMinigame });
    gameAudio.playSuccess();
    if (onMinigameReward) {
      onMinigameReward(creativityBonus, technicalBonus, xpBonus, selectedMinigame);
    } else {
        updateGameState((prev: GameState) => { // Changed setGameState to updateGameState
            if (!prev.activeProject) return prev;
            return {
                ...prev,
                activeProject: {
                    ...prev.activeProject,
                    accumulatedCPoints: prev.activeProject.accumulatedCPoints + creativityBonus,
                    accumulatedTPoints: prev.activeProject.accumulatedTPoints + technicalBonus,
                },
                playerData: { ...prev.playerData, xp: prev.playerData.xp + xpBonus }
            };
        });
    }
    const currentStageKey = `${project.id}-${project.currentStageIndex}`;
    setCompletedMinigamesForStage(prev => new Set([...prev, currentStageKey]));
    setShowMinigame(false);
    if (clearAutoTriggeredMinigame) {
      clearAutoTriggeredMinigame();
    }
    setPulseAnimation(false);
    toast({
      title: "🎉 Production Challenge Complete!",
      description: `+${creativityBonus} creativity, +${technicalBonus} technical, +${xpBonus} XP`,
      className: "bg-gray-800 border-gray-600 text-white",
      duration: 3000
    });
    console.log('🔄 Auto-triggering work session after minigame completion...');
    setTimeout(() => {
      // Ensure performDailyWork is called with correct arguments and handles its return
      const result = performDailyWork(project, currentFocusAllocation, assignedStaffToCurrentProject, (state: GameState) => completeProject(state.activeProject!, addStaffXP));
      if (result?.isComplete && result.finalProjectData) {
        console.log('🎉 Project work units complete after minigame! Triggering celebration for:', result.finalProjectData.title);
        gameAudio.playCompleteProject();
        setCelebrationDisplayData({
          title: result.finalProjectData.title,
          genre: result.finalProjectData.genre,
        });
        setProjectDataForCompletionCall(result.finalProjectData);
        setShowCelebration(true);
      }
    }, 1000);
  };

  const handleWork = () => {
    gameAudio.playClick();
    if (autoTriggeredMinigame) {
      console.log('🎮 Starting auto-triggered minigame:', autoTriggeredMinigame.type);
      setSelectedMinigame(autoTriggeredMinigame.type);
      setShowMinigame(true);
      gameAudio.playUISound('notice');
      return;
    }

    const baseCreativity = gameState.playerData.dailyWorkCapacity * gameState.playerData.attributes.creativeIntuition;
    const baseTechnical = gameState.playerData.attributes.technicalAptitude;
    
    const creativityGain = Math.floor(
      baseCreativity * (currentFocusAllocation.performance / 100) * 0.8 +
      baseCreativity * (currentFocusAllocation.layering / 100) * 0.6
    );
    const technicalGain = Math.floor(
      baseTechnical * (currentFocusAllocation.soundCapture / 100) * 0.8 +
      baseTechnical * (currentFocusAllocation.layering / 100) * 0.4
    );

    console.log('🎯 Setting last gains for animation:', { creativityGain, technicalGain });
    setLastGains({ creativity: creativityGain, technical: technicalGain });
    setShowBlobAnimation(true);
    
    // Directly call performDailyWork, it will return null if not complete
    const result = performDailyWork(project, currentFocusAllocation, assignedStaffToCurrentProject, (state: GameState) => completeProject(state.activeProject!, addStaffXP));
    
    if (result?.isComplete && result.finalProjectData) {
      console.log('🎉 Project work units complete! Triggering celebration for:', result.finalProjectData.title);
      gameAudio.playCompleteProject();
      setCelebrationDisplayData({
        title: result.finalProjectData.title,
        genre: result.finalProjectData.genre,
      });
      setProjectDataForCompletionCall(result.finalProjectData);
      setShowCelebration(true);
    }
  };

  const handleProjectCelebrationComplete = () => {
    console.log('🎊 Celebration complete. Calling onProjectComplete with stored project data.');
    if (onProjectComplete && projectDataForCompletionCall) {
      onProjectComplete(projectDataForCompletionCall);
    }
    setShowCelebration(false);
    setCelebrationDisplayData(null);
    setProjectDataForCompletionCall(null);
  };

  const isCurrentStageComplete = currentStage && currentStage.workUnitsCompleted >= currentStage.workUnitsBase;
  const isProjectComplete = project.stages.every(stage => stage.completed);

  return (
    <>
      <OrbAnimationStyles />
      <EnhancedAnimationStyles />
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
      {showCelebration && celebrationDisplayData && (
        <ProjectCompletionCelebration
          isVisible={showCelebration}
          projectTitle={celebrationDisplayData.title}
          genre={celebrationDisplayData.genre}
          onComplete={handleProjectCelebrationComplete}
        />
      )}
      <div ref={containerRef} className="flex-1 space-y-4 relative overflow-y-auto flex flex-col">
        <Card className="bg-gray-800/50 border-gray-600 p-6 backdrop-blur-sm animate-scale-in flex-grow flex flex-col">
          <div className="flex-grow space-y-4">
            <div className="flex justify-between items-start mb-4">
              <div className="animate-fade-in">
                <h3 className="text-xl font-bold text-white mb-1">
                  {project.title}
                  {gameState.activeProject && !isProjectComplete && (
                    <span className="ml-1 text-2xl animate-fader-move" role="img" aria-label="recording">🎤</span>
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
            <div className="mb-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-semibold flex items-center gap-2">
                  Current Stage: {currentStage?.stageName}
                  {focusEffectiveness.effectiveness > 0.8 && (
                    <span className="text-green-400 text-sm animate-pulse">🚀 Optimized!</span>
                  )}
                </span>
                <span className="text-gray-400 flex items-center gap-1">
                  {currentStage?.workUnitsCompleted || 0}/{(currentStage?.workUnitsRequired || currentStage?.workUnitsBase) || 0}
                  {focusEffectiveness.effectiveness > 0.7 && (
                    <span className="text-blue-400 text-xs">⚡ Efficient</span>
                  )}
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
            <div className="space-y-4 mb-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="flex justify-between items-center">
                <h4 className="text-white font-semibold">Focus Allocation</h4>
                <div className={`text-sm px-2 py-1 rounded ${
                  focusEffectiveness.effectiveness > 0.8 ? 'bg-green-900 text-green-200' :
                  focusEffectiveness.effectiveness > 0.6 ? 'bg-yellow-900 text-yellow-200' :
                  'bg-red-900 text-red-200'
                }`}>
                  {Math.round(focusEffectiveness.effectiveness * 100)}% effective
                </div>
              </div>
              <div className="bg-blue-900/30 border border-blue-600/50 rounded-lg p-3 text-sm">
                <div className="text-blue-200 font-medium mb-1">
                  📋 {currentStage.stageName} - {optimalFocusFromStaff.reasoning || "Focus guidance based on staff and stage."}
                </div>
                {stageRecommendations.length > 0 && (
                  <div className="text-blue-300 text-xs">
                    💡 {stageRecommendations.join(' • ')}
                  </div>
                )}
              </div>
              <div className="hover-scale">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex flex-col">
                    <label className="text-gray-300 font-medium">
                      {stageFocusLabels.performance.label} ({currentFocusAllocation.performance}%)
                    </label>
                    <span className="text-xs text-gray-400">
                      {stageFocusLabels.performance.description}
                    </span>
                  </div>
                </div>
                <Slider
                  value={[currentFocusAllocation.performance]}
                  onValueChange={(value) => {
                    gameAudio.playSliderMove();
                    setFocusAllocation({...currentFocusAllocation, performance: value[0]});
                  }}
                  max={100}
                  step={5}
                  className={`w-full transition-all duration-300 ease-in-out ${
                    Math.abs(currentFocusAllocation.performance - optimalFocusFromStaff.performance) <= 10
                      ? '[&_.bg-primary]:bg-green-500 [&_.border-primary]:border-green-600'
                      : Math.abs(currentFocusAllocation.performance - optimalFocusFromStaff.performance) <= 25
                        ? '[&_.bg-primary]:bg-yellow-500 [&_.border-primary]:border-yellow-600'
                        : '[&_.bg-primary]:bg-blue-600'
                  }`}
                />
                <div className="text-xs text-gray-500 mt-1">
                  💡 {stageFocusLabels.performance.impact}
                </div>
              </div>
              <div className="hover-scale">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex flex-col">
                    <label className="text-gray-300 font-medium">
                      {stageFocusLabels.soundCapture.label} ({currentFocusAllocation.soundCapture}%)
                    </label>
                    <span className="text-xs text-gray-400">
                      {stageFocusLabels.soundCapture.description}
                    </span>
                  </div>
                </div>
                <Slider
                  value={[currentFocusAllocation.soundCapture]}
                  onValueChange={(value) => {
                    gameAudio.playSliderMove();
                    setFocusAllocation({...currentFocusAllocation, soundCapture: value[0]});
                  }}
                  max={100}
                  step={5}
                  className={`w-full transition-all duration-300 ease-in-out ${
                    Math.abs(currentFocusAllocation.soundCapture - optimalFocusFromStaff.soundCapture) <= 10
                      ? '[&_.bg-primary]:bg-green-500 [&_.border-primary]:border-green-600'
                      : Math.abs(currentFocusAllocation.soundCapture - optimalFocusFromStaff.soundCapture) <= 25
                        ? '[&_.bg-primary]:bg-yellow-500 [&_.border-primary]:border-yellow-600'
                        : '[&_.bg-primary]:bg-blue-600'
                  }`}
                />
                <div className="text-xs text-gray-500 mt-1">
                  💡 {stageFocusLabels.soundCapture.impact}
                </div>
              </div>
              <div className="hover-scale">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex flex-col">
                    <label className="text-gray-300 font-medium">
                      {stageFocusLabels.layering.label} ({currentFocusAllocation.layering}%)
                    </label>
                    <span className="text-xs text-gray-400">
                      {stageFocusLabels.layering.description}
                    </span>
                  </div>
                </div>
                <Slider
                  value={[currentFocusAllocation.layering]}
                  onValueChange={(value) => {
                    gameAudio.playSliderMove();
                    setFocusAllocation({...currentFocusAllocation, layering: value[0]});
                  }}
                  max={100}
                  step={5}
                  className={`w-full transition-all duration-300 ease-in-out ${
                    Math.abs(currentFocusAllocation.layering - optimalFocusFromStaff.layering) <= 10
                      ? '[&_.bg-primary]:bg-green-500 [&_.border-primary]:border-green-600'
                      : Math.abs(currentFocusAllocation.layering - optimalFocusFromStaff.layering) <= 25
                        ? '[&_.bg-primary]:bg-yellow-500 [&_.border-primary]:border-yellow-600'
                        : '[&_.bg-primary]:bg-blue-600'
                  }`}
                />
                <div className="text-xs text-gray-500 mt-1">
                  💡 {stageFocusLabels.layering.impact}
                </div>
              </div>
              {focusEffectiveness.suggestions.length > 0 && (
                <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-3">
                  <div className="text-yellow-200 font-medium text-sm mb-1">
                    💡 Focus Suggestions:
                  </div>
                  <div className="text-yellow-300 text-xs space-y-1">
                    {focusEffectiveness.suggestions.map((suggestion, index) => (
                      <div key={index}>• {suggestion}</div>
                    ))}
                  </div>
                </div>
              )}
              <Button
                onClick={() => {
                  const newOptimalFocus = getStaffOptimalSliderPositions(assignedStaffToCurrentProject, currentStage);
                  setFocusAllocation(newOptimalFocus);
                  gameAudio.playUISound('notification');
                  toast({
                    title: "🎯 Staff-Optimized Focus Applied",
                    description: `Focus set for ${currentStage.stageName} based on assigned staff.`,
                    className: "bg-gray-800 border-gray-600 text-white",
                  });
                }}
                disabled={!canUseOptimalFocusButton || assignedStaffToCurrentProject.length === 0}
                variant="outline"
                size="sm"
                className={`w-full transition-colors duration-200 ${
                  canUseOptimalFocusButton
                    ? assignedStaffToCurrentProject.length > 0
                      ? 'bg-blue-900/30 border-blue-600/50 text-blue-200 hover:bg-blue-800/50'
                      : 'bg-gray-600/30 border-gray-500/50 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-700/30 border-gray-600/50 text-gray-400 cursor-not-allowed'
                }`}
              >
                {canUseOptimalFocusButton
                  ? assignedStaffToCurrentProject.length > 0
                    ? `🎯 Apply Staff-Optimized Focus for ${currentStage.stageName}`
                    : `🎯 Assign Staff to Optimize Focus`
                  : `🎯 Optimal Focus (Player Lvl 3+)`}
              </Button>
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
          </div>
        </Card>
        <MinigameManager
           isOpen={showMinigame}
          onClose={() => {
            setShowMinigame(false);
            if (clearAutoTriggeredMinigame) {
              clearAutoTriggeredMinigame();
            }
            setPulseAnimation(false);
            gameAudio.playUISound('close-menu');
          }}
          gameType={selectedMinigame}
          onReward={handleMinigameReward}
          onComplete={() => {}}
          difficulty={1}
        />
      </div>
    </>
  );
};
