import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Radio, Zap, ShieldCheck, CheckCircle2, Activity } from 'lucide-react';
import type { Era, Rarity } from '../lootGenerator';

export type PatchSocket = 'xlr' | 'trs';

interface HardwarePatchPanelProps {
  era: Era;
  rarity: Rarity;
  isPatched: boolean;
  activeSocket?: PatchSocket;
  onTogglePatch: (target?: PatchSocket) => void;
  condition: number;
}

export const HardwarePatchPanel: React.FC<HardwarePatchPanelProps> = ({
  era,
  rarity,
  isPatched,
  activeSocket = 'trs',
  onTogglePatch,
  condition,
}) => {
  const reduceMotion = useReducedMotion();

  // Dynamic VU Needle angle: -28deg when resting, 0deg to +11deg when patched
  const needleAngle = isPatched ? (reduceMotion ? 6 : [0, 8, -3, 11, 4]) : -28;

  // Lamp color derived from rarity
  const jewelColorMap: Record<Rarity, { bg: string; glow: string; text: string }> = {
    legendary: { bg: '#f59e0b', glow: 'rgba(245, 158, 11, 0.85)', text: 'text-amber-300' },
    vintage: { bg: '#a855f7', glow: 'rgba(168, 85, 247, 0.85)', text: 'text-purple-300' },
    rare: { bg: '#06b6d4', glow: 'rgba(6, 182, 212, 0.85)', text: 'text-cyan-300' },
    uncommon: { bg: '#10b981', glow: 'rgba(16, 185, 129, 0.85)', text: 'text-emerald-300' },
    common: { bg: '#38bdf8', glow: 'rgba(56, 189, 248, 0.75)', text: 'text-sky-300' },
  };
  const jewel = jewelColorMap[rarity] || jewelColorMap.common;

  return (
    <div className="w-full bg-gradient-to-b from-stone-950 via-slate-950 to-stone-950 border border-slate-700/80 rounded-sm p-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.85)] relative overflow-hidden select-none">
      {/* 19" Rack Ears & Screws on left and right border */}
      <div className="absolute left-1 top-2 bottom-2 flex flex-col justify-between py-1 pointer-events-none">
        <div className="w-1.5 h-3 rounded-full bg-slate-700 border border-slate-900 shadow-inner" />
        <div className="w-1.5 h-3 rounded-full bg-slate-700 border border-slate-900 shadow-inner" />
      </div>
      <div className="absolute right-1 top-2 bottom-2 flex flex-col justify-between py-1 pointer-events-none">
        <div className="w-1.5 h-3 rounded-full bg-slate-700 border border-slate-900 shadow-inner" />
        <div className="w-1.5 h-3 rounded-full bg-slate-700 border border-slate-900 shadow-inner" />
      </div>

      {/* Header bar: Stenciled Studio Bus & Jewel Pilot Light */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5 px-2">
        <div className="flex items-center gap-2">
          {/* Vintage Faceted Pilot Jewel Lamp */}
          <div className="relative flex items-center justify-center">
            <div
              className="w-5 h-5 rounded-full border border-stone-400 shadow-md flex items-center justify-center transition-all duration-300"
              style={{
                backgroundColor: isPatched ? jewel.bg : '#27272a',
                boxShadow: isPatched
                  ? `0 0 14px ${jewel.glow}, inset 0 0 6px rgba(255,255,255,0.7)`
                  : 'inset 0 1px 3px rgba(0,0,0,0.9)',
              }}
            >
              <div className="w-2.5 h-2.5 rotate-45 border border-white/40 opacity-70" />
            </div>
            {isPatched && !reduceMotion && (
              <motion.div
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{ boxShadow: `0 0 16px ${jewel.glow}` }}
              />
            )}
          </div>

          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-slate-300 block">
              BALANCED AUDIO I/O TERMINAL
            </span>
            <span className="text-[9px] font-mono text-slate-400 flex items-center gap-1">
              <span>{era} ARCHITECTURE</span>
              <span>•</span>
              <span className="text-amber-400 font-semibold">+4dBu REF</span>
            </span>
          </div>
        </div>

        {/* Patch Connection State Badge */}
        <div
          className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border flex items-center gap-1 ${
            isPatched
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
              : 'bg-slate-900 border-slate-700 text-slate-400'
          }`}
        >
          {isPatched ? (
            <>
              <Zap size={11} className="text-emerald-400 fill-emerald-400" />
              <span>{activeSocket === 'xlr' ? 'XLR BALANCED' : '1/4" INSERT'} LOCKED</span>
            </>
          ) : (
            <>
              <Radio size={11} />
              <span>UNPATCHED (IDLE)</span>
            </>
          )}
        </div>
      </div>

      {/* Center Row: Dual VU Meters, Phosphor Oscilloscope & Studio Connectors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center px-1 mb-2">
        {/* Analog VU Meter Display */}
        <div className="bg-amber-100/95 border-2 border-stone-800 rounded-sm p-1.5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.6)] relative overflow-hidden flex flex-col justify-between h-20">
          <div
            className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
              isPatched ? 'opacity-35 bg-amber-400' : 'opacity-10 bg-amber-200'
            }`}
          />

          <div className="flex justify-between items-center text-[7px] font-mono text-stone-700 font-bold px-1 relative z-10">
            <span>-20</span>
            <span>-10</span>
            <span>-7</span>
            <span>-3</span>
            <span className="text-stone-900 font-black">0</span>
            <span className="text-rose-600">+1</span>
            <span className="text-rose-600 font-black">+3</span>
          </div>

          <svg viewBox="0 0 100 24" className="w-full h-3.5 relative z-10 text-stone-600">
            <path
              d="M 10 20 Q 50 6 90 20"
              fill="transparent"
              stroke="#57534e"
              strokeWidth="1.2"
            />
            <path
              d="M 75 16 Q 82 17 90 20"
              fill="transparent"
              stroke="#e11d48"
              strokeWidth="2.2"
            />
          </svg>

          {/* Analog Needle */}
          <div className="absolute inset-x-0 bottom-0 h-16 flex items-end justify-center pointer-events-none z-20">
            <motion.div
              animate={{ rotate: needleAngle }}
              transition={
                isPatched && !reduceMotion
                  ? {
                      repeat: Infinity,
                      repeatType: 'mirror',
                      duration: 0.85,
                      ease: 'easeInOut',
                    }
                  : { type: 'spring', stiffness: 260, damping: 20 }
              }
              style={{ originX: 0.5, originY: 1 }}
              className="w-0.5 h-13 bg-gradient-to-t from-stone-950 via-rose-700 to-rose-600 relative rounded-t-full shadow-sm"
            >
              <div className="w-1 h-1 rounded-full bg-rose-600 -top-0.5 -left-0.25 absolute" />
            </motion.div>
            <div className="w-3.5 h-2 rounded-t-full bg-stone-900 border border-stone-700 z-30" />
          </div>

          <div className="flex justify-between items-center text-[6.5px] font-mono font-bold text-stone-600 uppercase z-10 px-0.5">
            <span>VU LEVEL</span>
            <span className={isPatched ? 'text-rose-600 font-black animate-pulse' : 'text-stone-400'}>
              {isPatched ? 'PEAK +2dB' : '-∞ dB'}
            </span>
          </div>
        </div>

        {/* Vintage CRT Phosphor Oscilloscope Screen */}
        <div className="bg-stone-950 border-2 border-stone-800 rounded-sm p-1.5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] relative overflow-hidden flex flex-col justify-between h-20">
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, #10b981 0px, transparent 1px, transparent 4px)',
            }}
          />

          <div className="flex justify-between items-center text-[7px] font-mono text-emerald-500 font-semibold px-0.5 z-10">
            <span className="flex items-center gap-1">
              <Activity size={9} />
              <span>OSCILLOSCOPE</span>
            </span>
            <span>{isPatched ? '1.0 kHz' : 'FLAT'}</span>
          </div>

          <div className="relative w-full h-8 flex items-center justify-center overflow-hidden z-10">
            {isPatched ? (
              <svg viewBox="0 0 120 30" className="w-full h-full">
                <motion.path
                  d="M 0 15 Q 15 2, 30 15 T 60 15 T 90 15 T 120 15"
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="2"
                  filter="drop-shadow(0 0 3px #10b981)"
                  animate={
                    reduceMotion
                      ? {}
                      : {
                          d: [
                            'M 0 15 Q 15 2, 30 15 T 60 15 T 90 15 T 120 15',
                            'M 0 15 Q 15 28, 30 15 T 60 15 T 90 15 T 120 15',
                            'M 0 15 Q 15 2, 30 15 T 60 15 T 90 15 T 120 15',
                          ],
                        }
                  }
                  transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
                />
              </svg>
            ) : (
              <div className="w-full h-0.5 bg-emerald-900/60 shadow-[0_0_2px_#065f46]" />
            )}
          </div>

          <div className="flex justify-between items-center text-[6.5px] font-mono text-emerald-400/90 z-10 px-0.5 font-bold">
            <span>{isPatched ? (activeSocket === 'xlr' ? 'SINE REF' : 'TUBE DRIVE') : 'NO SIGNAL'}</span>
            <span className={isPatched ? 'text-emerald-300' : 'text-stone-500'}>
              {isPatched ? 'THD 0.03%' : 'MUTE'}
            </span>
          </div>
        </div>

        {/* Studio Connector Sockets Panel */}
        <div className="flex items-center justify-around bg-slate-900/95 border border-slate-800 rounded-sm p-1.5 h-20">
          {/* Female XLR Input Socket (CH 1) */}
          <div className="flex flex-col items-center gap-0.5">
            <button
              type="button"
              onClick={() => onTogglePatch('xlr')}
              aria-label={`Female XLR Input Socket (${isPatched && activeSocket === 'xlr' ? 'connected' : 'unpatched'})`}
              className={`relative w-9 h-9 rounded-full bg-gradient-to-b from-stone-700 via-stone-800 to-stone-900 border-2 shadow-inner flex items-center justify-center transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-400 ${
                isPatched && activeSocket === 'xlr'
                  ? 'border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)] scale-105'
                  : 'border-stone-500 hover:border-emerald-300'
              }`}
            >
              <div className="absolute -top-1 px-1 py-0.2 rounded-xs bg-gradient-to-b from-stone-300 to-stone-400 text-[5.5px] font-mono font-black text-stone-900 border border-stone-200 shadow-xs">
                PUSH
              </div>

              <div className="relative w-5.5 h-5.5 rounded-full bg-stone-950 border border-stone-700 flex items-center justify-center">
                <div
                  className={`w-1.5 h-1.5 rounded-full border absolute top-0.5 left-1 ${
                    isPatched && activeSocket === 'xlr'
                      ? 'bg-amber-300 border-amber-100 shadow-[0_0_4px_#fde047]'
                      : 'bg-stone-700 border-stone-800'
                  }`}
                />
                <div
                  className={`w-1.5 h-1.5 rounded-full border absolute top-0.5 right-1 ${
                    isPatched && activeSocket === 'xlr'
                      ? 'bg-amber-300 border-amber-100 shadow-[0_0_4px_#fde047]'
                      : 'bg-stone-700 border-stone-800'
                  }`}
                />
                <div
                  className={`w-1.5 h-1.5 rounded-full border absolute bottom-0.5 ${
                    isPatched && activeSocket === 'xlr'
                      ? 'bg-amber-300 border-amber-100 shadow-[0_0_4px_#fde047]'
                      : 'bg-stone-700 border-stone-800'
                  }`}
                />
              </div>
            </button>
            <span className={`text-[7.5px] font-mono uppercase font-bold ${isPatched && activeSocket === 'xlr' ? 'text-emerald-400' : 'text-slate-400'}`}>
              XLR IN
            </span>
          </div>

          {/* 1/4" TRS Jack Socket (Patch / Insert) */}
          <div className="flex flex-col items-center gap-0.5">
            <button
              type="button"
              onClick={() => onTogglePatch('trs')}
              aria-label={`1/4 inch TRS patch connector socket (${isPatched && activeSocket === 'trs' ? 'connected' : 'unpatched'})`}
              className={`relative w-9 h-9 rounded-sm bg-gradient-to-br from-stone-600 via-stone-700 to-stone-900 border flex items-center justify-center shadow-md focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer transition-all ${
                isPatched && activeSocket === 'trs'
                  ? 'border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)] scale-105'
                  : 'border-stone-500 hover:border-amber-300'
              }`}
            >
              <div className="w-6.5 h-6.5 rotate-12 bg-gradient-to-tr from-stone-300 via-stone-100 to-stone-400 rounded-xs border border-stone-600 flex items-center justify-center shadow-xs">
                <div className="w-3 h-3 rounded-full bg-stone-950 border border-stone-800 flex items-center justify-center">
                  <div
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      isPatched && activeSocket === 'trs' ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]' : 'bg-stone-800'
                    }`}
                  />
                </div>
              </div>
            </button>
            <span className={`text-[7.5px] font-mono uppercase font-bold tracking-tight ${isPatched && activeSocket === 'trs' ? 'text-amber-400' : 'text-slate-400'}`}>
              1/4&quot; TRS
            </span>
          </div>

          {/* Male XLR Output Socket */}
          <div className="flex flex-col items-center gap-0.5">
            <div className="relative w-9 h-9 rounded-full bg-gradient-to-b from-stone-700 via-stone-800 to-stone-900 border-2 border-stone-500 shadow-inner flex items-center justify-center">
              <div className="relative w-5.5 h-5.5 rounded-full bg-stone-950 border border-stone-700 flex items-center justify-center">
                <div className="w-1.2 h-1.2 rounded-full bg-yellow-400 border border-yellow-200 absolute top-0.5 left-1 shadow-[0_0_2px_#facc15]" />
                <div className="w-1.2 h-1.2 rounded-full bg-yellow-400 border border-yellow-200 absolute top-0.5 right-1 shadow-[0_0_2px_#facc15]" />
                <div className="w-1.2 h-1.2 rounded-full bg-yellow-400 border border-yellow-200 absolute bottom-0.5 shadow-[0_0_2px_#facc15]" />
              </div>
            </div>
            <span className="text-[7.5px] font-mono text-slate-400 uppercase font-semibold">
              XLR OUT
            </span>
          </div>
        </div>
      </div>

      {/* Footer Readout: Analog Signal Flow Telemetry */}
      <div className="mt-1 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-mono px-2">
        <span className="text-slate-400 flex items-center gap-1">
          <ShieldCheck size={12} className={isPatched ? 'text-emerald-400' : 'text-slate-500'} />
          <span>
            {isPatched
              ? `SIGNAL LOCKED: ${activeSocket === 'xlr' ? 'XLR BALANCED (+4dBu)' : '1/4" INSERT (TUBE DRIVE)'} • 600Ω • COND ${condition}%`
              : 'CLICK ANY JACK OR CABLE TO AUDITION ANALOG SIGNAL'}
          </span>
        </span>
        {isPatched && (
          <span className="text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
            <CheckCircle2 size={11} />
            <span>HARMONICS AUDITIONING</span>
          </span>
        )}
      </div>
    </div>
  );
};
