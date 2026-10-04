import React from 'react';

/**
 * In-house proprietary SVG icon set. Replaces emoji glyphs in the UI so icons render
 * identically on every platform and inherit `currentColor`.
 */

type IconProps = { size?: number | string; className?: string; title?: string };

const Svg: React.FC<IconProps & { children: React.ReactNode }> = ({ size = '1em', className, title, children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    role={title ? 'img' : undefined}
    aria-hidden={title ? undefined : true}
    aria-label={title}
    style={{ display: 'inline-block', verticalAlign: '-0.125em', flexShrink: 0 }}
  >
    {title ? <title>{title}</title> : null}
    {children}
  </svg>
);

const GENRE_PATHS: Record<string, React.ReactNode> = {
  // eighth note
  pop: (<><path d="M9 18V5l10-2v13" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" /></>),
  // guitar
  rock: (<><path d="M14 4l6 6" /><path d="M16 8l-5.5 5.5" /><circle cx="8" cy="16" r="4" /><circle cx="8" cy="16" r="1" /></>),
  // mic
  'hip-hop': (<><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0014 0" /><path d="M12 18v3" /></>),
  // knobs / sliders
  electronic: (<><path d="M5 4v16M12 4v16M19 4v16" /><circle cx="5" cy="9" r="2" fill="currentColor" /><circle cx="12" cy="15" r="2" fill="currentColor" /><circle cx="19" cy="8" r="2" fill="currentColor" /></>),
  // trumpet bell
  jazz: (<><path d="M3 10h10l7-5v14l-7-5H3z" /><path d="M7 14v3" /></>),
  // staff
  classical: (<><path d="M4 7h16M4 11h16M4 15h16" /><path d="M9 5v14M15 5v14" /></>),
  // star
  country: (<path d="M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.8 6.6 19.8l1.1-6.1L3.2 9.4l6.1-.8z" />),
  // two notes
  'r&b': (<><path d="M8 17V6l11-2v11" /><circle cx="6" cy="17" r="2" /><circle cx="17" cy="15" r="2" /><path d="M8 10l11-2" /></>),
  // sun
  reggae: (<><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></>),
  // banjo
  folk: (<><circle cx="9" cy="15" r="5" /><path d="M12.5 11.5L20 4" /><path d="M18 3l3 3" /></>),
  // wave
  blues: (<path d="M2 12c2-6 4-6 6 0s4 6 6 0 4-6 6 0" />),
  // lightning
  punk: (<path d="M13 2L4 14h7l-1 8 9-12h-7z" />),
  // flame
  metal: (<path d="M12 22c4 0 7-2.8 7-7 0-3-2-5-3.5-7-.4 2-1.5 3-3 3 .5-3-1-6-3.5-8-.5 3-4 5.500-4 11 0 4.200 3 8 7 8z" />),
  // masks
  indie: (<><path d="M4 5h10v7a5 5 0 01-10 0z" /><path d="M10 12h10v3a5 5 0 01-10 2" /></>),
  // sparkle
  alternative: (<path d="M12 3l1.8 5.2L19 10l-5.200 1.800L12 17l-1.800-5.200L5 10l5.200-1.800zM19 17l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />),
  // vinyl
  funk: (<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r=".6" fill="currentColor" /></>),
};

const GENRE_TINT: Record<string, string> = {
  pop: '#f472b6', rock: '#f87171', 'hip-hop': '#c084fc', electronic: '#22d3ee', jazz: '#fbbf24',
  classical: '#e7e5e4', country: '#fb923c', 'r&b': '#a78bfa', reggae: '#4ade80', folk: '#d6a35c',
  blues: '#60a5fa', punk: '#facc15', metal: '#ef4444', indie: '#2dd4bf', alternative: '#f0abfc', funk: '#fb7185',
};

export const genreKey = (genre: string): string => {
  const k = (genre || '').toLowerCase().trim().replace(/\s+/g, '-');
  return k in GENRE_PATHS ? k : 'pop';
};

export const GenreIcon: React.FC<IconProps & { genre: string; tint?: boolean }> = ({ genre, tint = true, ...p }) => {
  const k = genreKey(genre);
  return (
    <span style={tint ? { color: GENRE_TINT[k] } : undefined} className="inline-flex" data-genre-icon={k}>
      <Svg {...p}>{GENRE_PATHS[k]}</Svg>
    </span>
  );
};

export type StatIconName = 'energy' | 'combo' | 'bank' | 'mood' | 'goal' | 'chartUp' | 'unlock' | 'check' | 'cash' | 'creativity' | 'technical' | 'flame' | 'bulb' | 'sparkle' | 'phone' | 'note' | 'pad' | 'party' | 'users';

const STAT_PATHS: Record<StatIconName, React.ReactNode> = {
  energy: <path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="currentColor" />,
  combo: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  bank: (<><path d="M3 10l9-6 9 6" /><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8" /><path d="M3 21h18" /></>),
  mood: (<><circle cx="12" cy="12" r="9" /><path d="M8 14c1 1.500 2.500 2.200 4 2.200s3-.7 4-2.200" /><path d="M9 9.500h.01M15 9.500h.01" /></>),
  goal: (<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.200" fill="currentColor" /></>),
  chartUp: (<><path d="M3 17l6-6 4 4 8-9" /><path d="M15 6h6v6" /></>),
  unlock: (<><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 017.5-2" /></>),
  check: <path d="M5 12.500l4.500 4.500L19 7.500" />,
  cash: (<><rect x="2.500" y="6" width="19" height="12" rx="2" /><circle cx="12" cy="12" r="2.800" /><path d="M6 9.500v.01M18 14.500v.01" /></>),
  creativity: (<><path d="M12 3a9 9 0 100 18c1.500 0 2-1 1.500-2s0-2 1.500-2h2A3.500 3.500 0 0021 10.500C21 6.400 17 3 12 3z" /><path d="M7.500 11v.01M10 7.500v.01M14.500 7.500v.01" /></>),
  technical: (<><circle cx="12" cy="12" r="3" /><path d="M12 2.500v3M12 18.500v3M2.500 12h3M18.500 12h3M5.300 5.300l2.100 2.100M16.600 16.600l2.100 2.100M18.700 5.300l-2.100 2.100M7.400 16.600l-2.100 2.100" /></>),
  flame: <path d="M12 22c4 0 7-2.800 7-7 0-3-2-5-3.500-7-.4 2-1.500 3-3 3 .5-3-1-6-3.500-8-.5 3-4 5.500-4 11 0 4.200 3 8 7 8z" />,
  bulb: (<><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 00-3.500 10.900c.6.5 1 1.200 1 2.100h5c0-.9.4-1.600 1-2.100A6 6 0 0012 3z" /></>),
  sparkle: <path d="M12 3l1.800 5.200L19 10l-5.200 1.800L12 17l-1.800-5.200L5 10l5.200-1.800z" />,
  phone: (<><rect x="7" y="2.500" width="10" height="19" rx="2" /><path d="M11 18.500h2" /></>),
  note: (<><path d="M9 18V5l10-2v13" /><circle cx="6.500" cy="18" r="2.500" /><circle cx="16.500" cy="16" r="2.500" /></>),
  pad: (<><rect x="3" y="8" width="18" height="9" rx="4" /><path d="M8 11v3M6.500 12.500h3M15.500 11.500v.01M17.500 13.500v.01" /></>),
  party: (<><path d="M4 21l4-12 8 8z" /><path d="M14 4v2M19 9h2M17 6l1.500-1.500M10 3v.01" /></>),
  users: (<><circle cx="9" cy="8" r="3.500" /><path d="M2.500 20a6.500 6.500 0 0113 0" /><path d="M16 5a3.500 3.500 0 010 7M18 20a6.500 6.500 0 00-2-4.700" /></>),
};

export const StatIcon: React.FC<IconProps & { name: StatIconName }> = ({ name, ...p }) => (
  <Svg {...p}>{STAT_PATHS[name]}</Svg>
);
