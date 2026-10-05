import { useMemo, useState } from 'react';
import { Building2 } from 'lucide-react';
import type { GameState } from '@/types/game';
import { bookEntry } from '@/economy/ledger';
import { applyPremisesMove, getPremisesDef, getPremisesOffer, premisesStaffCap } from '@/rpg/premises';
import { deriveStudioPressure, generatePremisesOpportunities } from '@/rpg/premisesPressure';
import { formatNumber } from '@/i18n/formatLocale';

interface PremisesPanelProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

/** Optional premises move (#70): visible terms first, explicit confirmation, never automatic. */
export function PremisesPanel({ gameState, setGameState }: PremisesPanelProps) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const def = getPremisesDef(gameState);
  const offer = getPremisesOffer(gameState);
  const pressure = useMemo(() => deriveStudioPressure(gameState), [gameState]);
  const opportunities = useMemo(() => generatePremisesOpportunities(gameState), [gameState]);
  return (
    <section className="rounded-lg border border-stone-700 bg-stone-950/50 p-2.5 text-xs" aria-label="Studio premises">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-white">
        <Building2 size={15} aria-hidden="true" />{def.name}
        {def.dailyRent > 0 && <span className="ml-auto text-stone-400">Rent ${def.dailyRent}/day</span>}
      </h3>
      {pressure.reasons.length > 0 && (
        <ul className="mt-1.5 space-y-0.5 text-amber-300" aria-label="Studio pressure">
          {pressure.reasons.map(r => <li key={r.id}>{r.label}</li>)}
        </ul>
      )}
      {!offer && <p className="mt-1 text-stone-400">You're in the biggest premises on offer. Rent is the price of the space, so keep the rooms booked.</p>}
      {offer && opportunities.length === 0 && (
        <p className="mt-1 text-stone-400">The space is coping for now. If it starts to feel tight, word will get round about somewhere new. Staying small is a fine choice.</p>
      )}
      {offer && opportunities.length > 0 && (
        <>
          <p className="mt-1.5 italic text-stone-300">{opportunities[0].cue}</p>
          <div className="mt-1.5 space-y-2">
            {opportunities.map(o => (
              <div key={o.id} className="rounded border border-stone-700 p-2" data-testid="premises-opportunity">
                <p className="font-semibold text-white">{o.name}</p>
                <p className="text-emerald-300">+ {o.solves}</p>
                <p className="text-rose-300">- {o.tradeoff}</p>
                <p className="text-stone-400">Deposit ${formatNumber(o.deposit)}, rent ${o.dailyRent}/day (now ${def.dailyRent}). Staff cap {premisesStaffCap(gameState)} → {o.staffCap}, +{o.roomAllowanceBonus - def.roomAllowanceBonus} room allowance. Moving takes today's studio time. Staff, gear, clients and Know-How come with you.</p>
                <button
                  className="rst-btn mt-1.5"
                  disabled={!o.eligible}
                  onClick={() => {
                    if (confirming !== o.id) return setConfirming(o.id);
                    setConfirming(null);
                    setGameState(prev => {
                      const moved = applyPremisesMove(prev);
                      return moved === prev
                        ? prev
                        : bookEntry(moved, { category: 'premises-rent', amount: moved.money - prev.money, sourceId: 'premises-deposit', memo: 'Studio deposit' });
                    });
                  }}
                >
                  {confirming === o.id ? 'Confirm move' : `Take ${o.name.toLowerCase()}`}
                </button>
                {confirming === o.id && <button className="rst-btn ml-2" onClick={() => setConfirming(null)}>Stay lean</button>}
              </div>
            ))}
          </div>
          {!offer.eligible && (
            <>
              <p className="mt-1.5 text-stone-400">Before you could commit:</p>
              <ul className="mt-0.5 space-y-0.5">
                {offer.conditions.map(c => (
                  <li key={c.label} className={c.met ? 'text-emerald-300' : 'text-stone-400'}>{c.met ? '✓' : '○'} {c.label}</li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </section>
  );
}
