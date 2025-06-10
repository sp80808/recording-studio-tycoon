import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GameState } from '@/types/game';
import { availableEquipment } from '@/data/equipment';
import { canPurchaseEquipment } from '@/utils/gameUtils';

interface EquipmentListProps {
  purchaseEquipment: (equipmentId: string) => void;
  gameState: GameState;
}

export const EquipmentList: React.FC<EquipmentListProps> = ({
  purchaseEquipment,
  gameState
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Equipment Shop</h2>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {availableEquipment
          .filter(equipment => {
            const purchaseCheck = canPurchaseEquipment(equipment, gameState);
            return purchaseCheck.canPurchase;
          })
          .map(equipment => {
            const isOwned = gameState.ownedEquipment.some(owned => owned.id === equipment.id);
            
            return (
              <Card key={equipment.id} className="p-4 bg-gray-800/50 border-gray-600">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{equipment.icon}</span>
                    <div>
                      <h4 className="font-bold text-white text-sm">{equipment.name}</h4>
                      <p className="text-xs text-gray-400">{equipment.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-bold">${equipment.price}</div>
                  </div>
                </div>
                
                <p className="text-xs text-gray-300 mt-2">{equipment.description}</p>
                
                {equipment.bonuses && (
                  <div className="text-xs text-gray-400 mt-2">
                    {equipment.bonuses.qualityBonus && (
                      <span className="text-blue-400">+{equipment.bonuses.qualityBonus}% Quality </span>
                    )}
                    {equipment.bonuses.creativityBonus && (
                      <span className="text-purple-400">+{equipment.bonuses.creativityBonus}% Creativity </span>
                    )}
                    {equipment.bonuses.technicalBonus && (
                      <span className="text-green-400">+{equipment.bonuses.technicalBonus}% Technical </span>
                    )}
                  </div>
                )}
                
                <Button
                  onClick={() => purchaseEquipment(equipment.id)}
                  disabled={gameState.playerData.money < equipment.price || isOwned}
                  size="sm"
                  className="w-full mt-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  {isOwned ? 'Owned' : 
                   gameState.playerData.money < equipment.price ? 'Cannot Afford' : 
                   `Buy $${equipment.price}`}
                </Button>
              </Card>
            );
          })}
      </div>
    </div>
  );
}; 