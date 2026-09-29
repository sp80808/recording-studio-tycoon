import React, { useState, useEffect, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Rarity } from '@/features/boxDrops/lootGenerator';
import { playConnectorSnap, playJackInsert } from '@/features/boxDrops/connectors';
import { Power, Activity, Settings2 } from 'lucide-react';

export type CompressorRatio = 4 | 8 | 12 | 20 | 'all';
export type MeterMode = 'GR' | '+4' | '+8' | 'OFF';

export interface InteractiveStudioRackGearProps {
  initialPower?: boolean;
  initialInput?: number;   // 0.0 - 1.0
  initialOutput?: number;  // 0.0 - 1.0
  initialRatio?: CompressorRatio;
  rarity?: Rarity;
  condition?: number;      // 0 - 100
  title?: string;
  className?: string;
}

/**
 * 1176-Style Limiting Amplifier / Studio Hardware Rack Unit
 * State-driven interactive audio processor component with real-time VU needle dynamics,
 * tactile push buttons (including famous British mode "all-buttons-in"),
 * rotary stepped pots, and glowing jewel power lamp.
 */
export const InteractiveStudioRackGear: React.FC<InteractiveStudioRackGearProps> = ({
  initialPower = true,
  initialInput = 0.62,
  initialOutput = 0.54,
  initialRatio = 4,
  rarity = 'vintage',
  condition = 88,
  title = 'TYPE 1176 FET LIMITER',
  className = '',
}) => {
  const reducedMotion = useReducedMotion();

  const [power, setPower] = useState(initialPower);
  const [inputKnob, setInputKnob] = useState(initialInput);
  const [outputKnob, setOutputKnob] = useState(initialOutput);
  const [ratio, setRatio] = useState<CompressorRatio>(initialRatio);
  const [meterMode, setMeterMode] = useState<MeterMode>('GR');
  const [needlePos, setNeedlePos] = useState(0.72);

  // Dynamic VU Needle Ballistics
  useEffect(() => {
    if (!power || reducedMotion || typeof window === 'undefined') {
      setNeedlePos(0);
      return;
    }

    const interval = setInterval(() => {
      // Fluctuate VU meter based on input gain and ratio
      const ratioMultiplier = ratio === 'all' ? 1.4 : typeof ratio === 'number' ? ratio / 10 : 0.6;
      const baseLevel = (inputKnob * 0.6 + outputKnob * 0.4) * (meterMode === 'GR' ? 0.75 : 0.9);
      const jitter = (Math.random() - 0.5) * 0.12 * ratioMultiplier;
      const target = Math.max(0.05, Math.min(0.98, baseLevel + jitter));
      setNeedlePos(target);
    }, 120);

    return () => clearInterval(interval);
  }, [power, inputKnob, outputKnob, ratio, meterMode, reducedMotion]);

  const handleTogglePower = useCallback(() => {
    const next = !power;
    setPower(next);
    playConnectorSnap(0.7);
  }, [power]);

  const handleRatioClick = useCallback((r: CompressorRatio) => {
    setRatio(r);
    playJackInsert(0.65);
  }, []);

  const handleAllButtonsIn = useCallback(() => {
    setRatio('all');
    playConnectorSnap(0.9);
  }, []);

  // Needle angle (-42 deg to +42 deg)
  const needleAngle = -42 + needlePos * 84;

  return (
    <div
      className={`w-full bg-stone-900 border-2 border-stone-700 rounded-sm shadow-2xl p-3 select-none text-stone-200 font-mono relative overflow-hidden ${className}`}
    >
      {/* 19" Rack Mounting Ears */}
      <div className="absolute top-2 left-1.5 w-2 h-4 rounded-xs border border-stone-500 bg-stone-950/80 flex items-center justify-center">
        <div className="w-1 h-2 bg-stone-400 rounded-full" />
      </div>
      <div className="absolute bottom-2 left-1.5 w-2 h-4 rounded-xs border border-stone-500 bg-stone-950/80 flex items-center justify-center">
        <div className="w-1 h-2 bg-stone-400 rounded-full" />
      </div>
      <div className="absolute top-2 right-1.5 w-2 h-4 rounded-xs border border-stone-500 bg-stone-950/80 flex items-center justify-center">
        <div className="w-1 h-2 bg-stone-400 rounded-full" />
      </div>
      <div className="absolute bottom-2 right-1.5 w-2 h-4 rounded-xs border border-stone-500 bg-stone-950/80 flex items-center justify-center">
        <div className="w-1 h-2 bg-stone-400 rounded-full" />
      </div>

      {/* Rack Faceplate Header */}
      <div className="flex justify-between items-center px-4 pb-2 border-b border-stone-800 text-[10px] tracking-wider">
        <div className="flex items-center gap-2">
          <Settings2 size={13} className="text-amber-400" />
          <span className="font-black text-stone-100">{title}</span>
          <span className="text-stone-500">SOLID STATE REV D</span>
        </div>
        <div className="flex items-center gap-2 text-[9px]">
          <span className="text-stone-400">COND: {condition}%</span>
          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 uppercase">
            {rarity}
          </span>
        </div>
      </div>

      {/* Main Faceplate Hardware Layout */}
      <div className="grid grid-cols-12 gap-2 px-3 pt-3 items-center">
        {/* INPUT KNOB (Cols 1-3) */}
        <div className="col-span-3 flex flex-col items-center">
          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">
            INPUT
          </span>
          <div
            className="w-14 h-14 rounded-full bg-gradient-to-br from-stone-700 via-stone-800 to-stone-950 border-2 border-stone-500 shadow-md relative flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            onClick={() => setInputKnob((k) => (k >= 0.9 ? 0.2 : +(k + 0.15).toFixed(2)))}
            title="Click to adjust Input Gain"
          >
            {/* Knob indicator line */}
            <motion.div
              style={{ rotate: -135 + inputKnob * 270 }}
              className="absolute top-1.5 w-1 h-4 bg-stone-200 rounded-full"
            />
            <span className="text-[8px] font-black text-amber-400">
              {Math.round(inputKnob * 100)}
            </span>
          </div>
          <span className="text-[8px] text-stone-500 mt-1">PEAK REDUCTION</span>
        </div>

        {/* ANALOG VU METER (Cols 4-7) */}
        <div className="col-span-4 flex flex-col items-center">
          <div className="w-full h-20 bg-amber-100 border-2 border-stone-800 rounded-t-lg shadow-inner relative overflow-hidden flex flex-col justify-end px-2 pb-1">
            {/* Meter Scale Arc */}
            <div className="absolute inset-x-2 top-2 h-7 border-b border-stone-700 flex justify-between text-[7px] font-bold text-stone-800">
              <span>-20</span>
              <span>-10</span>
              <span>-7</span>
              <span>-3</span>
              <span>0</span>
              <span className="text-red-700 font-black">+3</span>
            </div>
            {/* Red Overload Zone Indicator */}
            <div className="absolute right-2 top-2 w-7 h-1.5 bg-red-600/70 rounded-xs" />

            {/* Backlight Glow when powered */}
            {power && (
              <div className="absolute inset-0 bg-amber-300/35 pointer-events-none" />
            )}

            {/* Ballistic Needle */}
            <div className="relative w-full h-1 flex justify-center items-end">
              <motion.div
                animate={{ rotate: power ? needleAngle : -45 }}
                transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 220, damping: 14 }}
                style={{ originX: 0.5, originY: 1 }}
                className="w-0.5 h-14 bg-red-700 rounded-t-full shadow-sm"
              />
            </div>

            {/* Pivot cap */}
            <div className="w-5 h-2.5 bg-stone-900 rounded-t-full mx-auto z-10" />
          </div>

          {/* Meter Mode Selector */}
          <div className="flex gap-1 mt-1 text-[7px] font-bold">
            {(['GR', '+4', '+8'] as MeterMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setMeterMode(mode)}
                className={`px-1.5 py-0.5 rounded-2xs border ${
                  meterMode === mode
                    ? 'bg-amber-400 text-stone-950 border-amber-300'
                    : 'bg-stone-800 text-stone-400 border-stone-700'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* COMPRESSION RATIO PUSH BUTTONS (Cols 8-9) */}
        <div className="col-span-2 flex flex-col items-center">
          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">
            RATIO
          </span>
          <div className="grid grid-cols-2 gap-1 w-full">
            {([4, 8, 12, 20] as CompressorRatio[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRatioClick(r)}
                className={`py-1 text-[8px] font-black rounded-2xs border transition-all ${
                  ratio === r || ratio === 'all'
                    ? 'bg-stone-100 text-stone-950 border-stone-400 shadow-inner'
                    : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                }`}
              >
                {r}:1
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAllButtonsIn}
            className={`w-full mt-1 py-0.5 text-[7px] font-mono font-black uppercase rounded-2xs border ${
              ratio === 'all'
                ? 'bg-red-600 text-white border-red-400 animate-pulse'
                : 'bg-stone-800/80 text-stone-400 border-stone-700 hover:text-stone-200'
            }`}
            title="British Mode: All Buttons In"
          >
            ALL IN
          </button>
        </div>

        {/* OUTPUT KNOB & POWER (Cols 10-12) */}
        <div className="col-span-3 flex items-center justify-around">
          {/* OUTPUT KNOB */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">
              OUTPUT
            </span>
            <div
              className="w-14 h-14 rounded-full bg-gradient-to-br from-stone-700 via-stone-800 to-stone-950 border-2 border-stone-500 shadow-md relative flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              onClick={() => setOutputKnob((k) => (k >= 0.9 ? 0.2 : +(k + 0.15).toFixed(2)))}
              title="Click to adjust Output Gain"
            >
              <motion.div
                style={{ rotate: -135 + outputKnob * 270 }}
                className="absolute top-1.5 w-1 h-4 bg-stone-200 rounded-full"
              />
              <span className="text-[8px] font-black text-amber-400">
                {Math.round(outputKnob * 100)}
              </span>
            </div>
            <span className="text-[8px] text-stone-500 mt-1">MAKEUP GAIN</span>
          </div>

          {/* POWER TOGGLE SWITCH & RED JEWEL LAMP */}
          <div className="flex flex-col items-center ml-1">
            {/* Jewel Lamp */}
            <div
              className={`w-4 h-4 rounded-full border border-stone-900 shadow-md flex items-center justify-center mb-1.5 transition-colors ${
                power
                  ? 'bg-red-600 shadow-[0_0_8px_#ef4444]'
                  : 'bg-stone-800'
              }`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-200/50" />
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              onClick={handleTogglePower}
              aria-label="Power Switch"
              className={`w-6 h-8 rounded-xs border border-stone-600 bg-stone-950 flex flex-col items-center justify-between p-1 cursor-pointer transition-transform active:scale-95`}
            >
              <div
                className={`w-3.5 h-3 rounded-2xs transition-all ${
                  power ? 'bg-amber-400 -translate-y-0.5' : 'bg-stone-600 translate-y-1'
                }`}
              />
              <Power size={9} className={power ? 'text-amber-400' : 'text-stone-500'} />
            </button>
            <span className="text-[7px] font-bold text-stone-400 mt-0.5 uppercase">
              {power ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
