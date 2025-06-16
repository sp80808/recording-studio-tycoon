import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GameState, PlayerAttributes, StaffMember, MusicGenre } from '@/types/game'; // Added MusicGenre
import { SkillsModal } from '@/components/modals/SkillsModal';
import { AttributesModal } from '@/components/modals/AttributesModal';
import { ResearchModal } from '@/components/modals/ResearchModal';
import { EquipmentModManagementModal } from '@/components/modals/EquipmentModManagementModal';
import { availableMods } from '@/data/equipmentMods';
import { EquipmentList } from '@/components/EquipmentList';
import { BandManagement, BandManagementProps } from '@/components/BandManagement'; // Assuming BandManagementProps is exported
import { ChartsPanel } from '@/components/ChartsPanel';
import { StudioProgressionPanel } from '@/components/StudioProgressionPanel';
import { StudioExpansion } from '@/components/StudioExpansion';
import { useStudioExpansion } from '@/hooks/useStudioExpansion';
// MusicGenre already imported from @/types/game

export interface RightPanelProps { // Ensured export
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>; // Added if needed by children like StudioExpansion
  showSkillsModal: boolean;
  setShowSkillsModal: React.Dispatch<React.SetStateAction<boolean>>;
  showAttributesModal: boolean;
  setShowAttributesModal: React.Dispatch<React.SetStateAction<boolean>>;
  spendPerkPoint: (attribute: keyof PlayerAttributes) => void;
  advanceDay: () => void;
  purchaseEquipment: (equipmentId: string) => void;
  createBand: (bandName: string, memberIds: string[], genre: MusicGenre) => void; // Corrected signature
  startTour: (bandId: string) => void;
  createOriginalTrack: (bandId: string) => void; // Assuming this is correct
  contactArtist: (artistId: string, offer: number) => void;
  hireStaff: (candidateIndex: number) => boolean;
  refreshCandidates: () => void;
  assignStaffToProject: (staffId: string) => void;
  unassignStaffFromProject: (staffId: string) => void;
  toggleStaffRest: (staffId: string) => void;
  openTrainingModal: (staff: StaffMember) => boolean;
  startResearchMod?: (staffId: string, modId: string) => boolean;
  applyModToEquipment?: (equipmentId: string, modId: string | null) => void;
  onOpenStudioPerks?: () => void; // Added for Studio Perks Panel
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
  onOpenStudioPerks,
}) => {
  const [activeTab, setActiveTab] = useState<'studio' | 'skills' | 'staff' | 'bands' | 'charts' | 'perks'>('studio'); // Added 'perks'
  const [showResearchModal, setShowResearchModal] = useState(false);
  const [showEquipmentModModal, setShowEquipmentModModal] = useState(false);
  const [selectedEquipmentForModding, setSelectedEquipmentForModding] = useState<GameState['ownedEquipment'][0] | null>(null);
  const { purchaseExpansion } = useStudioExpansion(gameState, setGameState);

  const handleAdvanceDay = () => {
    advanceDay();
  };

  // Props for BandManagement, ensuring createBand matches
  const bandManagementProps: BandManagementProps = {
    gameState,
    onCreateBand: createBand, // This now expects (name, members, genre)
    onStartTour: startTour,
    onCreateOriginalTrack: createOriginalTrack,
    // Add any other props BandManagement expects, like setGameState if needed for modals
  };

  return (
    <Card className="bg-gray-900/90 border-gray-600 p-4 h-full overflow-y-auto backdrop-blur-sm animate-slide-in-right">
      <div className="flex mb-4 bg-gray-800 rounded-lg p-1 flex-wrap">
        <button onClick={() => setActiveTab('studio')} className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors ${activeTab === 'studio' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>🏢 Studio</button>
        <button onClick={() => setActiveTab('skills')} className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors ${activeTab === 'skills' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>📊 Skills</button>
        <button onClick={() => setActiveTab('staff')} className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors ${activeTab === 'staff' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>👥 Staff</button>
        <button onClick={() => setActiveTab('bands')} className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors ${activeTab === 'bands' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>🎸 Bands</button>
        <button onClick={() => setActiveTab('charts')} className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors ${activeTab === 'charts' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>📈 Charts</button>
        {onOpenStudioPerks && <button onClick={() => onOpenStudioPerks()} className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors text-gray-400 hover:text-white`}>✨ Perks</button>}
      </div>

      {activeTab === 'studio' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Studio Actions</h2>
          <StudioExpansion gameState={gameState} onPurchaseExpansion={purchaseExpansion} />
          <StudioProgressionPanel gameState={gameState} />
          <Button onClick={handleAdvanceDay} className="w-full bg-purple-600 hover:bg-purple-700 text-white">Advance Day</Button>
          <EquipmentList purchaseEquipment={purchaseEquipment} gameState={gameState} />
          <div className="mt-6">
            <h3 className="text-lg font-bold text-white mb-3">🛠️ My Gear</h3>
            {gameState.ownedEquipment.length === 0 ? <p className="text-sm text-gray-400">No equipment owned.</p> : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {gameState.ownedEquipment.map(equip => {
                  const currentMod = equip.appliedModId ? availableMods.find(m => m.id === equip.appliedModId) : null;
                  return (
                    <Card key={equip.id} className="p-3 bg-gray-800/60 border-gray-700">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-semibold text-gray-200">{equip.icon} {equip.name} {currentMod && <span className="text-xs text-yellow-400 ml-1">{currentMod.nameSuffix || `(${currentMod.name})`}</span>}</p>
                          <p className="text-xs text-gray-400">Condition: {equip.condition}%</p>
                        </div>
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => { setSelectedEquipmentForModding(equip); setShowEquipmentModModal(true); }}>Manage Mods</Button>
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
          <Button onClick={() => setShowAttributesModal(true)} className="w-full">Upgrade Attributes</Button>
          <Button onClick={() => setShowSkillsModal(true)} className="w-full">View Studio Skills</Button>
          <StudioProgressionPanel gameState={gameState} />
        </div>
      )}

      {activeTab === 'staff' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">👥 Staff Management</h2>
          <Button onClick={refreshCandidates} className="w-full">🔄 Refresh Candidates</Button>
          <div className="space-y-2"><h3 className="text-lg font-semibold text-white">Available Staff</h3>
            {gameState.availableCandidates?.length > 0 ? gameState.availableCandidates.map((candidate, index) => (
              <div key={candidate.id || index} className="bg-gray-800 p-3 rounded-lg">
                <p>{candidate.name} ({candidate.role}) - ${candidate.salary}/day</p>
                <Button onClick={() => hireStaff(index)} disabled={gameState.money < candidate.salary * 3}>Hire for ${candidate.salary * 3}</Button>
              </div>
            )) : <p>No candidates.</p>}
          </div>
          {gameState.hiredStaff?.length > 0 && <div className="space-y-2 mt-6"><h3 className="text-lg font-semibold text-white">Current Staff</h3>
            {gameState.hiredStaff.map(staff => (
              <div key={staff.id} className="bg-gray-800 p-3 rounded-lg">
                <p>{staff.name} ({staff.role}) - Status: {staff.status}</p>
                <Button onClick={() => assignStaffToProject(staff.id)} disabled={staff.status !== 'Idle'}>Assign</Button>
                <Button onClick={() => unassignStaffFromProject(staff.id)} disabled={staff.status !== 'Working'}>Unassign</Button>
                <Button onClick={() => toggleStaffRest(staff.id)}>{staff.status === 'Resting' ? 'End Rest' : 'Rest'}</Button>
                {staff.role === 'Engineer' && staff.status === 'Idle' && startResearchMod && <Button onClick={() => setShowResearchModal(true)}>Research Mod</Button>}
              </div>
            ))}
          </div>}
        </div>
      )}

      {activeTab === 'bands' && <BandManagement {...bandManagementProps} />}
      {activeTab === 'charts' && <ChartsPanel gameState={gameState} onContactArtist={contactArtist} />}
      
      <SkillsModal isOpen={showSkillsModal} onClose={() => setShowSkillsModal(false)} studioSkills={gameState.studioSkills} />
      <AttributesModal isOpen={showAttributesModal} onClose={() => setShowAttributesModal(false)} playerData={gameState.playerData} spendPerkPoint={spendPerkPoint} />
      {startResearchMod && <ResearchModal isOpen={showResearchModal} onClose={() => setShowResearchModal(false)} gameState={gameState} startResearchMod={startResearchMod} />}
      {selectedEquipmentForModding && applyModToEquipment && <EquipmentModManagementModal isOpen={showEquipmentModModal} onClose={() => { setShowEquipmentModModal(false); setSelectedEquipmentForModding(null); }} equipment={selectedEquipmentForModding} gameState={gameState} onApplyMod={applyModToEquipment} />}
    </Card>
  );
};

export default RightPanel;
