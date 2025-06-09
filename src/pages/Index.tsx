
import React, { useState, useEffect } from 'react';
import { GameLayout } from '@/components/GameLayout';
import { MainGameContent } from '@/components/MainGameContent';
import { GameHeader } from '@/components/GameHeader';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { EraSelectionModal } from '@/components/EraSelectionModal';
import { SplashScreen } from '@/components/SplashScreen';
import { TutorialModal } from '@/components/TutorialModal';
import { useGameState } from '@/hooks/useGameState';
import { useGameLogic } from '@/hooks/useGameLogic';
import { FocusAllocation } from '@/types/game';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';

const Index = () => {
  const { gameState, setGameState } = useGameState();
  const [showSplash, setShowSplash] = useState(true);
  const [showEraSelection, setShowEraSelection] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [focusAllocation, setFocusAllocation] = useState<FocusAllocation>({
    performance: 34,
    soundCapture: 33,
    layering: 33
  });

  // Background music
  useBackgroundMusic();

  // Game logic hook
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
    orbContainerRef,
    contactArtist,
    triggerEraTransition
  } = useGameLogic(gameState, setGameState, focusAllocation);

  // Handle splash screen completion
  const handleSplashComplete = () => {
    setShowSplash(false);
    setShowEraSelection(true);
  };

  // Handle era selection
  const handleEraSelect = (era: string) => {
    const eraStartYears: Record<string, number> = {
      '1960s': 1960,
      '1970s': 1970,
      '1980s': 1980,
      '1990s': 1990,
      '2000s': 2000,
      '2010s': 2010,
      '2020s': 2020
    };

    setGameState(prev => ({
      ...prev,
      selectedEra: era,
      currentEra: era,
      currentYear: eraStartYears[era] || 2000,
      eraStartYear: eraStartYears[era] || 2000
    }));
    
    setShowEraSelection(false);
    setShowTutorial(true);
  };

  // Auto-save effect
  useEffect(() => {
    const interval = setInterval(() => {
      localStorage.setItem('musicStudioTycoon_gameState', JSON.stringify(gameState));
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(interval);
  }, [gameState]);

  // Don't render main content until era is selected
  if (showSplash || showEraSelection || showTutorial) {
    return (
      <>
        {showSplash && (
          <SplashScreen 
            onComplete={handleSplashComplete}
          />
        )}
        
        {showEraSelection && (
          <EraSelectionModal
            isOpen={showEraSelection}
            onEraSelect={handleEraSelect}
          />
        )}
        
        {showTutorial && (
          <TutorialModal
            isOpen={showTutorial}
            onClose={() => setShowTutorial(false)}
          />
        )}
      </>
    );
  }

  // Placeholder functions for band management
  const createBand = (bandName: string, memberIds: string[]) => {
    console.log('Creating band:', bandName, memberIds);
    // TODO: Implement band creation logic
  };

  const startTour = (bandId: string) => {
    console.log('Starting tour for band:', bandId);
    // TODO: Implement tour logic
  };

  const createOriginalTrack = (bandId: string) => {
    console.log('Creating original track for band:', bandId);
    // TODO: Implement original track creation logic
  };

  return (
    <GameLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
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
        
        <MainGameContent
          gameState={gameState}
          setGameState={setGameState}
          focusAllocation={focusAllocation}
          setFocusAllocation={setFocusAllocation}
          startProject={startProject}
          performDailyWork={handlePerformDailyWork}
          onMinigameReward={handleMinigameReward}
          spendPerkPoint={handleSpendPerkPoint}
          advanceDay={advanceDay}
          purchaseEquipment={purchaseEquipment}
          hireStaff={hireStaff}
          refreshCandidates={refreshCandidates}
          assignStaffToProject={assignStaffToProject}
          unassignStaffFromProject={unassignStaffFromProject}
          toggleStaffRest={toggleStaffRest}
          openTrainingModal={handleOpenTrainingModal}
          orbContainerRef={orbContainerRef}
          contactArtist={contactArtist}
          triggerEraTransition={triggerEraTransition}
          createBand={createBand}
          startTour={startTour}
          createOriginalTrack={createOriginalTrack}
        />

        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      </div>
    </GameLayout>
  );
};

export default Index;
