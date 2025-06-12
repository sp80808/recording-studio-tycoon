import { useState, useCallback } from 'react';
import { GameState, Project, ProjectStage, MinigameTrigger, ProjectReport } from '@/types/game'; // Import ProjectReport
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

  const completeProject = useCallback((state: GameState): ProjectReport | undefined => { // Added return type
    if (!state.activeProject) return undefined;

    const project = state.activeProject;
    const totalQuality = project.qualityScore || 0;
    const totalEfficiency = project.efficiencyScore || 0;

    const finalScore = Math.floor((totalQuality + totalEfficiency) / 2);
    const payout = Math.floor((project.payoutBase ?? 0) * (finalScore / 100));
    const repGain = Math.floor((project.repGainBase ?? 0) * (finalScore / 100));
    const xpGain = Math.floor((finalScore * (project.difficulty || 1) * 10) / 2); 

    setGameState((prev: GameState) => {
      // Ensure project is the one from the state passed to completeProject for consistency
      const projectToComplete = prev.activeProject && prev.activeProject.id === project.id ? prev.activeProject : project;
      
      const updatedCompletedProjects = prev.completedProjects ? [...prev.completedProjects, projectToComplete] : [projectToComplete];
      return {
        ...prev,
        money: prev.money + payout, 
        playerData: {
          ...prev.playerData,
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
      repGain,
      xpGain 
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
      if (!newState.activeProject) return newState; 
      const currentStage = newState.activeProject.stages[newState.activeProject.currentStageIndex]; 

      const workUnit = addWorkUnit(currentStage, type, value, source, sourceId);
      const bonusValue = applyFocusBonuses(currentStage, workUnit);
      currentStage.workUnitsCompleted += bonusValue;

      if (currentStage.workUnitsCompleted >= (currentStage.workUnitsRequired || currentStage.workUnitsBase)) { // Handle optional workUnitsRequired
        const quality = calculateStageQuality(currentStage);
        const efficiency = calculateTimeEfficiency(currentStage);

        newState.activeProject.qualityScore = (newState.activeProject.qualityScore || 0) + quality;
        newState.activeProject.efficiencyScore = (newState.activeProject.efficiencyScore || 0) + efficiency;

        if (currentStage.id === newState.activeProject.stages[newState.activeProject.stages.length - 1].id) {
          completeProject(newState); 
        } else {
          newState.activeProject = {
            ...newState.activeProject,
            currentStageIndex: newState.activeProject.currentStageIndex + 1,
          };
        }
      }
      return newState;
    });
  }, [gameState.activeProject, setGameState, completeProject]); 

  const handleMinigameComplete = useCallback((score: number) => {
    if (!activeMinigame || !gameState.activeProject) return;

    setGameState((prev: GameState) => {
      const newState = { ...prev };
      if (!newState.activeProject) return newState;
      const currentStage = newState.activeProject.stages[newState.activeProject.currentStageIndex];

      // Assuming activeMinigame.rewards is an array and we take the first reward's type
      const rewardType = activeMinigame.rewards[0]?.type; 

      switch (rewardType) {
        case 'quality':
          newState.activeProject.qualityScore = (newState.activeProject.qualityScore || 0) + score;
          break;
        case 'speed':
          currentStage.workUnitsCompleted += score;
          break;
        case 'xp':
          // TODO: Implement XP reward for player/staff
          // This might involve calling a function passed via props or context
          console.log("Minigame XP reward to implement:", score);
          break;
      }

      if (currentStage && currentStage.minigameTriggers) {
        const trigger = currentStage.minigameTriggers.find((t: MinigameTrigger) => t.id === activeMinigame.id);
        if (trigger) {
          trigger.lastTriggered = Date.now();
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
