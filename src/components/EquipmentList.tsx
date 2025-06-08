
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GameState } from '@/types/game';
import { getAvailableEquipmentForYear, getEraAdjustedPrice, EraAvailableEquipment } from '@/data/eraEquipment';

interface EquipmentListProps {
  purchaseEquipment: (equipmentId: string) => void;
  gameState: GameState;
}

export const EquipmentList: React.FC<EquipmentListProps> = ({
  purchaseEquipment,
  gameState
}) => {
  // Get equipment available for current era/year
  const availableEquipment = getAvailableEquipmentForYear(gameState.currentYear || 2024);
  
  // Filter equipment by ownership and requirements
  const unownedEquipment = availableEquipment.filter(equipment => {
    // Already owned check
    if (gameState.ownedEquipment.some(owned => owned.id === equipment.id)) {
      return false;
    }
    
    // Skill requirement check - but be more lenient for historical progression
    if (equipment.skillRequirement) {
      const skill = gameState.studioSkills[equipment.skillRequirement.skill];
      if (!skill || skill.level < equipment.skillRequirement.level) {
        // For historical eras (before 2000), allow basic equipment even if skill level isn't met
        // This ensures players can always progress
        const isHistoricalEra = (gameState.currentYear || 2024) < 2000;
        const isBasicEquipment = equipment.skillRequirement.level <= 2;
        
        if (!(isHistoricalEra && isBasicEquipment)) {
          return false;
        }
      }
    }
    
    return true;
  });

  const getAdjustedPrice = (equipment: EraAvailableEquipment) => {
    return getEraAdjustedPrice(equipment, gameState.currentYear || 2024, gameState.equipmentMultiplier || 1.0);
  };

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
            const adjustedPrice = getAdjustedPrice(equipment);
            const canAfford = gameState.money >= adjustedPrice;
            const isVintage = equipment.isVintage && (gameState.currentYear || 2024) > (equipment.availableUntil || equipment.availableFrom + 20);
            
            return (
              <Card key={equipment.id} className="p-3 bg-gray-800/50 border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{equipment.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-white text-sm">{equipment.name}</h4>
                          {isVintage && (
                            <span className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded">
                              VINTAGE
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          {equipment.eraDescription || equipment.description}
                        </p>
                        {equipment.skillRequirement && (
                          <div className="text-xs text-blue-400 mt-1">
                            📈 Requires {equipment.skillRequirement.skill} Level {equipment.skillRequirement.level}
                          </div>
                        )}
                        {equipment.historicalPrice && isVintage && (
                          <div className="text-xs text-yellow-400 mt-1">
                            💰 Originally ${equipment.historicalPrice} 
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-sm ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                      ${adjustedPrice.toLocaleString()}
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
