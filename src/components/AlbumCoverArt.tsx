import React, { useState } from 'react';
import { Disc3, Music2, Sparkles, Flame, Radio, Zap, Volume2, Award } from 'lucide-react';

interface AlbumCoverArtProps {
  title: string;
  genre?: string;
  artist?: string;
  score?: number;
  imageUrl?: string | null;
  className?: string;
  showVinylPeek?: boolean;
}

interface GenreTheme {
  bgGradient: string;
  accentColor: string;
  glowColor: string;
  secondaryColor: string;
  icon: React.ReactNode;
  tagline: string;
  patternType: 'grid' | 'radial' | 'flame' | 'bars' | 'rings' | 'waves';
}

export const AlbumCoverArt: React.FC<AlbumCoverArtProps> = ({
  title,
  genre = 'Pop',
  artist = 'Studio Tycoon Session',
  score,
  imageUrl,
  className = '',
  showVinylPeek = true,
}) => {
  const [imageError, setImageError] = useState(false);
  const isImageValid = imageUrl && !imageError && imageUrl !== '/placeholder.svg' && !imageUrl.includes('placeholder.svg');

  // Genre specific aesthetic mapping
  const getGenreTheme = (g: string): GenreTheme => {
    const normalized = (g || '').toLowerCase();
    if (normalized.includes('rock') || normalized.includes('metal') || normalized.includes('punk')) {
      return {
        bgGradient: 'from-zinc-950 via-red-950 to-neutral-900',
        accentColor: 'text-red-400',
        glowColor: 'rgba(239, 68, 68, 0.35)',
        secondaryColor: 'from-red-600 to-amber-600',
        icon: <Flame className="w-8 h-8 text-orange-400 animate-pulse" />,
        tagline: 'HIGH VOLTAGE ANALOG',
        patternType: 'flame',
      };
    }
    if (normalized.includes('electronic') || normalized.includes('techno') || normalized.includes('synth') || normalized.includes('edm')) {
      return {
        bgGradient: 'from-slate-950 via-purple-950 to-cyan-950',
        accentColor: 'text-cyan-400',
        glowColor: 'rgba(6, 182, 212, 0.4)',
        secondaryColor: 'from-cyan-400 via-fuchsia-500 to-indigo-500',
        icon: <Zap className="w-8 h-8 text-cyan-300" />,
        tagline: 'SYNTHESIS & MODULATION',
        patternType: 'grid',
      };
    }
    if (normalized.includes('hip-hop') || normalized.includes('rap') || normalized.includes('trap')) {
      return {
        bgGradient: 'from-black via-zinc-900 to-amber-950',
        accentColor: 'text-amber-300',
        glowColor: 'rgba(245, 158, 11, 0.4)',
        secondaryColor: 'from-amber-300 to-yellow-600',
        icon: <Volume2 className="w-8 h-8 text-amber-300" />,
        tagline: 'PLATINUM HEAVY BASS',
        patternType: 'bars',
      };
    }
    if (normalized.includes('jazz') || normalized.includes('blues')) {
      return {
        bgGradient: 'from-slate-950 via-blue-950 to-indigo-950',
        accentColor: 'text-amber-200',
        glowColor: 'rgba(217, 119, 6, 0.35)',
        secondaryColor: 'from-amber-200 to-blue-400',
        icon: <Radio className="w-8 h-8 text-amber-300" />,
        tagline: 'MIDNIGHT IMPROVISATION',
        patternType: 'rings',
      };
    }
    if (normalized.includes('acoustic') || normalized.includes('folk') || normalized.includes('country')) {
      return {
        bgGradient: 'from-stone-950 via-amber-950 to-emerald-950',
        accentColor: 'text-emerald-300',
        glowColor: 'rgba(16, 185, 129, 0.3)',
        secondaryColor: 'from-amber-400 to-emerald-500',
        icon: <Music2 className="w-8 h-8 text-emerald-300" />,
        tagline: 'WARM WOOD & STRINGS',
        patternType: 'waves',
      };
    }
    // Default Pop / General
    return {
      bgGradient: 'from-indigo-950 via-purple-950 to-slate-950',
      accentColor: 'text-pink-300',
      glowColor: 'rgba(236, 72, 153, 0.35)',
      secondaryColor: 'from-pink-500 via-purple-500 to-sky-400',
      icon: <Sparkles className="w-8 h-8 text-pink-300" />,
      tagline: 'STUDIO MASTER POP',
      patternType: 'radial',
    };
  };

  const theme = getGenreTheme(genre);

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
      {/* Vinyl Disc peeking out from behind cover */}
      {showVinylPeek && (
        <div
          aria-hidden="true"
          className="absolute -right-7 sm:-right-9 top-1/2 -translate-y-1/2 w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-slate-950 border-4 border-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-0 transition-transform duration-500 ease-out group-hover:translate-x-3 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, #020617 0%, #0f172a 24%, #1e293b 25%, #020617 26%, #0f172a 48%, #1e293b 49%, #020617 50%, #0f172a 74%, #1e293b 75%, #020617 76%, #0f172a 96%, #334155 98%, #020617 100%)`
          }}
        >
          {/* Vinyl label in center */}
          <div className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-600 to-amber-300 border-2 border-amber-200 flex flex-col items-center justify-center p-1 text-center shadow-inner">
            <span className="text-[7px] font-black tracking-widest text-slate-950 uppercase leading-none">RST</span>
            <span className="text-[6px] font-bold text-slate-900 tracking-tighter">33⅓ RPM</span>
            <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-amber-100 my-0.5" />
            <span className="text-[5px] font-semibold text-slate-950 tracking-tighter truncate max-w-[50px]">{genre}</span>
          </div>
          {/* Vinyl light sheen */}
          <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(255,255,255,0.12)_45deg,transparent_90deg,transparent_180deg,rgba(255,255,255,0.12)_225deg,transparent_270deg)] pointer-events-none" />
        </div>
      )}

      {/* Main Square Album Jacket */}
      <div 
        className="relative z-10 w-56 h-56 sm:w-64 sm:h-64 rounded-xl overflow-hidden shadow-2xl border border-slate-700/80 bg-slate-950 flex flex-col justify-between p-4 group"
        style={{
          boxShadow: `0 20px 40px -15px ${theme.glowColor}, 0 0 0 1px rgba(255,255,255,0.1) inset`
        }}
      >
        {isImageValid ? (
          <img
            src={imageUrl}
            alt={title}
            onError={() => setImageError(true)}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          /* Procedural Genre Artwork */
          <div className={`absolute inset-0 bg-gradient-to-br ${theme.bgGradient} overflow-hidden pointer-events-none`}>
            {/* Background geometric design based on pattern type */}
            {theme.patternType === 'grid' && (
              <div 
                className="absolute inset-0 opacity-25"
                style={{
                  backgroundImage: `linear-gradient(rgba(6, 182, 212, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.4) 1px, transparent 1px)`,
                  backgroundSize: '20px 20px',
                  transform: 'perspective(200px) rotateX(45deg) translateY(20%)'
                }}
              />
            )}

            {theme.patternType === 'rings' && (
              <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full border border-amber-400/20 opacity-40">
                <div className="absolute inset-4 rounded-full border border-amber-400/25" />
                <div className="absolute inset-10 rounded-full border border-amber-400/30" />
                <div className="absolute inset-16 rounded-full border border-amber-400/40" />
              </div>
            )}

            {theme.patternType === 'bars' && (
              <div className="absolute inset-x-0 bottom-0 h-32 flex items-end justify-around px-4 opacity-30">
                {[60, 90, 45, 100, 75, 85, 30, 95, 65, 80, 50, 90].map((h, i) => (
                  <div
                    key={i}
                    className="w-2.5 rounded-t bg-gradient-to-t from-amber-500 to-yellow-300"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            )}

            {theme.patternType === 'flame' && (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(239,68,68,0.5),rgba(249,115,22,0.2),transparent_70%)]" />
            )}

            {theme.patternType === 'radial' && (
              <div className="absolute -inset-10 bg-[radial-gradient(circle_at_30%_30%,rgba(236,72,153,0.35),rgba(147,51,234,0.2),transparent_65%)]" />
            )}

            {theme.patternType === 'waves' && (
              <div className="absolute inset-0 opacity-25">
                <svg viewBox="0 0 100 100" className="w-full h-full stroke-emerald-400/50 fill-none" preserveAspectRatio="none">
                  <path d="M0,30 Q25,10 50,30 T100,30" strokeWidth="1" />
                  <path d="M0,50 Q25,30 50,50 T100,50" strokeWidth="1.5" />
                  <path d="M0,70 Q25,50 50,70 T100,70" strokeWidth="1" />
                </svg>
              </div>
            )}

            {/* Subtle center graphic */}
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
              <div className="w-32 h-32 rounded-full border-2 border-white/20 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border border-white/10 flex items-center justify-center">
                  <Disc3 className="w-16 h-16 text-white/40" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Header: Genre Tag & Stereo Badge */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md border border-white/15 text-slate-200">
            {theme.icon}
            {genre}
          </span>

          <span className="text-[9px] font-mono font-bold tracking-widest text-slate-400 bg-black/50 px-1.5 py-0.5 rounded border border-white/10 backdrop-blur-sm">
            STEREO 33⅓
          </span>
        </div>

        {/* Center / Bottom Info */}
        <div className="relative z-10 mt-auto pt-4 text-left">
          <p className="text-[10px] font-mono tracking-widest uppercase text-slate-400 font-semibold mb-0.5">
            {theme.tagline}
          </p>

          <h3 className="text-lg sm:text-xl font-black text-white leading-tight tracking-tight drop-shadow-md line-clamp-2">
            {title}
          </h3>

          <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/10">
            <span className="text-xs text-slate-300 font-medium truncate max-w-[130px]">
              {artist}
            </span>

            {typeof score === 'number' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold">
                <Award className="w-3 h-3 text-amber-400" />
                {score}/100
              </span>
            )}
          </div>
        </div>

        {/* Glossy Diagonal Sleeve Sheen */}
        <div 
          aria-hidden="true" 
          className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.07] to-transparent pointer-events-none" 
        />

        {/* Studio Authenticity Badge in Bottom Right corner */}
        <div 
          aria-hidden="true" 
          className="absolute right-2 bottom-2 w-8 h-8 rounded-full border border-amber-300/30 bg-black/40 flex items-center justify-center opacity-60 pointer-events-none"
        >
          <span className="text-[6px] font-black tracking-tighter text-amber-300">RST</span>
        </div>
      </div>
    </div>
  );
};
