
import { useCallback } from 'react';
import { GameState, Project, ProjectReport } from '@/types/game';
import { generateNewProjects } from '@/utils/projectUtils';
import { toast } from '@/hooks/use-toast';
import { applyReportToState } from '@/game-mechanics/ProjectService';

export const useProjectManagement = (gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState>>) => {
  const startProject = useCallback((project: Project) => {
    if (gameState.activeProject) {
      toast({
        title: "🎵 Project Already Active",
        description: "Complete your current project before starting another.",
        className: "bg-gray-800 border-gray-600 text-white",
        variant: "destructive"
      });
      return false;
    }

    setGameState(prev => ({
      ...prev,
      activeProject: { ...project, currentStageIndex: 0 },
      availableProjects: prev.availableProjects.filter(p => p.id !== project.id)
    }));

    toast({
      title: "🎵 Project Started!",
      description: `Now working on: ${project.title}`,
      className: "bg-gray-800 border-gray-600 text-white",
    });
    return true;
  }, [gameState.activeProject, setGameState]);

  const completeProject = useCallback((projectReport: ProjectReport): ProjectReport => {
    // Single canonical settlement (bead ruc.2): money, reputation, influence,
    // financial income/profit/report history and player/staff skill XP all come
    // from applyReportToState — the same pure function the background
    // multi-project path (ProjectService) uses, so the two can't drift apart.
    setGameState(prev => {
      const settled = applyReportToState(prev, projectReport);
      return {
        ...settled,
        activeProject: null, // Assuming single active project for now, will adapt if multi-project
        availableProjects: [
          ...settled.availableProjects,
          ...generateNewProjects(1, settled.playerData.level, settled.currentEra),
        ],
      };
    });

    return projectReport;
  }, [setGameState]); // gameState is read via prev inside setGameState

  return {
    startProject,
    completeProject
  };
};
