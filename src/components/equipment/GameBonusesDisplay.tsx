import React from 'react';
import { Card } from '@/components/ui/card';
import { EraAvailableEquipment } from '@/data/eraEquipment';
import { gearEffectParts, GEAR_NO_EFFECT_TEXT } from '@/rpg/gearEffects';
import { tc } from '@/i18n/content';
import { TrendingUp } from 'lucide-react';

interface GameBonusesDisplayProps {
  bonuses: EraAvailableEquipment['bonuses'];
}

export const GameBonusesDisplay: React.FC<GameBonusesDisplayProps> = ({ bonuses }) => {
  return (
    <Card className="p-4 bg-stone-800/50 border-stone-600">
      <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
        <TrendingUp className="h-4 w-4" />
        Game Bonuses
      </h3>
      <div className="space-y-2 text-sm">
        {gearEffectParts(bonuses).length === 0 && <p className="text-stone-400">{tc('gear.effects.none', GEAR_NO_EFFECT_TEXT)}</p>}
        {bonuses.qualityBonus && (
          <div className="flex justify-between">
            <span className="text-stone-400">Quality Bonus:</span>
            <span className="text-green-400">{bonuses.qualityBonus > 0 ? '+' : ''}{bonuses.qualityBonus}</span>
          </div>
        )}
        {bonuses.technicalBonus && (
          <div className="flex justify-between">
            <span className="text-stone-400">Technical Bonus:</span>
            <span className="text-amber-300">{bonuses.technicalBonus > 0 ? '+' : ''}{bonuses.technicalBonus}</span>
          </div>
        )}
        {bonuses.creativityBonus && (
          <div className="flex justify-between">
            <span className="text-stone-400">Creativity Bonus:</span>
            <span className={bonuses.creativityBonus > 0 ? 'text-purple-400' : 'text-red-400'}>
              {bonuses.creativityBonus > 0 ? '+' : ''}{bonuses.creativityBonus}
            </span>
          </div>
        )}
        {bonuses.speedBonus && (
          <div className="flex justify-between">
            <span className="text-stone-400">Speed Bonus:</span>
            <span className="text-yellow-400">{bonuses.speedBonus > 0 ? '+' : ''}{bonuses.speedBonus}</span>
          </div>
        )}
        {bonuses.genreBonus && Object.keys(bonuses.genreBonus).length > 0 && (
          <div>
            <div className="text-stone-400 mb-1">Genre Bonuses:</div>
            {Object.entries(bonuses.genreBonus).map(([genre, bonus]) => (
              <div key={genre} className="flex justify-between ml-2">
                <span className="text-stone-500 capitalize">{genre}:</span>
                <span className="text-green-400">{bonus > 0 ? '+' : ''}{bonus}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
