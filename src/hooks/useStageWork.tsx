import { useCallback, useRef, useState } from 'react';
import { GameState, FocusAllocation, Project } from '@/types/game';
// calculateStudioSkillBonus and getEquipmentBonuses are now used within projectUtils
import { getCreativityMultiplier, getTechnicalMultiplier, getFocusEffectiveness, getMoodEffectiveness } from '@/utils/playerUtils'; // Added getMoodEffectiveness
import {
  calculateBaseWorkPoints,
  applyFocusAndMultipliers,
  applyStudioSkillBonusesToWorkPoints,
  applyEquipmentBonusesToWorkPoints,
  calculateStaffWorkContribution,
  WorkPoints
} from '@/utils/projectUtils'; // Import new project utils
import { shouldAutoTriggerMinigame } from '@/utils/minigameUtils';
import { toast } from '@/hooks/use-toast';

interface UseStageWorkProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  // focusAllocation: FocusAllocation; // REMOVED
  // completeProject is removed from here, will be called after celebration
  addStaffXP: (staffId: string, amount: number) => void; // Still needed if staff get XP per work session or stage
  advanceDay: () => void
}

export const useStageWork = ({
  gameState,
  setGameState,
  // focusAllocation, // REMOVED
  // completeProject, // Removed
  addStaffXP, // Kept for now, though project completion XP is handled by completeProject
  advanceDay
}: UseStageWorkProps) => {
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
        
        orb.style.transform = `translate(${targetX - startX}px, ${targetY - startY}px scale(0.8)`;
        orb.style.opacity = '0';
      }
    }, 100);

    setTimeout(() => {
      if (orb.parentNode) {
        orb.parentNode.removeChild(orb);
      }
    }, 1500);
  }, []);

  // getMoodEffectiveness is now imported from playerUtils

  const performDailyWork = useCallback((): { finalProjectData?: Project; isComplete: boolean } | undefined => {
    console.log('🚀 === PERFORMING DAILY WORK ===');
    
    if (!gameState.activeProject) {
      console.log('❌ No active project');
      return;
    }

    if (gameState.playerData.dailyWorkCapacity <= 0) {
      console.log('❌ No energy left');
      toast({
        title: "⚡ No Energy Left",
        description: "You need to advance to the next day to restore your energy.",
        className: "bg-gray-800 border-gray-600 text-white",
        variant: "destructive"
      });
      return;
    }

    const project = gameState.activeProject;
    // Get project-specific focus allocation
    const currentProjectFocus = project.focusAllocation || { performance: 33, soundCapture: 33, layering: 34 }; // Fallback

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
        title: "✅ Stage Already Complete",
        description: "This stage has been completed. The project will advance automatically.",
        className: "bg-gray-800 border-gray-600 text-white",
      });
      return;
    }

    const newWorkSessionCount = (project.workSessionCount || 0) + 1;
    console.log(`🔢 Work session count: ${project.workSessionCount} -> ${newWorkSessionCount}`);

    // Check for auto-triggered minigames using currentProjectFocus
    const autoTrigger = shouldAutoTriggerMinigame(project, gameState, currentProjectFocus, newWorkSessionCount);
    if (autoTrigger) {
      console.log(`🎮 Auto-triggered minigame: ${autoTrigger.minigameType} - ${autoTrigger.triggerReason}`);
      setAutoTriggeredMinigame({
        type: autoTrigger.minigameType,
        reason: autoTrigger.triggerReason
      });
      
      toast({
        title: "🎮 Production Opportunity!",
        description: autoTrigger.triggerReason,
        className: "bg-gray-800 border-gray-600 text-white",
        duration: 4000
      });
    }

    // FIXED: Improved base work calculation with better scaling
    const baseWorkCapacity = Math.max(gameState.playerData.dailyWorkCapacity, 1);
    const attributeMultiplier = 1 + (gameState.playerData.attributes.creativeIntuition - 1) * 0.5 + (gameState.playerData.attributes.technicalAptitude - 1) * 0.5;
    
    // Enhanced base points calculation
    // Calculate base work points from player stats
    let workPoints: WorkPoints = calculateBaseWorkPoints(
      gameState.playerData.dailyWorkCapacity,
      gameState.playerData.attributes
    );
    console.log(`💪 Base work points - C: ${workPoints.creativity}, T: ${workPoints.technical}`);

    // Apply player attribute multipliers and focus allocation
    const creativityMultiplier = getCreativityMultiplier(gameState);
    const technicalMultiplier = getTechnicalMultiplier(gameState);
    const focusEffectiveness = getFocusEffectiveness(gameState);
    console.log(`🔥 Multipliers - Creativity: ${creativityMultiplier.toFixed(2)}, Technical: ${technicalMultiplier.toFixed(2)}, Focus: ${focusEffectiveness.toFixed(2)}`);
    
    workPoints = applyFocusAndMultipliers(
      workPoints,
      currentProjectFocus, // Use project-specific focus
      creativityMultiplier,
      technicalMultiplier,
      focusEffectiveness
    );
    console.log(`📊 After focus & multipliers - C: ${workPoints.creativity}, T: ${workPoints.technical}`);
    
    // Apply studio skill bonuses
    workPoints = applyStudioSkillBonusesToWorkPoints(
      workPoints,
      project.genre,
      gameState.studioSkills
    );
    console.log(`🎸 After skill bonuses - C: ${workPoints.creativity}, T: ${workPoints.technical}`);

    // Apply equipment bonuses
    workPoints = applyEquipmentBonusesToWorkPoints(
      workPoints,
      gameState.ownedEquipment,
      project.genre
    );
    console.log(`🎛️ After equipment bonuses - C: ${workPoints.creativity}, T: ${workPoints.technical}`);

    // Add staff contributions
    const assignedStaff = gameState.hiredStaff.filter(s => s.assignedProjectId === project.id && s.status === 'Working');
    console.log(`👥 Assigned staff count: ${assignedStaff.length}`);
    workPoints = calculateStaffWorkContribution(
      workPoints,
      assignedStaff,
      project.genre,
      getMoodEffectiveness // Imported from playerUtils
    );
    console.log(`🎯 FINAL GAINS - C: ${workPoints.creativity}, T: ${workPoints.technical}`);
    
    const { creativity: creativityGain, technical: technicalGain } = workPoints;

    // Create orb animations
    createOrb('creativity', creativityGain);
    createOrb('technical', technicalGain);

    // ENHANCED: Improved work units calculation with better scaling
    const totalPointsGenerated = creativityGain + technicalGain;

    // Log values for debugging stage progression
    console.log(`🐞 DEBUG - Current Stage workUnitsBase: ${currentStage.workUnitsBase}`);
    console.log(`🐞 DEBUG - Creativity Gain: ${creativityGain}`);
    console.log(`🐞 DEBUG - Technical Gain: ${technicalGain}`);
    console.log(`🐞 DEBUG - Total Points Generated: ${totalPointsGenerated}`);
    console.log(`🐞 DEBUG - Current Stage workUnitsCompleted (before): ${currentStage.workUnitsCompleted}`);
    
    // Enhanced work unit calculation:
    // - Base conversion: points to work units (divide by 3 for faster progression)
    // - Minimum progress: Always make at least 1 work unit of progress if points > 0
    // - Stage difficulty scaling: Harder stages (more work units) get bonus efficiency
    const baseWorkUnits = Math.floor(totalPointsGenerated / 3);
    const minProgress = totalPointsGenerated > 0 ? 1 : 0;
    const stageEfficiencyBonus = Math.floor(currentStage.workUnitsBase / 10); // Bonus for longer stages
    
    const workUnitsToAdd = Math.max(minProgress, baseWorkUnits + stageEfficiencyBonus);
    // Ensure at least 1 unit of progress if energy was spent and stage is not complete
    const actualWorkUnitsToAdd = (workUnitsToAdd === 0 && !currentStage.completed && totalPointsGenerated > 0) ? 1 : workUnitsToAdd; // Ensure progress if any points generated

    const newWorkUnitsCompleted = Math.min(
      currentStage.workUnitsCompleted + actualWorkUnitsToAdd, // Use actualWorkUnitsToAdd
      currentStage.workUnitsBase
    );

    console.log(`⚡ Total points generated: ${totalPointsGenerated}`);
    console.log(`🔨 Work units to add (calculated): ${workUnitsToAdd}, (actual applied): ${actualWorkUnitsToAdd}`);
    console.log(`📈 Work units: ${currentStage.workUnitsCompleted} -> ${newWorkUnitsCompleted} (max: ${currentStage.workUnitsBase})`);

    // Check if stage is completed
    const stageCompleted = newWorkUnitsCompleted >= currentStage.workUnitsBase;
    let newCurrentStageIndex = currentStageIndex;
    
    if (stageCompleted && !currentStage.completed) {
      newCurrentStageIndex = Math.min(currentStageIndex + 1, project.stages.length - 1);
      console.log(`✅ Stage completed! Moving to stage index: ${newCurrentStageIndex}`);
    }

    // FIXED: Immutable state update for React re-rendering
    setGameState(prev => {
      console.log('🔄 Updating game state with immutable update...');
      
      // Deep copy the active project to avoid mutation
      const updatedProject = {
        ...prev.activeProject!,
        stages: prev.activeProject!.stages.map((stage, index) => {
          if (index === currentStageIndex) {
            console.log(`🔄 Updating stage ${index}: ${stage.workUnitsCompleted} -> ${newWorkUnitsCompleted}, completed: ${stageCompleted}`);
            return {
              ...stage,
              workUnitsCompleted: newWorkUnitsCompleted,
              completed: stageCompleted
            };
          }
          return stage;
        }),
        accumulatedCPoints: prev.activeProject!.accumulatedCPoints + creativityGain,
        accumulatedTPoints: prev.activeProject!.accumulatedTPoints + technicalGain,
        currentStageIndex: newCurrentStageIndex,
        workSessionCount: newWorkSessionCount
      };

      console.log(`📋 Project C points: ${prev.activeProject!.accumulatedCPoints} -> ${updatedProject.accumulatedCPoints}`);
      console.log(`📋 Project T points: ${prev.activeProject!.accumulatedTPoints} -> ${updatedProject.accumulatedTPoints}`);
      console.log(`📋 Updated stages:`, updatedProject.stages.map((s, i) => `${i}: ${s.stageName} (${s.workUnitsCompleted}/${s.workUnitsBase}) ${s.completed ? '✅' : '⏳'}`));

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

    // Check if project is complete
    const allStagesComplete = project.stages.every((stage, index) => 
      index === currentStageIndex ? stageCompleted : stage.completed
    );
    
    if (allStagesComplete) {
      console.log('🎉 PROJECT WORK UNITS COMPLETE! Preparing data for celebration.');
      const finalProjectData = { // Capture all necessary details for the celebration and eventual completion call
        ...project, // This is gameState.activeProject at this point
        stages: project.stages.map((stage, index) => {
          if (index === currentStageIndex) {
            return { ...stage, workUnitsCompleted: newWorkUnitsCompleted, completed: stageCompleted };
          }
          // Ensure other stages also reflect their latest completed status if somehow missed
          return stage.completed ? stage : { ...stage, completed: stage.workUnitsCompleted >= stage.workUnitsBase };
        }),
        accumulatedCPoints: project.accumulatedCPoints + creativityGain,
        accumulatedTPoints: project.accumulatedTPoints + technicalGain,
        currentStageIndex: newCurrentStageIndex, // Should be the last stage index or project.stages.length
        workSessionCount: newWorkSessionCount
      };
      // DO NOT CALL completeProject here.
      // Return the project details so the UI can display celebration BEFORE state is wiped.
      return { finalProjectData, isComplete: true };
    }

    // Show stage completion notification
    if (stageCompleted) {
      toast({
        title: "🎉 Stage Complete!",
        description: `${currentStage.stageName} finished! ${newCurrentStageIndex < project.stages.length ? `Moving to: ${project.stages[newCurrentStageIndex].stageName}` : 'All stages complete!'}`,
        className: "bg-gray-800 border-gray-600 text-white",
        duration: 4000
      });
    } else {
      toast({
        title: "📈 Work Progress",
        description: `Stage progress: ${newWorkUnitsCompleted}/${currentStage.workUnitsBase} work units (+${actualWorkUnitsToAdd} this session)`, // Use actualWorkUnitsToAdd
        className: "bg-gray-800 border-gray-600 text-white",
      });
    }
    
    return { isComplete: false }; // No review object if not complete
  }, [gameState, createOrb, setGameState, addStaffXP, advanceDay]); // Removed focusAllocation from dependencies

  return {
    performDailyWork,
    orbContainerRef,
    autoTriggeredMinigame,
    clearAutoTriggeredMinigame: () => setAutoTriggeredMinigame(null)
  };
};
