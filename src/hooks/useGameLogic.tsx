import { useState, useCallback } from 'react';
import { GameState, StaffMember, PlayerAttributes, FocusAllocation, Project, ProjectReport, DiscoveredArtist } from '@/types/game'; // Removed ArtistContact from here
import { toast } from '@/hooks/use-toast';
import { availableTrainingCourses } from '@/data/training';
import { canPurchaseEquipment, addNotification, applyEquipmentEffects } from '@/utils/gameUtils';
import { getAvailableEquipmentForYear } from '@/data/eraEquipment';
import { useStaffManagement } from '@/hooks/useStaffManagement';
import { useProjectManagement } from '@/hooks/useProjectManagement';
import { usePlayerProgression } from '@/hooks/usePlayerProgression';
import { useStageWork } from '@/hooks/useStageWork';
import { useGameActions } from '@/hooks/useGameActions';
import { useBandManagement } from '@/hooks/useBandManagement';
import { Chart, MarketTrend, ArtistContact as ChartArtistContact } from '@/types/charts'; // Re-add import, alias ArtistContact

type GameStateUpdater = (updater: (prevState: GameState) => GameState) => void;

export const useGameLogic = (
  gameState: GameState, 
  setGameState: GameStateUpdater, 
  focusAllocation: FocusAllocation
) => {
  const dispatchSetGameState: React.Dispatch<React.SetStateAction<GameState>> = useCallback(
    (value) => {
      if (typeof value === 'function') {
        setGameState(value as (prevState: GameState) => GameState);
      } else {
        setGameState(() => value as GameState);
      }
    },
    [setGameState]
  );

  const { levelUpPlayer, spendPerkPoint, checkAndHandleLevelUp } = usePlayerProgression(gameState, dispatchSetGameState);
  
  const staffManagement = useStaffManagement(); 
  const { 
    hireStaff, 
    toggleStaffRest, 
    addStaffXP, 
    openTrainingModal, 
    assignStaff, 
    unassignStaff, 
    refreshCandidates: refreshStaffCandidates 
  } = staffManagement;
  
  const projectManagement = useProjectManagement({ gameState, setGameState: dispatchSetGameState }); 
  const { startProject, completeProject: manageProjectCompletionInternal } = projectManagement; 
  
  const gameActions = useGameActions(gameState, (newState) => setGameState(() => newState));
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
    const tempGameStateConst = { ...gameState, activeProject: project }; // Use const
    // manageProjectCompletionInternal expects GameState and returns a report-like object.
    // It internally updates the main gameState via setGameState.
    // The review object returned here is for useStageWork to know about the completion details.
    const reviewFromInternal = manageProjectCompletionInternal(tempGameStateConst); 

    if (reviewFromInternal && reviewFromInternal.xpGain) { 
        const assignedToThisProject = tempGameStateConst.hiredStaff.filter(s => s.assignedProjectId === project.id);
        assignedToThisProject.forEach(staff => {
            staffXPAdder(staff.id, reviewFromInternal.xpGain || 0); // Default to 0 if undefined
        });
    }
    // Ensure the returned object matches ProjectReport structure if that's what useStageWork's 'review' becomes.
    // The 'any' in useStageWork for review type needs to be ProjectReport.
    return reviewFromInternal; 
  }, [gameState, manageProjectCompletionInternal]); 

  const stageWorkDeps = {
    gameState,
    setGameState: dispatchSetGameState, 
    focusAllocation,
    completeProject: completeProjectForStageWorkAdapter, 
    addStaffXP, 
    advanceDay
  };
  const { performDailyWork, orbContainerRef, autoTriggeredMinigame, clearAutoTriggeredMinigame } = useStageWork(stageWorkDeps);

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
        duration: 3000
      });
      setTimeout(() => {
        checkAndHandleLevelUp();
      }, 100);
    }
  };

  const handlePerformDailyWork = () => {
    const result = performDailyWork(); 
    if (result?.isComplete && result.review) {
      setLastReview(result.review as ProjectReport); // Cast review to ProjectReport
      setGameState(prev => ({
        ...prev,
        playerData: {
          ...prev.playerData,
          xp: prev.playerData.xp + ((result.review as ProjectReport).xpGain || 0) 
        }
      }));
      setTimeout(() => {
        checkAndHandleLevelUp();
      }, 100);
      // performDailyWork from useStageWork does not return finalProjectData
      return { isComplete: true, review: result.review }; 
    }
    return result;
  };
  
  const purchaseEquipment = (equipmentId: string) => {
    const availableEquipment = getAvailableEquipmentForYear(gameState.currentYear || 2024);
    const equipment = availableEquipment.find(e => e.id === equipmentId);
    if (!equipment) return;
    const purchaseCheck = canPurchaseEquipment(equipment, gameState);
    if (!purchaseCheck.canPurchase) {
      toast({ title: "Cannot Purchase", description: purchaseCheck.reason, variant: "destructive" });
      return;
    }
    
    setGameState(prevGameState => {
        let updatedGameState = applyEquipmentEffects(equipment, prevGameState);
        updatedGameState = {
          ...updatedGameState,
          money: updatedGameState.money - equipment.price,
          ownedEquipment: [...updatedGameState.ownedEquipment, equipment]
        };
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
    if (gameState.playerData.perkPoints <= 0) {
      toast({ title: "No Perk Points", variant: "destructive" });
      return;
    }
    const updatedStateFromHook = spendPerkPoint(attribute); 
    setGameState(() => updatedStateFromHook); 
    toast({ title: "⚡ Attribute Upgraded!", description: `${String(attribute).replace(/([A-Z])/g, ' $1').trim()} increased!` });
  };

  const handleAdvanceDay = useCallback(() => {
    if(processTourIncome) processTourIncome(); 
    advanceDay();
  }, [processTourIncome, advanceDay]);

  const contactArtist = useCallback((artistId: string, offer: number) => {
    if (gameState.money < offer) {
      toast({ title: "Insufficient Funds", variant: "destructive" });
      return;
    }
    // Assuming discoveredArtists elements have at least id, and optionally priceRange, demandLevel, name
    const artist = gameState.chartsData?.discoveredArtists?.find((a: { id: string; name?: string; priceRange?: { min: number; max: number }; demandLevel?: number }) => a.id === artistId); 
    if (!artist) {
      toast({ title: "Artist Not Found", variant: "destructive" });
      return;
    }
    const baseSuccessRate = 30;
    const offerModifier = Math.min((offer / (artist.priceRange?.max || offer * 2)) * 40, 40); 
    const reputationModifier = Math.min((gameState.reputation / 100) * 20, 20);
    const demandModifier = ((artist.demandLevel || 50) / 100) * 10; 
    const successRate = Math.min(baseSuccessRate + offerModifier + reputationModifier + demandModifier, 85);
    const isSuccessful = Math.random() * 100 < successRate;
    const contact: ChartArtistContact = { artistId, status: isSuccessful ? 'accepted' : 'rejected', requestDate: new Date(), opportunityId: `opp-${artistId}-${Date.now()}`, negotiationPhase: 'initial' };
    
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
    addStaffXP,
    addMoney,
    addReputation,
    addXP,
    addAttributePoints,
    addSkillXP,
    addPerkPoint
  };
};
