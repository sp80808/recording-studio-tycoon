
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Lock, Check } from 'lucide-react';
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

  // Filter equipment based on category and ownership
  const filteredEquipment = availableEquipment
    .filter(equipment => {
      if (selectedCategory === 'all') return true;
      return equipment.category === selectedCategory;
    })
    .filter(equipment => !gameState.ownedEquipment.some(owned => owned.id === equipment.id))
    .sort((a, b) => a.price - b.price);

  const getAttributeDescription = (attribute: keyof PlayerAttributes): string => {
    switch (attribute) {
      case 'focusMastery':
        return 'Improves effectiveness of focus allocation sliders';
      case 'creativeIntuition':
        return 'Increases creativity points generated during work sessions';
      case 'technicalAptitude':
        return 'Increases technical points generated during work sessions';
      case 'businessAcumen':
        return 'Improves project payouts and reputation gains';
      default:
        return '';
    }
  };

  const formatAttributeName = (attribute: string): string => {
    return attribute.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  const getSkillRequirementStatus = (equipment: any) => {
    if (!equipment.skillRequirement) return { met: true, message: '' };
    
    const skill = gameState.studioSkills[equipment.skillRequirement.skill];
    const hasSkill = skill && skill.level >= equipment.skillRequirement.level;
    
    return {
      met: hasSkill,
      message: `Requires ${equipment.skillRequirement.skill} Level ${equipment.skillRequirement.level}`
    };
  };

  return (
    <div className="w-80 space-y-4">
      <div className="space-y-2">
        {/* Studio Skills Modal */}
        <Dialog open={showSkillsModal} onOpenChange={setShowSkillsModal}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full bg-gray-800/80 hover:bg-gray-700/80 text-white border-gray-600">
              View Studio Skills
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-600 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Studio Skills</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {Object.values(gameState.studioSkills).map(skill => {
                const creativityBonus = calculateStudioSkillBonus(skill, 'creativity');
                const technicalBonus = calculateStudioSkillBonus(skill, 'technical');
                
                return (
                  <div key={skill.name} className="group relative">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-200">{skill.name}</span>
                      <div className="text-right">
                        <div className="font-bold text-white">Level {skill.level}</div>
                        <div className="text-sm text-gray-400">{skill.xp}/{skill.xpToNext} XP</div>
                      </div>
                    </div>
                    
                    {/* Passive bonuses */}
                    <div className="text-xs text-gray-400 mt-1">
                      <div className="text-blue-400">+{creativityBonus}% Creativity for {skill.name} projects</div>
                      <div className="text-green-400">+{technicalBonus}% Technical for {skill.name} projects</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>

        {/* Player Attributes Modal */}
        <Dialog open={showAttributesModal} onOpenChange={setShowAttributesModal}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full bg-gray-800/80 hover:bg-gray-700/80 text-white border-gray-600">
              Player Attributes ({gameState.playerData.perkPoints} points)
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-600 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Player Attributes</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-gray-400 mb-4">
                Available Perk Points: <span className="text-white font-bold">{gameState.playerData.perkPoints}</span>
              </div>
              
              {Object.entries(gameState.playerData.attributes).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-white">{formatAttributeName(key)}</div>
                      <div className="text-xs text-gray-400">{getAttributeDescription(key as keyof PlayerAttributes)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-lg">{value}</span>
                      <Button
                        size="sm"
                        onClick={() => spendPerkPoint(key as keyof PlayerAttributes)}
                        disabled={gameState.playerData.perkPoints <= 0}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 min-w-[32px]"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="text-xs text-gray-400 mt-4 p-2 bg-gray-800 rounded">
                💡 Tip: Gain perk points by leveling up through project completion!
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Button onClick={advanceDay} className="w-full bg-orange-600 hover:bg-orange-700 text-white">
          Next Day
        </Button>
      </div>

      {/* Equipment Shop */}
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

        <div className="text-xs text-gray-400 mb-2">
          Sorted by price • {filteredEquipment.length} items available
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {filteredEquipment.map(equipment => {
            const purchaseCheck = canPurchaseEquipment(equipment, gameState);
            const skillStatus = getSkillRequirementStatus(equipment);
            const isLocked = !skillStatus.met;
            const canAfford = gameState.money >= equipment.price;
            
            return (
              <Card key={equipment.id} className={`p-4 border-gray-600 backdrop-blur-sm transition-colors ${
                isLocked ? 'bg-gray-900/60 opacity-75' : 'bg-gray-900/90 hover:bg-gray-800/90'
              }`}>
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="text-2xl">{equipment.icon}</div>
                    {isLocked && (
                      <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1">
                        <Lock size={12} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-semibold text-sm ${isLocked ? 'text-gray-400' : 'text-white'}`}>
                        {equipment.name}
                      </h4>
                      {!isLocked && equipment.skillRequirement && (
                        <Badge variant="outline" className="text-xs border-green-500 text-green-400">
                          <Check size={10} className="mr-1" />
                          Unlocked
                        </Badge>
                      )}
                    </div>
                    
                    <p className={`text-xs mt-1 leading-tight ${isLocked ? 'text-gray-500' : 'text-gray-300'}`}>
                      {equipment.description}
                    </p>
                    
                    {/* Skill requirement display */}
                    {equipment.skillRequirement && (
                      <div className={`text-xs mt-2 p-1 rounded ${
                        skillStatus.met ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                      }`}>
                        {skillStatus.message}
                      </div>
                    )}
                    
                    {/* Equipment bonuses */}
                    <div className="mt-2 space-y-1">
                      {equipment.bonuses.qualityBonus && (
                        <div className={`text-xs ${isLocked ? 'text-gray-500' : 'text-blue-400'}`}>
                          Quality: +{equipment.bonuses.qualityBonus}%
                        </div>
                      )}
                      {equipment.bonuses.creativityBonus && (
                        <div className={`text-xs ${isLocked ? 'text-gray-500' : 'text-purple-400'}`}>
                          Creativity: +{equipment.bonuses.creativityBonus}%
                        </div>
                      )}
                      {equipment.bonuses.technicalBonus && (
                        <div className={`text-xs ${isLocked ? 'text-gray-500' : 'text-orange-400'}`}>
                          Technical: +{equipment.bonuses.technicalBonus}%
                        </div>
                      )}
                      {equipment.bonuses.speedBonus && (
                        <div className={`text-xs ${isLocked ? 'text-gray-500' : 'text-yellow-400'}`}>
                          Speed: +{equipment.bonuses.speedBonus}%
                        </div>
                      )}
                      {equipment.bonuses.genreBonus && Object.entries(equipment.bonuses.genreBonus).map(([genre, bonus]) => (
                        <div key={genre} className={`text-xs ${isLocked ? 'text-gray-500' : 'text-green-400'}`}>
                          {genre}: +{bonus} points
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center mt-3">
                      <span className={`font-bold ${isLocked ? 'text-gray-500' : 'text-green-400'}`}>
                        ${equipment.price}
                      </span>
                      <Button 
                        size="sm" 
                        onClick={() => purchaseEquipment(equipment.id)}
                        disabled={!purchaseCheck.canPurchase || isLocked}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-xs px-2 py-1"
                        title={
                          isLocked ? skillStatus.message :
                          !canAfford ? 'Insufficient funds' :
                          purchaseCheck.canPurchase ? 'Purchase this equipment' :
                          purchaseCheck.reason
                        }
                      >
                        {isLocked ? (
                          <Lock size={12} />
                        ) : !canAfford ? (
                          'No $'
                        ) : (
                          'Buy'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
          
          {filteredEquipment.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              <div className="text-2xl mb-2">🏆</div>
              <div className="text-sm">No equipment available in this category!</div>
              <div className="text-xs mt-1">You've purchased everything available</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
