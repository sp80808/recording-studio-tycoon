import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Sparkles, Wrench, ShieldCheck, DollarSign, PackageCheck, Archive } from 'lucide-react';
import { EquipmentItem, Rarity } from './lootGenerator';
import { playSound, gameAudio } from '@/utils/audioSystem';
import { useGamepad } from '@/hooks/useGamepad';
import { useSettings } from '@/contexts/settings-context-types';
import { GamepadGlyph } from '@/components/ui/GamepadGlyph';
import { toast } from '@/hooks/use-toast';

interface CrateUnboxingModalProps {
  items: EquipmentItem[];
  onClose: () => void;
  onClaim?: (item: EquipmentItem, action: 'equip' | 'stash' | 'sell') => void;
}

type UnboxingPhase = 'locked' | 'opening' | 'revealed';

const RARITY_CONFIG: Record<Rarity, {
  label: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
  glowColor: string;
  rayColor: string;
}> = {
  common: {
    label: 'Standard',
    badgeBg: 'bg-slate-800',
    textColor: 'text-slate-300',
    borderColor: 'border-slate-500',
    glowColor: 'rgba(148, 163, 184, 0.4)',
    rayColor: '#94a3b8',
  },
  uncommon: {
    label: 'Roadworn Workhorse',
    badgeBg: 'bg-emerald-950',
    textColor: 'text-emerald-300',
    borderColor: 'border-emerald-500',
    glowColor: 'rgba(16, 185, 129, 0.6)',
    rayColor: '#10b981',
  },
  rare: {
    label: 'Studio Classic',
    badgeBg: 'bg-cyan-950',
    textColor: 'text-cyan-300',
    borderColor: 'border-cyan-500',
    glowColor: 'rgba(6, 182, 212, 0.7)',
    rayColor: '#06b6d4',
  },
  vintage: {
    label: 'Vintage Analog Relic',
    badgeBg: 'bg-purple-950',
    textColor: 'text-purple-300',
    borderColor: 'border-purple-500',
    glowColor: 'rgba(168, 85, 247, 0.8)',
    rayColor: '#a855f7',
  },
  legendary: {
    label: 'Holy Grail Masterpiece',
    badgeBg: 'bg-amber-950',
    textColor: 'text-amber-300',
    borderColor: 'border-amber-400',
    glowColor: 'rgba(251, 191, 36, 0.9)',
    rayColor: '#fbbf24',
  },
};

export const CrateUnboxingModal: React.FC<CrateUnboxingModalProps> = ({
  items,
  onClose,
  onClaim,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<UnboxingPhase>('locked');
  const [latchesOpen, setLatchesOpen] = useState(false);

  const { settings } = useSettings();
  const gamepad = useGamepad({
    preferredLayout: settings?.controllerLayout,
    hapticsEnabled: settings?.gamepadHaptics,
  });

  const currentItem: EquipmentItem | undefined = items[currentIndex];
  const rarityInfo = currentItem ? RARITY_CONFIG[currentItem.rarity] || RARITY_CONFIG.common : RARITY_CONFIG.common;

  // Sound and unlatching sequence
  const handleUnlatch = useCallback(() => {
    if (phase !== 'locked') return;

    // Phase 1 -> Phase 2: Snap latches open
    setLatchesOpen(true);
    if ((gameAudio as any).playGearSwitch) {
      (gameAudio as any).playGearSwitch();
    } else {
      playSound('ui-click', 0.6);
    }
    gamepad.triggerHaptic(0.5, 0.7, 90);

    setPhase('opening');

    // Confetti burst
    confetti({
      particleCount: 50,
      spread: 80,
      origin: { y: 0.6 },
      colors: [rarityInfo.rayColor, '#ffffff', '#f59e0b', '#38bdf8'],
    });

    // Phase 2 -> Phase 3: Reveal gear card after short delay
    setTimeout(() => {
      setPhase('revealed');
      playSound('project-complete', 0.5);
      gamepad.triggerHaptic(0.7, 0.9, 140);
    }, 750);
  }, [phase, gamepad, rarityInfo.rayColor]);

  const handleAction = useCallback((action: 'equip' | 'stash' | 'sell') => {
    if (!currentItem) return;

    if ((gameAudio as any).playGearSwitch) {
      (gameAudio as any).playGearSwitch();
    } else {
      playSound('ui-click', 0.4);
    }

    if (onClaim) {
      onClaim(currentItem, action);
    } else {
      const messages = {
        equip: `🎛️ Equipped ${currentItem.name} directly to studio rack!`,
        stash: `📦 Stashed ${currentItem.name} in studio inventory.`,
        sell: `💰 Sold ${currentItem.name} for $${currentItem.baseValue}!`,
      };
      toast({
        title: 'Hardware Secured',
        description: messages[action],
        className: 'bg-slate-900 border-slate-700 text-white',
      });
    }

    // Advance to next item or close
    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setPhase('locked');
      setLatchesOpen(false);
    } else {
      onClose();
    }
  }, [currentItem, currentIndex, items.length, onClaim, onClose]);

  // Gamepad mapping
  useEffect(() => {
    if (!gamepad.isConnected) return;
    const unsub = gamepad.onButtonDown((btn) => {
      if (phase === 'locked' && (btn === 'south' || btn === 'start')) {
        handleUnlatch();
      } else if (phase === 'revealed') {
        if (btn === 'south') handleAction('equip');
        if (btn === 'west') handleAction('stash');
        if (btn === 'north') handleAction('sell');
        if (btn === 'east') onClose();
      }
    });
    return unsub;
  }, [gamepad, phase, handleUnlatch, handleAction, onClose]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        if (phase === 'locked') {
          e.preventDefault();
          handleUnlatch();
        } else if (phase === 'revealed') {
          e.preventDefault();
          handleAction('equip');
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, handleUnlatch, handleAction, onClose]);

  if (!currentItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none overflow-hidden">
      {/* 360° Rotating Radiance Sunburst Rays (Opening & Revealed Phases) */}
      <AnimatePresence>
        {phase !== 'locked' && (
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
        {/* Progress Header if multiple items */}
        {items.length > 1 && (
          <div className="mb-3 px-3 py-1 bg-slate-900/90 border border-slate-700/80 rounded-full text-xs font-mono text-slate-300">
            Crate Item {currentIndex + 1} of {items.length}
          </div>
        )}

        {/* 3D Flight Road Case & Card Container */}
        <div className="relative w-full flex flex-col items-center [perspective:1000px]">
          {/* Phase 1 & 2: The Flight Road Case */}
          <AnimatePresence mode="wait">
            {phase !== 'revealed' ? (
              <motion.div
                key="flight-case"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: -20, transition: { duration: 0.3 } }}
                className="w-80 sm:w-96 bg-gradient-to-b from-stone-900 via-stone-950 to-black border-2 border-stone-700 rounded-sm shadow-[0_20px_60px_rgba(0,0,0,0.9)] p-4 relative"
              >
                {/* Aluminum corner brackets with chrome rivets */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-stone-400 bg-stone-700/70" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-stone-400 bg-stone-700/70" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-stone-400 bg-stone-700/70" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-stone-400 bg-stone-700/70" />

                {/* Stenciled vintage tour branding */}
                <div className="flex justify-between items-center border-b border-stone-800 pb-2 mb-4 text-[10px] font-mono tracking-widest text-stone-400">
                  <span>VINTAGE FLIGHT CRATE</span>
                  <span className="text-amber-500 font-bold">FRAGILE · TUBE GEAR</span>
                </div>

                {/* Road case centerpiece texture */}
                <div className="h-44 bg-stone-900/90 border border-stone-800 rounded-sm flex flex-col items-center justify-center p-4 relative overflow-hidden shadow-inner">
                  {/* Heavy metallic latches */}
                  <div className="flex items-center justify-around w-full mb-3">
                    <motion.div
                      animate={latchesOpen ? { rotate: -90, y: -4 } : { rotate: 0, y: 0 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                      className="w-6 h-10 bg-gradient-to-b from-stone-400 to-stone-600 rounded-sm border border-stone-300 shadow-md flex items-center justify-center cursor-pointer"
                      onClick={handleUnlatch}
                    >
                      <div className="w-1.5 h-4 bg-stone-800 rounded-xs" />
                    </motion.div>

                    <div className="px-3 py-1 bg-stone-950/80 border border-stone-700/60 rounded text-center">
                      <span className="text-[10px] font-mono text-stone-400 block">SEALED IN</span>
                      <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">{currentItem.era}</span>
                    </div>

                    <motion.div
                      animate={latchesOpen ? { rotate: 90, y: -4 } : { rotate: 0, y: 0 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                      className="w-6 h-10 bg-gradient-to-b from-stone-400 to-stone-600 rounded-sm border border-stone-300 shadow-md flex items-center justify-center cursor-pointer"
                      onClick={handleUnlatch}
                    >
                      <div className="w-1.5 h-4 bg-stone-800 rounded-xs" />
                    </motion.div>
                  </div>

                  {phase === 'locked' && (
                    <motion.div
                      animate={{ scale: [1, 1.03, 1] }}
                      transition={{ repeat: Infinity, duration: 1.6 }}
                      className="text-center"
                    >
                      <p className="text-xs font-bold font-mono text-amber-300 uppercase tracking-wider mb-1">
                        Spring Latches Engaged
                      </p>
                      <p className="text-[10px] text-stone-400">Click latch or press button to pop open</p>
                    </motion.div>
                  )}

                  {phase === 'opening' && (
                    <div className="text-center animate-pulse">
                      <p className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider">
                        Unlatching Enclosure...
                      </p>
                    </div>
                  )}
                </div>

                {/* Primary Unlatch Button */}
                <button
                  onClick={handleUnlatch}
                  disabled={phase !== 'locked'}
                  className="w-full mt-3 py-3 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-stone-950 font-black text-sm uppercase tracking-wider rounded-sm shadow-[0_0_15px_rgba(245,158,11,0.5)] hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  {gamepad.isConnected && gamepad.lastInputType === 'gamepad' && (
                    <GamepadGlyph button="south" size="xs" />
                  )}
                  <span>OPEN VINTAGE CRATE</span>
                </button>
              </motion.div>
            ) : (
              /* Phase 3 & 4: 3D Perspective Hardware Card & Action Dock */
              <motion.div
                key="gear-card"
                initial={{ rotateY: 90, scale: 0.8, opacity: 0 }}
                animate={{ rotateY: 0, scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                className={`w-88 sm:w-[420px] bg-slate-950 border-2 ${rarityInfo.borderColor} rounded-sm p-4 relative`}
                style={{ boxShadow: `0 0 40px ${rarityInfo.glowColor}` }}
              >
                {/* Rarity & Era Tagline */}
                <div className="flex justify-between items-center mb-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider ${rarityInfo.badgeBg} ${rarityInfo.textColor} border ${rarityInfo.borderColor}`}>
                    ★ {rarityInfo.label}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    ORIGIN: {currentItem.era}
                  </span>
                </div>

                {/* Gear Name */}
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2 mb-2">
                  <span>{currentItem.name}</span>
                </h2>

                {/* Visual Gear Faceplate / Condition Readout */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-sm p-3 mb-3.5 space-y-2.5">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Wrench size={13} className="text-amber-400" />
                      Condition Rating:
                    </span>
                    <span className={`font-bold ${currentItem.condition >= 80 ? 'text-emerald-400' : currentItem.condition >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {currentItem.condition}% ({currentItem.condition >= 85 ? 'Pristine' : currentItem.condition >= 60 ? 'Roadworn' : 'Barn Find'})
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

                  {/* Estimated Resale / Studio Appraisal */}
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

                {/* Authentic analog flavor description */}
                <div className="bg-slate-900/50 border border-slate-800/60 rounded p-2 mb-4 text-xs text-slate-300 italic flex items-center gap-2">
                  <Sparkles size={14} className={rarityInfo.textColor} />
                  <span>Authentic analog sound character salvaged from historic studio collections.</span>
                </div>

                {/* Phase 4: Action Dock */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleAction('equip')}
                    className="py-2.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-sm border border-emerald-400 shadow-md flex flex-col items-center justify-center gap-1 transition-all active:scale-[0.98]"
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
                    onClick={() => handleAction('stash')}
                    className="py-2.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-sm border border-slate-600 shadow-md flex flex-col items-center justify-center gap-1 transition-all active:scale-[0.98]"
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
                    onClick={() => handleAction('sell')}
                    className="py-2.5 px-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-sm border border-amber-400 shadow-md flex flex-col items-center justify-center gap-1 transition-all active:scale-[0.98]"
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
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default CrateUnboxingModal;
