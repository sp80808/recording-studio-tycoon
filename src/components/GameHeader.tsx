
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { GameState } from '@/types/game';
import { StudioModal } from './modals/StudioModal';
import { StaffModal } from './modals/StaffModal';
import { RecruitmentModal } from './modals/RecruitmentModal';

interface GameHeaderProps {
  gameState: GameState;
  showStudioModal: boolean;
  setShowStudioModal: (show: boolean) => void;
  showStaffModal: boolean;
  setShowStaffModal: (show: boolean) => void;
  showRecruitmentModal: boolean;
  setShowRecruitmentModal: (show: boolean) => void;
  assignStaffToProject: (staffId: string) => void;
  unassignStaffFromProject: (staffId: string) => void;
  toggleStaffRest: (staffId: string) => void;
  hireStaff: (candidateIndex: number) => boolean;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  gameState,
  showStudioModal,
  setShowStudioModal,
  showStaffModal,
  setShowStaffModal,
  showRecruitmentModal,
  setShowRecruitmentModal,
  assignStaffToProject,
  unassignStaffFromProject,
  toggleStaffRest,
  hireStaff
}) => {
  return (
    <div className="flex justify-between items-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="flex gap-6">
        <div className="text-green-400 font-bold">${gameState.money.toLocaleString()}</div>
        <div className="text-blue-400">{gameState.reputation} Reputation</div>
        <div className="text-yellow-400">Day {gameState.currentDay}</div>
        <div className="text-purple-400">Level {gameState.playerData.level}</div>
        <div className="text-orange-400">Staff: {gameState.hiredStaff.length}</div>
      </div>
      <div className="flex items-center gap-4">
        <StudioModal 
          gameState={gameState}
          showStudioModal={showStudioModal}
          setShowStudioModal={setShowStudioModal}
        />
        
        <StaffModal 
          gameState={gameState}
          showStaffModal={showStaffModal}
          setShowStaffModal={setShowStaffModal}
          assignStaffToProject={assignStaffToProject}
          unassignStaffFromProject={unassignStaffFromProject}
          toggleStaffRest={toggleStaffRest}
        />
        
        {gameState.playerData.level >= 2 && (
          <RecruitmentModal 
            gameState={gameState}
            showRecruitmentModal={showRecruitmentModal}
            setShowRecruitmentModal={setShowRecruitmentModal}
            hireStaff={hireStaff}
          />
        )}
        
        <div className="text-right text-sm">
          <div>Music Studio Tycoon</div>
          <div className="text-gray-400">
            {gameState.activeProject ? `Working: ${gameState.activeProject.title}` : 'No Active Project'}
          </div>
        </div>
      </div>
    </div>
  );
};
