import { useCallback, useRef, useState } from 'react';
import { GameState, FocusAllocation, Project, Staff, MinigameTrigger } from '@/types/game';
import { calculateStudioSkillBonus, getEquipmentBonuses } from '@/utils/gameUtils';
import { getCreativityMultiplier, getTechnicalMultiplier, getFocusEffectiveness } from '@/utils/playerUtils';
import { shouldAutoTriggerMinigame } from '@/utils/minigameUtils';
import { toast } from '@/hooks/use-toast';

interface UseStageWorkProps {
  gameState: GameState;
  focusAllocation: FocusAllocation;
  createOrb: (type: string, x: number, y: number) => void;
  setGameState: (state: Partial<GameState>) => void;
  completeProject: (projectId: string) => void;
  addStaffXP: (staffId: string, skill: string, amount: number) => void;
  advanceDay: () => void;
}

interface StageWork {
  id: string;
  name: string;
  duration: number;
  progress: number;
  status: 'pending' | 'in_progress' | 'completed';
}

interface StageWorkHook {
  performDailyWork: () => { review: string | null; isComplete: boolean };
  orbContainerRef: React.RefObject<HTMLDivElement>;
  autoTriggeredMinigame: MinigameTrigger | null;
  clearAutoTriggeredMinigame: () => void;
  startWork: (work: StageWork) => void;
  updateProgress: (workId: string, progress: number) => void;
  completeWork: (workId: string) => void;
}

export const useStageWork = ({
  gameState,
  focusAllocation,
  createOrb,
  setGameState,
  completeProject,
  addStaffXP,
  advanceDay
}: UseStageWorkProps): StageWorkHook => {
  const orbContainerRef = useRef<HTMLDivElement>(null);
  const [autoTriggeredMinigame, setAutoTriggeredMinigame] = useState<MinigameTrigger | null>(null);

  const getMoodEffectiveness = useCallback((staff: Staff) => {
    const mood = staff.mood || 50;
    return 0.5 + (mood / 100);
  }, []);

  const performDailyWork = useCallback(() => {
    const activeProject = gameState.activeProject;
    if (!activeProject) return { review: null, isComplete: false };

    const currentStage = activeProject.stages[activeProject.currentStage];
    if (!currentStage || currentStage.isCompleted) return { review: null, isComplete: false };

    // Process staff work
    gameState.staff.forEach((staff: Staff) => {
      if (staff.assignedProject === activeProject.id) {
        const effectiveness = getMoodEffectiveness(staff);
        const xpGain = Math.round(10 * effectiveness);
        addStaffXP(staff.id, currentStage.type, xpGain);
      }
    });

    // Update project progress
    const progress = Math.min(currentStage.progress + 10, 100);
    setGameState({
      activeProject: {
        ...activeProject,
        stages: activeProject.stages.map((stage, index) =>
          index === activeProject.currentStage
            ? { ...stage, progress }
            : stage
        )
      }
    });

    // Check for minigame triggers
    if (Math.random() < 0.3) {
      const trigger: MinigameTrigger = {
        id: `mg-${currentStage.type}-${Date.now()}`, // Simple unique ID
        type: currentStage.type,
        reason: 'quality_check',
        priority: 'medium',
        reward: { // Default reward, can be customized
          type: 'quality',
          value: 10 
        }
      };
      setAutoTriggeredMinigame(trigger);
    }

    // Check for stage completion
    if (progress >= 100) {
      completeProject(activeProject.id);
      return { review: 'Stage completed!', isComplete: true };
    }

    return { review: null, isComplete: false };
  }, [gameState, setGameState, completeProject, addStaffXP, getMoodEffectiveness]);

  const startWork = useCallback((work: StageWork) => {
    console.log('Starting work:', work);
  }, []);

  const updateProgress = useCallback((workId: string, progress: number) => {
    console.log('Updating progress:', workId, progress);
  }, []);

  const completeWork = useCallback((workId: string) => {
    console.log('Completing work:', workId);
  }, []);

  return {
    performDailyWork,
    orbContainerRef,
    autoTriggeredMinigame,
    clearAutoTriggeredMinigame: () => setAutoTriggeredMinigame(null),
    startWork,
    updateProgress,
    completeWork
  };
};
