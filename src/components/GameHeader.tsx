
import React, { useState } from 'react';
import { GameState, StaffMember } from '@/types/game';
import { StaffManagementModal } from './modals/StaffManagementModal';
import { EraProgress } from './EraProgress';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Coins, Calendar, Users, Settings } from 'lucide-react';

interface GameHeaderProps {
  gameState: GameState;
  onOpenSettings: () => void;
  hireStaff: (candidateIndex: number) => boolean;
  refreshCandidates: () => void;
  assignStaffToProject: (staffId: string) => void;
  unassignStaffFromProject: (staffId: string) => void;
  toggleStaffRest: (staffId: string) => void;
  openTrainingModal: (staff: StaffMember) => boolean;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  gameState,
  onOpenSettings,
  hireStaff,
  refreshCandidates,
  assignStaffToProject,
  unassignStaffFromProject,
  toggleStaffRest,
  openTrainingModal
}) => {
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showEraModal, setShowEraModal] = useState(false);

  return (
    <div className="bg-gradient-to-r from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 p-4 shadow-lg">
      <div className="flex items-center justify-between">
        {/* Left Section - Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-xl">🎵</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Music Studio Tycoon
              </h1>
              <div className="text-sm text-gray-400">Professional Recording Studio</div>
            </div>
          </div>
        </div>

        {/* Center Section - Game Stats */}
        <div className="flex items-center gap-6">
          {/* Day Counter with Era Modal */}
          <Dialog open={showEraModal} onOpenChange={setShowEraModal}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center gap-2 text-white hover:bg-gray-700/50 transition-all duration-200 px-4 py-2 rounded-lg"
              >
                <Calendar className="w-4 h-4 text-blue-400" />
                <div className="text-left">
                  <div className="text-sm font-medium">Day {gameState.currentDay}</div>
                  <div className="text-xs text-gray-400">{gameState.currentYear}</div>
                </div>
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
              <EraProgress 
                gameState={gameState}
                triggerEraTransition={() => setShowEraModal(false)}
              />
            </DialogContent>
          </Dialog>

          {/* Money */}
          <div className="flex items-center gap-2 bg-green-900/30 border border-green-600/30 rounded-lg px-3 py-2">
            <Coins className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-bold">${gameState.money.toLocaleString()}</span>
          </div>

          {/* Reputation */}
          <div className="flex items-center gap-2 bg-purple-900/30 border border-purple-600/30 rounded-lg px-3 py-2">
            <span className="text-purple-400">⭐</span>
            <span className="text-purple-400 font-medium">{gameState.reputation} Rep</span>
          </div>

          {/* Player Level */}
          <Badge className="bg-blue-600/20 text-blue-300 border-blue-600/30 hover:bg-blue-600/30 transition-colors">
            Level {gameState.playerData.level}
          </Badge>
        </div>
        
        {/* Right Section - Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowStaffModal(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white transition-all duration-200 px-4 py-2 rounded-lg"
          >
            <Users className="w-4 h-4" />
            Staff
            <Badge variant="secondary" className="ml-1 bg-green-800 text-green-200">
              {gameState.hiredStaff.length}
            </Badge>
          </Button>
          
          <Button
            onClick={onOpenSettings}
            variant="outline"
            className="flex items-center gap-2 border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </div>
      </div>

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
    </div>
  );
};
