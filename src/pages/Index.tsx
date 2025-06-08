
import React, { useState } from 'react';
import { GameLayout } from '@/components/GameLayout';
import { GameHeader } from '@/components/GameHeader';
import { MainGameContent } from '@/components/MainGameContent';
import { NotificationSystem } from '@/components/NotificationSystem';
import { TrainingModal } from '@/components/modals/TrainingModal';
import { GameModals } from '@/components/GameModals';
import { useGameState } from '@/hooks/useGameState';
import { useGameLogic } from '@/hooks/useGameLogic';

const MusicStudioTycoon = () => {
  const { gameState, setGameState, focusAllocation, setFocusAllocation } = useGameState();
  
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
    orbContainerRef
  } = useGameLogic(gameState, setGameState, focusAllocation);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);

  const removeNotification = (id: string) => {
    setGameState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== id)
    }));
  };

  const handleManageStaff = () => {
    setShowStaffModal(true);
  };

  return (
    <GameLayout>
      <GameHeader 
        gameState={gameState} 
        onManageStaff={gameState.hiredStaff.length > 0 ? handleManageStaff : undefined}
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
      />

      <TrainingModal
        isOpen={showTrainingModal}
        onClose={() => {
          setShowTrainingModal(false);
          setSelectedStaffForTraining(null);
        }}
        staff={selectedStaffForTraining}
        gameState={gameState}
        sendStaffToTraining={sendStaffToTraining}
      />

      <NotificationSystem
        notifications={gameState.notifications}
        removeNotification={removeNotification}
      />

      <GameModals
        showReviewModal={showReviewModal}
        setShowReviewModal={setShowReviewModal}
        lastReview={lastReview}
      />
    </GameLayout>
  );
};

export default MusicStudioTycoon;
