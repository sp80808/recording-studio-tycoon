import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GameState, PlayerAttributes } from '@/types/game';
import { availableEquipment, equipmentCategories } from '@/data/equipment';
import { canPurchaseEquipment, calculateStudioSkillBonus } from '@/utils/gameUtils';

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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter and sort equipment by price
  const filteredEquipment = availableEquipment
    .filter(equipment => {
      if (selectedCategory === 'all') return true;
      return equipment.category === selectedCategory;
    })
    .filter(equipment => !gameState.ownedEquipment.some(owned => owned.id === equipment.id))
    .sort((a, b) => a.price - b.price); // Sort by price, cheapest first

  return (
    <div className="w-80 space-y-4">
      <div className="space-y-2">
        <Dialog open={showSkillsModal} onOpenChange={setShowSkillsModal}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full bg-gray-800/80 hover:bg-gray-700/80 text-white border-gray-600">View Studio Skills</Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-600 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Studio Skills</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {Object.values(gameState.studioSkills).map(skill => {
                const creativityBonus = calculateStudioSkillBonus(skill, 'creativity');
                const technicalBonus = calculateStudioSkillBonus(skill, 'technical');
                
                return (
                  <div key={skill.name} className="flex justify-between items-center group relative">
                    <span className="text-gray-200">{skill.name}</span>
                    <div className="text-right">
                      <div className="font-bold text-white">Level {skill.level}</div>
                      <div className="text-sm text-gray-400">{skill.xp}/{skill.xpToNext}</div>
                      {/* Tooltip on hover */}
                      <div className="hidden group-hover:block absolute bg-gray-800 p-2 rounded text-xs border border-gray-600 z-10 right-0 mt-1">
                        <div className="text-blue-400">+{creativityBonus}% Creativity for {skill.name}</div>
                        <div className="text-green-400">+{technicalBonus}% Technical for {skill.name}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showAttributesModal} onOpenChange={setShowAttributesModal}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full bg-gray-800/80 hover:bg-gray-700/80 text-white border-gray-600">
              Player Attributes ({gameState.playerData.perkPoints} points)
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-600 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Player Attributes</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-gray-400">Available Perk Points: {gameState.playerData.perkPoints}</div>
              {Object.entries(gameState.playerData.attributes).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="capitalize text-gray-200">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{value}</span>
                    <Button
                      size="sm"
                      onClick={() => spendPerkPoint(key as keyof PlayerAttributes)}
                      disabled={gameState.playerData.perkPoints <= 0}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
                    >
                      +
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        <Button onClick={advanceDay} className="w-full bg-orange-600 hover:bg-orange-700 text-white">Next Day</Button>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-3 text-white">Equipment Shop</h3>
        
        {/* Category Filter */}
        <div className="mb-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              {Object.entries(equipmentCategories).map(([key, label]) => (
                <SelectItem key={key} value={key} className="text-white hover:bg-gray-700">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-xs text-gray-400 mb-2">Sorted by price (cheapest first)</div>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {filteredEquipment.map(equipment => {
            const purchaseCheck = canPurchaseEquipment(equipment, gameState);
            
            return (
              <Card key={equipment.id} className="p-4 bg-gray-900/90 border-gray-600 backdrop-blur-sm group relative">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{equipment.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{equipment.name}</h4>
                    <p className="text-xs text-gray-300 mt-1">{equipment.description}</p>
                    
                    {/* Equipment bonuses */}
                    <div className="mt-2 space-y-1">
                      {equipment.bonuses.qualityBonus && (
                        <div className="text-xs text-blue-400">Quality: +{equipment.bonuses.qualityBonus}%</div>
                      )}
                      {equipment.bonuses.genreBonus && Object.entries(equipment.bonuses.genreBonus).map(([genre, bonus]) => (
                        <div key={genre} className="text-xs text-green-400">{genre}: +{bonus}</div>
                      ))}
                      {equipment.bonuses.creativityBonus && (
                        <div className="text-xs text-purple-400">Creativity: +{equipment.bonuses.creativityBonus}%</div>
                      )}
                      {equipment.bonuses.technicalBonus && (
                        <div className="text-xs text-orange-400">Technical: +{equipment.bonuses.technicalBonus}%</div>
                      )}
                      {equipment.bonuses.speedBonus && (
                        <div className="text-xs text-yellow-400">Speed: +{equipment.bonuses.speedBonus}%</div>
                      )}
                    </div>

                    {/* Skill requirement */}
                    {equipment.skillRequirement && (
                      <div className="text-xs text-red-400 mt-1">
                        Requires: {equipment.skillRequirement.skill} Level {equipment.skillRequirement.level}
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-green-400 font-bold">${equipment.price}</span>
                      <Button 
                        size="sm" 
                        onClick={() => purchaseEquipment(equipment.id)}
                        disabled={!purchaseCheck.canPurchase}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
                        title={!purchaseCheck.canPurchase ? purchaseCheck.reason : ''}
                      >
                        {!purchaseCheck.canPurchase && purchaseCheck.reason?.includes('funds') ? 'No Funds' : 
                         !purchaseCheck.canPurchase && purchaseCheck.reason?.includes('Requires') ? 'Locked' :
                         !purchaseCheck.canPurchase ? 'Owned' : 'Buy'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Detailed tooltip on hover */}
                <div className="hidden group-hover:block absolute bg-gray-800 p-3 rounded border border-gray-600 z-20 left-full top-0 ml-2 w-64">
                  <h5 className="font-bold text-white mb-2">{equipment.name}</h5>
                  <p className="text-xs text-gray-300 mb-2">{equipment.description}</p>
                  <div className="text-xs space-y-1">
                    <div className="text-yellow-400 font-semibold">Effects:</div>
                    {equipment.bonuses.qualityBonus && (
                      <div className="text-blue-400">• Overall Quality: +{equipment.bonuses.qualityBonus}%</div>
                    )}
                    {equipment.bonuses.creativityBonus && (
                      <div className="text-purple-400">• Creativity Points: +{equipment.bonuses.creativityBonus}%</div>
                    )}
                    {equipment.bonuses.technicalBonus && (
                      <div className="text-orange-400">• Technical Points: +{equipment.bonuses.technicalBonus}%</div>
                    )}
                    {equipment.bonuses.speedBonus && (
                      <div className="text-yellow-400">• Work Speed: +{equipment.bonuses.speedBonus}%</div>
                    )}
                    {equipment.bonuses.genreBonus && Object.entries(equipment.bonuses.genreBonus).map(([genre, bonus]) => (
                      <div key={genre} className="text-green-400">• {genre} Bonus: +{bonus} points</div>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
