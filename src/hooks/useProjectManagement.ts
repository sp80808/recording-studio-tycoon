import { useState, useCallback } from 'react';
import { GameState, Project, ProjectStage, MinigameTrigger, ProjectReport } from '@/types/game'; // Import ProjectReport
// Removed unused imports from projectWorkUtils as logic is now handled differently
import { generateNewProjects } from '@/utils/projectUtils'; // Keep this import for generateNewProjects
import { toast } from '@/hooks/use-toast';

interface UseProjectManagementProps {
  gameState: GameState;
  setGameState: (updater: (prevState: GameState) => GameState) => void;
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

  const completeProject = useCallback((project: Project, addStaffXP: (staffId: string, amount: number) => void): ProjectReport | undefined => { // Added return type and addStaffXP
    // Ensure project is the one from the state passed to completeProject for consistency
    // The project object passed here should already have accumulatedCPoints and accumulatedTPoints
    const totalQuality = project.qualityScore || 0;
    const totalEfficiency = project.efficiencyScore || 0;

    const finalScore = Math.floor((totalQuality + totalEfficiency) / 2);
    const payout = Math.floor((project.payoutBase ?? 0) * (finalScore / 100));
    const repGain = Math.floor((project.repGainBase ?? 0) * (finalScore / 100));
    const xpGain = Math.floor((finalScore * (project.difficulty || 1) * 10) / 2); 

    // Give XP to assigned staff
    const assignedStaff = gameState.hiredStaff.filter(s => s.assignedProjectId === project.id);
    assignedStaff.forEach(staff => {
      addStaffXP(staff.id, 20 + Math.floor(finalScore * 0.5)); // XP based on final score
    });

    setGameState((prev: GameState) => {
      const updatedCompletedProjects = prev.completedProjects ? [...prev.completedProjects, project] : [project];
      return {
        ...prev,
        money: prev.money + payout, 
        playerData: {
          ...prev.playerData,
          reputation: prev.playerData.reputation + repGain,
          xp: prev.playerData.xp + xpGain // Add player XP
        },
        activeProject: null,
        completedProjects: updatedCompletedProjects,
        hiredStaff: prev.hiredStaff.map(s => 
          s.assignedProjectId === project.id 
            ? { ...s, status: 'Idle' as const, assignedProjectId: null }
            : s
        )
      };
    });

    return {
      projectTitle: project.title,
      qualityScore: totalQuality,
      efficiencyScore: totalEfficiency,
      finalScore,
      payout,
      repGain,
      xpGain,
      review: { // Added review object
        qualityScore: totalQuality,
        payout: payout,
        xpGain: xpGain,
        creativityPoints: project.accumulatedCPoints, // Assuming these are the points for review
        technicalPoints: project.accumulatedTPoints,  // Assuming these are the points for review
      }
    };
  }, [gameState.hiredStaff, setGameState]); // Added gameState.hiredStaff to dependencies

  // The addWork function is now handled by performDailyWork in useGameActions.tsx
  // This function is no longer needed here.
  const addWork = useCallback(() => {
    console.warn("addWork in useProjectManagement is deprecated. Use performDailyWork from useGameActions instead.");
  }, []);
 
  // The handleMinigameComplete logic is now handled in ActiveProject.tsx
  // and rewards are applied via onReward prop.
  const handleMinigameComplete = useCallback(() => {
    console.warn("handleMinigameComplete in useProjectManagement is deprecated. Minigame rewards are handled in ActiveProject.tsx.");
  }, []);

  return {
    startProject,
    addWork,
    completeProject,
    activeMinigame,
    setActiveMinigame,
    handleMinigameComplete
  };
};
