import React, { useEffect, useRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Phone, Headphones, Sliders, Users, Disc3, Trophy, Sparkles, Settings as SettingsIcon } from 'lucide-react';
import { GamepadGlyph } from './GamepadGlyph';
import { useGamepad } from '@/hooks/useGamepad';
import { useSettings } from '@/contexts/settings-context-types';

export interface RadialSlice {
  id: string;
  label: string;
  icon: LucideIcon;
  angleDeg: number;
}

export const RADIAL_SLICES: readonly RadialSlice[] = [
  { id: 'bookings', label: 'Bookings', icon: Phone, angleDeg: 0 },
  { id: 'session', label: 'Session', icon: Headphones, angleDeg: 45 },
  { id: 'gear', label: 'Gear', icon: Sliders, angleDeg: 90 },
  { id: 'bands', label: 'Artists', icon: Disc3, angleDeg: 135 },
  { id: 'crew', label: 'Crew', icon: Users, angleDeg: 180 },
  { id: 'charts', label: 'Charts', icon: Trophy, angleDeg: 225 },
  { id: 'career', label: 'Career', icon: Sparkles, angleDeg: 270 },
  { id: 'settings', label: 'Settings', icon: SettingsIcon, angleDeg: 315 },
] as const;

export const getRadialSliceFromStick = (
  stickX: number,
  stickY: number,
  deadzone = 0.25
): RadialSlice | null => {
  const x = Number.isFinite(stickX) ? stickX : 0;
  const y = Number.isFinite(stickY) ? stickY : 0;
  if (Math.hypot(x, y) < deadzone) {
    return null;
  }

  // stickY is -1 up, +1 down. stickX is -1 left, +1 right.
  // Standard atan2 gives 0 at right, 90 down, -90 up, 180/-180 left.
  const deg = (Math.atan2(y, x) * 180) / Math.PI;
  // Offset by +90 so North (straight up) is 0 degrees
  const angleFromNorth = (deg + 90 + 360) % 360;
  const sliceIndex = Math.floor((angleFromNorth + 22.5) / 45) % 8;
  return RADIAL_SLICES[sliceIndex];
};

export interface RadialActionWheelProps {
  isOpen: boolean;
  onSelect: (sliceId: string) => void;
  onClose: () => void;
}

export const RadialActionWheel: React.FC<RadialActionWheelProps> = ({ isOpen, onSelect, onClose }) => {
  const { settings } = useSettings();
  const gamepad = useGamepad({
    preferredLayout: settings?.controllerLayout,
    hapticsEnabled: settings?.gamepadHaptics,
  });

  const lastHighlightedRef = useRef<string | null>(null);

  const activeSlice = getRadialSliceFromStick(gamepad.leftStick.x, gamepad.leftStick.y);

  // Trigger haptic when crossing into a new slice
  useEffect(() => {
    if (!isOpen || !activeSlice) return;
    if (activeSlice.id !== lastHighlightedRef.current) {
      lastHighlightedRef.current = activeSlice.id;
      gamepad.triggerHaptic(0.15, 0.25, 40);
    }
  }, [isOpen, activeSlice, gamepad]);

  // Handle selection on button press or release
  useEffect(() => {
    if (!isOpen) return;

    if (gamepad.justPressed.south && activeSlice) {
      onSelect(activeSlice.id);
      onClose();
    } else if (gamepad.justPressed.east) {
      onClose();
    }
  }, [isOpen, gamepad.justPressed.south, gamepad.justPressed.east, activeSlice, onSelect, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-80 h-80 rounded-full border-2 border-stone-700/80 bg-stone-950/95 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex items-center justify-center select-none">
        {/* Subtle radial division lines */}
        <div className="absolute inset-0 rounded-full pointer-events-none border border-amber-500/20" />
        <div className="absolute inset-4 rounded-full pointer-events-none border border-stone-800" />

        {/* Center Hub */}
        <div className="relative z-10 w-24 h-24 rounded-full bg-stone-900 border border-stone-700 flex flex-col items-center justify-center shadow-inner text-center p-2">
          {activeSlice ? (
            <>
              <activeSlice.icon size={22} className="text-amber-400 mb-0.5 animate-pulse" />
              <span className="text-[11px] font-bold text-amber-200 tracking-wider uppercase truncate max-w-full">
                {activeSlice.label}
              </span>
            </>
          ) : (
            <>
              <span className="text-[10px] text-stone-400 font-mono">Flick Stick</span>
              <span className="text-[9px] text-stone-500">to Select</span>
            </>
          )}
        </div>

        {/* 8 Radial Slices */}
        {RADIAL_SLICES.map((slice) => {
          const isSelected = activeSlice?.id === slice.id;
          // Calculate (x, y) coordinates around radius (radius = 110px)
          // North is 0 deg -> rad = -PI/2
          const rad = ((slice.angleDeg - 90) * Math.PI) / 180;
          const x = Math.cos(rad) * 115;
          const y = Math.sin(rad) * 115;

          const Icon = slice.icon;

          return (
            <button
              key={slice.id}
              onClick={() => {
                onSelect(slice.id);
                onClose();
              }}
              style={{
                transform: `translate(${x}px, ${y}px)`,
              }}
              className={`absolute flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-150 ${
                isSelected
                  ? 'bg-amber-500 text-stone-950 scale-110 shadow-[0_0_20px_rgba(245,158,11,0.6)] font-bold'
                  : 'bg-stone-900/90 text-stone-300 border border-stone-700/70 hover:border-amber-400/50'
              }`}
            >
              <Icon size={18} />
              <span className="text-[9px] tracking-tight leading-none mt-1 truncate max-w-[48px]">
                {slice.label}
              </span>
            </button>
          );
        })}

        {/* Bottom Help Prompt */}
        <div className="absolute -bottom-10 flex items-center gap-2 text-xs text-stone-300 bg-stone-900/90 px-3 py-1 rounded-full border border-stone-800">
          <GamepadGlyph button="south" size="xs" />
          <span>Confirm</span>
          <span className="text-stone-600">|</span>
          <GamepadGlyph button="east" size="xs" />
          <span>Cancel</span>
        </div>
      </div>
    </div>
  );
};
