import React from 'react';
import { GameState } from '@/types/game';

interface ChartsPanelProps {
  gameState: GameState;
  onContactArtist: (artistId: string, offer: number) => void;
}

export const ChartsPanel_enhanced: React.FC<ChartsPanelProps> = ({ gameState, onContactArtist }) => {
  const handleContactArtist = () => {
    // Example usage:
    onContactArtist("artist123", 500);
  };

  return (
    <div>
      ChartsPanel Enhanced
      <button onClick={handleContactArtist}>Contact Artist</button>
    </div>
  );
};
