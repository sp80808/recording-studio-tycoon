import React from 'react';
import { Card } from '@/components/ui/card';
import { EraAvailableEquipment } from '@/data/eraEquipment';
import { TrendingUp } from 'lucide-react';

interface GameBonusesDisplayProps {
  bonuses: EraAvailableEquipment['bonuses'];
}

export const GameBonusesDisplay: React.FC<GameBonusesDisplayProps> = ({ bonuses }) => {
  return (
    <Card className="p-4 bg-gray-800/50 border-gray-600">
      <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
        <TrendingUp className="h-4 w-4" />
        Game Bonuses
      </h3>
      <div className="space-y-2 text-sm">
        {bonuses.qualityBonus && (
          <div className="flex justify-between">
            <span className="text-gray-400">Quality Bonus:</span>
            <span className="text-green-400">+{bonuses.qualityBonus}</span>
          </div>
        )}
        {bonuses.technicalBonus && (
          <div className="flex justify-between">
            <span className="text-gray-400">Technical Bonus:</span>
            <span className="text-blue-400">+{bonuses.technicalBonus}</span>
          </div>
        )}
        {bonuses.creativityBonus && (
          <div className="flex justify-between">
            <span className="text-gray-400">Creativity Bonus:</span>
            <span className={bonuses.creativityBonus > 0 ? 'text-purple-400' : 'text-red-400'}>
              {bonuses.creativityBonus > 0 ? '+' : ''}{bonuses.creativityBonus}
            </span>
          </div>
        )}
        {bonuses.speedBonus && (
          <div className="flex justify-between">
            <span className="text-gray-400">Speed Bonus:</span>
            <span className="text-yellow-400">+{bonuses.speedBonus}</span>
          </div>
        )}
        {bonuses.genreBonus && Object.keys(bonuses.genreBonus).length > 0 && (
          <div>
            <div className="text-gray-400 mb-1">Genre Bonuses:</div>
            {Object.entries(bonuses.genreBonus).map(([genre, bonus]) => (
              <div key={genre} className="flex justify-between ml-2">
                <span className="text-gray-500 capitalize">{genre}:</span>
                <span className="text-green-400">+{bonus}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
