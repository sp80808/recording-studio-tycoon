import React, { useEffect, useState } from 'react';
import { ERA_DEFINITIONS } from '@/utils/eraProgression';

interface EraTransitionAnimationProps {
  isVisible: boolean;
  fromEra: string;
  toEra: string;
  onComplete: () => void;
}

export const EraTransitionAnimation: React.FC<EraTransitionAnimationProps> = ({
  isVisible,
  fromEra,
  toEra,
  onComplete
}) => {
  const [currentPhase, setCurrentPhase] = useState<'sweep' | 'reveal' | 'complete'>('sweep');
  const [showContent, setShowContent] = useState(false);

  const fromEraData = ERA_DEFINITIONS.find(era => era.id === fromEra);
  const toEraData = ERA_DEFINITIONS.find(era => era.id === toEra);

  useEffect(() => {
    if (isVisible) {
      // Phase 1: Sweep transition
      const sweepTimer = setTimeout(() => {
        setCurrentPhase('reveal');
        setShowContent(true);
      }, 1000);

      // Phase 2: Content reveal
      const revealTimer = setTimeout(() => {
        setCurrentPhase('complete');
      }, 3000);

      // Phase 3: Complete and cleanup
      const completeTimer = setTimeout(() => {
        setShowContent(false);
        onComplete();
      }, 5000);

      return () => {
        clearTimeout(sweepTimer);
        clearTimeout(revealTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Background sweep */}
      <div 
        className={`absolute inset-0 bg-gradient-to-r ${toEraData?.colors.gradient || 'from-purple-900 to-blue-900'} 
                   ${currentPhase === 'sweep' ? 'animate-era-transition-sweep' : ''}`}
      />

      {/* Content overlay */}
      {showContent && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <div className="text-center space-y-8 animate-celebration-bounce">
            {/* Era icons */}
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center">
                <div className="text-6xl mb-2">{fromEraData?.icon}</div>
                <div className="text-lg text-gray-300">{fromEraData?.name}</div>
              </div>
              
              <div className="text-4xl animate-pulse">→</div>
              
              <div className="text-center">
                <div className="text-8xl mb-2 animate-equipment-unlock-reveal">{toEraData?.icon}</div>
                <div className="text-xl font-bold">{toEraData?.name}</div>
              </div>
            </div>

            {/* Era transition message */}
            <div className="space-y-4">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                ERA TRANSITION
              </h1>
              <p className="text-xl text-gray-200 max-w-2xl">
                {toEraData?.description}
              </p>
            </div>

            {/* New features unlock */}
            <div className="bg-black/40 rounded-lg p-6 max-w-3xl">
              <h3 className="text-2xl font-bold mb-4 text-yellow-400">✨ New Features Unlocked</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                {toEraData?.features?.map((feature, index) => (
                  <div 
                    key={index} 
                    className="flex items-center space-x-2 animate-smooth-slide-in"
                    style={{ animationDelay: `${index * 0.2}s` }}
                  >
                    <span className="text-green-400">✓</span>
                    <span>{feature}</span>
                  </div>
                )) || []}
              </div>
            </div>

            {/* Equipment availability */}
            <div className="text-center">
              <p className="text-lg text-gray-300">
                🎛️ New Equipment Available • 🎵 Genre Expansion • 📈 Market Changes
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Particle effects */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 30 }, (_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-yellow-400 animate-celebration-particle rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};
