import { money } from '@/utils/displayMoney';
import React, { useMemo, useState } from 'react';
import { X, UserRound, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GameState } from '@/types/game';
import {
  ArtistProspect, ContractTerms, NegotiationOutcome, MAX_ROSTER, MIN_DURATION_DAYS, MAX_DURATION_DAYS,
  artistQualityBonus, dailyStudioShare, generateProspects, scoutingBatchDay, PROSPECT_REFRESH_DAYS,
} from '@/simulation/artistContracts';

interface ArtistRosterProps {
  gameState: GameState;
  onMakeOffer: (prospect: ArtistProspect, offer: ContractTerms) => NegotiationOutcome;
  onSignContract: (prospect: ArtistProspect, terms: ContractTerms) => boolean;
  onPass: (prospectId: string) => void;
}

const termsLine = (t: ContractTerms) =>
  `${money(t.advance)} advance · artist keeps ${Math.round(t.artistSplit * 100)}% · ${t.durationDays} days${t.exclusive ? ' · exclusive' : ''}`;

export const ArtistRoster: React.FC<ArtistRosterProps> = ({ gameState, onMakeOffer, onSignContract, onPass }) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ContractTerms | null>(null);
  const [counter, setCounter] = useState<ContractTerms | null>(null);
  const [profile, setProfile] = useState<ArtistProspect | typeof roster[number] | null>(null);

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
        <Card key={a.id} className="group overflow-hidden border-amber-400/15 bg-gradient-to-br from-stone-900/90 to-stone-950/80 p-0 text-sm">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <button type="button" onClick={() => setProfile(a)} className="flex min-w-0 items-center gap-3 text-left">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-300/30 bg-amber-400/10 text-amber-200"><UserRound size={16} /></span>
              <span className="min-w-0"><span className="block truncate font-medium text-white">{a.name}</span><span className="text-xs text-stone-400">{a.genre} · View profile</span></span>
            </button>
            <span className="shrink-0 text-green-400">+${dailyStudioShare(a)}/day</span>
          </div>
          <div className="space-y-1 px-4 py-3">
            <span className="hidden">{a.name} <span className="text-stone-400">· {a.genre}</span></span>
            <span className="text-green-400">+${dailyStudioShare(a)}/day</span>
          </div>
          <div className="space-y-1 px-4 pb-3 text-xs text-stone-400">
            <div>Fame {Math.round(a.fame)} · Skill {a.skill}/10 · {termsLine(a.terms)}</div>
            <div>{Math.max(0, a.expiresDay - gameState.currentDay)} days left · earned ${a.totalEarned} · +{artistQualityBonus([a], a.genre)} quality on {a.genre} sessions</div>
          </div>
        </Card>
      ))}

      <h4 className="pt-2 text-sm font-semibold text-stone-300">
        Scouting report <span className="font-normal text-stone-500">(refreshes in {daysToRefresh} days)</span>
      </h4>
      {visible.length === 0 && <p className="text-sm text-stone-400">No prospects left this week.</p>}
      {profile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label={`${profile.name} profile`}>
          <div className="w-full max-w-md rounded-2xl border border-amber-300/25 bg-stone-950 p-5 shadow-2xl shadow-black/50">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-300/30 bg-amber-400/10 text-amber-200"><UserRound size={22} /></span><div><p className="text-lg font-semibold text-white">{profile.name}</p><p className="text-sm text-amber-200/80">{profile.genre} artist profile</p></div></div>
              <button type="button" onClick={() => setProfile(null)} className="rounded-lg p-1 text-stone-400 hover:bg-white/10 hover:text-white" aria-label="Close profile"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-3 gap-2 py-4 text-center text-xs"><div className="rounded-lg bg-white/5 p-3"><Sparkles className="mx-auto mb-1 text-amber-300" size={15} />Skill<br /><strong className="text-white">{profile.skill}/10</strong></div><div className="rounded-lg bg-white/5 p-3">Fame<br /><strong className="text-white">{profile.fame}</strong></div><div className="rounded-lg bg-white/5 p-3">Deal<br /><strong className="text-white">{termsLine('terms' in profile ? profile.terms : profile.ask)}</strong></div></div>
            <p className="text-sm leading-6 text-stone-300">A promising {profile.genre} act with a distinct voice and room to grow. Review their fit before opening negotiations.</p>
          </div>
        </div>
      )}
      {visible.map(p => (
        <Card key={p.id} className="overflow-hidden border-white/10 bg-stone-900/75 p-0 text-sm transition-colors hover:border-amber-300/30">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <button type="button" onClick={() => setProfile(p)} className="flex min-w-0 items-center gap-3 text-left">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-purple-300/30 bg-purple-400/10 text-purple-200"><UserRound size={16} /></span>
              <span className="min-w-0"><span className="block truncate font-medium text-white">{p.name}</span><span className="text-xs text-stone-400">{p.genre} · View profile</span></span>
            </button>
            <span className="shrink-0 text-xs text-stone-400">Fame {p.fame} · Skill {p.skill}/10</span>
          </div>
          <div className="space-y-1 px-4 py-3">
            <span className="hidden">{p.name} <span className="text-stone-400">· {p.genre}</span></span>
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
