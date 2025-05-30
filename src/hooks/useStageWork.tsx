
import { useCallback, useRef } from 'react';
import { GameState, FocusAllocation } from '@/types/game';
import { calculateStudioSkillBonus, getEquipmentBonuses } from '@/utils/gameUtils';
import { toast } from '@/hooks/use-toast';

export const useStageWork = (
  gameState: GameState, 
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  focusAllocation: FocusAllocation,
  completeProject: (project: any, addStaffXP: (staffId: string, amount: number) => void) => any,
  addStaffXP: (staffId: string, amount: number) => void,
  advanceDay: () => void
) => {
  const orbContainerRef = useRef<HTMLDivElement>(null);

  const createOrb = useCallback((type: 'creativity' | 'technical', amount: number) => {
    if (!orbContainerRef.current) return;

    const orb = document.createElement('div');
    orb.className = `orb ${type}`;
    orb.textContent = `+${amount}`;
    
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
      }
    }, 1500);
  }, []);

  const performDailyWork = useCallback(() => {
    if (!gameState.activeProject) {
      console.log('No active project');
      return;
    }

    const project = gameState.activeProject;
    const currentStage = project.stages[project.currentStageIndex];
    
    console.log(`Performing work on stage: ${currentStage.stageName}`);
    console.log(`Current progress: ${currentStage.workUnitsCompleted}/${currentStage.workUnitsBase}`);

    // Check if stage is already completed
    if (currentStage.completed || currentStage.workUnitsCompleted >= currentStage.workUnitsBase) {
      console.log('Stage already completed, not processing work');
      toast({
        title: "Stage Already Complete",
        description: "This stage has already been completed.",
        variant: "destructive"
      });
      return;
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
        creativityGain += Math.floor(staff.primaryStats.creativity * 0.1 * penalty);
        technicalGain += Math.floor(staff.primaryStats.technical * 0.1 * penalty);
      } else {
        let staffCreativity = Math.floor(staff.primaryStats.creativity * 0.15);
        let staffTechnical = Math.floor(staff.primaryStats.technical * 0.15);
        
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

    // Create orb animations
    createOrb('creativity', creativityGain);
    createOrb('technical', technicalGain);

    // Update work units completed
    const newWorkUnitsCompleted = Math.min(
      currentStage.workUnitsCompleted + workUnitsToAdd,
      currentStage.workUnitsBase
    );

    console.log(`Work units after: ${newWorkUnitsCompleted}/${currentStage.workUnitsBase}`);

    // Update project with progress and points
    const updatedProject = {
      ...project,
      accumulatedCPoints: project.accumulatedCPoints + creativityGain,
      accumulatedTPoints: project.accumulatedTPoints + technicalGain,
      stages: project.stages.map((stage, index) => 
        index === project.currentStageIndex 
          ? { 
              ...stage, 
              workUnitsCompleted: newWorkUnitsCompleted,
              completed: newWorkUnitsCompleted >= stage.workUnitsBase
            }
          : stage
      )
    };

    // Check if stage is now complete
    const stageNowComplete = newWorkUnitsCompleted >= currentStage.workUnitsBase;
    console.log(`Stage complete: ${stageNowComplete}`);

    if (stageNowComplete) {
      // Add to completed stages
      updatedProject.completedStages = [...(project.completedStages || []), project.currentStageIndex];
      
      // Check if this was the final stage
      if (project.currentStageIndex + 1 >= project.stages.length) {
        console.log('Project complete!');
        // Complete the project
        const review = completeProject(updatedProject, addStaffXP);
        advanceDay(); // Advance the day
        return { review, isComplete: true };
      } else {
        // Move to next stage
        console.log('Moving to next stage');
        updatedProject.currentStageIndex = updatedProject.currentStageIndex + 1;
        
        toast({
          title: "Stage Complete!",
          description: `Moving to: ${updatedProject.stages[updatedProject.currentStageIndex].stageName}`,
        });
      }
    }

    // Update game state
    setGameState(prev => ({
      ...prev,
      activeProject: updatedProject,
      hiredStaff: prev.hiredStaff.map(s => 
        s.assignedProjectId === project.id && s.status === 'Working'
          ? { ...s, energy: Math.max(0, s.energy - 15) }
          : s
      )
    }));

    // Advance the day after work is done
    advanceDay();
    
    return { review: null, isComplete: false };
  }, [gameState, focusAllocation, createOrb, setGameState, completeProject, addStaffXP, advanceDay]);

  return {
    performDailyWork,
    orbContainerRef
  };
};
