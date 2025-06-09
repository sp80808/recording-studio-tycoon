
import React, { useRef, useState, useEffect } from 'react';
import { GameState, FocusAllocation, StaffMember, PlayerAttributes, Project } from '@/types/game';
import { ProjectList } from '@/components/ProjectList';
import { ActiveProject } from '@/components/ActiveProject';
import { RightPanel } from '@/components/RightPanel';
import { FloatingXPOrb } from '@/components/FloatingXPOrb';
import { EraTransitionAnimation } from '@/components/EraTransitionAnimation';
import { HistoricalNewsModal } from '@/components/HistoricalNewsModal';
import { checkForNewEvents, applyEventEffects, HistoricalEvent } from '@/utils/historicalEvents';
import { EnhancedProjectList } from '@/components/EnhancedProjectList';

interface MainGameContentProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  focusAllocation: FocusAllocation;
  setFocusAllocation: React.Dispatch<React.SetStateAction<FocusAllocation>>;
  activeProject: Project | null;
  setActiveProject: React.Dispatch<React.SetStateAction<Project | null>>;
  completeProject: () => void;
  startProject: (project: Project) => void;
  workOnProject: (creativityPoints: number, technicalPoints: number) => void;
  completeStage: () => void;
  generateProjects: () => void;
  triggerMinigame: (type: string, reason: string) => void;
  buyEquipment: (equipmentId: string) => void;
  hireStaff: (candidateIndex: number) => boolean;
  trainStaff: (staff: StaffMember, skill: string) => void;
  upgradeStudio: (studioId: string) => void;
  refreshCandidates: () => void;
  assignStaffToProject: (staffId: string) => void;
  unassignStaffFromProject: (staffId: string) => void;
  toggleStaffRest: (staffId: string) => void;
  openTrainingModal: (staff: StaffMember) => boolean;
  spendPerkPoint: (attribute: keyof PlayerAttributes) => void;
  createBand: (bandName: string, memberIds: string[]) => void;
  createOriginalTrack: () => void;
}

export const MainGameContent: React.FC<MainGameContentProps> = ({
  gameState,
  setGameState,
  focusAllocation,
  setFocusAllocation,
  activeProject,
  setActiveProject,
  completeProject,
  startProject,
  workOnProject,
  completeStage,
  generateProjects,
  triggerMinigame,
  buyEquipment,
  hireStaff,
  trainStaff,
  upgradeStudio,
  refreshCandidates,
  assignStaffToProject,
  unassignStaffFromProject,
  toggleStaffRest,
  openTrainingModal,
  spendPerkPoint,
  createBand,
  createOriginalTrack
}) => {
  const orbContainerRef = useRef<HTMLDivElement>(null);
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

  // Mock functions for missing props
  const performDailyWork = () => {
    return { isComplete: false };
  };

  const onMinigameReward = (creativityBonus: number, technicalBonus: number, xpBonus: number, minigameType?: string) => {
    // Handle minigame rewards
  };

  const contactArtist = (artistId: string, offer: number) => {
    // Handle artist contact
  };

  const triggerEraTransition = () => {
    // Handle era transition
    return { fromEra: gameState.currentEra, toEra: 'next' };
  };

  const startTour = (bandId: string) => {
    // Handle tour start
  };

  // Wrapper function to match the expected signature for RightPanel
  const handleCreateBand = () => {
    // Open a modal or use default values for now
    createBand('New Band', []);
  };

  return (
    <>
      <div className="p-2 sm:p-4 space-y-4 sm:space-y-0 sm:flex sm:gap-4 sm:h-[calc(100vh-140px)] relative">
        <div className="w-full sm:w-80 lg:w-96 animate-fade-in">
          <EnhancedProjectList 
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
            setGameState={setGameState}
            hireStaff={hireStaff}
            refreshCandidates={refreshCandidates}
            assignStaffToProject={assignStaffToProject}
            unassignStaffFromProject={unassignStaffFromProject}
            toggleStaffRest={toggleStaffRest}
            openTrainingModal={openTrainingModal}
            createBand={handleCreateBand}
            spendPerkPoint={spendPerkPoint}
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
