import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GameState } from '@/types/game';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { Maximize, Minimize, SettingsIcon, CalendarDays, Users, Sparkles, DollarSign, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFullscreen } from '@/hooks/useFullscreen';
import { XPProgressBar } from '@/components/XPProgressBar';
import { EraProgressModal } from '@/components/modals/EraProgressModal';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from 'react-i18next'; // Import useTranslation

interface GameHeaderProps {
  gameState: GameState;
  onOpenSettings?: () => void;
  triggerEraTransition?: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({ gameState, onOpenSettings, triggerEraTransition }) => {
  const [showEraProgress, setShowEraProgress] = useState(false);
  const { isFullscreen, toggleFullscreen } = useFullscreen('root');
  const { t } = useTranslation(); // Initialize useTranslation

  const buttonHoverTapAnimation = {
    hover: { scale: 1.1, transition: { type: "spring", stiffness: 300 } },
    tap: { scale: 0.95 },
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Card className="bg-gray-900/90 border-gray-600 p-2 backdrop-blur-sm">
        <div className="flex justify-between items-center gap-4">
          {/* Left section - Core info */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileHover={buttonHoverTapAnimation.hover} whileTap={buttonHoverTapAnimation.tap}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleFullscreen}
                    aria-label={isFullscreen ? t('exit_fullscreen_aria_label', 'Exit fullscreen') : t('enter_fullscreen_aria_label', 'Enter fullscreen')}
                    className="text-white bg-gray-700/50 hover:bg-gray-600/50 border-gray-500 h-8 w-8 p-0"
                  >
                    {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isFullscreen ? t('exit_fullscreen', 'Exit Fullscreen') : t('enter_fullscreen', 'Enter Fullscreen')}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 cursor-default px-2 py-1 rounded hover:bg-gray-700/30">
                  <DollarSign className="text-green-400" size={16} />
                  <AnimatedCounter value={gameState.money} prefix="$" className="text-green-400 font-bold text-sm" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('money', 'Current Money')}: ${gameState.money.toLocaleString()}</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 cursor-default px-2 py-1 rounded hover:bg-gray-700/30">
                  <Star className="text-blue-400" size={16} />
                  <AnimatedCounter value={gameState.reputation} suffix={` Rep`} className="text-blue-400 font-bold text-sm" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('reputation', 'Current Reputation')}: {gameState.reputation.toLocaleString()} {t('reputation_suffix', 'Rep')}</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  whileHover={buttonHoverTapAnimation.hover}
                  whileTap={buttonHoverTapAnimation.tap}
                  className="text-yellow-400 font-bold hover:bg-yellow-400/10 px-2 py-1 text-sm flex items-center rounded bg-transparent border-none"
                  onClick={() => setShowEraProgress(true)}
                >
                  <CalendarDays size={14} className="mr-1" />
                  Day {gameState.currentDay}
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('current_day_tooltip', 'Current Day: {{day}} / View Era Progress', { day: gameState.currentDay })}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Right section - Level and controls */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 cursor-default px-2 py-1 rounded hover:bg-gray-700/30">
                  <Users className="text-purple-400" size={14} />
                  <span className="text-purple-400 font-bold text-sm">{gameState.hiredStaff.length}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('hired_staff_tooltip', 'Hired Staff: {{count}}', { count: gameState.hiredStaff.length })}</p>
              </TooltipContent>
            </Tooltip>

            {gameState.playerData.perkPoints > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 cursor-default px-2 py-1 rounded hover:bg-gray-700/30">
                    <Sparkles className="text-orange-400" size={14} />
                    <span className="text-orange-400 font-bold text-sm">{gameState.playerData.perkPoints}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('perk_points_tooltip', 'Available Perk Points: {{count}}', { count: gameState.playerData.perkPoints })}</p>
                </TooltipContent>
              </Tooltip>
            )}

            {onOpenSettings && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div whileHover={buttonHoverTapAnimation.hover} whileTap={buttonHoverTapAnimation.tap}>
                    <Button
                      onClick={onOpenSettings}
                      variant="outline"
                      size="sm"
                      className="bg-gray-700/50 border-gray-500 text-gray-300 hover:bg-gray-600/50 h-8 w-8 p-0"
                      aria-label={t('open_settings', 'Open Settings')}
                    >
                      <SettingsIcon size={16} />
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('open_settings', 'Open Settings')}</p>
                </TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-right cursor-default px-2 py-1 rounded hover:bg-gray-700/30">
                  {/* <div className="text-white font-bold text-sm">Level {gameState.playerData.level}</div> */}
                  <XPProgressBar 
                    currentXP={gameState.playerData.xp} 
                    xpToNext={gameState.playerData.xpToNextLevel}
                    level={gameState.playerData.level}
                    className="w-24"
                    showNumbers={false}
                    currentXPLab={t('xp_suffix', 'XP')}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {t('level_tooltip_level', 'Level {{level}}', { level: gameState.playerData.level })} 
                  ({t('xp_progress_tooltip', '{{currentXP}}/{{xpToNextLevel}} XP', { currentXP: gameState.playerData.xp.toLocaleString(), xpToNextLevel: gameState.playerData.xpToNextLevel.toLocaleString() })})
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </Card>

      <EraProgressModal
        gameState={gameState}
        isOpen={showEraProgress}
        onClose={() => setShowEraProgress(false)}
        triggerEraTransition={triggerEraTransition || (() => {})}
      />
    </TooltipProvider>
  );
};
