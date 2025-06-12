import React, { useRef, useState, useEffect } from 'react';
import { GameState, FocusAllocation, StaffMember, PlayerAttributes, Project, ProjectReport } from '@/types/game';
import { ProjectList } from '@/components/ProjectList';
import { ProgressiveProjectInterface } from '@/components/ProgressiveProjectInterface';
import { RightPanel } from '@/components/RightPanel';
import { FloatingXPOrb } from '@/components/FloatingXPOrb';
import { EraTransitionAnimation } from '@/components/EraTransitionAnimation';
import { HistoricalNewsModal } from '@/components/HistoricalNewsModal';
import { checkForNewEvents, applyEventEffects, HistoricalEvent } from '@/utils/historicalEvents';
import { useBandManagement } from '@/hooks/useBandManagement';
import { MinigameType } from '@/types/miniGame';
import { useIsMobile } from '@/hooks/useIsMobile'; // Import useIsMobile

interface MainGameContentProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  focusAllocation: FocusAllocation;
  setFocusAllocation: React.Dispatch<React.SetStateAction<FocusAllocation>>;
  startProject: (project: Project) => void;
  performDailyWork: () => { isComplete: boolean; finalProjectData: Project | null; review: ProjectReport | undefined | null; } | undefined; // Updated return type
  onProjectComplete?: (completedProject: Project) => void; // Added this prop
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
  triggerEraTransition: (newEraId: string) => void; // Updated to accept newEraId
  autoTriggeredMinigame: { type: MinigameType; reason: string } | null;
  clearAutoTriggeredMinigame: () => void;
  startResearchMod?: (staffId: string, modId: string) => boolean; // Add prop
}

export const MainGameContent: React.FC<MainGameContentProps> = ({
  gameState,
  setGameState,
  focusAllocation,
  setFocusAllocation,
  startProject,
  performDailyWork,
  onProjectComplete, // Destructure the new prop
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
  startResearchMod // Destructure prop
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
  const isMobile = useIsMobile();
  const [activeMobileTab, setActiveMobileTab] = useState(1); // Default to center panel (Studio)
  const swipeContainerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef(0);
  const touchCurrentXRef = useRef(0);
  const isSwipingRef = useRef(false);
  const SWIPE_THRESHOLD = 50; // Minimum pixels for a swipe

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
    // TODO: Implement logic to determine the next era ID.
    // For now, using a placeholder. This needs to be dynamic.
    const nextEraId = "placeholder_next_era_id"; // This needs actual logic
    const currentEraId = gameState.currentEra;
    
    triggerEraTransition(nextEraId); // Call with the determined nextEraId

    // The visual transition part might need to be adjusted
    // if triggerEraTransition itself handles all state changes.
    // For now, keeping the visual cue part.
    setEraTransitionInfo({ fromEra: currentEraId, toEra: nextEraId });
    setShowEraTransition(true);
  };

  // Band Management Integration
  const { createBand, startTour, createOriginalTrack, processTourIncome } = useBandManagement(gameState, setGameState);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchCurrentXRef.current = e.touches[0].clientX;
    isSwipingRef.current = true;
    if (swipeContainerRef.current) {
      swipeContainerRef.current.style.transition = 'none'; // Disable transition during swipe
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwipingRef.current) return;
    touchCurrentXRef.current = e.touches[0].clientX;
    const diffX = touchCurrentXRef.current - touchStartXRef.current;
    if (swipeContainerRef.current) {
      // Move the content with the swipe, but constrain it
      const baseTranslate = -activeMobileTab * 100;
      swipeContainerRef.current.style.transform = `translateX(calc(${baseTranslate}% + ${diffX}px))`;
    }
  };

  const handleTouchEnd = () => {
    if (!isSwipingRef.current) return;
    isSwipingRef.current = false;
    const diffX = touchCurrentXRef.current - touchStartXRef.current;

    if (swipeContainerRef.current) {
      swipeContainerRef.current.style.transition = 'transform 0.3s ease-out'; // Re-enable transition
    }

    if (Math.abs(diffX) > SWIPE_THRESHOLD) {
      if (diffX < 0) { // Swiped left
        setActiveMobileTab(prev => Math.min(prev + 1, 2));
      } else { // Swiped right
        setActiveMobileTab(prev => Math.max(prev - 1, 0));
      }
    } else {
      // Snap back if not a full swipe
      if (swipeContainerRef.current) {
        swipeContainerRef.current.style.transform = `translateX(-${activeMobileTab * 100}%)`;
      }
    }
  };
  
  useEffect(() => {
    if (isMobile && swipeContainerRef.current) {
      swipeContainerRef.current.style.transform = `translateX(-${activeMobileTab * 100}%)`;
    }
  }, [activeMobileTab, isMobile]);

  return (
    <div className="h-full flex flex-col"> {/* Outer container for layout + modals */}
      {isMobile ? (
        // Mobile View: Swipeable tabs
        <div className="flex-grow flex flex-col overflow-hidden"> {/* Main container for mobile view */}
          <div 
            className="flex-grow flex h-full" // This will be the swipe track
            ref={swipeContainerRef}
            style={{ transition: 'transform 0.3s ease-out', width: '300%' }} // 3 tabs
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Tab 0: ProjectList */}
            <div className="w-full h-full overflow-y-auto p-2 flex-shrink-0" style={{ width: 'calc(100% / 3)' }}>
              <ProjectList 
                gameState={gameState}
                setGameState={setGameState}
                startProject={startProject}
              />
            </div>
            
            {/* Tab 1: Main Interface (Studio) */}
            <div className="w-full h-full overflow-y-auto p-2 flex-shrink-0 relative flex flex-col" style={{ width: 'calc(100% / 3)' }}>
              <ProgressiveProjectInterface 
                gameState={gameState}
                setGameState={setGameState}
                focusAllocation={focusAllocation}
                setFocusAllocation={setFocusAllocation}
                performDailyWork={performDailyWork}
                onMinigameReward={onMinigameReward}
                onProjectComplete={onProjectComplete}
                autoTriggeredMinigame={autoTriggeredMinigame}
                clearAutoTriggeredMinigame={clearAutoTriggeredMinigame}
                onProjectSelect={(project) => {
                  setGameState(prev => ({ ...prev, activeProject: project }));
                }}
              />
              <div ref={orbContainerRef} className="absolute inset-0 pointer-events-none z-10"></div>
              {floatingOrbs.map(orb => (
                <FloatingXPOrb
                  key={orb.id}
                  amount={orb.amount}
                  type={orb.type}
                  onComplete={() => setFloatingOrbs(prev => prev.filter(o => o.id !== orb.id))}
                />
              ))}
            </div>

            {/* Tab 2: RightPanel (Manage) */}
            <div className="w-full h-full overflow-y-auto p-2 flex-shrink-0" style={{ width: 'calc(100% / 3)' }}>
              <RightPanel 
                gameState={gameState}
                showSkillsModal={showSkillsModal}
                setShowSkillsModal={setShowSkillsModal}
                showAttributesModal={showAttributesModal}
                setShowAttributesModal={setShowAttributesModal}
                spendPerkPoint={spendPerkPoint}
                advanceDay={advanceDay}
                purchaseEquipment={purchaseEquipment}
                createBand={createBand}
                startTour={startTour}
                createOriginalTrack={createOriginalTrack}
                hireStaff={hireStaff}
                refreshCandidates={refreshCandidates}
                assignStaffToProject={assignStaffToProject}
                unassignStaffFromProject={unassignStaffFromProject}
                toggleStaffRest={toggleStaffRest}
                openTrainingModal={openTrainingModal}
                contactArtist={contactArtist}
                triggerEraTransition={handleEraTransition}
                startResearchMod={startResearchMod}
              />
            </div> {/* Corrected closing tag for this div */}
          </div>
          {/* Mobile Tab Navigation Dots */}
          <div className="flex justify-center p-2 border-t border-gray-700 bg-gray-800">
            {[0, 1, 2].map(index => (
              <button 
                key={index}
                onClick={() => setActiveMobileTab(index)} 
                className={`w-3 h-3 rounded-full mx-1 ${activeMobileTab === index ? 'bg-blue-500' : 'bg-gray-600'}`}
                aria-label={`Go to tab ${index + 1}`}
              />
            ))}
          </div>
        </div>
      ) : (
        // Desktop View: 3-panel layout
        <div className="p-2 sm:p-4 sm:flex sm:gap-4 relative flex-grow overflow-hidden">
          {/* Left Panel */}
          <div className="w-full sm:w-80 lg:w-96 animate-fade-in flex flex-col h-full">
            <div className="overflow-y-auto flex-grow">
              <ProjectList 
                gameState={gameState}
                setGameState={setGameState}
                startProject={startProject}
              />
            </div>
          </div>

          {/* Center Panel Wrapper */}
          <div className="flex-1 relative sm:min-h-0 animate-fade-in flex flex-col h-full overflow-hidden" style={{ animationDelay: '0.2s' }}>
            <ProgressiveProjectInterface 
              gameState={gameState}
              setGameState={setGameState}
              focusAllocation={focusAllocation}
              setFocusAllocation={setFocusAllocation}
              performDailyWork={performDailyWork}
              onMinigameReward={onMinigameReward}
              onProjectComplete={onProjectComplete}
              autoTriggeredMinigame={autoTriggeredMinigame}
              clearAutoTriggeredMinigame={clearAutoTriggeredMinigame}
              onProjectSelect={(project) => {
                setGameState(prev => ({ ...prev, activeProject: project }));
              }}
            />
            <div ref={orbContainerRef} className="absolute inset-0 pointer-events-none z-10"></div>
            {floatingOrbs.map(orb => (
              <FloatingXPOrb
                key={orb.id}
                amount={orb.amount}
                type={orb.type}
                onComplete={() => setFloatingOrbs(prev => prev.filter(o => o.id !== orb.id))}
              />
            ))}
          </div>

          {/* Right Panel */}
          <div className="w-full sm:w-80 lg:w-96 animate-fade-in flex flex-col h-full" style={{ animationDelay: '0.4s' }}>
             <div className="overflow-y-auto flex-grow">
              <RightPanel 
                gameState={gameState}
                showSkillsModal={showSkillsModal}
                setShowSkillsModal={setShowSkillsModal}
                showAttributesModal={showAttributesModal}
                setShowAttributesModal={setShowAttributesModal}
                spendPerkPoint={spendPerkPoint}
                advanceDay={advanceDay}
                purchaseEquipment={purchaseEquipment}
                createBand={createBand}
                startTour={startTour}
                createOriginalTrack={createOriginalTrack}
                hireStaff={hireStaff}
                refreshCandidates={refreshCandidates}
                assignStaffToProject={assignStaffToProject}
                unassignStaffFromProject={unassignStaffFromProject}
                toggleStaffRest={toggleStaffRest}
                openTrainingModal={openTrainingModal}
                contactArtist={contactArtist}
                triggerEraTransition={handleEraTransition}
                startResearchMod={startResearchMod} 
              />
            </div>
          </div>
        </div>
      )} {/* This closes the ternary operator */}

      {/* Era Transition Animation */}
      {showEraTransition && eraTransitionInfo && (
        <EraTransitionAnimation
          isVisible={showEraTransition}
          fromEra={eraTransitionInfo.fromEra}
          toEra={eraTransitionInfo.toEra}
          onComplete={() => {
            setShowEraTransition(false);
            setEraTransitionInfo(null);
          }}
        />
      )}

      {/* Historical News Modal */}
      <HistoricalNewsModal
        event={currentHistoricalEvent}
        isOpen={showHistoricalNews}
        onClose={() => {
          setShowHistoricalNews(false);
          setCurrentHistoricalEvent(null);
        }}
      />
    </div> // Closes the outer h-full flex flex-col container
  );
};
