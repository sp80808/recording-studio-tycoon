import React, { useRef, useState, useEffect } from 'react';
import { GameState, FocusAllocation, StaffMember, PlayerAttributes, Project } from '@/types/game';
import { ProjectList } from '@/components/ProjectList';
import { ProgressiveProjectInterface } from '@/components/ProgressiveProjectInterface';
import { RightPanel } from '@/components/RightPanel';
import { FloatingXPOrb } from '@/components/FloatingXPOrb';
import { EraTransitionAnimation } from '@/components/EraTransitionAnimation';
import { HistoricalNewsModal } from '@/components/HistoricalNewsModal';
import { checkForNewEvents, applyEventEffects, HistoricalEvent } from '@/utils/historicalEvents';
import { useBandManagement } from '@/hooks/useBandManagement';
import { MinigameType } from '@/components/minigames/MinigameManager';
import useMediaQuery from '@/hooks/useMediaQuery';
import MobileArrowNavigation from '@/components/layout/MobileArrowNavigation';

/**
 * Interface defining the structure of a tab object for mobile navigation.
 */
interface Tab {
  id: string; // Unique identifier for the tab (e.g., 'studio', 'projects')
  name: string; // Display name for the tab (e.g., "Studio", "Projects")
  component?: React.ReactNode; // Optional: The actual component to render (not directly used for rendering by MobileArrowNavigation itself)
}

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
}

/**
 * MainGameContent component.
 * This component is the core of the game's UI, displaying different panels based on the game state and viewport size.
 * On desktop, it shows a three-column layout: Project List, Main Studio Interface, and Management Panel.
 * On mobile, it uses MobileArrowNavigation and swipe gestures to switch between these three panels, showing one at a time.
 */
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
  startResearchMod
}) => {
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [showAttributesModal, setShowAttributesModal] = useState(false);
  const [showEraTransition, setShowEraTransition] = useState(false);
  const [eraTransitionInfo, setEraTransitionInfo] = useState<{ fromEra: string; toEra: string } | null>(null);
  const [showHistoricalNews, setShowHistoricalNews] = useState(false);
  const [currentHistoricalEvent, setCurrentHistoricalEvent] = useState<HistoricalEvent | null>(null);
  const [lastCheckedDay, setLastCheckedDay] = useState(0);
  const [floatingOrbs, setFloatingOrbs] = useState<Array<{
    id: string;
    amount: number;
    type: 'xp' | 'money' | 'skill';
  }>>([]);

  // Mobile detection: True if viewport width is 768px or less.
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // State to manage the active tab index for mobile view.
  // 0: Projects, 1: Studio (main interface), 2: Management (right panel)
  const [activeMobileTabIndex, setActiveMobileTabIndex] = useState(1); // Default to Studio panel

  // Refs for swipe gesture handling on mobile.
  const swipeContainerRef = useRef<HTMLDivElement>(null); // Ref for the swipeable container
  const touchStartXRef = useRef(0); // Stores X-coordinate at the start of a touch
  const touchCurrentXRef = useRef(0); // Stores current X-coordinate during a touch move
  const isSwipingRef = useRef(false); // Flag to indicate if a swipe is in progress
  const SWIPE_THRESHOLD = 50; // Minimum pixel distance for a swipe to be registered

  // Defines the tabs available for mobile navigation.
  // These correspond to the three main panels of the game.
  const mobileTabs: Tab[] = [
    { id: 'projects', name: 'Projects' },     // Corresponds to ProjectList panel
    { id: 'studio', name: 'Studio' },         // Corresponds to ProgressiveProjectInterface (main studio)
    { id: 'management', name: 'Management' }, // Corresponds to RightPanel (staff, equipment, etc.)
  ];
  
  /**
   * Handles navigation triggered by the MobileArrowNavigation component.
   * @param {string} tabId - The ID of the tab to navigate to.
   */
  const handleMobileNavigate = (tabId: string) => {
    const newIndex = mobileTabs.findIndex(tab => tab.id === tabId);
    if (newIndex !== -1) {
      setActiveMobileTabIndex(newIndex);
    }
  };

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


  /**
   * Touch event handler for the start of a swipe gesture on mobile.
   * @param {React.TouchEvent} e - The touch event.
   */
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return; // Swipe logic is only for mobile
    touchStartXRef.current = e.touches[0].clientX;
    touchCurrentXRef.current = e.touches[0].clientX;
    isSwipingRef.current = true;
    if (swipeContainerRef.current) {
      // Disable CSS transition during manual swipe to avoid lag
      swipeContainerRef.current.style.transition = 'none';
    }
  };

  /**
   * Touch event handler for movement during a swipe gesture on mobile.
   * @param {React.TouchEvent} e - The touch event.
   */
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || !isSwipingRef.current) return;
    touchCurrentXRef.current = e.touches[0].clientX;
    const diffX = touchCurrentXRef.current - touchStartXRef.current;
    if (swipeContainerRef.current) {
      // Translate the swipe container based on touch movement
      const baseTranslate = -activeMobileTabIndex * 100; // Base offset for the current tab
      swipeContainerRef.current.style.transform = `translateX(calc(${baseTranslate}% + ${diffX}px))`;
    }
  };

  /**
   * Touch event handler for the end of a swipe gesture on mobile.
   * Determines if a swipe was significant enough to change tabs.
   */
  const handleTouchEnd = () => {
    if (!isMobile || !isSwipingRef.current) return;
    isSwipingRef.current = false;
    const diffX = touchCurrentXRef.current - touchStartXRef.current;

    if (swipeContainerRef.current) {
      // Re-enable CSS transition for smooth snapping
      swipeContainerRef.current.style.transition = 'transform 0.3s ease-out';
    }

    // Check if swipe distance exceeds the threshold
    if (Math.abs(diffX) > SWIPE_THRESHOLD) {
      if (diffX < 0) { // Swiped left (next tab)
        setActiveMobileTabIndex(prev => Math.min(prev + 1, mobileTabs.length - 1));
      } else { // Swiped right (previous tab)
        setActiveMobileTabIndex(prev => Math.max(prev - 1, 0));
      }
    } else {
      // If not a significant swipe, snap back to the current tab
      if (swipeContainerRef.current) {
        swipeContainerRef.current.style.transform = `translateX(-${activeMobileTabIndex * 100}%)`;
      }
    }
  };
  
  // Effect to update the swipe container's translation when activeMobileTabIndex changes (e.g., via arrow navigation).
  useEffect(() => {
    if (isMobile && swipeContainerRef.current) {
      swipeContainerRef.current.style.transform = `translateX(-${activeMobileTabIndex * 100}%)`;
    }
  }, [activeMobileTabIndex, isMobile]);

  // Desktop layout remains a 3-column flex layout
  // Mobile layout uses swipeable views controlled by MobileArrowNavigation

  return (
    // Outermost container for the main game content area.
    <div className="h-full flex flex-col">
      {/* Render MobileArrowNavigation only on mobile viewports. */}
      {isMobile && (
        <div className="mobile-navigation">
          <MobileArrowNavigation
            tabs={mobileTabs}
            activeTabId={mobileTabs[activeMobileTabIndex].id} // Pass the ID of the current active tab
            onNavigate={handleMobileNavigate} // Pass the handler for arrow clicks
          />
        </div>
      )}
      {/* Container for the tab panels. Flex direction and overflow differ for mobile vs. desktop. */}
      <div 
        className={`flex-grow flex ${isMobile ? 'mobile-tab-container' : ''}`}
        ref={isMobile ? swipeContainerRef : null} // Apply swipe container ref only on mobile
        style={isMobile ? { transition: 'transform 0.3s ease-out', width: `${mobileTabs.length * 100}%` } : {}} // Style for swipe track on mobile
        onTouchStart={isMobile ? handleTouchStart : undefined} // Attach touch handlers only on mobile
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
      >
        {/* Panel 1: Project List */}
        {/* On mobile, this is the first tab. On desktop, it's the left column. */}
        <div 
          className={`h-full overflow-y-auto p-2 ${isMobile ? 'flex-shrink-0 mobile-tab-panel' : 'w-1/4 border-r border-gray-700'}`}
          style={isMobile ? { width: `calc(100% / ${mobileTabs.length})`} : {}} // Full width per tab on mobile, fractional on desktop
        >
          <ProjectList 
            gameState={gameState}
            setGameState={setGameState}
            startProject={startProject}
          />
        </div>
        
        {/* Panel 2: Main Interface (Studio) */}
        {/* On mobile, this is the second (default) tab. On desktop, it's the center column. */}
        <div 
          className={`h-full overflow-y-auto p-2 relative flex flex-col ${isMobile ? 'flex-shrink-0 mobile-tab-panel' : 'w-1/2'}`}
          style={isMobile ? { width: `calc(100% / ${mobileTabs.length})`} : {}}
        >
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
              // On mobile, if a project is selected from the ProjectList (tab 0),
              // automatically switch to the Studio view (tab 1) to work on it.
              if (isMobile) setActiveMobileTabIndex(1);
            }}
            advanceDay={advanceDay}
          />
          <div ref={orbContainerRef} className="absolute inset-0 pointer-events-none overflow-hidden">
            {floatingOrbs.map(orb => (
              <FloatingXPOrb
                key={orb.id}
                amount={orb.amount}
                type={orb.type}
                onComplete={() => setFloatingOrbs(prev => prev.filter(o => o.id !== orb.id))}
              />
            ))}
          </div>
        </div>

        {/* Panel 3: RightPanel (Management, Staff, Equipment) */}
        {/* On mobile, this is the third tab. On desktop, it's the right column. */}
        <div 
          className={`h-full overflow-y-auto p-2 ${isMobile ? 'flex-shrink-0 mobile-tab-panel' : 'w-1/4 border-l border-gray-700'}`}
          style={isMobile ? { width: `calc(100% / ${mobileTabs.length})`} : {}}
        >
          <RightPanel
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
        </div>
      </div>

      {/* Modals: EraTransitionAnimation, HistoricalNewsModal, etc. */}
      {/* These are rendered outside the swipeable content area. */}
      {showEraTransition && eraTransitionInfo && (
        <EraTransitionAnimation
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

// Helper components like SkillsModal, AttributesModal would be defined or imported
// For brevity, their implementation is omitted here.
