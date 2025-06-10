import React from 'react';
import { Button } from '@/components/ui/button';
import { GameState, StaffMember } from '@/types/game';
import { StudioModal } from './modals/StudioModal';
import { StaffModal } from './modals/StaffModal';
import { RecruitmentModal } from './modals/RecruitmentModal';
import { AnimatedNumber } from './AnimatedNumber';
import { XPProgressBar } from './XPProgressBar';

interface GameHeaderProps {
  money: number;
  reputation: number;
  currentDay: number;
  playerLevel: number;
  playerXP: number;
  xpToNextLevel: number;
  staffCount: number;
  onAdvanceDay: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  money,
  reputation,
  currentDay,
  playerLevel,
  playerXP,
  xpToNextLevel,
  staffCount,
  onAdvanceDay,
}) => {
  return (
    <div className="bg-gradient-to-r from-black/40 via-purple-900/30 to-black/40 backdrop-blur-sm border-b border-purple-500/30">
      {/* Main Header */}
      <div className="flex justify-between items-center p-4">
        <div className="flex gap-6 items-center">
          <div className="stat-item text-green-400 font-bold text-lg">
            <span className="text-sm text-gray-300 mr-2">💰</span>
            $<AnimatedNumber value={money} />
          </div>
          <div className="stat-item text-blue-400 font-medium">
            <span className="text-sm text-gray-300 mr-2">⭐</span>
            <AnimatedNumber value={reputation} />
            <span className="ml-1">Rep</span>
          </div>
          <div className="stat-item text-yellow-400 font-medium">
            <span className="text-sm text-gray-300 mr-2">📅</span>
            Day <AnimatedNumber value={currentDay} />
          </div>
          <div className="stat-item text-orange-400 font-medium">
            <span className="text-sm text-gray-300 mr-2">👥</span>
            <AnimatedNumber value={staffCount} />
            <span className="ml-1">Staff</span>
          </div>
          {/* Perk points display removed as it's not passed as a prop */}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Modals are now handled in GameModals component */}
          <Button onClick={onAdvanceDay} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
            Next Day
          </Button>
          <div className="text-right text-sm">
            <div className="text-white font-bold">Music Studio Tycoon</div>
            <div className="text-gray-400">
              {/* Active project display removed as it's not passed as a prop */}
            </div>
          </div>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="px-4 pb-3">
        <XPProgressBar
          currentXP={playerXP}
          xpToNext={xpToNextLevel}
          level={playerLevel}
          className="max-w-md"
        />
      </div>
    </div>
  );
};
