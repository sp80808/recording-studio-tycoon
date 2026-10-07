import { ActiveProject } from './ActiveProject';
import { useFeatureFlag } from '@/stores/featureFlagStore';
import { useArtistContracts } from '@/hooks/useArtistContracts';
import { telemetry } from '@/telemetry/sink';
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ContextDrawer, type ContextDrawerTab } from './ContextDrawer';
import { MotionNumber, MotionButton } from '@/components/motion/primitives';
import { Headphones, Phone, SlidersHorizontal, Sparkles, Users, Disc3, Trophy, Minimize2, Moon, Package } from 'lucide-react';
import { GameState, StaffMember, PlayerAttributes, Project, SessionIntervention } from '@/types/game';
import { ProjectList } from './ProjectList';
import { ProgressiveProjectInterface } from './ProgressiveProjectInterface';
import { togglePinnedMoment } from '@/utils/careerChronicle';
import { CareerHub } from './CareerHub';
import HouseStylePanel from '@/components/HouseStylePanel';
import StudioCustomizationPanel from '@/components/StudioCustomizationPanel';
import ClientCareerPanel from '@/components/ClientCareerPanel';
import CityLorePanel from '@/components/CityLorePanel';
import { KnowHowPanel } from './KnowHowPanel';
import { ConceptCodexPanel } from './ConceptCodexPanel';
import { createInitialKnowHow, unlockCapability } from '@/rpg/studioKnowHow';
import { chooseFocus } from '@/rpg/studioSeasons';
import { AttributesModal } from './modals/AttributesModal';
import { RightPanel } from './RightPanel';
import { StudioRoom } from './StudioRoom';
import { SessionBeatBanner } from './studio/SessionBeatBanner';
import { SessionRail } from './SessionRail';
import { StudioStrip } from './StudioStrip';
import { EraTransitionAnimation } from './EraTransitionAnimation';
import { HistoricalNewsModal } from './HistoricalNewsModal';
import { FeatureBoundary } from './FeatureBoundary';
import { checkForNewEvents, applyEventEffects, HistoricalEvent } from '@/utils/historicalEvents';
import { useBandManagement } from '@/hooks/useBandManagement';
import { GamepadNavProvider, DockTabId } from '@/contexts/GamepadNavContext';
import { useStudioHotkeys, type HotkeyBinding } from '@/hooks/useStudioHotkeys';
import { ShortcutsOverlay } from './ShortcutsOverlay';
import { GamepadHUD } from '@/components/ui/GamepadHUD';
import { GamepadGlyph } from '@/components/ui/GamepadGlyph';
import { RadialActionWheel } from '@/components/ui/RadialActionWheel';
import { useGamepad } from '@/hooks/useGamepad';
import { useSettings } from '@/contexts/settings-context-types';
import { FlightCaseDepot } from './FlightCaseDepot';
import { executeStudioChore, createInitialChoreState, getChoreDurationMs, findPendingChoreForHotspot, type StudioChoreId } from '@/simulation/choreEngine';
import { isFlightCaseSystemUnlocked } from '@/economy/flightCaseEconomy';
import { toast } from '@/hooks/use-toast';
import { gameAudio } from '@/utils/audioSystem';
import { hasPlayedAnySession } from '@/utils/careerNextAction';
import './studio-play.css';

interface MainGameContentProps {
  gameState: GameState;
  inputBlocked?: boolean;
  cameraResetKey?: number;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  // focusAllocation: FocusAllocation; // REMOVED
  // setFocusAllocation: React.Dispatch<React.SetStateAction<FocusAllocation>>; // REMOVED
  startProject: (project: Project) => void;
  performDailyWork: (options?: import('@/hooks/useStageWork').PerformDailyWorkOptions) => { isComplete: boolean; finalProjectData?: Project } | undefined;
  onProjectComplete?: (completedProject: Project) => void;
  onMinigameReward: (creativityBonus: number, technicalBonus: number, xpBonus: number, minigameType?: string, rawScore?: number, opportunityId?: string) => void;
  spendPerkPoint: (attribute: keyof PlayerAttributes) => void;
  advanceDay: () => void;
  purchaseEquipment: (equipmentId: string) => void;
  hireStaff: (candidateIndex: number) => boolean;
  refreshCandidates: (channelId?: import('@/rpg/recruitment').RecruitmentChannelId) => void;
  assignStaffToProject: (staffId: string) => void;
  unassignStaffFromProject: (staffId: string) => void;
  toggleStaffRest: (staffId: string) => void;
  openTrainingModal: (staff: StaffMember) => boolean;
  orbContainerRef: React.RefObject<HTMLDivElement>;
  contactArtist: (artistId: string, offer: number) => void;
  triggerEraTransition: () => { fromEra?: string; toEra?: string } | void;
  autoTriggeredMinigame: SessionIntervention | null;
  clearAutoTriggeredMinigame: () => void;
  startResearchMod?: (staffId: string, modId: string) => boolean;
  /** Cooldown/cost-gated gig refresh (bead goj.3). */
  refreshProjects?: () => boolean;
  compactStudioMode: boolean;
  setCompactStudioMode: React.Dispatch<React.SetStateAction<boolean>>;
  /** Open StorylineBranchModal when a pending Act choice exists. */
  onOpenStorylineBranch?: () => void;
  onOpenStoryEvent?: () => void;
  /** Lets the page hold story popups back while a news popup is on screen. */
  onHistoricalNewsOpenChange?: (open: boolean) => void;
  /** zel.6: Tauri + feature-flag gate; when false, strip entry is hidden and compact is ignored. */
  desktopStripEnabled: boolean;
}


type Panel = 'bookings' | 'session' | 'studio' | 'career' | 'cases';

/** Floor footer order (issue #151): Gear lives inside Room; Artists and Charts open from Career. */
const FOOTER_TABS: DockTabId[] = ['bookings', 'session', 'crew', 'gear', 'career'];

const DOCK_LABELS: Record<DockTabId, string> = {
  bookings: 'Artist',
  session: 'Session',
  gear: 'Room',
  crew: 'Crew',
  bands: 'Artists',
  charts: 'Charts',
  career: 'Career',
};
export const MainGameContent: React.FC<MainGameContentProps> = ({
  gameState,
  inputBlocked = false,
  cameraResetKey = 0,
  setGameState,
  // focusAllocation, // REMOVED
  // setFocusAllocation, // REMOVED
  startProject,
  performDailyWork,
  onProjectComplete,
  onMinigameReward,
  spendPerkPoint,
  advanceDay,
  purchaseEquipment,
  hireStaff,
  refreshCandidates,
  assignStaffToProject,
  unassignStaffFromProject,
  toggleStaffRest,
  openTrainingModal,
  orbContainerRef,
  contactArtist,
  triggerEraTransition,
  autoTriggeredMinigame,
  clearAutoTriggeredMinigame,
  onOpenStorylineBranch,
  onOpenStoryEvent,
  onHistoricalNewsOpenChange,
  startResearchMod,
  refreshProjects,
  compactStudioMode,
  setCompactStudioMode,
  desktopStripEnabled
}) => {
  const { t } = useTranslation();

  const [panel, setPanel] = useState<Panel | null>(null);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [lockedHotspot, setLockedHotspot] = useState<import('@/components/WebGLCanvas').StudioHotspotId | null>(null);
  const [interventionFocused, setInterventionFocused] = useState(false);
  useEffect(() => { if (interventionFocused && !autoTriggeredMinigame) { setConsoleOpen(false); setInterventionFocused(false); } }, [interventionFocused, autoTriggeredMinigame]);
  const worldConsoleEnabled = useFeatureFlag('world-session-controls');
  const useWorldConsole = worldConsoleEnabled && !compactStudioMode && (gameState.activeProjects?.length ?? 0) <= 1;
  useEffect(() => { if (!useWorldConsole) setConsoleOpen(false); }, [useWorldConsole]);
  // Studio floor + GUI reveal together: hold a lightweight loading veil until
  // the Pixi canvas paints its first frame (with a timeout fallback).
  const [studioReady, setStudioReady] = useState(false);
  useEffect(() => {
    if (studioReady) return;
    const t = window.setTimeout(() => setStudioReady(true), 6000);
    return () => window.clearTimeout(t);
  }, [studioReady]);
  const handleStudioReady = useCallback(() => setStudioReady(true), []);
  const [showAttributesModal, setShowAttributesModal] = useState(false);
  const [showEraTransition, setShowEraTransition] = useState(false);
  const [eraTransitionInfo, setEraTransitionInfo] = useState<{ fromEra: string; toEra: string } | null>(null);
  const [showHistoricalNews, setShowHistoricalNews] = useState(false);
  const [currentHistoricalEvent, setCurrentHistoricalEvent] = useState<HistoricalEvent | null>(null);
  useEffect(() => {
    onHistoricalNewsOpenChange?.(showHistoricalNews && Boolean(currentHistoricalEvent));
    return () => onHistoricalNewsOpenChange?.(false);
  }, [showHistoricalNews, currentHistoricalEvent, onHistoricalNewsOpenChange]);
  const [lastCheckedDay, setLastCheckedDay] = useState(0);
  const [dashboardTab, setDashboardTab] = useState<'studio' | 'skills' | 'bands' | 'charts' | 'staff'>('studio');
  const [activeChoreId, setActiveChoreId] = useState<StudioChoreId | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousProjectId = useRef(gameState.activeProject?.id);
  const openPanel = useCallback((next: Panel) => {
    setInterventionFocused(false);
    if (next === 'session' && gameState.activeProject && useWorldConsole) {
      setConsoleOpen(true);
      setPanel(null);
      return;
    }
    setConsoleOpen(false);
    if (!panel) returnFocusRef.current = document.activeElement as HTMLElement;
    setPanel(next);
    if (next) telemetry.capture('management_panel_opened', gameState.currentDay, { destination: next });
  }, [gameState.activeProject, gameState.currentDay, useWorldConsole, panel]);
  const bookProject = (project: Project) => {
    startProject(project);
    // Post-book handoff (#357): do not gate on stale activeProject (still null this tick).
    if (useWorldConsole) {
      setConsoleOpen(true);
      setPanel(null);
    } else {
      setPanel('session');
    }
  };
  const handleBookingsBooked = useCallback(() => {
    if (useWorldConsole) {
      setConsoleOpen(true);
      setPanel(null);
    } else {
      setPanel('session');
    }
  }, [useWorldConsole]);
  const handleOpenDashboardTab = useCallback((tab: typeof dashboardTab) => {
    setDashboardTab(tab);
    openPanel('studio');
  }, [openPanel]);

  const { settings } = useSettings();
  const [showRadialWheel, setShowRadialWheel] = useState(false);
  const [radialHoldMode, setRadialHoldMode] = useState(false);
  const gamepad = useGamepad({
    preferredLayout: settings?.controllerLayout,
    hapticsEnabled: settings?.gamepadHaptics,
  });

  const handleDockTabChange = useCallback((tab: DockTabId) => {
    switch (tab) {
      case 'bookings':
        openPanel('bookings');
        break;
      case 'session':
        openPanel('session');
        break;
      case 'gear':
        handleOpenDashboardTab('studio');
        break;
      case 'crew':
        handleOpenDashboardTab('staff');
        break;
      case 'bands':
        handleOpenDashboardTab('bands');
        break;
      case 'charts':
        handleOpenDashboardTab('charts');
        break;
      case 'career':
        openPanel('career');
        break;
    }
  }, [openPanel, handleOpenDashboardTab]);

  const [showShortcuts, setShowShortcuts] = useState(false);
  const hotkeyBindings = useMemo<HotkeyBinding[]>(
    () => [
      ...FOOTER_TABS.map((id, index) => ({
        key: String(index + 1),
        label: DOCK_LABELS[id],
        description: `Open ${DOCK_LABELS[id]}`,
        run: () => handleDockTabChange(id),
      })),
      { key: '?', label: 'Shortcuts', description: 'Show this list', run: () => setShowShortcuts(true) },
    ],
    [handleDockTabChange],
  );
  // The console tab hosts keyboard-driven minigames, so number keys stand down there.
  useStudioHotkeys(hotkeyBindings, !inputBlocked && !consoleOpen && panel !== 'session' && !(compactStudioMode && desktopStripEnabled));

  const handleRadialSelect = useCallback((sliceId: string) => {
    switch (sliceId) {
      case 'bookings':
        openPanel('bookings');
        break;
      case 'session':
        openPanel('session');
        break;
      case 'gear':
        handleOpenDashboardTab('studio');
        break;
      case 'crew':
        handleOpenDashboardTab('staff');
        break;
      case 'bands':
        handleOpenDashboardTab('bands');
        break;
      case 'charts':
        handleOpenDashboardTab('charts');
        break;
      case 'career':
        openPanel('career');
        break;
      case 'settings':
        setShowRadialWheel(false);
        break;
    }
  }, [openPanel, handleOpenDashboardTab]);

  // LT opens a hold-to-select radial wheel; Select/View keeps a toggle fallback.
  // R3 is reserved for the studio-floor camera recenter action.
  useEffect(() => {
    if (!gamepad.isConnected || inputBlocked || consoleOpen) return;

    if (gamepad.justPressed.lt && !panel) {
      setRadialHoldMode(true);
      setShowRadialWheel(true);
      gamepad.triggerHaptic(0.2, 0.3, 50);
      return;
    }

    if (gamepad.justPressed.select && !panel) {
      setRadialHoldMode(false);
      setShowRadialWheel((prev) => !prev);
      gamepad.triggerHaptic(0.2, 0.3, 50);
    }
  }, [gamepad.isConnected, gamepad.justPressed.select, gamepad.justPressed.lt, panel, inputBlocked, consoleOpen]);

  // Controller B button closes active panel
  useEffect(() => {
    if (!gamepad.isConnected || !panel || inputBlocked) return;
    if (gamepad.justPressed.east) {
      setPanel(null);
      gamepad.triggerHaptic(0.1, 0.2, 40);
    }
  }, [gamepad.isConnected, gamepad.justPressed.east, panel, inputBlocked]);

  // Controller Y button advances day when session is open & out of capacity or in studio
  useEffect(() => {
    if (!gamepad.isConnected || inputBlocked || consoleOpen) return;
    if (gamepad.justPressed.north) {
      if (gameState.playerData.dailyWorkCapacity <= 0 || panel === null) {
        advanceDay();
        gamepad.triggerHaptic(0.3, 0.4, 80);
      }
    }
  }, [gamepad.isConnected, gamepad.justPressed.north, gameState.playerData.dailyWorkCapacity, panel, advanceDay, inputBlocked, consoleOpen]);

  useEffect(() => {
    if (autoTriggeredMinigame && !useWorldConsole) setPanel('session');
  }, [autoTriggeredMinigame, useWorldConsole]);

  useEffect(() => {
    if (panel) headingRef.current?.focus();
  }, [panel]);

  useEffect(() => {
    if (previousProjectId.current && !gameState.activeProject && panel === 'session') setPanel(null);
    previousProjectId.current = gameState.activeProject?.id;
  }, [gameState.activeProject, panel]);

  // Check for new historical events when day advances
  useEffect(() => {
    const newEvents = checkForNewEvents(gameState, lastCheckedDay);
    if (newEvents.length > 0) {
      // Show the first new event
      const event = newEvents[0];
      setCurrentHistoricalEvent(event);
      setShowHistoricalNews(true);
      
      // Apply event effects
      const updatedGameState = applyEventEffects(event, gameState);
      setGameState(updatedGameState);
      
      // Update last checked day
      setLastCheckedDay(gameState.currentDay);
    }
  }, [gameState, lastCheckedDay, setGameState]);

  // Enhanced era transition handler
  const handleEraTransition = () => {
    const result = triggerEraTransition();
    if (result && result.fromEra && result.toEra) {
      setEraTransitionInfo({ fromEra: result.fromEra, toEra: result.toEra });
      setShowEraTransition(true);
    }
  };

  // Band Management Integration
  const { makeOffer, signContract, passOnProspect } = useArtistContracts(gameState, setGameState);
  const { createBand, startTour, playShow, createOriginalTrack } = useBandManagement(gameState, setGameState);



  useEffect(() => {
    if (!consoleOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setConsoleOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [consoleOpen]);

  if (compactStudioMode && desktopStripEnabled) {
    return <div className="h-full flex items-end"><StudioStrip gameState={gameState}
      onExpand={() => setCompactStudioMode(false)}
      onBookNextEnquiry={() => { const next = gameState.availableProjects[0]; if (next) startProject(next); }} /></div>;
  }

  const project = gameState.activeProject;
  const sessionLabel = project?.awaitingReview ? t('session_collect_release') : project ? t('session_continue') : hasPlayedAnySession(gameState) ? t('session_book_next') : t('session_book_first');
  const completeFloorChore = (hotspot: string) => {
    if (activeChoreId) return true;
    const choreState = gameState.choreState || createInitialChoreState();
    const chore = findPendingChoreForHotspot(choreState, hotspot);
    if (!chore) return false;

    if (gameState.playerData.dailyWorkCapacity < chore.energyCost) {
      toast({
        title: 'Not enough energy',
        description: `${chore.title} needs ${chore.energyCost}⚡ — rest or advance the day.`,
        variant: 'destructive',
      });
      return false;
    }

    setActiveChoreId(chore.id);
    void gameAudio.playGearSwitch();
    toast({
      title: `Working: ${chore.title}`,
      description: chore.description,
      className: 'bg-stone-900 border border-stone-700 text-white',
    });

    const duration = getChoreDurationMs(chore, gameState.currentEra, gameState.ownedEquipment.length);
    window.setTimeout(() => {
      setGameState(prev => {
        const result = executeStudioChore(
          prev.choreState || createInitialChoreState(),
          chore.id,
          prev.playerData.dailyWorkCapacity
        );
        if (!result) return prev;
        const allDone = Object.values(result.nextChoreState.chores).every((c) => c.completed);
        window.setTimeout(() => {
          if (allDone) {
            toast({
              title: 'All daily duties complete',
              description: 'Studio is in peak condition — session buffs locked in.',
              className: 'bg-emerald-950/90 border border-emerald-500 text-white',
            });
          } else {
            toast({
              title: `Done: ${chore.title}`,
              description: `+${result.xpAwarded} XP · buff active for the next session`,
              className: 'bg-stone-900 border border-stone-700 text-white',
            });
          }
        }, 0);
        return {
          ...prev,
          choreState: result.nextChoreState,
          playerData: {
            ...prev.playerData,
            xp: prev.playerData.xp + result.xpAwarded,
            dailyWorkCapacity: Math.max(0, prev.playerData.dailyWorkCapacity - result.energyBurned),
          },
        };
      });
      setActiveChoreId(null);
    }, duration);
    return true;
  };
  const drawerDestination: ContextDrawerTab =
    panel === 'bookings'
      ? 'artist'
      : panel === 'session'
        ? 'session'
        : panel === 'career' || panel === 'cases'
          ? 'career'
          : dashboardTab === 'staff'
            ? 'staff'
            : dashboardTab === 'bands'
              ? 'room'
              : dashboardTab === 'charts'
                ? 'room'
                : 'gear';

  const drawerTitle =
    panel === 'bookings'
      ? t('drawer_bookings')
      : panel === 'session'
        ? t('drawer_session')
        : panel === 'career'
          ? t('drawer_career')
          : panel === 'cases'
            ? t('drawer_cases')
            : dashboardTab === 'staff'
              ? t('drawer_crew')
              : dashboardTab === 'bands'
                ? t('drawer_artists')
                : dashboardTab === 'charts'
                  ? t('drawer_charts')
                  : dashboardTab === 'skills'
                    ? t('drawer_skills')
                    : t('drawer_gear');

  return (
    <GamepadNavProvider enabled={!inputBlocked && !consoleOpen} onTabChange={handleDockTabChange}>
      <div className="studio-play" data-rst-studio="mounted" data-rst-input-blocked={inputBlocked} data-rst-world-controls={useWorldConsole}>
        <div className="studio-play-world" data-reward-source="floor">
          {project && <SessionBeatBanner project={project} intervention={autoTriggeredMinigame} />}
          <StudioRoom gameState={gameState} cameraResetKey={cameraResetKey} onAdvanceDay={advanceDay} onRefreshProjects={refreshProjects}
            onStartProject={bookProject} onAssignStaff={assignStaffToProject} onUnassignStaff={unassignStaffFromProject}
            onOpenDashboardTab={handleOpenDashboardTab} onOpenCases={() => openPanel('cases')} onConsoleFocus={() => openPanel('session')} onCompleteChore={completeFloorChore} activeChoreId={activeChoreId}
            onBookings={() => openPanel('bookings')} onStudioReady={handleStudioReady} floorFocused={panel === null && !consoleOpen && !inputBlocked && !showRadialWheel} lockedHotspot={lockedHotspot} worldControls={useWorldConsole} intervention={autoTriggeredMinigame} onInterventionFocus={() => { setPanel(null); setInterventionFocused(true); setConsoleOpen(true); }} className="studio-play-room" />
          {!studioReady && (
            <div className="studio-room-loading" role="status" aria-live="polite" aria-busy="true">
              <span className="studio-boot-gate-mark">RST</span>
              <p className="studio-boot-gate-title">{t('room_setting_up')}</p>
              <div className="studio-boot-progress" aria-hidden="true"><i /></div>
            </div>
          )}
        </div>
        {project && useWorldConsole && <ActiveProject key={project.id} gameState={gameState} setGameState={setGameState} presentation="world" interventionOnly={interventionFocused} controlsEnabled={consoleOpen && panel === null && !inputBlocked && !showHistoricalNews && !showEraTransition && !showAttributesModal && !showShortcuts && !showRadialWheel} onCloseConsole={() => setConsoleOpen(false)} onRest={advanceDay} performDailyWork={performDailyWork} onMinigameReward={onMinigameReward} onProjectComplete={onProjectComplete} autoTriggeredMinigame={autoTriggeredMinigame} clearAutoTriggeredMinigame={clearAutoTriggeredMinigame} onLockHotspot={setLockedHotspot} />}
        <SessionRail
          gameState={gameState}
          onOpenSession={() => openPanel('session')}
          onOpenBookings={() => openPanel('bookings')}
        />
        <div className="studio-play-actions">
          <button hidden={consoleOpen && useWorldConsole} className="studio-primary-action" data-rst-surface="contextual" data-rst-action-id={project ? 'dock:open-session' : 'dock:open-bookings'} onClick={() => openPanel(project ? 'session' : 'bookings')}>
            {gamepad.lastInputType === 'gamepad' && <GamepadGlyph button="south" size="xs" className="mr-1 inline-block" />}
            {project ? <Headphones size={20} /> : <Phone size={20} />}
            <span>{sessionLabel}</span>
            {!project && gameState.availableProjects.length > 0 && (
              <span className="studio-primary-badge" data-testid="primary-waiting-badge">{t('home_n_waiting', { count: gameState.availableProjects.length })}</span>
            )}
            <span aria-hidden="true">→</span>
          </button>
        <nav aria-label="Studio activities" className="studio-command-dock">
          {([
            ['bookings', Phone, t('nav_artist'), () => openPanel('bookings')],
            ['session', Headphones, t('nav_session'), () => openPanel('session')],
            ['crew', Users, t('nav_crew'), () => handleOpenDashboardTab('staff')],
            ['gear', SlidersHorizontal, t('nav_room'), () => handleOpenDashboardTab('studio')],
            ['career', Sparkles, t('nav_career'), () => openPanel('career')],
          ] as const).map(([id, Icon, label, action], dockIndex) => (
            <button key={id} data-rst-surface="contextual" data-rst-action-id={`dock:open-${id}`} onClick={action} className="studio-dock-button" title={`${label} (${dockIndex + 1})`} aria-label={label} aria-keyshortcuts={String(dockIndex + 1)}>
              <Icon size={21} aria-hidden="true" /><span>{label}</span>
              {id === 'bookings' && gameState.availableProjects.length > 0 && (
                <i className="studio-dock-badge"><MotionNumber value={gameState.availableProjects.length} /></i>
              )}
              {id === 'career' && gameState.playerData.perkPoints + (isFlightCaseSystemUnlocked(gameState) ? (gameState.pendingCrates?.length ?? 0) : 0) > 0 && (
                <i className="studio-dock-badge">{gameState.playerData.perkPoints + (isFlightCaseSystemUnlocked(gameState) ? (gameState.pendingCrates?.length ?? 0) : 0)}</i>
              )}
            </button>
          ))}
        </nav>
      </div>

      <ShortcutsOverlay open={showShortcuts} onOpenChange={setShowShortcuts} bindings={hotkeyBindings} />

      <ContextDrawer
        isOpen={panel !== null}
        onClose={() => setPanel(null)}
        activeTab={drawerDestination}
        destinationKey={panel ? `${panel}:${dashboardTab}` : undefined}
        title={drawerTitle}
        subtitle="RECORDING STUDIO OS"
        width={
          panel === 'session'
            ? 'session'
            : dashboardTab === 'charts'
              ? 'charts'
              : 'default'
        }
        returnFocusRef={returnFocusRef}
        headerActions={
          panel === 'session' && gameState.playerData.dailyWorkCapacity <= 0 && !project?.awaitingReview ? (
            <MotionButton
              className="studio-primary-action ml-auto text-xs py-1 px-2.5"
              onClick={advanceDay}
            >
              <Moon size={14} />
              <span>{t('rest_advance_day')}</span>
            </MotionButton>
          ) : null
        }
      >
        <FeatureBoundary feature={`drawer:${panel ?? 'closed'}:${dashboardTab}`} resetKey={`${panel}:${dashboardTab}`}>
        <div className="flex-1 min-h-0 min-w-0 flex flex-col relative" data-reward-source="activity">
          {panel === 'bookings' && (
            <ProjectList
              gameState={gameState}
              setGameState={setGameState}
              startProject={bookProject}
              onRefreshProjects={refreshProjects}
              onBooked={handleBookingsBooked}
            />
          )}
          {panel === 'session' && (
            <>
              <ProgressiveProjectInterface
                gameState={gameState}
                setGameState={setGameState}
                performDailyWork={performDailyWork}
                onMinigameReward={onMinigameReward}
                onProjectComplete={onProjectComplete}
                autoTriggeredMinigame={autoTriggeredMinigame}
                clearAutoTriggeredMinigame={clearAutoTriggeredMinigame}
                onBookEnquiry={bookProject}
                onOpenBookings={() => openPanel('bookings')}
                onProjectSelect={(project) => {
                  setGameState(prev => ({ ...prev, activeProject: project }));
                  setPanel('session');
                }}
              />
              <div ref={orbContainerRef} className="absolute inset-0 pointer-events-none overflow-hidden" />
            </>
          )}
          {panel === 'studio' && (
            <RightPanel
              requestedTab={dashboardTab}
              gameState={gameState}
              setGameState={setGameState}
              spendPerkPoint={spendPerkPoint}
              purchaseEquipment={purchaseEquipment}
              hireStaff={hireStaff}
              refreshCandidates={refreshCandidates}
              assignStaffToProject={assignStaffToProject}
              unassignStaffFromProject={unassignStaffFromProject}
              toggleStaffRest={toggleStaffRest}
              openTrainingModal={openTrainingModal}
              contactArtist={contactArtist}
              onEraTransition={handleEraTransition}
              createBand={createBand}
              startTour={startTour}
              playShow={playShow}
              artistContracts={{ makeOffer, signContract, passOnProspect }}
              createOriginalTrack={createOriginalTrack}
              startResearchMod={startResearchMod}
            />
          )}
          {panel === 'cases' && (
            <div className="flex-1 min-h-0 w-full flex flex-col overflow-y-auto">
              <FlightCaseDepot gameState={gameState} setGameState={setGameState} />
            </div>
          )}
          {panel === 'career' && (
            <div className="flex-1 min-h-0 w-full flex flex-col overflow-y-auto">
              <CareerHub
                gameState={gameState}
                onTalents={() => setShowAttributesModal(true)}
                onWork={() => openPanel('session')}
                onBookings={() => openPanel('bookings')}
                onRest={advanceDay}
                onStaff={() => handleOpenDashboardTab('staff')}
                onOpenStorylineBranch={onOpenStorylineBranch}
                onOpenStoryEvent={onOpenStoryEvent}
                onChooseSeasonFocus={focus => setGameState(prev => chooseFocus(prev, focus))}
                onTogglePinnedMoment={id => setGameState(prev => togglePinnedMoment(prev, id))}
              />
              <KnowHowPanel
                knowHow={gameState.studioKnowHow}
                onUnlock={id => setGameState(prev => {
                  const next = unlockCapability(prev.studioKnowHow ?? createInitialKnowHow(), id);
                  return next ? { ...prev, studioKnowHow: next } : prev;
                })}
              />
              <ConceptCodexPanel knowHow={gameState.studioKnowHow} />
              <CityLorePanel cityId={gameState.cityId} eraId={gameState.currentEra} />
              <ClientCareerPanel relationships={gameState.clientRelationships} labelInterest={gameState.labelInterest} />
              <HouseStylePanel expertise={gameState.studioExpertise} />
              <StudioCustomizationPanel
                customization={gameState.studioCustomization}
                premisesTier={gameState.premisesTier}
                onChange={next => setGameState(prev => ({ ...prev, studioCustomization: next }))}
              />
              <div className="grid gap-2.5 p-1 pt-3 sm:grid-cols-2">
                <button className="rst-btn" onClick={() => handleOpenDashboardTab('bands')}>
                  <Disc3 size={17} />Artist roster
                </button>
                <button className="rst-btn" onClick={() => handleOpenDashboardTab('charts')}>
                  <Trophy size={17} />Charts
                </button>
                <button className="rst-btn" onClick={() => handleOpenDashboardTab('skills')}>
                  <Sparkles size={17} />Skills & research
                </button>
                <button className="rst-btn" onClick={() => openPanel('cases')}>
                  <Package size={17} />Flight cases
                </button>
                <button className="rst-btn" onClick={advanceDay}>
                  <Moon size={17} />Rest & advance day
                </button>
                {desktopStripEnabled && (
                  <button
                    className="studio-dock-button flex-row gap-2"
                    onClick={() => {
                      setPanel(null);
                      setCompactStudioMode(true);
                    }}
                  >
                    <Minimize2 size={18} />Desktop studio strip
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        </FeatureBoundary>
      </ContextDrawer>
      <AttributesModal isOpen={showAttributesModal} onClose={() => setShowAttributesModal(false)}
        playerData={gameState.playerData} spendPerkPoint={spendPerkPoint} />
      {showEraTransition && eraTransitionInfo && (
        <EraTransitionAnimation
          isVisible={showEraTransition}
          fromEra={eraTransitionInfo.fromEra}
          toEra={eraTransitionInfo.toEra}
          onComplete={() => setShowEraTransition(false)}
        />
      )}
      {currentHistoricalEvent && (
        <HistoricalNewsModal
          isOpen={showHistoricalNews}
          onClose={() => setShowHistoricalNews(false)}
          event={currentHistoricalEvent}
        />
      )}

      <RadialActionWheel
        isOpen={showRadialWheel}
        onSelect={handleRadialSelect}
        selectOnLeftTriggerRelease={radialHoldMode}
        onClose={() => {
          setShowRadialWheel(false);
          setRadialHoldMode(false);
        }}
      />
      <GamepadHUD hasOpenModal={panel !== null} />
    </div>
    </GamepadNavProvider>
  );
};
