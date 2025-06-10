
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
import { Era } from '@/components/EraSelectionModal';
import { useGameState } from '@/hooks/useGameState';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useSettings } from '@/contexts/SettingsContext';
import { useSaveSystem } from '@/contexts/SaveSystemContext';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { gameAudio as audioSystem } from '@/utils/audioSystem';

const MusicStudioTycoon = () => {
  const { gameState, setGameState, focusAllocation, setFocusAllocation, initializeGameState } = useGameState();
  const { settings } = useSettings();
  const { saveGame, loadGame, hasSavedGame } = useSaveSystem();
  
  // Splash screen and game initialization state
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
    lastReview,
    orbContainerRef,
    contactArtist,
    triggerEraTransition
  } = useGameLogic(gameState, setGameState, focusAllocation);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showRecruitmentModal, setShowRecruitmentModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);

  // Initialize background music
  useBackgroundMusic();

  // Check for existing save game on mount
  useEffect(() => {
    const checkSaveGame = () => {
      if (hasSavedGame()) {
        setShowSplashScreen(false);
        setGameInitialized(true);
      }
    };
    checkSaveGame();
  }, [hasSavedGame]);

  // Auto-open training modal when staff is selected for training
  useEffect(() => {
    if (selectedStaffForTraining) {
      setShowTrainingModal(true);
    }
  }, [selectedStaffForTraining]);

  // Handle starting a new game with selected era
  const handleStartNewGame = (era: Era) => {
    const newGameState = initializeGameState({
      startingMoney: era.startingMoney,
      selectedEra: era.id,
      eraStartYear: era.startYear,
      currentYear: era.startYear,
      equipmentMultiplier: era.equipmentMultiplier
    });
    
    setGameState(newGameState);
    setShowSplashScreen(false);
    setGameInitialized(true);
    
    // Show tutorial for new players
    const hasPlayedBefore = localStorage.getItem('recordingStudioTycoon_hasPlayed');
    if (!hasPlayedBefore && !settings.tutorialCompleted) {
      setShowTutorialModal(true);
    }

    if (settings.sfxEnabled) {
      audioSystem.playUISound('success');
    }
  };

  // Handle loading existing game
  const handleLoadGame = async () => {
    try {
      const loadedState = await loadGame();
      if (loadedState) {
        setGameState(loadedState);
        setShowSplashScreen(false);
        setGameInitialized(true);
        
        if (settings.sfxEnabled) {
          audioSystem.playUISound('success');
        }
      }
    } catch (error) {
      console.error('Failed to load game:', error);
    }
  };

  // Check if this is first time playing for tutorial
  useEffect(() => {
    const hasPlayedBefore = localStorage.getItem('recordingStudioTycoon_hasPlayed');
    if (!hasPlayedBefore && !settings.tutorialCompleted) {
      setShowTutorialModal(true);
    }
  }, [settings.tutorialCompleted]);

  // Set up auto-save triggers for key game actions
  useEffect(() => {
    if (settings.autoSave) {
      // Auto-save on level up
      const currentLevel = gameState.playerData.level;
      const savedLevel = localStorage.getItem('recordingStudioTycoon_lastLevel');
      if (savedLevel && parseInt(savedLevel) < currentLevel) {
        saveGame(gameState);
        localStorage.setItem('recordingStudioTycoon_lastLevel', currentLevel.toString());
      }
    }
  }, [gameState.playerData.level, settings.autoSave, saveGame, gameState]);

  // Play UI sounds for various actions
  useEffect(() => {
    if (settings.sfxEnabled) {
      // Level up sound
      const lastKnownLevel = parseInt(localStorage.getItem('recordingStudioTycoon_lastKnownLevel') || '1');
      if (gameState.playerData.level > lastKnownLevel) {
        audioSystem.playUISound('levelUp');
        localStorage.setItem('recordingStudioTycoon_lastKnownLevel', gameState.playerData.level.toString());
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

  // Enhanced action handlers with sound effects
  const handleProjectStart = (project: any) => {
    const result = startProject(project);
    if (settings.sfxEnabled) {
      audioSystem.playUISound('success');
    }
    return result;
  };

  const handleEquipmentPurchase = (equipmentId: string) => {
    const result = purchaseEquipment(equipmentId);
    if (settings.sfxEnabled) {
      audioSystem.playUISound('purchase');
    }
    return result;
  };

  const handleStaffHire = (candidateIndex: number) => {
    const result = hireStaff(candidateIndex);
    if (settings.sfxEnabled) {
      audioSystem.playUISound('success');
    }
    return result;
  };

  const handleTutorialComplete = () => {
    setShowTutorialModal(false);
    if (settings.sfxEnabled) {
      audioSystem.playUISound('success');
    }
  };

  // Show splash screen if game is not initialized
  if (showSplashScreen && !gameInitialized) {
    return (
      <SplashScreen
        onStartGame={handleStartNewGame}
        onLoadGame={handleLoadGame}
        hasSaveGame={hasSavedGame()}
      />
    );
  }

  // Don't render main game until initialized
  if (!gameInitialized) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white">Loading...</div>
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
        performDailyWork={handlePerformDailyWork}
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
      />

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
      />

      <NotificationSystem
        notifications={gameState.notifications}
        removeNotification={removeNotification}
      />

      <GameModals
        showReviewModal={showReviewModal}
        setShowReviewModal={setShowReviewModal}
        lastReview={lastReview}
      />
    </GameLayout>
  );
};

export default MusicStudioTycoon;
