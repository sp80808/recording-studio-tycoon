import React, { useState, useEffect, useCallback } from 'react';
import { GameState, initialGameState, FocusAllocation } from '@/types/game';
import { GameHeader } from '@/components/GameHeader';
import { LeftPanel } from '@/components/LeftPanel';
import { RightPanel } from '@/components/RightPanel';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useGameLogic } from '@/hooks/useGameLogic';
import { EnhancedAnimationStyles } from '@/components/EnhancedAnimationStyles';
import { StaffMember } from '@/types/game';

export default function Index() {
  const [gameState, setGameState] = useLocalStorage<GameState>('gameState', initialGameState);
  const [showSettings, setShowSettings] = useState(false);
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [showAttributesModal, setShowAttributesModal] = useState(false);
  const [focusAllocation, setFocusAllocation] = useState<FocusAllocation>({
    performance: 33,
    soundCapture: 33,
    layering: 34
  });

  const {
    startProject,
    handlePerformDailyWork,
    handleMinigameReward,
    handleSpendPerkPoint,
    advanceDay,
    purchaseEquipment,
    hireStaff,
    refreshCandidates,
    assignStaffToProject,
    unassignStaffFromProject,
    toggleStaffRest,
    handleOpenTrainingModal,
    sendStaffToTraining,
    selectedStaffForTraining,
    setSelectedStaffForTraining,
    lastReview,
    orbContainerRef,
    autoTriggeredMinigame,
    clearAutoTriggeredMinigame,
    contactArtist,
    triggerEraTransition
  } = useGameLogic(gameState, setGameState, focusAllocation);

  // Load initial candidates on mount
  useEffect(() => {
    if (!gameState.availableCandidates || gameState.availableCandidates.length === 0) {
      refreshCandidates();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <EnhancedAnimationStyles />
      
      <div className="container mx-auto p-4 space-y-4">
        <GameHeader 
          gameState={gameState} 
          onOpenSettings={() => setShowSettings(true)}
          hireStaff={hireStaff}
          refreshCandidates={refreshCandidates}
          assignStaffToProject={assignStaffToProject}
          unassignStaffFromProject={unassignStaffFromProject}
          toggleStaffRest={toggleStaffRest}
          openTrainingModal={handleOpenTrainingModal}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <LeftPanel gameState={gameState} startProject={startProject} />
          
          <div className="md:col-span-2">
            {React.cloneElement(
              <div ref={orbContainerRef}></div>,
              {}
            )}
          </div>
          
          <RightPanel
            gameState={gameState}
            showSkillsModal={showSkillsModal}
            setShowSkillsModal={setShowSkillsModal}
            showAttributesModal={showAttributesModal}
            setShowAttributesModal={setShowAttributesModal}
            spendPerkPoint={handleSpendPerkPoint}
            advanceDay={advanceDay}
            triggerEraTransition={triggerEraTransition}
            purchaseEquipment={purchaseEquipment}
            createBand={(bandName, memberIds) => {
              console.log('Creating band with:', bandName, memberIds);
            }}
            startTour={(bandId) => {
              console.log('Starting tour for band ID:', bandId);
            }}
            createOriginalTrack={(bandId) => {
              console.log('Creating original track for band ID:', bandId);
            }}
            contactArtist={contactArtist}
            hireStaff={hireStaff}
            refreshCandidates={refreshCandidates}
            assignStaffToProject={assignStaffToProject}
            unassignStaffFromProject={unassignStaffFromProject}
            toggleStaffRest={toggleStaffRest}
            openTrainingModal={handleOpenTrainingModal}
          />
        </div>
      </div>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        gameState={gameState}
        setGameState={setGameState}
      />
    </div>
  );
}
