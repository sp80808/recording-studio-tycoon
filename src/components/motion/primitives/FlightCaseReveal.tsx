import React, { useState, useEffect, useCallback, useRef, useReducer } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Wrench,
  DollarSign,
  PackageCheck,
  Archive,
  BadgeCheck,
  FastForward,
  Box,
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
    badgeBg: 'bg-slate-800',
    textColor: 'text-slate-300',
    borderColor: 'border-slate-500',
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
 * Guaranteed invariants:
 * - Outcome is settled before animation begins and is immutable.
 * - Instant skip jumps straight to details without altering reward.
 * - Reduced-motion bypasses intermediate animations directly to details.
 * - No duplicate WebGL canvas or persistent animation loop remains after unmount.
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

  const shellTitle = titleOverride ?? (isPremium ? premiumReward?.productTitle : caseDef.cssTheme.stencil);

  // Sound and haptic triggers
  const triggerTactileLatch = useCallback(() => {
    if ((gameAudio as any).playGearSwitch) {
      (gameAudio as any).playGearSwitch();
    } else {
      playSound('ui-click', 0.6);
    }
    gamepad.triggerHaptic(0.5, 0.7, 90);
  }, [gamepad]);

  const triggerRevealCelebration = useCallback(() => {
    playSound('project-complete', 0.5);
    gamepad.triggerHaptic(0.7, 0.9, 140);

    // Confetti particles (suppressed in reduced motion, low preset, or focus mode)
    if (particles && typeof window !== 'undefined') {
      try {
        confetti({
          particleCount: 50,
          spread: 80,
          origin: { y: 0.6 },
          colors: [rarityInfo.rayColor, '#ffffff', '#f59e0b', '#38bdf8'],
        });
      } catch {
        // Fallback gracefully in headless test environments
      }
    }
  }, [gamepad, particles, rarityInfo.rayColor]);

  // Phase transition progression scheduler
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
          handleStartUnlatch();
        } else if (state.phase === 'details') {
          e.preventDefault();
          if (isPremium) handleAction('claim');
          else handleAction('equip');
        } else if (state.phase !== 'collect') {
          e.preventDefault();
          handleSkip();
        }
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
  }, [state.phase, handleStartUnlatch, handleSkip, handleAction, onClose, isPremium]);

  // Gamepad mapping
  useEffect(() => {
    if (!gamepad.isConnected) return;
    const unsub = gamepad.onButtonDown((btn) => {
      if (state.phase === 'closed' && (btn === 'south' || btn === 'start')) {
        handleStartUnlatch();
      } else if (state.phase === 'details') {
        if (isPremium) {
          if (btn === 'south' || btn === 'east') handleAction('claim');
        } else {
          if (btn === 'south') handleAction('equip');
          if (btn === 'west') handleAction('stash');
          if (btn === 'north') handleAction('sell');
          if (btn === 'east') onClose();
        }
      } else if (state.phase !== 'collect') {
        if (btn === 'south' || btn === 'east') {
          handleSkip();
        }
      }
    });
    return unsub;
  }, [gamepad, state.phase, handleStartUnlatch, handleSkip, handleAction, onClose, isPremium]);

  const latchesOpen = state.phase !== 'closed';

  return (
    <div
      role="dialog"
      aria-label="Flight Case Unboxing"
      aria-modal="true"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none overflow-hidden ${className}`}
      onClick={(e) => {
        // Clicking backdrop during animation skips to details
        if (e.target === e.currentTarget && state.phase !== 'closed' && state.phase !== 'details') {
          handleSkip();
        }
      }}
    >
      {/* 360° Rotating Radiance Sunburst (suppressed under reduced-motion, focus mode, or low preset) */}
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

      <div className="relative w-full max-w-lg flex flex-col items-center">
        {/* Progress Header if multi-item crate */}
        {totalItems && totalItems > 1 && itemIndex !== undefined && (
          <div className="mb-3 px-3 py-1 bg-stone-900/90 border border-stone-700/80 rounded-full text-xs font-mono text-stone-300">
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
                className={`w-80 sm:w-96 bg-gradient-to-b ${caseDef.cssTheme.gradient} border-2 ${caseDef.cssTheme.border} rounded-sm shadow-[0_20px_60px_rgba(0,0,0,0.9)] p-4 relative overflow-hidden`}
              >
                {/* Metallic Ball Corner Brackets with Rivets */}
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-stone-300 bg-stone-700/80 shadow flex items-center justify-center">
                  <div className="w-1 h-1 bg-stone-950 rounded-full" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-stone-300 bg-stone-700/80 shadow flex items-center justify-center">
                  <div className="w-1 h-1 bg-stone-950 rounded-full" />
                </div>
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-stone-300 bg-stone-700/80 shadow flex items-center justify-center">
                  <div className="w-1 h-1 bg-stone-950 rounded-full" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-stone-300 bg-stone-700/80 shadow flex items-center justify-center">
                  <div className="w-1 h-1 bg-stone-950 rounded-full" />
                </div>

                {/* Stenciled Tour / Brand Markings */}
                <div className="flex justify-between items-center border-b border-stone-800 pb-2 mb-3 text-[10px] font-mono tracking-widest text-stone-400">
                  <span className="uppercase truncate max-w-[200px]">{shellTitle}</span>
                  <span className="text-amber-400 font-bold shrink-0">
                    {isPremium ? 'COLLECTOR EDITION' : source === 'purchase' ? 'VERIFIED PURCHASE' : caseDef.tagline}
                  </span>
                </div>

                {/* Main Case Compartment / Foam Inlay Area */}
                <div className="h-48 bg-stone-950 border border-stone-800 rounded-sm flex flex-col items-center justify-center p-3 relative overflow-hidden shadow-inner">
                  {/* Acoustic Waffle Foam Pattern Background */}
                  <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                      backgroundImage: 'radial-gradient(circle at 50% 50%, #78716c 1.5px, transparent 2px)',
                      backgroundSize: '12px 12px',
                    }}
                  />

                  {/* Latches & Sealed Status Bar (shown during closed & latch) */}
                  {(state.phase === 'closed' || state.phase === 'latch') && (
                    <div className="w-full flex flex-col items-center justify-center z-10">
                      <div className="flex items-center justify-around w-full mb-3">
                        {/* Left Spring Latch */}
                        <motion.button
                          type="button"
                          aria-label="Left Case Latch"
                          animate={latchesOpen ? { rotate: -90, y: -4 } : { rotate: 0, y: 0 }}
                          transition={motionSpring.press}
                          className="w-7 h-11 bg-gradient-to-b from-stone-300 via-stone-400 to-stone-600 rounded-xs border border-stone-200 shadow-lg flex items-center justify-center cursor-pointer hover:brightness-110 active:scale-95"
                          onClick={handleStartUnlatch}
                        >
                          <div className="w-2 h-5 bg-stone-900 rounded-2xs border border-stone-500" />
                        </motion.button>

                        <div className="px-3 py-1.5 bg-stone-900/90 border border-stone-700/80 rounded text-center shadow">
                          <span className="text-[9px] font-mono text-stone-400 block tracking-wider">SEALED IN</span>
                          <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                            {isPremium ? 'COLLECTOR EDITION' : currentItem?.era}
                          </span>
                        </div>

                        {/* Right Spring Latch */}
                        <motion.button
                          type="button"
                          aria-label="Right Case Latch"
                          animate={latchesOpen ? { rotate: 90, y: -4 } : { rotate: 0, y: 0 }}
                          transition={motionSpring.press}
                          className="w-7 h-11 bg-gradient-to-b from-stone-300 via-stone-400 to-stone-600 rounded-xs border border-stone-200 shadow-lg flex items-center justify-center cursor-pointer hover:brightness-110 active:scale-95"
                          onClick={handleStartUnlatch}
                        >
                          <div className="w-2 h-5 bg-stone-900 rounded-2xs border border-stone-500" />
                        </motion.button>
                      </div>

                      {state.phase === 'closed' ? (
                        <motion.div
                          animate={reducedMotion ? {} : { scale: [1, 1.03, 1] }}
                          transition={{ repeat: Infinity, duration: 1.8 }}
                          className="text-center mt-1"
                        >
                          <p className="text-xs font-bold font-mono text-amber-300 uppercase tracking-wider mb-0.5">
                            Heavy Latches Engaged
                          </p>
                          <p className="text-[10px] text-stone-400">Click latches or press OPEN button</p>
                        </motion.div>
                      ) : (
                        <div className="text-center">
                          <p className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider animate-pulse">
                            Unlatching Spring Latches...
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Foam Interior & Lid Opening (open phase) */}
                  {state.phase === 'open' && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center justify-center text-center z-10"
                    >
                      <div className="w-12 h-12 rounded-full border-2 border-stone-700 bg-stone-900 flex items-center justify-center mb-2 text-stone-400">
                        <Box size={24} className="animate-pulse" />
                      </div>
                      <span className="text-xs font-mono font-bold text-stone-300 tracking-wider uppercase">
                        Opening Case Lid...
                      </span>
                      <span className="text-[10px] font-mono text-stone-500 mt-1">
                        DIE-CUT PROTECTIVE FOAM CAVITY
                      </span>
                    </motion.div>
                  )}

                  {/* Silhouette Phase: Hardware outline nestled in die-cut foam cutout */}
                  {state.phase === 'silhouette' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={motionSpring.snappy}
                      className="relative flex flex-col items-center justify-center text-center z-10 w-full h-full"
                    >
                      {/* Recessed Foam Cutout Bed */}
                      <div className="w-48 h-28 bg-stone-950/90 border-2 border-stone-800 rounded-md shadow-[inset_0_4px_16px_rgba(0,0,0,0.95)] flex flex-col items-center justify-center relative overflow-hidden">
                        {/* Ambient Backlight Halo behind silhouette */}
                        <div
                          className="absolute w-28 h-28 rounded-full blur-xl pointer-events-none opacity-40"
                          style={{ backgroundColor: rarityInfo.rayColor }}
                        />
                        <div className="text-3xl opacity-20 filter contrast-200">
                          {isPremium ? '🎁' : currentItem?.rarity === 'legendary' ? '🏆' : '🎛️'}
                        </div>
                        <span className="text-[10px] font-mono font-bold text-stone-400 tracking-widest uppercase mt-2 z-10">
                          {isPremium ? 'COLLECTIBLE REVEAL' : `${currentItem?.rarity.toUpperCase()} HARDWARE`}
                        </span>
                      </div>
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
                      {/* Subtle GlowSweep across elevated gear */}
                      {!reducedMotion && heavyEffects && (
                        <GlowSweep tone={rarityInfo.glowTone} repeat={false} />
                      )}
                      <div className="w-14 h-14 rounded-md border-2 border-amber-400/80 bg-stone-900/90 flex items-center justify-center mb-2 shadow-[0_0_25px_rgba(245,158,11,0.5)]">
                        <span className="text-3xl">{isPremium ? '★' : '🎛️'}</span>
                      </div>
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

                {/* Primary Action Button (in closed) or Skip Button (during unlatching/opening/reveal) */}
                {state.phase === 'closed' ? (
                  <button
                    type="button"
                    onClick={handleStartUnlatch}
                    className="w-full mt-3 py-3 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-stone-950 font-black text-sm uppercase tracking-wider rounded-sm shadow-[0_0_15px_rgba(245,158,11,0.5)] hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {gamepad.isConnected && gamepad.lastInputType === 'gamepad' && (
                      <GamepadGlyph button="south" size="xs" />
                    )}
                    <span>OPEN {caseDef.name.toUpperCase()}</span>
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
                className="w-88 sm:w-[420px] bg-slate-950 border-2 border-amber-400 rounded-sm p-4 relative shadow-[0_0_40px_rgba(251,191,36,0.8)]"
              >
                {!reducedMotion && heavyEffects && <GlowSweep tone="gold" repeat={false} />}
                <div className="flex justify-between items-center mb-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-400">
                    ★ Collector — Yours
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">VERIFIED PURCHASE</span>
                </div>
                <h2 className="text-xl font-black text-white tracking-tight mb-3">
                  {premiumReward?.productTitle}
                </h2>
                <ul className="space-y-2 mb-4">
                  {premiumReward?.items.map((item) => (
                    <li
                      key={item.ref}
                      className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-sm px-3 py-2 text-sm text-slate-200"
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
              /* Hardware Equipment Inspection Card & Action Dock */
              <motion.div
                key="gear-details-card"
                initial={reducedMotion ? { opacity: 0 } : { rotateY: 90, scale: 0.85, opacity: 0 }}
                animate={reducedMotion ? { opacity: 1 } : { rotateY: 0, scale: 1, opacity: 1 }}
                transition={motionSpring.reward}
                className={`w-88 sm:w-[420px] bg-slate-950 border-2 ${rarityInfo.borderColor} rounded-sm p-4 relative`}
                style={{ boxShadow: `0 0 40px ${rarityInfo.glowColor}` }}
              >
                {/* Subtle GlowSweep on rare / vintage / legendary items */}
                {!reducedMotion &&
                  heavyEffects &&
                  ['rare', 'vintage', 'legendary'].includes(currentItem.rarity) && (
                    <GlowSweep tone={rarityInfo.glowTone} repeat={false} />
                  )}

                {/* Rarity & Era Tagline */}
                <div className="flex justify-between items-center mb-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider ${rarityInfo.badgeBg} ${rarityInfo.textColor} border ${rarityInfo.borderColor}`}
                  >
                    ★ {rarityInfo.label}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    ORIGIN: {currentItem.era}
                  </span>
                </div>

                {/* Hardware Name */}
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2 mb-2">
                  <span>{currentItem.name}</span>
                </h2>

                {/* Condition Readout & Resale Appraisal */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-sm p-3 mb-3.5 space-y-2.5">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-400 flex items-center gap-1">
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
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
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

                  {/* Resale / Studio Appraisal */}
                  <div className="flex justify-between items-center pt-1 border-t border-slate-800/80 text-xs font-mono">
                    <span className="text-slate-400 flex items-center gap-1">
                      <DollarSign size={13} className="text-emerald-400" />
                      Appraised Market Value:
                    </span>
                    <span className="text-emerald-400 font-bold text-sm">
                      ${currentItem.baseValue.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Authentic Analog Sonic Character Description */}
                <div className="bg-slate-900/50 border border-slate-800/60 rounded p-2 mb-4 text-xs text-slate-300 italic flex items-center gap-2">
                  <Sparkles size={14} className={rarityInfo.textColor} />
                  <span>Authentic analog sound character salvaged from historic studio collections.</span>
                </div>

                {/* Action Dock */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAction('equip')}
                    className="py-2.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-sm border border-emerald-400 shadow-md flex flex-col items-center justify-center gap-1 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <div className="flex items-center gap-1">
                      {gamepad.isConnected && gamepad.lastInputType === 'gamepad' && (
                        <GamepadGlyph button="south" size="xs" />
                      )}
                      <PackageCheck size={14} />
                    </div>
                    <span>EQUIP RACK</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction('stash')}
                    className="py-2.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-sm border border-slate-600 shadow-md flex flex-col items-center justify-center gap-1 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <div className="flex items-center gap-1">
                      {gamepad.isConnected && gamepad.lastInputType === 'gamepad' && (
                        <GamepadGlyph button="west" size="xs" />
                      )}
                      <Archive size={14} />
                    </div>
                    <span>STASH</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction('sell')}
                    className="py-2.5 px-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-sm border border-amber-400 shadow-md flex flex-col items-center justify-center gap-1 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <div className="flex items-center gap-1">
                      {gamepad.isConnected && gamepad.lastInputType === 'gamepad' && (
                        <GamepadGlyph button="north" size="xs" />
                      )}
                      <DollarSign size={14} />
                    </div>
                    <span>SELL (${currentItem.baseValue})</span>
                  </button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export const RewardReveal: React.FC<FlightCaseRevealProps> = (props) => {
  return <FlightCaseReveal {...props} />;
};

export default FlightCaseReveal;
