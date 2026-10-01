import React from 'react';
import { TRACK_FAMILY, type TrackKind } from '@/minigames/busMerge';

/**
 * In-house CC0 vector glyphs for Bus & Stem Merge tiles (logged in docs/ART_SOURCING_LOG.md).
 * Drawn on a 32x32 grid in a single stroke colour so the family tint carries the meaning.
 */
export const FAMILY_STYLE = {
  drums: { stroke: '#f59e0b', tile: 'border-amber-600/70 bg-amber-950/60 text-amber-200' },
  music: { stroke: '#34d399', tile: 'border-emerald-600/70 bg-emerald-950/60 text-emerald-200' },
  vox: { stroke: '#f472b6', tile: 'border-pink-600/70 bg-pink-950/60 text-pink-200' },
  mix: { stroke: '#fde68a', tile: 'border-yellow-400 bg-yellow-900/60 text-yellow-100' },
  special: { stroke: '#7dd3fc', tile: 'border-sky-500 bg-sky-950/70 text-sky-200' },
} as const;

const GLYPHS: Record<TrackKind, React.ReactNode> = {
  kick: <><circle cx="16" cy="16" r="10" /><circle cx="16" cy="16" r="4" /></>,
  snare: <><ellipse cx="16" cy="12" rx="10" ry="4" /><path d="M6 12v9c0 2.5 4.5 4.5 10 4.5s10-2 10-4.5v-9" /></>,
  overhead: <><path d="M16 4v10" /><path d="M5 14h22l-4 5H9z" /></>,
  'gtr-l': <><path d="M20 4l8 8" /><path d="M24 8L14 18" /><circle cx="10" cy="22" r="6" /></>,
  'gtr-r': <><path d="M12 4L4 12" /><path d="M8 8l10 10" /><circle cx="22" cy="22" r="6" /></>,
  bass: <><path d="M22 4l6 6" /><path d="M25 7L12 20" /><circle cx="9" cy="23" r="5" /><path d="M5 27l2-2" /></>,
  keys: <><rect x="4" y="9" width="24" height="14" rx="1" /><path d="M10 9v14M16 9v14M22 9v14" /></>,
  'vox-lead': <><rect x="12" y="4" width="8" height="13" rx="4" /><path d="M8 14a8 8 0 0016 0M16 22v6M11 28h10" /></>,
  'vox-dbl': <><rect x="9" y="5" width="7" height="11" rx="3.5" /><rect x="17" y="8" width="7" height="11" rx="3.5" /><path d="M6 20a6 6 0 0012 0" /></>,
  sample: <><path d="M16 3l3.5 8.5L28 12l-6.5 5.5L23.5 26 16 21.5 8.5 26l2-8.5L4 12l8.5-.5z" /></>,
  'drum-bus': <><path d="M5 9h8c4 0 4 14 8 14h6M5 23h8c4 0 4-14 8-14h6" /><circle cx="27" cy="9" r="0.1" /></>,
  'guitar-bus': <><path d="M5 9h8c4 0 4 14 8 14h6M5 23h8c4 0 4-14 8-14h6" /></>,
  'rhythm-bus': <><path d="M5 9h8c4 0 4 14 8 14h6M5 23h8c4 0 4-14 8-14h6" /></>,
  drums: <><circle cx="16" cy="16" r="11" /><path d="M9 9l14 14M23 9L9 23" /></>,
  music: <><path d="M12 24V8l14-3v16" /><circle cx="9" cy="24" r="3" /><circle cx="23" cy="21" r="3" /></>,
  vox: <><path d="M4 16c3-9 5-9 8 0s5 9 8 0 5-9 8 0" /></>,
  premix: <><path d="M4 8h24M4 16h24M4 24h24" /><circle cx="11" cy="8" r="2.5" /><circle cx="21" cy="16" r="2.5" /><circle cx="14" cy="24" r="2.5" /></>,
  mix: <><rect x="4" y="6" width="24" height="20" rx="2" /><path d="M9 21l4-6 3 3 4-8 3 5" /></>,
};

/** Small corner mark so bus-level tiles read differently from raw tracks. */
const BUS_KINDS: TrackKind[] = ['drum-bus', 'guitar-bus', 'rhythm-bus'];

export const TrackGlyph: React.FC<{ kind: TrackKind; size?: number }> = ({ kind, size = 28 }) => (
  <svg
    viewBox="0 0 32 32"
    width={size}
    height={size}
    fill="none"
    stroke={FAMILY_STYLE[TRACK_FAMILY[kind]].stroke}
    strokeWidth={BUS_KINDS.includes(kind) ? 2.4 : 1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {GLYPHS[kind]}
  </svg>
);
