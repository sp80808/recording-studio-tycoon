import React, { useState } from 'react';
import { GameState } from '@/types/game';
import { currencySymbol, getCityById, toLocalAmount } from '@/rpg/cities';
import { AnimatedCounter } from './AnimatedCounter';
import { LocateFixed, Maximize, Minimize, Settings, CalendarDays, Coins, Star, SkipForward, Pause } from 'lucide-react';
import { useFullscreen } from '@/hooks/useFullscreen';
import { useAppDisplayMode } from '@/hooks/useAppDisplayMode';
import { shouldShowFullscreenControl } from '@/lib/appDisplayMode';
import { EraProgressModal } from './modals/EraProgressModal';
import { useTranslation } from 'react-i18next';
import { getStudioSignage } from './WebGLCanvas';
import './chip-fidelity.css';
import { SettleTicker } from './SettleTicker';
import { StreakFlame } from './StreakFlame';
import { PressRipple } from './ui/PressRipple';
import { useStudioClock } from '@/contexts/StudioClockContext';

interface GameHeaderProps {
  gameState: GameState;
  onOpenSettings?: () => void;
  onPause?: () => void;
  onCenterCamera?: () => void;
  onAdvanceDay?: () => void;
  triggerEraTransition?: () => void;
  className?: string;
}

export const GameHeader: React.FC<GameHeaderProps> = ({ gameState, onOpenSettings, onPause, onCenterCamera, onAdvanceDay, triggerEraTransition, className = '' }) => {
  const [showEraProgress, setShowEraProgress] = useState(false);
  const { isFullscreen, toggleFullscreen } = useFullscreen('root');
  const showFullscreen = shouldShowFullscreenControl(useAppDisplayMode());
  const { t } = useTranslation();
  const studioClock = useStudioClock();
  const player = gameState.playerData;
  const signage = getStudioSignage(gameState.currentEra, Object.keys(gameState.unlockedAchievements ?? {}).length, getCityById(gameState.cityId)?.name);
  return <>
    <header className={`studio-hud ${className}`} aria-label={t('studio_status_aria')}>
      <div className="studio-hud-stats">
        <div className="studio-hud-stat text-[var(--rst-ivory)]" data-reward-target="money" title={t('money')}>
          <Coins size={15} className="text-[var(--rst-money)]" aria-hidden="true" /><SettleTicker value={gameState.money}><AnimatedCounter value={toLocalAmount(gameState.money, gameState.cityId, gameState.currentEra)} prefix={currencySymbol(gameState.cityId, gameState.currentEra)} /></SettleTicker>
        </div>
        <span className="studio-hud-dot" aria-hidden="true">·</span>
        <div className="studio-hud-stat text-[var(--rst-ivory)]" title={t('reputation')}>
          <Star size={14} className="text-[var(--rst-brass-400)]" fill="currentColor" aria-hidden="true" /><AnimatedCounter value={gameState.reputation} suffix={t('rep_suffix')} />
        </div>
        <span className="studio-hud-dot" aria-hidden="true">·</span>
        <div className="studio-hud-day-group">
          <button
            type="button"
            className="studio-hud-day"
            onClick={() => setShowEraProgress(true)}
            aria-label={`${t('current_day', { day: gameState.currentDay })}, ${studioClock.formattedTime}, ${studioClock.phase}, ${t('view_era_progress')}`}
          >
            <CalendarDays size={14} aria-hidden="true" />
            <span>{t('current_day', { day: gameState.currentDay })}</span>
            <span className="studio-hud-time" aria-hidden="true">{studioClock.formattedTime}</span>
          </button>
          {onAdvanceDay && (
            <button
              type="button"
              className="studio-hud-advance"
              onClick={onAdvanceDay}
              aria-label={`Close Day ${gameState.currentDay} and begin Day ${gameState.currentDay + 1}`}
              title={`Close Day ${gameState.currentDay} now`}
            >
              <PressRipple><SkipForward size={16} /><span className="studio-hud-advance-label">Close day</span></PressRipple>
            </button>
          )}
        </div>
        <StreakFlame streakCount={gameState.dailyTracking?.streakCount} />
        <span className="studio-hud-dot" aria-hidden="true">·</span>
        <div
          className="studio-hud-xp"
          data-reward-target="xp"
          title={`${player.xp}/${player.xpToNextLevel} XP · ${player.perkPoints} ${t('talent_points').toLowerCase()} · ${gameState.hiredStaff.length} ${t('crew').toLowerCase()}`}
        >
          <span className="studio-hud-xp-meta">{t('level', { level: player.level })} <span>{t('xp_label', { xp: player.xp })}</span></span>
          <progress aria-label={t('producer_experience_aria')} max={Math.max(1, player.xpToNextLevel)} value={player.xp} />
        </div>
      </div>
      <div
        className="studio-hud-title"
        onClick={() => setShowEraProgress(true)}
        title={`${signage} · ${t('view_era_progression')}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setShowEraProgress(true)}
      >
        <PressRipple>
          <span>{signage}</span>
        </PressRipple>
      </div>
      <div className="studio-hud-controls" role="group" aria-label="Studio view controls">
        {onCenterCamera && (
          <button type="button" className="studio-hud-icon" onClick={onCenterCamera} aria-label="Center studio camera" title="Center studio camera">
            <PressRipple><LocateFixed size={16} /></PressRipple>
          </button>
        )}
        {showFullscreen && (
        <button
          type="button"
          className="studio-hud-icon"
          data-testid="hud-fullscreen"
          onClick={toggleFullscreen}
          title={isFullscreen ? t('exit_fullscreen_aria_label') : t('enter_fullscreen_aria_label')}
          aria-label={isFullscreen ? t('exit_fullscreen_aria_label') : t('enter_fullscreen_aria_label')}
        >
          <PressRipple>{isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}</PressRipple>
        </button>
        )}
        {onPause && (
          <button
            type="button"
            className="studio-hud-icon"
            onClick={onPause}
            aria-label="Pause session (Esc)"
            title="Pause session (Esc)"
          >
            <PressRipple><Pause size={16} /></PressRipple>
          </button>
        )}
        {onOpenSettings && (
          <button type="button" className="studio-hud-icon" onClick={onOpenSettings} aria-label={t('open_settings')} title={t('open_settings')}>
            <PressRipple><Settings size={16} /></PressRipple>
          </button>
        )}
      </div>
    </header>
    <EraProgressModal gameState={gameState} isOpen={showEraProgress} onClose={() => setShowEraProgress(false)} triggerEraTransition={triggerEraTransition || (() => {})} />
  </>;
};
