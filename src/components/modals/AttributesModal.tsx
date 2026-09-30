
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PlayerData, PlayerAttributes } from '@/types/game';
import { calculateAttributeBonus } from '@/utils/playerUtils';
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
      description: '+5% focus effectiveness and +1 daily session per rank',
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
      <DialogContent className="bg-stone-900 border-stone-600 text-white max-w-2xl max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <ArrowUp className="w-5 h-5" />
            Producer talents
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center mb-4">
            <div className="text-yellow-400 font-bold text-lg">
              Talent points available: {playerData.perkPoints}
            </div>
          </div>

          {attributes.map((attr) => (
            <div key={attr.key} className="flex flex-wrap gap-3 items-center justify-between p-4 bg-stone-800 rounded-lg border border-stone-600">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{attr.icon}</span>
                <div>
                  <h4 className="font-bold text-white">{attr.name}</h4>
                  <p className="text-sm text-stone-400">{attr.description}</p>
                  <div className="text-amber-300 font-medium">
                    Rank {playerData.attributes[attr.key]}/10 · +{calculateAttributeBonus(attr.key, playerData.attributes[attr.key])}% effectiveness
                  </div>
                </div>
              </div>
              <Button
                onClick={() => spendPerkPoint(attr.key)}
                disabled={playerData.perkPoints <= 0 || playerData.attributes[attr.key] >= 10}
                aria-label={`Upgrade ${attr.name}`}
                className="bg-green-600 hover:bg-green-700 disabled:bg-stone-600"
              >
                {playerData.attributes[attr.key] >= 10 ? 'Mastered' : '+1 rank · 1 point'}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
