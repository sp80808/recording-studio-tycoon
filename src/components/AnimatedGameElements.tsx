
import React, { useEffect, useState } from 'react';
import { AnimatedCounter } from './AnimatedCounter';
import { FloatingRewardOrb } from './FloatingRewardOrb';

interface AnimatedGameElementsProps {
  gameState: any;
  children: React.ReactNode;
}

export const AnimatedGameElements: React.FC<AnimatedGameElementsProps> = ({
  gameState,
  children
}) => {
  const [floatingOrbs, setFloatingOrbs] = useState<Array<{
    id: string;
    type: 'xp' | 'money' | 'reputation';
    amount: number;
    x: number;
    y: number;
  }>>([]);

  const [backgroundParticles, setBackgroundParticles] = useState<Array<{
    id: string;
    x: number;
    y: number;
    size: number;
    speed: number;
    opacity: number;
  }>>([]);

  // Generate background particles
  useEffect(() => {
    const particles = Array.from({ length: 20 }, (_, i) => ({
      id: `particle-${i}`,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 0.5 + 0.1,
      opacity: Math.random() * 0.3 + 0.1
    }));
    setBackgroundParticles(particles);

    const interval = setInterval(() => {
      setBackgroundParticles(prev => 
        prev.map(particle => ({
          ...particle,
          y: particle.y + particle.speed,
          x: particle.x + Math.sin(Date.now() * 0.001 + particle.id.length) * 0.2
        })).filter(p => p.y < window.innerHeight)
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden">
      {/* Background Particles */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {backgroundParticles.map(particle => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-blue-400"
            style={{
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size,
              opacity: particle.opacity,
              animation: 'float 3s ease-in-out infinite'
            }}
          />
        ))}
      </div>

      {/* Floating Orbs */}
      {floatingOrbs.map(orb => (
        <FloatingRewardOrb
          key={orb.id}
          type={orb.type}
          amount={orb.amount}
          onComplete={() => {
            setFloatingOrbs(prev => prev.filter(o => o.id !== orb.id));
          }}
        />
      ))}

      {children}
    </div>
  );
};
