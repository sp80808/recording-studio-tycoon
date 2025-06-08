import { useState } from 'react';
import { GameState, StaffMember, PlayerAttributes } from '@/types/game';
import { toast } from '@/hooks/use-toast';
import { availableTrainingCourses } from '@/data/training';
import { canPurchaseEquipment, addNotification, applyEquipmentEffects } from '@/utils/gameUtils';
import { availableEquipment } from '@/data/equipment';
import { useStaffManagement } from '@/hooks/useStaffManagement';
import { useProjectManagement } from '@/hooks/useProjectManagement';
import { usePlayerProgression } from '@/hooks/usePlayerProgression';
import { useStageWork } from '@/hooks/useStageWork';
import { useGameActions } from '@/hooks/useGameActions';

export const useGameLogic = (gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState>>, focusAllocation: any) => {
  const { levelUpPlayer, spendPerkPoint, checkAndHandleLevelUp } = usePlayerProgression(gameState, setGameState);
  const { hireStaff, assignStaffToProject, unassignStaffFromProject, toggleStaffRest, addStaffXP, openTrainingModal } = useStaffManagement(gameState, setGameState);
  const { startProject, completeProject } = useProjectManagement(gameState, setGameState);
  const { advanceDay, refreshCandidates } = useGameActions(gameState, setGameState);

  const [selectedStaffForTraining, setSelectedStaffForTraining] = useState<StaffMember | null>(null);
  const [lastReview, setLastReview] = useState<any>(null);

  const { performDailyWork, orbContainerRef, autoTriggeredMinigame, clearAutoTriggeredMinigame } = useStageWork(gameState, setGameState, focusAllocation, completeProject, addStaffXP, advanceDay);

  // Handle minigame rewards by updating project points and checking for level ups
  const handleMinigameReward = (creativityBonus: number, technicalBonus: number, xpBonus: number) => {
    if (gameState.activeProject) {
      setGameState(prev => ({
        ...prev,
        activeProject: prev.activeProject ? {
          ...prev.activeProject,
          accumulatedCPoints: prev.activeProject.accumulatedCPoints + creativityBonus,
          accumulatedTPoints: prev.activeProject.accumulatedTPoints + technicalBonus
        } : null,
        playerData: {
          ...prev.playerData,
          xp: prev.playerData.xp + xpBonus
        }
      }));

      toast({
        title: "🎯 Production Bonus!",
        description: `+${creativityBonus} creativity, +${technicalBonus} technical, +${xpBonus} XP`,
        duration: 3000
      });

      // Check for level up after a short delay to let state update
      setTimeout(() => {
        checkAndHandleLevelUp();
      }, 100);
    }
  };

  const handlePerformDailyWork = () => {
    console.log('=== HANDLE PERFORM DAILY WORK ===');
    const result = performDailyWork();
    if (result?.isComplete && result.review) {
      console.log('Project completed with review:', result.review);
      setLastReview(result.review);
      
      // Update XP and check for level up
      setGameState(prev => ({
        ...prev,
        playerData: {
          ...prev.playerData,
          xp: prev.playerData.xp + result.review.xpGain
        }
      }));

      // Check for level up after XP gain
      setTimeout(() => {
        checkAndHandleLevelUp();
      }, 100);
    }
  };

  const purchaseEquipment = (equipmentId: string) => {
    console.log(`=== PURCHASING EQUIPMENT: ${equipmentId} ===`);
    
    const equipment = availableEquipment.find(e => e.id === equipmentId);
    if (!equipment) {
      console.log('Equipment not found');
      return;
    }

    const purchaseCheck = canPurchaseEquipment(equipment, gameState);
    if (!purchaseCheck.canPurchase) {
      console.log(`Purchase blocked: ${purchaseCheck.reason}`);
      toast({
        title: "Cannot Purchase",
        description: purchaseCheck.reason,
        variant: "destructive"
      });
      return;
    }

    // Apply equipment effects and update state
    let updatedGameState = applyEquipmentEffects(equipment, gameState);
    
    // Deduct money and add equipment
    updatedGameState = {
      ...updatedGameState,
      money: updatedGameState.money - equipment.price,
      ownedEquipment: [...updatedGameState.ownedEquipment, equipment]
    };

    // Add success notification
    updatedGameState = addNotification(
      updatedGameState,
      `${equipment.name} purchased and equipped!`,
      'success',
      3000
    );

    setGameState(updatedGameState);

    toast({
      title: "Equipment Purchased!",
      description: `${equipment.name} added to your studio.`,
    });
  };

  const sendStaffToTraining = (staffId: string, courseId: string) => {
    const course = availableTrainingCourses.find(c => c.id === courseId);
    const staff = gameState.hiredStaff.find(s => s.id === staffId);
    
    if (!course || !staff || gameState.money < course.cost || staff.status !== 'Idle') {
      return;
    }

    const updatedGameState = addNotification(
      gameState,
      `${staff.name} has started ${course.name}!`,
      'info',
      3000
    );

    setGameState(prev => ({
      ...updatedGameState,
      money: prev.money - course.cost,
      hiredStaff: prev.hiredStaff.map(s => 
        s.id === staffId 
          ? { 
              ...s, 
              status: 'Training' as const, 
              trainingEndDay: prev.currentDay + course.duration,
              trainingCourse: course.id
            }
          : s
      )
    }));

    toast({
      title: "Training Started",
      description: `${staff.name} will complete ${course.name} in ${course.duration} days.`,
    });
  };

  const handleOpenTrainingModal = (staff: StaffMember) => {
    if (openTrainingModal(staff)) {
      setSelectedStaffForTraining(staff);
    }
  };

  // Enhanced spendPerkPoint function
  const handleSpendPerkPoint = (attribute: keyof PlayerAttributes) => {
    console.log(`Spending perk point on: ${attribute}`);
    if (gameState.playerData.perkPoints <= 0) {
      toast({
        title: "No Perk Points",
        description: "Complete projects to earn perk points!",
        variant: "destructive"
      });
      return;
    }

    const updatedGameState = spendPerkPoint(attribute);
    setGameState(updatedGameState);

    toast({
      title: "⚡ Attribute Upgraded!",
      description: `${String(attribute).replace(/([A-Z])/g, ' $1').trim()} increased!`,
      duration: 3000
    });
  };

  return {
    startProject,
    handlePerformDailyWork,
    handleMinigameReward,
    handleSpendPerkPoint,
    advanceDay,
    purchaseEquipment,
    hireStaff,
    refreshCandidates,
    assignStaffToProject,
    unassignStaffFromProject,
    toggleStaffRest,
    handleOpenTrainingModal,
    sendStaffToTraining,
    selectedStaffForTraining,
    setSelectedStaffForTraining,
    lastReview,
    orbContainerRef,
    autoTriggeredMinigame,
    clearAutoTriggeredMinigame
  };
};
