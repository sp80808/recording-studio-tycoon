
import { useCallback, useRef } from 'react';
import { GameState, FocusAllocation } from '@/types/game';
import { calculateStudioSkillBonus, getEquipmentBonuses } from '@/utils/gameUtils';
import { toast } from '@/hooks/use-toast';

export const useStageWork = (
  gameState: GameState, 
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  focusAllocation: FocusAllocation,
  completeProject: (project: any, addStaffXP: (staffId: string, amount: number) => void) => any,
  addStaffXP: (staffId: string, amount: number) => void
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

  const processStageWork = useCallback(() => {
    if (!gameState.activeProject) return;

    const project = gameState.activeProject;
    const currentStage = project.stages[project.currentStageIndex];
    
    // Prevent processing if stage is already completed
    if (currentStage.completed) {
      console.log('Stage already completed, not processing work');
      return;
    }

    // Calculate base points from player attributes
    let creativityGain = Math.floor(
      (focusAllocation.performance / 100) * 5 * gameState.playerData.attributes.creativeIntuition
    );
    let technicalGain = Math.floor(
      (focusAllocation.soundCapture / 100) * 5 * gameState.playerData.attributes.technicalAptitude
    );

    // Apply studio skill bonuses for the project's genre
    const genreSkill = gameState.studioSkills[project.genre];
    if (genreSkill) {
      const creativityBonus = calculateStudioSkillBonus(genreSkill, 'creativity');
      const technicalBonus = calculateStudioSkillBonus(genreSkill, 'technical');
      
      creativityGain += Math.floor(creativityGain * (creativityBonus / 100));
      technicalGain += Math.floor(technicalGain * (technicalBonus / 100));
    }

    // Apply equipment bonuses
    const equipmentBonuses = getEquipmentBonuses(gameState.ownedEquipment, project.genre);
    creativityGain += Math.floor(creativityGain * (equipmentBonuses.creativity / 100));
    technicalGain += Math.floor(technicalGain * (equipmentBonuses.technical / 100));

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

    // Create orb animations
    createOrb('creativity', creativityGain);
    createOrb('technical', technicalGain);

    // Mark stage as completed and update project progress
    const updatedProject = {
      ...project,
      accumulatedCPoints: project.accumulatedCPoints + creativityGain,
      accumulatedTPoints: project.accumulatedTPoints + technicalGain,
      stages: project.stages.map((stage, index) => 
        index === project.currentStageIndex 
          ? { 
              ...stage, 
              workUnitsCompleted: stage.workUnitsBase,
              completed: true
            }
          : stage
      ),
      completedStages: [...(project.completedStages || []), project.currentStageIndex]
    };

    // Deplete staff energy
    setGameState(prev => ({
      ...prev,
      hiredStaff: prev.hiredStaff.map(s => 
        s.assignedProjectId === project.id && s.status === 'Working'
          ? { ...s, energy: Math.max(0, s.energy - 15) }
          : s
      )
    }));

    // Check if moving to next stage or completing project
    if (project.currentStageIndex + 1 >= project.stages.length) {
      // Complete the project immediately
      const review = completeProject(updatedProject, addStaffXP);
      return { review, isComplete: true };
    } else {
      // Move to next stage immediately
      const nextStageProject = {
        ...updatedProject,
        currentStageIndex: updatedProject.currentStageIndex + 1
      };
      
      setGameState(prev => ({
        ...prev,
        activeProject: nextStageProject
      }));

      toast({
        title: "Stage Complete!",
        description: `Moving to: ${nextStageProject.stages[nextStageProject.currentStageIndex].stageName}`,
      });
      
      return { review: null, isComplete: false };
    }
  }, [gameState, focusAllocation, createOrb, setGameState, completeProject, addStaffXP]);

  return {
    processStageWork,
    orbContainerRef
  };
};
