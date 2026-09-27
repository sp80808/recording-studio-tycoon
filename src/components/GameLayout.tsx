import React from 'react';
import { EraGrade } from './EraGrade';

interface GameLayoutProps {
  children: React.ReactNode;
  eraId?: string;
}

export const GameLayout: React.FC<GameLayoutProps> = ({ children, eraId }) => {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-green-900 text-white relative game-layout animate-dolly-in">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500/10 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-20 w-24 h-24 bg-blue-500/10 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-20 h-20 bg-green-500/10 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        {eraId && <EraGrade eraId={eraId} />}
      </div>
      {/* Content layer: header sits on top, game area fills the rest of the viewport */}
      <div className="relative z-10 flex flex-col flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
};
