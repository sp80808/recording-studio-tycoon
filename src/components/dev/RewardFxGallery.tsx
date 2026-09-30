import React, { useState } from 'react';
import { PixiParticleBurst, RarityMaterialSweep, AnimatedGearFlourish } from '@/features/boxDrops/fx';
import {
  GEAR_FAMILY_ACCENTS, RARITY_FX_POLICY, burstRendererPreset, type GearFamily,
} from '@/features/boxDrops/fx/rewardFx';
import type { Rarity } from '@/features/boxDrops/lootGenerator';

const RARITIES = Object.keys(RARITY_FX_POLICY) as Rarity[];
const FAMILIES = Object.keys(GEAR_FAMILY_ACCENTS) as GearFamily[];
const SAMPLE_NAMES: Record<GearFamily, string> = {
  'tape-reel': 'Tape Machine', tube: 'Tube Preamp', 'solid-state-rack': 'FET Limiter', digital: 'Digital Converter',
  microphone: 'Condenser Mic', synth: 'Analog Synth', console: 'Mixing Console', monitor: 'Studio Monitor',
};

/** DEV-only review surface for reward FX (#80). Shown with the dev HUD; replays on demand. */
export const RewardFxGallery: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [seed, setSeed] = useState(1);
  const [run, setRun] = useState(0);
  return (
    <div className="fixed bottom-4 left-4 z-50 max-h-[70vh] overflow-auto text-xs font-mono text-stone-200">
      <button type="button" onClick={() => setOpen((o) => !o)} className="px-2 py-1 bg-stone-800 border border-stone-600 rounded">
        {open ? 'Hide' : 'Show'} FX gallery
      </button>
      {open && (
        <div className="mt-2 p-3 bg-stone-950/95 border border-stone-700 rounded w-[560px] space-y-3">
          <div className="flex gap-2 items-center">
            <label>seed <input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value) || 0)} className="w-16 bg-stone-900 border border-stone-700 px-1" /></label>
            <button type="button" onClick={() => setRun((r) => r + 1)} className="px-2 py-0.5 bg-amber-600 text-stone-950 rounded">Replay all</button>
            <span className="text-stone-500">Focus/Minimal/reduced-motion: toggle in Settings; effects resolve static.</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {RARITIES.map((r) => (
              <div key={`${r}-${run}`} className="relative h-20 border border-stone-700 rounded overflow-hidden">
                <span className="absolute top-0 left-1 text-[9px] uppercase">{r}</span>
                <RarityMaterialSweep rarity={r} />
                {RARITY_FX_POLICY[r].burst && (
                  <PixiParticleBurst
                    preset={burstRendererPreset(RARITY_FX_POLICY[r].burst!.preset)}
                    count={RARITY_FX_POLICY[r].burst!.count}
                    durationMs={RARITY_FX_POLICY[r].burst!.durationMs}
                    seed={seed}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {FAMILIES.map((f) => (
              <div key={`${f}-${run}`} className="border border-stone-700 rounded p-1 text-center">
                <span className="text-[9px]">{f}</span>
                <AnimatedGearFlourish rarity="vintage" era="1970s" name={SAMPLE_NAMES[f]} family={f} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RewardFxGallery;
