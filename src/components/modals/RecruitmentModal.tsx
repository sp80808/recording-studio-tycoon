/**
 * RecruitmentModal — lightweight dialog entry into the Studio Talent Exchange.
 * Full portal UX lives in CrewRecruitmentPortal (Crew dashboard tab).
 */
import { popElement } from '@/utils/feelPop';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { GameState } from '@/types/game';
import { Users } from 'lucide-react';
import { CrewRecruitmentPortal } from '@/components/crew/CrewRecruitmentPortal';

interface RecruitmentModalProps {
  gameState: GameState;
  showRecruitmentModal: boolean;
  setShowRecruitmentModal: (show: boolean) => void;
  hireStaff: (candidateIndex: number) => boolean;
  refreshCandidates: () => void;
  assignStaffToProject?: (staffId: string) => void;
  unassignStaffFromProject?: (staffId: string) => void;
  toggleStaffRest?: (staffId: string) => void;
  openTrainingModal?: (staff: GameState['hiredStaff'][number]) => boolean;
}

export const RecruitmentModal: React.FC<RecruitmentModalProps> = ({
  gameState,
  showRecruitmentModal,
  setShowRecruitmentModal,
  hireStaff,
  refreshCandidates,
  assignStaffToProject = () => {},
  unassignStaffFromProject = () => {},
  toggleStaffRest = () => {},
  openTrainingModal = () => false,
}) => {
  const { t } = useTranslation();
  const [opened, setOpened] = useState(showRecruitmentModal);
  const open = showRecruitmentModal || opened;

  return (
    <Dialog open={open} onOpenChange={(next) => {
      setOpened(next);
      setShowRecruitmentModal(next);
    }}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-stone-800/80 hover:bg-stone-700/80 text-white border-stone-600"
          onClick={(e) => popElement(e.currentTarget)}
        >
          <Users className="w-4 h-4 mr-2" />
          {t('recruitment_center_label')}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-stone-950 border-stone-600 text-white max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t('recruitment_center_label')}
          </DialogTitle>
        </DialogHeader>
        <CrewRecruitmentPortal
          gameState={gameState}
          hireStaff={hireStaff}
          refreshCandidates={refreshCandidates}
          assignStaffToProject={assignStaffToProject}
          unassignStaffFromProject={unassignStaffFromProject}
          toggleStaffRest={toggleStaffRest}
          openTrainingModal={openTrainingModal}
        />
      </DialogContent>
    </Dialog>
  );
};
