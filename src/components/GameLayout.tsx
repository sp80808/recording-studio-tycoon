import React from 'react';
import { EraGrade } from './EraGrade';
import { StudioAmbientBackdrop } from './cutscenes/StudioAmbientBackdrop';

interface GameLayoutProps {
  children: React.ReactNode;
  eraId?: string;
}

export const GameLayout: React.FC<GameLayoutProps> = ({ children, eraId }) => {
  return (
    <div className="h-[100dvh] w-full flex flex-col overflow-hidden bg-[#0c1017] text-white relative game-layout">
      {/* Studio texture and atmosphere layers */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {eraId && <EraGrade eraId={eraId} />}
        {eraId && <StudioAmbientBackdrop eraId={eraId} />}
        {/* Analog hardware noise/grain texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.035] mix-blend-screen pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
          aria-hidden="true"
        />
        {/* Studio vignette edge falloff */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, transparent 40%, rgba(5, 8, 14, 0.75) 100%)',
          }}
          aria-hidden="true"
        />
      </div>
      {/* Content layer: header sits on top, game area fills the rest of the viewport */}
      <div className="relative z-10 flex flex-col flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
};
