import React from 'react';
import { MotionButton } from '@/components/motion/primitives';

export type StudioStampTone = 'brass' | 'steel' | 'live' | 'money' | 'warn';

const TONE_CLASS: Record<StudioStampTone, string> = {
  brass: 'rst-stamp-brass',
  steel: 'rst-stamp-steel',
  live: 'rst-stamp-live',
  money: 'rst-stamp-money',
  warn: 'rst-stamp-warn',
};

export interface StudioStampChipProps {
  children: React.ReactNode;
  /** Secondary engraved meta (session count, match %, etc.) */
  meta?: React.ReactNode;
  tone?: StudioStampTone;
  title?: string;
  className?: string;
  /** Interactive stamped control — uses MotionButton press scale */
  onClick?: () => void;
  disabled?: boolean;
}

/**
 * Studio-native stamped plate label / control.
 * Flat charcoal + brass/steel hairline, tracked uppercase type, tactile press when interactive.
 */
export function StudioStampChip({
  children,
  meta,
  tone = 'brass',
  title,
  className = '',
  onClick,
  disabled = false,
}: StudioStampChipProps) {
  const classes = `rst-stamp ${TONE_CLASS[tone]} ${className}`.trim();

  const body = (
    <>
      <span className="rst-stamp__label">{children}</span>
      {meta != null && meta !== false && (
        <span className="rst-stamp__meta">{meta}</span>
      )}
    </>
  );

  if (onClick) {
    return (
      <MotionButton
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title}
        tapScale={0.97}
        className={classes}
      >
        {body}
      </MotionButton>
    );
  }

  return (
    <span className={classes} title={title}>
      {body}
    </span>
  );
}

export default StudioStampChip;
