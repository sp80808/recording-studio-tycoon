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
}

export const GameHeader: React.FC<GameHeaderProps> = ({ gameState, onOpenSettings }) => {
  const [showEraProgress, setShowEraProgress] = useState(false);
  const { isFullscreen, toggleFullscreen } = useFullscreen('root');
  const { t } = useTranslation(); // Initialize useTranslation

  const buttonHoverTapAnimation = {
    hover: { scale: 1.1, transition: { type: "spring", stiffness: 300 } },
    tap: { scale: 0.95 },
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Card className="bg-gray-900/90 border-gray-600 p-4 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileHover={buttonHoverTapAnimation.hover} whileTap={buttonHoverTapAnimation.tap}>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleFullscreen}
                    aria-label={isFullscreen ? t('exit_fullscreen_aria_label', 'Exit fullscreen') : t('enter_fullscreen_aria_label', 'Enter fullscreen')}
                    className="text-white bg-gray-700/50 hover:bg-gray-600/50 border-gray-500"
                  >
                    {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isFullscreen ? t('exit_fullscreen', 'Exit Fullscreen') : t('enter_fullscreen', 'Enter Fullscreen')}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-default p-2 rounded-md hover:bg-gray-700/30">
                  <DollarSign className="text-green-400" size={20} />
                  <AnimatedCounter value={gameState.money} prefix="$" className="text-green-400 font-bold text-lg" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('money', 'Current Money')}: ${gameState.money.toLocaleString()}</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-default p-2 rounded-md hover:bg-gray-700/30">
                  <Star className="text-blue-400" size={20} />
                  <AnimatedCounter value={gameState.reputation} suffix={` ${t('reputation_suffix', 'Rep')}`} className="text-blue-400 font-bold text-lg" />
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
                  className="text-yellow-400 font-bold hover:bg-yellow-400/10 px-3 py-2 text-lg flex items-center rounded-md bg-transparent border-none"
                  onClick={() => setShowEraProgress(true)}
                >
                  <CalendarDays size={18} className="mr-2" />
                  {t('current_day', 'Day {{day}}', { day: gameState.currentDay })}
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('current_day_tooltip', 'Current Day: {{day}} / View Era Progress', { day: gameState.currentDay })}</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-default p-2 rounded-md hover:bg-gray-700/30">
                  <Users className="text-purple-400" size={20} />
                  <span className="text-purple-400 font-bold text-lg">{gameState.hiredStaff.length} {t('staff', 'Staff')}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('hired_staff_tooltip', 'Hired Staff: {{count}}', { count: gameState.hiredStaff.length })}</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-default p-2 rounded-md hover:bg-gray-700/30">
                  <Sparkles className="text-orange-400" size={20} />
                  <span className="text-orange-400 font-bold text-lg">{gameState.playerData.perkPoints} {t('perk_points', 'Perk Points')}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('perk_points_tooltip', 'Available Perk Points: {{count}}', { count: gameState.playerData.perkPoints })}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-4">
            {onOpenSettings && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div whileHover={buttonHoverTapAnimation.hover} whileTap={buttonHoverTapAnimation.tap}>
                    <Button
                      onClick={onOpenSettings}
                      variant="outline"
                      size="icon"
                      className="bg-gray-700/50 border-gray-500 text-gray-300 hover:bg-gray-600/50"
                      aria-label={t('open_settings', 'Open Settings')}
                    >
                      <SettingsIcon size={20} />
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
                <div className="text-right cursor-default p-2 rounded-md hover:bg-gray-700/30">
                  <div className="text-white font-bold text-lg">{t('level', 'Level {{level}}', { level: gameState.playerData.level })}</div>
                  <XPProgressBar 
                    currentXP={gameState.playerData.xp} 
                    xpToNext={gameState.playerData.xpToNextLevel}
                    level={gameState.playerData.level}
                    className="w-32"
                    currentXPLab={t('xp_suffix', 'XP')} // For potential localization of "XP"
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
        triggerEraTransition={(undefined as any)}
      />
    </TooltipProvider>
  );
};
