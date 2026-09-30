import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GameState } from '@/types/game';
import {
  ArtistProspect, ContractTerms, NegotiationOutcome, MAX_ROSTER, MIN_DURATION_DAYS, MAX_DURATION_DAYS,
  dailyStudioShare, generateProspects, scoutingBatchDay, PROSPECT_REFRESH_DAYS,
} from '@/simulation/artistContracts';

interface ArtistRosterProps {
  gameState: GameState;
  onMakeOffer: (prospect: ArtistProspect, offer: ContractTerms) => NegotiationOutcome;
  onSignContract: (prospect: ArtistProspect, terms: ContractTerms) => boolean;
  onPass: (prospectId: string) => void;
}

const termsLine = (t: ContractTerms) =>
  `$${t.advance} advance · artist keeps ${Math.round(t.artistSplit * 100)}% · ${t.durationDays} days${t.exclusive ? ' · exclusive' : ''}`;

export const ArtistRoster: React.FC<ArtistRosterProps> = ({ gameState, onMakeOffer, onSignContract, onPass }) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ContractTerms | null>(null);
  const [counter, setCounter] = useState<ContractTerms | null>(null);

  const roster = gameState.signedArtists ?? [];
  const seed = gameState.saveSeed ?? 'career';
  const prospects = useMemo(
    () => generateProspects(seed, gameState.currentDay, gameState.reputation),
    [seed, scoutingBatchDay(gameState.currentDay), gameState.reputation]
  );
  const passed = gameState.passedProspects ?? [];
  const visible = prospects.filter(p => !passed.includes(p.id) && !roster.some(a => a.id === p.id));
  const daysToRefresh = PROSPECT_REFRESH_DAYS - (gameState.currentDay - scoutingBatchDay(gameState.currentDay));

  const openNegotiation = (p: ArtistProspect) => {
    setOpenId(openId === p.id ? null : p.id);
    setDraft({ ...p.ask });
    setCounter(null);
  };

  return (
    <div className="mt-6 space-y-3" data-testid="artist-roster">
      <h3 className="text-lg font-semibold text-white">🖊️ A&amp;R Roster ({roster.length}/{MAX_ROSTER})</h3>

      {roster.length === 0 && <p className="text-sm text-stone-400">No artists signed. Scout talent below.</p>}
      {roster.map(a => (
        <Card key={a.id} className="p-3 text-sm">
          <div className="flex justify-between">
            <span className="font-medium text-white">{a.name} <span className="text-stone-400">· {a.genre}</span></span>
            <span className="text-green-400">+${dailyStudioShare(a)}/day</span>
          </div>
          <div className="text-xs text-stone-400">
            Fame {Math.round(a.fame)} · Skill {a.skill}/10 · {termsLine(a.terms)}
          </div>
          <div className="text-xs text-stone-400">
            {Math.max(0, a.expiresDay - gameState.currentDay)} days left · earned ${a.totalEarned}
          </div>
        </Card>
      ))}

      <h4 className="pt-2 text-sm font-semibold text-stone-300">
        Scouting report <span className="font-normal text-stone-500">(refreshes in {daysToRefresh} days)</span>
      </h4>
      {visible.length === 0 && <p className="text-sm text-stone-400">No prospects left this week.</p>}
      {visible.map(p => (
        <Card key={p.id} className="p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium text-white">{p.name} <span className="text-stone-400">· {p.genre}</span></span>
            <span className="text-xs text-stone-400">Fame {p.fame} · Skill {p.skill}/10</span>
          </div>
          <div className="text-xs text-stone-400">Asking: {termsLine(p.ask)}</div>
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={() => openNegotiation(p)} disabled={roster.length >= MAX_ROSTER}>
              {openId === p.id ? 'Close' : 'Negotiate'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onPass(p.id)}>Pass</Button>
          </div>

          {openId === p.id && draft && (
            <div className="mt-3 space-y-2 rounded border border-stone-600 p-2 text-xs text-stone-300">
              <div className="flex flex-wrap gap-2">
                <label>Advance $
                  <input type="number" min={0} className="ml-1 w-20 rounded bg-stone-800 p-1" value={draft.advance}
                    onChange={e => setDraft({ ...draft, advance: Math.max(0, Number(e.target.value) || 0) })} />
                </label>
                <label>Artist keeps %
                  <input type="number" min={5} max={70} className="ml-1 w-16 rounded bg-stone-800 p-1"
                    value={Math.round(draft.artistSplit * 100)}
                    onChange={e => setDraft({ ...draft, artistSplit: (Number(e.target.value) || 5) / 100 })} />
                </label>
                <label>Days
                  <input type="number" min={MIN_DURATION_DAYS} max={MAX_DURATION_DAYS} step={15} className="ml-1 w-16 rounded bg-stone-800 p-1"
                    value={draft.durationDays}
                    onChange={e => setDraft({ ...draft, durationDays: Number(e.target.value) || MIN_DURATION_DAYS })} />
                </label>
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={draft.exclusive} onChange={e => setDraft({ ...draft, exclusive: e.target.checked })} />
                  Exclusive
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => {
                  const outcome = onMakeOffer(p, draft);
                  if (outcome.result === 'counter') setCounter(outcome.counter);
                  else { setCounter(null); if (outcome.result === 'accepted') setOpenId(null); }
                }}>Make offer</Button>
                {counter && (
                  <>
                    <span>Counter: {termsLine(counter)}</span>
                    <Button size="sm" onClick={() => { if (onSignContract(p, counter)) { setCounter(null); setOpenId(null); } }}>
                      Accept counter
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};
