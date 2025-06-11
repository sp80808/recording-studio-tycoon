import React, { useState, useEffect } from 'react';
import { GameLayout } from '@/components/GameLayout';
import { GameHeader } from '@/components/GameHeader';
import { MainGameContent } from '@/components/MainGameContent';
import { NotificationSystem } from '@/components/NotificationSystem';
import { TrainingModal } from '@/components/modals/TrainingModal';
import { GameModals } from '@/components/GameModals';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { TutorialModal } from '@/components/TutorialModal';
import { SplashScreen } from '@/components/SplashScreen';
import { Era } from '@/components/EraSelectionModal'; // Era type
import { ERA_DEFINITIONS } from '@/utils/eraProgression'; // ERA_DEFINITIONS for initialization
import { useGameState } from '@/hooks/useGameState';
import { Project } from '@/types/game'; // Import Project type
import { useGameLogic } from '@/hooks/useGameLogic';
import { useSettings } from '@/contexts/SettingsContext';
import { useSaveSystem } from '@/contexts/SaveSystemContext';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { gameAudio as audioSystem } from '@/utils/audioSystem';
import { MinigameType } from '@/components/minigames/MinigameManager'; // Import MinigameType

const MusicStudioTycoon = () => {
  const { gameState, setGameState, focusAllocation, setFocusAllocation, initializeGameState } = useGameState();
  const { settings } = useSettings();
  const { saveGame, loadGame, hasSavedGame } = useSaveSystem();
  
  const [showSplashScreen, setShowSplashScreen] = useState(true);
  const [gameInitialized, setGameInitialized] = useState(false);
  
  const {
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
    lastReview, // This might become obsolete or change with the new flow
    orbContainerRef,
    contactArtist,
    triggerEraTransition,
    startResearchMod, // Destructure startResearchMod
    completeProject, // Ensure this is destructured if not aliased
    addStaffXP // Ensure this is destructured if not aliased
  } = useGameLogic(gameState, setGameState, focusAllocation);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  // const [showStaffModal, setShowStaffModal] = useState(false); // Assuming this was intended to be used elsewhere or can be removed if not
  // const [showRecruitmentModal, setShowRecruitmentModal] = useState(false); // Assuming this was intended to be used elsewhere or can be removed if not
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [currentEraForTutorial, setCurrentEraForTutorial] = useState<string>(ERA_DEFINITIONS[0].id); // Default to first era

  // State for auto-triggered minigames
  const [autoTriggeredMinigame, setAutoTriggeredMinigame] = useState<{ type: MinigameType; reason: string } | null>(null);
  const clearAutoTriggeredMinigame = () => setAutoTriggeredMinigame(null);

  useBackgroundMusic();

  useEffect(() => {
    const checkSaveGame = () => {
      if (hasSavedGame()) {
        setShowSplashScreen(false);
        // Game will be initialized after loading
      }
    };
    checkSaveGame();
  }, [hasSavedGame]);

  useEffect(() => {
    if (selectedStaffForTraining) {
      setShowTrainingModal(true);
    }
  }, [selectedStaffForTraining]);

  const handleStartNewGame = (era: Era) => {
    const newGameState = initializeGameState({
      startingMoney: era.startingMoney,
      selectedEra: era.id,
      eraStartYear: era.startYear,
      currentYear: era.startYear,
      equipmentMultiplier: era.equipmentMultiplier
    });
    
    setGameState(newGameState);
    setCurrentEraForTutorial(era.id); 
    setShowSplashScreen(false);
    setGameInitialized(true);
    
    const hasPlayedBefore = localStorage.getItem('recordingStudioTycoon_hasPlayed');
    if (!hasPlayedBefore && !settings.tutorialCompleted) {
      setShowTutorialModal(true);
    }

    if (settings.sfxEnabled) {
      audioSystem.playUISound('success');
    }
    localStorage.setItem('recordingStudioTycoon_hasPlayed', 'true'); // Mark that game has been started once
  };

  const handleActualProjectCompletion = (completedProjectData: Project) => {
    console.log('Index.tsx: Handling actual project completion for:', completedProjectData.title);
    // Use the destructured completeProject and addStaffXP directly
    const review = completeProject(completedProjectData, addStaffXP);
    if (review) {
      // Potentially update lastReview state here if GameModals uses it
      // For now, let's assume GameModals might need to be updated or this state is managed differently
      // setLastReview(review); // If GameModals depends on this for showing review
      // setShowReviewModal(true); // If review modal should show after this
      
      // Update XP and check for level up (this logic was in useGameLogic's handlePerformDailyWork)
      // It should now happen here, after the project is truly completed and review/XP is known.
      setGameState(prev => ({
        ...prev,
        playerData: {
          ...prev.playerData,
          xp: prev.playerData.xp + review.xpGain
        }
      }));
      // TODO: Consider if checkAndHandleLevelUp needs to be called here from usePlayerProgression
      // For now, assuming the XP update is sufficient and level up checks happen elsewhere or are triggered by XP change.
    }
    if (settings.sfxEnabled) {
      audioSystem.playUISound('success'); // Or a specific project completion finalization sound
    }
  };

  const handleLoadGame = async () => {
    try {
      const loadedState = await loadGame();
      if (loadedState) {
        setGameState(loadedState);
        setCurrentEraForTutorial(loadedState.currentEra); 
        setShowSplashScreen(false);
        setGameInitialized(true);
        
        if (settings.sfxEnabled) {
          audioSystem.playUISound('success');
        }
      } else {
        // If loadGame returns null (e.g. no save file or error), go back to splash
        setShowSplashScreen(true);
        setGameInitialized(false);
      }
    } catch (error) {
      console.error('Failed to load game:', error);
      setShowSplashScreen(true); // Show splash screen on error to allow starting new game
      setGameInitialized(false);
    }
  };

  useEffect(() => {
    // This effect handles showing the tutorial if the game is initialized,
    // tutorial hasn't been completed, and it's the user's first session.
    // It also ensures currentEraForTutorial is set from gameState if loading a game
    // where the tutorial wasn't completed.
    const hasPlayedBefore = localStorage.getItem('recordingStudioTycoon_hasPlayed');
    if (gameInitialized && !settings.tutorialCompleted) {
      if (gameState && gameState.currentEra) {
         // If it's a loaded game, gameState.currentEra should be used.
         // If it's a new game, handleStartNewGame already set currentEraForTutorial.
        setCurrentEraForTutorial(gameState.currentEra);
      }
      // Only show tutorial if it's genuinely the first time (or tutorialCompleted is false)
      // The 'hasPlayedBefore' check in handleStartNewGame is more specific for *brand new* games.
      // This effect covers loaded games where tutorial was skipped/not finished.
      setShowTutorialModal(true); 
    }
  }, [settings.tutorialCompleted, gameInitialized, gameState]);

  useEffect(() => {
    if (settings.autoSave) {
      const currentLevel = gameState.playerData.level;
      const savedLevel = localStorage.getItem('recordingStudioTycoon_lastLevel');
      if (savedLevel && parseInt(savedLevel) < currentLevel) {
        saveGame(gameState);
        localStorage.setItem('recordingStudioTycoon_lastLevel', currentLevel.toString());
      } else if (!savedLevel) { // Save initial level
        localStorage.setItem('recordingStudioTycoon_lastLevel', currentLevel.toString());
      }
    }
  }, [gameState.playerData.level, settings.autoSave, saveGame, gameState]);

  useEffect(() => {
    if (settings.sfxEnabled) {
      const lastKnownLevel = parseInt(localStorage.getItem('recordingStudioTycoon_lastKnownLevel') || '0');
      if (gameState.playerData.level > lastKnownLevel) {
        if (lastKnownLevel !== 0) { // Don't play for initial level 1
            audioSystem.playUISound('levelUp');
        }
        localStorage.setItem('recordingStudioTycoon_lastKnownLevel', gameState.playerData.level.toString());
      } else if (gameState.playerData.level === 1 && lastKnownLevel === 0) { // Set initial known level
        localStorage.setItem('recordingStudioTycoon_lastKnownLevel', '1');
      }
    }
  }, [gameState.playerData.level, settings.sfxEnabled]);

  const removeNotification = (id: string) => {
    setGameState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== id)
    }));
  };

  const handleOpenSettings = () => {
    setShowSettingsModal(true);
    if (settings.sfxEnabled) {
      audioSystem.playUISound('buttonClick');
    }
  };

  const handleProjectStart = (project: any) => { // Consider using a more specific type for project
    const result = startProject(project);
    if (settings.sfxEnabled && result) { // Assuming startProject returns a truthy value on success
      audioSystem.playUISound('success');
    }
    return result;
  };

  const handleEquipmentPurchase = (equipmentId: string) => {
    const result = purchaseEquipment(equipmentId);
    if (settings.sfxEnabled && result) { // Assuming purchaseEquipment returns a truthy value on success
      audioSystem.playUISound('purchase');
    }
    return result;
  };

  const handleStaffHire = (candidateIndex: number) => {
    const result = hireStaff(candidateIndex);
    if (settings.sfxEnabled && result) { // Assuming hireStaff returns a truthy value on success
      audioSystem.playUISound('success');
    }
    return result;
  };

  const handleTutorialComplete = () => {
    setShowTutorialModal(false);
    // updateSettings({ tutorialCompleted: true }); // This is handled within TutorialModal
    if (settings.sfxEnabled) {
      audioSystem.playUISound('success');
    }
  };

  if (showSplashScreen && !gameInitialized) {
    return (
      <SplashScreen
        onStartGame={handleStartNewGame}
        onLoadGame={handleLoadGame}
        hasSaveGame={hasSavedGame()}
      />
    );
  }

  if (!gameInitialized) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white text-xl">Loading Your Studio...</div>
    </div>;
  }

  return (
    <GameLayout>
      <GameHeader 
        gameState={gameState} 
        onOpenSettings={handleOpenSettings}
      />

      <MainGameContent
        gameState={gameState}
        setGameState={setGameState}
        focusAllocation={focusAllocation}
        setFocusAllocation={setFocusAllocation}
        startProject={handleProjectStart}
        performDailyWork={handlePerformDailyWork} // This now returns { isComplete, finalProjectData? }
        onProjectComplete={handleActualProjectCompletion} // Pass the new handler
        onMinigameReward={handleMinigameReward}
        spendPerkPoint={handleSpendPerkPoint}
        advanceDay={advanceDay}
        purchaseEquipment={handleEquipmentPurchase}
        hireStaff={handleStaffHire}
        refreshCandidates={refreshCandidates}
        assignStaffToProject={assignStaffToProject}
        unassignStaffFromProject={unassignStaffFromProject}
        toggleStaffRest={toggleStaffRest}
        openTrainingModal={handleOpenTrainingModal}
        orbContainerRef={orbContainerRef}
        contactArtist={contactArtist}
        triggerEraTransition={triggerEraTransition}
        autoTriggeredMinigame={autoTriggeredMinigame}
        clearAutoTriggeredMinigame={clearAutoTriggeredMinigame}
        // setAutoTriggeredMinigame={setAutoTriggeredMinigame} // Pass this if MainGameContent needs to trigger minigames
      />
      {/* RightPanel needs startResearchMod, but it's not directly used by MainGameContent.
          It will be passed to RightPanel via its props later.
          The props for MainGameContent are correct as is.
          The error was in RightPanelProps definition and its usage.
          Let's ensure RightPanel receives it.
      */}

      <TrainingModal
        isOpen={showTrainingModal}
        onClose={() => {
          setShowTrainingModal(false);
          setSelectedStaffForTraining(null);
        }}
        staff={selectedStaffForTraining}
        gameState={gameState}
        sendStaffToTraining={sendStaffToTraining}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      <TutorialModal
        isOpen={showTutorialModal}
        onComplete={handleTutorialComplete}
        eraId={currentEraForTutorial} 
      />

      <NotificationSystem
        notifications={gameState.notifications}
        removeNotification={removeNotification}
      />

      <GameModals // This component might manage showReviewModal internally or receive it as a prop
        showReviewModal={showReviewModal}
        setShowReviewModal={setShowReviewModal}
        lastReview={lastReview}
      />
    </GameLayout>
  );
};

export default MusicStudioTycoon;
