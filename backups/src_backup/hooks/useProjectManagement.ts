import { useState, useCallback } from 'react';
import { GameState, Project, ProjectStage, MinigameTrigger } from '@/types/game';
import { addWorkUnit, applyFocusBonuses, calculateStageQuality, calculateTimeEfficiency } from '@/utils/projectWorkUtils';

interface UseProjectManagementProps {
  gameState: GameState;
  setGameState: (state: GameState | ((prev: GameState) => GameState)) => void;
}

export const useProjectManagement = ({ gameState, setGameState }: UseProjectManagementProps) => {
  const [activeMinigame, setActiveMinigame] = useState<MinigameTrigger | null>(null);

  const startProject = useCallback((project: Project) => {
    setGameState((prev: GameState) => ({
      ...prev,
      activeProject: project,
      availableProjects: prev.availableProjects.filter((p: Project) => p.id !== project.id)
    }));
  }, [setGameState]);

  const addWork = useCallback((
    type: 'creativity' | 'technical',
    value: number,
    source: 'player' | 'staff',
    sourceId?: string
  ) => {
    if (!gameState.activeProject) return;

    setGameState((prev: GameState) => {
      const newState = { ...prev };
      const currentStage = newState.activeProject!.stages[newState.activeProject!.currentStageIndex];

      // Add work unit
      const workUnit = addWorkUnit(currentStage, type, value, source, sourceId);

      // Apply focus bonuses
      const bonusValue = applyFocusBonuses(currentStage, workUnit);
      currentStage.workUnitsCompleted += bonusValue;

      // Check if stage is complete
      if (currentStage.workUnitsCompleted >= currentStage.workUnitsRequired) {
        const quality = calculateStageQuality(currentStage);
        const efficiency = calculateTimeEfficiency(currentStage);

        // Apply quality and efficiency bonuses
        newState.activeProject!.qualityScore = (newState.activeProject!.qualityScore || 0) + quality;
        newState.activeProject!.efficiencyScore = (newState.activeProject!.efficiencyScore || 0) + efficiency;

        // Move to next stage or complete project
        if (currentStage.id === newState.activeProject!.stages[newState.activeProject!.stages.length - 1].id) {
          completeProject(newState);
        } else {
          newState.activeProject!.currentStageIndex++;
        }
      }

      return newState;
    });
  }, [gameState.activeProject, setGameState]);

  const completeProject = useCallback((state: GameState) => {
    if (!state.activeProject) return;

    const project = state.activeProject;
    const totalQuality = project.qualityScore || 0;
    const totalEfficiency = project.efficiencyScore || 0;

    // Calculate final score and rewards
    const finalScore = Math.floor((totalQuality + totalEfficiency) / 2);
    const payout = Math.floor(project.payoutBase * (finalScore / 100));
    const repGain = Math.floor(project.repGainBase * (finalScore / 100));

    // Update game state
    setGameState((prev: GameState) => ({
      ...prev,
      money: prev.money + payout,
      reputation: prev.reputation + repGain,
      activeProject: null,
      completedProjects: prev.completedProjects + 1
    }));

    return {
      projectTitle: project.title,
      qualityScore: totalQuality,
      efficiencyScore: totalEfficiency,
      finalScore,
      payout,
      repGain
    };
  }, [setGameState]);

  const handleMinigameComplete = useCallback((score: number) => {
    if (!activeMinigame || !gameState.activeProject) return;

    setGameState((prev: GameState) => {
      const newState = { ...prev };
      const currentStage = newState.activeProject!.stages[newState.activeProject!.currentStageIndex];

      // Apply minigame reward
      switch (activeMinigame.reward.type) {
        case 'quality':
          newState.activeProject!.qualityScore = (newState.activeProject!.qualityScore || 0) + score;
          break;
        case 'speed':
          currentStage.workUnitsCompleted += score;
          break;
        case 'xp':
          // TODO: Implement XP reward
          break;
      }

      // Update minigame trigger cooldown
      const trigger = currentStage.minigameTriggers.find(t => t.id === activeMinigame.id);
      if (trigger) {
        trigger.lastTriggered = Date.now();
      }

      return newState;
    });

    setActiveMinigame(null);
  }, [activeMinigame, gameState.activeProject, setGameState]);

  return {
    startProject,
    addWork,
    completeProject,
    activeMinigame,
    setActiveMinigame,
    handleMinigameComplete
  };
}; 