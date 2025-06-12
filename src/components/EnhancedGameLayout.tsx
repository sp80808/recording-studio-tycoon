
import React from 'react';
import { InteractiveBackground } from './InteractiveBackground';
import { AnimatedGameElements } from './AnimatedGameElements';
import { EnhancedAnimationStyles } from './EnhancedAnimationStyles';
import { OrbAnimationStyles } from './OrbAnimationStyles';

interface EnhancedGameLayoutProps {
  children: React.ReactNode;
  gameState?: any;
  theme?: 'studio' | 'vintage' | 'modern';
}

export const EnhancedGameLayout: React.FC<EnhancedGameLayoutProps> = ({
  children,
  gameState,
  theme = 'studio'
}) => {
  return (
    <>
      <EnhancedAnimationStyles />
      <OrbAnimationStyles />
      <InteractiveBackground theme={theme}>
        <AnimatedGameElements gameState={gameState}>
          <div className="min-h-screen bg-gradient-to-br from-gray-900/95 via-purple-900/95 to-blue-900/95">
            {children}
          </div>
        </AnimatedGameElements>
      </InteractiveBackground>
    </>
  );
};
