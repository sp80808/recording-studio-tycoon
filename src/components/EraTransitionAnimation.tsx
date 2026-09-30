import React, { useEffect, useRef, useCallback } from 'react';
import { ERA_DEFINITIONS, EraDefinition } from '@/utils/eraProgression';
import { MotionPanel, MotionReveal, MotionButton, TextScramble, motionTokens } from '@/components/motion/primitives';
import { useMotionCapabilities } from '@/lib/motion/capabilities';
import { useGamepad } from '@/hooks/useGamepad';
import { GamepadGlyph } from '@/components/ui/GamepadGlyph';
import { Sparkles, ArrowRight, CheckCircle2, Disc3 } from 'lucide-react';

export interface EraTransitionAnimationProps {
  isVisible: boolean;
  fromEra: string;
  toEra: string;
  onComplete: () => void;
  focusMode?: boolean;
}

export const EraTransitionAnimation: React.FC<EraTransitionAnimationProps> = ({
  isVisible,
  fromEra,
  toEra,
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

  // Presentation timer: auto-completes smoothly (faster under reduced motion)
  useEffect(() => {
    if (!isVisible) return;
    completedRef.current = false;
    const duration = capabilities.reducedMotion ? 1000 : 5000;
    const timer = window.setTimeout(() => {
      handleSkip();
    }, duration);
    return () => window.clearTimeout(timer);
  }, [isVisible, capabilities.reducedMotion, handleSkip]);

  if (!isVisible) return null;

  const fromEraData = ERA_DEFINITIONS.find((era) => era.id === fromEra) || ERA_DEFINITIONS[0];
  const toEraData = ERA_DEFINITIONS.find((era) => era.id === toEra) || ERA_DEFINITIONS[1];

  return (
    <div
      role="dialog"
      aria-label="Era Transition"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none pointer-events-auto"
      style={{
        backgroundColor: capabilities.heavyEffects ? 'rgba(15, 13, 10, 0.82)' : 'rgba(15, 13, 10, 0.94)',
        backdropFilter: capabilities.heavyEffects ? 'blur(12px)' : 'none',
      }}
    >
      {/* Decorative background glow (suppressed in focus / minimal mode) */}
      {capabilities.heavyEffects && (
        <div
          className={`absolute inset-0 bg-gradient-to-tr ${toEraData.colors.gradient} opacity-20 pointer-events-none`}
        />
      )}

      {/* Decorative ambient particles (suppressed in focus / minimal / reduced motion mode) */}
      {capabilities.particles && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-amber-400/40 animate-pulse"
              style={{
                left: `${(i * 19) % 100}%`,
                top: `${(i * 29) % 100}%`,
                animationDelay: `${(i * 0.3) % 2}s`,
                animationDuration: '2.5s',
              }}
            />
          ))}
        </div>
      )}

      <MotionPanel
        direction="scale"
        className="relative w-full max-w-2xl bg-gradient-to-b from-[#28241f] to-[#1b1814] border-2 border-purple-500/40 rounded-2xl shadow-2xl p-6 sm:p-8 overflow-hidden text-stone-100"
      >
        {/* Header Ribbon */}
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-stone-700/60">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-purple-500/20 text-purple-400 rounded-lg border border-purple-500/30">
              <Disc3 className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
            </span>
            <div>
              <span className="text-[11px] font-mono tracking-widest text-purple-400 uppercase font-bold">
                Historical Progression · Musical Epoch Advanced
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                <TextScramble
                  text={toEraData.name.toUpperCase()}
                  speed={capabilities.reducedMotion ? 0 : 25}
                />
              </h1>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono tracking-wider text-stone-400 uppercase block">Epoch Year</span>
            <span className="text-sm font-mono font-bold text-purple-300">{toEraData.startYear}+</span>
          </div>
        </div>

        {/* Era Shift Banner: From -> To */}
        <div className="grid grid-cols-5 items-center gap-2 p-4 bg-stone-900/70 rounded-xl border border-stone-800 mb-6">
          <div className="col-span-2 text-center sm:text-left flex items-center gap-3">
            <span className="text-3xl sm:text-4xl p-2 rounded-lg bg-stone-800/80 border border-stone-700">
              {fromEraData.icon}
            </span>
            <div className="truncate">
              <span className="text-[10px] font-mono text-stone-400 block uppercase">Previous Era</span>
              <p className="text-sm font-bold text-stone-300 truncate">{fromEraData.name}</p>
            </div>
          </div>

          <div className="col-span-1 flex justify-center text-purple-400">
            <ArrowRight className="w-6 h-6 animate-pulse" />
          </div>

          <div className="col-span-2 text-center sm:text-left flex items-center gap-3">
            <span className="text-3xl sm:text-4xl p-2 rounded-lg bg-purple-900/40 border border-purple-500/40 shadow-inner">
              {toEraData.icon}
            </span>
            <div className="truncate">
              <span className="text-[10px] font-mono text-purple-300 font-bold block uppercase">Dawn of Era</span>
              <p className="text-sm font-bold text-purple-200 truncate">{toEraData.name}</p>
            </div>
          </div>
        </div>

        {/* Era Description */}
        <p className="text-sm text-stone-300 mb-5 leading-relaxed">
          {toEraData.description}
        </p>

        {/* Unlocked Era Features */}
        <div className="mb-6">
          <span className="text-[11px] font-mono tracking-widest text-stone-400 uppercase font-semibold block mb-2.5">
            Key Epoch Innovations & Capabilities
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {toEraData.features.map((feature, index) => (
              <MotionReveal
                key={feature}
                staggerIndex={index}
                staggerDelay={capabilities.reducedMotion ? 0 : 0.06}
                direction="up"
                distance={capabilities.reducedMotion ? 0 : 10}
                className="flex items-center gap-2 px-3 py-2 bg-stone-800/70 rounded-md border border-stone-700/50 text-xs text-stone-200"
              >
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                <span>{feature}</span>
              </MotionReveal>
            ))}
          </div>
        </div>

        {/* Popular Genres in this era */}
        <div className="mb-6">
          <span className="text-[11px] font-mono tracking-widest text-stone-400 uppercase font-semibold block mb-2">
            Emerging & Trending Musical Genres
          </span>
          <div className="flex flex-wrap gap-1.5">
            {toEraData.availableGenres.map((genre) => (
              <span
                key={genre}
                className="px-2.5 py-1 bg-purple-950/60 border border-purple-500/30 rounded-full text-xs font-medium text-purple-300"
              >
                🎵 {genre}
              </span>
            ))}
          </div>
        </div>

        {/* Footer controls: non-blocking, skippable */}
        <div className="flex items-center justify-between pt-3 border-t border-stone-800">
          <p className="text-[11px] text-stone-400">
            Authoritative simulation active · Click or press key to resume
          </p>
          <div className="flex items-center gap-2">
            <MotionButton
              onClick={handleSkip}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-lg"
            >
              <span>Enter New Era</span>
              {gamepad.isConnected ? (
                <GamepadGlyph button="south" size="xs" />
              ) : (
                <span className="text-[10px] bg-stone-950/30 px-1 py-0.5 rounded font-mono">Esc</span>
              )}
            </MotionButton>
          </div>
        </div>
      </MotionPanel>
    </div>
  );
};

export default EraTransitionAnimation;
