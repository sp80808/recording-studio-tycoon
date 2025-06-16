import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { MinigameManager } from './minigames/MinigameManager';
import { MinigameType } from '@/types/miniGame';
import { AnimatedStatBlobs } from './AnimatedStatBlobs';
import { OrbAnimationStyles } from './OrbAnimationStyles';
import { ProjectCompletionCelebration } from './ProjectCompletionCelebration';
import { EnhancedAnimationStyles } from './EnhancedAnimationStyles';
import { StaffAssignmentSection } from './StaffAssignmentSection';
import { toast } from '@/hooks/use-toast';
import { gameAudio } from '@/utils/audioSystem';
import {
  getStageFocusLabels,
  calculateFocusEffectiveness,
  getStageFocusRecommendations,
  StageOptimalFocus // Correctly import StageOptimalFocus
} from '@/utils/stageUtils';
import { getOptimalSliderPositions as getStaffOptimalSliderPositions } from '@/utils/staffAssignmentUtils';
import { useProjectManagement } from '@/hooks/useProjectManagement';
import { useStaffManagement } from '@/hooks/useStaffManagement';
import { GameState, FocusAllocation, Project, StaffMember, ProjectReport } from '@/types/game';

export interface ActiveProjectProps {
  gameState: GameState;
  setGameState: (stateOrFn: GameState | ((prev: GameState) => GameState)) => void;
  focusAllocation: FocusAllocation;
  setFocusAllocation: (allocation: FocusAllocation) => void;
  performDailyWork?: () => { isComplete: boolean; finalProjectData?: Project | null; review?: ProjectReport | null } | undefined;
  onMinigameReward?: (creativityBonus: number, technicalBonus: number, xpBonus: number, minigameType?: string) => void;
  onProjectComplete?: (completedProject: Project, review: ProjectReport | null) => void;
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
  autoTriggeredMinigame,
  clearAutoTriggeredMinigame,
}) => {
  const { completeProject } = useProjectManagement({ gameState, setGameState });
  const staffManagement: ReturnType<typeof useStaffManagement> = useStaffManagement(gameState, setGameState); // Explicitly type the staffManagement object

  useEffect(() => {
    console.log("ActiveProject: staffManagement object:", staffManagement);
    console.log("ActiveProject: staffManagement.assignStaffToProject:", staffManagement.assignStaffToProject);
    console.log("ActiveProject: staffManagement.unassignStaffFromProject:", staffManagement.unassignStaffFromProject);
  }, [staffManagement]);

  const [showMinigame, setShowMinigame] = useState(false);
  const [selectedMinigame, setSelectedMinigame] = useState<MinigameType>('rhythmTiming');
  const [lastGains, setLastGains] = useState<{ creativity: number; technical: number }>({ creativity: 0, technical: 0 });
  const [showBlobAnimation, setShowBlobAnimation] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationDisplayData, setCelebrationDisplayData] = useState<{ title: string; genre: string } | null>(null);
  const [projectDataForCompletionCall, setProjectDataForCompletionCall] = useState<Project | null>(null);
  const [reviewDataForCompletionCall, setReviewDataForCompletionCall] = useState<ProjectReport | null>(null);
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
  }, [gameState.activeProject, gameState.activeProject?.currentStageIndex, completedMinigamesForStage, clearAutoTriggeredMinigame]);

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
  const currentStage = project.stages[project.currentStageIndex] || project.stages[0];
  const currentStageProgress = currentStage ? (currentStage.workUnitsCompleted / currentStage.workUnitsBase) * 100 : 0;

  const assignedStaffToCurrentProject: StaffMember[] = gameState.hiredStaff.filter(
    (staff) => staff.assignedProjectId === project.id
  );

  const stageFocusLabels = getStageFocusLabels(currentStage);
  const optimalFocusFromStaff: StageOptimalFocus = getStaffOptimalSliderPositions(assignedStaffToCurrentProject, currentStage);
  
  const focusEffectiveness = calculateFocusEffectiveness(focusAllocation, optimalFocusFromStaff);
  const stageRecommendations = getStageFocusRecommendations(currentStage);
  
  const totalWorkUnits = project.stages.reduce((total, stage) => total + stage.workUnitsBase, 0);
  const completedWorkUnits = project.stages.reduce((total, stage) => total + stage.workUnitsCompleted, 0);
  const overallProgress = totalWorkUnits > 0 ? (completedWorkUnits / totalWorkUnits) * 100 : 0;

  const handleMinigameRewardInternal = (creativityBonus: number, technicalBonus: number, xpBonus: number) => {
    if (onMinigameReward) {
      onMinigameReward(creativityBonus, technicalBonus, xpBonus, selectedMinigame);
    }
    
    const currentStageKey = `${project.id}-${project.currentStageIndex}`;
    setCompletedMinigamesForStage(prev => new Set([...prev, currentStageKey]));
    setShowMinigame(false);
    if (clearAutoTriggeredMinigame) clearAutoTriggeredMinigame();
    setPulseAnimation(false);
    toast({
      title: "🎉 Production Challenge Complete!",
      description: `+${creativityBonus}C, +${technicalBonus}T, +${xpBonus}XP`,
      className: "bg-gray-800 border-gray-600 text-white",
      duration: 3000
    });
    
    if (performDailyWork) {
        setTimeout(() => {
            const result = performDailyWork();
            if (result?.isComplete && result.finalProjectData) {
                gameAudio.playCompleteProject();
                setCelebrationDisplayData({ title: result.finalProjectData.title, genre: result.finalProjectData.genre });
                setProjectDataForCompletionCall(result.finalProjectData);
                setReviewDataForCompletionCall(result.review || null);
                setShowCelebration(true);
            }
        }, 1000);
    }
  };

  const handleWork = () => {
    gameAudio.playClick();
    if (autoTriggeredMinigame && !completedMinigamesForStage.has(`${project.id}-${project.currentStageIndex}`)) {
      setSelectedMinigame(autoTriggeredMinigame.type);
      setShowMinigame(true);
      gameAudio.playUISound('notice');
      return;
    }

    const tempCreativityGain = Math.floor((gameState.playerData.dailyWorkCapacity * gameState.playerData.attributes.creativeIntuition) * (focusAllocation.creativity / 100));
    const tempTechnicalGain = Math.floor((gameState.playerData.dailyWorkCapacity * gameState.playerData.attributes.technicalAptitude) * (focusAllocation.technical / 100));
    setLastGains({ creativity: tempCreativityGain, technical: tempTechnicalGain });
    setShowBlobAnimation(true);
    
    if (performDailyWork) {
        const result = performDailyWork();
        if (result?.isComplete && result.finalProjectData) {
            gameAudio.playCompleteProject();
            setCelebrationDisplayData({ title: result.finalProjectData.title, genre: result.finalProjectData.genre });
            setProjectDataForCompletionCall(result.finalProjectData);
            setReviewDataForCompletionCall(result.review || null);
            setShowCelebration(true);
        }
    }
  };

  const handleProjectCelebrationComplete = () => {
    if (onProjectComplete && projectDataForCompletionCall) {
      onProjectComplete(projectDataForCompletionCall, reviewDataForCompletionCall);
    }
    setShowCelebration(false);
    setCelebrationDisplayData(null);
    setProjectDataForCompletionCall(null);
    setReviewDataForCompletionCall(null);
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
          onComplete={() => { setShowBlobAnimation(false); setLastGains({ creativity: 0, technical: 0 }); }}
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
            {/* UI Content */}
            <div className="flex justify-between items-start mb-4">
              <div className="animate-fade-in">
                <h3 className="text-xl font-bold text-white mb-1">{project.title}</h3>
                <p className="text-gray-300 text-sm mb-2">{project.genre} • {project.clientType}</p>
                {/* ... other project details ... */}
              </div>
              {/* ... other UI elements ... */}
            </div>
            {/* ... rest of the UI ... */}
             <div className="mb-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-semibold flex items-center gap-2">
                  Current Stage: {currentStage?.stageName}
                </span>
                <span className="text-gray-400 flex items-center gap-1">
                  {currentStage?.workUnitsCompleted || 0}/{(currentStage?.workUnitsRequired || currentStage?.workUnitsBase) || 0}
                </span>
              </div>
              <Progress value={currentStageProgress} className="h-3 mb-2" />
            </div>
            <div className="mb-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-semibold">Overall Progress</span>
                <span className="text-gray-400">{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-3" />
            </div>
            <div className="space-y-4 mb-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="flex justify-between items-center">
                <h4 className="text-white font-semibold">Focus Allocation</h4>
                {/* ... focus effectiveness display ... */}
              </div>
              {/* ... focus sliders ... */}
               <div className="hover-scale">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-gray-300 font-medium">Performance ({focusAllocation.performance}%)</label>
                </div>
                <Slider value={[focusAllocation.performance]} onValueChange={(v) => setFocusAllocation({...focusAllocation, performance: v[0]})} max={100} step={5} />
              </div>
              <div className="hover-scale">
                 <div className="flex justify-between items-center mb-2">
                  <label className="text-gray-300 font-medium">Sound Capture ({focusAllocation.soundCapture}%)</label>
                </div>
                <Slider value={[focusAllocation.soundCapture]} onValueChange={(v) => setFocusAllocation({...focusAllocation, soundCapture: v[0]})} max={100} step={5} />
              </div>
              <div className="hover-scale">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-gray-300 font-medium">Layering ({focusAllocation.layering}%)</label>
                </div>
                <Slider value={[focusAllocation.layering]} onValueChange={(v) => setFocusAllocation({...focusAllocation, layering: v[0]})} max={100} step={5} />
              </div>
               <div className="hover-scale">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-gray-300 font-medium">Creativity ({focusAllocation.creativity}%)</label>
                </div>
                <Slider value={[focusAllocation.creativity]} onValueChange={(v) => setFocusAllocation({...focusAllocation, creativity: v[0]})} max={100} step={5} />
              </div>
              <div className="hover-scale">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-gray-300 font-medium">Technical ({focusAllocation.technical}%)</label>
                </div>
                <Slider value={[focusAllocation.technical]} onValueChange={(v) => setFocusAllocation({...focusAllocation, technical: v[0]})} max={100} step={5} />
              </div>
              <div className="hover-scale">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-gray-300 font-medium">Business ({focusAllocation.business}%)</label>
                </div>
                <Slider value={[focusAllocation.business]} onValueChange={(v) => setFocusAllocation({...focusAllocation, business: v[0]})} max={100} step={5} />
              </div>
            </div>
            <Button onClick={handleWork} disabled={gameState.playerData.dailyWorkCapacity <= 0 || isProjectComplete} className="w-full">
              {isProjectComplete ? 'Project Complete!' : `Work on Project (${gameState.playerData.dailyWorkCapacity} energy left)`}
            </Button>
          </div>
        </Card>
        
        <StaffAssignmentSection
          projectId={project.id}
          project={project}
          availableStaff={gameState.hiredStaff.filter(staff => !staff.assignedProjectId || staff.assignedProjectId !== project.id)}
          assignedStaff={assignedStaffToCurrentProject}
          onAssign={staffManagement.assignStaffToProject} // Use from hook
          onUnassign={staffManagement.unassignStaffFromProject} // Use from hook
          onAutoOptimize={() => toast({ title: "Auto-Optimize", description: "Coming soon!" })}
        />
        
        <MinigameManager
          isOpen={showMinigame}
          onClose={() => { setShowMinigame(false); if (clearAutoTriggeredMinigame) clearAutoTriggeredMinigame(); setPulseAnimation(false); }}
          gameType={selectedMinigame}
          onReward={handleMinigameRewardInternal}
          onComplete={() => {}}
          difficulty={1} 
          gameState={gameState}
        />
      </div>
    </>
  );
};
