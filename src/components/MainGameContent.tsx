import { useArtistContracts } from '@/hooks/useArtistContracts';
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { ContextDrawer, ContextDrawerTab } from './ContextDrawer';
import { MotionNumber, MotionButton } from '@/components/motion/primitives';
import { Headphones, Phone, SlidersHorizontal, Sparkles, Users, Disc3, Trophy, X, Minimize2, Moon, Package } from 'lucide-react';
import { GameState, StaffMember, PlayerAttributes, Project } from '@/types/game';
import { ProjectList } from './ProjectList';
import { ProgressiveProjectInterface } from './ProgressiveProjectInterface';
import { CareerHub } from './CareerHub';
import { KnowHowPanel } from './KnowHowPanel';
import { createInitialKnowHow, unlockCapability } from '@/rpg/studioKnowHow';
import { AttributesModal } from './modals/AttributesModal';
import { RightPanel } from './RightPanel';
import { StudioRoom } from './StudioRoom';
import { StudioStrip } from './StudioStrip';
import { EraTransitionAnimation } from './EraTransitionAnimation';
import { HistoricalNewsModal } from './HistoricalNewsModal';
import { FeatureBoundary } from './FeatureBoundary';
import { checkForNewEvents, applyEventEffects, HistoricalEvent } from '@/utils/historicalEvents';
import { useBandManagement } from '@/hooks/useBandManagement';
import { MinigameType } from './minigames/MinigameManager';
import { GamepadNavProvider, DockTabId, DOCK_TABS } from '@/contexts/GamepadNavContext';
import { useStudioHotkeys, type HotkeyBinding } from '@/hooks/useStudioHotkeys';
import { ShortcutsOverlay } from './ShortcutsOverlay';
import { GamepadHUD } from '@/components/ui/GamepadHUD';
import { GamepadGlyph } from '@/components/ui/GamepadGlyph';
import { RadialActionWheel } from '@/components/ui/RadialActionWheel';
import { useGamepad } from '@/hooks/useGamepad';
import { useSettings } from '@/contexts/settings-context-types';
import { FlightCaseDepot } from './FlightCaseDepot';
import './studio-play.css';

interface MainGameContentProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  // focusAllocation: FocusAllocation; // REMOVED
  // setFocusAllocation: React.Dispatch<React.SetStateAction<FocusAllocation>>; // REMOVED
  startProject: (project: Project) => void;
  performDailyWork: () => { isComplete: boolean; finalProjectData?: Project } | undefined;
  onProjectComplete?: (completedProject: Project) => void;
  onMinigameReward: (creativityBonus: number, technicalBonus: number, xpBonus: number, minigameType?: string) => void;
  spendPerkPoint: (attribute: keyof PlayerAttributes) => void;
  advanceDay: () => void;
  purchaseEquipment: (equipmentId: string) => void;
  hireStaff: (candidateIndex: number) => boolean;
  refreshCandidates: () => void;
  assignStaffToProject: (staffId: string) => void;
  unassignStaffFromProject: (staffId: string) => void;
  toggleStaffRest: (staffId: string) => void;
  openTrainingModal: (staff: StaffMember) => boolean;
  orbContainerRef: React.RefObject<HTMLDivElement>;
  contactArtist: (artistId: string, offer: number) => void;
  triggerEraTransition: () => { fromEra?: string; toEra?: string } | void;
  autoTriggeredMinigame: { type: MinigameType; reason: string } | null;
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

const DOCK_LABELS: Record<DockTabId, string> = {
  bookings: 'Bookings',
  session: 'Session',
  gear: 'Gear',
  crew: 'Crew',
  bands: 'Artists',
  charts: 'Charts',
  career: 'Career',
};
export const MainGameContent: React.FC<MainGameContentProps> = ({
  gameState,
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

  const [panel, setPanel] = useState<Panel | null>(null);
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
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousProjectId = useRef(gameState.activeProject?.id);
  const openPanel = (next: Panel) => {
    if (!panel) returnFocusRef.current = document.activeElement as HTMLElement;
    setPanel(next);
  };
  const bookProject = (project: Project) => {
    startProject(project);
    openPanel('session');
  };
  const handleOpenDashboardTab = (tab: typeof dashboardTab) => {
    setDashboardTab(tab);
    openPanel('studio');
  };

  const { settings } = useSettings();
  const [showRadialWheel, setShowRadialWheel] = useState(false);
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
  }, []);

  const [showShortcuts, setShowShortcuts] = useState(false);
  const hotkeyBindings = useMemo<HotkeyBinding[]>(
    () => [
      ...DOCK_TABS.map((id, index) => ({
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
  useStudioHotkeys(hotkeyBindings, panel !== 'session' && !(compactStudioMode && desktopStripEnabled));

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
  }, []);

  // Quick radial wheel toggle on R3 or Left Trigger held when on floor
  useEffect(() => {
    if (!gamepad.isConnected) return;
    if (gamepad.justPressed.rs || (gamepad.justPressed.lt && !panel)) {
      setShowRadialWheel((prev) => !prev);
      gamepad.triggerHaptic(0.2, 0.3, 50);
    }
  }, [gamepad.isConnected, gamepad.justPressed.rs, gamepad.justPressed.lt, panel]);

  // Controller B button closes active panel
  useEffect(() => {
    if (!gamepad.isConnected || !panel) return;
    if (gamepad.justPressed.east) {
      setPanel(null);
      gamepad.triggerHaptic(0.1, 0.2, 40);
    }
  }, [gamepad.isConnected, gamepad.justPressed.east, panel]);

  // Controller Y button advances day when session is open & out of capacity or in studio
  useEffect(() => {
    if (!gamepad.isConnected) return;
    if (gamepad.justPressed.north) {
      if (gameState.playerData.dailyWorkCapacity <= 0 || panel === null) {
        advanceDay();
        gamepad.triggerHaptic(0.3, 0.4, 80);
      }
    }
  }, [gamepad.isConnected, gamepad.justPressed.north, gameState.playerData.dailyWorkCapacity, panel, advanceDay]);

  useEffect(() => {
    if (autoTriggeredMinigame) setPanel('session');
  }, [autoTriggeredMinigame]);

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



  if (compactStudioMode && desktopStripEnabled) {
    return <div className="h-full flex items-end"><StudioStrip gameState={gameState}
      onExpand={() => setCompactStudioMode(false)}
      onBookNextEnquiry={() => { const next = gameState.availableProjects[0]; if (next) startProject(next); }} /></div>;
  }

  const project = gameState.activeProject;
  const sessionLabel = project?.awaitingReview ? 'Collect release' : project ? 'Continue session' : 'Book your first session';
  const titles = { bookings: 'Bookings', session: 'At the console', studio: 'Studio management', career: 'Your producer story' };
  return (
    <GamepadNavProvider onTabChange={handleDockTabChange}>
      <div className="studio-play">
        <div className="studio-play-world" data-reward-source="floor">
          <StudioRoom gameState={gameState} onAdvanceDay={advanceDay} onRefreshProjects={refreshProjects}
            onStartProject={bookProject} onAssignStaff={assignStaffToProject} onUnassignStaff={unassignStaffFromProject}
            onOpenDashboardTab={handleOpenDashboardTab} onConsoleFocus={() => openPanel('session')}
            onBookings={() => openPanel('bookings')} className="studio-play-room" />
        </div>
        <div className="studio-play-status">
          <span className="studio-live-light" aria-hidden="true" />
          <span className="min-w-0 truncate">{project ? project.title : 'Your studio. Your next great record.'}</span>
          <span className="shrink-0 text-amber-200">{gameState.playerData.dailyWorkCapacity} sessions left</span>
          {(gameState.gems ?? 0) > 0 && <span className="shrink-0 text-cyan-300" aria-label={`${gameState.gems} gems`}>💎 {gameState.gems}</span>}
        </div>
        <div className="studio-play-actions">
          <button className="studio-primary-action" onClick={() => openPanel(project ? 'session' : 'bookings')}>
            {gamepad.lastInputType === 'gamepad' && <GamepadGlyph button="south" size="xs" className="mr-1 inline-block" />}
            {project ? <Headphones size={20} /> : <Phone size={20} />}
            <span>{sessionLabel}</span><span aria-hidden="true">→</span>
          </button>
        <nav aria-label="Studio activities" className="studio-command-dock">
          {([
            ['bookings', Phone, 'Bookings', () => openPanel('bookings')],
            ['session', Headphones, 'Session', () => openPanel('session')],
            ['gear', SlidersHorizontal, 'Gear', () => handleOpenDashboardTab('studio')],
            ['crew', Users, 'Crew', () => handleOpenDashboardTab('staff')],
            ['bands', Disc3, 'Artists', () => handleOpenDashboardTab('bands')],
            ['charts', Trophy, 'Charts', () => handleOpenDashboardTab('charts')],
            ['career', Sparkles, 'Career', () => openPanel('career')],
          ] as const).map(([id, Icon, label, action], dockIndex) => (
            <button key={id} onClick={action} className="studio-dock-button" title={`${label} (${dockIndex + 1})`} aria-label={label} aria-keyshortcuts={String(dockIndex + 1)}>
              <Icon size={21} aria-hidden="true" /><span>{label}</span>
              {id === 'bookings' && gameState.availableProjects.length > 0 && (
                <i className="studio-dock-badge"><MotionNumber value={gameState.availableProjects.length} /></i>
              )}
              {id === 'career' && gameState.playerData.perkPoints + (gameState.pendingCrates?.length ?? 0) > 0 && (
                <i className="studio-dock-badge">{gameState.playerData.perkPoints + (gameState.pendingCrates?.length ?? 0)}</i>
              )}
            </button>
          ))}
        </nav>
      </div>

      <ShortcutsOverlay open={showShortcuts} onOpenChange={setShowShortcuts} bindings={hotkeyBindings} />

      <ContextDrawer
        isOpen={panel !== null}
        onClose={() => setPanel(null)}
        activeTab={
          panel === 'bookings'
            ? 'artist'
            : panel === 'session'
              ? 'session'
              : panel === 'career' || panel === 'cases'
                ? 'career'
                : dashboardTab === 'staff'
                  ? 'staff'
                  : 'gear'
        }
        onTabChange={(tab: ContextDrawerTab) => {
          switch (tab) {
            case 'artist':
              setPanel('bookings');
              break;
            case 'session':
              setPanel('session');
              break;
            case 'gear':
              setPanel('studio');
              setDashboardTab('studio');
              break;
            case 'staff':
              setPanel('studio');
              setDashboardTab('staff');
              break;
            case 'room':
              setPanel('studio');
              setDashboardTab('studio');
              break;
            case 'career':
              setPanel('career');
              break;
          }
        }}
        title={panel ? titles[panel] : ''}
        subtitle="RECORDING STUDIO OS"
        width={panel === 'session' ? 'session' : 'default'}
        returnFocusRef={returnFocusRef}
        unreadEnquiries={gameState.availableProjects.length}
        headerActions={
          panel === 'session' && gameState.playerData.dailyWorkCapacity <= 0 && !project?.awaitingReview ? (
            <MotionButton
              className="studio-primary-action ml-auto text-xs py-1 px-2.5"
              onClick={advanceDay}
            >
              <Moon size={14} />
              <span>Rest & advance day</span>
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
              advanceDay={advanceDay}
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
              />
              <KnowHowPanel
                knowHow={gameState.studioKnowHow}
                onUnlock={id => setGameState(prev => {
                  const next = unlockCapability(prev.studioKnowHow ?? createInitialKnowHow(), id);
                  return next ? { ...prev, studioKnowHow: next } : prev;
                })}
              />
              <div className="grid gap-2.5 p-1 pt-3 sm:grid-cols-2">
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
        onClose={() => setShowRadialWheel(false)}
      />
      <GamepadHUD hasOpenModal={panel !== null} />
    </div>
    </GamepadNavProvider>
  );
};
