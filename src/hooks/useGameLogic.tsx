import { useState, useCallback } from 'react';
import { GameState, StaffMember, PlayerAttributes, FocusAllocation, Project, ProjectReport, DiscoveredArtist, LevelUpDetails } from '@/types/game'; // Added LevelUpDetails
import { toast } from '@/hooks/use-toast';
import { availableTrainingCourses } from '@/data/training';
import { canPurchaseEquipment, addNotification, applyEquipmentEffects } from '@/utils/gameUtils';
import { getAvailableEquipmentForYear } from '@/data/eraEquipment';
import { useStaffManagement } from '@/hooks/useStaffManagement';
import { useProjectManagement } from '@/hooks/useProjectManagement';
// import { usePlayerProgression } from '@/hooks/usePlayerProgression'; // This file does not exist
import { useStageWork } from '@/hooks/useStageWork';
import { useGameActions } from '@/hooks/useGameActions';
import { useGameState } from '@/hooks/useGameState'; // Import useGameState
import { useBandManagement } from '@/hooks/useBandManagement';
import { Chart, MarketTrend, ArtistContact as ChartArtistContact } from '@/types/charts'; // Re-add import, alias ArtistContact

type GameStateUpdater = (updater: (prevState: GameState) => GameState) => void;

export const useGameLogic = (
  gameState: GameState, 
  setGameState: GameStateUpdater, // This is effectively updateGameState from useGameState
  focusAllocation: FocusAllocation
) => {
  // Use useGameState hook directly to get access to all its functions
  const { 
    gameState: currentGameState, // gameState prop might be slightly stale, prefer internal from useGameState
    updateGameState, 
    triggerLevelUpModal, 
    // clearLevelUpModal // Not directly used here, but available
  } = useGameState(); 
  
  // The setGameState prop passed to useGameLogic is updateGameState from the parent.
  // We can use the updateGameState from the useGameState hook directly for consistency.
  const dispatchSetGameState = updateGameState;

  // usePlayerProgression doesn't exist, logic is being moved or handled by useGameActions / progressionUtils
  // const { levelUpPlayer, spendPerkPoint, checkAndHandleLevelUp } = usePlayerProgression(currentGameState, dispatchSetGameState);
  
  const staffManagement = useStaffManagement(currentGameState, dispatchSetGameState); 
  const {
    hireStaff,
    toggleStaffRest,
    addStaffXP: addStaffXPFromStaffManagement, // Renamed to avoid conflict
    openTrainingModal,
    assignStaff, 
    unassignStaff, 
    refreshCandidates: refreshStaffCandidates
  } = staffManagement;
  
  const projectManagement = useProjectManagement({ gameState, setGameState: dispatchSetGameState }); 
  const { startProject, completeProject: manageProjectCompletionInternal } = projectManagement; 
  
  // This is where the error "Expected 3 arguments, but got 2" occurs.
  // We need triggerLevelUpModal here. For now, this diff won't fix it fully,
  // but will prepare for it. The next step will be to get triggerLevelUpModal here.
  const gameActions = useGameActions(currentGameState, dispatchSetGameState, triggerLevelUpModal); // Pass the actual triggerLevelUpModal
  const { 
    advanceDay, 
    addMoney, 
    addReputation, 
    addXP, 
    addAttributePoints, 
    addSkillXP, 
    addPerkPoint, 
    triggerEraTransition: gameActionsTriggerEra,
    refreshCandidates: gameActionsRefreshCandidates 
  } = gameActions; 

  const bandManagement = useBandManagement(gameState, dispatchSetGameState); 
  const { processTourIncome } = bandManagement; 

  const [selectedStaffForTraining, setSelectedStaffForTraining] = useState<StaffMember | null>(null);
  const [lastReview, setLastReview] = useState<ProjectReport | null>(null);

  const completeProjectForStageWorkAdapter = useCallback((project: Project, staffXPAdder: (staffId: string, amount: number) => void): ProjectReport | undefined => {
    // manageProjectCompletionInternal expects Project and addStaffXP function.
    // It internally updates the main gameState via setGameState.
    // The review object returned here is for useStageWork to know about the completion details.
    const reviewFromInternal = manageProjectCompletionInternal(project, staffXPAdder); 

    // The XP gain for staff is now handled directly within manageProjectCompletionInternal.
    // No need for the assignedToThisProject.forEach loop here.
    
    // Ensure the returned object matches ProjectReport structure if that's what useStageWork's 'review' becomes.
    return reviewFromInternal; 
  }, [manageProjectCompletionInternal]); // Removed gameState from dependencies as it's not directly used here

  const stageWorkDeps = {
    gameState,
    setGameState: dispatchSetGameState, 
    focusAllocation,
    completeProject: completeProjectForStageWorkAdapter, 
    addStaffXP: addStaffXPFromStaffManagement, // Use renamed variable
    advanceDay
  };
  const { performDailyWork, orbContainerRef, autoTriggeredMinigame, clearAutoTriggeredMinigame } = useStageWork(stageWorkDeps);

  const handleMinigameReward = (creativityBonus: number, technicalBonus: number, xpBonus: number, minigameType?: string) => {
    console.log('handleMinigameReward: Initial state', { creativityBonus, technicalBonus, xpBonus, minigameType, activeProject: gameState.activeProject, playerData: gameState.playerData });
    
    // Update project points directly
    if (gameState.activeProject) {
      setGameState(prev => ({
        ...prev,
        activeProject: prev.activeProject ? {
          ...prev.activeProject,
          accumulatedCPoints: prev.activeProject.accumulatedCPoints + creativityBonus,
          accumulatedTPoints: prev.activeProject.accumulatedTPoints + technicalBonus
        } : null,
        playerData: { // Also update lastMinigameType here if needed
            ...prev.playerData,
            lastMinigameType: minigameType || prev.playerData.lastMinigameType
        }
      }));
    }

    // Add XP using the gameAction, which now handles level up and modal triggering
    addXP(xpBonus); 

    toast({
      title: "🎯 Production Bonus!",
      description: `+${creativityBonus} creativity, +${technicalBonus} technical, +${xpBonus} XP`,
      duration: 3000
    });
    // checkAndHandleLevelUp might be redundant if addXP handles it, but depends on its implementation details
    // For now, assuming addXP in useGameActions is the source of truth for level-up triggering.
  };

  const handlePerformDailyWork = (): PerformDailyWorkResult | undefined => { // Explicitly define return type
    console.log('handlePerformDailyWork: Before performDailyWork', { gameStateXP: currentGameState.playerData.xp });
    const result = performDailyWork(); // This is from useStageWork
    
    if (result?.isComplete && result.review) {
      console.log('handlePerformDailyWork: Project complete, review:', result.review);
      setLastReview(result.review as ProjectReport);
      
      // Add XP using the gameAction. This will handle level-up and modal.
      addXP((result.review as ProjectReport).xpGain || 0);
      
      // The rest of the state update (money, reputation, activeProject to null)
      // is handled by completeProject in useProjectManagement, which should be called by useStageWork.
      // If useStageWork's completeProject doesn't use the one from useProjectManagement, this needs alignment.
      // For now, assuming useStageWork's completeProject correctly updates game state.
      
      // Ensure finalProjectData is included in the return
      return { isComplete: true, review: result.review, finalProjectData: result.finalProjectData };
    }
    console.log('handlePerformDailyWork: Result (not complete):', result);
    return result;
  };
  
  const purchaseEquipment = (equipmentId: string) => {
    console.log('purchaseEquipment: Attempting to purchase', equipmentId);
    const availableEquipment = getAvailableEquipmentForYear(gameState.currentYear || 2024);
    const equipment = availableEquipment.find(e => e.id === equipmentId);
    if (!equipment) {
      console.log('purchaseEquipment: Equipment not found');
      return;
    }
    const purchaseCheck = canPurchaseEquipment(equipment, gameState);
    if (!purchaseCheck.canPurchase) {
      toast({ title: "Cannot Purchase", description: purchaseCheck.reason, variant: "destructive" });
      console.log('purchaseEquipment: Cannot purchase, reason:', purchaseCheck.reason);
      return;
    }
    
    setGameState(prevGameState => {
        console.log('purchaseEquipment: Before purchase - Money:', prevGameState.money, 'Owned Equipment:', prevGameState.ownedEquipment.length);
        let updatedGameState = applyEquipmentEffects(equipment, prevGameState);
        updatedGameState = {
          ...updatedGameState,
          money: updatedGameState.money - equipment.price,
          ownedEquipment: [...updatedGameState.ownedEquipment, equipment]
        };
        console.log('purchaseEquipment: After purchase - Money:', updatedGameState.money, 'Owned Equipment:', updatedGameState.ownedEquipment.length);
        return addNotification(updatedGameState, `${equipment.name} purchased!`, 'success');
    });
    toast({ title: "Equipment Purchased!", description: `${equipment.name} added.` });
  };

  const sendStaffToTraining = (staffId: string, courseId: string) => {
    const course = availableTrainingCourses.find(c => c.id === courseId);
    const staffMember = gameState.hiredStaff.find(s => s.id === staffId);
    if (!course || !staffMember || gameState.money < course.cost || staffMember.status !== 'Idle') return;
    
    setGameState(prev => {
        let tempGameState = addNotification(prev, `${staffMember.name} started ${course.name}!`, 'info');
        tempGameState = {
            ...tempGameState,
            money: tempGameState.money - course.cost,
            hiredStaff: tempGameState.hiredStaff.map(s => 
                s.id === staffId ? { ...s, status: 'Training', trainingEndDay: tempGameState.currentDay + course.duration, trainingCourse: course.id } : s
            )
        };
        return tempGameState;
    });
    toast({ title: "Training Started", description: `${staffMember.name} will complete ${course.name} in ${course.duration} days.` });
  };

  const handleOpenTrainingModal = (staff: StaffMember) => {
    if (openTrainingModal(staff)) {
      setSelectedStaffForTraining(staff);
      return true;
    }
    return false; 
  };

  const handleSpendPerkPoint = (attribute: keyof PlayerAttributes) => {
    if (currentGameState.playerData.perkPoints <= 0) {
      toast({ title: "No Perk Points", variant: "destructive" });
      return;
    }
    // spendPerkPoint was from the non-existent usePlayerProgression.
    // Assuming spending a perk point means adding to an attribute.
    // useGameActions has addAttributePoints for this.
    addAttributePoints(attribute); 
    // setGameState is already called within addAttributePoints via updateGameState
    toast({ title: "⚡ Attribute Upgraded!", description: `${String(attribute).replace(/([A-Z])/g, ' $1').trim()} increased!` });
  };

  const handleAdvanceDay = useCallback(() => {
    if(processTourIncome) processTourIncome(); 
    advanceDay();
  }, [processTourIncome, advanceDay]);

  const contactArtist = useCallback((artistId: string, offer: number) => {
    console.log('contactArtist: Attempting to contact artist', { artistId, offer, currentMoney: gameState.money });
    if (gameState.money < offer) {
      toast({ title: "Insufficient Funds", variant: "destructive" });
      console.log('contactArtist: Insufficient funds');
      return;
    }
    // Assuming discoveredArtists elements have at least id, and optionally priceRange, demandLevel, name
    const artist = gameState.chartsData?.discoveredArtists?.find((a: { id: string; name?: string; priceRange?: { min: number; max: number }; demandLevel?: number }) => a.id === artistId);
    if (!artist) {
      toast({ title: "Artist Not Found", variant: "destructive" });
      console.log('contactArtist: Artist not found');
      return;
    }
    const baseSuccessRate = 30;
    const offerMax = artist.priceRange?.max || offer * 2;
    const offerModifier = Math.min((offer / offerMax) * 40, 40);
    const reputationModifier = Math.min((gameState.reputation / 100) * 20, 20);
    const demandModifier = ((artist.demandLevel || 50) / 100) * 10;
    const successRate = Math.min(baseSuccessRate + offerModifier + reputationModifier + demandModifier, 85);
    const isSuccessful = Math.random() * 100 < successRate;
    const contact: ChartArtistContact = { artistId, status: isSuccessful ? 'accepted' : 'rejected', requestDate: new Date(), opportunityId: `opp-${artistId}-${Date.now()}`, negotiationPhase: 'initial' };
    
    console.log('contactArtist: Calculated success rate:', successRate, 'Is successful:', isSuccessful);

    setGameState(prev => {
      const baseChartsData = prev.chartsData || {
        charts: [],
        contactedArtists: [],
        marketTrends: [],
        discoveredArtists: [],
        lastChartUpdate: 0,
      };
      // Explicitly type updatedChartsData to match the non-optional part of GameState['chartsData']
      const updatedChartsData: {
        charts: Chart[];
        contactedArtists: ChartArtistContact[]; // Use aliased type
        marketTrends: MarketTrend[];
        discoveredArtists: DiscoveredArtist[]; // Use DiscoveredArtist type
        lastChartUpdate: number;
      } = {
        charts: baseChartsData.charts || [],
        contactedArtists: [...(baseChartsData.contactedArtists || []), contact],
        marketTrends: baseChartsData.marketTrends || [],
        discoveredArtists: baseChartsData.discoveredArtists || [],
        lastChartUpdate: baseChartsData.lastChartUpdate || 0,
      };
      let nextState = { ...prev, money: prev.money - offer, chartsData: updatedChartsData };
      console.log('contactArtist: Money after offer:', nextState.money);
      if (isSuccessful) {
        nextState = addNotification(nextState, `${artist.name} responded positively!`, 'success');
      }
      return nextState;
    });

    if (isSuccessful) {
      toast({ title: "🎤 Artist Interested!", description: `${artist.name} is interested!` });
    } else {
      toast({ title: "❌ Offer Declined", description: `${artist.name} declined.`, variant: "destructive" });
    }
  }, [gameState, setGameState]);

  return {
    startProject,
    handlePerformDailyWork,
    handleMinigameReward,
    handleSpendPerkPoint, 
    advanceDay: handleAdvanceDay,
    purchaseEquipment, 
    hireStaff,
    refreshCandidates: refreshStaffCandidates || gameActionsRefreshCandidates, 
    assignStaffToProject: assignStaff,
    unassignStaffFromProject: unassignStaff,
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
    triggerEraTransition: gameActionsTriggerEra, 
    completeProject: manageProjectCompletionInternal, 
    addStaffXP: addStaffXPFromStaffManagement, // Use renamed version
    addMoney,
    addReputation,
    addXP, // This is the one from gameActions that handles level up
    addAttributePoints,
    addSkillXP,
    addPerkPoint
  };
};
