
import React from 'react';
import { Button } from '@/components/ui/button';
import { GameState, StaffMember } from '@/types/game';
import { StudioModal } from './modals/StudioModal';
import { StaffModal } from './modals/StaffModal';
import { RecruitmentModal } from './modals/RecruitmentModal';
import { AnimatedCounter } from './AnimatedCounter';
import { XPProgressBar } from './XPProgressBar';

interface EnhancedGameHeaderProps {
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
  openTrainingModal: (staff: StaffMember) => void;
}

export const EnhancedGameHeader: React.FC<EnhancedGameHeaderProps> = ({
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
  hireStaff,
  openTrainingModal
}) => {
  return (
    <div className="bg-gradient-to-r from-black/40 via-purple-900/30 to-black/40 backdrop-blur-sm border-b border-purple-500/30">
      {/* Main Header */}
      <div className="flex justify-between items-center p-4">
        <div className="flex gap-6 items-center">
          <div className="stat-item text-green-400 font-bold text-lg">
            <span className="text-sm text-gray-300 mr-2">💰</span>
            $<AnimatedCounter value={gameState.money} />
          </div>
          <div className="stat-item text-blue-400 font-medium">
            <span className="text-sm text-gray-300 mr-2">⭐</span>
            <AnimatedCounter value={gameState.reputation} suffix=" Rep" />
          </div>
          <div className="stat-item text-yellow-400 font-medium">
            <span className="text-sm text-gray-300 mr-2">📅</span>
            Day <AnimatedCounter value={gameState.currentDay} />
          </div>
          <div className="stat-item text-orange-400 font-medium">
            <span className="text-sm text-gray-300 mr-2">👥</span>
            <AnimatedCounter value={gameState.hiredStaff.length} suffix=" Staff" />
          </div>
          {gameState.playerData.perkPoints > 0 && (
            <div className="stat-item text-pink-400 font-bold animate-pulse">
              <span className="text-sm text-gray-300 mr-2">🎯</span>
              {gameState.playerData.perkPoints} Perk Point{gameState.playerData.perkPoints !== 1 ? 's' : ''}!
            </div>
          )}
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
            openTrainingModal={openTrainingModal}
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
            <div className="text-white font-bold">Music Studio Tycoon</div>
            <div className="text-gray-400">
              {gameState.activeProject ? `Working: ${gameState.activeProject.title}` : 'No Active Project'}
            </div>
          </div>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="px-4 pb-3">
        <XPProgressBar
          currentXP={gameState.playerData.xp}
          xpToNext={gameState.playerData.xpToNextLevel}
          level={gameState.playerData.level}
          className="max-w-md"
        />
      </div>
    </div>
  );
};
