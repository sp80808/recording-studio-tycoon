import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GameState, PlayerAttributes } from '@/types/game';
import { SkillsModal } from '@/components/modals/SkillsModal';
import { AttributesModal } from '@/components/modals/AttributesModal';
import { EquipmentList } from '@/components/EquipmentList';
import { BandManagement } from '@/components/BandManagement';

interface RightPanelProps {
  gameState: GameState;
  showSkillsModal: boolean;
  setShowSkillsModal: React.Dispatch<React.SetStateAction<boolean>>;
  showAttributesModal: boolean;
  setShowAttributesModal: React.Dispatch<React.SetStateAction<boolean>>;
  spendPerkPoint: (attribute: keyof PlayerAttributes) => void;
  advanceDay: () => void;
  purchaseEquipment: (equipmentId: string) => void;
  createBand: (bandName: string, memberIds: string[]) => void;
  startTour: (bandId: string) => void;
  createOriginalTrack: (bandId: string) => void;
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
  createOriginalTrack
}) => {
  const [activeTab, setActiveTab] = useState<'studio' | 'skills' | 'bands'>('studio');

  const handleAdvanceDay = () => {
    advanceDay();
  };

  return (
    <Card className="bg-gray-900/90 border-gray-600 p-4 h-full overflow-y-auto backdrop-blur-sm animate-slide-in-right">
      {/* Tab Navigation */}
      <div className="flex mb-4 bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('studio')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'studio'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          🏢 Studio
        </button>
        <button
          onClick={() => setActiveTab('skills')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'skills'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          📊 Skills
        </button>
        <button
          onClick={() => setActiveTab('bands')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'bands'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          🎸 Bands
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'studio' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Studio Actions</h2>
          <Button onClick={handleAdvanceDay} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
            Advance Day
          </Button>
          <EquipmentList purchaseEquipment={purchaseEquipment} gameState={gameState} />
        </div>
      )}

      {activeTab === 'skills' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Player Progression</h2>
          <div className="text-gray-300">Level: {gameState.playerData.level}</div>
          <div className="text-gray-300">XP: {gameState.playerData.xp} / {gameState.playerData.xpToNextLevel}</div>
          <div className="text-green-400">Perk Points: {gameState.playerData.perkPoints}</div>

          <Button onClick={() => setShowAttributesModal(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            Upgrade Attributes
          </Button>
          <Button onClick={() => setShowSkillsModal(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            View Studio Skills
          </Button>
        </div>
      )}

      {activeTab === 'bands' && (
        <BandManagement
          gameState={gameState}
          onCreateBand={createBand}
          onStartTour={startTour}
          onCreateOriginalTrack={createOriginalTrack}
        />
      )}

      <SkillsModal
        isOpen={showSkillsModal}
        onClose={() => setShowSkillsModal(false)}
        studioSkills={gameState.studioSkills}
      />

      <AttributesModal
        isOpen={showAttributesModal}
        onClose={() => setShowAttributesModal(false)}
        playerData={gameState.playerData}
        spendPerkPoint={spendPerkPoint}
      />
    </Card>
  );
};
