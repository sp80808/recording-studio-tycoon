import React from 'react';
import { GamepadGlyph } from './GamepadGlyph';
import { useGamepad } from '@/hooks/useGamepad';
import { useSettings } from '@/contexts/settings-context-types';

export interface GamepadHUDProps {
  className?: string;
  hasOpenModal?: boolean;
}

export const GamepadHUD: React.FC<GamepadHUDProps> = ({ className = '', hasOpenModal = false }) => {
  const { settings } = useSettings();
  const gamepad = useGamepad({
    preferredLayout: settings?.controllerLayout,
  });

  // Only display if a controller is connected and active
  if (!gamepad.isConnected || gamepad.lastInputType !== 'gamepad') {
    return null;
  }

  return (
    <aside
      aria-label="Gamepad Controls Guide"
      className={`fixed bottom-2 right-4 z-40 flex items-center gap-3 px-3 py-1.5 rounded-full bg-slate-950/85 border border-slate-700/60 shadow-lg backdrop-blur-md text-[11px] text-slate-300 pointer-events-none select-none transition-opacity duration-200 animate-in fade-in ${className}`}
    >
      <div className="flex items-center gap-1.5">
        <GamepadGlyph button="lb" size="xs" />
        <GamepadGlyph button="rb" size="xs" />
        <span>Tabs</span>
      </div>

      <div className="h-3 w-px bg-slate-700/60" />

      <div className="flex items-center gap-1.5">
        <GamepadGlyph button="dpadUp" size="xs" />
        <span>Navigate</span>
      </div>

      <div className="h-3 w-px bg-slate-700/60" />

      <div className="flex items-center gap-1">
        <GamepadGlyph button="south" size="xs" />
        <span>Select</span>
      </div>

      {hasOpenModal && (
        <>
          <div className="h-3 w-px bg-slate-700/60" />
          <div className="flex items-center gap-1">
            <GamepadGlyph button="east" size="xs" />
            <span>Close</span>
          </div>
        </>
      )}

      <div className="h-3 w-px bg-slate-700/60" />

      <div className="flex items-center gap-1">
        <GamepadGlyph button="west" size="xs" />
        <span>Work</span>
      </div>

      <div className="h-3 w-px bg-slate-700/60" />

      <div className="flex items-center gap-1">
        <GamepadGlyph button="north" size="xs" />
        <span>Advance</span>
      </div>
    </aside>
  );
};
