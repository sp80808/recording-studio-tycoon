import React from 'react';

interface GameLayoutProps {
  children: React.ReactNode;
}

const getBackgroundColorScheme = (): string => {
  // Always return the original default dark scheme
  return 'from-gray-900 via-blue-900 to-green-900';
};

export const GameLayout: React.FC<GameLayoutProps> = ({ children }) => {
  const backgroundClass = getBackgroundColorScheme();

  return (
    <div className={`min-h-screen bg-gradient-to-br ${backgroundClass} text-white relative overflow-hidden flex flex-col`}>
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
