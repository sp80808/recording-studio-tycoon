// Non-gameplay fallback/thumbnail for the extra studio rooms (Vocal Suite, Live Room, Mix Suite).
// The playable rooms are full isometric Pixi scenes (roomLayouts.ts / roomLayoutScene.ts, #248); StudioRoom no
// longer mounts this. Kept for text-only fallbacks and the room-switcher check. In-house proprietary original SVG drawn in code (see docs/ART_SOURCING_LOG.md).
import React from 'react';
import type { StudioRoom } from '@/types/game';

export interface RoomVignetteProps {
  room: StudioRoom;
  /** Title of the project booked into this room right now, if any. */
  occupiedBy?: string | null;
}

const FLOOR = 'M200 150 L340 80 L200 10 L60 80 Z';
const WALL_L = 'M60 80 L200 150 L200 110 L60 40 Z';
const WALL_R = 'M200 150 L340 80 L340 40 L200 110 Z';

const Foam: React.FC<{ x: number; y: number; n: number; flip?: boolean }> = ({ x, y, n, flip }) => (
  <g>
    {Array.from({ length: n }, (_, i) => (
      <path key={i} d={flip ? `M${x + i * 14} ${y - i * 7} l12 6 v-14 l-12 -6z` : `M${x + i * 14} ${y + i * 7} l12 -6 v-14 l-12 6z`} fill={i % 2 ? '#3b4252' : '#2e3440'} stroke="#161a22" strokeWidth="0.6" />
    ))}
  </g>
);

const VocalScene: React.FC<{ live: boolean }> = ({ live }) => (
  <g>
    <Foam x={70} y={52} n={6} />
    <Foam x={210} y={104} n={6} flip />
    {/* sofa */}
    <path d="M250 120 l36 -18 v-12 l-36 18z" fill="#6b4a3a" />
    <path d="M250 120 l-20 -10 v-12 l20 10z" fill="#553a2d" />
    <path d="M250 108 l36 -18 l-20 -10 l-36 18z" fill="#8a6350" />
    {/* mic + pop filter */}
    <ellipse cx="170" cy="128" rx="14" ry="6" fill="#000" opacity="0.3" />
    <path d="M170 128 V82" stroke="#1d1d22" strokeWidth="2.4" />
    <path d="M170 82 q14 -4 14 -14" stroke="#1d1d22" strokeWidth="2" fill="none" />
    <rect x="180" y="58" width="8" height="14" rx="4" fill="#c9974a" />
    <circle cx="176" cy="66" r="11" fill="none" stroke="#aeb7c5" strokeWidth="1" opacity="0.8" />
    {/* headphones on stand */}
    <path d="M118 104 v-22 M110 82 q8 -12 16 0" stroke="#e6b866" strokeWidth="2" fill="none" />
    <rect x="107" y="80" width="5" height="9" rx="2" fill="#18181b" />
    <rect x="124" y="80" width="5" height="9" rx="2" fill="#18181b" />
    <circle cx="316" cy="52" r="4" fill={live ? '#ff4a4a' : '#5a2a2a'} className={live ? 'animate-pulse' : ''} />
  </g>
);

const LiveScene: React.FC<{ live: boolean }> = ({ live }) => (
  <g>
    <path d="M120 100 L200 140 L280 100 L200 60 Z" fill="#7a3b2a" opacity="0.55" />
    {/* drum kit */}
    <ellipse cx="200" cy="118" rx="38" ry="12" fill="#000" opacity="0.28" />
    <ellipse cx="200" cy="104" rx="20" ry="10" fill="#b23a3a" />
    <ellipse cx="200" cy="104" rx="14" ry="7" fill="#e8d8a8" />
    <ellipse cx="172" cy="92" rx="11" ry="5" fill="#3a6ea5" />
    <ellipse cx="228" cy="92" rx="11" ry="5" fill="#3a6ea5" />
    <ellipse cx="248" cy="108" rx="12" ry="5" fill="#2f2f38" />
    <path d="M160 70 l-16 -6 M240 66 l16 -6" stroke="#c9974a" strokeWidth="2" />
    <ellipse cx="144" cy="64" rx="14" ry="3" fill="#d9b25a" />
    <ellipse cx="256" cy="60" rx="14" ry="3" fill="#d9b25a" />
    {/* amp stack */}
    <path d="M286 110 l20 -10 v-26 l-20 10z" fill="#14151a" />
    <path d="M286 110 l-14 -7 v-26 l14 7z" fill="#1d1f27" />
    <path d="M286 84 l20 -10 l-14 -7 l-20 10z" fill="#2a2c36" />
    <circle cx="279" cy="92" r="5" fill="#3a3f4d" />
    <Foam x={70} y={52} n={5} />
    <circle cx="60" cy="48" r="4" fill={live ? '#ff4a4a' : '#5a2a2a'} className={live ? 'animate-pulse' : ''} />
  </g>
);

const MixScene: React.FC<{ live: boolean }> = ({ live }) => (
  <g>
    {/* desk */}
    <path d="M130 118 L220 118 L270 94 L180 94 Z" fill="#3a2f28" />
    <path d="M130 118 v10 h90 v-10z" fill="#2a211c" />
    <path d="M220 118 l50 -24 v10 l-50 24z" fill="#231b17" />
    {/* console strip faders */}
    {Array.from({ length: 10 }, (_, i) => (
      <rect key={i} x={146 + i * 8} y={108 - i * 2.4} width="2" height="7" fill={['#59d98a', '#f0b84a', '#5aa9e6', '#e05c5c'][i % 4]} />
    ))}
    {/* big monitors */}
    <path d="M150 90 l14 -7 v-24 l-14 7z" fill="#14151a" />
    <circle cx="157" cy="76" r="4" fill="#2f3340" />
    <path d="M232 76 l14 -7 v-24 l-14 7z" fill="#14151a" />
    <circle cx="239" cy="62" r="4" fill="#2f3340" />
    {/* diffusers on the back wall */}
    <Foam x={84} y={58} n={5} />
    <path d="M280 64 h24 v24 h-24z" fill="#4c5769" opacity="0.7" />
    <path d="M286 70 h12 M286 76 h12 M286 82 h12" stroke="#9aa5b5" strokeWidth="1" />
    <circle cx="316" cy="52" r="4" fill={live ? '#59d98a' : '#25402f'} className={live ? 'animate-pulse' : ''} />
  </g>
);

const SCENES: Record<string, React.FC<{ live: boolean }>> = {
  'vocal-suite': VocalScene,
  'live-room': LiveScene,
  'mix-suite': MixScene,
};

const BLURB: Record<string, string> = {
  'vocal-suite': 'A dead-quiet booth for vocals and overdubs.',
  'live-room': 'Big, bright and loud: drums, amps and a whole band at once.',
  'mix-suite': 'Treated, calibrated and built for the final polish.',
};

const KIND_LABEL: Record<string, string> = {
  tracking: 'Tracking', production: 'Production', mixing: 'Mixing', mastering: 'Mastering', general: 'General',
};

export const RoomVignette: React.FC<RoomVignetteProps> = ({ room, occupiedBy }) => {
  const Scene = SCENES[room.type];
  const live = Boolean(occupiedBy);
  return (
    <div className="absolute inset-0 z-[8] flex flex-col items-center justify-center gap-3 bg-[#14110e] p-4 pt-24" data-testid={`room-vignette-${room.id}`} role="region" aria-label={room.name}>
      <svg viewBox="0 0 400 170" className="w-full max-w-[520px]" aria-hidden="true">
        <path d={WALL_L} fill="#262b33" />
        <path d={WALL_R} fill="#1e2229" />
        <path d={FLOOR} fill="#4a3a2e" />
        <path d={FLOOR} fill="none" stroke="#6b5442" strokeWidth="1" />
        {Scene && <Scene live={live} />}
      </svg>
      <div className="text-center">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-amber-200">{room.name}</h3>
        <p className="text-xs text-stone-400">{BLURB[room.type] ?? 'An extra studio room.'}</p>
      </div>
      <ul className="flex flex-wrap justify-center gap-1.5 text-[11px] text-stone-200">
        <li className="rounded border border-stone-700 bg-stone-900/70 px-2 py-0.5">Quality +{room.qualityBonus}</li>
        <li className="rounded border border-stone-700 bg-stone-900/70 px-2 py-0.5">Speed +{room.speedBonus}</li>
        <li className="rounded border border-stone-700 bg-stone-900/70 px-2 py-0.5">{room.supportedStageKinds.map(k => KIND_LABEL[k] ?? k).join(' · ')}</li>
      </ul>
      <p className={`text-xs font-semibold ${live ? 'text-red-300' : 'text-emerald-300'}`} role="status">
        {live ? `Booked: ${occupiedBy}` : 'Free: book a session to put it to work.'}
      </p>
    </div>
  );
};
