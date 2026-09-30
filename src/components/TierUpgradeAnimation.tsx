import React, { useEffect, useRef, useCallback } from 'react';
import { MotionPanel, MotionReveal, MotionButton, TextScramble, motionTokens } from '@/components/motion/primitives';
import { useMotionCapabilities } from '@/lib/motion/capabilities';
import { ProgressionSystem } from '@/services/ProgressionSystem';
import { getConsoleProfile, getStudioTierName } from '@/components/WebGLCanvas';
import { useGamepad } from '@/hooks/useGamepad';
import { GamepadGlyph } from '@/components/ui/GamepadGlyph';
import { Layers, Sliders, Cpu, Sparkles, CheckCircle2 } from 'lucide-react';

export interface TierUpgradeAnimationProps {
  isVisible: boolean;
  oldTier: number;
  newTier: number;
  onComplete: () => void;
  focusMode?: boolean;
}

export const TierUpgradeAnimation: React.FC<TierUpgradeAnimationProps> = ({
  isVisible,
  oldTier,
  newTier,
  onComplete,
  focusMode = false,
}) => {
  const capabilities = useMotionCapabilities({ focusMode });
  const completedRef = useRef(false);

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

  // Keyboard skip (Escape, Enter, Space)
  useEffect(() => {
    if (!isVisible) return;
    const onKeyDown = (e: KeyboardEvent) => {
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

  return (
    <div
      role="dialog"
      aria-label="Studio Tier Upgraded"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none pointer-events-auto"
      style={{
        backgroundColor: capabilities.heavyEffects ? 'rgba(17, 14, 11, 0.78)' : 'rgba(17, 14, 11, 0.92)',
        backdropFilter: capabilities.heavyEffects ? 'blur(10px)' : 'none',
      }}
    >
      <MotionPanel
        direction="scale"
        className="relative w-full max-w-2xl bg-gradient-to-b from-[#29241e] to-[#1b1713] border-2 border-amber-500/40 rounded-xl shadow-2xl p-6 overflow-hidden text-stone-100"
      >
        {/* Decorative Glow Header (omitted in focus / minimal mode) */}
        {capabilities.heavyEffects && (
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-36 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        )}

        {/* Milestone Callout */}
        <div className="flex items-center justify-between mb-4 border-b border-stone-700/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <span className="text-[11px] font-mono tracking-widest text-amber-400 uppercase font-bold">
                Progression Milestone · Tier Upgraded
              </span>
              <h2 className="text-2xl font-black text-white tracking-wide flex items-center gap-2">
                <span>TIER {oldTier}</span>
                <span className="text-amber-400">→</span>
                <span className="text-amber-300">
                  <TextScramble text={`TIER ${newTier} : ${newDetails.name}`} speed={capabilities.reducedMotion ? 0 : 25} />
                </span>
              </h2>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono tracking-wider text-stone-400 uppercase block">Console Spec</span>
            <span className="text-xs font-mono font-bold text-amber-300">L{newTier} PRO FACILITY</span>
          </div>
        </div>

        {/* Hardware Console Desk Upgrade Comparison */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* Old Console */}
          <div className="p-3.5 bg-stone-900/60 rounded-lg border border-stone-800">
            <span className="text-[10px] font-mono text-stone-400 block mb-1 uppercase tracking-wider">
              Previous Desk (Tier {oldTier})
            </span>
            <p className="text-sm font-bold text-stone-300 mb-2 truncate">
              {getStudioTierName(oldTier)}
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
                Upgraded Desk (Tier {newTier})
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
        <div className="mb-6">
          <span className="text-[11px] font-mono tracking-widest text-stone-300 uppercase font-semibold block mb-2">
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
        <div className="flex items-center justify-between pt-3 border-t border-stone-800">
          <p className="text-[11px] text-stone-400">
            Authoritative state synced · Studio floor updated live
          </p>
          <div className="flex items-center gap-2">
            <MotionButton
              onClick={handleSkip}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-md"
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
    </div>
  );
};

export default TierUpgradeAnimation;
