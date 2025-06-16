import React, { useRef, useState, useEffect } from 'react';
import { GameState, FocusAllocation, StaffMember, PlayerAttributes, Project, ProjectReport, MusicGenre } from '@/types/game'; // Added MusicGenre
import { ProjectList, ProjectListProps } from '@/components/ProjectList'; // Assuming ProjectListProps is exported
import { ProgressiveProjectInterface, ProgressiveProjectInterfaceProps } from '@/components/ProgressiveProjectInterface'; // Assuming Props is exported
import { RightPanel, RightPanelProps } from '@/components/RightPanel'; // Assuming Props is exported
import { StudioPerksPanel } from '@/components/StudioPerksPanel';
import { Button } from '@/components/ui/button';
import { FloatingXPOrb } from '@/components/FloatingXPOrb';
import { EraTransitionAnimation } from '@/components/EraTransitionAnimation';
import { HistoricalNewsModal } from '@/components/HistoricalNewsModal';
import { checkForNewEvents, applyEventEffects, HistoricalEvent } from '@/utils/historicalEvents';
import { useBandManagement } from '@/hooks/useBandManagement';
import { MinigameType } from '@/types/miniGame';
import { useIsMobile } from '@/hooks/useIsMobile';

// Define a more precise type for performDailyWork if its return type is fixed
type PerformDailyWorkFn = () => { isComplete: boolean; finalProjectData?: Project | null; review?: ProjectReport | null; } | undefined;


interface MainGameContentProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  focusAllocation: FocusAllocation;
  setFocusAllocation: React.Dispatch<React.SetStateAction<FocusAllocation>>;
  startProject: (project: Project) => void;
  performDailyWork: PerformDailyWorkFn; // Use the refined type
  onProjectComplete?: (completedProject: Project, review: ProjectReport | null) => void; // review added
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
  triggerEraTransition: (newEraId: string) => void;
  autoTriggeredMinigame: { type: MinigameType; reason: string } | null;
  clearAutoTriggeredMinigame: () => void;
  startResearchMod?: (staffId: string, modId: string) => boolean;
}

export const MainGameContent: React.FC<MainGameContentProps> = ({
  gameState,
  setGameState,
  focusAllocation,
  setFocusAllocation,
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
  const [showStudioPerksPanel, setShowStudioPerksPanel] = useState(false);
  const [floatingOrbs, setFloatingOrbs] = useState<Array<{
    id: string;
    amount: number;
    type: 'xp' | 'money' | 'skill';
  }>>([]);
  const isMobile = useIsMobile();
  const [activeMobileTab, setActiveMobileTab] = useState(1);
  const swipeContainerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef(0);
  const touchCurrentXRef = useRef(0);
  const isSwipingRef = useRef(false);
  const SWIPE_THRESHOLD = 50;

  useEffect(() => {
    if (!gameState) return;
    const newEvents = checkForNewEvents(gameState, lastCheckedDay);
    if (newEvents.length > 0) {
      const event = newEvents[0];
      setCurrentHistoricalEvent(event);
      setShowHistoricalNews(true);
      const updatedGameState = applyEventEffects(event, gameState);
      setGameState(updatedGameState);
      setLastCheckedDay(gameState.currentDay);
    }
  }, [gameState, lastCheckedDay, setGameState]);

  const handleEraTransition = () => {
    if (!gameState) return;
    const nextEraId = "placeholder_next_era_id"; 
    const currentEraId = gameState.currentEra;
    triggerEraTransition(nextEraId);
    setEraTransitionInfo({ fromEra: currentEraId, toEra: nextEraId });
    setShowEraTransition(true);
  };

  const bandManagement = useBandManagement();

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchCurrentXRef.current = e.touches[0].clientX;
    isSwipingRef.current = true;
    if (swipeContainerRef.current) {
      swipeContainerRef.current.style.transition = 'none';
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwipingRef.current) return;
    touchCurrentXRef.current = e.touches[0].clientX;
    const diffX = touchCurrentXRef.current - touchStartXRef.current;
    if (swipeContainerRef.current) {
      const baseTranslate = -activeMobileTab * 100;
      swipeContainerRef.current.style.transform = `translateX(calc(${baseTranslate}% + ${diffX}px))`;
    }
  };

  const handleTouchEnd = () => {
    if (!isSwipingRef.current) return;
    isSwipingRef.current = false;
    const diffX = touchCurrentXRef.current - touchStartXRef.current;

    if (swipeContainerRef.current) {
      swipeContainerRef.current.style.transition = 'transform 0.3s ease-out';
    }

    if (Math.abs(diffX) > SWIPE_THRESHOLD) {
      if (diffX < 0) {
        setActiveMobileTab(prev => Math.min(prev + 1, 2));
      } else {
        setActiveMobileTab(prev => Math.max(prev - 1, 0));
      }
    } else {
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

  if (!gameState) {
    return <div>Loading game...</div>;
  }
  
  // Prepare props for ProgressiveProjectInterface, ensuring performDailyWork matches
  const progressiveProjectInterfaceProps: Omit<ProgressiveProjectInterfaceProps, 'onProjectSelect'> = {
    gameState,
    setGameState,
    focusAllocation,
    setFocusAllocation,
    performDailyWork: performDailyWork as ProgressiveProjectInterfaceProps['performDailyWork'], // Cast to expected type
    onMinigameReward,
    onProjectComplete: onProjectComplete as ProgressiveProjectInterfaceProps['onProjectComplete'], // Cast
    autoTriggeredMinigame,
    clearAutoTriggeredMinigame,
  };


  return (
    <div className="h-full flex flex-col">
      {isMobile ? (
        <div className="flex-grow flex flex-col overflow-hidden">
          <div 
            className="flex-grow flex h-full"
            ref={swipeContainerRef}
            style={{ transition: 'transform 0.3s ease-out', width: '300%' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="w-full h-full overflow-y-auto p-2 flex-shrink-0" style={{ width: 'calc(100% / 3)' }}>
              <ProjectList 
                gameState={gameState}
                updateGameState={setGameState} 
                startProject={startProject}
              />
            </div>
            
            <div className="w-full h-full overflow-y-auto p-2 flex-shrink-0 relative flex flex-col" style={{ width: 'calc(100% / 3)' }}>
              <ProgressiveProjectInterface 
                {...progressiveProjectInterfaceProps}
                onProjectSelect={(project) => {
                  setGameState(prev => ({ ...prev!, activeProject: project }));
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
                createBand={bandManagement.createBand}
                startTour={bandManagement.startTour}
                hireStaff={hireStaff}
                refreshCandidates={refreshCandidates}
                assignStaffToProject={assignStaffToProject}
                unassignStaffFromProject={unassignStaffFromProject}
                toggleStaffRest={toggleStaffRest}
                openTrainingModal={openTrainingModal}
                contactArtist={contactArtist}
                triggerEraTransition={handleEraTransition}
                startResearchMod={startResearchMod}
                onOpenStudioPerks={() => setShowStudioPerksPanel(true)}
              />
            </div>
          </div>
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
        <div className="p-2 sm:p-4 sm:flex sm:gap-4 relative flex-grow overflow-hidden">
          <div className="w-full sm:w-80 lg:w-96 animate-fade-in flex flex-col h-full">
            <div className="overflow-y-auto flex-grow">
              <ProjectList 
                gameState={gameState}
                updateGameState={setGameState} 
                startProject={startProject}
              />
            </div>
          </div>

          <div className="flex-1 relative sm:min-h-0 animate-fade-in flex flex-col h-full overflow-hidden" style={{ animationDelay: '0.2s' }}>
            <ProgressiveProjectInterface 
              {...progressiveProjectInterfaceProps}
              onProjectSelect={(project) => {
                 setGameState(prev => ({ ...prev!, activeProject: project }));
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
                createBand={bandManagement.createBand}
                startTour={bandManagement.startTour}
                hireStaff={hireStaff}
                refreshCandidates={refreshCandidates}
                assignStaffToProject={assignStaffToProject}
                unassignStaffFromProject={unassignStaffFromProject}
                toggleStaffRest={toggleStaffRest}
                openTrainingModal={openTrainingModal}
                contactArtist={contactArtist}
                triggerEraTransition={handleEraTransition}
                startResearchMod={startResearchMod}
                onOpenStudioPerks={() => setShowStudioPerksPanel(true)}
              />
            </div>
          </div>
        </div>
      )}

      {showStudioPerksPanel && (
        <div className="absolute inset-0 bg-black bg-opacity-75 z-40 flex items-center justify-center p-4">
          <div className="bg-slate-800 p-4 rounded-lg shadow-xl w-full max-w-3xl h-[90vh] max-h-[800px] flex flex-col">
            <StudioPerksPanel />
            <Button onClick={() => setShowStudioPerksPanel(false)} className="mt-4 bg-red-600 hover:bg-red-700 self-center px-4 py-2">Close Perks</Button>
          </div>
        </div>
      )}

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

      <HistoricalNewsModal
        event={currentHistoricalEvent}
        isOpen={showHistoricalNews}
        onClose={() => {
          setShowHistoricalNews(false);
          setCurrentHistoricalEvent(null);
        }}
      />
    </div>
  );
};
