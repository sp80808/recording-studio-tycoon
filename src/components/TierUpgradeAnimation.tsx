import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MotionPanel, MotionReveal, MotionButton, TextScramble, motionTokens } from '@/components/motion/primitives';
import { useMotionCapabilities } from '@/lib/motion/capabilities';
import { ProgressionSystem } from '@/services/ProgressionSystem';
import { getConsoleProfile } from '@/components/WebGLCanvas';
import { useGamepad } from '@/hooks/useGamepad';
import { GamepadGlyph } from '@/components/ui/GamepadGlyph';
import { tc } from '@/i18n/content';
import { Layers, Sliders, Cpu, Sparkles, CheckCircle2 } from 'lucide-react';

export interface TierUpgradeAnimationProps {
  isVisible: boolean;
  oldTier: number;
  newTier: number;
  onComplete: () => void;
  focusMode?: boolean;
  /** The studio's premises name (Borrowed Room, Project Studio...): the one canonical studio name (#366). */
  premisesName?: string;
}

export const TierUpgradeAnimation: React.FC<TierUpgradeAnimationProps> = ({
  isVisible,
  oldTier,
  newTier,
  onComplete,
  focusMode = false,
  premisesName,
}) => {
  const capabilities = useMotionCapabilities({ focusMode });
  const completedRef = useRef(false);
  const continueRef = useRef<HTMLButtonElement>(null);

  const gamepad = useGamepad();

  const handleSkip = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [onComplete]);

  // Gamepad south button skip
  useEffect(() => {
    if (!isVisible || !gamepad.isConnected) return;
    if (gamepad.justPressed.south) {
      handleSkip();
    }
  }, [isVisible, gamepad.isConnected, gamepad.justPressed.south, handleSkip]);

  // Keep keyboard focus inside the milestone while the underlying studio is obscured.
  useEffect(() => {
    if (!isVisible) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    continueRef.current?.focus();
    return () => {
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [isVisible]);

  // Keyboard skip (Escape, Enter, Space)
  useEffect(() => {
    if (!isVisible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        continueRef.current?.focus();
        return;
      }
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSkip();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isVisible, handleSkip]);

  // Auto-complete timer: short presentation, or reduced duration under reduced motion
  useEffect(() => {
    if (!isVisible) return;
    completedRef.current = false;
    const duration = capabilities.reducedMotion ? 800 : 4500;
    const timer = window.setTimeout(() => {
      handleSkip();
    }, duration);
    return () => window.clearTimeout(timer);
  }, [isVisible, capabilities.reducedMotion, handleSkip]);

  if (!isVisible) return null;

  const oldProfile = getConsoleProfile(oldTier);
  const newProfile = getConsoleProfile(newTier);
  const newDetails = ProgressionSystem.getStudioTierDetails(newTier);
  const oldDetails = ProgressionSystem.getStudioTierDetails(oldTier);
  const statChanges = [
    { label: 'Channels', before: oldProfile.channels, after: newProfile.channels },
    { label: 'Displays', before: oldProfile.displays, after: newProfile.displays },
    { label: 'Outboard bays', before: oldProfile.outboardUnits, after: newProfile.outboardUnits },
  ];

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rst-tier-upgrade-title"
      data-rst-tier-upgrade
      className="fixed inset-0 z-[220] flex min-h-0 items-center justify-center overflow-hidden select-none pointer-events-auto"
      style={{
        paddingTop: 'max(12px, calc(var(--rst-safe-top, 0px) + 12px))',
        paddingRight: 'max(12px, var(--rst-safe-right, 0px))',
        paddingBottom: 'max(12px, calc(var(--rst-safe-bottom, 0px) + 12px))',
        paddingLeft: 'max(12px, var(--rst-safe-left, 0px))',
        backgroundColor: capabilities.heavyEffects ? 'rgba(17, 14, 11, 0.85)' : 'rgba(17, 14, 11, 0.95)',
        backdropFilter: capabilities.heavyEffects ? 'blur(10px)' : 'none',
      }}
    >
      <MotionPanel
        direction="scale"
        className="relative w-full min-w-0 max-w-2xl max-h-full overflow-y-auto overscroll-contain bg-gradient-to-b from-[#29241e] to-[#1b1713] border-2 border-amber-500/40 rounded-xl shadow-2xl p-4 sm:p-6 text-stone-100"
      >
        {/* Decorative Glow Header (omitted in focus / minimal mode) */}
        {capabilities.heavyEffects && (
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-36 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        )}

        {/* Milestone headline is independent of the potentially long desk name. */}
        <div className="mb-3 border-b border-stone-700/60 pb-3 sm:mb-4">
          <div className="mb-2 flex min-w-0 items-center gap-2">
            <span className="shrink-0 rounded-lg border border-amber-500/30 bg-amber-500/20 p-1.5 text-amber-400">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 text-[10px] font-mono font-bold uppercase tracking-wide text-amber-400">
              {tc('tier.upgrade.kicker', 'Progression Milestone · Console Upgraded')}
            </span>
          </div>
          <h2 id="rst-tier-upgrade-title" className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xl font-black leading-tight tracking-wide text-white sm:text-2xl">
            <span>Console {oldTier}</span>
            <span className="text-amber-400" aria-hidden="true">→</span>
            <span className="text-amber-300">Console {newTier}</span>
          </h2>
          <p className="mt-1 min-w-0 break-words text-base font-bold leading-snug text-amber-200 sm:text-lg">
            <TextScramble text={newDetails.name} speed={capabilities.reducedMotion ? 0 : 25} />
          </p>
        </div>

        {/* Hardware Console Desk Upgrade Comparison */}
        <div className="mb-3 rounded-lg border border-amber-500/40 bg-amber-950/20 p-3 sm:hidden">
          <div className="mb-2 min-w-0 text-xs leading-snug">
            <span className="text-stone-400">{oldDetails.name}</span>
            <span className="mx-2 text-amber-400" aria-hidden="true">→</span>
            <span className="font-bold text-amber-200">{newDetails.name}</span>
          </div>
          <div className="divide-y divide-stone-700/60 border-t border-stone-700/60">
            {statChanges.map(({ label, before, after }) => (
              <div key={label} className="flex min-w-0 items-center justify-between gap-2 py-1.5 text-xs">
                <span className="text-stone-300">{label}</span>
                <span className="shrink-0 font-mono tabular-nums">
                  <span className="text-stone-400">{before}</span>
                  <span className="px-1.5 text-amber-400" aria-hidden="true">→</span>
                  <span className="font-bold text-emerald-400">{after}</span>
                  {after > before && <span className="pl-1 text-emerald-400">(+{after - before})</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="mb-5 hidden grid-cols-2 gap-3 sm:grid">
          {/* Old Console */}
          <div className="p-3.5 bg-stone-900/60 rounded-lg border border-stone-800">
            <span className="text-[10px] font-mono text-stone-400 block mb-1 uppercase tracking-wider">
              Previous Desk (Console {oldTier})
            </span>
            <p className="text-sm font-bold text-stone-300 mb-2 truncate">
              {oldDetails.name}
            </p>
            <div className="space-y-1 text-xs text-stone-400">
              <div className="flex justify-between">
                <span>Channels:</span>
                <span className="font-mono text-stone-300">{oldProfile.channels}</span>
              </div>
              <div className="flex justify-between">
                <span>Displays:</span>
                <span className="font-mono text-stone-300">{oldProfile.displays}</span>
              </div>
              <div className="flex justify-between">
                <span>Outboard Bays:</span>
                <span className="font-mono text-stone-300">{oldProfile.outboardUnits}</span>
              </div>
            </div>
          </div>

          {/* New Console */}
          <div className="p-3.5 bg-amber-950/25 rounded-lg border border-amber-500/40 shadow-inner">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                Upgraded Desk (Console {newTier})
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300 font-mono font-bold">
                ONLINE
              </span>
            </div>
            <p className="text-sm font-bold text-amber-200 mb-2 truncate">
              {newDetails.name}
            </p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-stone-300">
                <span>Channels:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {newProfile.channels} {newProfile.channels > oldProfile.channels ? `(+${newProfile.channels - oldProfile.channels})` : ''}
                </span>
              </div>
              <div className="flex justify-between text-stone-300">
                <span>Telemetry:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {newProfile.displays} {newProfile.displays > oldProfile.displays ? `(+${newProfile.displays - oldProfile.displays})` : ''}
                </span>
              </div>
              <div className="flex justify-between text-stone-300">
                <span>Outboard Bays:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {newProfile.outboardUnits} {newProfile.outboardUnits > oldProfile.outboardUnits ? `(+${newProfile.outboardUnits - oldProfile.outboardUnits})` : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Unlocked Features & Studio Perks */}
        <div className="mb-3 sm:mb-6">
          <span className="text-[11px] font-mono tracking-wider text-stone-300 uppercase font-semibold block mb-2">
            Facility Enhancements Unlocked
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {newDetails.perks.map((perk, index) => (
              <MotionReveal
                key={perk}
                staggerIndex={index}
                staggerDelay={capabilities.reducedMotion ? 0 : 0.08}
                direction="up"
                distance={capabilities.reducedMotion ? 0 : 12}
                className="flex items-center gap-2 px-3 py-2 bg-stone-800/80 rounded-md border border-stone-700/60 text-xs text-stone-200"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{perk}</span>
              </MotionReveal>
            ))}
          </div>
        </div>

        {/* Footer with Skip / Continue Controls */}
        <div className="sticky bottom-0 z-10 -mx-4 -mb-4 flex flex-wrap items-center justify-between gap-2 border-t border-stone-700 bg-[#1b1713] px-4 pb-3 pt-3 sm:-mx-6 sm:-mb-6 sm:px-6">
          <p className="min-w-0 flex-1 text-[11px] text-stone-400">
            {premisesName ? tc('tier.upgrade.footerPremises', '{{premises}} · console installed, studio floor updated live', { premises: premisesName }) : 'Console installed · Studio floor updated live'}
          </p>
          <div className="flex items-center gap-2">
            <MotionButton
              ref={continueRef}
              onClick={handleSkip}
              className="min-h-11 px-5 py-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-md"
            >
              <span>Continue</span>
              {gamepad.isConnected ? (
                <GamepadGlyph button="south" size="xs" />
              ) : (
                <span className="text-[10px] bg-stone-950/20 px-1 py-0.5 rounded font-mono">Esc</span>
              )}
            </MotionButton>
          </div>
        </div>
      </MotionPanel>
    </div>,
    document.body
  );
};

export default TierUpgradeAnimation;
