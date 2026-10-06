import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { PackageCheck, Archive, DollarSign, Cable } from 'lucide-react';
import { GamepadGlyph } from '@/components/ui/GamepadGlyph';
import { playConnectorSnap, playJackInsert } from './connectorAudio';

interface ConnectorActionRoutingProps {
  onAction: (action: 'equip' | 'stash' | 'sell') => void;
  baseValue: number;
  gamepadConnected?: boolean;
  lastInputType?: 'gamepad' | 'keyboard' | 'mouse' | 'touch';
}

export const ConnectorActionRouting: React.FC<ConnectorActionRoutingProps> = ({
  onAction,
  baseValue,
  gamepadConnected = false,
  lastInputType = 'mouse',
}) => {
  const [activeRouting, setActiveRouting] = useState<'equip' | 'stash' | 'sell' | null>(null);
  const reduceMotion = useReducedMotion();

  const handleSelect = (action: 'equip' | 'stash' | 'sell') => {
    setActiveRouting(action);
    if (action === 'equip') {
      playJackInsert(0.9);
    } else {
      playConnectorSnap(0.8);
    }

    setTimeout(() => {
      onAction(action);
    }, reduceMotion ? 50 : 200);
  };

  return (
    <div className="w-full mt-3 select-none relative">
      {/* Visual Header: Audio Routing Sockets */}
      <div className="flex items-center justify-between text-[9px] font-mono text-stone-400 mb-1.5 px-1">
        <span className="flex items-center gap-1">
          <Cable size={11} className="text-amber-400" />
          <span>WHERE DOES IT GO?</span>
        </span>
        <span className="text-stone-500">PICK ONE</span>
      </div>

      {/* Action Buttons Grid with Connector Terminal Motifs */}
      <div className="grid grid-cols-3 gap-2">
        {/* EQUIP RACK - Console Bus Patch */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleSelect('equip')}
          className={`py-2.5 px-2 bg-gradient-to-b from-emerald-600 via-emerald-700 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white font-bold text-xs rounded-sm border-2 shadow-lg flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeRouting === 'equip'
              ? 'border-white shadow-[0_0_20px_#10b981] scale-102'
              : 'border-emerald-400/80 shadow-[0_4px_12px_rgba(16,185,129,0.3)]'
          }`}
        >
          <div className="flex items-center gap-1.5">
            {gamepadConnected && lastInputType === 'gamepad' && (
              <GamepadGlyph button="south" size="xs" />
            )}
            <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-300 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 shadow-[0_0_4px_#34d399]" />
            </div>
            <PackageCheck size={14} className="text-emerald-200" />
          </div>

          <span className="tracking-wide">USE IT</span>
          <span className="text-[8px] font-mono text-emerald-200/90 font-normal">
            INTO THE STUDIO
          </span>
        </motion.button>

        {/* STASH - Road Case Vault */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleSelect('stash')}
          className={`py-2.5 px-2 bg-gradient-to-b from-stone-800 via-stone-850 to-stone-900 hover:from-stone-700 hover:to-stone-800 text-stone-200 font-bold text-xs rounded-sm border-2 shadow-lg flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeRouting === 'stash'
              ? 'border-white shadow-[0_0_20px_#94a3b8] scale-102'
              : 'border-stone-600 shadow-[0_4px_12px_rgba(0,0,0,0.4)]'
          }`}
        >
          <div className="flex items-center gap-1.5">
            {gamepadConnected && lastInputType === 'gamepad' && (
              <GamepadGlyph button="west" size="xs" />
            )}
            <div className="w-4 h-4 rounded-xs bg-stone-950 border border-stone-400 flex items-center justify-center">
              <div className="w-2 h-1 bg-stone-400 rounded-xs" />
            </div>
            <Archive size={14} className="text-stone-300" />
          </div>

          <span className="tracking-wide">STORE IT</span>
          <span className="text-[8px] font-mono text-stone-400 font-normal">
            ON THE SHELF
          </span>
        </motion.button>

        {/* SELL - Market Broker Feed */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleSelect('sell')}
          className={`py-2.5 px-2 bg-gradient-to-b from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-stone-950 font-bold text-xs rounded-sm border-2 shadow-lg flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeRouting === 'sell'
              ? 'border-white shadow-[0_0_20px_#f59e0b] scale-102'
              : 'border-amber-300 shadow-[0_4px_12px_rgba(245,158,11,0.3)]'
          }`}
        >
          <div className="flex items-center gap-1.5">
            {gamepadConnected && lastInputType === 'gamepad' && (
              <GamepadGlyph button="north" size="xs" />
            )}
            <div className="w-4 h-4 rounded-full bg-stone-900 border border-amber-300 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_4px_#fbbf24]" />
            </div>
            <DollarSign size={14} className="text-stone-950" />
          </div>

          <span className="tracking-wide">SELL IT</span>
          <span className="text-[8px] font-mono text-stone-900 font-bold">
            +${baseValue.toLocaleString()} CASH
          </span>
        </motion.button>
      </div>

    </div>
  );
};
