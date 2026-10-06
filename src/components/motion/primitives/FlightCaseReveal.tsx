import React, { useState, useEffect, useCallback, useRef, useReducer } from 'react';
import type { StandardButton } from '@/types/gamepad';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Wrench,
  DollarSign,
  PackageCheck,
  Archive,
  BadgeCheck,
  FastForward,
  CheckCircle2,
} from 'lucide-react';
import { EquipmentItem, Rarity } from '@/features/boxDrops/lootGenerator';
import { FlightCaseTier, FLIGHT_CASES, getFlightCaseDef } from '@/data/flightCases';
import { playSound, gameAudio } from '@/utils/audioSystem';
import { useGamepad } from '@/hooks/useGamepad';
import { useSettings } from '@/contexts/settings-context-types';
import { GamepadGlyph } from '@/components/ui/GamepadGlyph';
import { GlowSweep } from '@/components/motion/origin/GlowSweep';
import { useMotionCapabilities } from '@/lib/motion/capabilities';
import { motionSpring } from '@/lib/motion/tokens';
import {
  type RevealPhase,
  type RevealState,
  createInitialRevealState,
  revealReducer,
  REVEAL_PHASE_TIMINGS,
} from '@/features/boxDrops/revealStateMachine';

// Studio Hardware Connector Suite & Audio
import {
  PixiParticleBurst,
  RarityMaterialSweep,
  AnimatedGearFlourish,
  RARITY_FX_POLICY,
  burstRendererPreset,
} from "@/features/boxDrops/fx";

import {
  playConnectorSnap,
  playJackInsert,
  playJackRemove,
  playAuditionChord,
  ButterflyTwistLatch,
  TestBench,
  ConnectorActionRouting,
  type PatchSocket,
} from '@/features/boxDrops/connectors';
import { BENCH_TESTS, gearKindOf, type GearKind } from '@/features/boxDrops/gearKind';
import { GearSilhouette } from '@/features/boxDrops/GearSilhouette';
import { hapticTick } from '@/utils/mobilePlatform';
import { formatNumber } from '@/i18n/formatLocale';

export interface PremiumDisplayItem {
  ref: string;
  label: string;
  icon: string;
}

export interface PremiumCaseReward {
  productTitle: string;
  items: PremiumDisplayItem[];
}

export type CaseSource = 'earned' | 'purchase';

export interface FlightCaseRevealProps {
  /** Resolved equipment item or premium celebration. Fixed & immutable before animation begins. */
  outcome: EquipmentItem | PremiumCaseReward;
  /** Explicit tier from flightCases.ts, or auto-inferred from rarity */
  tier?: FlightCaseTier;
  source?: CaseSource;
  titleOverride?: string;
  itemIndex?: number;
  totalItems?: number;
  onAction?: (action: 'equip' | 'stash' | 'sell' | 'claim', outcome: EquipmentItem | PremiumCaseReward) => void;
  onClose: () => void;
  className?: string;
  focusMode?: boolean;
}

export const RARITY_CONFIG: Record<Rarity, {
  label: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
  glowColor: string;
  rayColor: string;
  glowTone: 'gold' | 'amber' | 'cyan' | 'emerald';
}> = {
  common: {
    label: 'Standard',
    badgeBg: 'bg-stone-800',
    textColor: 'text-stone-300',
    borderColor: 'border-stone-500',
    glowColor: 'rgba(148, 163, 184, 0.4)',
    rayColor: '#94a3b8',
    glowTone: 'amber',
  },
  uncommon: {
    label: 'Roadworn Workhorse',
    badgeBg: 'bg-emerald-950',
    textColor: 'text-emerald-300',
    borderColor: 'border-emerald-500',
    glowColor: 'rgba(16, 185, 129, 0.6)',
    rayColor: '#10b981',
    glowTone: 'emerald',
  },
  rare: {
    label: 'Studio Classic',
    badgeBg: 'bg-cyan-950',
    textColor: 'text-cyan-300',
    borderColor: 'border-cyan-500',
    glowColor: 'rgba(6, 182, 212, 0.7)',
    rayColor: '#06b6d4',
    glowTone: 'cyan',
  },
  vintage: {
    label: 'Vintage Analog Relic',
    badgeBg: 'bg-purple-950',
    textColor: 'text-purple-300',
    borderColor: 'border-purple-500',
    glowColor: 'rgba(168, 85, 247, 0.8)',
    rayColor: '#a855f7',
    glowTone: 'amber',
  },
  legendary: {
    label: 'Holy Grail Masterpiece',
    badgeBg: 'bg-amber-950',
    textColor: 'text-amber-300',
    borderColor: 'border-amber-400',
    glowColor: 'rgba(251, 191, 36, 0.9)',
    rayColor: '#fbbf24',
    glowTone: 'gold',
  },
};

export function isPremiumReward(outcome: any): outcome is PremiumCaseReward {
  return outcome && typeof outcome === 'object' && 'productTitle' in outcome && Array.isArray(outcome.items);
}

export function inferTierFromOutcome(outcome: EquipmentItem | PremiumCaseReward): FlightCaseTier {
  if (isPremiumReward(outcome)) return 'holy_grail_vault';
  switch (outcome.rarity) {
    case 'legendary':
      return 'holy_grail_vault';
    case 'vintage':
      return 'vintage_flight_case';
    case 'rare':
      return 'tour_trunk';
    case 'uncommon':
      return 'road_case';
    default:
      return 'road_case';
  }
}

/**
 * FlightCaseReveal
 * OriginKit-assisted tactile unboxing and collectible reveal choreography.
 * Adheres strictly to the 7-phase reveal state machine:
 * closed -> latch -> open -> silhouette -> reveal -> details -> collect.
 *
 * Physical flow, like a real road case:
 * - Flip the two butterfly latches on the front and the lid lifts
 * - The gear sits in a foam cutout shaped like it, then lifts out
 * - Bench test: its own cable ends in the plug it really has (XLR, 1/4");
 *   only the matching input accepts it, and the meter reads its condition
 */
export const FlightCaseReveal: React.FC<FlightCaseRevealProps> = ({
  outcome,
  tier: propTier,
  source = 'earned',
  titleOverride,
  itemIndex,
  totalItems,
  onAction,
  onClose,
  className = '',
  focusMode = false,
}) => {
  const capabilities = useMotionCapabilities({ focusMode });
  const { reducedMotion, particles, heavyEffects } = capabilities;

  const [state, dispatch] = useReducer(
    revealReducer<EquipmentItem | PremiumCaseReward>,
    createInitialRevealState(outcome, { reducedMotion })
  );

  // Butterfly latches on the case front (closed phase)
  const [leftLatchOpen, setLeftLatchOpen] = useState(false);
  const [rightLatchOpen, setRightLatchOpen] = useState(false);

  // Bench test after unboxing (details phase)
  const [isPatched, setIsPatched] = useState(false);
  const [hasAuditioned, setHasAuditioned] = useState(false);

  const activeTimersRef = useRef<Set<any>>(new Set());

  const clearAllTimers = useCallback(() => {
    activeTimersRef.current.forEach((t) => clearTimeout(t));
    activeTimersRef.current.clear();
  }, []);

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  const { settings } = useSettings();
  const gamepad = useGamepad({
    preferredLayout: settings?.controllerLayout,
    hapticsEnabled: settings?.gamepadHaptics,
  });

  const isPremium = isPremiumReward(state.outcome);
  const currentItem: EquipmentItem | undefined = isPremium ? undefined : (state.outcome as EquipmentItem);
  const premiumReward: PremiumCaseReward | undefined = isPremium ? (state.outcome as PremiumCaseReward) : undefined;

  const effectiveTier = propTier ?? inferTierFromOutcome(state.outcome);
  const caseDef = getFlightCaseDef(effectiveTier) || FLIGHT_CASES.road_case;

  const rarityInfo = currentItem
    ? RARITY_CONFIG[currentItem.rarity] || RARITY_CONFIG.common
    : RARITY_CONFIG.legendary;

  const gearKind: GearKind = currentItem ? gearKindOf(currentItem) : 'rack';
  const benchPlug = BENCH_TESTS[gearKind].plug;

  const shellTitle = titleOverride ?? (isPremium ? premiumReward?.productTitle : caseDef.cssTheme.stencil);

  // Latches flipped so far
  const releasedCount = (leftLatchOpen ? 1 : 0) + (rightLatchOpen ? 1 : 0);

  // Lid comes up: the latches are already open, this is the lid's thump.
  const triggerTactileLatch = useCallback(() => {
    playConnectorSnap(0.85);
    setLeftLatchOpen(true);
    setRightLatchOpen(true);
    hapticTick([10, 30, 18]);
    gamepad.triggerHaptic(0.5, 0.7, 90);
  }, [gamepad]);

  const triggerRevealCelebration = useCallback(() => {
    playSound('project-complete', 0.5);
    gamepad.triggerHaptic(0.7, 0.9, 140);

    // Visual celebration is owned by the rarity FX policy (burst at reveal); no second particle system.
  }, [gamepad]);

  // Phase transition scheduler
  const scheduleNextPhase = useCallback(
    (delayMs: number) => {
      clearAllTimers();
      const timer = setTimeout(() => {
        dispatch({ type: 'STEP_FORWARD' });
      }, delayMs);
      activeTimersRef.current.add(timer);
    },
    [clearAllTimers]
  );

  // React to phase changes
  useEffect(() => {
    const phase = state.phase;

    if (phase === 'latch') {
      triggerTactileLatch();
      scheduleNextPhase(REVEAL_PHASE_TIMINGS.latch);
    } else if (phase === 'open') {
      scheduleNextPhase(REVEAL_PHASE_TIMINGS.open);
    } else if (phase === 'silhouette') {
      scheduleNextPhase(REVEAL_PHASE_TIMINGS.silhouette);
    } else if (phase === 'reveal') {
      triggerRevealCelebration();
      scheduleNextPhase(REVEAL_PHASE_TIMINGS.reveal);
    }
  }, [state.phase, scheduleNextPhase, triggerTactileLatch, triggerRevealCelebration]);

  // Skip handler
  const handleSkip = useCallback(() => {
    clearAllTimers();
    dispatch({ type: 'SKIP' });
    gamepad.triggerHaptic(0.4, 0.6, 60);
  }, [clearAllTimers, gamepad]);

  // Unlatch trigger
  const handleStartUnlatch = useCallback(() => {
    if (state.phase !== 'closed') return;
    dispatch({ type: 'START_UNLATCH' });
  }, [state.phase]);

  // Butterfly latches: a latch flips open once; a real case doesn't need re-locking mid-unbox.
  const flipLatch = useCallback(
    (side: 'left' | 'right') => {
      if (state.phase !== 'closed') return;
      const already = side === 'left' ? leftLatchOpen : rightLatchOpen;
      if (already) return;
      (side === 'left' ? setLeftLatchOpen : setRightLatchOpen)(true);
      playConnectorSnap(0.65);
      hapticTick(14);
      gamepad.triggerHaptic(0.4, 0.6, 60);
    },
    [state.phase, leftLatchOpen, rightLatchOpen, gamepad]
  );
  const handleToggleLeftLatch = useCallback(() => flipLatch('left'), [flipLatch]);
  const handleToggleRightLatch = useCallback(() => flipLatch('right'), [flipLatch]);

  // One button for players who just want it open: flips each remaining latch in turn, then the lid lifts.
  const handleFlipAll = useCallback(() => {
    if (state.phase !== 'closed') return;
    if (!leftLatchOpen) flipLatch('left');
    if (!rightLatchOpen) {
      const t = setTimeout(() => {
        setRightLatchOpen(true);
        playConnectorSnap(0.65);
        hapticTick(14);
      }, leftLatchOpen ? 0 : 170);
      activeTimersRef.current.add(t);
    }
  }, [state.phase, leftLatchOpen, rightLatchOpen, flipLatch]);

  // Both latches open: the lid lifts.
  useEffect(() => {
    if (state.phase === 'closed' && leftLatchOpen && rightLatchOpen) {
      const timer = setTimeout(() => {
        handleStartUnlatch();
      }, 220);
      return () => clearTimeout(timer);
    }
  }, [state.phase, leftLatchOpen, rightLatchOpen, handleStartUnlatch]);

  // Bench test: only the socket the plug fits accepts it (TestBench enforces the fit).
  const handlePatch = useCallback(
    (_socket: PatchSocket) => {
      if (state.phase !== 'details' || !currentItem) return;
      setIsPatched(true);
      playJackInsert(0.85);
      hapticTick([12, 24, 20]);
      gamepad.triggerHaptic(0.6, 0.8, 100);
      if (currentItem.condition >= 50 || !hasAuditioned) playAuditionChord(currentItem.era, currentItem.rarity);
      setHasAuditioned(true);
    },
    [state.phase, currentItem, gamepad, hasAuditioned]
  );
  const handleUnpatch = useCallback(() => {
    if (!isPatched) return;
    setIsPatched(false);
    playJackRemove(0.6);
    hapticTick(8);
    gamepad.triggerHaptic(0.3, 0.4, 50);
  }, [isPatched, gamepad]);
  const handleWrongSocket = useCallback(() => {
    playConnectorSnap(0.3);
    hapticTick([30, 40, 30]);
    gamepad.triggerHaptic(0.2, 0.3, 80);
  }, [gamepad]);
  const handleTogglePatch = useCallback(() => {
    if (isPatched) handleUnpatch();
    else if (benchPlug) handlePatch(benchPlug);
  }, [isPatched, benchPlug, handlePatch, handleUnpatch]);

  // Action resolution
  const handleAction = useCallback(
    (action: 'equip' | 'stash' | 'sell' | 'claim') => {
      dispatch({ type: 'CHOOSE_ACTION', action });
      if ((gameAudio as any).playGearSwitch) {
        (gameAudio as any).playGearSwitch();
      } else {
        playSound('ui-click', 0.4);
      }

      if (onAction) {
        onAction(action, state.outcome);
      } else {
        onClose();
      }
    },
    [onAction, onClose, state.outcome]
  );

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        if (state.phase === 'closed') {
          e.preventDefault();
          handleFlipAll();
        } else if (state.phase === 'details') {
          e.preventDefault();
          if (isPremium) handleAction('claim');
          else handleAction('equip');
        } else if (state.phase !== 'collect') {
          e.preventDefault();
          handleSkip();
        }
      } else if (e.key.toLowerCase() === 'p' && state.phase === 'details') {
        e.preventDefault();
        handleTogglePatch();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (state.phase === 'closed' || state.phase === 'details' || state.phase === 'collect') {
          onClose();
        } else {
          handleSkip();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    state.phase,
    handleFlipAll,
    handleSkip,
    handleAction,
    handleTogglePatch,
    onClose,
    isPremium,
  ]);

  // Gamepad mapping
  const handledPressRef = useRef<typeof gamepad.justPressed | null>(null);
  useEffect(() => {
    if (!gamepad.isConnected || !gamepad.justPressed) return;
    // Each poll yields a fresh justPressed snapshot; act on it once even if handler identities change.
    if (handledPressRef.current === gamepad.justPressed) return;
    handledPressRef.current = gamepad.justPressed;
    const pressedButtons = (Object.keys(gamepad.justPressed) as StandardButton[]).filter((b) => gamepad.justPressed[b]);
    pressedButtons.forEach((btn) => {
      if (state.phase === 'closed') {
        if (btn === 'south' || btn === 'start') {
          handleFlipAll();
        } else if (btn === 'west') {
          handleToggleLeftLatch();
        } else if (btn === 'east') {
          handleToggleRightLatch();
        }
      } else if (state.phase === 'details') {
        if (isPremium) {
          if (btn === 'south' || btn === 'east') handleAction('claim');
        } else {
          if (btn === 'south') handleAction('equip');
          if (btn === 'west') handleAction('stash');
          if (btn === 'north') handleAction('sell');
          if (btn === 'east') handleTogglePatch();
        }
      } else if (state.phase !== 'collect') {
        if (btn === 'south' || btn === 'east') {
          handleSkip();
        }
      }
    });
  }, [
    gamepad.isConnected,
    gamepad.justPressed,
    state.phase,
    handleFlipAll,
    handleToggleLeftLatch,
    handleToggleRightLatch,
    handleTogglePatch,
    handleSkip,
    handleAction,
    onClose,
    isPremium,
  ]);

  const lidFree = state.phase !== 'closed';

  return (
    <div
      role="dialog"
      aria-label="Flight Case Unboxing"
      aria-modal="true"
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none overflow-hidden ${className}`}
      onClick={(e) => {
        if (e.target === e.currentTarget && state.phase !== 'closed' && state.phase !== 'details') {
          handleSkip();
        }
      }}
    >
      {/* 360° Rotating Radiance Sunburst */}
      <AnimatePresence>
        {state.phase !== 'closed' && !reducedMotion && heavyEffects && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.35, scale: 1.2, rotate: 360 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 0.6 },
              rotate: { repeat: Infinity, duration: 25, ease: 'linear' },
            }}
            className="absolute pointer-events-none w-[900px] h-[900px] -z-10 flex items-center justify-center"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full opacity-60">
              {Array.from({ length: 16 }).map((_, i) => (
                <polygon
                  key={i}
                  points="50,50 47,0 53,0"
                  transform={`rotate(${i * 22.5} 50 50)`}
                  fill={rarityInfo.rayColor}
                />
              ))}
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative w-full max-w-lg flex flex-col items-center max-h-[96vh] overflow-y-auto py-2">
        {/* Progress Header if multi-item crate */}
        {totalItems && totalItems > 1 && itemIndex !== undefined && (
          <div className="mb-2 px-3 py-1 bg-stone-900/90 border border-stone-700/80 rounded-full text-xs font-mono text-stone-300">
            Case Compartment {itemIndex + 1} of {totalItems}
          </div>
        )}

        {/* 3D Perspective Flight Road Case Container */}
        <div className="relative w-full flex flex-col items-center [perspective:1200px]">
          <AnimatePresence mode="wait">
            {state.phase !== 'details' ? (
              /* Case Exterior / Foam Interior Sequence (closed -> latch -> open -> silhouette -> reveal) */
              <motion.div
                key="flight-case-chassis"
                initial={reducedMotion ? { opacity: 0 } : { scale: 0.92, opacity: 0, y: 15 }}
                animate={reducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1, y: 0 }}
                exit={reducedMotion ? { opacity: 0 } : { scale: 0.88, opacity: 0, y: -20, transition: { duration: 0.25 } }}
                className={`w-88 sm:w-[450px] bg-gradient-to-b ${caseDef.cssTheme.gradient} border-2 ${caseDef.cssTheme.border} rounded-sm shadow-[0_20px_60px_rgba(0,0,0,0.9)] p-4 relative overflow-visible`}
              >
                {/* Ephemeral Particle Bursts */}
                {state.phase === "open" && (
                  <>
                    <PixiParticleBurst preset="foam" count={36} durationMs={800} />
                    <PixiParticleBurst preset="sparks" count={24} durationMs={600} />
                  </>
                )}
                {state.phase === "reveal" && particles && RARITY_FX_POLICY[currentItem.rarity].burst && (
                  <PixiParticleBurst
                    preset={burstRendererPreset(RARITY_FX_POLICY[currentItem.rarity].burst!.preset)}
                    count={RARITY_FX_POLICY[currentItem.rarity].burst!.count}
                    durationMs={RARITY_FX_POLICY[currentItem.rarity].burst!.durationMs}
                  />
                )}
                {/* 3D Hinged Lid Lifting Off during Open/Silhouette/Reveal Phase */}
                {(state.phase === 'open' || state.phase === 'silhouette') && !reducedMotion && (
                  <motion.div
                    initial={{ rotateX: 0, y: 0, opacity: 1 }}
                    animate={{ rotateX: -34, y: -38, opacity: 0.85 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    style={{ originY: 0 }}
                    className="absolute inset-x-0 -top-4 h-12 bg-gradient-to-b from-stone-700 via-stone-800 to-stone-900 border-2 border-stone-400 rounded-t-sm shadow-2xl z-30 pointer-events-none flex items-center justify-center"
                  >
                    <div className="w-full h-1.5 bg-stone-300 border-b border-stone-500 absolute bottom-0 shadow-sm" />
                    <span className="w-16 h-2 rounded-full bg-stone-950 border border-stone-500" aria-hidden="true" />
                  </motion.div>
                )}

                {/* Metallic Ball Corner Brackets with Rivets */}
                <div className="absolute -top-1.5 -left-1.5 w-5 h-5 border-t-2 border-l-2 border-stone-300 bg-stone-700/80 shadow flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-stone-950 rounded-full" />
                </div>
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 border-t-2 border-r-2 border-stone-300 bg-stone-700/80 shadow flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-stone-950 rounded-full" />
                </div>
                <div className="absolute -bottom-1.5 -left-1.5 w-5 h-5 border-b-2 border-l-2 border-stone-300 bg-stone-700/80 shadow flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-stone-950 rounded-full" />
                </div>
                <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 border-b-2 border-r-2 border-stone-300 bg-stone-700/80 shadow flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-stone-950 rounded-full" />
                </div>

                {/* Stenciled Tour / Brand Markings */}
                <div className="flex justify-between items-center gap-2 border-b border-stone-800 pb-2 mb-3 text-[10px] font-mono tracking-widest text-stone-400">
                  <span className="uppercase truncate max-w-[200px] font-bold">{shellTitle}</span>
                  <span className="text-amber-400 font-bold shrink-0">
                    {isPremium ? 'COLLECTOR EDITION' : source === 'purchase' ? 'VERIFIED PURCHASE' : caseDef.tagline}
                  </span>
                </div>

                {/* Main Case Compartment / Foam Inlay Area */}
                <div className="min-h-52 bg-stone-950/95 border border-stone-800 rounded-sm flex flex-col items-center justify-center p-3 relative overflow-hidden shadow-inner">
                  {/* Acoustic Waffle Foam Pattern Background (inside the case only) */}
                  {state.phase !== 'closed' && state.phase !== 'latch' && <div
                    className="absolute inset-0 opacity-25 pointer-events-none"
                    style={{
                      backgroundImage: 'radial-gradient(circle at 50% 50%, #292524 2px, transparent 2.5px)',
                      backgroundSize: '12px 12px',
                    }}
                  />}

                  {/* Ambient Backlight Beam during Open/Silhouette */}
                  {(state.phase === 'open' || state.phase === 'silhouette') && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: [0.35, 0.75, 0.55], scale: 1.1 }}
                      transition={{ duration: 0.8 }}
                      className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center"
                      style={{
                        background: `radial-gradient(ellipse at center, ${caseDef.cssTheme.accent}55 0%, transparent 75%)`,
                      }}
                    />
                  )}

                  {/* Case front: lid seam, carry handle, shipping label and two butterfly latches */}
                  {(state.phase === 'closed' || state.phase === 'latch') && (
                    <div className="w-full flex flex-col items-center justify-center z-10" data-testid="case-front">
                      <div className="w-full flex items-center justify-center mb-2" aria-hidden="true">
                        <div className="w-24 h-4 rounded-full border-[3px] border-stone-500 border-b-0 bg-transparent" />
                      </div>
                      <div className="relative w-full flex items-center justify-between px-1">
                        {/* Lid seam the latches straddle */}
                        <div className="absolute inset-x-0 top-1/2 h-[3px] -mt-px bg-gradient-to-r from-stone-600 via-stone-400 to-stone-600 shadow-[0_1px_0_rgba(0,0,0,0.8)]" aria-hidden="true" />
                        <ButterflyTwistLatch
                          side="left"
                          isOpen={leftLatchOpen || lidFree}
                          onToggle={handleToggleLeftLatch}
                          disabled={state.phase !== 'closed' || leftLatchOpen}
                          accentColor={caseDef.cssTheme.accent}
                        />
                        <div className="relative rotate-[-3deg] px-3 py-1.5 bg-amber-100 text-stone-900 rounded-[2px] shadow-md text-center border border-amber-200">
                          <span className="block text-[9px] font-black tracking-widest uppercase text-rose-700">Fragile</span>
                          <span className="block text-[11px] font-mono font-bold uppercase">
                            {isPremium ? 'Collector' : `${currentItem?.era} gear`}
                          </span>
                          <span className="block text-[8px] font-mono uppercase text-stone-600">This way up ↑</span>
                        </div>
                        <ButterflyTwistLatch
                          side="right"
                          isOpen={rightLatchOpen || lidFree}
                          onToggle={handleToggleRightLatch}
                          disabled={state.phase !== 'closed' || rightLatchOpen}
                          accentColor={caseDef.cssTheme.accent}
                        />
                      </div>
                      <p className="mt-2 text-[12px] text-stone-300 text-center" aria-live="polite">
                        {state.phase === 'latch'
                          ? 'Lifting the lid…'
                          : releasedCount === 0
                          ? 'Flip both latches to open the lid.'
                          : 'One more latch.'}
                      </p>
                    </div>
                  )}

                  {/* Lid up: foam with the gear sitting in its cutout, then backlit */}
                  {(state.phase === 'open' || state.phase === 'silhouette') && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={motionSpring.snappy}
                      className="relative flex flex-col items-center justify-center text-center z-10 w-full h-full"
                    >
                      <div className="relative w-56 h-28 bg-stone-800/90 rounded-md shadow-[inset_0_4px_16px_rgba(0,0,0,0.95)] flex items-center justify-center overflow-hidden"
                        style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #44403c 2px, transparent 2.6px)', backgroundSize: '9px 9px' }}>
                        {state.phase === 'silhouette' && (
                          <div className="absolute w-28 h-28 rounded-full blur-xl pointer-events-none opacity-40" style={{ backgroundColor: rarityInfo.rayColor }} />
                        )}
                        {isPremium ? (
                          <div className="text-3xl opacity-30">🎁</div>
                        ) : (
                          <GearSilhouette
                            kind={gearKind}
                            variant={state.phase === 'open' ? 'solid' : 'outline'}
                            className="relative w-44 h-auto"
                            style={{ color: rarityInfo.rayColor, opacity: state.phase === 'open' ? 0.75 : 1 }}
                          />
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-stone-400 tracking-wider uppercase mt-2">
                        {state.phase === 'open' ? 'Snug in its foam' : 'Lifting it out…'}
                      </span>
                    </motion.div>
                  )}

                  {/* Reveal Phase: Hardware elevates & illuminates with celebration */}
                  {state.phase === 'reveal' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.75, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={motionSpring.reward}
                      className="flex flex-col items-center justify-center text-center z-10 w-full relative"
                    >
                      {!reducedMotion && heavyEffects && (
                        <GlowSweep tone={rarityInfo.glowTone} repeat={false} />
                      )}
                      {isPremium ? (
                        <div className="w-14 h-14 rounded-md border-2 border-amber-400/80 bg-stone-900/90 flex items-center justify-center mb-2 shadow-[0_0_25px_rgba(245,158,11,0.5)]">
                          <span className="text-3xl">★</span>
                        </div>
                      ) : (
                        <GearSilhouette kind={gearKind} variant="solid" className="w-40 h-auto mb-2 drop-shadow-[0_10px_12px_rgba(0,0,0,0.8)]" style={{ color: rarityInfo.rayColor }} />
                      )}
                      <span className="text-sm font-black text-white tracking-wide uppercase">
                        {isPremium ? premiumReward?.productTitle : currentItem?.name}
                      </span>
                      <span
                        className="text-[10px] font-mono font-bold uppercase tracking-widest mt-1 px-2 py-0.5 rounded border"
                        style={{ borderColor: rarityInfo.rayColor, color: rarityInfo.rayColor }}
                      >
                        {rarityInfo.label}
                      </span>
                    </motion.div>
                  )}
                </div>

                {/* Primary Action Button (in closed) or Skip Button */}
                {state.phase === 'closed' ? (
                  <button
                    type="button"
                    onClick={handleFlipAll}
                    className="w-full mt-3 py-3 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-stone-950 font-black text-xs uppercase tracking-wider rounded-sm shadow-[0_0_15px_rgba(245,158,11,0.5)] hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {gamepad.isConnected && gamepad.lastInputType === 'gamepad' && (
                      <GamepadGlyph button="south" size="xs" />
                    )}
                    <span>{releasedCount === 0 ? 'Flip both latches' : 'Flip the other latch'}</span>
                  </button>
                ) : (
                  <div className="flex justify-between items-center mt-3 pt-1 border-t border-stone-800/80">
                    <span className="text-[10px] font-mono text-stone-500">
                      Press Space / Esc to skip
                    </span>
                    <button
                      type="button"
                      onClick={handleSkip}
                      className="text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 underline underline-offset-2 cursor-pointer py-1 px-2 rounded"
                    >
                      <FastForward size={12} />
                      <span>Skip Animation</span>
                    </button>
                  </div>
                )}
              </motion.div>
            ) : isPremium ? (
              /* Premium Verified Purchase Reward Celebration */
              <motion.div
                key="premium-details-card"
                initial={reducedMotion ? { opacity: 0 } : { rotateY: 90, scale: 0.85, opacity: 0 }}
                animate={reducedMotion ? { opacity: 1 } : { rotateY: 0, scale: 1, opacity: 1 }}
                transition={motionSpring.reward}
                className="w-88 sm:w-[420px] bg-stone-950 border-2 border-amber-400 rounded-sm p-4 relative shadow-[0_0_40px_rgba(251,191,36,0.8)]"
              >
                {!reducedMotion && heavyEffects && <GlowSweep tone="gold" repeat={false} />}
                <div className="flex justify-between items-center mb-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-400">
                    ★ Collector — Yours
                  </span>
                  <span className="text-[10px] font-mono text-stone-400">VERIFIED PURCHASE</span>
                </div>
                <h2 className="text-xl font-black text-white tracking-tight mb-3">
                  {premiumReward?.productTitle}
                </h2>
                <ul className="space-y-2 mb-4">
                  {premiumReward?.items.map((item) => (
                    <li
                      key={item.ref}
                      className="flex items-center gap-2 bg-stone-900/90 border border-stone-800 rounded-sm px-3 py-2 text-sm text-stone-200"
                    >
                      <span aria-hidden className="text-lg">{item.icon}</span>
                      <span className="flex-1 font-medium">{item.label}</span>
                      <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-bold">
                        <BadgeCheck size={14} /> OWNED
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => handleAction('claim')}
                  className="w-full py-2.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-sm border border-emerald-400 shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={15} />
                  <span>STASH IN STUDIO ✓</span>
                </button>
              </motion.div>
            ) : currentItem ? (
              /* Hardware Equipment Inspection Card with Studio Connectors & Audio Auditioning */
              <motion.div
                key="gear-details-card"
                initial={reducedMotion ? { opacity: 0 } : { rotateY: 90, scale: 0.85, opacity: 0 }}
                animate={reducedMotion ? { opacity: 1 } : { rotateY: 0, scale: 1, opacity: 1 }}
                transition={motionSpring.reward}
                className={`w-88 sm:w-[450px] bg-stone-950 border-2 ${rarityInfo.borderColor} rounded-sm p-4 relative`}
                style={{ boxShadow: `0 0 40px ${rarityInfo.glowColor}` }}
              >
                {/* Rarity Material Specular Gleam Sweep */}
                <RarityMaterialSweep rarity={currentItem.rarity} />
                {!reducedMotion &&
                  heavyEffects &&
                  ['rare', 'vintage', 'legendary'].includes(currentItem.rarity) && (
                    <GlowSweep tone={rarityInfo.glowTone} repeat={false} />
                  )}

                {/* Rarity & Era Tagline */}
                <div className="flex justify-between items-center mb-2.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider ${rarityInfo.badgeBg} ${rarityInfo.textColor} border ${rarityInfo.borderColor}`}
                  >
                    ★ {rarityInfo.label}
                  </span>
                  <span className="text-[10px] font-mono text-stone-400 font-bold">
                    ORIGIN: {currentItem.era}
                  </span>
                </div>

                {/* Hardware Name */}
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2 mb-2">
                  <span>{currentItem.name}</span>
                </h2>

                {/* Condition Readout & Resale Appraisal */}
                <div className="bg-stone-900/90 border border-stone-800 rounded-sm p-2.5 mb-2.5 space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-stone-400 flex items-center gap-1">
                      <Wrench size={13} className="text-amber-400" />
                      Condition Rating:
                    </span>
                    <span
                      className={`font-bold ${
                        currentItem.condition >= 80
                          ? 'text-emerald-400'
                          : currentItem.condition >= 50
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {currentItem.condition}% (
                      {currentItem.condition >= 85
                        ? 'Pristine'
                        : currentItem.condition >= 60
                        ? 'Roadworn'
                        : 'Barn Find'}
                      )
                    </span>
                  </div>

                  {/* Condition Progress Bar */}
                  <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        currentItem.condition >= 80
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : currentItem.condition >= 50
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                          : 'bg-gradient-to-r from-rose-600 to-orange-500'
                      }`}
                      style={{ width: `${currentItem.condition}%` }}
                    />
                  </div>

                  {/* Resale Market Value */}
                  <div className="flex justify-between items-center pt-1 border-t border-stone-800/80 text-xs font-mono">
                    <span className="text-stone-400 flex items-center gap-1">
                      <DollarSign size={13} className="text-emerald-400" />
                      Appraised Market Value:
                    </span>
                    <span className="text-emerald-400 font-bold text-sm">
                      ${formatNumber(currentItem.baseValue)}
                    </span>
                  </div>
                </div>

                {/* Bench test: plug its own cable into the input it fits */}
                <TestBench
                  kind={gearKind}
                  condition={currentItem.condition}
                  isPatched={isPatched}
                  onPatch={handlePatch}
                  onUnpatch={handleUnpatch}
                  onWrongSocket={handleWrongSocket}
                  reducedMotion={reducedMotion}
                />

                {/* Audio Output Destination Routing Terminals */}
                <ConnectorActionRouting
                  onAction={handleAction}
                  baseValue={currentItem.baseValue}
                  gamepadConnected={gamepad.isConnected}
                  lastInputType={gamepad.lastInputType === 'gamepad' ? 'gamepad' : 'keyboard'}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export const RewardReveal = FlightCaseReveal;
export default FlightCaseReveal;
