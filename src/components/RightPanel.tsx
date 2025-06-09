
import React, { useState } from 'react';
import { GameState, PlayerAttributes, StaffMember } from '@/types/game';
import { PlayerAttributesModal } from './modals/PlayerAttributesModal';
import { StaffManagementModal } from './modals/StaffManagementModal';
import { SettingsModal } from './modals/SettingsModal';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface RightPanelProps {
  gameState: GameState;
  setGameState: (state: GameState | ((prev: GameState) => GameState)) => void;
  hireStaff: (candidateIndex: number) => boolean;
  refreshCandidates: () => void;
  assignStaffToProject: (staffId: string) => void;
  unassignStaffFromProject: (staffId: string) => void;
  toggleStaffRest: (staffId: string) => void;
  openTrainingModal: (staff: StaffMember) => void;
  createBand: () => void;
  spendPerkPoint: (attribute: keyof PlayerAttributes) => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  gameState,
  setGameState,
  hireStaff,
  refreshCandidates,
  assignStaffToProject,
  unassignStaffFromProject,
  toggleStaffRest,
  openTrainingModal,
  createBand,
  spendPerkPoint
}) => {
  const [showAttributesModal, setShowAttributesModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  return (
    <div className="w-80 bg-gray-900/90 backdrop-blur-sm border-l border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        
        <div className="space-y-2">
          <Button
            onClick={() => setShowAttributesModal(true)}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            🎯 Player Attributes
          </Button>
          
          <Button
            onClick={() => setShowStaffModal(true)}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            👥 Staff Management
          </Button>
          
          <Button
            onClick={createBand}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            🎸 Create Band
          </Button>
          
          <Button
            onClick={() => setShowSettingsModal(true)}
            className="w-full bg-gray-600 hover:bg-gray-700"
          >
            ⚙️ Settings
          </Button>
        </div>
      </div>

      {/* Player Stats */}
      <div className="p-4">
        <Card className="p-3 bg-gray-800/50 border-gray-600">
          <h3 className="text-sm font-semibold text-white mb-2">Player Stats</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Level:</span>
              <span className="text-white">{gameState.playerData.level}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Experience:</span>
              <span className="text-white">{gameState.playerData.experience}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Reputation:</span>
              <span className="text-white">{gameState.playerData.reputation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Money:</span>
              <span className="text-green-400">${gameState.money.toLocaleString()}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Modals */}
      <PlayerAttributesModal
        isOpen={showAttributesModal}
        onClose={() => setShowAttributesModal(false)}
        spendPerkPoint={spendPerkPoint}
        playerData={gameState.playerData}
      />

      <StaffManagementModal
        isOpen={showStaffModal}
        onClose={() => setShowStaffModal(false)}
        gameState={gameState}
        hireStaff={hireStaff}
        refreshCandidates={refreshCandidates}
        assignStaffToProject={assignStaffToProject}
        unassignStaffFromProject={unassignStaffFromProject}
        toggleStaffRest={toggleStaffRest}
        openTrainingModal={openTrainingModal}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        gameState={gameState}
        setGameState={setGameState}
      />
    </div>
  );
};
