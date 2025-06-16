import React from 'react';
import { useStudioPerks } from '@/hooks/useStudioPerks';
import { StudioPerk } from '@/types/studioPerks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const PerkItem: React.FC<{ perk: StudioPerk; onUnlock: (perkId: string) => void; canUnlock: boolean; isOwned: boolean }> = ({ perk, onUnlock, canUnlock, isOwned }) => {
  return (
    <Card className="mb-4 bg-slate-800 border-slate-700 text-white">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{perk.name} {isOwned && <Badge variant="secondary" className="ml-2 bg-green-600 text-white">Owned</Badge>}</span>
          <Badge variant="outline" className="border-purple-400 text-purple-400">{perk.category} - Tier {perk.tier}</Badge>
        </CardTitle>
        <CardDescription className="text-slate-400">{perk.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div>
          <h4 className="font-semibold mb-1 text-slate-300">Effects:</h4>
          <ul className="list-disc list-inside text-sm text-slate-400">
            {perk.effects.map((effect, index) => (
              <li key={index}>
                {effect.key}: {typeof effect.value === 'number' && effect.operation === 'multiply' ? `${(effect.value * 100).toFixed(0)}%` : effect.value}
                {effect.operation && effect.operation !== 'set' ? ` (${effect.operation})` : ''}
                {effect.genre && ` (Genre: ${effect.genre})`}
              </li>
            ))}
          </ul>
        </div>
        {perk.cost && (
          <div className="mt-2">
            <h4 className="font-semibold mb-1 text-slate-300">Cost:</h4>
            <p className="text-sm text-slate-400">
              {perk.cost.money && `$${perk.cost.money.toLocaleString()} `}
              {perk.cost.perkPoints && `${perk.cost.perkPoints} Perk Points`}
            </p>
          </div>
        )}
        {perk.unlockConditions && perk.unlockConditions.length > 0 && (
            <div className="mt-2">
                <h4 className="font-semibold mb-1 text-slate-300">Requirements:</h4>
                <ul className="list-disc list-inside text-sm text-slate-400">
                    {perk.unlockConditions.map((cond, idx) => (
                        <li key={idx}>{`${cond.type.replace(/([A-Z])/g, ' $1')}: ${cond.value} ${cond.genre || ''} ${cond.skill || ''}`}</li>
                    ))}
                </ul>
            </div>
        )}
         {perk.prerequisites && perk.prerequisites.length > 0 && (
            <div className="mt-2">
                <h4 className="font-semibold mb-1 text-slate-300">Prerequisites:</h4>
                <ul className="list-disc list-inside text-sm text-slate-400">
                    {perk.prerequisites.map((prereqId, idx) => (
                        <li key={idx}>{prereqId}</li> // Ideally, map ID to perk name
                    ))}
                </ul>
            </div>
        )}
      </CardContent>
      <CardFooter>
        {!isOwned && (
          <Button onClick={() => onUnlock(perk.id)} disabled={!canUnlock} className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50">
            {canUnlock ? 'Unlock Perk' : 'Requirements Not Met'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export const StudioPerksPanel: React.FC = () => {
  const { availablePerks, ownedPerks, canUnlock, unlockPerk, isLoading } = useStudioPerks();

  if (isLoading) {
    return <div className="p-4 text-white">Loading perks...</div>;
  }

  const allPerkCategories = Array.from(new Set([...availablePerks, ...ownedPerks].map(p => p.category)));

  return (
    <div className="p-4 bg-slate-900 h-full text-white">
      <h2 className="text-2xl font-bold mb-4 text-purple-400">Studio Perks & Specializations</h2>
      <ScrollArea className="h-[calc(100vh-120px)] pr-4"> {/* Adjust height as needed */}
        {allPerkCategories.map(category => (
          <div key={category} className="mb-6">
            <h3 className="text-xl font-semibold mb-3 text-purple-300 border-b border-slate-700 pb-1">{category}</h3>
            {availablePerks.filter(p => p.category === category).map(perk => (
              <PerkItem 
                key={perk.id} 
                perk={perk} 
                onUnlock={unlockPerk} 
                canUnlock={canUnlock(perk.id)}
                isOwned={ownedPerks.some(op => op.id === perk.id)}
              />
            ))}
            {/* Optionally, display owned perks in a different section or style */}
            {ownedPerks.filter(p => p.category === category && !availablePerks.some(ap => ap.id === p.id)).map(perk => (
                 <PerkItem 
                    key={perk.id} 
                    perk={perk} 
                    onUnlock={unlockPerk} // Should be disabled anyway
                    canUnlock={false} // Owned, so cannot unlock again (unless repeatable)
                    isOwned={true}
              />
            ))}
          </div>
        ))}
        {availablePerks.length === 0 && ownedPerks.length === 0 && <p>No perks currently available or unlocked.</p>}
      </ScrollArea>
    </div>
  );
};
