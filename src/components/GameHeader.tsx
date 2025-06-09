
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GameState } from '@/types/game';
import { StaffManagementModal } from './modals/StaffManagementModal';
import { Settings, Users, Calendar, DollarSign, Star, Zap } from 'lucide-react';

interface GameHeaderProps {
  gameState: GameState;
  onOpenSettings: () => void;
  hireStaff: (candidateIndex: number) => boolean;
  refreshCandidates: () => void;
  assignStaffToProject: (staffId: string) => void;
  unassignStaffFromProject: (staffId: string) => void;
  toggleStaffRest: (staffId: string) => void;
  openTrainingModal: (staff: any) => boolean;
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
  const studioName = gameState.studioName || 'Your Studio';

  return (
    <>
      <Card className="bg-gray-900/95 border-gray-600 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          {/* Left side - Studio name and basic info */}
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                🎵 {studioName}
                {gameState.playerData.level >= 10 && <Star className="h-5 w-5 text-yellow-400" />}
              </h1>
              <p className="text-gray-400 text-sm">
                Era: {gameState.currentEra} • Day {gameState.currentDay}
              </p>
            </div>
          </div>

          {/* Center - Key stats */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-400" />
              <span className="text-white font-medium">${gameState.money.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-400" />
              <span className="text-white">Level {gameState.playerData.level}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-purple-400" />
              <span className="text-white">{gameState.playerData.reputation || 0} Rep</span>
            </div>
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStaffModal(true)}
              className="hidden sm:flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Staff ({gameState.hiredStaff?.length || 0})
            </Button>
            
            {gameState.playerData.level >= 5 && (
              <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                Era Transition Available
              </Badge>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenSettings}
              className="text-gray-400 hover:text-white"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile stats row */}
        <div className="md:hidden mt-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-green-400">${gameState.money.toLocaleString()}</span>
            <span className="text-blue-400">Lv.{gameState.playerData.level}</span>
            <span className="text-purple-400">{gameState.playerData.reputation || 0} Rep</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStaffModal(true)}
            className="flex items-center gap-1"
          >
            <Users className="h-3 w-3" />
            {gameState.hiredStaff?.length || 0}
          </Button>
        </div>
      </Card>

      <StaffManagementModal
        showStaffModal={showStaffModal}
        setShowStaffModal={setShowStaffModal}
        gameState={gameState}
        hireStaff={hireStaff}
        refreshCandidates={refreshCandidates}
        assignStaffToProject={assignStaffToProject}
        unassignStaffFromProject={unassignStaffFromProject}
        toggleStaffRest={toggleStaffRest}
        openTrainingModal={openTrainingModal}
      />
    </>
  );
};
