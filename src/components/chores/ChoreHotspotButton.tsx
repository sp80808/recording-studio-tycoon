import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { ClipboardList, Coffee, Sparkles, Wrench } from 'lucide-react';
import { MotionButton } from '@/components/motion/primitives';
import type { ChoreCategory } from '@/simulation/choreEngine';

export type ChoreHotspotTone = 'brass' | 'steel' | 'live' | 'warn' | 'money';

export type ChoreHotspotKind = ChoreCategory | 'duties';

const KIND_TONE: Record<ChoreHotspotKind, ChoreHotspotTone> = {
  maintenance: 'warn',
  acoustics: 'live',
  hospitality: 'brass',
  duties: 'brass',
};

const KIND_ICON: Record<ChoreHotspotKind, LucideIcon> = {
  maintenance: Wrench,
  acoustics: Sparkles,
  hospitality: Coffee,
  duties: ClipboardList,
};

/**
 * lucide icons are forwardRef objects (`{ $$typeof, render }`), not functions, so a
 * `typeof === 'function'` check lets them through as a React child and unmounts the
 * whole app. Anything that is not already an element/primitive/array is a component.
 */
const isComponentType = (value: unknown): value is LucideIcon =>
  typeof value === 'function' ||
  (typeof value === 'object' && value !== null && !React.isValidElement(value) && !Array.isArray(value) && '$$typeof' in value);

export interface ChoreHotspotButtonProps {
  label: string;
  /** Short engraved meta — energy cost, count, or status */
  meta?: React.ReactNode;
  kind?: ChoreHotspotKind;
  tone?: ChoreHotspotTone;
  icon?: LucideIcon | React.ReactNode;
  title?: string;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  /** Finite attention ring (old duty-chip pulse, not endless bounce) */
  attention?: boolean;
  /** Timed chore in progress — shows Working rail + dims peers */
  working?: boolean;
  /** Optional 0–1 progress; when omitted while working, uses indeterminate rail */
  progress?: number;
}

/**
 * Hybrid floor chore control: stamped charcoal/brass plate (new consistency)
 * with depth, lift, icon plate, and working rail from the old duty chips.
 */
export function ChoreHotspotButton({
  label,
  meta,
  kind = 'maintenance',
  tone,
  icon,
  title,
  className = '',
  onClick,
  disabled = false,
  attention = false,
  working = false,
  progress,
}: ChoreHotspotButtonProps) {
  const resolvedTone = tone ?? KIND_TONE[kind];
  const DefaultIcon = KIND_ICON[kind];
  const iconNode =
    icon == null ? (
      <DefaultIcon size={12} aria-hidden="true" strokeWidth={2.25} />
    ) : isComponentType(icon) ? (
      React.createElement(icon as LucideIcon, { size: 12, 'aria-hidden': true, strokeWidth: 2.25 })
    ) : (
      icon
    );

  const classes = [
    'rst-chore-btn',
    `rst-chore-btn--${resolvedTone}`,
    attention && !working ? 'feel-attention' : '',
    working ? 'rst-chore-btn--working' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const progressPct =
    typeof progress === 'number' && Number.isFinite(progress)
      ? Math.max(0, Math.min(100, Math.round(progress * 100)))
      : null;

  return (
    <MotionButton
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      tapScale={0.96}
      magnetic={!working && !disabled}
      magneticPull={2}
      className={classes}
      aria-busy={working || undefined}
    >
      <span className="rst-chore-btn__glyph" aria-hidden="true">
        {iconNode}
      </span>
      <span className="rst-chore-btn__body">
        <span className="rst-chore-btn__label">{working ? `Working… ${label}` : label}</span>
        {meta != null && meta !== false && !working && (
          <span className="rst-chore-btn__meta">{meta}</span>
        )}
      </span>
      {working && (
        <span
          className={`rst-chore-btn__rail ${progressPct == null ? 'rst-chore-btn__rail--indeterminate' : ''}`}
          aria-hidden="true"
        >
          <i style={progressPct != null ? { width: `${progressPct}%` } : undefined} />
        </span>
      )}
    </MotionButton>
  );
}

export default ChoreHotspotButton;
