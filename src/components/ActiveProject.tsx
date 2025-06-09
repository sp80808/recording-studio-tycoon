
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GameState, FocusAllocation } from '@/types/game';
import { MinigameManager, MinigameType } from './minigames/MinigameManager';
import { shouldAutoTriggerMinigame } from '@/utils/minigameUtils';
import { AnimatedStatBlobs } from './AnimatedStatBlobs';
import { OrbAnimationStyles } from './OrbAnimationStyles';
import { ProjectCompletionCelebration } from './ProjectCompletionCelebration';
import { toast } from '@/hooks/use-toast';
import { ProjectHeader } from './project/ProjectHeader';
import { ProjectProgress } from './project/ProjectProgress';
import { FocusAllocationControls } from './project/FocusAllocationControls';
import { MinigameNotification } from './project/MinigameNotification';
import { EmptyProjectState } from './project/EmptyProjectState';

interface ActiveProjectProps {
  gameState: GameState;
  focusAllocation: FocusAllocation;
  setFocusAllocation: (allocation: FocusAllocation) => void;
  performDailyWork: () => { isComplete: boolean; review?: any } | undefined;
  onMinigameReward?: (creativityBonus: number, technicalBonus: number, xpBonus: number, minigameType?: string) => void;
  onProjectComplete?: () => void;
}

export const ActiveProject: React.FC<ActiveProjectProps> = ({
  gameState,
  focusAllocation,
  setFocusAllocation,
  performDailyWork,
  onMinigameReward,
  onProjectComplete
}) => {
  const [showMinigame, setShowMinigame] = useState(false);
  const [selectedMinigame, setSelectedMinigame] = useState<MinigameType>('rhythm');
  const [lastGains, setLastGains] = useState<{ creativity: number; technical: number }>({ creativity: 0, technical: 0 });
  const [showBlobAnimation, setShowBlobAnimation] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [autoTriggeredMinigame, setAutoTriggeredMinigame] = useState<{
    type: MinigameType;
    reason: string;
  } | null>(null);
  const [pulseAnimation, setPulseAnimation] = useState(false);
  const [completedMinigamesForStage, setCompletedMinigamesForStage] = useState<Set<string>>(new Set());

  // Clear auto-triggered minigame when project changes or stage advances
  useEffect(() => {
    if (gameState.activeProject) {
      const currentStageKey = `${gameState.activeProject.id}-${gameState.activeProject.currentStageIndex}`;
      const previousStageKey = Array.from(completedMinigamesForStage).find(key => 
        key.startsWith(`${gameState.activeProject!.id}-`) && key !== currentStageKey
      );
      
      if (previousStageKey && !completedMinigamesForStage.has(currentStageKey)) {
        setAutoTriggeredMinigame(null);
        setPulseAnimation(false);
      }
    }
  }, [gameState.activeProject?.currentStageIndex, completedMinigamesForStage]);

  // Auto-trigger minigames based on project stage and equipment
  useEffect(() => {
    if (gameState.activeProject && !showMinigame && !autoTriggeredMinigame) {
      const workCount = gameState.activeProject.workSessionCount || 0;
      const currentStageKey = `${gameState.activeProject.id}-${gameState.activeProject.currentStageIndex}`;
      
      if (completedMinigamesForStage.has(currentStageKey)) {
        return;
      }

      const trigger = shouldAutoTriggerMinigame(gameState.activeProject, gameState, focusAllocation, workCount);
      
      if (trigger) {
        const currentStage = gameState.activeProject.stages[gameState.activeProject.currentStageIndex];
        const isLastStage = gameState.activeProject.currentStageIndex >= gameState.activeProject.stages.length - 2;
        const stageProgress = currentStage ? (currentStage.workUnitsCompleted / currentStage.workUnitsBase) : 0;
        
        if (isLastStage || stageProgress >= 0.75) {
          setAutoTriggeredMinigame({
            type: trigger.minigameType,
            reason: trigger.triggerReason
          });
          
          setPulseAnimation(true);
          setTimeout(() => setPulseAnimation(false), 3000);
          
          toast({
            title: "🎯 Production Opportunity!",
            description: trigger.triggerReason,
            duration: 5000
          });
        }
      }
    }
  }, [gameState.activeProject, focusAllocation, showMinigame, autoTriggeredMinigame, completedMinigamesForStage]);

  if (!gameState.activeProject) {
    return <EmptyProjectState />;
  }

  const project = gameState.activeProject;
  const isProjectComplete = project.stages.every(stage => stage.completed);

  const handleMinigameReward = (creativityBonus: number, technicalBonus: number, xpBonus: number) => {
    console.log('🎮 Minigame rewards received:', { creativityBonus, technicalBonus, xpBonus, minigameType: selectedMinigame });
    
    if (onMinigameReward) {
      onMinigameReward(creativityBonus, technicalBonus, xpBonus, selectedMinigame);
    }
    
    const currentStageKey = `${project.id}-${project.currentStageIndex}`;
    setCompletedMinigamesForStage(prev => new Set([...prev, currentStageKey]));
    
    setShowMinigame(false);
    setAutoTriggeredMinigame(null);
    setPulseAnimation(false);
    
    toast({
      title: "🎉 Production Challenge Complete!",
      description: `+${creativityBonus} creativity, +${technicalBonus} technical, +${xpBonus} XP`,
      duration: 3000
    });

    setTimeout(() => {
      performDailyWork();
    }, 1000);
  };

  const handleWork = () => {
    if (autoTriggeredMinigame) {
      console.log('🎮 Starting auto-triggered minigame:', autoTriggeredMinigame.type);
      setSelectedMinigame(autoTriggeredMinigame.type);
      setShowMinigame(true);
      return;
    }

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
    
    const result = performDailyWork();
    
    if (result?.isComplete && result.review) {
      console.log('🎉 Project completed! Triggering celebration...');
      setTimeout(() => {
        setShowCelebration(true);
      }, 500);
      
      setTimeout(() => {
        setShowCelebration(false);
        if (onProjectComplete) {
          onProjectComplete();
        }
      }, 3000);
    }
  };

  return (
    <>
      <OrbAnimationStyles />
      <div className="flex-1 space-y-4 relative">
        <Card className="bg-gray-800/50 border-gray-600 p-6 backdrop-blur-sm animate-scale-in">
          <ProjectHeader project={project} />
          
          <MinigameNotification autoTriggeredMinigame={autoTriggeredMinigame} />
          
          <ProjectProgress project={project} />
          
          <FocusAllocationControls 
            focusAllocation={focusAllocation}
            setFocusAllocation={setFocusAllocation}
          />

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
            setAutoTriggeredMinigame(null);
            setPulseAnimation(false);
          }}
          gameType={selectedMinigame}
          onReward={handleMinigameReward}
        />

        {showBlobAnimation && (
          <AnimatedStatBlobs
            creativityGain={lastGains.creativity}
            technicalGain={lastGains.technical}
            onComplete={() => setShowBlobAnimation(false)}
            containerRef={{ current: document.querySelector('.relative') as HTMLDivElement }}
          />
        )}

        {showCelebration && gameState.activeProject && (
          <ProjectCompletionCelebration 
            isVisible={showCelebration}
            projectTitle={gameState.activeProject.title}
            genre={gameState.activeProject.genre}
            onComplete={() => setShowCelebration(false)}
          />
        )}
      </div>
    </>
  );
};
