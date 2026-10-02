import React, { useState, useEffect } from 'react';
import { GamepadGlyph } from './GamepadGlyph';
import { useGamepad } from '@/hooks/useGamepad';
import { useSettings } from '@/contexts/settings-context-types';
import { isSliderElement } from '@/contexts/GamepadNavContext';

export interface GamepadHUDProps {
  className?: string;
  hasOpenModal?: boolean;
}

export const GamepadHUD: React.FC<GamepadHUDProps> = ({ className = '', hasOpenModal = false }) => {
  const { settings } = useSettings();
  const gamepad = useGamepad({
    preferredLayout: settings?.controllerLayout,
  });

  const [onSlider, setOnSlider] = useState(false);

  useEffect(() => {
    const handleFocus = () => {
      setOnSlider(isSliderElement(document.activeElement as HTMLElement | null));
    };

    window.addEventListener('focusin', handleFocus);
    window.addEventListener('focusout', handleFocus);
    return () => {
      window.removeEventListener('focusin', handleFocus);
      window.removeEventListener('focusout', handleFocus);
    };
  }, []);

  // Only display if a controller is connected and active
  if (!gamepad.isConnected || gamepad.lastInputType !== 'gamepad') {
    return null;
  }

  return (
    <aside
      aria-label="Gamepad Controls Guide"
      className={`fixed bottom-2 right-4 z-40 flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-stone-950/90 border border-stone-700/70 shadow-2xl backdrop-blur-md text-[11px] text-stone-300 pointer-events-none select-none transition-all duration-200 animate-in fade-in ${className}`}
    >
      {onSlider ? (
        <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
          <GamepadGlyph button="dpadLeft" size="xs" />
          <GamepadGlyph button="dpadRight" size="xs" />
          <span>Adjust Slider</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <GamepadGlyph button="lb" size="xs" />
          <GamepadGlyph button="rb" size="xs" />
          <span>Tabs</span>
        </div>
      )}

      <div className="h-3 w-px bg-stone-700/60" />

      <div className="flex items-center gap-1.5">
        <GamepadGlyph button="dpadUp" size="xs" />
        <span>{onSlider ? 'Next Slider' : 'Navigate'}</span>
      </div>

      <div className="h-3 w-px bg-stone-700/60" />

      <div className="flex items-center gap-1">
        <GamepadGlyph button="south" size="xs" />
        <span>Select</span>
      </div>

      {hasOpenModal ? (
        <>
          <div className="h-3 w-px bg-stone-700/60" />
          <div className="flex items-center gap-1">
            <GamepadGlyph button="east" size="xs" />
            <span>Close</span>
          </div>

          <div className="h-3 w-px bg-stone-700/60" />
          <div className="flex items-center gap-1">
            <GamepadGlyph button="rs" size="xs" />
            <span>Scroll</span>
          </div>
        </>
      ) : (
        <>
          <div className="h-3 w-px bg-stone-700/60" />
          <div className="flex items-center gap-1">
            <GamepadGlyph button="west" size="xs" />
            <span>Quick Work</span>
          </div>

          <div className="h-3 w-px bg-stone-700/60" />
          <div className="flex items-center gap-1">
            <GamepadGlyph button="lt" size="xs" />
            <span>Wheel</span>
          </div>

          <div className="h-3 w-px bg-stone-700/60" />
          <div className="flex items-center gap-1">
            <GamepadGlyph button="rs" size="xs" />
            <span>Camera</span>
          </div>

          <div className="h-3 w-px bg-stone-700/60" />
          <div className="flex items-center gap-1">
            <GamepadGlyph button="north" size="xs" />
            <span>Advance</span>
          </div>
        </>
      )}
    </aside>
  );
};

