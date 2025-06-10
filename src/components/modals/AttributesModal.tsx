
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PlayerData, PlayerAttributes } from '@/types/game';
import { ArrowUp } from 'lucide-react';

interface AttributesModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerData: PlayerData;
  spendPerkPoint: (attribute: keyof PlayerAttributes) => void;
}

export const AttributesModal: React.FC<AttributesModalProps> = ({
  isOpen,
  onClose,
  playerData,
  spendPerkPoint
}) => {
  const attributes = [
    {
      key: 'focusMastery' as keyof PlayerAttributes,
      name: 'Focus Mastery',
      description: 'Improves work effectiveness and focus allocation',
      icon: '🧘'
    },
    {
      key: 'creativeIntuition' as keyof PlayerAttributes,
      name: 'Creative Intuition',
      description: 'Increases creativity point generation',
      icon: '🎨'
    },
    {
      key: 'technicalAptitude' as keyof PlayerAttributes,
      name: 'Technical Aptitude',
      description: 'Increases technical point generation',
      icon: '⚙️'
    },
    {
      key: 'businessAcumen' as keyof PlayerAttributes,
      name: 'Business Acumen',
      description: 'Improves project payouts and reputation gains',
      icon: '💼'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-600 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <ArrowUp className="w-5 h-5" />
            Player Attributes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center mb-4">
            <div className="text-yellow-400 font-bold text-lg">
              Available Perk Points: {playerData.perkPoints}
            </div>
          </div>

          {attributes.map((attr) => (
            <div key={attr.key} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-600">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{attr.icon}</span>
                <div>
                  <h4 className="font-bold text-white">{attr.name}</h4>
                  <p className="text-sm text-gray-400">{attr.description}</p>
                  <div className="text-blue-400 font-medium">
                    Current Level: {playerData.attributes[attr.key]}
                  </div>
                </div>
              </div>
              <Button
                onClick={() => spendPerkPoint(attr.key)}
                disabled={playerData.perkPoints <= 0}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
              >
                Upgrade (+1)
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
