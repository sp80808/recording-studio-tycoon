
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GameState } from '@/types/game';
import { PlayerAttributesModal } from './modals/PlayerAttributesModal';
import { EraProgressModal } from './modals/EraProgressModal';
import { EquipmentList } from './EquipmentList';
import { BandManagement } from './BandManagement';
import { EnhancedChartsPanel } from './EnhancedChartsPanel';

interface RightPanelProps {
  gameState: GameState;
  showSkillsModal: boolean;
  setShowSkillsModal: React.Dispatch<React.SetStateAction<boolean>>;
  showAttributesModal: boolean;
  setShowAttributesModal: React.Dispatch<React.SetStateAction<boolean>>;
  spendPerkPoint: (attribute: keyof import("@/types/game").PlayerAttributes) => void;
  advanceDay: () => void;
  purchaseEquipment: (equipmentId: string) => void;
  createBand: (bandName: string, memberIds: string[]) => void;
  startTour: (bandId: string) => void;
  createOriginalTrack: (bandId: string) => void;
  hireStaff: (candidateIndex: number) => boolean;
  refreshCandidates: () => void;
  assignStaffToProject: (staffId: string) => void;
  unassignStaffFromProject: (staffId: string) => void;
  toggleStaffRest: (staffId: string) => void;
  openTrainingModal: (staff: any) => boolean;
  contactArtist: (artistId: string, offer: number) => void;
  triggerEraTransition: () => { fromEra?: string; toEra?: string } | void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  gameState,
  showSkillsModal,
  setShowSkillsModal,
  showAttributesModal,
  setShowAttributesModal,
  spendPerkPoint,
  advanceDay,
  purchaseEquipment,
  createBand,
  startTour,
  createOriginalTrack,
  hireStaff,
  refreshCandidates,
  assignStaffToProject,
  unassignStaffFromProject,
  toggleStaffRest,
  openTrainingModal,
  contactArtist,
  triggerEraTransition
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showEraModal, setShowEraModal] = useState(false);

  return (
    <Card className="bg-gray-800/50 border-gray-600 backdrop-blur-sm animate-fade-in">
      <div className="p-4">
        <div className="flex flex-wrap gap-1 mb-4">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('overview')}
            className="text-xs"
          >
            📊 Overview
          </Button>
          <Button
            variant={activeTab === 'equipment' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('equipment')}
            className="text-xs"
          >
            🎛️ Equipment
          </Button>
          <Button
            variant={activeTab === 'bands' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('bands')}
            className="text-xs"
          >
            🎸 Bands
          </Button>
          <Button
            variant={activeTab === 'charts' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('charts')}
            className="text-xs"
          >
            📈 Charts
          </Button>
        </div>

        <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
          {activeTab === 'overview' && (
            <>
              <PlayerAttributesModal 
                showAttributesModal={showAttributesModal}
                setShowAttributesModal={setShowAttributesModal}
                spendPerkPoint={spendPerkPoint}
                playerData={gameState.playerData}
              />
              
              <Button
                onClick={() => setShowEraModal(true)}
                className="w-full bg-purple-600 hover:bg-purple-700 mb-4"
              >
                🌟 Era Progress
              </Button>
              
              <Button 
                onClick={advanceDay}
                className="w-full bg-green-600 hover:bg-green-700 py-3 text-lg font-bold"
                disabled={gameState.playerData.dailyWorkCapacity > 0}
              >
                {gameState.playerData.dailyWorkCapacity > 0 ? (
                  `⏰ End Day (${gameState.playerData.dailyWorkCapacity} energy left)`
                ) : (
                  '🌅 Advance to Next Day'
                )}
              </Button>
            </>
          )}

          {activeTab === 'equipment' && (
            <EquipmentList 
              gameState={gameState}
              purchaseEquipment={purchaseEquipment}
            />
          )}

          {activeTab === 'bands' && (
            <BandManagement
              gameState={gameState}
              onCreateBand={createBand}
              onStartTour={startTour}
              onCreateOriginalTrack={createOriginalTrack}
            />
          )}

          {activeTab === 'charts' && (
            <EnhancedChartsPanel
              gameState={gameState}
              onContactArtist={contactArtist}
            />
          )}
        </div>
      </div>

      <EraProgressModal 
        isOpen={showEraModal}
        onClose={() => setShowEraModal(false)}
        gameState={gameState}
        triggerEraTransition={triggerEraTransition}
      />
    </Card>
  );
};
