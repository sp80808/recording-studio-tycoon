import React, { useState, useEffect, useCallback, useRef } from 'react'; // Added useCallback
import { GameLayout } from '@/components/GameLayout';
import { GameHeader } from '@/components/GameHeader';
import { MainGameContent } from '@/components/MainGameContent';
import { RewardFlights } from '@/components/RewardFlights';
import { NotificationSystem } from '@/components/NotificationSystem';
import { TrainingModal } from '@/components/modals/TrainingModal';
import { GameModals } from '@/components/GameModals';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { TutorialModal } from '@/components/TutorialModal';
import { SplashScreen } from '@/components/SplashScreen';
import { Era } from '@/components/EraSelectionModal'; // Era type
import { useGameState } from '@/hooks/useGameState';
import { GameState, Project, ProjectReport, StaffMember } from '@/types/game'; // Import GameState, Project, ProjectReport, StaffMember
import { generateProjectReview } from '@/utils/projectReviewUtils'; // Import generateProjectReview
import { getFocusEffectiveness, getMoodEffectiveness } from '@/utils/playerUtils';
import { calculateStudioSkillBonus, getEquipmentBonuses } from '@/utils/gameUtils';
import { getGenreMarketMultiplier } from '@/utils/eraProgression';
import { ProjectReviewModal } from '@/components/modals/ProjectReviewModal'; // Import ProjectReviewModal (assuming path)
import { useGameLogic } from '@/hooks/useGameLogic';
import { useSettings } from '@/contexts/SettingsContext';
import { useSaveSystem } from '@/contexts/SaveSystemContext';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { gameAudio as audioSystem } from '@/utils/audioSystem';
import { MinigameType } from '@/components/minigames/MinigameManager'; // Import MinigameType
import { WelcomeBackSummaryModal } from '@/components/modals/WelcomeBackSummaryModal';
import {
  advanceSimulation,
  DEFAULT_MAX_OFFLINE_MS,
  shouldShowSimulationSummary,
  SimulationSummary
} from '@/simulation/simulationClock';
import { getBookedStudioRoom } from '@/utils/studioRoomUtils';

const MusicStudioTycoon = () => {
  const { gameState, setGameState, initializeGameState } = useGameState(); // REMOVED focusAllocation, setFocusAllocation
  const { settings } = useSettings();
  const { saveGame, loadGameSnapshot, hasSavedGame, resetGame } = useSaveSystem();
  
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
    refreshProjects,
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
  } = useGameLogic(gameState, setGameState); // REMOVED focusAllocation, setFocusAllocation

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  // const [showStaffModal, setShowStaffModal] = useState(false); // Assuming this was intended to be used elsewhere or can be removed if not
  // const [showRecruitmentModal, setShowRecruitmentModal] = useState(false); // Assuming this was intended to be used elsewhere or can be removed if not
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [compactStudioMode, setCompactStudioMode] = useState(false);
  const [activeProjectReport, setActiveProjectReport] = useState<ProjectReport | null>(null);
  const [offlineSummary, setOfflineSummary] = useState<SimulationSummary | null>(null);
  const simulationLastTickRef = useRef(Date.now());
  
  const handleLoadGameStateFromString = (newGameState: GameState) => {
    setGameState(newGameState);
    // Additional logic might be needed here, e.g., re-initializing parts of the UI or game logic
    // For now, just setting the game state.
    // Potentially close splash screen if open, set gameInitialized, etc.
    // This function will primarily be called from in-game settings, so splash screen might not be an issue.
    // If called from splash settings, then setShowSplashScreen(false) and setGameInitialized(true) would be needed.
  };

  // State for auto-triggered minigames
  const [autoTriggeredMinigame, setAutoTriggeredMinigame] = useState<{ type: MinigameType; reason: string } | null>(null);
  const clearAutoTriggeredMinigame = () => setAutoTriggeredMinigame(null);

  useBackgroundMusic();


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
    setShowSplashScreen(false);
    setGameInitialized(true);
    
    if (settings.sfxEnabled) {
      audioSystem.playUISound('success');
    }
    localStorage.setItem('recordingStudioTycoon_hasPlayed', 'true'); // Mark that game has been started once
  };

  const handleShowProjectReview = useCallback((completedProjectData: Project) => {
    console.log('Index.tsx: Generating review for project:', completedProjectData.title);
    // Determine assigned person (this is a simplified assumption)
    // In a more complex setup, MainGameContent or ActiveProject would pass this.
    let assignedPersonDetails: { type: 'player' | 'staff'; id: string; name: string };
    const assignedStaff = gameState.hiredStaff.find(s => s.assignedProjectId === completedProjectData.id);

    if (assignedStaff) {
      assignedPersonDetails = { type: 'staff', id: assignedStaff.id, name: assignedStaff.name };
    } else {
      // Default to player if no staff is explicitly assigned to this project ID
      // This assumes single project assignment for staff.
      assignedPersonDetails = { type: 'player', id: 'player', name: 'You' };
    }
    
    // Real settlement context (bead ruc.1): equipment condition + bonuses,
    // focus effectiveness, assigned-crew contribution, studio genre expertise,
    // and market trend — same factors ProjectService uses for background work.
    const ownedEquipment = gameState.ownedEquipment || [];
    const baseEquipmentQuality = ownedEquipment.length > 0
      ? ownedEquipment.reduce((sum, eq) => sum + (eq.condition ?? 100), 0) / ownedEquipment.length
      : 50; // Default if no equipment
    const bookedRoom = getBookedStudioRoom(gameState, completedProjectData);
    const equipmentBonuses = getEquipmentBonuses(ownedEquipment, completedProjectData.genre);
    const equipmentQuality = Math.max(
      0,
      Math.min(100, Math.round(baseEquipmentQuality * 0.6 + Math.min(40, equipmentBonuses.quality || 0) + (bookedRoom?.qualityBonus || 0)))
    );
    const crewForProject = gameState.hiredStaff.filter(s => s.assignedProjectId === completedProjectData.id);
    const staffContribution = crewForProject.length === 0 ? 0 : Math.max(0, Math.min(10, Math.round(
      crewForProject.reduce((sum, staff) => {
        const base = (staff.primaryStats.creativity + staff.primaryStats.technical) / 2;
        const affinity = staff.genreAffinity && staff.genreAffinity.genre === completedProjectData.genre
          ? staff.genreAffinity.bonus / 10
          : 0;
        return sum + base * 0.08 * getMoodEffectiveness(staff.mood) + affinity;
      }, 0) / crewForProject.length
    )));
    const genreSkill = gameState.studioSkills[completedProjectData.genre];
    const report = generateProjectReview(
      completedProjectData,
      assignedPersonDetails,
      equipmentQuality,
      gameState.playerData,
      gameState.hiredStaff,
      {
        focusEffectiveness: getFocusEffectiveness(gameState),
        staffContribution,
        studioQualityBonus: genreSkill ? calculateStudioSkillBonus(genreSkill, 'quality') : 0,
        equipmentQualityBonus: Math.max(
          0,
          Math.min(10, Math.round((equipmentBonuses.quality || 0) / 2 + (equipmentBonuses.genre || 0) / 4))
        ),
        marketMultiplier: getGenreMarketMultiplier(completedProjectData.genre, gameState.currentEra),
      }
    );
    
    setActiveProjectReport(report);
    setCompactStudioMode(false); // Reviews are full-studio moments; expand before presenting one.
    setShowReviewModal(true); // This will trigger the new ProjectReviewModal

    if (settings.sfxEnabled) {
      audioSystem.playUISound('event'); // Sound for review screen appearing
    }
  }, [gameState, settings.sfxEnabled, setGameState]);


  const handleFinalizeProjectCompletion = useCallback(() => {
    if (!activeProjectReport) return;

    console.log('Index.tsx: Finalizing project completion for:', activeProjectReport.projectTitle);
    completeProject(activeProjectReport); // Call the updated completeProject with the report

    // No need to update player XP here, as completeProject now handles all state updates based on the report.
    // Also, checkAndHandleLevelUp from usePlayerProgression should be called after gameState updates,
    // potentially within useGameLogic or triggered by a useEffect watching player XP/level.
    // For now, we assume useProjectManagement's setGameState will trigger necessary downstream effects.

    setShowReviewModal(false);
    setActiveProjectReport(null);

    if (settings.sfxEnabled) {
      audioSystem.playUISound('success'); 
    }
  }, [activeProjectReport, completeProject, settings.sfxEnabled, setGameState]);


  // Advance-day path uses the same review/settlement flow as manual work:
  // if the auto work session finished the project, show the real report modal.
  const handleAdvanceDayWithReview = useCallback(() => {
    const result = advanceDay();
    if (result?.isComplete && result.finalProjectData) {
      console.log('Index.tsx: Advance-day work completed project, showing review:', result.finalProjectData.title);
      handleShowProjectReview(result.finalProjectData);
    }
  }, [advanceDay, handleShowProjectReview]);


  const handleLoadGame = async () => {
    try {
      const snapshot = loadGameSnapshot();
      if (snapshot) {
        const elapsedMs = Math.max(0, Date.now() - snapshot.savedAt);
        const simulation = advanceSimulation(snapshot.gameState, elapsedMs, {
          maxElapsedMs: DEFAULT_MAX_OFFLINE_MS
        });

        setGameState(simulation.state);
        setShowSplashScreen(false);
        setGameInitialized(true);
        simulationLastTickRef.current = Date.now();

        if (shouldShowSimulationSummary(simulation.summary)) {
          setOfflineSummary(simulation.summary);
        }

        if (simulation.summary.creditedMs > 0) {
          saveGame(simulation.state);
        }
        
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

  // Keep active sessions progressing while the app is open. If the browser
  // throttles this timer in the background, the next tick receives the full
  // elapsed delta and catches up through the same simulation function.
  useEffect(() => {
    if (!gameInitialized || !gameState.activeProject || gameState.activeProject.awaitingReview) {
      simulationLastTickRef.current = Date.now();
      return;
    }

    simulationLastTickRef.current = Date.now();
    const interval = window.setInterval(() => {
      const now = Date.now();
      const elapsedMs = Math.max(0, now - simulationLastTickRef.current);
      simulationLastTickRef.current = now;

      if (elapsedMs <= 0) return;

      setGameState(prev => advanceSimulation(prev, elapsedMs, {
        maxElapsedMs: DEFAULT_MAX_OFFLINE_MS
      }).state);
    }, 5_000);

    return () => window.clearInterval(interval);
  }, [gameInitialized, gameState.activeProject?.id, gameState.activeProject?.awaitingReview]);

  // The save provider emits this event every 30 seconds when autosave is on.
  // Previously no game component consumed it, so saves could remain stale.
  useEffect(() => {
    if (!gameInitialized) return;

    const handleAutoSave = () => saveGame(gameState);
    window.addEventListener('autoSave', handleAutoSave);
    return () => window.removeEventListener('autoSave', handleAutoSave);
  }, [gameInitialized, gameState, saveGame]);

  // Passive work stops at review-ready rather than settling rewards. Once any
  // welcome-back summary is dismissed, hand the completed project to the
  // existing authoritative review/completion flow.
  useEffect(() => {
    const project = gameState.activeProject;
    if (
      gameInitialized &&
      project?.awaitingReview &&
      !offlineSummary &&
      !activeProjectReport &&
      !showReviewModal
    ) {
      handleShowProjectReview(project);
    }
  }, [
    gameInitialized,
    gameState.activeProject,
    offlineSummary,
    activeProjectReport,
    showReviewModal,
    handleShowProjectReview
  ]);


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

  const handleProjectStart = (project: Project) => { // Consider using a more specific type for project
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
    <GameLayout eraId={gameState.currentEra}>
      {!compactStudioMode && <RewardFlights gameState={gameState} />}
      <div className="flex flex-col h-full">
        {!compactStudioMode && (
          <GameHeader 
            gameState={gameState} 
            onOpenSettings={handleOpenSettings}
            triggerEraTransition={triggerEraTransition}
            className="grid-area-header"
          />
        )}
        <TutorialModal
          isOpen={!settings.tutorialCompleted && !compactStudioMode && !offlineSummary}
          onComplete={handleTutorialComplete}
          gameState={gameState}
        />
        <div className="flex-grow min-h-0">
          <MainGameContent
            gameState={gameState}
            setGameState={setGameState}
            startProject={handleProjectStart}
            performDailyWork={handlePerformDailyWork} // This now returns { isComplete, finalProjectData? }
            onProjectComplete={handleShowProjectReview} // Changed to show review first
            onMinigameReward={handleMinigameReward}
            spendPerkPoint={handleSpendPerkPoint}
            advanceDay={handleAdvanceDayWithReview}
            purchaseEquipment={handleEquipmentPurchase}
            hireStaff={handleStaffHire}
            refreshCandidates={refreshCandidates}
            refreshProjects={refreshProjects}
            assignStaffToProject={assignStaffToProject}
            unassignStaffFromProject={unassignStaffFromProject}
            toggleStaffRest={toggleStaffRest}
            openTrainingModal={handleOpenTrainingModal}
            orbContainerRef={orbContainerRef}
            contactArtist={contactArtist}
            triggerEraTransition={triggerEraTransition}
            autoTriggeredMinigame={autoTriggeredMinigame}
            clearAutoTriggeredMinigame={clearAutoTriggeredMinigame}
            compactStudioMode={compactStudioMode}
            setCompactStudioMode={setCompactStudioMode}
          />
        </div>
      </div>

      <WelcomeBackSummaryModal
        summary={offlineSummary}
        onClose={() => setOfflineSummary(null)}
      />

      <TrainingModal
        isOpen={showTrainingModal && !compactStudioMode && !offlineSummary}
        onClose={() => {
          setShowTrainingModal(false);
          setSelectedStaffForTraining(null);
        }}
        staff={selectedStaffForTraining}
        gameState={gameState}
        sendStaffToTraining={sendStaffToTraining}
      />

      <SettingsModal
        isOpen={showSettingsModal && !compactStudioMode}
        onClose={() => setShowSettingsModal(false)}
        onResetGame={resetGame} // Pass resetGame from useSaveSystem
        context="ingame" // Explicitly set context for in-game settings
        onLoadGameStateFromString={handleLoadGameStateFromString} // Pass the new handler
      />



      {!compactStudioMode && (
        <NotificationSystem
          notifications={gameState.notifications}
          removeNotification={removeNotification}
        />
      )}

      {/* <GameModals // This component might manage showReviewModal internally or receive it as a prop
        showReviewModal={showReviewModal}
        setShowReviewModal={setShowReviewModal}
        lastReview={lastReview} // This 'lastReview' state might be deprecated or used differently by GameModals
      /> */}
      {/* New Project Review Modal */}
      {activeProjectReport && (
        <ProjectReviewModal
          isOpen={showReviewModal}
          onClose={handleFinalizeProjectCompletion} // Finalizes completion when modal is closed
          report={activeProjectReport}
        />
      )}
    </GameLayout>
  );
};

export default MusicStudioTycoon;
