import React, { useEffect, useMemo, useRef, useState } from 'react';
import WebGLCanvas, { StudioHotspotId } from '@/components/WebGLCanvas';
import { StudioInspector } from '@/components/StudioInspector';
import { GameState, Project } from '@/types/game';
import { useSettings } from '@/contexts/SettingsContext';
import { gameAudio } from '@/utils/audioSystem';
import { ProgressionSystem } from '@/services/ProgressionSystem';
import { toast } from '@/hooks/use-toast';
import { LocateFixed } from 'lucide-react';
import { triggerScreenShake } from '@/utils/screenShake';
import { useGamepad } from '@/hooks/useGamepad';
import { GamepadGlyph } from '@/components/ui/GamepadGlyph';

const STUDIO_HOTSPOTS: StudioHotspotId[] = ['console', 'phone', 'liveroom', 'shelf', 'crt', 'clock'];
const HOTSPOT_NAMES: Record<StudioHotspotId, string> = {
  console: 'Console Desk',
  phone: 'Studio Phone',
  liveroom: 'Live Room',
  shelf: 'Vinyl Shelf',
  crt: 'Charts & TV',
  clock: 'Studio Clock',
};

interface StudioRoomProps {
  gameState: GameState;
  onAdvanceDay: () => void;
  onRefreshProjects?: () => boolean;
  onStartProject?: (project: Project) => void;
  onAssignStaff?: (staffId: string) => void;
  onUnassignStaff?: (staffId: string) => void;
  onOpenDashboardTab?: (tab: 'studio' | 'skills' | 'bands' | 'charts' | 'staff') => void;
  onConsoleFocus: () => void;
  onBookings?: () => void;
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
  onBookings,
  className = '',
  style,
}) => {
  const { settings } = useSettings();
  const [activeInspector, setActiveInspector] = useState<StudioHotspotId | null>(null);
  const [cameraReset, setCameraReset] = useState(0);
  const [tierFlash, setTierFlash] = useState(false);
  const playClick = () => { if (settings.sfxEnabled) gameAudio.playUISound('buttonClick'); };

  // Studio tier (1-5) from the progression milestones — drives visible
  // room upgrades in the Pixi scene (bead ifx.3).
  const roomTier = useMemo(() => {
    const status = ProgressionSystem.getProgressionStatus(gameState);
    return status.currentMilestone?.level ?? 1;
  }, [gameState]);

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
    if (settings.sfxEnabled) {
      if (id === 'console' || id === 'shelf') {
        void gameAudio.playGearSwitch();
      } else {
        void gameAudio.playTactileClick();
      }
    }
    if (id === 'console') { onConsoleFocus(); return; }
    if (id === 'phone' && onBookings) { onBookings(); return; }
    setActiveInspector(id);
  };

  const closeInspector = () => {
    if (settings.sfxEnabled) gameAudio.playUISound('menuClose');
    setActiveInspector(null);
  };

  const gamepad = useGamepad({
    preferredLayout: settings?.controllerLayout,
    hapticsEnabled: settings?.gamepadHaptics,
  });

  const [focusedHotspotIndex, setFocusedHotspotIndex] = useState(0);

  // Close inspector on B button
  useEffect(() => {
    if (!gamepad.isConnected || !activeInspector) return;
    if (gamepad.justPressed.east) {
      closeInspector();
      gamepad.triggerHaptic(0.1, 0.2, 40);
    }
  }, [gamepad.isConnected, activeInspector, gamepad.justPressed.east]);

  // Navigate hotspots via D-Pad or Left Stick when on studio floor
  useEffect(() => {
    if (!gamepad.isConnected || activeInspector) return;

    if (gamepad.justPressed.dpadRight || gamepad.justPressed.dpadDown) {
      setFocusedHotspotIndex((prev) => (prev + 1) % STUDIO_HOTSPOTS.length);
      gamepad.triggerHaptic(0.1, 0.15, 30);
    } else if (gamepad.justPressed.dpadLeft || gamepad.justPressed.dpadUp) {
      setFocusedHotspotIndex((prev) => (prev - 1 + STUDIO_HOTSPOTS.length) % STUDIO_HOTSPOTS.length);
      gamepad.triggerHaptic(0.1, 0.15, 30);
    } else if (gamepad.justPressed.south) {
      const selected = STUDIO_HOTSPOTS[focusedHotspotIndex];
      handleHotspot(selected);
      gamepad.triggerHaptic(0.2, 0.3, 50);
    }
  }, [
    gamepad.isConnected,
    activeInspector,
    gamepad.justPressed.dpadRight,
    gamepad.justPressed.dpadDown,
    gamepad.justPressed.dpadLeft,
    gamepad.justPressed.dpadUp,
    gamepad.justPressed.south,
    focusedHotspotIndex,
  ]);

  return (
    <div 
      className={`relative overflow-hidden rounded-lg border border-gray-700/70 bg-[#11151f] transition-all duration-300 ${className}`} 
      style={style}
    >
      <WebGLCanvas state={sceneState} onHotspotSelect={handleHotspot} resetCameraKey={cameraReset} />
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
        <div className="studio-room-label absolute top-2 left-3 flex items-center gap-2">
          <span className="px-2 py-1 text-[10px] font-black tracking-[0.2em] text-gray-100 bg-black/50 border border-white/10 rounded">
            🎛 STUDIO FLOOR
          </span>
          <span className="px-2 py-1 text-[10px] font-bold tracking-wider text-emerald-300/90 bg-black/50 border border-white/10 rounded">
            {gameState.currentYear}
          </span>
        </div>
      </div>
      <button className="studio-camera-center absolute right-3 top-2 studio-dock-button bg-slate-950/70 border border-white/10 flex items-center gap-1.5"
        onClick={() => setCameraReset(value => value + 1)} aria-label="Center studio camera" title="Center studio camera">
        {gamepad.isConnected && gamepad.lastInputType === 'gamepad' && (
          <GamepadGlyph button="rs" size="xs" />
        )}
        <LocateFixed size={18} />
      </button>
      {gamepad.isConnected && gamepad.lastInputType === 'gamepad' ? (
        <div className="absolute bottom-2 left-3 flex items-center gap-2 bg-slate-950/85 px-2.5 py-1.5 rounded-full border border-slate-700/60 shadow-lg text-[11px] text-slate-300 pointer-events-none select-none animate-in fade-in">
          <GamepadGlyph button="dpadLeft" size="xs" />
          <GamepadGlyph button="dpadRight" size="xs" />
          <span>Target: <b className="text-amber-300">{HOTSPOT_NAMES[STUDIO_HOTSPOTS[focusedHotspotIndex]]}</b></span>
          <span className="text-slate-600">|</span>
          <GamepadGlyph button="south" size="xs" />
          <span>Inspect</span>
        </div>
      ) : (
        <p className="studio-room-hint absolute bottom-2 left-3 text-[10px] text-slate-400 pointer-events-none">
          Tap objects · pinch to zoom · two-finger pan
        </p>
      )}
    </div>
  );
};

export default StudioRoom;
