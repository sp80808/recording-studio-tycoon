
import React from 'react';

interface GameLayoutProps {
  children: React.ReactNode;
  currentDay?: number; // Make optional for now, will be passed from Index.tsx
}

const getBackgroundColorScheme = (day?: number): string => {
  if (typeof day !== 'number') {
    return 'from-gray-900 via-blue-900 to-green-900'; // Default
  }
  const phase = day % 4; // Cycle through 4 phases

  switch (phase) {
    case 0: // Night
      return 'from-gray-900 via-indigo-900 to-purple-900';
    case 1: // Dawn
      return 'from-purple-800 via-pink-700 to-orange-600';
    case 2: // Day
      return 'from-sky-600 via-cyan-500 to-teal-400';
    case 3: // Dusk
      return 'from-orange-700 via-red-800 to-rose-900';
    default:
      return 'from-gray-900 via-blue-900 to-green-900';
  }
};

export const GameLayout: React.FC<GameLayoutProps> = ({ children, currentDay }) => {
  const backgroundClass = getBackgroundColorScheme(currentDay);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${backgroundClass} text-white relative overflow-hidden transition-all duration-1000 ease-in-out`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500/10 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-20 w-24 h-24 bg-blue-500/10 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-20 h-20 bg-green-500/10 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      {children}
    </div>
  );
};
