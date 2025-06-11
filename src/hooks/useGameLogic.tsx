
import { useState, useCallback } from 'react';
import { GameState, StaffMember, PlayerAttributes } from '@/types/game';
import { toast } from '@/hooks/use-toast';
import { availableTrainingCourses } from '@/data/training';
import { canPurchaseEquipment, addNotification, applyEquipmentEffects } from '@/utils/gameUtils';
import { playSound } from '@/utils/soundUtils';
import { getAvailableEquipmentForYear } from '@/data/eraEquipment';
import { useStaffManagement } from '@/hooks/useStaffManagement';
import { useProjectManagement } from '@/hooks/useProjectManagement';
import { usePlayerProgression } from '@/hooks/usePlayerProgression';
import { useStageWork } from '@/hooks/useStageWork';
import { useGameActions } from '@/hooks/useGameActions';
import { useBandManagement } from '@/hooks/useBandManagement';
import { ArtistContact } from '@/types/charts';

export const useGameLogic = (gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState>>, focusAllocation: any) => {
  const { levelUpPlayer, spendPerkPoint, checkAndHandleLevelUp } = usePlayerProgression(gameState, setGameState);
  const { hireStaff, assignStaffToProject, unassignStaffFromProject, toggleStaffRest, addStaffXP, openTrainingModal, startResearchMod, sendStaffToTraining: originalSendStaffToTraining } = useStaffManagement(gameState, setGameState); // Destructure startResearchMod, alias sendStaffToTraining
  const { startProject, completeProject } = useProjectManagement(gameState, setGameState);
  const { advanceDay, refreshCandidates, triggerEraTransition } = useGameActions(gameState, setGameState);

  const { createBand, startTour, createOriginalTrack, processTourIncome } = useBandManagement(gameState, setGameState);

  const [selectedStaffForTraining, setSelectedStaffForTraining] = useState<StaffMember | null>(null);
  const [lastReview, setLastReview] = useState<any>(null);

  const { performDailyWork, orbContainerRef, autoTriggeredMinigame, clearAutoTriggeredMinigame } = useStageWork({
    gameState,
    setGameState,
    focusAllocation,
    // completeProject is no longer passed to useStageWork
    addStaffXP,
    advanceDay
  });

  // Handle minigame rewards by updating project points and checking for level ups
  const handleMinigameReward = (creativityBonus: number, technicalBonus: number, xpBonus: number, minigameType?: string) => {
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
          xp: prev.playerData.xp + xpBonus,
          lastMinigameType: minigameType || prev.playerData.lastMinigameType
        }
      }));

      toast({
        title: "🎯 Production Bonus!",
        description: `+${creativityBonus} creativity, +${technicalBonus} technical, +${xpBonus} XP`,
        className: "bg-gray-800 border-gray-600 text-white",
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
    const result = performDailyWork(); // Now returns { isComplete: boolean, finalProjectData?: Project }
    
    if (result?.isComplete && result.finalProjectData) {
      console.log('Project work units complete. Passing up final project data for celebration:', result.finalProjectData.title);
      // The actual `completeProject` call (which gives XP, money, etc.)
      // will happen after the celebration, triggered by ActiveProject.tsx -> Index.tsx
      // So, we don't setLastReview or update player XP here directly from a review object.
      // We just pass the signal and data up.
      return { isComplete: true, finalProjectData: result.finalProjectData };
    }
    // If not complete, or if somehow isComplete is true but no finalProjectData (should not happen)
    return result; // This would be { isComplete: false } or undefined
  };

  const purchaseEquipment = (equipmentId: string) => {
    console.log(`=== PURCHASING EQUIPMENT: ${equipmentId} ===`);
    
    const availableEquipment = getAvailableEquipmentForYear(gameState.currentYear || 2024);
    const equipment = availableEquipment.find(e => e.id === equipmentId);
    if (!equipment) {
      console.log('Equipment not found');
      return false;
    }

    const purchaseCheck = canPurchaseEquipment(equipment, gameState);
    if (!purchaseCheck.canPurchase) {
      console.log(`Purchase blocked: ${purchaseCheck.reason}`);
      playSound('error.wav', 0.5);
      toast({
        title: "❌ Cannot Purchase",
        description: purchaseCheck.reason,
        className: "bg-gray-800 border-gray-600 text-white",
        variant: "destructive"
      });
      return false;
    }

    // Play purchase sound
    playSound('ui sfx/purchase-complete.mp3', 0.6);

    // Apply equipment effects and update state
    let updatedGameState = applyEquipmentEffects(equipment, gameState);
    
    // Deduct money and add equipment
    updatedGameState = {
      ...updatedGameState,
      money: updatedGameState.money - equipment.price,
      ownedEquipment: [...updatedGameState.ownedEquipment, { ...equipment, condition: 100 }]
    };

    setGameState(updatedGameState);

    toast({
      title: "💰 Equipment Purchased!",
      description: `${equipment.name} added to your studio.`,
      className: "bg-gray-800 border-gray-600 text-white",
    });
    return true;
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
      title: "📚 Training Started",
      description: `${staff.name} will complete ${course.name} in ${course.duration} days.`,
      className: "bg-gray-800 border-gray-600 text-white",
    });
  };

  const handleOpenTrainingModal = (staff: StaffMember) => {
    if (openTrainingModal(staff)) {
      setSelectedStaffForTraining(staff);
      return true; // Indicates modal should open
    }
    return false;
  };

  // Enhanced spendPerkPoint function
  const handleSpendPerkPoint = (attribute: keyof PlayerAttributes) => {
    console.log(`Spending perk point on: ${attribute}`);
    if (gameState.playerData.perkPoints <= 0) {
      toast({
        title: "❌ No Perk Points",
        description: "Complete projects to earn perk points!",
        className: "bg-gray-800 border-gray-600 text-white",
        variant: "destructive"
      });
      return;
    }

    const updatedGameState = spendPerkPoint(attribute);
    setGameState(updatedGameState);

    toast({
      title: "⚡ Attribute Upgraded!",
      description: `${String(attribute).replace(/([A-Z])/g, ' $1').trim()} increased!`,
      className: "bg-gray-800 border-gray-600 text-white",
      duration: 3000
    });
  };

  // Enhanced advanceDay to include tour processing
  const handleAdvanceDay = useCallback(() => {
    processTourIncome();
    advanceDay();
  }, [processTourIncome, advanceDay]);

  // Contact artist for collaboration
  const contactArtist = useCallback((artistId: string, offer: number) => {
    console.log(`=== CONTACTING ARTIST: ${artistId} with offer: $${offer} ===`);
    
    // Deduct the offer amount from player's money
    if (gameState.money < offer) {
      toast({
        title: "💰 Insufficient Funds",
        description: "You don't have enough money to make this offer.",
        className: "bg-gray-800 border-gray-600 text-white",
        variant: "destructive"
      });
      return;
    }

    // Find the artist from the charts data
    const artist = gameState.chartsData?.discoveredArtists?.find(a => a.id === artistId);
    if (!artist) {
      toast({
        title: "❌ Artist Not Found",
        description: "Unable to find the specified artist.",
        className: "bg-gray-800 border-gray-600 text-white",
        variant: "destructive"
      });
      return;
    }

    // Calculate success probability based on offer amount, reputation, and artist preferences
    const baseSuccessRate = 30; // 30% base chance
    const offerModifier = Math.min((offer / artist.priceRange.max) * 40, 40); // Up to 40% bonus for good offers
    const reputationModifier = Math.min((gameState.reputation / 100) * 20, 20); // Up to 20% bonus for reputation
    const demandModifier = (artist.demandLevel / 100) * 10; // Up to 10% bonus based on artist demand
    
    const successRate = Math.min(baseSuccessRate + offerModifier + reputationModifier + demandModifier, 85);
    const isSuccessful = Math.random() * 100 < successRate;

    // Create artist contact entry
    const contact: ArtistContact = {
      artistId: artistId,
      status: isSuccessful ? 'accepted' : 'rejected',
      requestDate: new Date(),
      opportunityId: `opp-${artistId}-${Date.now()}`,
      negotiationPhase: 'initial'
    };

    // Deduct money and update game state
    setGameState(prev => ({
      ...prev,
      money: prev.money - offer,
      chartsData: {
        ...prev.chartsData,
        contactedArtists: [...(prev.chartsData?.contactedArtists || []), contact]
      }
    }));

    // Show result toast
    if (isSuccessful) {
      toast({
        title: "🎤 Artist Interested!",
        description: `${artist.name} is interested in working with you! They'll be in touch soon.`,
        className: "bg-gray-800 border-gray-600 text-white",
        duration: 5000
      });
      
      // Add notification for follow-up
      const notification = {
        id: `artist-contact-${Date.now()}`,
        message: `${artist.name} responded positively to your offer! Check back for collaboration opportunities.`,
        type: 'success' as const,
        timestamp: Date.now(),
        duration: 8000
      };
      
      setGameState(prev => ({
        ...prev,
        notifications: [...prev.notifications, notification]
      }));
    } else {
      toast({
        title: "❌ Offer Declined",
        description: `${artist.name} declined your offer. Try again later or consider a higher offer.`,
        className: "bg-gray-800 border-gray-600 text-white",
        variant: "destructive",
        duration: 5000
      });
    }
  }, [gameState.money, gameState.reputation, gameState.chartsData, setGameState]);

  return {
    startProject,
    handlePerformDailyWork,
    handleMinigameReward,
    handleSpendPerkPoint,
    advanceDay: handleAdvanceDay,
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
    clearAutoTriggeredMinigame,
    contactArtist,
    triggerEraTransition,
    startResearchMod, // Add startResearchMod here
    completeProject, // Export completeProject
    addStaffXP // Export addStaffXP
  };
};
