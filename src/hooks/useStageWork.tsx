
import { useCallback, useRef, useState } from 'react';
import { GameState, FocusAllocation } from '@/types/game';
import { calculateStudioSkillBonus, getEquipmentBonuses } from '@/utils/gameUtils';
import { getCreativityMultiplier, getTechnicalMultiplier, getFocusEffectiveness } from '@/utils/playerUtils';
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
    console.log(`🎯 Creating ${type} orb with amount: ${amount}`);
    if (!orbContainerRef.current) {
      console.log('❌ No orb container found');
      return;
    }

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

  const getMoodEffectiveness = useCallback((mood: number) => {
    if (mood < 40) return 0.75; // 25% penalty for low mood
    if (mood > 75) return 1.1; // 10% bonus for high mood
    return 1.0; // Normal effectiveness
  }, []);

  const performDailyWork = useCallback(() => {
    console.log('🚀 === PERFORMING DAILY WORK ===');
    
    if (!gameState.activeProject) {
      console.log('❌ No active project');
      return;
    }

    if (gameState.playerData.dailyWorkCapacity <= 0) {
      console.log('❌ No energy left');
      toast({
        title: "No Energy Left",
        description: "You need to advance to the next day to restore your energy.",
        variant: "destructive"
      });
      return;
    }

    const project = gameState.activeProject;
    console.log(`🎵 Working on project: ${project.title}`);
    console.log(`📊 Project stages:`, project.stages.map((s, i) => `${i}: ${s.stageName} (${s.workUnitsCompleted}/${s.workUnitsBase})`));
    
    if (!project.stages || project.stages.length === 0) {
      console.log('❌ Project has no stages');
      return;
    }

    const currentStageIndex = Math.min(
      Math.max(0, project.currentStageIndex || 0),
      project.stages.length - 1
    );

    const currentStage = project.stages[currentStageIndex];
    console.log(`📍 Current stage: ${currentStage.stageName} (index: ${currentStageIndex})`);
    console.log(`📈 Stage progress: ${currentStage.workUnitsCompleted}/${currentStage.workUnitsBase}`);

    if (currentStage.completed) {
      console.log('✅ Current stage already completed');
      toast({
        title: "Stage Already Complete",
        description: "This stage has been completed. The project will advance automatically.",
      });
      return;
    }

    const newWorkSessionCount = (project.workSessionCount || 0) + 1;
    console.log(`🔢 Work session count: ${project.workSessionCount} -> ${newWorkSessionCount}`);

    // Check for auto-triggered minigames
    const autoTrigger = shouldAutoTriggerMinigame(project, gameState, focusAllocation, newWorkSessionCount);
    if (autoTrigger) {
      console.log(`🎮 Auto-triggered minigame: ${autoTrigger.minigameType} - ${autoTrigger.triggerReason}`);
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

    // Calculate base points with player attribute multipliers
    const baseCreativityWork = gameState.playerData.dailyWorkCapacity * gameState.playerData.attributes.creativeIntuition;
    const baseTechnicalWork = gameState.playerData.dailyWorkCapacity * gameState.playerData.attributes.technicalAptitude;
    console.log(`💪 Base work capacity: ${gameState.playerData.dailyWorkCapacity}`);
    console.log(`🎨 Base creativity work: ${baseCreativityWork} (capacity × ${gameState.playerData.attributes.creativeIntuition})`);
    console.log(`⚙️ Base technical work: ${baseTechnicalWork} (capacity × ${gameState.playerData.attributes.technicalAptitude})`);

    // Apply player attribute bonuses
    const creativityMultiplier = getCreativityMultiplier(gameState);
    const technicalMultiplier = getTechnicalMultiplier(gameState);
    const focusEffectiveness = getFocusEffectiveness(gameState);
    console.log(`🔥 Multipliers - Creativity: ${creativityMultiplier}, Technical: ${technicalMultiplier}, Focus: ${focusEffectiveness}`);

    // Apply focus allocation with focus mastery bonus
    let creativityGain = Math.floor(
      baseCreativityWork * creativityMultiplier * focusEffectiveness * (
        (focusAllocation.performance / 100) * 0.8 + 
        (focusAllocation.layering / 100) * 0.6
      )
    );
    let technicalGain = Math.floor(
      baseTechnicalWork * technicalMultiplier * focusEffectiveness * (
        (focusAllocation.soundCapture / 100) * 0.8 + 
        (focusAllocation.layering / 100) * 0.4
      )
    );

    console.log(`🎯 Focus allocation - Performance: ${focusAllocation.performance}%, Sound: ${focusAllocation.soundCapture}%, Layering: ${focusAllocation.layering}%`);
    console.log(`📊 After focus allocation - Creativity: ${creativityGain}, Technical: ${technicalGain}`);

    // Apply studio skill bonuses for the project's genre
    const genreSkill = gameState.studioSkills[project.genre];
    if (genreSkill) {
      const creativityBonus = calculateStudioSkillBonus(genreSkill, 'creativity');
      const technicalBonus = calculateStudioSkillBonus(genreSkill, 'technical');
      
      creativityGain += Math.floor(creativityGain * (creativityBonus / 100));
      technicalGain += Math.floor(technicalGain * (technicalBonus / 100));
      
      console.log(`🎸 Genre (${project.genre}) skill bonuses applied - Creativity: ${creativityGain}, Technical: ${technicalGain}`);
    }

    // Apply equipment bonuses
    const equipmentBonuses = getEquipmentBonuses(gameState.ownedEquipment, project.genre);
    creativityGain += Math.floor(creativityGain * (equipmentBonuses.creativity / 100));
    technicalGain += Math.floor(technicalGain * (equipmentBonuses.technical / 100));
    creativityGain += equipmentBonuses.genre;
    
    console.log(`🎛️ After equipment bonuses - Creativity: ${creativityGain}, Technical: ${technicalGain}`);

    // Add staff contributions with mood effects
    const assignedStaff = gameState.hiredStaff.filter(s => s.assignedProjectId === project.id && s.status === 'Working');
    console.log(`👥 Assigned staff count: ${assignedStaff.length}`);
    
    assignedStaff.forEach(staff => {
      if (staff.energy < 20) {
        // Low energy penalty
        const penalty = 0.3;
        creativityGain += Math.floor(staff.primaryStats.creativity * 0.1 * penalty);
        technicalGain += Math.floor(staff.primaryStats.technical * 0.1 * penalty);
        console.log(`😴 Staff ${staff.name} working with low energy (penalty applied)`);
      } else {
        // Apply mood effectiveness
        const moodMultiplier = getMoodEffectiveness(staff.mood);
        
        let staffCreativity = Math.floor(staff.primaryStats.creativity * 0.2 * moodMultiplier);
        let staffTechnical = Math.floor(staff.primaryStats.technical * 0.2 * moodMultiplier);
        
        // Apply staff genre affinity bonus
        if (staff.genreAffinity && staff.genreAffinity.genre === project.genre) {
          const bonus = staff.genreAffinity.bonus / 100;
          staffCreativity += Math.floor(staffCreativity * bonus);
          staffTechnical += Math.floor(staffTechnical * bonus);
          console.log(`🎯 Staff ${staff.name} has genre affinity for ${project.genre}`);
        }
        
        creativityGain += staffCreativity;
        technicalGain += staffTechnical;
        console.log(`👤 Staff ${staff.name} contributed: +${staffCreativity} creativity, +${staffTechnical} technical (mood: ${staff.mood})`);
      }
    });

    console.log(`🎯 FINAL GAINS - Creativity: ${creativityGain}, Technical: ${technicalGain}`);

    // Create orb animations
    createOrb('creativity', creativityGain);
    createOrb('technical', technicalGain);

    // Calculate work units completed for current stage - THIS IS THE CRITICAL FIX
    const totalPointsGenerated = creativityGain + technicalGain;
    const workUnitsToAdd = Math.floor(totalPointsGenerated / 10); // Convert points to work units
    const newWorkUnitsCompleted = Math.min(
      currentStage.workUnitsCompleted + workUnitsToAdd,
      currentStage.workUnitsBase
    );

    console.log(`⚡ Total points generated: ${totalPointsGenerated}`);
    console.log(`🔨 Work units to add: ${workUnitsToAdd} (points ÷ 10)`);
    console.log(`📈 Work units: ${currentStage.workUnitsCompleted} -> ${newWorkUnitsCompleted} (max: ${currentStage.workUnitsBase})`);

    // Check if stage is completed
    const stageCompleted = newWorkUnitsCompleted >= currentStage.workUnitsBase;
    let newCurrentStageIndex = currentStageIndex;
    
    if (stageCompleted && !currentStage.completed) {
      newCurrentStageIndex = Math.min(currentStageIndex + 1, project.stages.length - 1);
      console.log(`✅ Stage completed! Moving to stage index: ${newCurrentStageIndex}`);
    }

    // Update the current stage - THIS IS THE CRITICAL UPDATE
    const updatedStages = project.stages.map((stage, index) => {
      if (index === currentStageIndex) {
        console.log(`🔄 Updating stage ${index}: ${stage.workUnitsCompleted} -> ${newWorkUnitsCompleted}, completed: ${stageCompleted}`);
        return {
          ...stage,
          workUnitsCompleted: newWorkUnitsCompleted,
          completed: stageCompleted
        };
      }
      return stage;
    });

    const updatedProject = {
      ...project,
      stages: updatedStages,
      accumulatedCPoints: project.accumulatedCPoints + creativityGain,
      accumulatedTPoints: project.accumulatedTPoints + technicalGain,
      currentStageIndex: newCurrentStageIndex,
      workSessionCount: newWorkSessionCount
    };

    console.log(`📋 Project C points: ${project.accumulatedCPoints} -> ${updatedProject.accumulatedCPoints}`);
    console.log(`📋 Project T points: ${project.accumulatedTPoints} -> ${updatedProject.accumulatedTPoints}`);
    console.log(`📋 Updated stages:`, updatedProject.stages.map((s, i) => `${i}: ${s.stageName} (${s.workUnitsCompleted}/${s.workUnitsBase}) ${s.completed ? '✅' : '⏳'}`));

    // Check if project is complete
    const allStagesComplete = updatedProject.stages.every(stage => stage.completed);
    if (allStagesComplete) {
      console.log('🎉 PROJECT COMPLETE!');
      const review = completeProject(updatedProject, addStaffXP);
      return { review, isComplete: true };
    }

    // Update game state with mood changes
    setGameState(prev => {
      console.log('🔄 Updating game state...');
      return {
        ...prev,
        activeProject: updatedProject,
        playerData: {
          ...prev.playerData,
          dailyWorkCapacity: prev.playerData.dailyWorkCapacity - 1
        },
        hiredStaff: prev.hiredStaff.map(s => {
          if (s.assignedProjectId === project.id && s.status === 'Working') {
            // Decrease mood slightly after work, decrease energy
            return { 
              ...s, 
              energy: Math.max(0, s.energy - 15),
              mood: Math.max(0, s.mood - 2) // Small mood decrease from work
            };
          }
          return s;
        })
      };
    });

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
        description: `Stage progress: ${newWorkUnitsCompleted}/${currentStage.workUnitsBase} work units (+${workUnitsToAdd} this session)`,
      });
    }
    
    return { review: null, isComplete: false };
  }, [gameState, focusAllocation, createOrb, setGameState, completeProject, addStaffXP, getMoodEffectiveness]);

  return {
    performDailyWork,
    orbContainerRef,
    autoTriggeredMinigame,
    clearAutoTriggeredMinigame: () => setAutoTriggeredMinigame(null)
  };
};
