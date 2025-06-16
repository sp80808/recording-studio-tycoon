import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GameState, PlayerAttributes, StaffMember } from '@/types/game';
import { SkillsModal } from '@/components/modals/SkillsModal';
import { AttributesModal } from '@/components/modals/AttributesModal';
import { ResearchModal } from '@/components/modals/ResearchModal';
import { EquipmentModManagementModal } from '@/components/modals/EquipmentModManagementModal';
import { availableMods } from '@/data/equipmentMods';
import { EquipmentList } from '@/components/EquipmentList';
import { BandManagement } from '@/components/BandManagement';
import { ChartsPanel } from '@/components/ChartsPanel';
import { StudioProgressionPanel } from '@/components/StudioProgressionPanel';
import { StudioExpansion } from '@/components/StudioExpansion';
import { useStudioExpansion } from '@/hooks/useStudioExpansion';

interface RightPanelProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
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
  contactArtist: (artistId: string, offer: number) => void;
  hireStaff: (candidateIndex: number) => boolean;
  refreshCandidates: () => void;
  assignStaffToProject: (staffId: string) => void;
  unassignStaffFromProject: (staffId: string) => void;
  toggleStaffRest: (staffId: string) => void;
  openTrainingModal: (staff: StaffMember) => boolean;
  startResearchMod?: (staffId: string, modId: string) => boolean;
  applyModToEquipment?: (equipmentId: string, modId: string | null) => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  gameState,
  setGameState,
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
  contactArtist,
  hireStaff,
  refreshCandidates,
  assignStaffToProject,
  unassignStaffFromProject,
  toggleStaffRest,
  openTrainingModal,
  startResearchMod,
  applyModToEquipment,
}) => {
  const [activeTab, setActiveTab] = useState<'studio' | 'skills' | 'bands' | 'charts' | 'staff'>('studio');
  const [showResearchModal, setShowResearchModal] = useState(false);
  const [showEquipmentModModal, setShowEquipmentModModal] = useState(false);
  const [selectedEquipmentForModding, setSelectedEquipmentForModding] = useState<GameState['ownedEquipment'][0] | null>(null);
  const { purchaseExpansion } = useStudioExpansion(gameState, setGameState);

  const handleAdvanceDay = () => {
    advanceDay();
  };

  return (
    <Card className="bg-gray-900/90 border-gray-600 p-4 h-full overflow-y-auto backdrop-blur-sm animate-slide-in-right">
      {/* Tab Navigation */}
      <div className="flex mb-4 bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('studio')}
          className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'studio'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          🏢 Studio
        </button>
        <button
          onClick={() => setActiveTab('skills')}
          className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'skills'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          📊 Skills
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'staff'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          👥 Staff
        </button>
        <button
          onClick={() => setActiveTab('bands')}
          className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'bands'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          🎸 Bands
        </button>
        <button
          onClick={() => setActiveTab('charts')}
          className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'charts'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          📈 Charts
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'studio' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Studio Actions</h2>
          
          <StudioExpansion
            gameState={gameState}
            onPurchaseExpansion={purchaseExpansion}
          />
          
          <StudioProgressionPanel gameState={gameState} />
          
          <Button onClick={handleAdvanceDay} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
            Advance Day
          </Button>
          
          <EquipmentList purchaseEquipment={purchaseEquipment} gameState={gameState} />

          {/* Owned Equipment Section */}
          <div className="mt-6">
            <h3 className="text-lg font-bold text-white mb-3">🛠️ My Gear</h3>
            {gameState.ownedEquipment.length === 0 ? (
              <p className="text-sm text-gray-400">You don't own any equipment yet. Purchase some from the shop!</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {gameState.ownedEquipment.map(equip => {
                  const currentMod = equip.appliedModId ? availableMods.find(m => m.id === equip.appliedModId) : null;
                  return (
                    <Card key={equip.id} className="p-3 bg-gray-800/60 border-gray-700">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-semibold text-gray-200">
                            {equip.icon} {equip.name} 
                            {currentMod && <span className="text-xs text-yellow-400 ml-1">{currentMod.nameSuffix || `(${currentMod.name})`}</span>}
                          </p>
                          <p className="text-xs text-gray-400">Condition: {equip.condition}%</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs border-blue-500 text-blue-300 hover:bg-blue-500/20 px-2 py-1 h-auto"
                          onClick={() => {
                            setSelectedEquipmentForModding(equip);
                            setShowEquipmentModModal(true);
                          }}
                        >
                          Manage Mods
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
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

      {activeTab === 'staff' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">👥 Staff Management</h2>
          
          <div className="text-sm text-gray-400 mb-4">
            Hire and manage studio staff to help with projects
          </div>

          <Button 
            onClick={refreshCandidates} 
            className="w-full bg-green-600 hover:bg-green-700 text-white mb-4"
          >
            🔄 Refresh Candidates
          </Button>

          {/* Staff candidates section */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">Available Staff</h3>
            {gameState.availableCandidates && gameState.availableCandidates.length > 0 ? (
              gameState.availableCandidates.map((candidate, index) => (
                <div key={candidate.id || index} className="bg-gray-800 p-3 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-white font-medium">{candidate.name}</div>
                      <div className="text-gray-400 text-sm">{candidate.role}</div>
                    </div>
                    <div className="text-green-400 font-bold">${candidate.salary}/day</div>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    Creativity: {candidate.primaryStats.creativity}, Technical: {candidate.primaryStats.technical}, Speed: {candidate.primaryStats.speed}
                  </div>
                  {candidate.genreAffinity && (
                    <div className="text-xs text-purple-400 mb-2">
                      Specialty: {candidate.genreAffinity.genre} (+{candidate.genreAffinity.bonus}%)
                    </div>
                  )}
                  <Button 
                    onClick={() => hireStaff(index)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-1"
                    disabled={gameState.money < candidate.salary * 3}
                  >
                    {gameState.money >= candidate.salary * 3 ? `Hire for $${candidate.salary * 3}` : 'Insufficient Funds'}
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-center py-4">
                No candidates available. Click refresh to find new staff!
              </div>
            )}
          </div>

          {/* Hired staff section */}
          {gameState.hiredStaff && gameState.hiredStaff.length > 0 && (
            <div className="space-y-2 mt-6">
              <h3 className="text-lg font-semibold text-white">Current Staff</h3>
              {gameState.hiredStaff.map(staff => (
                <div key={staff.id} className="bg-gray-800 p-3 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-white font-medium">{staff.name}</div>
                      <div className="text-gray-400 text-sm">{staff.role}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 text-sm">${staff.salary}/day</div>
                      <div className={`text-xs ${
                        staff.status === 'Working' ? 'text-blue-400' : 
                        staff.status === 'Idle' ? 'text-gray-400' : 
                        staff.status === 'Resting' ? 'text-yellow-400' : 'text-purple-400'
                      }`}>
                        {staff.status}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {staff.status === 'Idle' && (
                      <Button 
                        onClick={() => assignStaffToProject(staff.id)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1"
                      >
                        Assign to Project
                      </Button>
                    )}
                    {staff.status === 'Working' && (
                      <Button 
                        onClick={() => unassignStaffFromProject(staff.id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-1"
                      >
                        Unassign
                      </Button>
                    )}
                    <Button 
                      onClick={() => toggleStaffRest(staff.id)}
                      className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs py-1"
                    >
                      {staff.status === 'Resting' ? 'End Rest' : 'Rest'}
                    </Button>
                    {staff.role === 'Engineer' && staff.status === 'Idle' && (
                      <Button
                        onClick={() => {
                          setShowResearchModal(true);
                        }}
                        className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-xs py-1"
                      >
                        Research Mod
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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

      {activeTab === 'charts' && gameState.playerData.level >= 1 && (                  <ChartsPanel
          gameState={gameState}
          onContactArtist={contactArtist}
        />
      )}

      {activeTab === 'charts' && gameState.playerData.level < 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">📈 Industry Charts</h2>
          <div className="text-center text-gray-400 py-8">
            <div className="text-4xl mb-2">🔒</div>
            <div className="text-sm">Charts access unlocks at Level 1</div>
            <div className="text-xs mt-1">Complete projects to access industry charts!</div>
          </div>
        </div>
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
      {/* Render ResearchModal if startResearchMod is available */}
      {startResearchMod && (
        <ResearchModal
          isOpen={showResearchModal}
          onClose={() => {
            setShowResearchModal(false);
          }}
          gameState={gameState}
          startResearchMod={startResearchMod}
        />
      )}

      {selectedEquipmentForModding && applyModToEquipment && ( // Ensure applyModToEquipment is available
        <EquipmentModManagementModal
          isOpen={showEquipmentModModal}
          onClose={() => {
            setShowEquipmentModModal(false);
            setSelectedEquipmentForModding(null);
          }}
          equipment={selectedEquipmentForModding}
          gameState={gameState}
          onApplyMod={applyModToEquipment} // Pass the actual function
        />
      )}

      {activeTab === 'skills' && (
        <div className="mt-6">
          <StudioProgressionPanel gameState={gameState} />
        </div>
      )}
    </Card>
  );
};

export default RightPanel;
