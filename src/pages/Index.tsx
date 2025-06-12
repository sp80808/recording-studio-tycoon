import React, { useState, useEffect, useCallback } from 'react';
import { GameLayout } from '@/components/GameLayout';
import { GameHeader } from '@/components/GameHeader';
import { MainGameContent } from '@/components/MainGameContent';
import { NotificationSystem } from '@/components/NotificationSystem';
import { TrainingModal } from '@/components/modals/TrainingModal';
// import { GameModals } from '@/components/GameModals'; // GameModals seems to be replaced by individual modals
import { SettingsModal } from '@/components/modals/SettingsModal';
import { TutorialModal } from '@/components/TutorialModal';
import { SplashScreen } from '@/components/SplashScreen';
import { Era } from '@/components/EraSelectionModal';
import { ERA_DEFINITIONS } from '@/utils/eraProgression';
import { useGameState } from '@/hooks/useGameState';
import { Project, ProjectReport, StaffMember, GameState, FocusAllocation, Equipment } from '@/types/game'; // Added GameState, FocusAllocation, Equipment
import { generateProjectReview } from '@/utils/projectReviewUtils';
import { ProjectReviewModal } from '@/components/modals/ProjectReviewModal';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useSettings } from '@/contexts/SettingsContext';
import { useSaveSystem } from '@/contexts/SaveSystemContext';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { gameAudio as audioSystem } from '@/utils/audioSystem';
import { MinigameType } from '@/types/miniGame';
// Removed duplicate FocusAllocation import

const MusicStudioTycoon = () => {
  const { 
    gameState, 
    focusAllocation: globalFocusAllocation, 
    setFocusAllocation: setGlobalFocusAllocation, 
    updateGameState, 
    startNewGame: resetGameStateToInitial 
  } = useGameState();

  const { settings } = useSettings();
  const { saveGame: saveGameToStorage, loadGame: loadGameFromStorage, hasSavedGame, resetGame: resetSaveSystemGame } = useSaveSystem();
  
  const [showSplashScreen, setShowSplashScreen] = useState(true);
  const [gameInitialized, setGameInitialized] = useState(false);
  
  // Correctly call useGameLogic with 3 arguments
  const gameLogic = useGameLogic(gameState, updateGameState, globalFocusAllocation);

  // Ensure all functions from gameLogic are correctly destructured or accessed via gameLogic.
  const {
    startProject: logicStartProject,
    handlePerformDailyWork: logicHandlePerformDailyWork,
    handleMinigameReward: logicHandleMinigameReward,
    handleSpendPerkPoint: logicHandleSpendPerkPoint,
    advanceDay: logicAdvanceDay,
    purchaseEquipment: logicPurchaseEquipment,
    hireStaff: logicHireStaff,
    refreshCandidates: logicRefreshCandidates,
    assignStaffToProject: logicAssignStaffToProject,
    unassignStaffFromProject: logicUnassignStaffFromProject,
    toggleStaffRest: logicToggleStaffRest,
    handleOpenTrainingModal: logicHandleOpenTrainingModal,
    sendStaffToTraining: logicSendStaffToTraining,
    selectedStaffForTraining: logicSelectedStaffForTraining, // This is state, not a function
    setSelectedStaffForTraining: logicSetSelectedStaffForTraining, // This is state setter
    lastReview: logicLastReview, // This is state
    orbContainerRef: logicOrbContainerRef, // This is a ref
    autoTriggeredMinigame: logicAutoTriggeredMinigame, // This is state
    clearAutoTriggeredMinigame: logicClearAutoTriggeredMinigame,
    contactArtist: logicContactArtist,
    triggerEraTransition: logicTriggerEraTransition, // This expects newEraId: string
    completeProject: logicCompleteProject,
    addStaffXP: logicAddStaffXP,
    addMoney: logicAddMoney,
    addReputation: logicAddReputation,
    addXP: logicAddXP,
    addAttributePoints: logicAddAttributePoints,
    addSkillXP: logicAddSkillXP,
    addPerkPoint: logicAddPerkPoint
  } = gameLogic;


  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [currentEraForTutorial, setCurrentEraForTutorial] = useState<string>(ERA_DEFINITIONS[0].id);
  const [activeProjectReport, setActiveProjectReport] = useState<ProjectReport | null>(null);
  
  const handleLoadGameStateFromString = (newGameStateString: string) => {
    try {
      const parsedGameState = JSON.parse(newGameStateString) as GameState;
      updateGameState(() => parsedGameState);
      if (parsedGameState.currentEra) {
        setCurrentEraForTutorial(parsedGameState.currentEra);
      }
      // Assuming this is called from settings, splash screen is not an issue.
    } catch (error) {
      console.error("Failed to parse and load game state from string:", error);
      // Consider using a toast notification if available globally or via context
      // toast({ title: "Error", description: "Failed to load game state from string.", variant: "destructive" });
    }
  };

  const [autoTriggeredMinigame, setAutoTriggeredMinigame] = useState<{ type: MinigameType; reason: string } | null>(null);
  const clearAutoTriggeredMinigame = () => setAutoTriggeredMinigame(null);

  useBackgroundMusic(); // Manages BGM based on gameState.currentEra

  useEffect(() => {
    const checkSaveGame = async () => { // Make async if loadGameFromStorage is async
      if (await hasSavedGame()) { // Assuming hasSavedGame might be async
        setShowSplashScreen(false);
        // Game will be initialized after loading via handleLoadGame
      }
    };
    checkSaveGame();
  }, [hasSavedGame]);

  useEffect(() => {
    if (logicSelectedStaffForTraining) { // Use destructured variable
      setShowTrainingModal(true);
    }
  }, [logicSelectedStaffForTraining]);

  const handleStartNewGame = (era: Era) => {
    resetGameStateToInitial(); 
    updateGameState(prevState => ({
      ...prevState, // Keep most of the reset state
      currentEra: era.id,
      selectedEra: era.id,
      eraStartYear: era.startYear,
      currentYear: era.startYear,
      money: era.startingMoney,
      equipmentMultiplier: era.equipmentMultiplier,
      availableProjects: [], 
      activeProject: null,
      hiredStaff: [],
      playerData: { // Reset player data specifically for the new era
        ...prevState.playerData, // Keep attributes structure
        level: 1,
        xp: 0,
        xpToNextLevel: 100, // Reset XP to next level
        perkPoints: 0, // Reset perk points
        reputation: 0, // Reset player reputation
        dailyWorkCapacity: 100, // Reset work capacity
      },
      notifications: [], // Clear notifications
      chartsData: { // Reset charts
        charts: [],
        contactedArtists: [],
        marketTrends: [],
        discoveredArtists: [],
        lastChartUpdate: 0,
      },
      focusAllocation: { // Reset focus
        performance: 33,
        soundCapture: 34,
        layering: 33,
        reasoning: "Initial default distribution for new game."
      }
    }));
    
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
    localStorage.setItem('recordingStudioTycoon_hasPlayed', 'true');
  };

  const handleShowProjectReview = useCallback((completedProjectData: Project) => {
    console.log('Index.tsx: Generating review for project:', completedProjectData.title);
    let assignedPersonDetails: { type: 'player' | 'staff'; id: string; name: string };
    const assignedStaff = gameState.hiredStaff.find(s => s.assignedProjectId === completedProjectData.id);

    if (assignedStaff) {
      assignedPersonDetails = { type: 'staff', id: assignedStaff.id, name: assignedStaff.name };
    } else {
      assignedPersonDetails = { type: 'player', id: 'player', name: 'You' };
    }
    
    // Using equipment price as a proxy for quality, as 'condition' is not on Equipment type
    const averageEquipmentQuality = gameState.ownedEquipment.length > 0
      ? gameState.ownedEquipment.reduce((sum, eq: Equipment) => sum + (eq.price / 100), 0) / gameState.ownedEquipment.length 
      : 50; 

    const report = generateProjectReview(
      completedProjectData,
      assignedPersonDetails,
      averageEquipmentQuality,
      gameState.playerData,
      gameState.hiredStaff
    );
    
    setActiveProjectReport(report);
    setShowReviewModal(true);

    if (settings.sfxEnabled) {
      audioSystem.playUISound('event');
    }
  }, [gameState, settings.sfxEnabled]);


  const handleFinalizeProjectCompletion = useCallback(() => {
    if (!activeProjectReport) return;
    console.log('Index.tsx: Finalizing project completion for:', activeProjectReport.projectTitle);
    
    // completeProject from useProjectManagement expects the GameState.
    // The activeProjectReport is used to display the review, but the completion logic
    // in useProjectManagement likely operates on gameState.activeProject.
    // We need to ensure that when completeProject is called, gameState.activeProject
    // is the project that activeProjectReport refers to.
    // This might require that handleShowProjectReview doesn't nullify activeProject yet,
    // or that completeProject is refactored to take the report or project data directly.
    // For now, passing gameState as expected by the current signature.
    if (typeof logicCompleteProject === 'function' && !gameState.activeProject) {
      console.warn("Attempting to finalize completion but no active project in game state. This might not work as expected.");
      // Potentially, we could reconstruct a minimal GameState or pass the project from the report
      // if completeProject was designed to handle that.
    }

    setShowReviewModal(false);
    setActiveProjectReport(null);

    if (settings.sfxEnabled) {
      audioSystem.playUISound('success'); 
    }
  }, [activeProjectReport, gameLogic, settings.sfxEnabled]);


  const handleLoadGame = async () => {
    try {
      const loadedState = await loadGameFromStorage(); 
      if (loadedState) {
        updateGameState(() => loadedState); 
        setCurrentEraForTutorial(loadedState.currentEra); 
        setShowSplashScreen(false);
        setGameInitialized(true);
        
        if (settings.sfxEnabled) {
          audioSystem.playUISound('success');
        }
      } else {
        setShowSplashScreen(true);
        setGameInitialized(false);
      }
    } catch (error) {
      console.error('Failed to load game:', error);
      setShowSplashScreen(true); 
      setGameInitialized(false);
    }
  };

  useEffect(() => {
    const hasPlayedBefore = localStorage.getItem('recordingStudioTycoon_hasPlayed');
    if (gameInitialized && !settings.tutorialCompleted) {
      if (gameState && gameState.currentEra) {
        setCurrentEraForTutorial(gameState.currentEra);
      }
      setShowTutorialModal(true); 
    }
  }, [settings.tutorialCompleted, gameInitialized, gameState]);

  useEffect(() => {
    if (settings.autoSave && gameInitialized) { // Only autosave if game is initialized
      const currentLevel = gameState.playerData.level;
      const savedLevel = localStorage.getItem('recordingStudioTycoon_lastLevel');
      if (savedLevel && parseInt(savedLevel) < currentLevel) {
        saveGameToStorage(gameState); 
        localStorage.setItem('recordingStudioTycoon_lastLevel', currentLevel.toString());
      } else if (!savedLevel) { 
        localStorage.setItem('recordingStudioTycoon_lastLevel', currentLevel.toString());
      }
    }
  }, [gameState.playerData.level, settings.autoSave, saveGameToStorage, gameState, gameInitialized]);

  useEffect(() => {
    if (settings.sfxEnabled && gameInitialized) { // Only play sfx if game is initialized
      const lastKnownLevel = parseInt(localStorage.getItem('recordingStudioTycoon_lastKnownLevel') || '0');
      if (gameState.playerData.level > lastKnownLevel) {
        if (lastKnownLevel !== 0) { 
            audioSystem.playUISound('levelUp');
        }
        localStorage.setItem('recordingStudioTycoon_lastKnownLevel', gameState.playerData.level.toString());
      } else if (gameState.playerData.level === 1 && lastKnownLevel === 0) { 
        localStorage.setItem('recordingStudioTycoon_lastKnownLevel', '1');
      }
    }
  }, [gameState.playerData.level, settings.sfxEnabled, gameInitialized]);

  const removeNotification = (id: string) => {
    updateGameState(prev => ({
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
  
  // Ensure these handlers use functions from gameLogic
  const handleProjectStart = (project: Project) => { // Typed project
    const result = logicStartProject(project); // Use destructured variable
    if (settings.sfxEnabled && result) { 
      audioSystem.playUISound('success');
    }
    return result;
  };

  const handleEquipmentPurchase = (equipmentId: string) => {
    const result = logicPurchaseEquipment(equipmentId); // Use destructured variable
    if (settings.sfxEnabled && result) { 
      audioSystem.playUISound('purchase');
    }
    return result;
  };

  const handleStaffHire = (candidate: StaffMember) => { // Changed to StaffMember
    const result = logicHireStaff(candidate); // Use destructured variable
    if (settings.sfxEnabled && result) { 
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
      <div className="flex flex-col h-full">
        <GameHeader 
          gameState={gameState} 
          onOpenSettings={handleOpenSettings}
        />
        <div className="flex-grow min-h-0">
          <MainGameContent
            // Pass necessary state and actions; MainGameContent might use its own hooks too
            gameState={gameState} 
            focusAllocation={globalFocusAllocation}
            setFocusAllocation={setGlobalFocusAllocation as React.Dispatch<React.SetStateAction<FocusAllocation>>}
            // Pass updateGameState (which is GameStateUpdater) as setGameState, casting if necessary
            // MainGameContent expects React.Dispatch<React.SetStateAction<GameState>>
            setGameState={updateGameState as React.Dispatch<React.SetStateAction<GameState>>}
            performDailyWork={logicHandlePerformDailyWork}
            onProjectComplete={handleShowProjectReview}
            onMinigameReward={logicHandleMinigameReward}
            spendPerkPoint={logicHandleSpendPerkPoint}
            advanceDay={logicAdvanceDay}
            purchaseEquipment={handleEquipmentPurchase} 
            hireStaff={(candidateIndex: number): boolean => {
              // Adapter for hireStaff: MainGameContent passes index, logicHireStaff expects StaffMember
              const candidate = gameState.availableCandidates[candidateIndex];
              if (candidate) {
                return logicHireStaff(candidate);
              }
              console.error("Candidate not found for hiring at index:", candidateIndex);
              return false;
            }} 
            refreshCandidates={logicRefreshCandidates}
            assignStaffToProject={(staffId: string): void => {
              // Adapter for assignStaffToProject: MainGameContent passes only staffId,
              // logicAssignStaffToProject expects staffId and project.
              // We need the current active project from gameState.
              if (gameState.activeProject) {
                logicAssignStaffToProject(staffId, gameState.activeProject);
                // Return type of logicAssignStaffToProject is boolean, but MainGameContent expects void.
                // The boolean result can be ignored here if MainGameContent doesn't use it.
              } else {
                console.error("No active project to assign staff to.");
              }
            }}
            unassignStaffFromProject={logicUnassignStaffFromProject}
            toggleStaffRest={logicToggleStaffRest}
            openTrainingModal={logicHandleOpenTrainingModal}
            orbContainerRef={logicOrbContainerRef}
            contactArtist={logicContactArtist}
            triggerEraTransition={logicTriggerEraTransition} 
            autoTriggeredMinigame={autoTriggeredMinigame}
            clearAutoTriggeredMinigame={clearAutoTriggeredMinigame}
            startProject={handleProjectStart} 
          />

      <TrainingModal
        isOpen={showTrainingModal}
        onClose={() => {
          setShowTrainingModal(false);
          logicSetSelectedStaffForTraining(null); // Use destructured setter
        }}
        staff={logicSelectedStaffForTraining} // Use destructured state
        gameState={gameState}
        sendStaffToTraining={logicSendStaffToTraining} // Use destructured function
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onResetGame={resetSaveSystemGame} 
        context="ingame"
        onLoadGameStateFromString={handleLoadGameStateFromString}
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

      {activeProjectReport && (
        <ProjectReviewModal
          isOpen={showReviewModal}
          onClose={handleFinalizeProjectCompletion}
          report={activeProjectReport}
        />
      )}
        </div>
      </div>
    </GameLayout>
  );
};

export default MusicStudioTycoon;
