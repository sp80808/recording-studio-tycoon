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

  const completeProject = useCallback((state: GameState) => {
    if (!state.activeProject) return;

    const project = state.activeProject;
    const totalQuality = project.qualityScore || 0;
    const totalEfficiency = project.efficiencyScore || 0;

    // Calculate final score and rewards
    const finalScore = Math.floor((totalQuality + totalEfficiency) / 2);
    const payout = Math.floor((project.payoutBase ?? 0) * (finalScore / 100));
    const repGain = Math.floor((project.repGainBase ?? 0) * (finalScore / 100));

    // Update game state
    setGameState((prev: GameState) => {
      const updatedCompletedProjects = prev.completedProjects ? [...prev.completedProjects, project] : [project];
      return {
        ...prev,
        playerData: {
          ...prev.playerData,
          money: prev.playerData.money + payout,
          reputation: prev.playerData.reputation + repGain,
        },
        activeProject: null,
        completedProjects: updatedCompletedProjects,
      };
    });

    return {
      projectTitle: project.title,
      qualityScore: totalQuality,
      efficiencyScore: totalEfficiency,
      finalScore,
      payout,
      repGain
    };
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
      if (!newState.activeProject) return newState; // Ensure activeProject exists
      const currentStage = newState.activeProject.stages[newState.activeProject.currentStage];

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
        if (newState.activeProject && currentStage.id === newState.activeProject.stages[newState.activeProject.stages.length - 1].id) {
          completeProject(newState); 
        } else if (newState.activeProject) {
          newState.activeProject.currentStage++;
        }
      }

      return newState;
    });
  }, [gameState.activeProject, setGameState, completeProject]); 

  const handleMinigameComplete = useCallback((score: number) => {
    if (!activeMinigame || !gameState.activeProject) return;

    setGameState((prev: GameState) => {
      const newState = { ...prev };
      if (!newState.activeProject) return newState; // Ensure activeProject exists
      const currentStage = newState.activeProject.stages[newState.activeProject.currentStage];

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
      if (currentStage && 'minigameTriggers' in currentStage && Array.isArray((currentStage as { minigameTriggers: MinigameTrigger[] }).minigameTriggers)) {
        const triggers = (currentStage as { minigameTriggers: MinigameTrigger[] }).minigameTriggers;
        const trigger = triggers.find((t: MinigameTrigger) => t.id === activeMinigame.id);
        if (trigger) {
          // Assuming lastTriggered is a property that can be set
          (trigger as MinigameTrigger & { lastTriggered?: number }).lastTriggered = Date.now();
        }
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
