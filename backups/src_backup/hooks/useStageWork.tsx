import { useCallback, useRef } from 'react';
import { GameState, FocusAllocation, Project, ProjectCompletionResult } from '@/types/game';
import { calculateStudioSkillBonus, getEquipmentBonuses } from '@/utils/gameUtils';
import { toast } from '@/hooks/use-toast';
import { applyFocusBonuses, addWorkUnit, calculateStageQuality, calculateTimeEfficiency } from '/project/src/projectWorkUtils';
import { addPlayerXP } from '/project/src/playerProgress';
import { completeProject as completeProjectUtil } from '/project/src/projectManager';

interface UseStageWorkProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  focusAllocation: FocusAllocation;
  addStaffXP: (staffId: string, amount: number) => void;
  handleProjectComplete: (project: Project) => void;
}

export const useStageWork = (
  gameState: GameState, 
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  focusAllocation: FocusAllocation,
  addStaffXP: (staffId: string, amount: number) => void,
  handleProjectComplete: (project: Project) => void
) => {
  const orbContainerRef = useRef<HTMLDivElement>(null);

  const createAnimatedBlobs = useCallback((type: 'creativity' | 'technical', totalAmount: number, onBlobArrive: (increment: number) => void) => {
    if (!orbContainerRef.current || totalAmount <= 0) return;

    // Determine blob count and increment per blob
    let blobCount = 1;
    let increment = totalAmount;
    if (totalAmount <= 10) {
      blobCount = totalAmount;
      increment = 1;
    } else if (totalAmount <= 50) {
      blobCount = Math.ceil(totalAmount / 5);
      increment = Math.ceil(totalAmount / blobCount);
    } else {
      blobCount = Math.min(10, totalAmount);
      increment = Math.ceil(totalAmount / blobCount);
    }

    for (let i = 0; i < blobCount; i++) {
      const value = (i === blobCount - 1) ? (totalAmount - increment * (blobCount - 1)) : increment;
      const orb = document.createElement('div');
      orb.className = `orb ${type}`;
      orb.textContent = `+${value}`;
      const startX = Math.random() * 200;
      const startY = Math.random() * 100;
      orb.style.left = `${startX}px`;
      orb.style.top = `${startY}px`;
      orbContainerRef.current.appendChild(orb);
      setTimeout(() => {
        const targetElement = document.getElementById(type === 'creativity' ? 'creativity-points' : 'technical-points');
        if (targetElement) {
          const rect = targetElement.getBoundingClientRect();
          const containerRect = orbContainerRef.current!.getBoundingClientRect();
          const targetX = rect.left - containerRect.left;
          const targetY = rect.top - containerRect.top;
          orb.style.transform = `translate(${targetX - startX}px, ${targetY - startY}px)`;
          orb.style.opacity = '0';
        }
      }, 100);
      setTimeout(() => {
        if (orb.parentNode) {
          orb.parentNode.removeChild(orb);
          onBlobArrive(value);
        }
      }, 1500 + i * 100); // Stagger arrival for effect
    }
  }, []);

  const performDailyWork = useCallback((): ProjectCompletionResult | null => {
    if (!gameState.activeProject) {
      console.log('No active project');
      return null;
    }

    const project = gameState.activeProject;
    
    // Check if player has already worked on this project today
    if (project.lastWorkDay && project.lastWorkDay >= gameState.currentDay) {
      console.log('Already worked on this project today');
      toast({
        title: "Already Worked Today",
        description: "You can only work on a project once per day. Use 'Next Day' to continue.",
        variant: "destructive"
      });
      return null;
    }

    // Ensure currentStageIndex is valid
    const currentStageIndex = Math.min(
      Math.max(0, project.currentStageIndex || 0),
      project.stages.length - 1
    );

    const currentStage = project.stages[currentStageIndex];
    
    if (!currentStage) {
      console.log('No valid current stage');
      return null;
    }

    console.log(`Performing work on stage: ${currentStage.stageName}`);
    console.log(`Current progress: ${currentStage.workUnitsCompleted}/${currentStage.workUnitsBase}`);

    // Check if stage is already completed
    if (currentStage.completed || currentStage.workUnitsCompleted >= currentStage.workUnitsBase) {
      console.log('Stage already completed');
      toast({
        title: "Stage Already Complete",
        description: "This stage has already been completed.",
        variant: "destructive"
      });
      return null;
    }

    // Calculate work units to add (player's daily capacity)
    const workUnitsToAdd = gameState.playerData.dailyWorkCapacity;
    console.log(`Adding ${workUnitsToAdd} work units`);

    // Calculate base points from player attributes
    let creativityGain = Math.floor(
      (focusAllocation.performance / 100) * workUnitsToAdd * gameState.playerData.attributes.creativeIntuition
    );
    let technicalGain = Math.floor(
      (focusAllocation.soundCapture / 100) * workUnitsToAdd * gameState.playerData.attributes.technicalAptitude
    );

    console.log(`Base gains - Creativity: ${creativityGain}, Technical: ${technicalGain}`);

    // Apply studio skill bonuses for the project's genre
    const genreSkill = gameState.studioSkills[project.genre];
    if (genreSkill) {
      const creativityBonus = calculateStudioSkillBonus(genreSkill, 'creativity');
      const technicalBonus = calculateStudioSkillBonus(genreSkill, 'technical');
      
      creativityGain += Math.floor(creativityGain * (creativityBonus / 100));
      technicalGain += Math.floor(technicalGain * (technicalBonus / 100));
      
      console.log(`After skill bonuses - Creativity: ${creativityGain}, Technical: ${technicalGain}`);
    }

    // Apply equipment bonuses
    const equipmentBonuses = getEquipmentBonuses(gameState.ownedEquipment, project.genre);
    creativityGain += Math.floor(creativityGain * (equipmentBonuses.creativity / 100));
    technicalGain += Math.floor(technicalGain * (equipmentBonuses.technical / 100));
    
    console.log(`After equipment bonuses - Creativity: ${creativityGain}, Technical: ${technicalGain}`);

    // Add staff contributions
    const assignedStaff = gameState.hiredStaff.filter(s => s.assignedProjectId === project.id);
    
    assignedStaff.forEach(staff => {
      if (staff.energy < 20) {
        const penalty = 0.3;
        // Calculate weighted creativity (songwriting 40%, arrangement 30%, ear 30%)
        const staffCreativityPenalty = Math.floor((
          (staff.primaryStats.songwriting ?? 0) * 0.4 + 
          (staff.primaryStats.arrangement ?? 0) * 0.3 +
          (staff.primaryStats.ear ?? 0) * 0.3
        ) * 0.1 * penalty);
        
        // Calculate weighted technical (soundDesign 25%, techKnowledge 25%, mixing 30%, mastering 20%)
        const staffTechnicalPenalty = Math.floor((
          (staff.primaryStats.soundDesign ?? 0) * 0.25 +
          (staff.primaryStats.techKnowledge ?? 0) * 0.25 +
          (staff.primaryStats.mixing ?? 0) * 0.3 +
          (staff.primaryStats.mastering ?? 0) * 0.2
        ) * 0.1 * penalty);
        
        creativityGain += staffCreativityPenalty;
        technicalGain += staffTechnicalPenalty;
      } else {
        // Calculate weighted creativity (songwriting 40%, arrangement 30%, ear 30%)
        let staffCreativity = Math.floor((
          (staff.primaryStats.songwriting ?? 0) * 0.4 + 
          (staff.primaryStats.arrangement ?? 0) * 0.3 +
          (staff.primaryStats.ear ?? 0) * 0.3
        ) * 0.15);
        
        // Calculate weighted technical (soundDesign 25%, techKnowledge 25%, mixing 30%, mastering 20%)
        let staffTechnical = Math.floor((
          (staff.primaryStats.soundDesign ?? 0) * 0.25 +
          (staff.primaryStats.techKnowledge ?? 0) * 0.25 +
          (staff.primaryStats.mixing ?? 0) * 0.3 +
          (staff.primaryStats.mastering ?? 0) * 0.2
        ) * 0.15);
        
        if (staff.genreAffinity && staff.genreAffinity.genre === project.genre) {
          const bonus = staff.genreAffinity.bonus / 100;
          staffCreativity += Math.floor(staffCreativity * bonus);
          staffTechnical += Math.floor(staffTechnical * bonus);
        }
        
        creativityGain += staffCreativity;
        technicalGain += staffTechnical;
      }
    });

    console.log(`Final gains - Creativity: ${creativityGain}, Technical: ${technicalGain}`);

    // Local stat counters for animation (to be integrated with UI)
    let animatedCreativity = 0;
    let animatedTechnical = 0;
    function incrementStat(type: 'creativity' | 'technical', inc: number) {
      if (type === 'creativity') {
        animatedCreativity += inc;
        // TODO: Integrate with UI stat number (e.g., setState or ref)
        console.log(`Animated Creativity: ${animatedCreativity}`);
      } else {
        animatedTechnical += inc;
        // TODO: Integrate with UI stat number (e.g., setState or ref)
        console.log(`Animated Technical: ${animatedTechnical}`);
      }
    }

    // Create orb animations
    createAnimatedBlobs('creativity', creativityGain, (inc) => incrementStat('creativity', inc));
    createAnimatedBlobs('technical', technicalGain, (inc) => incrementStat('technical', inc));

    // Update work units completed
    const newWorkUnitsCompleted = Math.min(
      currentStage.workUnitsCompleted + workUnitsToAdd,
      currentStage.workUnitsBase
    );

    console.log(`Work units before: ${currentStage.workUnitsCompleted}/${currentStage.workUnitsBase}`);
    console.log(`Work units added: ${workUnitsToAdd}`);
    console.log(`Work units after: ${newWorkUnitsCompleted}/${currentStage.workUnitsBase}`);

    // CRITICAL FIX: Update project with progress and points
    const updatedProject = {
      ...project,
      accumulatedCPoints: project.accumulatedCPoints + creativityGain,
      accumulatedTPoints: project.accumulatedTPoints + technicalGain,
      lastWorkDay: gameState.currentDay, // Track when work was last performed
      stages: project.stages.map((stage, index) => 
        index === currentStageIndex 
          ? { 
              ...stage, 
              workUnitsCompleted: newWorkUnitsCompleted,
              completed: newWorkUnitsCompleted >= stage.workUnitsBase
            }
          : stage
      )
    };

    console.log(`Project C points: ${project.accumulatedCPoints} -> ${updatedProject.accumulatedCPoints}`);
    console.log(`Project T points: ${project.accumulatedTPoints} -> ${updatedProject.accumulatedTPoints}`);

    // Check if stage is now complete
    const stageNowComplete = newWorkUnitsCompleted >= currentStage.workUnitsBase;
    console.log(`Checking stage completion: ${newWorkUnitsCompleted} >= ${currentStage.workUnitsBase} ? ${stageNowComplete}`);

    if (stageNowComplete) {
      console.log(`Stage ${currentStageIndex + 1} (${currentStage.stageName}) is complete.`);
      // Add to completed stages
      updatedProject.completedStages = [...(project.completedStages || []), currentStageIndex];
      
      // Check if this was the final stage
      if (currentStageIndex + 1 >= project.stages.length) {
        console.log('This was the final stage. Project complete!');
        // Complete the project using the imported utility
        const { newState: stateAfterCompletion, review } = completeProjectUtil(updatedProject);

        // Update game state with the result from completion utility
        setGameState(stateAfterCompletion);

        // Notify Index.tsx about the project completion
        const completed = stateAfterCompletion.completedProjects.find(p => p.id === updatedProject.id);
        if (completed) {
          handleProjectComplete(completed);
        }

        // Return review or other relevant info
        return {
          isComplete: true,
          review: review,
          xpGain: review.xpGain,
          qualityScore: review.qualityScore,
          payout: review.payout,
          repGain: review.repGain
        };
      } else {
        // Move to next stage
        const nextStageIndex = currentStageIndex + 1;
        console.log(`Moving to next stage: ${nextStageIndex + 1} (${updatedProject.stages[nextStageIndex].stageName})`);
        updatedProject.currentStageIndex = nextStageIndex;
        
        toast({
          title: "Stage Complete!",
          description: `Moving to: ${updatedProject.stages[updatedProject.currentStageIndex].stageName}`,
        });
      }
    } else {
      console.log(`Stage ${currentStageIndex + 1} (${currentStage.stageName}) is NOT yet complete.`);
    }

    console.log('Updating game state with project:', updatedProject);
    console.log(`Before setGameState - Project ID: ${project.id}, Current Stage Index: ${project.currentStageIndex}, Completed Stages: ${project.completedStages}`);
    console.log(`After calculation - Project ID: ${updatedProject.id}, Current Stage Index: ${updatedProject.currentStageIndex}, Completed Stages: ${updatedProject.completedStages}`);

    // Update game state with the latest project state
    setGameState(prev => ({
      ...prev,
      activeProject: updatedProject,
      hiredStaff: prev.hiredStaff.map(s => 
        s.assignedProjectId === project.id && s.status === 'Working'
          ? { ...s, energy: Math.max(0, s.energy - 15) }
          : s
      )
    }));
    
    return null;
  }, [gameState, focusAllocation, createAnimatedBlobs, setGameState, handleProjectComplete]);

  return {
    performDailyWork,
    orbContainerRef
  };
};
