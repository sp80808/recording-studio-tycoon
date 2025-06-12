import { useCallback } from 'react';
import { GameState, Project, FocusAllocation, ProjectReport, StaffMember } from '@/types/game';
import { generateCandidates } from '@/utils/projectUtils';
import { toast } from '@/hooks/use-toast';
import {
  calculateYearFromDay,
  checkEraTransitionAvailable,
  transitionToEra,
  getEraSpecificEquipmentMultiplier
} from '@/utils/eraProgression';
import { calculateWorkUnitsGained } from '@/utils/projectWorkUtils';

// Define a type for the flexible setGameState function
type SetGameStateFunction = (state: GameState | ((prev: GameState) => GameState)) => void;

// Define the return type for performDailyWork
interface PerformDailyWorkResult {
  isComplete: boolean;
  finalProjectData: Project | null;
  review: ProjectReport | undefined | null; // Allow undefined or null for review
}

export const useGameActions = (gameState: GameState, setGameState: SetGameStateFunction) => {
  const advanceDay = useCallback(() => {
    const newDay = gameState.currentDay + 1;
    console.log(`Advancing to day ${newDay}`);
    
    // Calculate new year based on era progression
    const newYear = calculateYearFromDay(newDay, gameState.eraStartYear, gameState.currentEra);
    
    // Check for era transition opportunity
    const availableTransition = checkEraTransitionAvailable(gameState);
    
    // Process training completions
    const completedTraining: string[] = [];
    const updatedStaff = gameState.hiredStaff.map(staff => {
      if (staff.status === 'Training' && staff.trainingEndDay && newDay >= staff.trainingEndDay) {
        completedTraining.push(`${staff.name} completed training!`);
        return {
          ...staff,
          status: 'Idle' as const,
          trainingEndDay: undefined,
          trainingCourse: undefined,
          energy: 100
        };
      }
      return staff;
    });

    // Calculate total salaries
    const totalSalaries = gameState.hiredStaff.reduce((total, staff) => total + staff.salary, 0);
    
    // Update equipment multiplier based on year progression
    const updatedEquipmentMultiplier = getEraSpecificEquipmentMultiplier(
      gameState.currentEra,
      gameState.eraStartYear,
      newYear
    );
    
    setGameState(prev => ({
      ...prev,
      currentDay: newDay,
      currentYear: newYear,
      equipmentMultiplier: updatedEquipmentMultiplier,
      money: prev.money - totalSalaries, // Deduct salaries
      hiredStaff: updatedStaff.map(s =>
        s.status === 'Resting'
          ? { ...s, energy: Math.min(100, s.energy + 20) }
          : s
      ),
      playerData: {
        ...prev.playerData,
        dailyWorkCapacity: prev.playerData.attributes.focusMastery + 3 // Reset daily capacity
      }
    }));
    
    // Show era transition notification if available
    if (availableTransition) {
      toast({
        title: "🎵 Era Transition Available!",
        description: `You can now advance to ${availableTransition.name}. Check the Studio tab for transition options.`,
        duration: 6000
      });
    }
    
    // Show year progression notifications at key milestones
    if (newDay % 90 === 0) { // Every ~year
      toast({
        title: `📅 Year ${newYear}`,
        description: `Your studio has been operating for ${Math.floor(newDay / 90)} years. Keep pushing forward!`,
        duration: 4000
      });
    }
    
    // Process salary payments
    if (totalSalaries > 0) {
      if (gameState.money >= totalSalaries) {
        toast({
          title: "Salaries Paid",
          description: `Paid $${totalSalaries} in daily salaries.`,
        });
      } else {
        toast({
          title: "Cannot Pay Salaries!",
          description: `Need $${totalSalaries} for daily salaries. Staff morale will suffer.`,
          variant: "destructive"
        });
      }
    }

    // Generate new candidates every few days
    if (newDay % 3 === 0) {
      setGameState(prev => ({
        ...prev,
        availableCandidates: generateCandidates(3)
      }));
    }

    completedTraining.forEach(message => {
      toast({
        title: "Training Complete",
        description: message,
      });
    });
  }, [gameState, setGameState]);

  const refreshCandidates = useCallback(() => {
    const cost = 50;
    if (gameState.money < cost) {
      toast({
        title: "Insufficient Funds",
        description: `Need $${cost} to refresh candidate list.`,
        variant: "destructive"
      });
      return;
    }

    setGameState(prev => ({
      ...prev,
      money: prev.money - cost,
      availableCandidates: generateCandidates(3)
    }));

    toast({
      title: "New Candidates Found",
      description: "Fresh talent is now available for hire!",
    });
  }, [gameState.money, setGameState]);

  const triggerEraTransition = useCallback(() => {
    const availableTransition = checkEraTransitionAvailable(gameState);
    
    if (!availableTransition) {
      toast({
        title: "Era Transition Not Available",
        description: "You need more reputation, level, or completed projects to advance to the next era.",
        variant: "destructive"
      });
      return;
    }

    const fromEra = gameState.currentEra;
    const toEra = availableTransition.id;

    const newGameState = transitionToEra(gameState, availableTransition);
    setGameState(newGameState);

    toast({
      title: "🎉 Era Transition Complete!",
      description: `Welcome to ${availableTransition.name}! New equipment and opportunities await.`,
      duration: 6000
    });

    // Return transition info for animation
    return {
      fromEra,
      toEra
    };
  }, [gameState, setGameState]);

  const performDailyWork = useCallback((
    currentProject: Project,
    focusAllocation: FocusAllocation,
    assignedStaff: StaffMember[],
    completeProject: (state: GameState) => ProjectReport | undefined
  ): PerformDailyWorkResult => { // Explicitly define return type
    const updatedProject = { ...currentProject };
    const updatedGameState = { ...gameState };

    const currentStage = updatedProject.stages[updatedProject.currentStageIndex];
    if (!currentStage) {
      console.error("No current stage found for active project.");
      return { isComplete: false, finalProjectData: null, review: null }; // Return defined type
    }

    const { creativityGained, technicalGained } = calculateWorkUnitsGained(
      updatedGameState.playerData,
      focusAllocation,
      currentStage,
      assignedStaff
    );

    updatedProject.accumulatedCPoints += creativityGained;
    updatedProject.accumulatedTPoints += technicalGained;
    currentStage.workUnitsCompleted += (creativityGained + technicalGained) / 2; // Average gain for work units

    // Update player's daily work capacity
    updatedGameState.playerData = {
      ...updatedGameState.playerData,
      dailyWorkCapacity: Math.max(0, updatedGameState.playerData.dailyWorkCapacity - 1)
    };

    // Check for stage completion
    if (currentStage.workUnitsCompleted >= currentStage.workUnitsBase) {
      currentStage.completed = true;
      // Move to next stage or complete project
      if (updatedProject.currentStageIndex < updatedProject.stages.length - 1) {
        updatedProject.currentStageIndex += 1;
        toast({
          title: "✅ Stage Complete!",
          description: `${currentStage.stageName} finished! Moving to ${updatedProject.stages[updatedProject.currentStageIndex].stageName}.`,
          className: "bg-green-800 border-green-600 text-white",
          duration: 3000
        });
      } else {
        // Project is complete
        updatedProject.isCompleted = true;
        updatedProject.endDate = updatedGameState.currentDay;
        updatedGameState.activeProject = null; // Clear active project
        
        // Call completeProject from useProjectManagement
        const projectReport = completeProject(updatedGameState);
        
        return { isComplete: true, finalProjectData: updatedProject, review: projectReport };
      }
    }

    setGameState(prev => ({
      ...prev,
      activeProject: updatedProject,
      playerData: updatedGameState.playerData,
      hiredStaff: assignedStaff // Update staff energy changes
    }));

    return { isComplete: false, finalProjectData: null, review: null };
  }, [gameState, setGameState]);

  return {
    advanceDay,
    refreshCandidates,
    triggerEraTransition,
    performDailyWork
  };
};
