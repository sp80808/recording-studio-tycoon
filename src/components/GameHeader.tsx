
import React, { useState } from 'react';
import { GameState, StaffMember } from '@/types/game';
import { StaffManagementModal } from './modals/StaffManagementModal';
import { EraProgress } from './EraProgress';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';

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
  const [showEraModal, setShowEraModal] = useState(false);

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm border-b border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-white">Music Studio Tycoon</h1>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Dialog open={showEraModal} onOpenChange={setShowEraModal}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="text-gray-400 hover:text-white">
                  Day {gameState.currentDay}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-700">
                <EraProgress 
                  gameState={gameState}
                  triggerEraTransition={() => setShowEraModal(false)}
                />
              </DialogContent>
            </Dialog>
            <span>•</span>
            <span>{gameState.currentEra}</span>
            <span>•</span>
            <span>${gameState.money.toLocaleString()}</span>
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
