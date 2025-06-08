import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GameState, PlayerAttributes, StaffMember } from '@/types/game';
import { SkillsModal } from '@/components/modals/SkillsModal';
import { AttributesModal } from '@/components/modals/AttributesModal';
import { RecruitmentModal } from '@/components/modals/RecruitmentModal';
import { StaffManagementModal } from '@/components/modals/StaffManagementModal';
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
  // Staff management props
  hireStaff: (candidateIndex: number) => boolean;
  refreshCandidates: () => void;
  assignStaffToProject: (staffId: string) => void;
  unassignStaffFromProject: (staffId: string) => void;
  toggleStaffRest: (staffId: string) => void;
  openTrainingModal: (staff: StaffMember) => void;
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
  openTrainingModal
}) => {
  const [activeTab, setActiveTab] = useState<'studio' | 'skills' | 'bands' | 'staff'>('studio');
  const [showRecruitmentModal, setShowRecruitmentModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);

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
          onClick={() => setActiveTab('staff')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'staff'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          👥 Staff
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

      {activeTab === 'staff' && gameState.playerData.level >= 2 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Staff Management</h2>
          
          {/* Staff Overview */}
          <div className="bg-gray-800 p-3 rounded-lg">
            <div className="text-gray-300 text-sm mb-2">Current Staff</div>
            <div className="text-white font-bold text-lg">
              {gameState.hiredStaff.length} / 10 Staff Members
            </div>
            {gameState.hiredStaff.length > 0 && (
              <div className="text-gray-400 text-xs mt-1">
                Daily Cost: ${gameState.hiredStaff.reduce((total, staff) => total + staff.salary, 0)}
              </div>
            )}
          </div>

          {/* Recruitment Center */}
          <Button 
            onClick={() => setShowRecruitmentModal(true)} 
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            🎯 Recruitment Center
          </Button>

          {/* Staff Management */}
          {gameState.hiredStaff.length > 0 && (
            <Button 
              onClick={() => setShowStaffModal(true)} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              👥 Manage Staff ({gameState.hiredStaff.length})
            </Button>
          )}

          {/* Quick Stats */}
          {gameState.hiredStaff.length > 0 && (
            <div className="bg-gray-800 p-3 rounded-lg space-y-2">
              <div className="text-gray-300 text-sm">Staff Status</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-green-400">
                  Working: {gameState.hiredStaff.filter(s => s.status === 'Working').length}
                </div>
                <div className="text-blue-400">
                  Idle: {gameState.hiredStaff.filter(s => s.status === 'Idle').length}
                </div>
                <div className="text-yellow-400">
                  Resting: {gameState.hiredStaff.filter(s => s.status === 'Resting').length}
                </div>
                <div className="text-purple-400">
                  Training: {gameState.hiredStaff.filter(s => s.status === 'Training').length}
                </div>
              </div>
            </div>
          )}

          {gameState.hiredStaff.length === 0 && (
            <div className="text-center text-gray-400 py-4">
              <div className="text-4xl mb-2">👥</div>
              <div className="text-sm">No staff hired yet</div>
              <div className="text-xs mt-1">Visit the Recruitment Center to build your team!</div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'staff' && gameState.playerData.level < 2 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Staff Management</h2>
          <div className="text-center text-gray-400 py-8">
            <div className="text-4xl mb-2">🔒</div>
            <div className="text-sm">Staff management unlocks at Level 2</div>
            <div className="text-xs mt-1">Keep working on projects to gain experience!</div>
          </div>
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

      <RecruitmentModal
        gameState={gameState}
        showRecruitmentModal={showRecruitmentModal}
        setShowRecruitmentModal={setShowRecruitmentModal}
        hireStaff={hireStaff}
        refreshCandidates={refreshCandidates}
      />

      <StaffManagementModal
        gameState={gameState}
        showStaffModal={showStaffModal}
        setShowStaffModal={setShowStaffModal}
        assignStaffToProject={assignStaffToProject}
        unassignStaffFromProject={unassignStaffFromProject}
        toggleStaffRest={toggleStaffRest}
        openTrainingModal={openTrainingModal}
      />
    </Card>
  );
};
