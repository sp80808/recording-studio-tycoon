
import React from 'react';
import { GameState, StaffMember } from '@/types/game';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { TrainingModal } from '@/components/modals/TrainingModal';
import { StaffManagementModal } from '@/components/modals/StaffManagementModal';
import { PlayerAttributesModal } from '@/components/modals/PlayerAttributesModal';
import { CreateBandModal } from '@/components/modals/CreateBandModal';
import type { Band } from '@/types/bands';

interface GameModalsProps {
  gameState: GameState;
  showSettings: boolean;
  setShowSettings: React.Dispatch<React.SetStateAction<boolean>>;
  showTrainingModal: boolean;
  setShowTrainingModal: React.Dispatch<React.SetStateAction<boolean>>;
  selectedStaff: StaffMember | null;
  trainStaff: (staff: StaffMember, skill: string) => void;
  showStaffModal: boolean;
  setShowStaffModal: React.Dispatch<React.SetStateAction<boolean>>;
  hireStaff: (candidateIndex: number) => boolean;
  refreshCandidates: () => void;
  assignStaffToProject: (staffId: string) => void;
  unassignStaffFromProject: (staffId: string) => void;
  toggleStaffRest: (staffId: string) => void;
  openTrainingModal: (staff: StaffMember) => boolean;
  showAttributesModal: boolean;
  setShowAttributesModal: React.Dispatch<React.SetStateAction<boolean>>;
  spendPerkPoint: (attribute: string) => void;
  showBandModal: boolean;
  setShowBandModal: React.Dispatch<React.SetStateAction<boolean>>;
  createBand: (bandName: string, memberIds: string[]) => void;
  selectedBand: Band | null;
  setSelectedBand: React.Dispatch<React.SetStateAction<Band | null>>;
  recruitMember: (band: Band, member: StaffMember) => void;
  showRecruitmentModal: boolean;
  setShowRecruitmentModal: React.Dispatch<React.SetStateAction<boolean>>;
  showStudioModal: boolean;
  setShowStudioModal: React.Dispatch<React.SetStateAction<boolean>>;
  upgradeStudio: (studioId: string) => void;
  showSkillsModal: boolean;
  setShowSkillsModal: React.Dispatch<React.SetStateAction<boolean>>;
  showEraProgressModal: boolean;
  setShowEraProgressModal: React.Dispatch<React.SetStateAction<boolean>>;
  showCreateBandModal: boolean;
  setShowCreateBandModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export const GameModals: React.FC<GameModalsProps> = ({
  gameState,
  showSettings,
  setShowSettings,
  showTrainingModal,
  setShowTrainingModal,
  selectedStaff,
  trainStaff,
  showStaffModal,
  setShowStaffModal,
  hireStaff,
  refreshCandidates,
  assignStaffToProject,
  unassignStaffFromProject,
  toggleStaffRest,
  openTrainingModal,
  showAttributesModal,
  setShowAttributesModal,
  spendPerkPoint,
  showBandModal,
  setShowBandModal,
  createBand,
  selectedBand,
  setSelectedBand,
  recruitMember,
  showRecruitmentModal,
  setShowRecruitmentModal,
  showStudioModal,
  setShowStudioModal,
  upgradeStudio,
  showSkillsModal,
  setShowSkillsModal,
  showEraProgressModal,
  setShowEraProgressModal,
  showCreateBandModal,
  setShowCreateBandModal
}) => {
  return (
    <>
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {showTrainingModal && selectedStaff && (
        <TrainingModal
          isOpen={showTrainingModal}
          onClose={() => setShowTrainingModal(false)}
          staff={selectedStaff}
          onTrain={(skill) => trainStaff(selectedStaff, skill)}
        />
      )}

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

      <PlayerAttributesModal
        isOpen={showAttributesModal}
        onClose={() => setShowAttributesModal(false)}
        spendPerkPoint={spendPerkPoint}
        playerData={gameState?.playerData}
      />

      {showCreateBandModal && (
        <CreateBandModal
          isOpen={showCreateBandModal}
          onClose={() => setShowCreateBandModal(false)}
          onCreateBand={createBand}
          gameState={gameState}
        />
      )}
    </>
  );
};
