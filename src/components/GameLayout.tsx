import React from 'react';
import { EraGrade } from './EraGrade';

interface GameLayoutProps {
  children: React.ReactNode;
  eraId?: string;
}

export const GameLayout: React.FC<GameLayoutProps> = ({ children, eraId }) => {
  return (
    <div className="h-[100dvh] w-full flex flex-col overflow-hidden bg-[#11151f] text-white relative game-layout">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {eraId && <EraGrade eraId={eraId} />}
      </div>
      {/* Content layer: header sits on top, game area fills the rest of the viewport */}
      <div className="relative z-10 flex flex-col flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
};
