import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Sparkles,
  Unlock,
  Lock,
  Coins,
  Check,
  Tag,
  Radio,
  Sliders,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EquipmentItem, Rarity } from './lootGenerator';
import { gameAudio, playSound } from '@/utils/audioSystem';
import { GamepadGlyph } from '@/components/ui/GamepadGlyph';
import { useGamepad } from '@/hooks/useGamepad';

interface CrateUnboxingModalProps {
  items: EquipmentItem[];
  tier?: 'standard' | 'vintage_flight_case';
  onClose: () => void;
  onEquip?: (item: EquipmentItem) => void;
  onSell?: (item: EquipmentItem, cashAmount: number) => void;
}

const RARITY_THEMES: Record<Rarity, {
  border: string;
  glow: string;
  rayColor: string;
  badgeBg: string;
  textColor: string;
}> = {
  common: {
    border: 'border-slate-500',
    glow: 'rgba(148, 163, 184, 0.4)',
    rayColor: '#94a3b8',
    badgeBg: 'bg-slate-700 text-slate-200',
    textColor: 'text-slate-300'
  },
  uncommon: {
    border: 'border-emerald-500',
    glow: 'rgba(16, 185, 129, 0.5)',
    rayColor: '#10b981',
    badgeBg: 'bg-emerald-900/80 text-emerald-200 border border-emerald-500/50',
    textColor: 'text-emerald-400'
  },
  rare: {
    border: 'border-sky-500',
    glow: 'rgba(56, 189, 248, 0.6)',
    rayColor: '#38bdf8',
    badgeBg: 'bg-sky-900/80 text-sky-200 border border-sky-500/50',
    textColor: 'text-sky-400'
  },
  vintage: {
    border: 'border-purple-500',
    glow: 'rgba(192, 132, 252, 0.7)',
    rayColor: '#c084fc',
    badgeBg: 'bg-purple-900/80 text-purple-200 border border-purple-500/50',
    textColor: 'text-purple-300'
  },
  legendary: {
    border: 'border-amber-400',
    glow: 'rgba(251, 191, 36, 0.85)',
    rayColor: '#fbbf24',
    badgeBg: 'bg-amber-900/90 text-amber-200 border border-amber-400/80',
    textColor: 'text-amber-300'
  }
};

export const CrateUnboxingModal: React.FC<CrateUnboxingModalProps> = ({
  items,
  tier = 'vintage_flight_case',
  onClose,
  onEquip,
  onSell
}) => {
  const [phase, setPhase] = useState<'latches' | 'opening' | 'revealed'>('latches');
  const [leftLatchOpen, setLeftLatchOpen] = useState(false);
  const [rightLatchOpen, setRightLatchOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const gamepad = useGamepad();

  const currentItem = items && items.length > 0 ? items[currentIndex] : null;
  const rarity = currentItem?.rarity || 'common';
  const theme = RARITY_THEMES[rarity];

  // Gamepad controls
  useEffect(() => {
    if (!gamepad.isConnected) return;

    if (gamepad.justPressed.south) {
      // (A) Button
      if (phase === 'latches') {
        if (!leftLatchOpen) handleLeftLatch();
        else if (!rightLatchOpen) handleRightLatch();
        else handleOpenLid();
      } else if (phase === 'opening') {
        setPhase('revealed');
      } else if (phase === 'revealed') {
        handleKeep();
      }
    } else if (gamepad.justPressed.west && phase === 'revealed') {
      // (X) Button: Equip
      handleEquipItem();
    } else if (gamepad.justPressed.north && phase === 'revealed') {
      // (Y) Button: Sell
      handleSellItem();
    } else if (gamepad.justPressed.east) {
      // (B) Button: Close / Dismiss
      onClose();
    }
  }, [gamepad.isConnected, gamepad.justPressed, phase, leftLatchOpen, rightLatchOpen]);

  const handleLeftLatch = () => {
    if (leftLatchOpen) return;
    setLeftLatchOpen(true);
    playSound('ui-click', 0.6);
    if ((gameAudio as any).playGearSwitch) (gameAudio as any).playGearSwitch();
    if (rightLatchOpen) {
      setTimeout(handleOpenLid, 400);
    }
  };

  const handleRightLatch = () => {
    if (rightLatchOpen) return;
    setRightLatchOpen(true);
    playSound('ui-click', 0.6);
    if ((gameAudio as any).playGearSwitch) (gameAudio as any).playGearSwitch();
    if (leftLatchOpen) {
      setTimeout(handleOpenLid, 400);
    }
  };

  const handleOpenLid = () => {
    setPhase('opening');
    playSound('drum-drop.mp3', 0.7);

    // Particle burst
    confetti({
      particleCount: 65,
      spread: 80,
      origin: { y: 0.6 },
      colors: [theme.rayColor, '#ffffff', '#fbbf24']
    });

    // Chord synthesis celebration if vintage or legendary
    if (rarity === 'vintage' || rarity === 'legendary') {
      if ((gameAudio as any).playTakeChord) {
        (gameAudio as any).playTakeChord('Rock', 'Gold');
      }
    }

    setTimeout(() => {
      setPhase('revealed');
    }, 1100);
  };

  const handleEquipItem = () => {
    if (!currentItem) return;
    playSound('ui-click', 0.5);
    onEquip?.(currentItem);
    nextOrClose();
  };

  const handleSellItem = () => {
    if (!currentItem) return;
    const cashValue = Math.round(currentItem.baseValue * 0.8);
    playSound('coins.wav', 0.5);
    onSell?.(currentItem, cashValue);
    nextOrClose();
  };

  const handleKeep = () => {
    playSound('ui-click', 0.4);
    nextOrClose();
  };

  const nextOrClose = () => {
    if (currentIndex + 1 < items.length) {
      setCurrentIndex(currentIndex + 1);
      setPhase('opening');
      setTimeout(() => setPhase('revealed'), 900);
    } else {
      onClose();
    }
  };

  if (!items || items.length === 0 || !currentItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
      {/* 360 Rotating Light Rays on Opening/Revealed */}
      {(phase === 'opening' || phase === 'revealed') && (
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 0.85, scale: 1.2, rotate: 360 }}
          transition={{
            opacity: { duration: 0.6 },
            scale: { duration: 0.8 },
            rotate: { repeat: Infinity, duration: 25, ease: 'linear' }
          }}
          className="absolute w-[600px] h-[600px] pointer-events-none rounded-full"
          style={{
            background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)`
          }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full opacity-40">
            {Array.from({ length: 16 }).map((_, i) => (
              <polygon
                key={i}
                points="50,50 47,0 53,0"
                fill={theme.rayColor}
                transform={`rotate(${i * 22.5} 50 50)`}
              />
            ))}
          </svg>
        </motion.div>
      )}

      {/* Main Crate Modal Container */}
      <div className="relative z-10 w-full max-w-lg flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-900/80 border border-slate-700/60 transition-colors"
          title="Close Crate"
        >
          <X size={18} />
        </button>

        {/* 3D Perspective Case */}
        <div className="w-full relative perspective-[1200px] flex flex-col items-center">
          {/* Phase 1: Closed Flight Case with interactive latches */}
          {phase === 'latches' && (
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              className="w-full bg-gradient-to-b from-[#2a2420] via-[#1c1815] to-[#120f0d] border-4 border-[#524132] rounded-xl p-8 shadow-2xl relative overflow-hidden"
              style={{
                boxShadow: '0 25px 60px -15px rgba(0,0,0,0.9), inset 0 2px 4px rgba(255,255,255,0.1)'
              }}
            >
              {/* Metal Corner Protectors */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-slate-400 bg-slate-700/40 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-slate-400 bg-slate-700/40 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-slate-400 bg-slate-700/40 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-slate-400 bg-slate-700/40 rounded-br-lg" />

              {/* Stencil Typography */}
              <div className="text-center mb-8">
                <span className="inline-block px-3 py-0.5 rounded text-[11px] font-mono uppercase tracking-[0.25em] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {tier === 'vintage_flight_case' ? 'VINTAGE FLIGHT CASE' : 'STUDIO SUPPLY CRATE'}
                </span>
                <h3 className="text-xl font-black text-amber-100 tracking-wider mt-2">
                  AIR SHIPMENT • AUDIO HARDWARE
                </h3>
                <p className="text-xs text-amber-200/60 font-mono mt-1">
                  SEALED AT STUDIO WAREHOUSE • FRAGILE
                </p>
              </div>

              {/* Dual Spring Latches */}
              <div className="flex items-center justify-around my-6">
                {/* Left Latch */}
                <button
                  onClick={handleLeftLatch}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                    leftLatchOpen
                      ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                      : 'border-slate-500 bg-slate-800 hover:border-amber-400 text-slate-200'
                  }`}
                >
                  {leftLatchOpen ? <Unlock size={24} /> : <Lock size={24} />}
                  <span className="text-[11px] font-bold uppercase font-mono">
                    {leftLatchOpen ? 'Unlatched' : 'Left Latch'}
                  </span>
                </button>

                {/* Right Latch */}
                <button
                  onClick={handleRightLatch}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                    rightLatchOpen
                      ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                      : 'border-slate-500 bg-slate-800 hover:border-amber-400 text-slate-200'
                  }`}
                >
                  {rightLatchOpen ? <Unlock size={24} /> : <Lock size={24} />}
                  <span className="text-[11px] font-bold uppercase font-mono">
                    {rightLatchOpen ? 'Unlatched' : 'Right Latch'}
                  </span>
                </button>
              </div>

              {/* Action Hint */}
              <div className="text-center mt-6">
                <button
                  onClick={() => {
                    handleLeftLatch();
                    handleRightLatch();
                  }}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black rounded-lg text-sm transition-transform active:scale-95 shadow-lg flex items-center gap-2 mx-auto"
                >
                  <GamepadGlyph input="south" size="sm" />
                  <span>OPEN FLIGHT CASE</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Phase 2: Opening sequence */}
          {phase === 'opening' && (
            <motion.div
              initial={{ scale: 0.9, rotateX: 0 }}
              animate={{ scale: 1.05, rotateX: -20 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="w-full h-80 bg-gradient-to-b from-slate-900 to-black border-4 border-amber-500/70 rounded-xl p-8 flex flex-col items-center justify-center relative shadow-2xl"
            >
              <motion.div
                animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="text-6xl mb-4"
              >
                📦
              </motion.div>
              <h4 className="text-lg font-bold text-amber-200 font-mono tracking-widest animate-pulse">
                UNPACKING GEAR...
              </h4>
            </motion.div>
          )}

          {/* Phase 3 & 4: Revealed Gear Card with specs & decisions */}
          {phase === 'revealed' && (
            <motion.div
              initial={{ scale: 0.8, rotateY: 180, opacity: 0 }}
              animate={{ scale: 1, rotateY: 0, opacity: 1 }}
              transition={{ duration: 0.7, type: 'spring', damping: 15 }}
              className={`w-full bg-slate-950/95 border-2 ${theme.border} rounded-xl p-6 shadow-2xl relative overflow-hidden`}
              style={{
                boxShadow: `0 20px 50px -10px ${theme.glow}`
              }}
            >
              {/* Item Rarity Badge & Era */}
              <div className="flex items-center justify-between mb-4">
                <span className={`px-2.5 py-0.5 rounded text-xs font-black uppercase tracking-wider ${theme.badgeBg}`}>
                  ✦ {currentItem.rarity}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ERA: {currentItem.era}
                </span>
              </div>

              {/* Hardware Spec Graphic & Name */}
              <div className="text-center my-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-slate-900 border border-slate-700/80 flex items-center justify-center text-3xl shadow-inner mb-3">
                  {currentItem.name.toLowerCase().includes('mic') ? '🎙️' :
                   currentItem.name.toLowerCase().includes('console') ? '🎛️' :
                   currentItem.name.toLowerCase().includes('tape') ? '📼' :
                   currentItem.name.toLowerCase().includes('synth') ? '🎹' : '🎚️'}
                </div>
                <h3 className="text-xl font-bold text-white tracking-wide">
                  {currentItem.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Studio Outboard Hardware Component
                </p>
              </div>

              {/* Condition & Market Value Metrics */}
              <div className="grid grid-cols-2 gap-3 my-5 p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Condition</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-sm font-bold text-emerald-400">
                      {currentItem.condition}%
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {currentItem.condition > 85 ? 'Mint' : currentItem.condition > 70 ? 'Great' : 'Good'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Estimated Value</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Coins size={14} className="text-amber-400" />
                    <span className="text-sm font-bold text-amber-300">
                      ${currentItem.baseValue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 mt-6">
                <button
                  onClick={handleEquipItem}
                  className="px-3 py-2 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold rounded-lg text-xs transition-colors flex flex-col items-center gap-1"
                >
                  <GamepadGlyph input="west" size="xs" />
                  <span>Equip to Rack</span>
                </button>

                <button
                  onClick={handleKeep}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 font-bold rounded-lg text-xs transition-colors flex flex-col items-center gap-1"
                >
                  <GamepadGlyph input="south" size="xs" />
                  <span>Store in Inventory</span>
                </button>

                <button
                  onClick={handleSellItem}
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-slate-950 font-bold rounded-lg text-xs transition-colors flex flex-col items-center gap-1"
                >
                  <GamepadGlyph input="north" size="xs" />
                  <span>Sell (${Math.round(currentItem.baseValue * 0.8)})</span>
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CrateUnboxingModal;
