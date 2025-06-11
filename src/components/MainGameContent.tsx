
import React, { useRef, useState, useEffect } from 'react';
import { GameState, FocusAllocation, StaffMember, PlayerAttributes, Project } from '@/types/game';
import { ProjectList } from '@/components/ProjectList';
import { ActiveProject } from '@/components/ActiveProject';
import { RightPanel } from '@/components/RightPanel';
import { FloatingXPOrb } from '@/components/FloatingXPOrb';
import { EraTransitionAnimation } from '@/components/EraTransitionAnimation';
import { HistoricalNewsModal } from '@/components/HistoricalNewsModal';
import { checkForNewEvents, applyEventEffects, HistoricalEvent } from '@/utils/historicalEvents';
import { useBandManagement } from '@/hooks/useBandManagement';
import { MinigameType } from '@/components/minigames/MinigameManager';

interface MainGameContentProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  focusAllocation: FocusAllocation;
  setFocusAllocation: React.Dispatch<React.SetStateAction<FocusAllocation>>;
  startProject: (project: Project) => void;
  performDailyWork: () => { isComplete: boolean; review?: any } | undefined;
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
  startResearchMod?: (staffId: string, modId: string) => boolean; // Add prop
}

export const MainGameContent: React.FC<MainGameContentProps> = ({
  gameState,
  setGameState,
  focusAllocation,
  setFocusAllocation,
  startProject,
  performDailyWork,
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
  const { createBand, startTour, createOriginalTrack, processTourIncome } = useBandManagement(gameState, setGameState);

  return (
    <>
      <div className="p-2 sm:p-4 space-y-4 sm:space-y-0 sm:flex sm:gap-4 sm:h-[calc(100vh-140px)] relative">
        <div className="w-full sm:w-80 lg:w-96 animate-fade-in">
          <ProjectList 
            gameState={gameState}
            setGameState={setGameState}
            startProject={startProject}
          />
        </div>

        <div className="flex-1 relative min-h-[400px] sm:min-h-0 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <ActiveProject 
            gameState={gameState}
            focusAllocation={focusAllocation}
            setFocusAllocation={setFocusAllocation}
            performDailyWork={performDailyWork}
            onMinigameReward={onMinigameReward}
            autoTriggeredMinigame={autoTriggeredMinigame}
            clearAutoTriggeredMinigame={clearAutoTriggeredMinigame}
          />
          
          <div ref={orbContainerRef} className="absolute inset-0 pointer-events-none z-10"></div>
          
          {/* Floating XP/Money orbs */}
          {floatingOrbs.map(orb => (
            <FloatingXPOrb
              key={orb.id}
              amount={orb.amount}
              type={orb.type}
              onComplete={() => {
                setFloatingOrbs(prev => prev.filter(o => o.id !== orb.id));
              }}
            />
          ))}
        </div>

        <div className="w-full sm:w-80 lg:w-96 animate-fade-in" style={{ animationDelay: '0.4s' }}>
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
            startResearchMod={startResearchMod} // Pass prop to RightPanel
          />
        </div>
      </div>

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
    </>
  );
};
