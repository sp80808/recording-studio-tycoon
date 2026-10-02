import { useState } from 'react';
import { Building2 } from 'lucide-react';
import type { GameState } from '@/types/game';
import { bookEntry } from '@/economy/ledger';
import { applyPremisesMove, getPremisesDef, getPremisesOffer } from '@/rpg/premises';

interface PremisesPanelProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

/** Optional premises move (#70): visible terms first, explicit confirmation, never automatic. */
export function PremisesPanel({ gameState, setGameState }: PremisesPanelProps) {
  const [confirming, setConfirming] = useState(false);
  const def = getPremisesDef(gameState);
  const offer = getPremisesOffer(gameState);
  return (
    <section className="rounded-lg border border-stone-700 bg-stone-950/50 p-2.5 text-xs" aria-label="Studio premises">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-white">
        <Building2 size={15} aria-hidden="true" />{def.name}
        {def.dailyRent > 0 && <span className="ml-auto text-stone-400">Rent ${def.dailyRent}/day</span>}
      </h3>
      {!offer && <p className="mt-1 text-stone-400">You're in the biggest premises on offer. Rent is the price of the space, so keep the rooms booked.</p>}
      {offer && (
        <>
          <p className="mt-1 text-stone-300">Move to a {offer.name.toLowerCase()}? Deposit ${offer.deposit.toLocaleString()}, rent ${offer.dailyRent}/day.</p>
          <p className="text-stone-400">{offer.capacity}. Unlocks: {offer.unlocks.join(', ')}. Moving takes today's studio time (downtime: 1 day). Staff, gear, clients and Know-How come with you.</p>
          <ul className="mt-1.5 space-y-0.5">
            {offer.conditions.map(c => (
              <li key={c.label} className={c.met ? 'text-emerald-300' : 'text-stone-400'}>{c.met ? '✓' : '○'} {c.label}</li>
            ))}
          </ul>
          <button
            className="rst-btn mt-2"
            disabled={!offer.eligible}
            onClick={() => {
              if (!confirming) return setConfirming(true);
              setConfirming(false);
              setGameState(prev => {
                const moved = applyPremisesMove(prev);
                return moved === prev
                  ? prev
                  : bookEntry(moved, { category: 'premises-rent', amount: moved.money - prev.money, sourceId: 'premises-deposit', memo: 'Studio deposit' });
              });
            }}
          >
            {confirming ? 'Confirm move' : `Move to a ${offer.name.toLowerCase()}`}
          </button>
          {confirming && <button className="rst-btn ml-2" onClick={() => setConfirming(false)}>Stay lean</button>}
        </>
      )}
    </section>
  );
}
