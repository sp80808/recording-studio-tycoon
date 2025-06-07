
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { GameState, PlayerAttributes } from '@/types/game';
import { XPProgressBar } from '@/components/XPProgressBar';
import { SkillProgressDisplay } from '@/components/SkillProgressDisplay';
import { AttributesModal } from '@/components/modals/AttributesModal';
import { StudioModal } from '@/components/modals/StudioModal';
import { ArrowUp, Zap, ShoppingCart, Clock } from 'lucide-react';
import { canPurchaseEquipment } from '@/utils/gameUtils';
import { availableEquipment } from '@/data/equipment';

interface RightPanelProps {
  gameState: GameState;
  showSkillsModal: boolean;
  setShowSkillsModal: (show: boolean) => void;
  showAttributesModal: boolean;
  setShowAttributesModal: (show: boolean) => void;
  spendPerkPoint: (attribute: keyof PlayerAttributes) => void;
  advanceDay: () => void;
  purchaseEquipment: (equipmentId: string) => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  gameState,
  showSkillsModal,
  setShowSkillsModal,
  showAttributesModal,
  setShowAttributesModal,
  spendPerkPoint,
  advanceDay,
  purchaseEquipment
}) => {
  const [showStudioModal, setShowStudioModal] = useState(false);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Player Progress Card */}
      <Card className="bg-gray-800/50 border-gray-600 p-4 backdrop-blur-sm">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Your Progress</h3>
            <div className="text-yellow-400 font-bold">Level {gameState.playerData.level}</div>
          </div>
          
          <XPProgressBar
            currentXP={gameState.playerData.xp}
            xpToNext={gameState.playerData.xpToNextLevel}
            level={gameState.playerData.level}
          />

          <div className="flex gap-2">
            <Button 
              onClick={() => setShowSkillsModal(true)}
              variant="outline" 
              size="sm"
              className="flex-1 bg-gray-800/80 hover:bg-gray-700/80 text-white border-gray-600"
            >
              Skills
            </Button>
            <Button 
              onClick={() => setShowAttributesModal(true)}
              variant="outline" 
              size="sm"
              className="flex-1 bg-gray-800/80 hover:bg-gray-700/80 text-white border-gray-600 relative"
            >
              <ArrowUp className="w-4 h-4 mr-1" />
              Attributes
              {gameState.playerData.perkPoints > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                  {gameState.playerData.perkPoints}
                </span>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Equipment Shop Card */}
      <Card className="bg-gray-800/50 border-gray-600 p-4 backdrop-blur-sm">
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingCart className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold text-white">Equipment Shop</h3>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {availableEquipment
              .filter(equipment => {
                const purchaseCheck = canPurchaseEquipment(equipment, gameState);
                // Only show items that can be purchased (hide locked items)
                return purchaseCheck.canPurchase;
              })
              .map(equipment => {
                const isOwned = gameState.ownedEquipment.some(owned => owned.id === equipment.id);
                
                return (
                  <div key={equipment.id} className="p-3 bg-gray-700/50 rounded border border-gray-600 hover:bg-gray-700 transition-colors">
                    <div className="flex justify-between items-start mb-2">
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
                    
                    <p className="text-xs text-gray-300 mb-2">{equipment.description}</p>
                    
                    {equipment.bonuses && (
                      <div className="text-xs text-gray-400 mb-2">
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
                      disabled={gameState.money < equipment.price || isOwned}
                      size="sm"
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                      {isOwned ? 'Owned' : 
                       gameState.money < equipment.price ? 'Cannot Afford' : 
                       `Buy $${equipment.price}`}
                    </Button>
                  </div>
                );
              })}
          </div>
          
          <Button 
            onClick={() => setShowStudioModal(true)}
            variant="outline"
            className="w-full bg-gray-800/80 hover:bg-gray-700/80 text-white border-gray-600"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            View All Equipment
          </Button>
        </div>
      </Card>

      {/* Actions Card */}
      <Card className="bg-gray-800/50 border-gray-600 p-4 backdrop-blur-sm">
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-400" />
            Daily Actions
          </h3>
          
          <Button 
            onClick={advanceDay}
            className="w-full bg-blue-600 hover:bg-blue-700 game-button"
          >
            <Zap className="w-4 h-4 mr-2" />
            Next Day
          </Button>
        </div>
      </Card>

      {/* Modals */}
      <SkillProgressDisplay
        gameState={gameState}
        showModal={showSkillsModal}
        setShowModal={setShowSkillsModal}
      />

      <AttributesModal
        isOpen={showAttributesModal}
        onClose={() => setShowAttributesModal(false)}
        playerData={gameState.playerData}
        spendPerkPoint={spendPerkPoint}
      />

      <StudioModal
        showModal={showStudioModal}
        setShowModal={setShowStudioModal}
        gameState={gameState}
        purchaseEquipment={purchaseEquipment}
      />
    </div>
  );
};
