import React from 'react';
import type { GearKind } from './gearKind';

/**
 * In-house CC0 side/front outlines of studio gear, drawn on a 120x60 grid.
 * `cutout` is the empty foam pocket, `outline` is the gear backlit in the foam,
 * `solid` is the gear lifted out. Colour comes from `currentColor`.
 */
export type SilhouetteVariant = 'cutout' | 'outline' | 'solid';

const SHAPES: Record<GearKind, React.ReactNode> = {
  mic: (
    <>
      <rect x="14" y="14" width="30" height="32" rx="15" />
      <path d="M44 22 L96 25 L96 35 L44 38 Z" />
      <rect x="96" y="26" width="10" height="8" rx="1.5" />
      <g className="gs-detail">
        <line x1="20" y1="22" x2="38" y2="22" /><line x1="18" y1="30" x2="40" y2="30" /><line x1="20" y1="38" x2="38" y2="38" />
      </g>
    </>
  ),
  rack: (
    <>
      <rect x="4" y="16" width="112" height="28" rx="2" />
      <g className="gs-detail">
        <circle cx="10" cy="22" r="1.6" /><circle cx="10" cy="38" r="1.6" /><circle cx="110" cy="22" r="1.6" /><circle cx="110" cy="38" r="1.6" />
        <circle cx="30" cy="30" r="5" /><circle cx="46" cy="30" r="5" /><circle cx="62" cy="30" r="5" />
        <rect x="76" y="23" width="24" height="14" rx="1" />
      </g>
    </>
  ),
  console: (
    <>
      <path d="M8 46 L20 14 L100 14 L112 46 Z" />
      <g className="gs-detail">
        {[30, 44, 58, 72, 86].map((x) => <line key={x} x1={x} y1="24" x2={x} y2="40" />)}
        {[30, 44, 58, 72, 86].map((x) => <circle key={`k${x}`} cx={x} cy="19" r="2" />)}
      </g>
    </>
  ),
  recorder: (
    <>
      <rect x="10" y="22" width="100" height="30" rx="3" />
      <circle cx="36" cy="20" r="14" /><circle cx="84" cy="20" r="14" />
      <g className="gs-detail">
        <circle cx="36" cy="20" r="3" /><circle cx="84" cy="20" r="3" />
        <rect x="46" y="38" width="28" height="6" rx="1" />
      </g>
    </>
  ),
  amp: (
    <>
      <rect x="22" y="10" width="76" height="44" rx="4" />
      <path d="M48 10 Q60 2 72 10" className="gs-detail" />
      <g className="gs-detail">
        <rect x="28" y="24" width="64" height="24" rx="2" />
        {[34, 42, 50, 58, 66, 74, 82].map((x) => <circle key={x} cx={x} cy="17" r="1.6" />)}
      </g>
    </>
  ),
  keys: (
    <>
      <rect x="4" y="18" width="112" height="26" rx="3" />
      <g className="gs-detail">
        <rect x="10" y="22" width="100" height="5" rx="1" />
        {Array.from({ length: 14 }, (_, i) => <line key={i} x1={14 + i * 7} y1="30" x2={14 + i * 7} y2="42" />)}
      </g>
    </>
  ),
  headphones: (
    <>
      <path d="M30 40 C30 8 90 8 90 40" fill="none" strokeWidth="5" className="gs-band" />
      <rect x="22" y="34" width="16" height="22" rx="6" />
      <rect x="82" y="34" width="16" height="22" rx="6" />
    </>
  ),
  speaker: (
    <>
      <rect x="40" y="4" width="40" height="54" rx="3" />
      <g className="gs-detail">
        <circle cx="60" cy="16" r="5" /><circle cx="60" cy="38" r="12" /><circle cx="60" cy="38" r="4" />
      </g>
    </>
  ),
  stand: (
    <>
      <g className="gs-band" fill="none" strokeWidth="3.5" strokeLinecap="round">
        <line x1="40" y1="56" x2="40" y2="20" />
        <line x1="40" y1="20" x2="96" y2="8" />
        <line x1="40" y1="44" x2="22" y2="56" /><line x1="40" y1="44" x2="58" y2="56" />
      </g>
      <circle cx="40" cy="20" r="4" />
    </>
  ),
  software: (
    <>
      <rect x="34" y="12" width="52" height="36" rx="4" />
      <g className="gs-detail">
        <circle cx="48" cy="30" r="6" /><line x1="54" y1="30" x2="76" y2="30" /><line x1="70" y1="30" x2="70" y2="36" /><line x1="76" y1="30" x2="76" y2="36" />
      </g>
    </>
  ),
};

export const GearSilhouette: React.FC<{
  kind: GearKind;
  variant?: SilhouetteVariant;
  className?: string;
  style?: React.CSSProperties;
}> = ({ kind, variant = 'solid', className = '', style }) => (
  <svg
    viewBox="0 0 120 60"
    aria-hidden="true"
    data-gear-kind={kind}
    className={`gear-silhouette gear-silhouette--${variant} ${className}`}
    style={style}
  >
    <style>{`
      .gear-silhouette--cutout { fill: #0c0a09; stroke: #000; stroke-width: 1.5; filter: drop-shadow(0 2px 2px rgba(0,0,0,.9)); }
      .gear-silhouette--cutout .gs-detail { display: none; }
      .gear-silhouette--cutout .gs-band { stroke: #0c0a09; }
      .gear-silhouette--outline { fill: rgba(0,0,0,.55); stroke: currentColor; stroke-width: 1.4; }
      .gear-silhouette--outline .gs-detail { fill: none; stroke: currentColor; stroke-opacity: .35; }
      .gear-silhouette--outline .gs-band { stroke: currentColor; }
      .gear-silhouette--solid { fill: #44403c; stroke: #a8a29e; stroke-width: 1; }
      .gear-silhouette--solid .gs-detail { fill: #1c1917; stroke: currentColor; stroke-width: 1.2; }
      .gear-silhouette--solid .gs-band { stroke: #78716c; }
    `}</style>
    {SHAPES[kind]}
  </svg>
);

export default GearSilhouette;
