
import React, { useState } from 'react';
import { GameState, PlayerAttributes, StaffMember } from '@/types/game';
import { PlayerAttributesModal } from './modals/PlayerAttributesModal';
import { StaffManagementModal } from './modals/StaffManagementModal';
import { SettingsModal } from './modals/SettingsModal';
import { EquipmentList } from './EquipmentList';
import { BandManagement } from './BandManagement';
import { ChartsPanel } from './ChartsPanel';
import { EraProgress } from './EraProgress';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface RightPanelProps {
  gameState: GameState;
  setGameState: (state: GameState | ((prev: GameState) => GameState)) => void;
  hireStaff: (candidateIndex: number) => boolean;
  refreshCandidates: () => void;
  assignStaffToProject: (staffId: string) => void;
  unassignStaffFromProject: (staffId: string) => void;
  toggleStaffRest: (staffId: string) => void;
  openTrainingModal: (staff: StaffMember) => boolean;
  createBand: (bandName: string, memberIds: string[]) => void;
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

  const buyEquipment = (equipmentId: string) => {
    setGameState((prev) => ({
      ...prev,
      equipment: [...prev.equipment, equipmentId],
      money: prev.money - 1000,
    }));
  };

  const createOriginalTrack = () => {
    setGameState((prev) => ({
      ...prev,
      originalTracks: prev.originalTracks + 1,
    }));
  };

  return (
    <div className="w-80 bg-gray-900/90 backdrop-blur-sm border-l border-gray-700 flex flex-col">
      <Tabs defaultValue="actions" className="flex-1">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800">
          <TabsTrigger value="actions" className="text-white text-xs">Actions</TabsTrigger>
          <TabsTrigger value="equipment" className="text-white text-xs">Equipment</TabsTrigger>
          <TabsTrigger value="bands" className="text-white text-xs">Bands</TabsTrigger>
          <TabsTrigger value="charts" className="text-white text-xs">Charts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="actions" className="p-4">
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
              onClick={() => createBand('', [])}
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

          <Card className="p-3 bg-gray-800/50 border-gray-600 mt-4">
            <h3 className="text-sm font-semibold text-white mb-2">Player Stats</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Level:</span>
                <span className="text-white">{gameState.playerData.level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Experience:</span>
                <span className="text-white">{gameState.playerData.xp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Reputation:</span>
                <span className="text-white">{gameState.reputation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Money:</span>
                <span className="text-green-400">${gameState.money.toLocaleString()}</span>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="equipment" className="p-4">
          <EquipmentList gameState={gameState} purchaseEquipment={buyEquipment} />
        </TabsContent>

        <TabsContent value="bands" className="p-4">
          <BandManagement
            gameState={gameState}
            onCreateBand={createBand}
            onCreateOriginalTrack={createOriginalTrack}
            onStartTour={() => {}}
          />
        </TabsContent>

        <TabsContent value="charts" className="p-4">
          <ChartsPanel 
            gameState={gameState} 
            onContactArtist={() => {}}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <PlayerAttributesModal
        isOpen={showAttributesModal}
        onClose={() => setShowAttributesModal(false)}
        spendPerkPoint={spendPerkPoint}
        playerData={gameState.playerData}
      />

      <StaffManagementModal
        gameState={gameState}
        hireStaff={hireStaff}
        refreshCandidates={refreshCandidates}
        assignStaffToProject={assignStaffToProject}
        unassignStaffFromProject={unassignStaffFromProject}
        toggleStaffRest={toggleStaffRest}
        openTrainingModal={openTrainingModal}
        isOpen={showStaffModal}
        onClose={() => setShowStaffModal(false)}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
};
