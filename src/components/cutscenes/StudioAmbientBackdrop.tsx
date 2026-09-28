import React, { useEffect, useState } from 'react';
import './ambient.css';

interface StudioAmbientBackdropProps {
  eraId?: string;
  className?: string;
}

export const StudioAmbientBackdrop: React.FC<StudioAmbientBackdropProps> = ({
  eraId = 'analog60s',
  className = '',
}) => {
  const [isTabVisible, setIsTabVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => setIsTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const isAnalog = eraId.includes('analog') || eraId.includes('60') || eraId.includes('70');
  const isDigital = eraId.includes('digital') || eraId.includes('80') || eraId.includes('90');

  return (
    <div
      className={`ambient-container pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      {/* Era Atmosphere Base Gradient */}
      {isAnalog && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_20%,rgba(180,83,9,0.18),transparent_80%)]" />
          {/* Glowing Vacuum Tube Pair */}
          <div className="ambient-tube-warmth absolute top-12 left-16 flex gap-6 opacity-40">
            <div className="w-6 h-14 rounded-t-full border border-amber-500/40 bg-gradient-to-t from-amber-600/40 via-yellow-500/20 to-transparent shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
            <div className="w-6 h-14 rounded-t-full border border-amber-500/40 bg-gradient-to-t from-amber-600/40 via-yellow-500/20 to-transparent shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
          </div>
          {/* Twin Reel-to-Reel Tape Deck Silhouette */}
          {isTabVisible && (
            <div className="absolute top-10 right-14 flex items-center gap-6 opacity-25">
              <div className="ambient-reel-spinning w-24 h-24 rounded-full border-2 border-amber-300/40 flex items-center justify-center relative">
                <div className="w-8 h-8 rounded-full border border-amber-300/60 bg-slate-900" />
                <div className="absolute w-full h-0.5 bg-amber-300/30" />
                <div className="absolute h-full w-0.5 bg-amber-300/30" />
              </div>
              <div className="ambient-reel-spinning w-24 h-24 rounded-full border-2 border-amber-300/40 flex items-center justify-center relative" style={{ animationDirection: 'reverse' }}>
                <div className="w-8 h-8 rounded-full border border-amber-300/60 bg-slate-900" />
                <div className="absolute w-full h-0.5 bg-amber-300/30" />
                <div className="absolute h-full w-0.5 bg-amber-300/30" />
              </div>
            </div>
          )}
        </>
      )}

      {isDigital && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_20%,rgba(6,182,212,0.15),transparent_80%)]" />
          {/* Neon 80s/90s Rack LED meters */}
          <div className="ambient-led-pulse absolute top-12 right-16 flex gap-1.5 opacity-40">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-12 rounded-sm bg-gradient-to-t from-emerald-500 via-yellow-400 to-rose-500"
                style={{ opacity: 0.3 + (i % 3) * 0.25 }}
              />
            ))}
          </div>
        </>
      )}

      {!isAnalog && !isDigital && (
        <>
          {/* Modern DAW Spectral Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_20%,rgba(99,102,241,0.12),transparent_80%)]" />
          <div className="absolute top-10 right-16 flex items-end gap-1 opacity-25">
            {[30, 60, 45, 80, 55, 90, 70, 40, 85, 65, 50, 75].map((h, i) => (
              <div
                key={i}
                className="w-1.5 rounded-t bg-indigo-400/80 transition-all duration-300"
                style={{ height: `${h * 0.4}px` }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default StudioAmbientBackdrop;
