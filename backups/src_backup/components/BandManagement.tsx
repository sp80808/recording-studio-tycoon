import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GameState } from '@/types/game';

interface BandManagementProps {
  gameState: GameState;
  onCreateBand: (name: string, genre: string) => void;
  onStartTour: (bandId: string) => void;
  onCreateOriginalTrack: (bandId: string) => void;
}

export const BandManagement: React.FC<BandManagementProps> = ({
  gameState,
  onCreateBand,
  onStartTour,
  onCreateOriginalTrack
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Band Management</h2>
      
      {/* Band List */}
      <div className="space-y-2">
        {gameState.bands.map(band => (
          <Card key={band.id} className="p-4 bg-gray-800/50 border-gray-600">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white">{band.name}</h3>
                <p className="text-sm text-gray-400">{band.genre}</p>
              </div>
              <div className="space-x-2">
                <Button
                  onClick={() => onStartTour(band.id)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Start Tour
                </Button>
                <Button
                  onClick={() => onCreateOriginalTrack(band.id)}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  Create Track
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create New Band */}
      <Button
        onClick={() => onCreateBand('New Band', 'Rock')}
        className="w-full bg-purple-600 hover:bg-purple-700"
      >
        Create New Band
      </Button>
    </div>
  );
}; 