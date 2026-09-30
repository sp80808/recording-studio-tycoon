import { meetsKnowHowGate, spendKnowHow, createInitialKnowHow } from '@/rpg/studioKnowHow';
import { useArtistContracts } from '@/hooks/useArtistContracts';
import { gameEvents } from '@/engine/gameEventBus';
import { useState, useCallback, useMemo } from 'react'; // Added useMemo
import { spend } from '@/economy/ledger';
import { GameState, StaffMember, PlayerAttributes, ProjectReport, Project } from '@/types/game';
import { toast } from '@/hooks/use-toast';
import { availableTrainingCourses } from '@/data/training';
import { canPurchaseEquipment, addNotification, applyEquipmentEffects } from '@/utils/gameUtils';
import { playSound } from '@/utils/soundUtils';
import { getAvailableEquipmentForYear } from '@/data/eraEquipment';
import { withDailyTracking } from '@/utils/dailyChallenges';
import { bestTake, takeFromRawScore } from '@/rpg/stageGrades';
import { useStaffManagement } from '@/hooks/useStaffManagement';
import { useProjectManagement } from '@/hooks/useProjectManagement';
import { usePlayerProgression } from '@/hooks/usePlayerProgression';
import { useStageWork } from '@/hooks/useStageWork';
import { useGameActions } from '@/hooks/useGameActions';
import { useBandManagement } from '@/hooks/useBandManagement';
import { ArtistContact } from '@/types/charts';
import { FocusAllocation } from '@/types/game'; // Import FocusAllocation type

// Import game mechanics services and sample data
import { createGameMechanicsServices } from '@/game-mechanics';
import {
  SAMPLE_CLIENTS,
  SAMPLE_RECORD_LABELS,
  SAMPLE_GENRES,
  SAMPLE_SUBGENRES,
  SAMPLE_STUDIO_PERKS,
  SAMPLE_STAFF_WELLBEING,
  SAMPLE_RANDOM_EVENTS
} from '@/game-mechanics/sample-data';


export const useGameLogic = (
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
) => {
  // Initialize game mechanics services using useMemo to prevent re-creation on every render
  const gameMechanicsServices = useMemo(() => {
    return createGameMechanicsServices(
      {
        genres: SAMPLE_GENRES,
        subGenres: SAMPLE_SUBGENRES,
        clients: SAMPLE_CLIENTS,
        recordLabels: SAMPLE_RECORD_LABELS,
        studioPerks: SAMPLE_STUDIO_PERKS,
        staffMembers: SAMPLE_STAFF_WELLBEING,
        randomEvents: SAMPLE_RANDOM_EVENTS,
      },
      gameState // Pass gameState to the services
    );
  }, [gameState]); // Re-create services only if gameState reference changes

  const { spendPerkPoint } = usePlayerProgression(gameState, setGameState);
  const { hireStaff, assignStaffToProject, unassignStaffFromProject, toggleStaffRest, addStaffXP, openTrainingModal, startResearchMod, sendStaffToTraining: originalSendStaffToTraining } = useStaffManagement(gameState, setGameState);
  const { startProject, completeProject } = useProjectManagement(gameState, setGameState);
  const { advanceDay, refreshCandidates, refreshProjects, triggerEraTransition } = useGameActions(gameState, setGameState);

  const { processContracts } = useArtistContracts(gameState, setGameState);
  const { createBand, startTour, createOriginalTrack, processTourIncome } = useBandManagement(gameState, setGameState);

  const [selectedStaffForTraining, setSelectedStaffForTraining] = useState<StaffMember | null>(null);
  const [lastReview, setLastReview] = useState<ProjectReport | null>(null);

  const { performDailyWork, orbContainerRef, autoTriggeredMinigame, clearAutoTriggeredMinigame } = useStageWork({
    gameState,
    setGameState,
    addStaffXP,
    advanceDay
  });

  // Handle minigame rewards by updating project points and checking for level ups
  const handleMinigameReward = (creativityBonus: number, technicalBonus: number, xpBonus: number, minigameType?: string, rawScore?: number) => {
    if (gameState.activeProject) {
      setGameState(prev => withDailyTracking({
        ...prev,
        activeProject: prev.activeProject ? {
          ...prev.activeProject,
          accumulatedCPoints: prev.activeProject.accumulatedCPoints + creativityBonus,
          accumulatedTPoints: prev.activeProject.accumulatedTPoints + technicalBonus,
          minigamePoints: typeof rawScore === 'number' && Number.isFinite(rawScore)
            ? Math.min(10, (prev.activeProject.minigamePoints ?? 0) + (rawScore / 1000) * 2)
            : prev.activeProject.minigamePoints,
          // Best minigame take this stage (sd3.2); reset on stage advance.
          stageTake: typeof rawScore === 'number' && Number.isFinite(rawScore)
            ? bestTake(prev.activeProject.stageTake, takeFromRawScore(rawScore))
            : prev.activeProject.stageTake
        } : null,
        playerData: {
          ...prev.playerData,
          xp: prev.playerData.xp + xpBonus,
          lastMinigameType: minigameType || prev.playerData.lastMinigameType
        }
      }, { minigames: 1 }));

      if (typeof rawScore === 'number' && Number.isFinite(rawScore)) {
        gameEvents.emit('minigame:success', { minigameType, score: rawScore });
      }

      toast({
        title: "🎯 Production Bonus!",
        description: `+${creativityBonus} creativity, +${technicalBonus} technical, +${xpBonus} XP`,
        className: "bg-stone-800 border-stone-600 text-white",
        duration: 3000
      });


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
        className: "bg-stone-800 border-stone-600 text-white",
        variant: "destructive"
      });
      return false;
    }

    // Play purchase sound
    playSound('ui sfx/purchase-complete.m4a', 0.6);

    // Apply equipment effects and update state
    let updatedGameState = applyEquipmentEffects(equipment, gameState);
    
    // Deduct money and add equipment
    updatedGameState = {
      ...updatedGameState,
      ...spend(updatedGameState, equipment.price, {
        category: 'equipment-purchase', equipmentId: equipment.id, memo: equipment.name,
      }),
      ownedEquipment: [...updatedGameState.ownedEquipment, { ...equipment, condition: 100 }]
    };

    setGameState(updatedGameState);

    toast({
      title: "💰 Equipment Purchased!",
      description: `${equipment.name} added to your studio.`,
      className: "bg-stone-800 border-stone-600 text-white",
    });
    return true;
  };

  const sendStaffToTraining = (staffId: string, courseId: string) => {
    const course = availableTrainingCourses.find(c => c.id === courseId);
    const staff = gameState.hiredStaff.find(s => s.id === staffId);
    
    if (!course || !staff || gameState.money < course.cost || staff.status !== 'Idle') {
      return;
    }
    if (course.knowHow && !meetsKnowHowGate(gameState.studioKnowHow ?? createInitialKnowHow(), course.knowHow)) {
      return;
    }

    const updatedGameState = addNotification(
      gameState,
      `${staff.name} has started ${course.name}!`,
      'info',
      3000
    );

    setGameState(prev => ({
      ...spend({ ...updatedGameState, money: prev.money, ledger: prev.ledger }, course.cost, {
        category: 'training', staffId, memo: course.name,
      }),
      studioKnowHow: course.knowHow
        ? (spendKnowHow(prev.studioKnowHow ?? createInitialKnowHow(), course.knowHow.cost) ?? prev.studioKnowHow)
        : prev.studioKnowHow,
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
      className: "bg-stone-800 border-stone-600 text-white",
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
        className: "bg-stone-800 border-stone-600 text-white",
        variant: "destructive"
      });
      return;
    }

    if (gameState.playerData.attributes[attribute] >= 10) return;
    spendPerkPoint(attribute);

    toast({
      title: "⚡ Attribute Upgraded!",
      description: `${String(attribute).replace(/([A-Z])/g, ' $1').trim()} increased!`,
      className: "bg-stone-800 border-stone-600 text-white",
      duration: 3000
    });
  };

  // Enhanced advanceDay to include tour processing and automatic daily work.
  // Returns the work result so callers (Index) can route a completed project
  // into the same review/settlement flow as manual work sessions.
  const handleAdvanceDay = useCallback((): { finalProjectData?: Project; isComplete: boolean } | undefined => {
    // First, perform daily work if there's an active project
    let workResult: { finalProjectData?: Project; isComplete: boolean } | undefined;
    if (gameState.activeProject) {
      console.log('Auto-performing daily work before advancing day');
      workResult = performDailyWork();
    }

    // Process tour income
    processTourIncome();
    processContracts();

    // Advance the day (handles salaries, staff training, etc.)
    advanceDay();
    return workResult;
  }, [gameState.activeProject, performDailyWork, processTourIncome, processContracts, advanceDay]);

  // Contact artist for collaboration
  const contactArtist = useCallback((artistId: string, offer: number) => {
    console.log(`=== CONTACTING ARTIST: ${artistId} with offer: $${offer} ===`);
    
    // Deduct the offer amount from player's money
    if (gameState.money < offer) {
      toast({
        title: "💰 Insufficient Funds",
        description: "You don't have enough money to make this offer.",
        className: "bg-stone-800 border-stone-600 text-white",
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
        className: "bg-stone-800 border-stone-600 text-white",
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
      ...spend(prev, offer, { category: 'marketing', memo: 'Artist outreach offer' }),
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
        className: "bg-stone-800 border-stone-600 text-white",
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
        className: "bg-stone-800 border-stone-600 text-white",
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
    refreshProjects,
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
