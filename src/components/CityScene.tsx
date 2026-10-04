import React from 'react';
import { getCityById } from '@/rpg/cities';
import { SKYLINES } from './CitySkyline';

export type SceneMood = 'dusk' | 'night' | 'dawn' | 'day';

const SKIES: Record<SceneMood, [string, string, string]> = {
  dusk: ['#1c1530', '#8a4a52', '#f0b36a'],
  night: ['#05070f', '#141a33', '#2a3358'],
  dawn: ['#1b2540', '#6b7fa8', '#f4cf9a'],
  day: ['#385a8c', '#8fb7d9', '#e8f1f5'],
};

/** Stars at fixed spots so the scene never shimmers between renders. */
const STARS: [number, number][] = [[12, 8], [30, 16], [52, 6], [74, 14], [98, 7], [120, 18], [144, 9], [170, 15], [196, 6], [222, 13]];

/** In-house cutscene card: layered city skyline under a mood sky, lit windows and a studio sign. Pure SVG; proprietary RST original. */
export const CityScene: React.FC<{ cityId?: string; mood?: SceneMood; className?: string }> = ({ cityId, mood = 'dusk', className = '' }) => {
  const city = getCityById(cityId);
  if (!city) return null;
  const [top, mid, low] = SKIES[mood];
  const gid = `scene-${city.id}-${mood}`;
  const lit = mood !== 'day';
  return (
    <svg
      viewBox="0 0 240 90"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={`${city.name} at ${mood}`}
      className={`h-28 w-full rounded-xl border border-[var(--rst-line)] ${className}`}
      data-testid="city-scene"
      data-city={city.id}
      data-mood={mood}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="0.6" stopColor={mid} />
          <stop offset="1" stopColor={low} />
        </linearGradient>
      </defs>
      <rect width="240" height="90" fill={`url(#${gid})`} />
      {mood !== 'day' && STARS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={mood === 'night' ? 0.9 : 0.5} fill="#fff" opacity={mood === 'night' ? 0.85 : 0.4} />)}
      <circle cx={mood === 'dawn' ? 40 : 196} cy={mood === 'night' ? 20 : 48} r={mood === 'day' ? 9 : 7} fill={mood === 'night' ? '#e8ecf8' : '#ffe2a8'} opacity={0.9} />
      <g transform="translate(0 6) scale(1 0.9)" opacity={0.45}>
        <path d={SKYLINES[city.id]} transform="translate(-20 12)" fill="#0b0e18" />
      </g>
      <g transform="translate(0 28)">
        <path d={SKYLINES[city.id]} fill="#070910" fillRule="evenodd" />
        {lit && [24, 58, 90, 124, 156, 188, 214].map((x, i) => <rect key={x} x={x} y={22 + (i % 3) * 6} width="2" height="2.5" fill="#ffd27a" opacity={0.85} />)}
        <path d={SKYLINES[city.id]} fill="none" stroke={city.accent} strokeWidth="0.6" opacity={0.7} />
      </g>
      <rect y="86" width="240" height="4" fill="#05060b" />
      <rect x="8" y="76" width="64" height="8" rx="1.5" fill="#0b0e18" stroke={city.accent} strokeWidth="0.6" />
      <text x="40" y="82.2" textAnchor="middle" fontSize="5" fontFamily="monospace" fill={city.accent} letterSpacing="0.8">STUDIO • ON AIR</text>
    </svg>
  );
};

export default CityScene;
