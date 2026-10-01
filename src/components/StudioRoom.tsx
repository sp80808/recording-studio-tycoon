import { TAKE_FEEDBACK_EVENT, takeQuip, type TakeFeedbackDetail } from '@/utils/takeFeedback';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import WebGLCanvas, { StudioHotspotId, HotspotAnchors } from '@/components/WebGLCanvas';
import { StudioInspector } from '@/components/StudioInspector';
import { GameState, Project } from '@/types/game';
import { useSettings } from '@/contexts/SettingsContext';
import { gameAudio } from '@/utils/audioSystem';
import { ProgressionSystem } from '@/services/ProgressionSystem';
import { TierUpgradeAnimation } from './TierUpgradeAnimation';
import { toast } from '@/hooks/use-toast';
import { DoorOpen, LocateFixed, Megaphone, Phone } from 'lucide-react';
import { getEraDecor, getTrophyInput } from '@/components/studio/studioDecorConfig';
import { triggerScreenShake } from '@/utils/screenShake';
import { AUTHORED_CHORES } from '@/simulation/choreEngine';
import { useGamepad } from '@/hooks/useGamepad';
import { GamepadGlyph } from '@/components/ui/GamepadGlyph';
import {
  MotionReveal,
  MotionNumber,
  MotionButton,
} from '@/components/motion/primitives';

const STUDIO_HOTSPOTS: StudioHotspotId[] = ['console', 'phone', 'liveRoom', 'shelf', 'tv', 'clock', 'door'];
const HOTSPOT_NAMES: Record<StudioHotspotId, string> = {
  console: 'Console Desk',
  phone: 'Studio Phone',
  liveRoom: 'Live Room',
  shelf: 'Vinyl Shelf',
  tv: 'Charts & TV',
  clock: 'Studio Clock',
  door: 'Studio Door',
  promotion: 'Phone & Ring Light',
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
  onCompleteChore?: (hotspot: StudioHotspotId) => boolean;
  activeChoreId?: string | null;
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
  onCompleteChore,
  activeChoreId,
  onBookings,
  className = '',
  style,
}) => {
  const { settings } = useSettings();
  const [activeInspector, setActiveInspector] = useState<StudioHotspotId | null>(null);
  const [cameraReset, setCameraReset] = useState(0);
  const [anchors, setAnchors] = useState<HotspotAnchors>({});
  const [tierFlash, setTierFlash] = useState(false);
  const [pendingTierUpgrade, setPendingTierUpgrade] = useState<{ oldTier: number; newTier: number } | null>(null);
  const playClick = () => { if (settings.sfxEnabled) gameAudio.playUISound('buttonClick'); };
  const eraDecor = getEraDecor(gameState.currentEra, gameState.currentYear);
  const studioHotspots = eraDecor.prop === 'led-strip' ? [...STUDIO_HOTSPOTS, 'promotion' as const] : STUDIO_HOTSPOTS;

  // Studio tier (1-5) from the progression milestones — drives visible
  // room upgrades in the Pixi scene (bead ifx.3).
  const roomTier = useMemo(() => {
    return ProgressionSystem.getStudioTier(gameState);
  }, [gameState]);

  // Celebrate a tier-up in-place: flash overlay + shake + fanfare + toast.
  const prevTierRef = useRef(roomTier);
  useEffect(() => {
    if (roomTier > prevTierRef.current) {
      const oldTier = prevTierRef.current;
      setTierFlash(true);
      triggerScreenShake('medium');
      gameAudio.playUISound('projectComplete');
      setPendingTierUpgrade({ oldTier, newTier: roomTier });
      toast({
        title: '🏗️ Studio Upgraded!',
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

  const [takeFx, setTakeFx] = useState<TakeFeedbackDetail | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onTake = (e: Event) => {
      setTakeFx((e as CustomEvent<TakeFeedbackDetail>).detail);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setTakeFx(null), 1600);
    };
    window.addEventListener(TAKE_FEEDBACK_EVENT, onTake);
    return () => { window.removeEventListener(TAKE_FEEDBACK_EVENT, onTake); if (timer) clearTimeout(timer); };
  }, []);

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
      artistName: project ? (project.clientName ?? project.title) : undefined,
      producerAppearance: gameState.playerData.appearance,
      staffOnFloor: Math.min(5, 1 + presentStaff),
      ownedEquipment: gameState.ownedEquipment.length,
      day: gameState.currentDay,
      eraId: eraDecor.eraId,
      roomTier,
      trophies: getTrophyInput(gameState),
      decorSeed: String(gameState.saveSeed ?? 'studio'),
    };
  }, [gameState.playerData.appearance, gameState.activeProject, gameState.hiredStaff, gameState.ownedEquipment, gameState.currentDay, eraDecor.eraId, gameState.financials, gameState.unlockedAchievements, gameState.saveSeed, roomTier]);

  /** Every hotspot now opens its contextual inspector (bead goj.2). */
  const handleHotspot = (id: StudioHotspotId) => {
    if (id === 'promotion' && eraDecor.prop !== 'led-strip') return;
    if (settings.sfxEnabled) {
      if (id === 'console' || id === 'shelf') {
        void gameAudio.playGearSwitch();
      } else {
        void gameAudio.playTactileClick();
      }
    }
    if ((id === 'console' || id === 'liveRoom') && onCompleteChore?.(id)) return;
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
      setFocusedHotspotIndex((prev) => (prev + 1) % studioHotspots.length);
      gamepad.triggerHaptic(0.1, 0.15, 30);
    } else if (gamepad.justPressed.dpadLeft || gamepad.justPressed.dpadUp) {
      setFocusedHotspotIndex((prev) => (prev - 1 + studioHotspots.length) % studioHotspots.length);
      gamepad.triggerHaptic(0.1, 0.15, 30);
    } else if (gamepad.justPressed.south) {
      const selected = studioHotspots[focusedHotspotIndex % studioHotspots.length];
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
    studioHotspots.length,
  ]);

  const availableCount = gameState.availableProjects.length;

  return (
    <div 
      className={`relative overflow-hidden rounded-lg border border-stone-700/70 bg-[#1b1815] transition-all duration-300 ${className}`} 
      style={style}
    >
      <WebGLCanvas state={sceneState} onHotspotSelect={handleHotspot} resetCameraKey={cameraReset} onHotspotAnchors={setAnchors} />
      {tierFlash && <div className="tier-flash-overlay" />}
      {takeFx && (
        <div key={takeFx.seq} className={`take-fx take-fx-${takeFx.grade.toLowerCase()}`} aria-hidden="true">
          <div className="take-fx-vu">{Array.from({ length: 8 }, (_, i) => <i key={i} style={{ animationDelay: `${i * 18}ms` }} />)}</div>
          <div className="take-fx-grade">{takeFx.grade === 'Gold' ? 'GOLD' : takeFx.grade === 'Silver' ? 'TIGHT' : 'SOLID'}</div>
          <div className="take-fx-bubble">{takeQuip(takeFx.grade, takeFx.seq)}</div>
        </div>
      )}
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
          onCompleteChore={onCompleteChore}
          onBookings={onBookings}
        />
      )}
      {/* Top-left overlay stack: sits below the HUD (see .studio-room-overlay-tl) and flows
          vertically so the label, enquiry pill and any future chips can never overlap. */}
      <div className="studio-room-overlay-tl select-none">
        <div className="studio-room-label flex items-center gap-2 pointer-events-none">
          <span className="px-2 py-1 text-[10px] font-black tracking-[0.2em] text-stone-100 bg-black/50 border border-white/10 rounded">
            🎛 STUDIO FLOOR
          </span>
          <span className="px-2 py-1 text-[10px] font-bold tracking-wider text-[var(--rst-brass-300)] bg-black/50 border border-white/10 rounded">
            {gameState.currentYear}
          </span>
        </div>
        {/* Peripheral Unread Enquiry Indicator (Issue #75: short spatial/opacity motion, NO infinite bounce/pulse, NO modal takeover) */}
        {availableCount > 0 && (
          <MotionReveal direction="down" distance={8}>
            <button
              onClick={() => handleHotspot('phone')}
              className="studio-room-chip rst-duty-chip"
              title={`${availableCount} Artist ${availableCount === 1 ? 'Enquiry' : 'Enquiries'} Waiting`}
              aria-label={`${availableCount} Artist Enquiries Waiting`}
            >
              <Phone size={12} className="text-amber-200" aria-hidden="true" />
              <span className="text-[10px] font-medium tracking-wide">Enquiry</span>
              <span className="px-1.5 py-0.2 text-[9px] font-black rounded-full bg-amber-400 text-stone-950">
                <MotionNumber value={availableCount} />
              </span>
            </button>
          </MotionReveal>
        )}
      </div>

      <div className="studio-floor-exits absolute left-3 z-10 flex gap-2">
        <button type="button" onClick={() => handleHotspot('door')} className="studio-room-chip rst-duty-chip min-h-11 focus-visible:ring-2 focus-visible:ring-amber-300">
          <DoorOpen size={14} aria-hidden="true" /> Go out
        </button>
        {eraDecor.prop === 'led-strip' && (
          <button type="button" onClick={() => handleHotspot('promotion')} className="studio-room-chip rst-duty-chip min-h-11 focus-visible:ring-2 focus-visible:ring-amber-300">
            <Megaphone size={14} aria-hidden="true" /> Promotion
          </button>
        )}
      </div>

      {/* Floating Chore Hotspot Attention Badges (Settled one-shot reveal, NO infinite bounce/pulse) */}
      {(() => {
        const choreState = gameState.choreState;
        if (!choreState) return null;
        const pendingConsoleChores = Object.values(choreState.chores).filter(c => c.hotspotId === 'console' && !c.completed);
        const pendingLiveRoomChores = Object.values(choreState.chores).filter(c => AUTHORED_CHORES[c.id]?.hotspotId === 'liveRoom' && !c.completed);

        // Badges ride on their hotspot so pan/zoom never strands them; fixed corners are the pre-first-frame fallback.
        const anchorStyle = (id: StudioHotspotId): React.CSSProperties | undefined => {
          const a = anchors[id];
          if (!a) return undefined;
          return {
            position: 'absolute',
            left: `clamp(80px, ${a.x}px, calc(100% - 80px))`,
            top: `max(${a.y}px, 40px)`,
            transform: 'translate(-50%, calc(-100% - 8px))',
            zIndex: 20,
          };
        };
        const consoleStyle = anchorStyle('console');
        const liveStyle = anchorStyle('liveRoom');

        return (
          <>
            {pendingConsoleChores.length > 0 && (
              <div style={consoleStyle}>
                <MotionReveal direction="up" distance={6}>
                  <button
                    onClick={() => handleHotspot('console')}
                    className={`rst-duty-chip feel-attention ${consoleStyle ? '' : 'studio-duty-console absolute bottom-14 left-6 z-20'} ${activeChoreId ? 'pointer-events-none opacity-70' : ''}`}
                    title={`${pendingConsoleChores.length} Console Maintenance Duty Pending`}
                    aria-disabled={Boolean(activeChoreId)}
                  >
                    <span>🔧</span>
                    <span>{activeChoreId === pendingConsoleChores[0].id ? `Working… ${pendingConsoleChores[0].title}` : pendingConsoleChores[0].title}</span>
                  </button>
                </MotionReveal>
              </div>
            )}
            {pendingLiveRoomChores.length > 0 && (
              <div style={liveStyle}>
                <MotionReveal direction="up" distance={6}>
                  <button
                    onClick={() => handleHotspot('liveRoom')}
                    className={`rst-duty-chip feel-attention ${liveStyle ? '' : 'studio-duty-live absolute bottom-16 right-6 z-20'} ${activeChoreId ? 'pointer-events-none opacity-70' : ''}`}
                    title="Live Room: Tune Acoustics"
                    aria-disabled={Boolean(activeChoreId)}
                  >
                    <span>✨</span>
                    <span>{activeChoreId === pendingLiveRoomChores[0].id ? 'Working… Tune Acoustics' : 'Tune Acoustics'}</span>
                  </button>
                </MotionReveal>
              </div>
            )}
          </>
        );
      })()}
      {/* Top-right overlay stack: camera recentre, then the lounge chore chip beneath it. */}
      {roomTier > 1 && <div className="studio-room-overlay-tr">
        <button className="studio-camera-center studio-dock-button bg-stone-950/70 border border-white/10 flex items-center gap-1.5"
          onClick={() => {
            setCameraReset(value => value + 1);
            playClick();
            toast({ title: 'Studio view centered', description: 'The room camera is back at its default position.' });
          }} aria-label="Center studio camera" title="Center studio camera">
          {gamepad.isConnected && gamepad.lastInputType === 'gamepad' && (
            <GamepadGlyph button="rs" size="xs" />
          )}
          <LocateFixed size={18} />
        </button>
        {(() => {
          const shelfChores = Object.values(gameState.choreState?.chores ?? {}).filter(c => c.hotspotId === 'shelf' && !c.completed);
          if (shelfChores.length === 0) return null;
          return (
            <MotionReveal direction="down" distance={6}>
              <button
                onClick={() => handleHotspot('shelf')}
                className="studio-room-chip rst-duty-chip"
                title="Lounge: Brew Espresso"
              >
                <span>☕</span>
                <span>Brew Espresso</span>
              </button>
            </MotionReveal>
          );
        })()}
      </div>}
      {gamepad.isConnected && gamepad.lastInputType === 'gamepad' ? (
        <div className="absolute bottom-2 left-3 flex items-center gap-2 bg-stone-950/85 px-2.5 py-1.5 rounded-full border border-stone-700/60 shadow-lg text-[11px] text-stone-300 pointer-events-none select-none animate-in fade-in">
          <GamepadGlyph button="dpadLeft" size="xs" />
          <GamepadGlyph button="dpadRight" size="xs" />
          <span>Target: <b className="text-amber-300">{HOTSPOT_NAMES[studioHotspots[focusedHotspotIndex % studioHotspots.length]]}</b></span>
          <span className="text-stone-600">|</span>
          <GamepadGlyph button="south" size="xs" />
          <span>Inspect</span>
        </div>
      ) : (
        <p className="studio-room-hint absolute bottom-2 left-3 text-[10px] text-stone-400 pointer-events-none">
          Tap objects · pinch to zoom · two-finger pan<span className="hidden [@media(pointer:fine)]:inline"> · press ? for shortcuts</span>
        </p>
      )}
      {pendingTierUpgrade && (
        <TierUpgradeAnimation
          isVisible={!!pendingTierUpgrade}
          oldTier={pendingTierUpgrade.oldTier}
          newTier={pendingTierUpgrade.newTier}
          onComplete={() => setPendingTierUpgrade(null)}
          focusMode={settings.reducedMotion}
        />
      )}
    </div>
  );
};

export default StudioRoom;
