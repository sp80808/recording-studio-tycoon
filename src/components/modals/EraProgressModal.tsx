import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GameState } from '@/types/game';

interface EraProgressModalProps {
  gameState: GameState;
  isOpen: boolean;
  onClose: () => void;
  triggerEraTransition: () => void;
}

export const EraProgressModal: React.FC<EraProgressModalProps> = ({ gameState, isOpen, onClose, triggerEraTransition }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md bg-gray-900 border-gray-600 p-6 m-4">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-white">Era Progress</h2>
        </div>
        {/* Era Progress Details Here */}
        <p className="text-gray-300">Current Era: {gameState.selectedEra}</p>
        <Button onClick={onClose}>Close</Button>
      </Card>
    </div>
  );
};
