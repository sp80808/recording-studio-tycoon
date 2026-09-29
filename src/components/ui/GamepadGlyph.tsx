import React from 'react';
import type { ControllerLayoutPreference, ControllerType, StandardButton } from '@/types/gamepad';

export type GamepadGlyphSize = 'xs' | 'sm' | 'md' | 'lg';

export interface GamepadGlyphProps {
  button: StandardButton;
  controllerType?: ControllerType;
  size?: GamepadGlyphSize;
  className?: string;
  /** Render as a purely decorative badge (no aria-label). */
  decorative?: boolean;
}

const FACE_BUTTONS: readonly StandardButton[] = ['south', 'east', 'west', 'north'];

const DPAD_LABELS = {
  dpadUp: '▲',
  dpadDown: '▼',
  dpadLeft: '◀',
  dpadRight: '▶',
} as const;

const BUTTON_LABELS: Record<ControllerType, Record<StandardButton, string>> = {
  xbox: {
    south: 'A',
    east: 'B',
    west: 'X',
    north: 'Y',
    lb: 'LB',
    rb: 'RB',
    lt: 'LT',
    rt: 'RT',
    select: 'VIEW',
    start: 'MENU',
    ls: 'L3',
    rs: 'R3',
    ...DPAD_LABELS,
  },
  playstation: {
    south: '✕',
    east: '○',
    west: '□',
    north: '△',
    lb: 'L1',
    rb: 'R1',
    lt: 'L2',
    rt: 'R2',
    select: 'SHARE',
    start: 'OPTIONS',
    ls: 'L3',
    rs: 'R3',
    ...DPAD_LABELS,
  },
  switch: {
    south: 'B',
    east: 'A',
    west: 'Y',
    north: 'X',
    lb: 'L',
    rb: 'R',
    lt: 'ZL',
    rt: 'ZR',
    select: '−',
    start: '+',
    ls: 'L3',
    rs: 'R3',
    ...DPAD_LABELS,
  },
  generic: {
    south: 'S',
    east: 'E',
    west: 'W',
    north: 'N',
    lb: 'LB',
    rb: 'RB',
    lt: 'LT',
    rt: 'RT',
    select: 'SELECT',
    start: 'START',
    ls: 'L3',
    rs: 'R3',
    ...DPAD_LABELS,
  },
};

/** Slate shell used for shoulders, triggers, d-pad and stick clicks. */
const NEUTRAL_BUTTON_COLOR = '#334155';
const NEUTRAL_TEXT_COLOR = '#f1f5f9';
const GENERIC_TEXT_COLOR = '#cbd5e1';

const BUTTON_COLORS: Record<ControllerType, Partial<Record<StandardButton, string>>> = {
  xbox: { south: '#10b981', east: '#ef4444', west: '#3b82f6', north: '#eab308' },
  playstation: { south: '#38bdf8', east: '#ef4444', west: '#ec4899', north: '#22c55e' },
  switch: { south: '#06b6d4', east: '#ef4444', west: '#06b6d4', north: '#ef4444' },
  generic: { south: '#1e293b', east: '#1e293b', west: '#1e293b', north: '#1e293b' },
};

const GLYPH_PIXEL_SIZES: Record<GamepadGlyphSize, number> = {
  xs: 16,
  sm: 22,
  md: 30,
  lg: 40,
};

export const getButtonLabel = (
  button: StandardButton,
  controllerType: ControllerType = 'generic'
): string => BUTTON_LABELS[controllerType]?.[button] ?? BUTTON_LABELS.generic[button];

export const getButtonColor = (
  button: StandardButton,
  controllerType: ControllerType = 'generic'
): string => BUTTON_COLORS[controllerType]?.[button] ?? NEUTRAL_BUTTON_COLOR;

export const getButtonTextColor = (
  button: StandardButton,
  controllerType: ControllerType = 'generic'
): string =>
  controllerType === 'generic' && FACE_BUTTONS.includes(button)
    ? GENERIC_TEXT_COLOR
    : NEUTRAL_TEXT_COLOR;

export const CONTROLLER_TYPE_NAMES: Record<ControllerType, string> = {
  xbox: 'Xbox',
  playstation: 'PlayStation',
  switch: 'Nintendo Switch',
  generic: 'Generic Gamepad',
};

export const CONTROLLER_LAYOUT_OPTIONS: { value: ControllerLayoutPreference; label: string }[] = [
  { value: 'auto', label: 'Auto (match connected controller)' },
  { value: 'xbox', label: 'Xbox (A / B / X / Y)' },
  { value: 'playstation', label: 'PlayStation (✕ / ○ / □ / △)' },
  { value: 'switch', label: 'Nintendo Switch (B / A / Y / X)' },
  { value: 'generic', label: 'Generic Gamepad' },
];

const labelFontSize = (label: string): number => {
  if (label.length <= 1) return 18;
  if (label.length === 2) return 13;
  if (label.length === 3) return 10;
  if (label.length === 4) return 8.5;
  return 7;
};

/**
 * Vector controller button badge. Labels and colours switch per controller
 * family so on-screen prompts always match the connected hardware.
 */
export const GamepadGlyph: React.FC<GamepadGlyphProps> = ({
  button,
  controllerType = 'generic',
  size = 'sm',
  className = '',
  decorative = false,
}) => {
  const label = getButtonLabel(button, controllerType);
  const fill = getButtonColor(button, controllerType);
  const textColor = getButtonTextColor(button, controllerType);
  const pixels = GLYPH_PIXEL_SIZES[size];
  const isRound = FACE_BUTTONS.includes(button) || controllerType === 'playstation';
  const rx = isRound ? 18 : 9;

  return (
    <svg
      width={pixels}
      height={pixels}
      viewBox="0 0 40 40"
      className={`inline-block align-middle shrink-0 ${className}`}
      style={{ filter: 'drop-shadow(0 1px 1px rgba(2, 6, 23, 0.55))' }}
      role={decorative ? 'presentation' : 'img'}
      aria-label={decorative ? undefined : `${controllerType} ${button} button`}
      aria-hidden={decorative || undefined}
      focusable="false"
    >
      <rect
        x="2"
        y="2"
        width="36"
        height="36"
        rx={rx}
        fill={fill}
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth="1.6"
      />
      <text
        x="20"
        y="21"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={textColor}
        fontSize={labelFontSize(label)}
        fontWeight={700}
        fontFamily="'Inter', 'Segoe UI', system-ui, sans-serif"
      >
        {label}
      </text>
    </svg>
  );
};

export default GamepadGlyph;
