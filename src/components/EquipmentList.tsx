import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GameBonusesDisplay } from '@/components/equipment/GameBonusesDisplay';
import { GearWhyHint } from '@/components/equipment/GearWhyHint';
import { GameState } from '@/types/game';
import { getAvailableEquipmentForYear, getEraAdjustedPrice } from '@/data/eraEquipment';
import { money } from '@/utils/displayMoney';
import './equipment/gear-shop.css';

interface EquipmentListProps {
  purchaseEquipment: (equipmentId: string) => void;
  gameState: GameState;
}

export const EquipmentList: React.FC<EquipmentListProps> = ({ purchaseEquipment, gameState }) => {
  const [category, setCategory] = useState('all');
  const [affordableOnly, setAffordableOnly] = useState(false);
  const year = gameState.currentYear ?? 2024;
  const available = getAvailableEquipmentForYear(year);
  const unowned = available.filter(equipment =>
    !gameState.ownedEquipment.some(owned => (owned.templateId ?? owned.id) === equipment.id)
    && (!equipment.skillRequirement || (gameState.studioSkills[equipment.skillRequirement.skill]?.level ?? 0) >= equipment.skillRequirement.level)
  );
  const offers = unowned.map(equipment => ({
    equipment,
    price: getEraAdjustedPrice(equipment, year, gameState.equipmentMultiplier ?? 1),
  })).sort((a, b) => a.price - b.price);
  const visible = offers.filter(({ equipment, price }) =>
    (category === 'all' || equipment.category === category) && (!affordableOnly || price <= gameState.money)
  );
  const ownedCategories = gameState.ownedEquipment.map(owned => owned.category);
  const categories = [...new Set(available.map(equipment => equipment.category))];

  return (
    <section className="gear-shop flex flex-col" aria-label="Equipment shop">
      <header className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="rst-kicker">Tools of the trade · {year}</p>
          <h3 className="text-lg font-bold text-white">Equipment Shop</h3>
          <p className="text-xs text-stone-400">Era-matched gear, lowest price first.</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-stone-400">Studio budget</p>
          <p className="font-bold text-emerald-300 tabular-nums">{money(gameState.money)}</p>
          <p key={gameState.ownedEquipment.length} className="feel-land text-xs text-stone-300" role="status">{gameState.ownedEquipment.length} in your collection</p>
        </div>
      </header>
      <div className="gear-shop__filters">
        <label className="text-xs text-stone-300">Browse
          <select className="ml-2 rounded-md border border-stone-600 bg-stone-900 p-2 capitalize" value={category} onChange={event => setCategory(event.target.value)}>
            <option value="all">All gear</option>
            {categories.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer">
          <input type="checkbox" checked={affordableOnly} onChange={event => setAffordableOnly(event.target.checked)} /> Within budget
        </label>
        <span className="text-xs text-stone-400" role="status">{visible.length} available</span>
      </div>
      {visible.length === 0 ? (
        <Card className="p-4 bg-stone-800/50 border-stone-600 text-center text-stone-300">
          <p>{unowned.length === 0 ? 'No new gear unlocked. Grow your skills or advance the era for more.' : 'No gear matches these filters. Try another category or turn off Within budget.'}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map(({ equipment, price }) => {
            const canAfford = gameState.money >= price;
            const isVintage = equipment.isVintage && year > (equipment.availableUntil ?? equipment.availableFrom + 20);
            return (
              <Card key={equipment.id} className="gear-shop__card p-3 bg-stone-800/50 border-stone-600" data-affordable={canAfford}>
                <div className="flex items-start gap-3">
                  <span className="gear-shop__icon" aria-hidden="true">{equipment.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-widest text-stone-400">{equipment.category} · Since {equipment.availableFrom}</p>
                    <h4 className="font-semibold text-white text-sm">{equipment.name}<GearWhyHint gear={equipment} ownedCategories={ownedCategories} knowHow={gameState.studioKnowHow} /></h4>
                    {isVintage && <span className="text-[10px] text-amber-300">Vintage find</span>}
                    <p className="mt-1 text-xs leading-relaxed text-stone-300">{equipment.eraDescription || equipment.description}</p>
                  </div>
                </div>
                <details className="gear-shop__details mt-2">
                  <summary className="cursor-pointer text-xs text-amber-200">What it adds to a session</summary>
                  <div className="mt-2"><GameBonusesDisplay bonuses={equipment.bonuses} /></div>
                </details>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-700 pt-3">
                  <div>
                    <p className="font-bold text-sm text-amber-100 tabular-nums">{money(price)}</p>
                    <p className={`text-[11px] ${canAfford ? 'text-emerald-300' : 'text-stone-400'}`}>{canAfford ? 'Ready for your studio' : `${money(price - gameState.money)} to go`}</p>
                  </div>
                  <Button size="sm" onClick={() => purchaseEquipment(equipment.id)} disabled={!canAfford} aria-label={`Buy ${equipment.name} for ${money(price)}`} className="feel-sheen min-h-11 text-xs">
                    {canAfford ? 'Add to studio' : 'Save up'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
};
