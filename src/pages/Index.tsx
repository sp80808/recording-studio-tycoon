import { useCutsceneQueue } from '@/hooks/useCutsceneQueue';
import { applyKnowHowEvents } from '@/rpg/studioKnowHow';
import { telemetry } from '@/telemetry/sink';
import { installTelemetryDevHandle } from '@/telemetry/devHandle';
import { REWARD_POP_EVENT, type RewardPopDetail } from '@/utils/rewardFx';
import React, { useState, useEffect, useCallback, useRef } from 'react'; // Added useCallback
import { GameLayout } from '@/components/GameLayout';
import { GameHeader } from '@/components/GameHeader';
import { MainGameContent } from '@/components/MainGameContent';
import { RewardFlights } from '@/components/RewardFlights';
import { gameEvents } from '@/engine/gameEventBus';
import { artistChartBoost } from '@/simulation/artistContracts';
import { advanceChartWeek, debutChartRun, weeksDue } from '@/utils/chartRun';
import { ChartRevealScene } from '@/components/ChartRevealScene';
import { SeasonAwardsCeremony } from '@/components/SeasonAwardsCeremony';
import { NotificationSystem } from '@/components/NotificationSystem';
import { TrainingModal } from '@/components/modals/TrainingModal';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { TutorialModal } from '@/components/TutorialModal';
import { SplashScreen } from '@/components/SplashScreen';
import { Era } from '@/components/EraSelectionModal'; // Era type
import '@/components/studio-play.css';
import { useGameState } from '@/hooks/useGameState';
import { installFlightCaseRewards } from '@/economy/rewardHookup';
import { useAmbientIncome } from '@/hooks/useAmbientIncome';
import { announceAwards, applySeasonTick } from '@/economy/seasonRewards';
import { seasonReviewNote } from '@/rpg/studioSeasons';
import { GameState, Project, ProjectReport, StaffMember } from '@/types/game'; // Import GameState, Project, ProjectReport, StaffMember
import DeliveryChoiceDialog from '@/components/DeliveryChoiceDialog';
import { quoteFor } from '@/rpg/serviceQuote';
import { applyDeliveryDecision, type UnresolvedIssue } from '@/rpg/sessionIssues';
import { generateProjectReview } from '@/utils/projectReviewUtils'; // Import generateProjectReview
import { getFocusEffectiveness, getMoodEffectiveness } from '@/utils/playerUtils';
import { calculateStudioSkillBonus, getEquipmentBonuses, resolveSessionEquipment } from '@/utils/gameUtils';
import { getGenreMarketMultiplier } from '@/utils/eraProgression';
import { getSettlementBonuses } from '@/utils/settlementBonuses';
import { hasActiveChoreBuff } from '@/simulation/choreEngine';
import { ProjectReviewModal } from '@/components/modals/ProjectReviewModal'; // Import ProjectReviewModal (assuming path)
import { useGameLogic } from '@/hooks/useGameLogic';
import { useSettings } from '@/contexts/SettingsContext';
import { useSaveSystem } from '@/contexts/SaveSystemContext';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { gameAudio as audioSystem } from '@/utils/audioSystem';
import { WelcomeBackSummaryModal } from '@/components/modals/WelcomeBackSummaryModal';
import { StorylineBranchModal } from '@/components/modals/StorylineBranchModal';
import { PauseMenuModal } from '@/components/modals/PauseMenuModal';
import { useGamepad } from '@/hooks/useGamepad';
import { StoryEventModal } from '@/components/modals/StoryEventModal';
import { DirectorEventModal } from '@/components/modals/DirectorEventModal';
import { DayCloseBanner } from '@/components/DayCloseBanner';
import { getDayCloseBeat } from '@/narrative/dayClose';
import { getPendingDirectorEvent, resolveDirectorChoice } from '@/narrative/directorEvents';
import { CinematicStoryCutscene } from '@/components/cutscenes/CinematicStoryCutscene';
import { getCampaignEnding } from '@/narrative/endings';
import { buildActIntroCutscene, buildEndingCutscene, buildMoveInCutscene } from '@/narrative/actCinematics';
import { clearPremisesMoveBeat, getPremisesMoveBeat } from '@/rpg/premises';
import {
  advanceSimulation,
  DEFAULT_MAX_OFFLINE_MS,
  shouldShowSimulationSummary,
  SimulationSummary
} from '@/simulation/simulationClock';
import { getBookedStudioRoom } from '@/utils/studioRoomUtils';
import {
  getPendingStorylineBranch,
  getActiveCampaignNode,
  getPendingSubplotEvent,
  resolveStorylineBranch,
  resolveSubplotChoice,
  type StorylineBranchOption,
} from '@/narrative/branchingStorylineEngine';
import { isTauriShell } from '@/utils/platform';
import type { ProducerBackgroundId } from '@/types/character';
import { setDisplayCurrency } from '@/utils/displayMoney';
import type { ProducerSetup } from '@/components/CareerStartScreen';
import { useFeatureFlag } from '@/stores/featureFlagStore';
import { canOpenProjectReview, traceReviewFlow } from '@/utils/projectReviewFlow';
import { StudioClockProvider } from '@/contexts/StudioClockContext';

const MusicStudioTycoon = () => {
  const { gameState, setGameState, initializeGameState } = useGameState(); // REMOVED focusAllocation, setFocusAllocation
  const { settings } = useSettings();
  // Display currency for every money label (home city + era). Set before children render.
  setDisplayCurrency(gameState.cityId, gameState.currentEra);
  const { saveGame, loadGameSnapshot, hasSavedGame, resetGame } = useSaveSystem();
  
  const [showSplashScreen, setShowSplashScreen] = useState(true);
  const [gameInitialized, setGameInitialized] = useState(false);
  const [studioCameraReset, setStudioCameraReset] = useState(0);
  
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
    autoTriggeredMinigame,
    clearAutoTriggeredMinigame,
    contactArtist,
    triggerEraTransition,
    startResearchMod, // Destructure startResearchMod
    completeProject, // Ensure this is destructured if not aliased
    addStaffXP // Ensure this is destructured if not aliased
  } = useGameLogic(gameState, setGameState); // REMOVED focusAllocation, setFocusAllocation

  const storyPresenter = useCutsceneQueue(state => state.presenter);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  // const [showStaffModal, setShowStaffModal] = useState(false); // Assuming this was intended to be used elsewhere or can be removed if not
  // const [showRecruitmentModal, setShowRecruitmentModal] = useState(false); // Assuming this was intended to be used elsewhere or can be removed if not
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [showStorylineBranchModal, setShowStorylineBranchModal] = useState(false);
  // Key of a subplot beat the player chose to decide later; cleared when the beat changes or they reopen it.
  const [deferredStoryEventKey, setDeferredStoryEventKey] = useState<string | null>(null);
  const [historicalNewsOpen, setHistoricalNewsOpen] = useState(false);
  const [compactStudioMode, setCompactStudioMode] = useState(false);
  // zel.6: compact strip is desktop-shell only — browser must never blank the playable UI.
  const desktopStripFlag = useFeatureFlag('desktop-studio-strip');
  const desktopStripEnabled = desktopStripFlag && isTauriShell();
  const effectiveCompactStudioMode = compactStudioMode && desktopStripEnabled;
  const [activeProjectReport, setActiveProjectReport] = useState<ProjectReport | null>(null);
  const deliveryAllowance = (projectId: string): number => {
    const p = [gameState.activeProject, ...(gameState.activeProjects ?? [])].find(x => x?.id === projectId);
    return p ? quoteFor(gameState, p).revisionAllowance : 0;
  };
  const [pendingDelivery, setPendingDelivery] = useState<{ report: ProjectReport; issues: UnresolvedIssue[]; projectId: string } | null>(null);
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

  useBackgroundMusic();


  // Read-only playtest state; no production debug controls or save mutations.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const target = window as Window & { render_game_to_text?: () => string };
    target.render_game_to_text = () => JSON.stringify({
      inputOwners: { storyPresenter, offline: Boolean(offlineSummary), review: showReviewModal, training: showTrainingModal, settings: showSettingsModal, pause: showPauseMenu, branch: showStorylineBranchModal, tutorialCompleted: settings.tutorialCompleted },
      coordinates: 'Screen pixels: origin top-left, x right, y down. Studio management uses menu controls.',
      mode: showSplashScreen ? 'career-start' : gameInitialized ? 'studio' : 'loading',
      city: gameState.cityId,
      era: gameState.currentEra,
      year: gameState.currentYear,
      day: gameState.currentDay,
      money: gameState.money,
      energy: gameState.playerData.dailyWorkCapacity,
      reputation: gameState.reputation,
      intervention: autoTriggeredMinigame,
      storyEvent: gameState.storylineState?.director?.pending?.eventId ?? null,
      lastStoryChoice: gameState.storylineState?.director?.history.at(-1)?.optionId ?? null,
      equipment: gameState.ownedEquipment.map(item => item.templateId ?? item.id),
      crew: gameState.hiredStaff.map(member => ({ name: member.name, role: member.role, status: member.status, energy: member.energy })),
      project: gameState.activeProject ? { id: gameState.activeProject.id, title: gameState.activeProject.title, progress: gameState.activeProject.progress, stage: gameState.activeProject.currentStageIndex, takes: gameState.activeProject.workSessionCount, awaitingReview: gameState.activeProject.awaitingReview, stages: gameState.activeProject.stages.map(stage => ({ completed: stage.completed, work: stage.workUnitsCompleted })), focus: gameState.activeProject.focusAllocation } : null,
      controls: Array.from(document.querySelectorAll<HTMLButtonElement>('button')).filter(button => button.getClientRects().length && !button.disabled).map(button => button.getAttribute('aria-label') || button.textContent?.trim()).slice(0, 32),
    });
    return () => { delete target.render_game_to_text; };
  }, [gameState, showSplashScreen, gameInitialized, storyPresenter, offlineSummary, showReviewModal, showTrainingModal, showSettingsModal, showPauseMenu, showStorylineBranchModal, settings.tutorialCompleted, autoTriggeredMinigame]);

  useEffect(() => installFlightCaseRewards(setGameState), [setGameState]);
  useEffect(() => {
    telemetry.startRun(gameState.saveSeed);
    installTelemetryDevHandle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useAmbientIncome(gameInitialized && !showSplashScreen && !showPauseMenu, setGameState);

  useEffect(() => {
    if (selectedStaffForTraining) {
      setShowTrainingModal(true);
    }
  }, [selectedStaffForTraining]);

  // zel.6: never leave compact mode sticky when the desktop-strip gate is off (browser).
  useEffect(() => {
    if (compactStudioMode && !desktopStripEnabled) {
      setCompactStudioMode(false);
    }
  }, [compactStudioMode, desktopStripEnabled]);

  // Auto-open campaign branch modal when an Act objective completes (pending choice).
  const pendingBranchFlag = gameState.storylineState?.storyFlags?.pending_branch_choice;
  useEffect(() => {
    if (
      gameInitialized &&
      !showSplashScreen &&
      !effectiveCompactStudioMode &&
      !offlineSummary &&
      !showReviewModal &&
      typeof pendingBranchFlag === 'string'
    ) {
      setShowStorylineBranchModal(true);
    }
  }, [
    gameInitialized,
    showSplashScreen,
    effectiveCompactStudioMode,
    offlineSummary,
    showReviewModal,
  ]);

  // Keyboard and gamepad pause menu handling
  const gamepad = useGamepad();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSplashScreen || !gameInitialized) return;
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        const target = e.target as HTMLElement | null;
        if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
        if (target?.isContentEditable) return;

        // If settings or another modal is open, let that modal's escape handler handle it first
        if (showSettingsModal || showReviewModal || showTrainingModal || showStorylineBranchModal || pendingDelivery) {
          return;
        }

        e.preventDefault();
        setShowPauseMenu((prev) => {
          const next = !prev;
          if (settings.sfxEnabled) {
            void audioSystem.playUISound(next ? 'menuOpen' : 'menuClose');
          }
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSplashScreen, gameInitialized, showSettingsModal, showReviewModal, showTrainingModal, showStorylineBranchModal, pendingDelivery, settings.sfxEnabled]);

  useEffect(() => {
    if (!gamepad.isConnected || showSplashScreen || !gameInitialized) return;
    if (gamepad.justPressed.start) {
      if (showSettingsModal || showReviewModal || showTrainingModal || showStorylineBranchModal || pendingDelivery) {
        return;
      }
      setShowPauseMenu((prev) => {
        const next = !prev;
        if (settings.sfxEnabled) {
          void audioSystem.playUISound(next ? 'menuOpen' : 'menuClose');
        }
        return next;
      });
    }
  }, [gamepad.isConnected, gamepad.justPressed.start, showSplashScreen, gameInitialized, showSettingsModal, showReviewModal, showTrainingModal, showStorylineBranchModal, pendingDelivery, settings.sfxEnabled]);

  const pendingStorylineBranch = getPendingStorylineBranch(gameState);
  const pendingStoryEvent = getPendingSubplotEvent(gameState);
  const pendingDirectorEvent = getPendingDirectorEvent(gameState);
  const pendingStoryEventKey = pendingStoryEvent
    ? `${pendingStoryEvent.subplot.id}:${pendingStoryEvent.active.currentStage}`
    : pendingDirectorEvent
      ? `director:${pendingDirectorEvent.def.id}:${pendingDirectorEvent.subject?.id ?? ''}`
      : null;

  // Story cinematics (act openings + epilogue) wait for every other story popup to clear.
  const storyEventOpen =
    pendingStoryEventKey !== null && pendingStoryEventKey !== deferredStoryEventKey && !historicalNewsOpen;
  const storyStageClear =
    gameInitialized &&
    !showSplashScreen &&
    !effectiveCompactStudioMode &&
    !offlineSummary &&
    !showReviewModal &&
    !(showStorylineBranchModal && Boolean(pendingStorylineBranch)) &&
    !storyEventOpen &&
    !historicalNewsOpen &&
    settings.tutorialCompleted;
  const campaignEnding = gameState.storylineState?.campaignCompleted ? getCampaignEnding(gameState) : null;
  const activeCampaignNode = gameState.storylineState ? getActiveCampaignNode(gameState) : null;
  const actIntroFlag = activeCampaignNode ? `intro_seen_${activeCampaignNode.id}` : null;
  const showEpilogue = Boolean(campaignEnding) && !gameState.endingSeen && storyStageClear;
  const moveBeat = getPremisesMoveBeat(gameState);
  const showMoveIn = moveBeat !== null && !showEpilogue && storyStageClear;
  const showActIntro =
    !showEpilogue &&
    !showMoveIn &&
    storyStageClear &&
    Boolean(activeCampaignNode && activeCampaignNode.act >= 2 && actIntroFlag) &&
    !gameState.storylineState?.campaignCompleted &&
    !gameState.storylineState?.storyFlags[actIntroFlag!];

  const handleStoryEventChoice = useCallback(
    (optionId: string) => {
      setGameState((prev) => resolveSubplotChoice(prev, optionId));
    },
    [setGameState],
  );

  const handleDirectorEventChoice = useCallback(
    (optionId: string) => {
      setGameState((prev) => resolveDirectorChoice(prev, optionId));
    },
    [setGameState],
  );

  const handleStorylineBranchChoice = useCallback(
    (option: StorylineBranchOption) => {
      setGameState((prev) => resolveStorylineBranch(prev, option));
      if (settings.sfxEnabled) {
        void audioSystem.playUISound('success').catch(() => {});
      }
    },
    [setGameState, settings.sfxEnabled],
  );

  const handleStartNewGame = (era: Era, originId?: ProducerBackgroundId, producer?: ProducerSetup) => {
    const newGameState = initializeGameState({
      originId,
      producerName: producer?.name,
      producerAppearance: producer?.appearance,
      cityId: producer?.cityId,
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

  const finalizingReviewRef = useRef<string | null>(null);
  const handleShowProjectReview = useCallback((completedProjectData: Project) => {
    if (!canOpenProjectReview({ reviewOpen: showReviewModal, hasReport: Boolean(activeProjectReport), hasPendingDelivery: Boolean(pendingDelivery) })) {
      traceReviewFlow('show-review-skipped', `${completedProjectData.id} already open`);
      return;
    }
    traceReviewFlow('show-review', completedProjectData.id);
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
    
    // Real settlement context (bead ruc.1 / 8om): seated room gear when the
    // player has engaged racks; inventory-only / legacy saves keep full owned list.
    const bookedRoom = getBookedStudioRoom(gameState, completedProjectData);
    const sessionEquipment = resolveSessionEquipment(gameState, bookedRoom?.id ?? completedProjectData.bookingRoomId);
    const baseEquipmentQuality = sessionEquipment.length > 0
      ? sessionEquipment.reduce((sum, eq) => sum + (eq.condition ?? 100), 0) / sessionEquipment.length
      : 50; // Default if no equipment
    const equipmentBonuses = getEquipmentBonuses(sessionEquipment, completedProjectData.genre);
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
        sessionEquipment,
        brewReady:
          gameState.choreState?.chores.brew_espresso?.completed === true ||
          hasActiveChoreBuff(gameState.choreState, 'vibe_boost'),
        ...getSettlementBonuses(
          gameState,
          completedProjectData,
          getGenreMarketMultiplier(completedProjectData.genre, gameState.currentEra),
        ),
      }
    );
    
    setCompactStudioMode(false); // Reviews return to the full studio scene.
    const openIssues = completedProjectData.unresolvedIssues ?? [];
    if (openIssues.length > 0) {
      // #87: the player chooses Deliver or Polish before the review is shown.
      traceReviewFlow('delivery-prompt', completedProjectData.id);
      setPendingDelivery({ report, issues: openIssues, projectId: completedProjectData.id });
    } else {
      setActiveProjectReport(report);
      setShowReviewModal(true); // This will trigger the new ProjectReviewModal
      traceReviewFlow('review-modal-open', completedProjectData.id);
    }

    if (settings.sfxEnabled) {
      audioSystem.playUISound('event'); // Sound for review screen appearing
    }
  }, [gameState, settings.sfxEnabled, setGameState, showReviewModal, activeProjectReport, pendingDelivery]);


  const handleFinalizeProjectCompletion = useCallback(() => {
    if (!activeProjectReport || finalizingReviewRef.current === activeProjectReport.projectId) {
      traceReviewFlow('finalize-skipped');
      return;
    }
    finalizingReviewRef.current = activeProjectReport.projectId; // repeat clicks cannot settle twice
    traceReviewFlow('finalize', activeProjectReport.projectId);
    console.log('Index.tsx: Finalizing project completion for:', activeProjectReport.projectTitle);
    completeProject(activeProjectReport); // Call the updated completeProject with the report

    // Signed artists' name value raises the quality a debut is placed (and climbs) with.
    const chartQuality = Math.min(100, activeProjectReport.overallQualityScore + artistChartBoost(gameState.signedArtists, activeProjectReport.genre));
    const debut = debutChartRun(activeProjectReport.projectId, activeProjectReport.projectTitle, chartQuality, gameState.currentDay);
    if (debut) {
      setGameState(prev => applyKnowHowEvents({
        ...prev,
        chartRun: [...(prev.chartRun ?? []).filter(e => e.projectId !== debut.projectId), debut],
      }, [{ kind: 'discovery', eventId: `chart-debut:${debut.projectId}`, domain: 'business', label: `a ${debut.chartName} debut` }]).game);
      gameEvents.emit('chart:placement', { chartName: debut.chartName, title: debut.title, position: debut.position });
    }

    // No need to update player XP here, as completeProject now handles all state updates based on the report.
    // Also, checkAndHandleLevelUp from usePlayerProgression should be called after gameState updates,
    // potentially within useGameLogic or triggered by a useEffect watching player XP/level.
    // For now, we assume useProjectManagement's setGameState will trigger necessary downstream effects.

    setShowReviewModal(false);
    setActiveProjectReport(null);

    if (settings.sfxEnabled) {
      audioSystem.playUISound('success'); 
    }
  }, [activeProjectReport, completeProject, settings.sfxEnabled, setGameState, gameState.currentDay, gameState.signedArtists]);

  // Studio Know-How award toast (#66): one place, driven by the pool's lifetime total so save/load never re-fires.
  const lastKnowHowTotal = useRef<number | null>(null);
  useEffect(() => {
    const total = gameState.studioKnowHow?.totalEarned ?? 0;
    const prev = lastKnowHowTotal.current;
    lastKnowHowTotal.current = total;
    if (prev !== null && total > prev) {
      const gained = total - prev;
      // Reuse the shared reward pop-up (#99) instead of a bespoke toast.
      window.dispatchEvent(new CustomEvent<RewardPopDetail>(REWARD_POP_EVENT, {
        detail: { label: `+${gained} Know-How`, tier: gained >= 4 ? 'big' : gained >= 2 ? 'medium' : 'small', tone: 'plain' },
      }));
    }
  }, [gameState.studioKnowHow?.totalEarned]);

  // Weekly chart run: songs on the chart rise and fall, each move gets its own reveal.
  useEffect(() => {
    const run = gameState.chartRun;
    if (!run?.length) return;
    const day = gameState.currentDay;
    if (!run.some(e => weeksDue(e, day) > 0)) return;
    const moves: Array<{ chartName: string; title: string; position: number; previousPosition: number }> = [];
    const next = run.flatMap(entry => {
      let current = entry;
      for (let w = weeksDue(entry, day); w > 0; w--) {
        const update = advanceChartWeek(current, day);
        moves.push({ chartName: current.chartName, title: current.title, position: update.entry.position, previousPosition: update.previousPosition });
        if (update.exited) return [];
        current = update.entry;
      }
      return [current];
    });
    setGameState(prev => ({ ...prev, chartRun: next }));
    // Only reveal the latest move per song so a long day-skip doesn't queue a flood.
    const latest = new Map(moves.map(m => [m.title, m]));
    latest.forEach(m => gameEvents.emit('chart:placement', m));
  }, [gameState.currentDay]); // eslint-disable-line react-hooks/exhaustive-deps


  // Studio Seasons (#63): the season clock resolves once per season; legacy saves get state lazily.
  useEffect(() => {
    announceAwards(applySeasonTick(gameState).resolutions);
    setGameState(prev => {
      const { state, resolutions } = applySeasonTick(prev);
      return resolutions.length || !prev.studioSeasons ? state : prev;
    });
  }, [gameState.currentDay]); // eslint-disable-line react-hooks/exhaustive-deps

  // Advance-day path uses the same review/settlement flow as manual work:
  // if the auto work session finished the project, show the real report modal.
  const handleAdvanceDayWithReview = useCallback(() => {
    const result = advanceDay();
    if (result?.isComplete && result.finalProjectData) {
      console.log('Index.tsx: Advance-day work completed project, showing review:', result.finalProjectData.title);
      handleShowProjectReview(result.finalProjectData);
    }
  }, [advanceDay, handleShowProjectReview]);


  const handleLoadGame = async (): Promise<boolean> => {
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
        return true;
      } else {
        setShowSplashScreen(true);
        setGameInitialized(false);
        return false;
      }
    } catch (error) {
      console.error('Failed to load game:', error);
      setShowSplashScreen(true);
      setGameInitialized(false);
      return false;
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

  // Autosave only ticked every 30s, so closing or backgrounding the tab (the normal way
  // to leave on mobile) lost the latest day/settlement. Save on hide and on each new day.
  const latestStateRef = useRef(gameState);
  latestStateRef.current = gameState;
  useEffect(() => {
    if (!gameInitialized || !settings.autoSave) return;
    const flush = () => saveGame(latestStateRef.current);
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
    };
  }, [gameInitialized, settings.autoSave, saveGame]);

  useEffect(() => {
    if (gameInitialized && settings.autoSave) saveGame(latestStateRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameInitialized, gameState.currentDay]);

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
      !pendingDelivery &&
      !showReviewModal
    ) {
      handleShowProjectReview(project);
    }
  }, [
    gameInitialized,
    gameState.activeProject,
    offlineSummary,
    activeProjectReport,
    pendingDelivery,
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
    return (
      <div className="studio-boot-gate" role="status" aria-live="polite" aria-busy="true">
        <span className="studio-boot-gate-mark">RST</span>
        <p className="studio-boot-gate-title">Warming up the studio…</p>
        <div className="studio-boot-skeleton" aria-hidden="true">
          <span /><span /><span />
        </div>
        <div className="studio-boot-progress" aria-hidden="true"><i /></div>
      </div>
    );
  }

  return (
    <GameLayout eraId={gameState.currentEra} cityId={gameState.cityId}>
      <StudioClockProvider
        currentDay={gameState.currentDay}
        difficulty={settings.difficulty}
        active={
          gameInitialized &&
          !showSplashScreen &&
          !effectiveCompactStudioMode &&
          settings.tutorialCompleted &&
          !showPauseMenu &&
          !(storyPresenter || offlineSummary || pendingDelivery || showReviewModal || showTrainingModal || showSettingsModal || (showStorylineBranchModal && pendingStorylineBranch))
        }
        onDayComplete={handleAdvanceDayWithReview}
      >
      {!effectiveCompactStudioMode && <RewardFlights gameState={gameState} />}
      <ChartRevealScene playerLevel={gameState.playerData.level} />
      <SeasonAwardsCeremony />
      <div className="flex flex-col h-full">
        {!effectiveCompactStudioMode && (
          <GameHeader 
            gameState={gameState} 
            onOpenSettings={handleOpenSettings}
            onPause={() => {
              setShowPauseMenu(true);
              if (settings.sfxEnabled) void audioSystem.playUISound('menuOpen');
            }}
            onCenterCamera={() => {
              setStudioCameraReset(value => value + 1);
              if (settings.sfxEnabled) audioSystem.playUISound('buttonClick');
            }}
            onAdvanceDay={handleAdvanceDayWithReview}
            triggerEraTransition={triggerEraTransition}
            className="grid-area-header"
          />
        )}
        <TutorialModal
          isOpen={!settings.tutorialCompleted && !effectiveCompactStudioMode && !offlineSummary}
          onComplete={handleTutorialComplete}
          gameState={gameState}
        />
        <div className="flex-grow min-h-0">
          <MainGameContent
            cameraResetKey={studioCameraReset}
            inputBlocked={Boolean(showPauseMenu || storyPresenter || offlineSummary || pendingDelivery || showReviewModal || showTrainingModal || showSettingsModal || (showStorylineBranchModal && pendingStorylineBranch) )}
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
            compactStudioMode={effectiveCompactStudioMode}
            setCompactStudioMode={setCompactStudioMode}
            onOpenStorylineBranch={() => setShowStorylineBranchModal(true)}
            onOpenStoryEvent={() => setDeferredStoryEventKey(null)}
            onHistoricalNewsOpenChange={setHistoricalNewsOpen}
            desktopStripEnabled={desktopStripEnabled}
          />
        </div>
      </div>

      <WelcomeBackSummaryModal
        summary={offlineSummary}
        onClose={() => setOfflineSummary(null)}
      />

      <TrainingModal
        isOpen={showTrainingModal && !effectiveCompactStudioMode && !offlineSummary}
        onClose={() => {
          setShowTrainingModal(false);
          setSelectedStaffForTraining(null);
        }}
        staff={selectedStaffForTraining}
        gameState={gameState}
        sendStaffToTraining={sendStaffToTraining}
      />

      <SettingsModal
        isOpen={showSettingsModal && !effectiveCompactStudioMode}
        onClose={() => setShowSettingsModal(false)}
        onResetGame={resetGame} // Pass resetGame from useSaveSystem
        context="ingame" // Explicitly set context for in-game settings
        onLoadGameStateFromString={handleLoadGameStateFromString} // Pass the new handler
      />

      <PauseMenuModal
        isOpen={showPauseMenu && !effectiveCompactStudioMode}
        gameState={gameState}
        onClose={() => {
          setShowPauseMenu(false);
          if (settings.sfxEnabled) void audioSystem.playUISound('menuClose');
        }}
        onOpenSettings={() => {
          setShowPauseMenu(false);
          setShowSettingsModal(true);
        }}
        onQuitToTitle={() => {
          setShowPauseMenu(false);
          setShowSplashScreen(true);
        }}
      />



      {!effectiveCompactStudioMode && (
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
      {pendingDelivery && (
        <DeliveryChoiceDialog
          issues={pendingDelivery.issues}
          payout={pendingDelivery.report.moneyGained}
          revisionAllowance={deliveryAllowance(pendingDelivery.projectId)}
          onChoose={(decision) => {
            const adjusted = applyDeliveryDecision(pendingDelivery.report, pendingDelivery.issues, decision, pendingDelivery.projectId, deliveryAllowance(pendingDelivery.projectId));
            setPendingDelivery(null);
            setActiveProjectReport(adjusted);
            setShowReviewModal(true);
          }}
        />
      )}
      {/* New Project Review Modal */}
      {activeProjectReport && (
        <ProjectReviewModal
          isOpen={showReviewModal}
          onClose={handleFinalizeProjectCompletion} // Finalizes completion when modal is closed
          report={activeProjectReport}
          saveSeed={gameState.saveSeed}
          seasonNote={(() => {
            const p = [gameState.activeProject, ...(gameState.activeProjects ?? [])].find(x => x?.id === activeProjectReport.projectId);
            const rel = p?.clientId ? gameState.clientRelationships?.[p.clientId] : undefined;
            return seasonReviewNote(gameState, {
              genre: p?.genre,
              quality: activeProjectReport.overallQualityScore,
              isRepeat: (rel?.sessionsCompleted ?? 0) > 0,
              clientName: p?.clientName,
            });
          })()}
        />
      )}

      <StorylineBranchModal
        isOpen={
          showStorylineBranchModal &&
          !effectiveCompactStudioMode &&
          !offlineSummary &&
          !showReviewModal &&
          !historicalNewsOpen &&
          Boolean(pendingStorylineBranch)
        }
        node={pendingStorylineBranch?.node ?? null}
        onChoose={handleStorylineBranchChoice}
        onClose={() => setShowStorylineBranchModal(false)}
      />

      <StoryEventModal
        event={pendingStoryEvent}
        gameState={gameState}
        open={
          gameInitialized &&
          !showSplashScreen &&
          !effectiveCompactStudioMode &&
          !offlineSummary &&
          !showReviewModal &&
          !showStorylineBranchModal &&
          !historicalNewsOpen &&
          settings.tutorialCompleted &&
          pendingStoryEventKey !== null &&
          pendingStoryEventKey !== deferredStoryEventKey
        }
        onChoose={handleStoryEventChoice}
        onDeferred={() => setDeferredStoryEventKey(pendingStoryEventKey)}
        onDone={() => setDeferredStoryEventKey(null)}
      />

      <DayCloseBanner
        beat={gameInitialized && !showSplashScreen ? getDayCloseBeat(gameState) : null}
        suppressed={
          storyEventOpen ||
          historicalNewsOpen ||
          showReviewModal ||
          Boolean(offlineSummary) ||
          (showStorylineBranchModal && Boolean(pendingStorylineBranch))
        }
      />

      <DirectorEventModal
        event={pendingStoryEvent ? null : pendingDirectorEvent}
        open={
          gameInitialized &&
          !showSplashScreen &&
          !effectiveCompactStudioMode &&
          !offlineSummary &&
          !showReviewModal &&
          !showStorylineBranchModal &&
          !historicalNewsOpen &&
          settings.tutorialCompleted &&
          !pendingStoryEvent &&
          pendingStoryEventKey !== null &&
          pendingStoryEventKey !== deferredStoryEventKey
        }
        onChoose={handleDirectorEventChoice}
        onDeferred={() => setDeferredStoryEventKey(pendingStoryEventKey)}
        onDone={() => setDeferredStoryEventKey(null)}
      />

      {showEpilogue && campaignEnding && (
        <CinematicStoryCutscene
          payload={buildEndingCutscene(campaignEnding)}
          onComplete={() => setGameState((prev) => ({ ...prev, endingSeen: true }))}
        />
      )}

      {showMoveIn && moveBeat && (
        <CinematicStoryCutscene
          payload={buildMoveInCutscene(moveBeat)}
          onComplete={() => setGameState((prev) => clearPremisesMoveBeat(prev))}
        />
      )}

      {showActIntro && activeCampaignNode && actIntroFlag && (
        <CinematicStoryCutscene
          payload={buildActIntroCutscene(activeCampaignNode, gameState.playerData.playstyle)}
          onComplete={() =>
            setGameState((prev) =>
              prev.storylineState
                ? {
                    ...prev,
                    storylineState: {
                      ...prev.storylineState,
                      storyFlags: { ...prev.storylineState.storyFlags, [actIntroFlag]: true },
                    },
                  }
                : prev,
            )
          }
        />
      )}
      </StudioClockProvider>
    </GameLayout>
  );
};

export default MusicStudioTycoon;
