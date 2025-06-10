
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { PlayerData, PlayerAttributes } from '@/types/game';
import { ArrowUp, Zap, Brain, Wrench, DollarSign } from 'lucide-react';

interface PlayerAttributesModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerData: PlayerData;
  spendPerkPoint: (attribute: keyof PlayerAttributes) => void;
}

const attributeInfo = {
  focusMastery: {
    name: 'Focus Mastery',
    description: 'Improves allocation effectiveness and minigame performance',
    icon: <Zap className="w-5 h-5" />,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/20'
  },
  creativeIntuition: {
    name: 'Creative Intuition', 
    description: 'Increases creativity points generation from all sources',
    icon: <Brain className="w-5 h-5" />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/20'
  },
  technicalAptitude: {
    name: 'Technical Aptitude',
    description: 'Increases technical points generation and equipment effectiveness',
    icon: <Wrench className="w-5 h-5" />,
    color: 'text-green-400',
    bgColor: 'bg-green-900/20'
  },
  businessAcumen: {
    name: 'Business Acumen',
    description: 'Improves project payouts and staff management efficiency',
    icon: <DollarSign className="w-5 h-5" />,
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/20'
  }
};

export const PlayerAttributesModal: React.FC<PlayerAttributesModalProps> = ({
  isOpen,
  onClose,
  playerData,
  spendPerkPoint
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-600 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <ArrowUp className="w-5 h-5 text-yellow-400" />
            Player Attributes
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 p-4">
          {/* Perk Points Display */}
          <div className="text-center p-4 bg-yellow-900/20 rounded-lg border border-yellow-500/30">
            <div className="text-2xl font-bold text-yellow-400 mb-2">
              {playerData.perkPoints} Perk Points Available
            </div>
            <p className="text-gray-300 text-sm">
              Earn more by completing projects and leveling up
            </p>
          </div>

          {/* Attributes List */}
          <div className="space-y-4">
            {(Object.keys(attributeInfo) as Array<keyof PlayerAttributes>).map(attributeKey => {
              const attribute = attributeInfo[attributeKey];
              const currentValue = playerData.attributes[attributeKey];
              const maxValue = 10; // Set reasonable max
              const progressPercent = ((currentValue - 1) / (maxValue - 1)) * 100;
              
              return (
                <div 
                  key={attributeKey}
                  className={`p-4 rounded-lg border ${attribute.bgColor} border-gray-600 hover:border-gray-500 transition-colors`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={attribute.color}>
                        {attribute.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{attribute.name}</h3>
                        <p className="text-sm text-gray-400">{attribute.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-white">
                        Level {currentValue}
                      </div>
                      <div className="text-sm text-gray-400">
                        Max {maxValue}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Progress 
                        value={progressPercent} 
                        className="h-2"
                      />
                    </div>
                    <Button
                      onClick={() => spendPerkPoint(attributeKey)}
                      disabled={playerData.perkPoints <= 0 || currentValue >= maxValue}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed min-w-[100px]"
                    >
                      {currentValue >= maxValue ? 'Maxed' : 
                       playerData.perkPoints <= 0 ? 'No Points' : 
                       `Upgrade (+1)`}
                    </Button>
                  </div>
                  
                  {/* Bonus Information */}
                  <div className="mt-2 text-xs text-gray-400">
                    Current Bonus: +{Math.floor((currentValue - 1) * 25)}% effectiveness
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
