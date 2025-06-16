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
import { playSound } from '@/utils/audioSystem'; // Updated import
import { 
  getStageFocusLabels, 
  getStageOptimalFocus, 
  calculateFocusEffectiveness,
  getStageFocusRecommendations 
} from '@/utils/stageUtils';

import { GameState, FocusAllocation, Project, PlayerData } from '@/types/game';

interface ActiveProjectProps {
  gameState: GameState;
  setGameState: (state: GameState | ((prev: GameState) => GameState)) => void; // Made non-optional as it's crucial for updating project focus
  // focusAllocation prop is removed, as it will be derived from gameState.activeProject.focusAllocation
  // setFocusAllocation prop is removed, will be handled by a new specific updater function if manual adjustment is kept, or via setGameState
  performDailyWork?: () => { isComplete: boolean; finalProjectData?: Project } | undefined;
  onMinigameReward?: (creativityBonus: number, technicalBonus: number, xpBonus: number, minigameType?: string) => void;
  onProjectComplete?: (completedProject: Project) => void;
  onProjectSelect?: (project: Project) => void;
  autoTriggeredMinigame?: { type: MinigameType; reason: string } | null;
  clearAutoTriggeredMinigame?: () => void;
}

export const ActiveProject: React.FC<ActiveProjectProps> = ({
  gameState,
  setGameState, // Now non-optional
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

  // Unlock condition for Apply Optimal Focus button
  const managementSkillLevel = gameState.playerData.skills.management?.level || 0;
  const playerLevel = gameState.playerData.level;
  const canUseOptimalFocusButton = managementSkillLevel >= 3 || playerLevel >= 5;

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
        className: "bg-gray-800 border-gray-600 text-white",
        duration: 5000
      });
      
      // Play notification sound
      playSound('notification', 0.6); // Assuming 'notification' is a valid sound name in audioSystem.ts
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

  // DERIVE projectFocus from gameState.activeProject.focusAllocation
  const projectFocus = project.focusAllocation || { performance: 33, soundCapture: 33, layering: 34 }; // Fallback if somehow undefined

  // Aggregate skills of staff assigned to this project
  const assignedStaffToThisProject = gameState.hiredStaff.filter(s => s.assignedProjectId === project.id);
  let aggregatedSkills: { creativity?: number; technical?: number; arrangement?: number } = {
    creativity: 0,
    technical: 0,
    arrangement: 0,
  };

  if (assignedStaffToThisProject.length > 0) {
    let totalCreativity = 0;
    let totalTechnical = 0;
    let totalArrangementScore = 0;
    let staffWithArrangementSkills = 0;

    assignedStaffToThisProject.forEach(staff => {
      totalCreativity += staff.primaryStats.creativity || 0;
      totalTechnical += staff.primaryStats.technical || 0;
      
      const mixingSkill = staff.skills.mixing?.level || 0;
      const songwritingSkill = staff.skills.songwriting?.level || 0;
      if (mixingSkill > 0 || songwritingSkill > 0) {
        totalArrangementScore += (mixingSkill + songwritingSkill) / 2;
        staffWithArrangementSkills++;
      }
    });

    aggregatedSkills.creativity = totalCreativity / assignedStaffToThisProject.length;
    aggregatedSkills.technical = totalTechnical / assignedStaffToThisProject.length;
    aggregatedSkills.arrangement = staffWithArrangementSkills > 0 ? totalArrangementScore / staffWithArrangementSkills : 0;
  }

  // Get stage-specific focus labels and guidance, now considering staff skills for optimalFocus
  const stageFocusLabels = getStageFocusLabels(currentStage);
  const optimalFocus = getStageOptimalFocus(currentStage, project.genre, aggregatedSkills); // Pass aggregatedSkills
  const focusEffectiveness = calculateFocusEffectiveness(projectFocus, optimalFocus); // Use projectFocus
  const stageRecommendations = getStageFocusRecommendations(currentStage);
  
  // Calculate overall project progress
  const totalWorkUnits = project.stages.reduce((total, stage) => total + stage.workUnitsBase, 0);
  const completedWorkUnits = project.stages.reduce((total, stage) => total + stage.workUnitsCompleted, 0);
  const overallProgress = totalWorkUnits > 0 ? (completedWorkUnits / totalWorkUnits) * 100 : 0;

  const handleMinigameReward = (creativityBonus: number, technicalBonus: number, xpBonus: number) => {
    console.log('🎮 Minigame rewards received:', { creativityBonus, technicalBonus, xpBonus, minigameType: selectedMinigame });
    
    // Play success sound
    playSound('success', 0.7); // Assuming 'success' is a valid sound name in audioSystem.ts
    
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
      className: "bg-gray-800 border-gray-600 text-white",
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
    playSound('ui-click', 0.5);
    
    // Check for auto-triggered minigame opportunity
    if (autoTriggeredMinigame) {
      console.log('🎮 Starting auto-triggered minigame:', autoTriggeredMinigame.type);
      setSelectedMinigame(autoTriggeredMinigame.type);
      setShowMinigame(true);
      playSound('start_minigame', 0.6); // Assuming 'start_minigame' is a valid sound name
      return;
    }

    // Store expected gains for animation (simplified calculation)
    const baseCreativity = gameState.playerData.dailyWorkCapacity * gameState.playerData.attributes.creativeIntuition;
    const baseTechnical = gameState.playerData.attributes.technicalAptitude;
    
    // Use projectFocus for calculating gains
    const creativityGain = Math.floor(
      baseCreativity * (projectFocus.performance / 100) * 0.8 + 
      baseCreativity * (projectFocus.layering / 100) * 0.6
    );
    const technicalGain = Math.floor(
      baseTechnical * (projectFocus.soundCapture / 100) * 0.8 + 
      baseTechnical * (projectFocus.layering / 100) * 0.4
    );

    console.log('🎯 Setting last gains for animation:', { creativityGain, technicalGain });
    setLastGains({ creativity: creativityGain, technical: technicalGain });
    setShowBlobAnimation(true);
    
    // Call actual work function
    const result = performDailyWork(); // Now returns { isComplete: boolean, finalProjectData?: Project }
    
    if (result?.isComplete && result.finalProjectData) {
      console.log('🎉 Project work units complete! Triggering celebration for:', result.finalProjectData.title);
      playSound('project-complete', 0.8);
      
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
      
      {/* Make this div scrollable and ensure it fills height */}
      <div ref={containerRef} className="flex-1 space-y-4 relative overflow-y-auto flex flex-col">
        {/* The Card should not prevent scrolling; its height can be auto based on content */}
        <Card className="bg-gray-800/50 border-gray-600 p-6 backdrop-blur-sm animate-scale-in flex-grow flex flex-col">
          {/* Added flex-grow and flex flex-col to allow inner content to manage space */}
          <div className="flex-grow space-y-4"> {/* Added a wrapper for scrollable content, if Card itself is not meant to scroll */}
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
              {/* Enhanced progress display with effectiveness indicator */}
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-semibold flex items-center gap-2">
                  Current Stage: {currentStage?.stageName}
                  {focusEffectiveness.effectiveness > 0.8 && (
                    <span className="text-green-400 text-sm animate-pulse">🚀 Optimized!</span>
                  )}
                </span>
                <span className="text-gray-400 flex items-center gap-1">
                  {currentStage?.workUnitsCompleted || 0}/{currentStage?.workUnitsBase || 0}
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
              
              {/* Stage-specific guidance */}
              <div className="bg-blue-900/30 border border-blue-600/50 rounded-lg p-3 text-sm">
                <div className="text-blue-200 font-medium mb-1">
                  📋 {currentStage.stageName} - {optimalFocus.reasoning}
                </div>
                {stageRecommendations.length > 0 && (
                  <div className="text-blue-300 text-xs">
                    💡 {stageRecommendations.join(' • ')}
                  </div>
                )}
              </div>
              
              {/* Performance Slider */}
              <div className="hover-scale">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex flex-col">
                    <label className="text-gray-300 font-medium">
                      {stageFocusLabels.performance.label} ({projectFocus.performance}%)
                    </label>
                    <span className="text-xs text-gray-400">
                      {stageFocusLabels.performance.description}
                    </span>
                  </div>
                  {/* The Optimal text can be removed or kept as per preference, color change is primary */}
                  {/* {Math.abs(focusAllocation.performance - optimalFocus.performance) <= 10 && (
                    <span className="text-green-400 text-xs">✓ Optimal</span>
                  )} */}
                </div>
                <div className="relative group">
                  <Slider
                    value={[projectFocus.performance]}
                    onValueChange={(value) => {
                      playSound('slider.wav', 0.3);
                      const newFocus = { ...projectFocus, performance: value[0] };
                      setGameState(prev => ({
                        ...prev,
                        activeProject: prev.activeProject ? { ...prev.activeProject, focusAllocation: newFocus } : null,
                        // Also update in activeProjects array if multi-project is primary
                        activeProjects: prev.activeProjects.map(p => 
                          p.id === project.id ? { ...p, focusAllocation: newFocus } : p
                        ),
                      }));
                    }}
                    max={100}
                    step={5}
                    className={`w-full transition-all duration-300 ease-in-out ${
                      Math.abs(projectFocus.performance - optimalFocus.performance) <= 10 
                        ? '[&_.bg-primary]:bg-gradient-to-r from-green-400 to-green-600 [&_.border-primary]:border-green-700' 
                        : Math.abs(projectFocus.performance - optimalFocus.performance) <= 25
                          ? '[&_.bg-primary]:bg-gradient-to-r from-yellow-400 to-yellow-600 [&_.border-primary]:border-yellow-700'
                          : '[&_.bg-primary]:bg-gradient-to-r from-blue-400 to-blue-600'
                    }`}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  💡 {stageFocusLabels.performance.impact}
                </div>
              </div>

              {/* Sound Capture Slider */}
              <div className="hover-scale">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex flex-col">
                    <label className="text-gray-300 font-medium">
                      {stageFocusLabels.soundCapture.label} ({projectFocus.soundCapture}%)
                    </label>
                    <span className="text-xs text-gray-400">
                      {stageFocusLabels.soundCapture.description}
                    </span>
                  </div>
                  {/* {Math.abs(focusAllocation.soundCapture - optimalFocus.soundCapture) <= 10 && (
                    <span className="text-green-400 text-xs">✓ Optimal</span>
                  )} */}
                </div>
                <div className="relative group">
                  {/* Tooltip removed as staff variable is not available here */}
                  <Slider
                    value={[projectFocus.soundCapture]}
                    onValueChange={(value) => {
                      playSound('slider.wav', 0.3);
                      const newFocus = { ...projectFocus, soundCapture: value[0] };
                       setGameState(prev => ({
                        ...prev,
                        activeProject: prev.activeProject ? { ...prev.activeProject, focusAllocation: newFocus } : null,
                        activeProjects: prev.activeProjects.map(p => 
                          p.id === project.id ? { ...p, focusAllocation: newFocus } : p
                        ),
                      }));
                    }}
                    max={100}
                    step={5}
                    className={`w-full transition-all duration-300 ease-in-out ${
                      Math.abs(projectFocus.soundCapture - optimalFocus.soundCapture) <= 10
                        ? '[&_.bg-primary]:bg-gradient-to-r from-green-400 to-green-600 [&_.border-primary]:border-green-700'
                        : Math.abs(projectFocus.soundCapture - optimalFocus.soundCapture) <= 25
                          ? '[&_.bg-primary]:bg-gradient-to-r from-yellow-400 to-yellow-600 [&_.border-primary]:border-yellow-700'
                          : '[&_.bg-primary]:bg-gradient-to-r from-blue-400 to-blue-600'
                    }`}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  💡 {stageFocusLabels.soundCapture.impact}
                </div>
              </div>

              {/* Layering Slider */}
              <div className="hover-scale">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex flex-col">
                    <label className="text-gray-300 font-medium">
                      {stageFocusLabels.layering.label} ({projectFocus.layering}%)
                    </label>
                    <span className="text-xs text-gray-400">
                      {stageFocusLabels.layering.description}
                    </span>
                  </div>
                  {/* {Math.abs(focusAllocation.layering - optimalFocus.layering) <= 10 && (
                    <span className="text-green-400 text-xs">✓ Optimal</span>
                  )} */}
                </div>
                <div className="relative group">
                  {/* Tooltip removed as staff variable is not available here */}
                  <Slider
                    value={[projectFocus.layering]}
                    onValueChange={(value) => {
                      playSound('slider.wav', 0.3);
                      const newFocus = { ...projectFocus, layering: value[0] };
                      setGameState(prev => ({
                        ...prev,
                        activeProject: prev.activeProject ? { ...prev.activeProject, focusAllocation: newFocus } : null,
                        activeProjects: prev.activeProjects.map(p => 
                          p.id === project.id ? { ...p, focusAllocation: newFocus } : p
                        ),
                      }));
                    }}
                    max={100}
                    step={5}
                    className={`w-full transition-all duration-300 ease-in-out ${
                      Math.abs(projectFocus.layering - optimalFocus.layering) <= 10
                        ? '[&_.bg-primary]:bg-gradient-to-r from-green-400 to-green-600 [&_.border-primary]:border-green-700'
                        : Math.abs(projectFocus.layering - optimalFocus.layering) <= 25
                          ? '[&_.bg-primary]:bg-gradient-to-r from-yellow-400 to-yellow-600 [&_.border-primary]:border-yellow-700'
                          : '[&_.bg-primary]:bg-gradient-to-r from-blue-400 to-blue-600'
                    }`}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  💡 {stageFocusLabels.layering.impact}
                </div>
              </div>

              {/* Focus suggestions */}
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

              {/* Optimal focus button */}
              <Button
                onClick={() => {
                  const newFocus = {
                    performance: optimalFocus.performance,
                    soundCapture: optimalFocus.soundCapture,
                    layering: optimalFocus.layering,
                  };
                  setGameState(prev => ({
                    ...prev,
                    activeProject: prev.activeProject ? { ...prev.activeProject, focusAllocation: newFocus } : null,
                    activeProjects: prev.activeProjects.map(p => 
                      p.id === project.id ? { ...p, focusAllocation: newFocus } : p
                    ),
                  }));
                  playSound('notification.wav', 0.4);
                  toast({
                    title: "🎯 Optimal Focus Applied",
                    description: `Set focus for ${currentStage.stageName}`,
                    className: "bg-gray-800 border-gray-600 text-white",
                  });
                }}
                disabled={!canUseOptimalFocusButton}
                variant="outline"
                size="sm"
                className={`w-full transition-colors duration-200 ${
                  canUseOptimalFocusButton
                    ? 'bg-blue-900/30 border-blue-600/50 text-blue-200 hover:bg-blue-800/50'
                    : 'bg-gray-700/30 border-gray-600/50 text-gray-400 cursor-not-allowed'
                }`}
              >
                {canUseOptimalFocusButton
                  ? `🎯 Apply Optimal Focus for ${currentStage.stageName}`
                  : `🎯 Apply Optimal Focus (Lvl 5+ or Mgmt Lvl 3+)`}
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
          </div> {/* Closing the new inner wrapper div */}
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
