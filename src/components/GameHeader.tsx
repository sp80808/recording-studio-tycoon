import React, { useState } from 'react';
import { GameState } from '@/types/game';
import { AnimatedCounter } from './AnimatedCounter';
import { Maximize, Minimize, Settings, CalendarDays, Coins, Star } from 'lucide-react';
import { useFullscreen } from '@/hooks/useFullscreen';
import { EraProgressModal } from './modals/EraProgressModal';
import { useTranslation } from 'react-i18next';
import { getStudioSignage } from './WebGLCanvas';
import './chip-fidelity.css';
import { SettleTicker } from './SettleTicker';
import { StreakFlame } from './StreakFlame';
import { PressRipple } from './ui/PressRipple';

interface GameHeaderProps {
  gameState: GameState;
  onOpenSettings?: () => void;
  triggerEraTransition?: () => void;
  className?: string;
}

export const GameHeader: React.FC<GameHeaderProps> = ({ gameState, onOpenSettings, triggerEraTransition, className = '' }) => {
  const [showEraProgress, setShowEraProgress] = useState(false);
  const { isFullscreen, toggleFullscreen } = useFullscreen('root');
  const { t } = useTranslation();
  const player = gameState.playerData;
  const signage = getStudioSignage(gameState.currentEra, gameState.milestones?.length ?? 0);
  return <>
    <header className={`studio-hud ${className}`} aria-label="Studio status">
      <div className="studio-hud-stats">
        <div className="studio-hud-stat text-emerald-200" data-reward-target="money" title={t('money', 'Current money')}>
          <Coins size={18} aria-hidden="true" /><SettleTicker value={gameState.money}><AnimatedCounter value={gameState.money} prefix="$" /></SettleTicker>
        </div>
        <div className="studio-hud-stat text-sky-200" title={t('reputation', 'Reputation')}>
          <Star size={16} aria-hidden="true" /><AnimatedCounter value={gameState.reputation} suffix=" Rep" />
        </div>
        <button className="studio-dock-button studio-hud-day" onClick={() => setShowEraProgress(true)} aria-label={`Day ${gameState.currentDay}, view era progress`}>
          <CalendarDays size={16} aria-hidden="true" />Day {gameState.currentDay}
        </button>
        <StreakFlame streakCount={gameState.dailyTracking?.streakCount} />
      </div>
      <div 
        className="studio-hud-title" 
        onClick={() => setShowEraProgress(true)} 
        title={`${signage} · View era progression`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setShowEraProgress(true)}
      >
        <PressRipple>
          <span>{signage}</span>
        </PressRipple>
      </div>
      <div className="studio-hud-controls">
        <div className="studio-hud-xp" data-reward-target="xp" title={`${player.xp}/${player.xpToNextLevel} XP · ${player.perkPoints} talent points · ${gameState.hiredStaff.length} crew`}>
          <span>Level {player.level} <span className="float-right">{player.xp} XP</span></span>
          <progress aria-label="Producer experience" max={Math.max(1, player.xpToNextLevel)} value={player.xp} />
        </div>
        <button className="studio-dock-button" onClick={toggleFullscreen} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
          <PressRipple>{isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}</PressRipple>
        </button>
        {onOpenSettings && <button className="studio-dock-button" onClick={onOpenSettings} aria-label={t('open_settings', 'Open Settings')}><PressRipple><Settings size={18} /></PressRipple></button>}
      </div>
    </header>
    <EraProgressModal gameState={gameState} isOpen={showEraProgress} onClose={() => setShowEraProgress(false)} triggerEraTransition={triggerEraTransition || (() => {})} />
  </>;
};
