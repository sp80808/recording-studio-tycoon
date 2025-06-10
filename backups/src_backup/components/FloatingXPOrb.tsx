import React, { useEffect, useRef } from 'react';

interface FloatingXPOrbProps {
  amount: number;
  type: 'xp' | 'money' | 'skill';
  onComplete?: () => void;
}

export const FloatingXPOrb: React.FC<FloatingXPOrbProps> = ({
  amount,
  type,
  onComplete
}) => {
  const orbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!orbRef.current) return;

    const orb = orbRef.current;
    
    // Start animation
    setTimeout(() => {
      orb.style.transform = 'translateY(-60px) scale(1.2)';
      orb.style.opacity = '0';
    }, 100);

    // Cleanup
    const timer = setTimeout(() => {
      onComplete?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const getOrbStyle = () => {
    switch (type) {
      case 'xp':
        return 'bg-gradient-to-r from-purple-500 to-blue-500 text-white';
      case 'money':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      case 'skill':
        return 'bg-gradient-to-r from-orange-500 to-red-500 text-white';
      default:
        return 'bg-gradient-to-r from-purple-500 to-blue-500 text-white';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'xp': return '⭐';
      case 'money': return '💰';
      case 'skill': return '🎵';
      default: return '⭐';
    }
  };

  return (
    <div
      ref={orbRef}
      className={`floating-xp-orb absolute pointer-events-none z-50 
                  w-16 h-16 rounded-full flex items-center justify-center
                  transition-all duration-2000 ease-out shadow-lg
                  ${getOrbStyle()}`}
      style={{
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="flex flex-col items-center">
        <span className="text-lg">{getIcon()}</span>
        <span className="text-xs font-bold">+{amount}</span>
      </div>
    </div>
  );
}; 