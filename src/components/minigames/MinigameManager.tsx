import React from 'react';
import RhythmMinigame from '../../minigames/rhythm/index';

interface MinigameManagerProps {
  activeMinigame: string | null;
  onFinish: (score: number) => void;
}

const MinigameManager: React.FC<MinigameManagerProps> = ({ activeMinigame, onFinish }) => {
  if (!activeMinigame) {
    return null;
  }

  const renderMinigame = () => {
    switch (activeMinigame) {
      case 'rhythm':
        return <RhythmMinigame onFinish={onFinish} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 99 }}>
      {renderMinigame()}
    </div>
  );
};

export default MinigameManager;
