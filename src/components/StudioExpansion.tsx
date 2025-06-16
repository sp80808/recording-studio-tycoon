import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GameState } from '@/types/game';
import { toast } from '@/hooks/use-toast';

interface StudioExpansionProps {
  gameState: GameState;
  onPurchaseExpansion: (expansionId: string) => void;
}

export const StudioExpansion: React.FC<StudioExpansionProps> = ({
  gameState,
  onPurchaseExpansion
}) => {
  const availableExpansions = [
    {
      id: 'control_room',
      name: 'Control Room',
      description: 'Add a professional control room for better mixing and mastering',
      cost: 50000,
      requirements: {
        level: 5,
        reputation: 50
      },
      benefits: {
        mixingQuality: 1.2,
        masteringQuality: 1.2
      }
    },
    {
      id: 'live_room',
      name: 'Live Room',
      description: 'Add a spacious live room for full band recordings',
      cost: 75000,
      requirements: {
        level: 7,
        reputation: 75
      },
      benefits: {
        recordingCapacity: 8,
        acousticQuality: 1.3
      }
    },
    {
      id: 'isolation_booth',
      name: 'Isolation Booth',
      description: 'Add an isolation booth for vocal and instrument recording',
      cost: 30000,
      requirements: {
        level: 3,
        reputation: 25
      },
      benefits: {
        vocalQuality: 1.2,
        isolationQuality: 1.3
      }
    },
    {
      id: 'lounge',
      name: 'Artist Lounge',
      description: 'Add a comfortable lounge for artists to relax and prepare',
      cost: 25000,
      requirements: {
        level: 4,
        reputation: 30
      },
      benefits: {
        artistMood: 1.2,
        preparationQuality: 1.2
      }
    }
  ];

  const canPurchaseExpansion = (expansion: typeof availableExpansions[0]) => {
    return (
      gameState.money >= expansion.cost &&
      gameState.playerData.level >= expansion.requirements.level &&
      gameState.reputation >= expansion.requirements.reputation &&
      !gameState.ownedUpgrades.includes(expansion.id)
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">🏢 Studio Expansion</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableExpansions.map(expansion => {
          const canPurchase = canPurchaseExpansion(expansion);
          const isOwned = gameState.ownedUpgrades.includes(expansion.id);

          return (
            <Card
              key={expansion.id}
              className={`p-4 ${
                isOwned
                  ? 'bg-green-900/50 border-green-500'
                  : 'bg-gray-800/50 border-gray-600'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-white">{expansion.name}</h3>
                  <p className="text-sm text-gray-400">{expansion.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-yellow-400">${expansion.cost.toLocaleString()}</div>
                </div>
              </div>

              <div className="mb-3">
                <h4 className="text-sm font-semibold text-gray-300 mb-1">Requirements:</h4>
                <div className="text-xs text-gray-400">
                  <div>Level {expansion.requirements.level}</div>
                  <div>Reputation {expansion.requirements.reputation}</div>
                </div>
              </div>

              <div className="mb-3">
                <h4 className="text-sm font-semibold text-gray-300 mb-1">Benefits:</h4>
                <div className="text-xs text-gray-400">
                  {Object.entries(expansion.benefits).map(([key, value]) => (
                    <div key={key}>
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: +{((value - 1) * 100).toFixed(0)}%
                    </div>
                  ))}
                </div>
              </div>

              {isOwned ? (
                <div className="text-center text-green-400 text-sm">✓ Owned</div>
              ) : (
                <Button
                  onClick={() => onPurchaseExpansion(expansion.id)}
                  disabled={!canPurchase}
                  className={`w-full ${
                    canPurchase
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-gray-600 cursor-not-allowed'
                  }`}
                >
                  {canPurchase ? 'Purchase' : 'Requirements Not Met'}
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}; 