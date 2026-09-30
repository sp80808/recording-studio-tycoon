import React from 'react';

/**
 * Original inline-SVG emblems for the four career eras — drawn, not sourced, so there is
 * no placeholder art and no licensing question. Each uses the era's signature light so a
 * player recognises the era on the selection screen *and* in the studio afterwards.
 */
export type EraEmblemId = 'analog60s' | 'digital80s' | 'internet2000s' | 'streaming2020s';

interface EmblemProps {
  size?: number;
  className?: string;
}

const Frame: React.FC<{ size: number; className?: string; children: React.ReactNode; title: string }> = ({
  size,
  className,
  children,
  title,
}) => (
  <svg
    viewBox="0 0 96 96"
    width={size}
    height={size}
    className={className}
    role="img"
    aria-label={title}
    xmlns="http://www.w3.org/2000/svg"
  >
    {children}
  </svg>
);

/** 60s — a reel-to-reel deck: two brass reels and a tape path. */
const AnalogEmblem: React.FC<EmblemProps> = ({ size = 96, className }) => (
  <Frame size={size} className={className} title="Reel-to-reel tape deck">
    <defs>
      <radialGradient id="an-glow" cx="50%" cy="50%" r="60%">
        <stop offset="0" stopColor="#ffc266" stopOpacity="0.35" />
        <stop offset="1" stopColor="#ffc266" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="48" cy="48" r="46" fill="url(#an-glow)" />
    <rect x="8" y="18" width="80" height="60" rx="8" fill="#2a1c10" stroke="#e6b866" strokeOpacity="0.55" />
    {[30, 66].map((cx) => (
      <g key={cx}>
        <circle cx={cx} cy="42" r="15" fill="#171008" stroke="#e6b866" strokeWidth="2" />
        <circle cx={cx} cy="42" r="4.5" fill="#e6b866" />
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <line key={a} x1={cx} y1="42" x2={cx + 11 * Math.cos((a * Math.PI) / 180)} y2={42 + 11 * Math.sin((a * Math.PI) / 180)} stroke="#e6b866" strokeOpacity="0.6" strokeWidth="1.4" />
        ))}
      </g>
    ))}
    <path d="M30 57 Q48 72 66 57" fill="none" stroke="#9a6a2c" strokeWidth="2" />
    <rect x="22" y="66" width="52" height="6" rx="2" fill="#171008" />
    <circle cx="28" cy="69" r="1.8" fill="#ff6a3c" />
  </Frame>
);

/** 80s — a neon horizon: banded sun over a perspective grid. */
const DigitalEmblem: React.FC<EmblemProps> = ({ size = 96, className }) => (
  <Frame size={size} className={className} title="Neon sunset over a synth grid">
    <defs>
      <linearGradient id="dg-sun" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ff4fd8" />
        <stop offset="1" stopColor="#ffb15c" />
      </linearGradient>
      <clipPath id="dg-clip"><rect x="8" y="10" width="80" height="76" rx="8" /></clipPath>
    </defs>
    <g clipPath="url(#dg-clip)">
      <rect x="8" y="10" width="80" height="76" fill="#1a1029" />
      <circle cx="48" cy="52" r="24" fill="url(#dg-sun)" />
      {[46, 52, 57, 61, 64].map((y, i) => (
        <rect key={y} x="20" y={y} width="56" height={1.5 + i * 0.7} fill="#1a1029" />
      ))}
      <rect x="8" y="60" width="80" height="26" fill="#120a1f" />
      {[-30, -18, -8, 0, 8, 18, 30].map((dx) => (
        <line key={dx} x1={48 + dx * 0.25} y1="60" x2={48 + dx * 2.2} y2="86" stroke="#4fd8ff" strokeOpacity="0.75" strokeWidth="1" />
      ))}
      {[64, 69, 75, 82].map((y) => (
        <line key={y} x1="8" y1={y} x2="88" y2={y} stroke="#4fd8ff" strokeOpacity="0.55" strokeWidth="1" />
      ))}
    </g>
    <rect x="8" y="10" width="80" height="76" rx="8" fill="none" stroke="#ff4fd8" strokeOpacity="0.65" />
  </Frame>
);

/** 2000s — a burnable disc with a light sweep and a waveform. */
const MillenniumEmblem: React.FC<EmblemProps> = ({ size = 96, className }) => (
  <Frame size={size} className={className} title="Compact disc">
    <defs>
      <linearGradient id="ms-sweep" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#7ad9ff" stopOpacity="0.7" />
        <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.05" />
        <stop offset="1" stopColor="#ff7a45" stopOpacity="0.7" />
      </linearGradient>
    </defs>
    <circle cx="48" cy="48" r="40" fill="#c9d3d8" />
    <circle cx="48" cy="48" r="40" fill="url(#ms-sweep)" />
    <circle cx="48" cy="48" r="40" fill="none" stroke="#5c6b73" strokeWidth="1.5" />
    <circle cx="48" cy="48" r="30" fill="none" stroke="#5c6b73" strokeOpacity="0.5" />
    <circle cx="48" cy="48" r="20" fill="none" stroke="#5c6b73" strokeOpacity="0.4" />
    <circle cx="48" cy="48" r="9" fill="#14181a" />
    <circle cx="48" cy="48" r="4" fill="#c9d3d8" />
    <path d="M14 50 L24 50 L28 40 L33 60 L38 34 L44 64 L50 44 L55 54 L60 48 L82 48" fill="none" stroke="#14181a" strokeOpacity="0.8" strokeWidth="1.8" strokeLinejoin="round" />
  </Frame>
);

/** 2020s — a phone-shaped stream with an equalizer and a play mark. */
const StreamingEmblem: React.FC<EmblemProps> = ({ size = 96, className }) => (
  <Frame size={size} className={className} title="Streaming playlist on a phone">
    <defs>
      <linearGradient id="st-play" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#7bf0c8" />
        <stop offset="1" stopColor="#a78bfa" />
      </linearGradient>
    </defs>
    <rect x="26" y="6" width="44" height="84" rx="9" fill="#101a17" stroke="#7bf0c8" strokeOpacity="0.6" strokeWidth="1.6" />
    <rect x="31" y="14" width="34" height="34" rx="6" fill="url(#st-play)" opacity="0.9" />
    <path d="M42 24 L42 38 L54 31 Z" fill="#0b1512" />
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <rect key={i} x={32 + i * 6} y={70 - [10, 20, 14, 26, 18, 8][i]} width="3.6" height={[10, 20, 14, 26, 18, 8][i]} rx="1.4" fill="#7bf0c8" opacity={0.55 + i * 0.07} />
    ))}
    <rect x="34" y="54" width="28" height="3" rx="1.5" fill="#7bf0c8" opacity="0.35" />
    <rect x="34" y="54" width="14" height="3" rx="1.5" fill="#7bf0c8" />
    <circle cx="48" cy="84" r="2.4" fill="#7bf0c8" opacity="0.5" />
  </Frame>
);

const EMBLEMS: Record<EraEmblemId, React.FC<EmblemProps>> = {
  analog60s: AnalogEmblem,
  digital80s: DigitalEmblem,
  internet2000s: MillenniumEmblem,
  streaming2020s: StreamingEmblem,
};

export const EraEmblem: React.FC<EmblemProps & { era: EraEmblemId }> = ({ era, ...props }) => {
  const Emblem = EMBLEMS[era] ?? AnalogEmblem;
  return <Emblem {...props} />;
};
