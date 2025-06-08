
import { useCallback } from 'react';
import { GameState, Project } from '@/types/game';
import { generateNewProjects } from '@/utils/projectUtils';
import { toast } from '@/hooks/use-toast';

export const useProjectManagement = (gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState>>) => {
  const startProject = useCallback((project: Project) => {
    if (gameState.activeProject) {
      toast({
        title: "Project Already Active",
        description: "Complete your current project before starting another.",
        variant: "destructive"
      });
      return;
    }

    setGameState(prev => ({
      ...prev,
      activeProject: { ...project, currentStageIndex: 0 },
      availableProjects: prev.availableProjects.filter(p => p.id !== project.id)
    }));

    toast({
      title: "Project Started!",
      description: `Now working on: ${project.title}`,
    });
  }, [gameState.activeProject, setGameState]);

  const completeProject = useCallback((project: Project, addStaffXP: (staffId: string, amount: number) => void) => {
    const qualityScore = (project.accumulatedCPoints + project.accumulatedTPoints) / 20;
    const payout = Math.floor(project.payoutBase * (0.8 + qualityScore * 0.4));
    const repGain = Math.floor(project.repGainBase * (0.8 + qualityScore * 0.4));
    const xpGain = 25 + Math.floor(qualityScore * 10);

    const review = {
      projectTitle: project.title,
      qualityScore: Math.min(100, Math.floor(qualityScore * 10)),
      payout,
      repGain,
      xpGain,
      creativityPoints: project.accumulatedCPoints,
      technicalPoints: project.accumulatedTPoints
    };

    // Give XP to assigned staff
    const assignedStaff = gameState.hiredStaff.filter(s => s.assignedProjectId === project.id);
    assignedStaff.forEach(staff => {
      addStaffXP(staff.id, 20 + Math.floor(qualityScore * 5));
    });

    // Unassign staff from completed project
    setGameState(prev => ({
      ...prev,
      money: prev.money + payout,
      reputation: prev.reputation + repGain,
      activeProject: null,
      availableProjects: [...prev.availableProjects, ...generateNewProjects(1, prev.playerData.level)], // Pass player level
      playerData: {
        ...prev.playerData,
        xp: prev.playerData.xp + xpGain
      },
      hiredStaff: prev.hiredStaff.map(s => 
        s.assignedProjectId === project.id 
          ? { ...s, status: 'Idle' as const, assignedProjectId: null }
          : s
      )
    }));

    return review;
  }, [gameState.hiredStaff, setGameState]);

  return {
    startProject,
    completeProject
  };
};
