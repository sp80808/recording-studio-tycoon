
import { useCallback, useRef, useState } from 'react';
import { GameState, FocusAllocation } from '@/types/game';
import { calculateStudioSkillBonus, getEquipmentBonuses } from '@/utils/gameUtils';
import { shouldAutoTriggerMinigame } from '@/utils/minigameUtils';
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
  const [autoTriggeredMinigame, setAutoTriggeredMinigame] = useState<{
    type: string;
    reason: string;
  } | null>(null);

  const createOrb = useCallback((type: 'creativity' | 'technical', amount: number) => {
    console.log(`Creating ${type} orb with amount: ${amount}`);
    if (!orbContainerRef.current) return;

    const orb = document.createElement('div');
    orb.className = `orb ${type}`;
    orb.textContent = `+${amount}`;
    
    const startX = Math.random() * 200 + 50;
    const startY = Math.random() * 100 + 50;
    orb.style.left = `${startX}px`;
    orb.style.top = `${startY}px`;

    orbContainerRef.current.appendChild(orb);

    setTimeout(() => {
      const targetElement = document.getElementById(type === 'creativity' ? 'creativity-points' : 'technical-points');
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const containerRect = orbContainerRef.current!.getBoundingClientRect();
        const targetX = rect.left - containerRect.left + rect.width / 2;
        const targetY = rect.top - containerRect.top + rect.height / 2;
        
        orb.style.transform = `translate(${targetX - startX}px, ${targetY - startY}px) scale(0.8)`;
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
    console.log('=== PERFORMING DAILY WORK ===');
    
    if (!gameState.activeProject) {
      console.log('No active project');
      return;
    }

    if (gameState.playerData.dailyWorkCapacity <= 0) {
      toast({
        title: "No Energy Left",
        description: "You need to advance to the next day to restore your energy.",
        variant: "destructive"
      });
      return;
    }

    const project = gameState.activeProject;
    console.log(`Working on project: ${project.title}`);
    
    // Ensure we have valid stages
    if (!project.stages || project.stages.length === 0) {
      console.log('Project has no stages');
      return;
    }

    const currentStageIndex = Math.min(
      Math.max(0, project.currentStageIndex || 0),
      project.stages.length - 1
    );

    const currentStage = project.stages[currentStageIndex];
    console.log(`Current stage: ${currentStage.stageName} (index: ${currentStageIndex})`);

    // Check if current stage is already completed
    if (currentStage.completed) {
      toast({
        title: "Stage Already Complete",
        description: "This stage has been completed. The project will advance automatically.",
      });
      return;
    }

    // Increment work session count
    const newWorkSessionCount = (project.workSessionCount || 0) + 1;

    // Check for auto-triggered minigames
    const autoTrigger = shouldAutoTriggerMinigame(project, gameState, focusAllocation, newWorkSessionCount);
    if (autoTrigger) {
      setAutoTriggeredMinigame({
        type: autoTrigger.minigameType,
        reason: autoTrigger.triggerReason
      });
      
      toast({
        title: "🎮 Production Opportunity!",
        description: autoTrigger.triggerReason,
        duration: 4000
      });
    }

    // Calculate base points from player attributes and focus allocation
    const baseCreativityWork = gameState.playerData.dailyWorkCapacity * gameState.playerData.attributes.creativeIntuition;
    const baseTechnicalWork = gameState.playerData.dailyWorkCapacity * gameState.playerData.attributes.technicalAptitude;

    // Apply focus allocation
    let creativityGain = Math.floor(
      baseCreativityWork * (focusAllocation.performance / 100) * 0.8 + 
      baseCreativityWork * (focusAllocation.layering / 100) * 0.6
    );
    let technicalGain = Math.floor(
      baseTechnicalWork * (focusAllocation.soundCapture / 100) * 0.8 + 
      baseTechnicalWork * (focusAllocation.layering / 100) * 0.4
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
    creativityGain += equipmentBonuses.genre; // Genre bonus is flat points
    
    console.log(`After equipment bonuses - Creativity: ${creativityGain}, Technical: ${technicalGain}`);

    // Add staff contributions
    const assignedStaff = gameState.hiredStaff.filter(s => s.assignedProjectId === project.id && s.status === 'Working');
    
    assignedStaff.forEach(staff => {
      if (staff.energy < 20) {
        // Low energy penalty
        const penalty = 0.3;
        creativityGain += Math.floor(staff.primaryStats.creativity * 0.1 * penalty);
        technicalGain += Math.floor(staff.primaryStats.technical * 0.1 * penalty);
        console.log(`Staff ${staff.name} working with low energy (penalty applied)`);
      } else {
        let staffCreativity = Math.floor(staff.primaryStats.creativity * 0.15);
        let staffTechnical = Math.floor(staff.primaryStats.technical * 0.15);
        
        // Apply staff genre affinity bonus
        if (staff.genreAffinity && staff.genreAffinity.genre === project.genre) {
          const bonus = staff.genreAffinity.bonus / 100;
          staffCreativity += Math.floor(staffCreativity * bonus);
          staffTechnical += Math.floor(staffTechnical * bonus);
          console.log(`Staff ${staff.name} has genre affinity for ${project.genre}`);
        }
        
        creativityGain += staffCreativity;
        technicalGain += staffTechnical;
        console.log(`Staff ${staff.name} contributed: +${staffCreativity} creativity, +${staffTechnical} technical`);
      }
    });

    console.log(`FINAL GAINS - Creativity: ${creativityGain}, Technical: ${technicalGain}`);

    // Create orb animations
    createOrb('creativity', creativityGain);
    createOrb('technical', technicalGain);

    // Calculate work units completed for current stage
    const workUnitsCompleted = Math.min(
      currentStage.workUnitsCompleted + Math.floor((creativityGain + technicalGain) / 10),
      currentStage.workUnitsBase
    );

    // Check if stage is completed
    const stageCompleted = workUnitsCompleted >= currentStage.workUnitsBase;
    let newCurrentStageIndex = currentStageIndex;
    
    if (stageCompleted && !currentStage.completed) {
      newCurrentStageIndex = Math.min(currentStageIndex + 1, project.stages.length - 1);
    }

    // Update the current stage
    const updatedStages = project.stages.map((stage, index) => {
      if (index === currentStageIndex) {
        return {
          ...stage,
          workUnitsCompleted,
          completed: stageCompleted
        };
      }
      return stage;
    });

    // CRITICAL: Update project with accumulated points and work session count
    const updatedProject = {
      ...project,
      stages: updatedStages,
      accumulatedCPoints: project.accumulatedCPoints + creativityGain,
      accumulatedTPoints: project.accumulatedTPoints + technicalGain,
      currentStageIndex: newCurrentStageIndex,
      workSessionCount: newWorkSessionCount
    };

    console.log(`Project C points: ${project.accumulatedCPoints} -> ${updatedProject.accumulatedCPoints}`);
    console.log(`Project T points: ${project.accumulatedTPoints} -> ${updatedProject.accumulatedTPoints}`);
    console.log(`Work sessions: ${project.workSessionCount || 0} -> ${updatedProject.workSessionCount}`);
    console.log(`Stage progress: ${currentStage.workUnitsCompleted}/${currentStage.workUnitsBase} -> ${workUnitsCompleted}/${currentStage.workUnitsBase}`);

    // Check if project is complete (all stages finished)
    const allStagesComplete = updatedProject.stages.every(stage => stage.completed);
    if (allStagesComplete) {
      console.log('PROJECT COMPLETE!');
      const review = completeProject(updatedProject, addStaffXP);
      return { review, isComplete: true };
    }

    // Update game state with new project data, reduce player energy, and reduce staff energy
    setGameState(prev => ({
      ...prev,
      activeProject: updatedProject,
      playerData: {
        ...prev.playerData,
        dailyWorkCapacity: prev.playerData.dailyWorkCapacity - 1
      },
      hiredStaff: prev.hiredStaff.map(s => 
        s.assignedProjectId === project.id && s.status === 'Working'
          ? { ...s, energy: Math.max(0, s.energy - 15) }
          : s
      )
    }));

    // Show stage completion notification
    if (stageCompleted) {
      toast({
        title: "🎉 Stage Complete!",
        description: `${currentStage.stageName} finished! ${newCurrentStageIndex < project.stages.length ? `Moving to: ${project.stages[newCurrentStageIndex].stageName}` : 'Project ready for completion!'}`,
        duration: 4000
      });
    } else {
      toast({
        title: "Work Progress",
        description: `Stage progress: ${workUnitsCompleted}/${currentStage.workUnitsBase} work units`,
      });
    }
    
    return { review: null, isComplete: false };
  }, [gameState, focusAllocation, createOrb, setGameState, completeProject, addStaffXP]);

  return {
    performDailyWork,
    orbContainerRef,
    autoTriggeredMinigame,
    clearAutoTriggeredMinigame: () => setAutoTriggeredMinigame(null)
  };
};
