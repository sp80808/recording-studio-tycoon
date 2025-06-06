
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GameState, PlayerAttributes } from '@/types/game';
import { availableEquipment } from '@/data/equipment';
import { canPurchaseEquipment } from '@/utils/gameUtils';
import { XPProgressBar } from '@/components/XPProgressBar';
import { SkillProgressDisplay } from '@/components/SkillProgressDisplay';
import { AttributesModal } from '@/components/modals/AttributesModal';
import { StudioModal } from '@/components/modals/StudioModal';

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
  // Filter equipment to only show purchasable items
  const purchasableEquipment = availableEquipment.filter(equipment => {
    const purchaseCheck = canPurchaseEquipment(equipment, gameState);
    return purchaseCheck.canPurchase;
  });

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Player Info Card */}
      <Card className="bg-gray-800 border-gray-600">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-white text-sm">Player Progress</CardTitle>
            <Badge variant="secondary" className="bg-blue-600 text-white">
              Level {gameState.playerData.level}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <XPProgressBar 
            currentXP={gameState.playerData.xp}
            xpToNextLevel={gameState.playerData.xpToNextLevel}
            level={gameState.playerData.level}
          />
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-gray-300">
              <span className="text-green-400">${gameState.money}</span>
            </div>
            <div className="text-gray-300">
              <span className="text-blue-400">{gameState.reputation} Rep</span>
            </div>
            <div className="text-gray-300">
              Perk Points: <span className="text-yellow-400">{gameState.playerData.perkPoints}</span>
            </div>
            <div className="text-gray-300">
              Energy: <span className="text-purple-400">{gameState.playerData.dailyWorkCapacity}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="equipment" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 bg-gray-700">
          <TabsTrigger value="equipment" className="text-white data-[state=active]:bg-gray-600">
            Equipment
          </TabsTrigger>
          <TabsTrigger value="skills" className="text-white data-[state=active]:bg-gray-600">
            Skills
          </TabsTrigger>
          <TabsTrigger value="day" className="text-white data-[state=active]:bg-gray-600">
            Day {gameState.currentDay}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="flex-1 overflow-hidden">
          <Card className="h-full bg-gray-800 border-gray-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm">Equipment Shop</CardTitle>
            </CardHeader>
            <CardContent className="h-full overflow-y-auto">
              <div className="space-y-3">
                {purchasableEquipment.length === 0 ? (
                  <p className="text-gray-400 text-sm">No equipment available for purchase at your current skill level.</p>
                ) : (
                  purchasableEquipment.map(equipment => (
                    <Card key={equipment.id} className="p-3 bg-gray-700 border-gray-500">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="text-white font-semibold text-sm">{equipment.name}</h4>
                          <p className="text-gray-300 text-xs">{equipment.description}</p>
                        </div>
                        <div className="text-right ml-2">
                          <div className="text-green-400 font-bold text-sm">${equipment.price}</div>
                          <Badge variant="outline" className="text-xs mt-1">
                            {equipment.category}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Equipment bonuses */}
                      <div className="mb-2">
                        {equipment.bonuses.creativityBonus && (
                          <div className="text-xs text-purple-400">+{equipment.bonuses.creativityBonus}% Creativity</div>
                        )}
                        {equipment.bonuses.technicalBonus && (
                          <div className="text-xs text-blue-400">+{equipment.bonuses.technicalBonus}% Technical</div>
                        )}
                        {equipment.bonuses.genreBonus && Object.entries(equipment.bonuses.genreBonus).map(([genre, bonus]) => (
                          <div key={genre} className="text-xs text-yellow-400">+{bonus} {genre}</div>
                        ))}
                      </div>

                      <Button 
                        onClick={() => purchaseEquipment(equipment.id)}
                        disabled={gameState.money < equipment.price}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-sm py-1"
                      >
                        {gameState.money < equipment.price ? 'Insufficient Funds' : 'Purchase'}
                      </Button>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="flex-1">
          <SkillProgressDisplay
            studioSkills={gameState.studioSkills}
            showModal={showSkillsModal}
            setShowModal={setShowSkillsModal}
            showAttributesModal={showAttributesModal}
            setShowAttributesModal={setShowAttributesModal}
            playerData={gameState.playerData}
            spendPerkPoint={spendPerkPoint}
          />
        </TabsContent>

        <TabsContent value="day" className="flex-1">
          <Card className="h-full bg-gray-800 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white">Day {gameState.currentDay}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-gray-300 space-y-2">
                <div>Active Projects: {gameState.activeProject ? 1 : 0}</div>
                <div>Staff: {gameState.hiredStaff.length}</div>
                {gameState.hiredStaff.length > 0 && (
                  <div className="text-sm">
                    Daily Salaries: ${gameState.hiredStaff.reduce((total, staff) => total + staff.salary, 0)}
                  </div>
                )}
              </div>
              
              <Button 
                onClick={advanceDay}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Advance Day
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AttributesModal 
        isOpen={showAttributesModal}
        onClose={() => setShowAttributesModal(false)}
        playerData={gameState.playerData}
        spendPerkPoint={spendPerkPoint}
      />

      <StudioModal 
        isOpen={showSkillsModal}
        onClose={() => setShowSkillsModal(false)}
        studioSkills={gameState.studioSkills}
      />
    </div>
  );
};
