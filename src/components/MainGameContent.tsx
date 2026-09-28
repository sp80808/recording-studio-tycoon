import React, { useRef, useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Headphones, Phone, SlidersHorizontal, Sparkles, Users, Disc3, Trophy, X, Minimize2, Moon } from 'lucide-react';
import { GameState, StaffMember, PlayerAttributes, Project } from '@/types/game';
import { ProjectList } from './ProjectList';
import { ProgressiveProjectInterface } from './ProgressiveProjectInterface';
import { CareerHub } from './CareerHub';
import { AttributesModal } from './modals/AttributesModal';
import { RightPanel } from './RightPanel';
import { StudioRoom } from './StudioRoom';
import { StudioStrip } from './StudioStrip';
import { EraTransitionAnimation } from './EraTransitionAnimation';
import { HistoricalNewsModal } from './HistoricalNewsModal';
import { checkForNewEvents, applyEventEffects, HistoricalEvent } from '@/utils/historicalEvents';
import { useBandManagement } from '@/hooks/useBandManagement';
import { MinigameType } from './minigames/MinigameManager';
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
}


type Panel = 'bookings' | 'session' | 'studio' | 'career';
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
  startResearchMod,
  refreshProjects,
  compactStudioMode,
  setCompactStudioMode
}) => {

  const [panel, setPanel] = useState<Panel | null>(null);
  const [showAttributesModal, setShowAttributesModal] = useState(false);
  const [showEraTransition, setShowEraTransition] = useState(false);
  const [eraTransitionInfo, setEraTransitionInfo] = useState<{ fromEra: string; toEra: string } | null>(null);
  const [showHistoricalNews, setShowHistoricalNews] = useState(false);
  const [currentHistoricalEvent, setCurrentHistoricalEvent] = useState<HistoricalEvent | null>(null);
  const [lastCheckedDay, setLastCheckedDay] = useState(0);
  const [dashboardTab, setDashboardTab] = useState<'studio' | 'skills' | 'bands' | 'charts' | 'staff'>('studio');
  const returnFocusRef = useRef<HTMLElement | null>(null);
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

  useEffect(() => {
    if (autoTriggeredMinigame) setPanel('session');
  }, [autoTriggeredMinigame]);

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
  }, [gameState.currentDay, gameState.currentEra, lastCheckedDay, setGameState]);

  // Enhanced era transition handler
  const handleEraTransition = () => {
    const result = triggerEraTransition();
    if (result && result.fromEra && result.toEra) {
      setEraTransitionInfo({ fromEra: result.fromEra, toEra: result.toEra });
      setShowEraTransition(true);
    }
  };

  // Band Management Integration
  const { createBand, startTour, createOriginalTrack } = useBandManagement(gameState, setGameState);



  if (compactStudioMode) {
    return <div className="h-full flex items-end"><StudioStrip gameState={gameState}
      onExpand={() => setCompactStudioMode(false)}
      onBookNextEnquiry={() => { const next = gameState.availableProjects[0]; if (next) startProject(next); }} /></div>;
  }

  const project = gameState.activeProject;
  const sessionLabel = project?.awaitingReview ? 'Collect release' : project ? 'Continue session' : 'Book your first session';
  const titles = { bookings: 'Bookings', session: 'At the console', studio: 'Studio management', career: 'Your producer story' };
  return (
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
      </div>
      <div className="studio-play-actions">
        <button className="studio-primary-action" onClick={() => openPanel(project ? 'session' : 'bookings')}>
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
          ] as const).map(([id, Icon, label, action]) => (
            <button key={id} onClick={action} className="studio-dock-button" title={label} aria-label={label}>
              <Icon size={21} aria-hidden="true" /><span>{label}</span>
              {id === 'career' && gameState.playerData.perkPoints > 0 && <i className="studio-dock-badge">{gameState.playerData.perkPoints}</i>}
            </button>
          ))}
        </nav>
      </div>

      <Dialog.Root open={panel !== null} onOpenChange={open => { if (!open) setPanel(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="studio-panel-shade" />
          <Dialog.Content className={`studio-activity-panel ${panel === 'session' ? 'studio-session-popup' : ''}`}
            aria-describedby={undefined}
            onCloseAutoFocus={event => { event.preventDefault(); returnFocusRef.current?.focus(); }}>
            <header className="studio-panel-heading">
              <div><p>RECORDING STUDIO</p><Dialog.Title>{panel ? titles[panel] : ''}</Dialog.Title></div>
              {panel === 'session' && gameState.playerData.dailyWorkCapacity <= 0 && !project?.awaitingReview &&
                <button className="studio-primary-action ml-auto" onClick={advanceDay}><Moon size={16} />Rest & advance day</button>}
              <Dialog.Close className="studio-dock-button" aria-label="Return to studio floor"><X size={22} /></Dialog.Close>
            </header>
            <div className="studio-panel-body" data-reward-source="activity">
              {panel === 'bookings' && <ProjectList gameState={gameState} setGameState={setGameState}
                startProject={bookProject} onRefreshProjects={refreshProjects} />}
              {panel === 'session' && <>
            <ProgressiveProjectInterface
              gameState={gameState}
              setGameState={setGameState}
              // focusAllocation={focusAllocation} // REMOVED
              // setFocusAllocation={setFocusAllocation} // REMOVED
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
              </>}
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
            createOriginalTrack={createOriginalTrack}
            startResearchMod={startResearchMod}
          />

              )}
              {panel === 'career' && <div className="overflow-y-auto">
                <CareerHub gameState={gameState} onTalents={() => setShowAttributesModal(true)}
                  onWork={() => openPanel('session')} onBookings={() => openPanel('bookings')}
                  onRest={advanceDay} onStaff={() => handleOpenDashboardTab('staff')} />
                <div className="grid gap-3 p-4">
                  <button className="studio-primary-action" onClick={() => handleOpenDashboardTab('skills')}><Sparkles size={20} />Skills & research</button>
                  <button className="studio-primary-action" onClick={advanceDay}><Moon size={20} />Rest & advance day</button>
                  <button className="studio-dock-button flex-row gap-2" onClick={() => { setPanel(null); setCompactStudioMode(true); }}><Minimize2 size={18} />Desktop studio strip</button>
                </div>
              </div>}
            </div>
            <p className="studio-panel-hint">Close to return to your studio floor</p>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
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

    </div>
  );
};
