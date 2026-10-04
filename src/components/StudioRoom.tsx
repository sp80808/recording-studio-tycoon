import { pickFloorStaff } from '@/components/studio/staffStaging';
import { TAKE_FEEDBACK_EVENT, takeQuip, type TakeFeedbackDetail } from '@/utils/takeFeedback';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import WebGLCanvas, { StudioHotspotId, HotspotAnchors } from '@/components/WebGLCanvas';
import { RoomVignette } from '@/components/studio/RoomVignette';
import { StudioRoomTabs } from '@/components/studio/StudioRoomTabs';
import { getOccupiedRoomIds, getOperationalStudioRooms } from '@/utils/studioRoomUtils';
import { normalizeHotspotId } from '@/utils/studioHotspots';
import { getDirectionalTargetIndex, getStickDirection, type ControllerNavDirection } from '@/utils/controllerNavigation';
import { StudioInspector } from '@/components/StudioInspector';
import { GameState, Project, SessionIntervention } from '@/types/game';
import { useSettings } from '@/contexts/SettingsContext';
import { gameAudio } from '@/utils/audioSystem';
import { ProgressionSystem } from '@/services/ProgressionSystem';
import { TierUpgradeAnimation } from './TierUpgradeAnimation';
import { toast } from '@/hooks/use-toast';
import { Coffee, Waves, Wrench } from 'lucide-react';
import { getEraDecor, getTrophyInput } from '@/components/studio/studioDecorConfig';
import { useStudioClock } from '@/contexts/StudioClockContext';
import { triggerScreenShake } from '@/utils/screenShake';
import { findPendingChoreForHotspot, getChoreCanonicalHotspot } from '@/simulation/choreEngine';
import { isFlightCaseSystemUnlocked } from '@/economy/flightCaseEconomy';
import { useGamepad } from '@/hooks/useGamepad';
import { GamepadGlyph } from '@/components/ui/GamepadGlyph';
import { MotionReveal } from '@/components/motion/primitives';
import { ChoreHotspotButton } from '@/components/chores/ChoreHotspotButton';
import { parseNpcVisualIdentity, type NpcVisualIdentity } from '@/features/sprites/npcAppearance';
import { buildProducerNpc } from '@/features/sprites/producerAppearance';
import {
  animStateForStaffStatus,
  hashSeed,
  staffRoleToStudioRole,
  type FloorNpcFigure,
} from '@/features/sprites/floorNpcs';

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
  cases: 'Flight Cases',
  producer: 'You',
};

interface StudioRoomProps {
  gameState: GameState;
  onAdvanceDay: () => void;
  onRefreshProjects?: () => boolean;
  onStartProject?: (project: Project) => void;
  onAssignStaff?: (staffId: string) => void;
  onUnassignStaff?: (staffId: string) => void;
  /** Opens the Flight Case Depot (diegetic: tap the case stack on the floor). */
  onOpenCases?: () => void;
  onOpenDashboardTab?: (tab: 'studio' | 'skills' | 'bands' | 'charts' | 'staff') => void;
  onConsoleFocus: () => void;
  onCompleteChore?: (hotspot: StudioHotspotId) => boolean;
  activeChoreId?: string | null;
  onBookings?: () => void;
  /** Fired once the Pixi floor paints its first frame (shell reveals GUI + 3D together). */
  onStudioReady?: () => void;
  /** False while a ContextDrawer owns attention — suppresses idle auto-zoom. */
  floorFocused?: boolean;
  lockedHotspot?: StudioHotspotId | null;
  worldControls?: boolean;
  intervention?: SessionIntervention | null;
  onInterventionFocus?: () => void;
  className?: string;
  cameraResetKey?: number;
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
  onOpenCases,
  onConsoleFocus,
  onCompleteChore,
  activeChoreId,
  onBookings,
  onStudioReady,
  floorFocused = true,
  lockedHotspot = null,
  worldControls = false,
  intervention = null,
  onInterventionFocus,
  className = '',
  cameraResetKey = 0,
  style,
}) => {
  const { settings } = useSettings();
  const studioClock = useStudioClock();
  const [activeInspector, setActiveInspector] = useState<StudioHotspotId | null>(null);
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
    const presentStaff = pickFloorStaff(gameState.hiredStaff);
    const activity = Math.min(
      1,
      0.08 + (project ? 0.3 + progress * 0.45 : 0) + workingStaff * 0.08
    );
    // Optional appearance fields land with creator/crew siblings — duck-type until merge.
    const playerAppearance = parseNpcVisualIdentity(
      (gameState.playerData as { appearance?: unknown } | undefined)?.appearance,
    );
    // Career-start customisation (#126/k5v): resolve the exact creator look so the
    // on-floor producer matches the preview. Falls back to the seed figure when absent.
    const customization = gameState.producerCustomization;
    const producerNpc = customization
      ? buildProducerNpc(
          customization.appearance,
          customization.moniker ?? (gameState.playerData as { name?: string } | undefined)?.name ?? 'Producer',
          gameState.selectedEra ?? gameState.currentEra,
        )
      : undefined;
    const floorFigures: FloorNpcFigure[] = [
      {
        identity: playerAppearance ?? undefined,
        seed: hashSeed(`producer:${gameState.saveSeed ?? 'studio'}`),
        role: 'producer',
        name: (gameState.playerData as { name?: string } | undefined)?.name,
        animState: project ? 'mixing' : 'idle',
      },
      ...presentStaff.slice(0, 4).map((member, index): FloorNpcFigure => {
        const withLook = member as typeof member & {
          appearance?: NpcVisualIdentity;
          portraitSeed?: number;
        };
        return {
          identity: parseNpcVisualIdentity(withLook.appearance) ?? undefined,
          seed: withLook.portraitSeed ?? hashSeed(member.id || `staff:${index}`),
          role: staffRoleToStudioRole(member.role),
          name: member.name,
          animState: animStateForStaffStatus(member.status, !!project),
        };
      }),
    ];
    const pendingChoreHotspot = (() => {
      const choreState = gameState.choreState;
      if (!choreState) return null;
      for (const id of ['console', 'liveRoom', 'shelf'] as const) {
        if (findPendingChoreForHotspot(choreState, id)) return id;
      }
      return null;
    })();
    return {
      activity,
      hasActiveProject: !!project,
      artistName: project ? (project.clientName ?? project.title) : undefined,
      staffOnFloor: Math.min(5, Math.max(1, floorFigures.length)),
      floorFigures,
      producerAppearance: playerAppearance ?? undefined,
      producerNpc,
      ownedEquipmentIds: gameState.ownedEquipment.map((e) => e.id),
      gearConditions: Object.fromEntries(
        gameState.ownedEquipment
          .filter((e) => typeof e.condition === 'number')
          .map((e) => [e.id, e.condition] as const),
      ),
      ownedEquipment: gameState.ownedEquipment.length,
      day: gameState.currentDay,
      clockMinutes: studioClock.minutesOfDay,
      eraId: eraDecor.eraId,
      cityId: gameState.cityId,
      roomTier,
      premisesTier: gameState.premisesTier ?? 0,
      pendingCases: isFlightCaseSystemUnlocked(gameState)
        ? (gameState.pendingCrates ?? []).map((c) => c.tier)
        : [],
      trophies: getTrophyInput(gameState),
      decorSeed: String(gameState.saveSeed ?? 'studio'),
      enquiryWaiting: gameState.availableProjects.length > 0,
      pendingChoreHotspot,
      lockedHotspot,
      floorFocused: floorFocused && !activeInspector,
      coffeeSteaming: Boolean(gameState.choreState?.chores?.brew_espresso?.completed),
      riderBeers: Boolean(
        project &&
          project.rider?.items.some((item) => item.kind === 'beer'),
      ),
    };
  }, [gameState.activeProject, gameState.hiredStaff, gameState.ownedEquipment, gameState.currentDay, gameState.currentEra, gameState.cityId, eraDecor.eraId, gameState.financials, gameState.unlockedAchievements, gameState.saveSeed, gameState.playerData, gameState.availableProjects.length, gameState.choreState, gameState.premisesTier, gameState.pendingCrates, roomTier, floorFocused, activeInspector, studioClock.minutesOfDay, lockedHotspot]);

  /**
   * Diegetic floor routes: pending chores always run the chore flow first.
   * Console + live room open the session work panel only when no duty remains.
   */
  const [viewRoomId, setViewRoomId] = useState('studio-a');
  const operationalRooms = useMemo(() => getOperationalStudioRooms(gameState), [gameState.studioRooms]);
  const occupiedRooms = useMemo(() => getOccupiedRoomIds(gameState), [gameState.activeProject, gameState.activeProjects]);
  const viewRoom = operationalRooms.find((r) => r.id === viewRoomId && r.id !== 'studio-a');
  const roomProjectTitle = (roomId: string): string | null => {
    const all = [gameState.activeProject, ...(gameState.activeProjects ?? [])];
    return all.find((p) => p?.bookingRoomId === roomId)?.title ?? null;
  };
  const handleHotspot = (id: StudioHotspotId | string) => {
    if (!floorFocused) return;
    if (id === 'producer') {
      if (settings.sfxEnabled) void gameAudio.playTactileClick();
      setActiveInspector('producer');
      return;
    }
    if (id === 'cases') {
      if (settings.sfxEnabled) void gameAudio.playLatch();
      onOpenCases?.();
      return;
    }
    const canonical = (normalizeHotspotId(id) ?? id) as StudioHotspotId;
    if (canonical === 'promotion' && eraDecor.prop !== 'led-strip') return;
    if (settings.sfxEnabled) {
      if (canonical === 'console') {
        void gameAudio.playLatch();
      } else if (canonical === 'shelf') {
        void gameAudio.playRackSelect();
      } else if (canonical === 'phone') {
        void gameAudio.playEnquiryTone();
      } else {
        void gameAudio.playTactileClick();
      }
    }
    if (canonical === 'console' || canonical === 'liveRoom' || canonical === 'shelf') {
      const pending = findPendingChoreForHotspot(gameState.choreState, canonical);
      if (pending) {
        onCompleteChore?.(canonical);
        return;
      }
    }
    // Console desk and live booth share the session work screen when idle.
    if (canonical === 'console' || canonical === 'liveRoom') { onConsoleFocus(); return; }
    if (canonical === 'phone' && onBookings) { onBookings(); return; }
    setActiveInspector(canonical);
  };

  useEffect(() => { if (!floorFocused) setActiveInspector(null); }, [floorFocused]);

  const closeInspector = () => {
    if (settings.sfxEnabled) gameAudio.playUISound('menuClose');
    setActiveInspector(null);
  };

  const gamepad = useGamepad({
    preferredLayout: settings?.controllerLayout,
    hapticsEnabled: settings?.gamepadHaptics,
  });

  const [focusedHotspotIndex, setFocusedHotspotIndex] = useState(0);
  const [localCameraReset, setCameraReset] = useState(0);
  const previousFloorStickDirectionRef = useRef<ControllerNavDirection | null>(null);

  // Close inspector on B button
  useEffect(() => {
    if (!gamepad.isConnected || !activeInspector) return;
    if (gamepad.justPressed.east) {
      closeInspector();
      gamepad.triggerHaptic(0.1, 0.2, 40);
    }
  }, [gamepad.isConnected, activeInspector, gamepad.justPressed.east]);

  // Navigate floor hotspots in screen-space: D-pad or left stick moves toward
  // what the player can actually see, rather than cycling a hidden linear list.
  useEffect(() => {
    if (!gamepad.isConnected || activeInspector || !floorFocused || studioHotspots.length === 0) return;

    const stickDirection = getStickDirection(gamepad.leftStick.x, gamepad.leftStick.y);
    const stickJustMoved = stickDirection && stickDirection !== previousFloorStickDirectionRef.current;
    previousFloorStickDirectionRef.current = stickDirection;

    const direction: ControllerNavDirection | null =
      gamepad.justPressed.dpadRight ? 'right' :
      gamepad.justPressed.dpadLeft ? 'left' :
      gamepad.justPressed.dpadDown ? 'down' :
      gamepad.justPressed.dpadUp ? 'up' :
      stickJustMoved ? stickDirection :
      null;

    if (direction) {
      setFocusedHotspotIndex((prev) =>
        getDirectionalTargetIndex(studioHotspots, anchors, prev, direction)
      );
      gamepad.triggerHaptic(0.1, 0.15, 30);
      return;
    }

    if (gamepad.justPressed.south) {
      const selected = studioHotspots[focusedHotspotIndex % studioHotspots.length];
      handleHotspot(selected);
      gamepad.triggerHaptic(0.2, 0.3, 50);
      return;
    }

    // X / Square is a real contextual quick-work button on the floor.
    if (gamepad.justPressed.west) {
      if (gameState.activeProject) {
        onConsoleFocus();
      } else if (gameState.availableProjects.length > 0 && onBookings) {
        onBookings();
      } else {
        handleHotspot('console');
      }
      gamepad.triggerHaptic(0.2, 0.3, 55);
    }
  }, [
    gamepad.isConnected,
    gamepad.justPressed.dpadRight,
    gamepad.justPressed.dpadDown,
    gamepad.justPressed.dpadLeft,
    gamepad.justPressed.dpadUp,
    gamepad.justPressed.south,
    gamepad.justPressed.west,
    gamepad.leftStick.x,
    gamepad.leftStick.y,
    activeInspector,
    floorFocused,
    focusedHotspotIndex,
    studioHotspots,
    anchors,
    gameState.activeProject,
    gameState.availableProjects.length,
    onBookings,
    onConsoleFocus,
  ]);

  // R3 recentres the isometric floor camera from anywhere on the unobstructed floor.
  useEffect(() => {
    if (!gamepad.isConnected || activeInspector || !floorFocused || !gamepad.justPressed.rs) return;
    setCameraReset((value) => value + 1);
    gamepad.triggerHaptic(0.14, 0.28, 45);
  }, [gamepad.isConnected, gamepad.justPressed.rs, activeInspector, floorFocused]);

  return (
    <div 
      data-rst-studio="mounted"
      className={`relative overflow-hidden rounded-lg border border-stone-700/70 bg-[#1b1815] transition-all duration-300 ${className}`} 
      style={style}
    >
      <WebGLCanvas state={sceneState} onHotspotSelect={handleHotspot} resetCameraKey={cameraResetKey + localCameraReset} onHotspotAnchors={setAnchors} onFirstFrame={onStudioReady} />

      {viewRoom && <RoomVignette room={viewRoom} occupiedBy={roomProjectTitle(viewRoom.id)} />}
      <StudioRoomTabs rooms={operationalRooms} activeId={viewRoom ? viewRoom.id : 'studio-a'} occupied={occupiedRooms} onSelect={(id) => { if (settings.sfxEnabled) void gameAudio.playTactileClick(); setViewRoomId(id); }} />
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
      {/* Quiet era mark — no boxed title fighting the HUD / session strip. */}
      <div className="studio-room-overlay-tl select-none" aria-hidden="true">
        <div className="studio-room-label">
          <span className="studio-room-label__mark">Floor</span>
          <span className="studio-room-label__year">{gameState.currentYear}</span>
        </div>
      </div>

      {/* Chore overlay buttons (kept): same shortcut as clicking the floor
          object itself — handleHotspot runs the pending chore first. Anchors
          are clamped and separated so the chips never overlap each other, the
          camera button, or the session strip; they hide while an inspector,
          drawer, or room vignette owns attention. */}
      {(() => {
        const choreState = gameState.choreState;
        if (!choreState || viewRoom || !floorFocused || activeInspector) return null;
        const pendingConsoleChores = Object.values(choreState.chores).filter(
          (c) => getChoreCanonicalHotspot(c) === 'console' && !c.completed
        );
        const pendingLiveRoomChores = Object.values(choreState.chores).filter(
          (c) => getChoreCanonicalHotspot(c) === 'liveRoom' && !c.completed
        );

        const anchorStyle = (id: StudioHotspotId | 'coffee', dyPx: number): React.CSSProperties | undefined => {
          const a = (anchors as any)[id];
          if (!a) return undefined;
          return {
            position: 'absolute',
            left: `clamp(88px, ${a.x}px, calc(100% - 88px))`,
            top: `max(${a.y + dyPx}px, 96px)`,
            transform: 'translate(-50%, calc(-100% - 10px))',
            zIndex: 20,
          };
        };
        // Console sits left, live room right, coffee sits at lounge candle table;
        // vertical nudge keeps chips from colliding when 3D anchors project close.
        const consoleStyle = anchorStyle('console', 0);
        const liveStyle = anchorStyle('liveRoom', -26);
        const coffeeStyle = anchorStyle('coffee', 0) || anchorStyle('shelf', 0);
        const busy = Boolean(activeChoreId);
        const consoleChore = pendingConsoleChores[0];
        const liveChore = pendingLiveRoomChores[0];
        const shelfChore = findPendingChoreForHotspot(gameState.choreState, 'shelf');

        return (
          <>
            {consoleChore && (
              <div style={consoleStyle}>
                <MotionReveal direction="up" distance={6}>
                  <ChoreHotspotButton
                    kind="maintenance"
                    icon={Wrench}
                    label={consoleChore.title}
                    meta={pendingConsoleChores.length > 1 ? `${pendingConsoleChores.length}` : `${consoleChore.energyCost}⚡`}
                    attention
                    working={activeChoreId === consoleChore.id}
                    disabled={busy && activeChoreId !== consoleChore.id}
                    className={`studio-room-chip ${consoleStyle ? '' : 'studio-duty-console absolute bottom-14 left-6 z-20'} ${busy && activeChoreId !== consoleChore.id ? 'pointer-events-none opacity-70' : ''}`}
                    title={`${pendingConsoleChores.length} console maintenance duty pending — same as clicking the console desk`}
                    onClick={() => handleHotspot('console')}
                  />
                </MotionReveal>
              </div>
            )}
            {liveChore && (
              <div style={liveStyle}>
                <MotionReveal direction="up" distance={6}>
                  <ChoreHotspotButton
                    kind="acoustics"
                    icon={Waves}
                    label="Tune Acoustics"
                    meta={`${liveChore.energyCost}⚡`}
                    attention
                    working={activeChoreId === liveChore.id}
                    disabled={busy && activeChoreId !== liveChore.id}
                    className={`studio-room-chip ${liveStyle ? '' : 'studio-duty-live absolute bottom-16 right-6 z-20'} ${busy && activeChoreId !== liveChore.id ? 'pointer-events-none opacity-70' : ''}`}
                    title="Live Room: Tune Acoustics — same as clicking the live booth"
                    onClick={() => handleHotspot('liveRoom')}
                  />
                </MotionReveal>
              </div>
            )}
            {shelfChore && (
              <div style={coffeeStyle}>
                <MotionReveal direction="up" distance={6}>
                  <ChoreHotspotButton
                    kind="hospitality"
                    icon={Coffee}
                    label="Brew Espresso"
                    meta={shelfChore.energyCost > 0 ? `${shelfChore.energyCost}⚡` : 'Free'}
                    attention
                    working={activeChoreId === shelfChore.id}
                    disabled={busy && activeChoreId !== shelfChore.id}
                    className={`studio-room-chip ${coffeeStyle ? '' : 'studio-duty-coffee absolute bottom-16 right-16 z-20'} ${busy && activeChoreId !== shelfChore.id ? 'pointer-events-none opacity-70' : ''}`}
                    title="Lounge: Brew Espresso — click here or tap the coffee table"
                    onClick={() => handleHotspot('shelf')}
                  />
                </MotionReveal>
              </div>
            )}
          </>
        );
      })()}
      {gamepad.isConnected && gamepad.lastInputType === 'gamepad' ? (
        <div className="studio-room-gamepad-hint pointer-events-none select-none">
          <GamepadGlyph button="dpadLeft" size="xs" />
          <GamepadGlyph button="dpadRight" size="xs" />
          <span>Target: <b className="text-amber-300">{HOTSPOT_NAMES[studioHotspots[focusedHotspotIndex % studioHotspots.length]]}</b></span>
          <span className="text-stone-600">|</span>
          <GamepadGlyph button="south" size="xs" />
          <span>Inspect</span>
        </div>
      ) : null}
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
