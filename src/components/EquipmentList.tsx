
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GameState } from '@/types/game';
import { availableEquipment } from '@/data/equipment';

interface EquipmentListProps {
  purchaseEquipment: (equipmentId: string) => void;
  gameState: GameState;
}

export const EquipmentList: React.FC<EquipmentListProps> = ({
  purchaseEquipment,
  gameState
}) => {
  const unownedEquipment = availableEquipment.filter(
    equipment => !gameState.ownedEquipment.some(owned => owned.id === equipment.id)
  );

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-bold text-white mb-4">🛒 Equipment Shop</h3>
      
      {unownedEquipment.length === 0 ? (
        <Card className="p-4 bg-gray-800/50 border-gray-600 flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="text-2xl mb-2">✅</div>
            <p>All equipment purchased!</p>
          </div>
        </Card>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2">
          {unownedEquipment.map((equipment) => {
            const canAfford = gameState.money >= equipment.price;
            
            return (
              <Card key={equipment.id} className="p-3 bg-gray-800/50 border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{equipment.icon}</span>
                      <div>
                        <h4 className="font-semibold text-white text-sm">{equipment.name}</h4>
                        <p className="text-xs text-gray-400">{equipment.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-sm ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                      ${equipment.price}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => purchaseEquipment(equipment.id)}
                      disabled={!canAfford}
                      className="mt-1 text-xs"
                    >
                      Buy
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
