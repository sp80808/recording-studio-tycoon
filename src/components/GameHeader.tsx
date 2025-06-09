
import React, { useState } from 'react';
import { GameState, StaffMember } from '@/types/game';
import { StaffManagementModal } from './modals/StaffManagementModal';
import { Button } from './ui/button';

interface GameHeaderProps {
  gameState: GameState;
  onOpenSettings: () => void;
  hireStaff: (candidateIndex: number) => boolean;
  refreshCandidates: () => void;
  assignStaffToProject: (staffId: string) => void;
  unassignStaffFromProject: (staffId: string) => void;
  toggleStaffRest: (staffId: string) => void;
  openTrainingModal: (staff: StaffMember) => boolean;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  gameState,
  onOpenSettings,
  hireStaff,
  refreshCandidates,
  assignStaffToProject,
  unassignStaffFromProject,
  toggleStaffRest,
  openTrainingModal
}) => {
  const [showStaffModal, setShowStaffModal] = useState(false);

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm border-b border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-white">Music Studio Tycoon</h1>
          <div className="text-sm text-gray-400">
            Day {gameState.currentDay} • {gameState.currentEra} • ${gameState.money.toLocaleString()}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowStaffModal(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            👥 Staff
          </Button>
          <Button
            onClick={onOpenSettings}
            className="bg-gray-600 hover:bg-gray-700"
          >
            ⚙️ Settings
          </Button>
        </div>
      </div>

      <StaffManagementModal
        gameState={gameState}
        isOpen={showStaffModal}
        onClose={() => setShowStaffModal(false)}
        hireStaff={hireStaff}
        refreshCandidates={refreshCandidates}
        assignStaffToProject={assignStaffToProject}
        unassignStaffFromProject={unassignStaffFromProject}
        toggleStaffRest={toggleStaffRest}
        openTrainingModal={openTrainingModal}
      />
    </div>
  );
};
