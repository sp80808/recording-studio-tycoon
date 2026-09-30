import React, { useState, useCallback } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Rarity } from '@/features/boxDrops/lootGenerator';
import { playConnectorSnap, playJackInsert } from '@/features/boxDrops/connectors';
import { Settings2 } from 'lucide-react';
import { conditionVisuals } from './gearVisualState';
import { useDemoMeter } from './useDemoMeter';
import { JewelLamp, PushButtonBank, RackFaceplate, RotaryKnob, ToggleSwitch, VUMeter } from './primitives';

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
  const reducedMotion = !!useReducedMotion();

  const [power, setPower] = useState(initialPower);
  const [inputKnob, setInputKnob] = useState(initialInput);
  const [outputKnob, setOutputKnob] = useState(initialOutput);
  const [ratio, setRatio] = useState<CompressorRatio>(initialRatio);
  const [meterMode, setMeterMode] = useState<MeterMode>('GR');

  const visuals = conditionVisuals(condition);
  const ratioMultiplier = ratio === 'all' ? 1.4 : ratio / 10;
  const needlePos = useDemoMeter({
    seed: `${title}:${meterMode}`,
    base: (inputKnob * 0.6 + outputKnob * 0.4) * (meterMode === 'GR' ? 0.75 : 0.9),
    wobble: 0.12 * ratioMultiplier + visuals.meterNoise,
    active: power && !reducedMotion,
  });

  const handleTogglePower = useCallback(() => {
    setPower((p) => !p);
    playConnectorSnap(0.7);
  }, []);

  const handleRatioClick = useCallback((r: CompressorRatio) => {
    setRatio(r);
    playJackInsert(0.65);
  }, []);

  const handleAllButtonsIn = useCallback(() => {
    setRatio('all');
    playConnectorSnap(0.9);
  }, []);

  const stepKnob = (k: number) => (k >= 0.9 ? 0.2 : +(k + 0.15).toFixed(2));

  return (
    <RackFaceplate className={className} scratchOpacity={visuals.scratchOpacity}>
      <div className="flex justify-between items-center px-4 pb-2 border-b border-stone-800 text-[10px] tracking-wider">
        <div className="flex items-center gap-2">
          <Settings2 size={13} className="text-amber-400" />
          <span className="font-black text-stone-100">{title}</span>
          <span className="text-stone-500">SOLID STATE REV D</span>
        </div>
        <div className="flex items-center gap-2 text-[9px]">
          {visuals.warningLed && <span data-testid="warning-led" className="w-2 h-2 rounded-full bg-red-500" />}
          <span className="text-stone-400">COND: {condition}%</span>
          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 uppercase">
            {rarity}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-2 px-3 pt-3 items-center">
        <div className="col-span-3">
          <RotaryKnob value={inputKnob} label="INPUT" caption="PEAK REDUCTION" title="Click to adjust Input Gain" onStep={() => setInputKnob(stepKnob)} />
        </div>

        <div className="col-span-4 flex flex-col items-center">
          <VUMeter level={needlePos} powered={power} reducedMotion={reducedMotion} />
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

        <div className="col-span-2 flex flex-col items-center">
          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">RATIO</span>
          <PushButtonBank<4 | 8 | 12 | 20>
            options={[4, 8, 12, 20]}
            selected={ratio === 'all' ? null : ratio}
            allIn={ratio === 'all'}
            onSelect={handleRatioClick}
            format={(r) => `${r}:1`}
          />
          <button
            type="button"
            onClick={handleAllButtonsIn}
            className={`w-full mt-1 py-0.5 text-[7px] font-mono font-black uppercase rounded-2xs border ${
              ratio === 'all'
                ? `bg-red-600 text-white border-red-400 ${reducedMotion ? '' : 'animate-pulse'}`
                : 'bg-stone-800/80 text-stone-400 border-stone-700 hover:text-stone-200'
            }`}
            title="British Mode: All Buttons In"
          >
            ALL IN
          </button>
        </div>

        <div className="col-span-3 flex items-center justify-around">
          <RotaryKnob value={outputKnob} label="OUTPUT" caption="MAKEUP GAIN" title="Click to adjust Output Gain" onStep={() => setOutputKnob(stepKnob)} />
          <div className="flex flex-col items-center ml-1">
            <div className="mb-1.5">
              <JewelLamp on={power} flicker={visuals.lampFlicker} reducedMotion={reducedMotion} />
            </div>
            <ToggleSwitch on={power} onToggle={handleTogglePower} />
            <span className="text-[7px] font-bold text-stone-400 mt-0.5 uppercase">{power ? 'ON' : 'OFF'}</span>
          </div>
        </div>
      </div>
    </RackFaceplate>
  );
};
