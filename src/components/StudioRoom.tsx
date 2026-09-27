import React, { useEffect, useMemo, useRef, useState } from 'react';
import WebGLCanvas, { StudioHotspotId } from '@/components/WebGLCanvas';
import { StudioInspector } from '@/components/StudioInspector';
import { GameState, Project } from '@/types/game';
import { useSettings } from '@/contexts/SettingsContext';
import { gameAudio } from '@/utils/audioSystem';
import { ProgressionSystem } from '@/services/ProgressionSystem';
import { toast } from '@/hooks/use-toast';
import { triggerScreenShake } from '@/utils/screenShake';

interface StudioRoomProps {
  gameState: GameState;
  onAdvanceDay: () => void;
  onRefreshProjects?: () => boolean;
  onStartProject?: (project: Project) => void;
  onAssignStaff?: (staffId: string) => void;
  onUnassignStaff?: (staffId: string) => void;
  onOpenDashboardTab?: (tab: 'studio' | 'skills' | 'bands' | 'charts' | 'staff') => void;
  onConsoleFocus: () => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * The isometric studio floor — the diegetic "home screen" of the game.
 * Wraps the PixiJS room, derives live state from the game state, and
 * anchors contextual inspector popups to the clicked room objects (bead goj.2).
 */
export const StudioRoom: React.FC<StudioRoomProps> = ({
  gameState,
  onAdvanceDay,
  onRefreshProjects,
  onStartProject,
  onAssignStaff,
  onUnassignStaff,
  onOpenDashboardTab,
  onConsoleFocus,
  className = '',
  style,
}) => {
  const { settings } = useSettings();
  const [activeInspector, setActiveInspector] = useState<StudioHotspotId | null>(null);
  const [tierFlash, setTierFlash] = useState(false);
  const playClick = () => { if (settings.sfxEnabled) gameAudio.playUISound('buttonClick'); };

  // Studio tier (1-5) from the progression milestones — drives visible
  // room upgrades in the Pixi scene (bead ifx.3).
  const roomTier = useMemo(() => {
    const status = ProgressionSystem.getProgressionStatus(gameState);
    return status.currentMilestone?.level ?? 1;
  }, [gameState.playerData.level, gameState.hiredStaff.length, gameState.playerData.xp]);

  // Celebrate a tier-up in-place: flash overlay + shake + fanfare + toast.
  const prevTierRef = useRef(roomTier);
  useEffect(() => {
    if (roomTier > prevTierRef.current) {
      setTierFlash(true);
      triggerScreenShake('medium');
      gameAudio.playUISound('projectComplete');
      toast({
        title: '🏗 Studio Upgraded!',
        description: `Your studio reached tier ${roomTier} — the room just got an upgrade.`,
        className: 'bg-amber-900/95 border-amber-400 text-white',
        duration: 6000,
      });
      const t = window.setTimeout(() => setTierFlash(false), 1700);
      prevTierRef.current = roomTier;
      return () => window.clearTimeout(t);
    }
    prevTierRef.current = roomTier;
  }, [roomTier]);

  const sceneState = useMemo(() => {
    const project = gameState.activeProject;
    let progress = 0;
    if (project) {
      const done = project.stages.filter((s) => s.completed).length;
      const current = project.stages[project.currentStageIndex];
      const currentFrac = current
        ? Math.min(1, current.workUnitsCompleted / Math.max(1, current.workUnitsBase))
        : 0;
      progress = project.stages.length > 0 ? (done + currentFrac) / project.stages.length : 0;
    }
    const workingStaff = gameState.hiredStaff.filter((s) => s.status === 'Working').length;
    const presentStaff = gameState.hiredStaff.filter((s) => s.status !== 'Resting').length;
    const activity = Math.min(
      1,
      0.08 + (project ? 0.3 + progress * 0.45 : 0) + workingStaff * 0.08
    );
    return {
      activity,
      hasActiveProject: !!project,
      staffOnFloor: Math.min(5, 1 + presentStaff),
      ownedEquipment: gameState.ownedEquipment.length,
      day: gameState.currentDay,
      eraId: gameState.currentEra,
      roomTier,
    };
  }, [gameState.activeProject, gameState.hiredStaff, gameState.ownedEquipment, gameState.currentDay, gameState.currentEra, roomTier]);

  /** Every hotspot now opens its contextual inspector (bead goj.2). */
  const handleHotspot = (id: StudioHotspotId) => {
    playClick();
    setActiveInspector(id);
  };

  const closeInspector = () => {
    if (settings.sfxEnabled) gameAudio.playUISound('menuClose');
    setActiveInspector(null);
  };

  return (
    <div className={`relative overflow-hidden rounded-lg border border-gray-700/70 bg-[#11151f] ${className}`} style={style}>
      <WebGLCanvas state={sceneState} onHotspotSelect={handleHotspot} />
      {tierFlash && <div className="tier-flash-overlay" />}
      {activeInspector && (
        <StudioInspector
          hotspot={activeInspector}
          gameState={gameState}
          onClose={closeInspector}
          onAdvanceDay={onAdvanceDay}
          onRefreshProjects={onRefreshProjects}
          onStartProject={onStartProject ?? (() => {})}
          onAssignStaff={onAssignStaff ?? (() => {})}
          onUnassignStaff={onUnassignStaff ?? (() => {})}
          onOpenDashboardTab={onOpenDashboardTab ?? (() => {})}
          onConsoleFocus={onConsoleFocus}
        />
      )}
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute top-2 left-3 flex items-center gap-2">
          <span className="px-2 py-1 text-[10px] font-black tracking-[0.2em] text-gray-100 bg-black/50 border border-white/10 rounded">
            🎛 STUDIO FLOOR
          </span>
          <span className="px-2 py-1 text-[10px] font-bold tracking-wider text-emerald-300/90 bg-black/50 border border-white/10 rounded">
            {gameState.currentYear}
          </span>
        </div>
        <div className="absolute top-2 right-3">
          <span className="px-2 py-1 text-[10px] font-black tracking-[0.15em] text-amber-300 bg-black/50 border border-white/10 rounded">
            ☀ DAY {gameState.currentDay}
          </span>
        </div>
        {!gameState.activeProject && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center">
            <span className="animate-pulse px-3 py-1.5 text-xs font-semibold text-gray-100 bg-black/60 border border-amber-400/40 rounded-full">
              📞 No session booked — click the phone or pick a gig
            </span>
          </div>
        )}
        <div className="absolute bottom-2 inset-x-0 flex justify-center">
          <div className="flex flex-wrap justify-center gap-1.5 px-2">
            {[['🎛','Console'],['📞','Book'],['🕐','Day'],['📺','Charts'],['🎸','Gear'],['🎤','Crew']]
              .map(([icon, label]) => (
                <span key={label} className="px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-gray-300/90 bg-black/45 border border-white/10 rounded">
                  {icon} {label}
                </span>
              ))}
            <span className="px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-amber-200/90 bg-black/45 border border-amber-300/20 rounded">
              click objects to inspect
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudioRoom;
