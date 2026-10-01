import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { GameState } from '@/types/game';
import { Button } from '@/components/ui/button';
import GearMaintenanceGame from '@/components/minigames/GearMaintenanceGame';
import CrateUnboxingModal from '@/features/boxDrops/CrateUnboxingModal';
import { toBoxEquipmentItem, type Era } from '@/features/boxDrops/lootGenerator';
import { applyGearAction, maintenanceQuote, type GearAction } from './economy';
import { conditionBand, isMaintainable, reliabilityDescription } from './condition';
import { eraYear, generateCrateGear, resaleValue } from './generation';

export interface StudioRecyclerProps {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>;
}

/** Self-contained shelf/phone integration surface; presentation never owns economy state. */
export function StudioRecycler({ gameState, setGameState }: StudioRecyclerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openCrateId, setOpenCrateId] = useState<string | null>(null);
  const [showCalibration, setShowCalibration] = useState(false);
  const [message, setMessage] = useState('');
  const selected = gameState.ownedEquipment.find(item => item.id === selectedId);
  const job = selected?.maintenance;
  const crate = gameState.pendingCrates?.find(item => item.id === openCrateId);
  const reward = crate ? generateCrateGear(gameState, crate) : undefined;
  const act = (action: GearAction) => {
    setMessage(applyGearAction(gameState, action).message);
    setGameState(prev => applyGearAction(prev, action).state);
  };
  const money = (value: number) => `$${value.toLocaleString()}`;

  return <section aria-label="Studio Recycler" className="rounded-lg border border-gray-700 bg-gray-950/50 p-3 space-y-3 text-sm text-gray-100">
    <h3 className="font-semibold">Studio Recycler · Day {gameState.currentDay}</h3>
    <p className="text-xs text-gray-400">Local used gear. Stock refreshes when the game day advances. Character effects combine to at most ±3 equipment quality points.</p>
    <div className="space-y-2 max-h-72 overflow-y-auto">
      {(gameState.dailyClassifieds?.listings ?? []).map(listing => <article key={listing.id} aria-label={listing.equipment.name} className="rounded border border-gray-700 p-2 space-y-1">
        <p className="font-medium">{listing.equipment.icon} {listing.equipment.name}</p>
        <p className="text-xs">{conditionBand(listing.equipment.condition)} · {listing.equipment.condition}% · {listing.equipment.rarity}</p>
        <p className="text-xs text-gray-300">{listing.equipment.traits.map(trait => trait.description).concat(listing.equipment.quirks.map(quirk => quirk.description)).join(' ') || 'Stock character; no quirks.'}</p>
        <p className="text-xs">Ask {money(listing.askingPrice)} · Estimated resale {money(listing.estimatedValue)} · Retail {money(listing.retailComparisonPrice)}</p>
        <p className="text-xs text-gray-400">{listing.location}. {listing.sellerNotes}</p>
        <Button className="min-h-11" size="sm" disabled={listing.purchased || gameState.money < listing.askingPrice} onClick={() => act({ type: 'buy', listingId: listing.id })}>{listing.purchased ? 'Purchased' : 'Buy used gear'}</Button>
      </article>)}
    </div>
    {!!gameState.pendingCrates?.length && <div className="space-y-2">
      <p className="font-medium">Earned finds</p>
      {gameState.pendingCrates.map(pending => <Button key={pending.id} variant="outline" className="min-h-11" onClick={() => setOpenCrateId(pending.id)}>Open earned case · {pending.source.replace(/_/g, ' ')}</Button>)}
    </div>}
    {!!gameState.caseFinds?.length && <div className="space-y-2" aria-label="Stashed case finds">
      <p className="font-medium">Stashed case finds</p>
      {gameState.caseFinds.map(find => <div key={find.id} className="rounded border border-gray-700 p-2 space-y-1">
        <p className="text-xs">{find.name} · {find.condition}% · {find.rarity} · est. {money(find.baseValue)}</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="min-h-11" onClick={() => act({ type: 'claimFind', findId: find.id, disposition: 'keep' })}>Equip</Button>
          <Button size="sm" variant="outline" className="min-h-11" onClick={() => act({ type: 'claimFind', findId: find.id, disposition: 'sell' })}>Sell</Button>
        </div>
      </div>)}
    </div>}
    <label className="block space-y-1">
      <span>Your gear</span>
      <select className="w-full min-h-11 rounded bg-gray-900 border border-gray-600 p-2" value={selectedId ?? ''} onChange={event => { setSelectedId(event.target.value || null); setShowCalibration(false); setMessage(''); }}>
        <option value="">Choose gear to inspect / maintain / sell</option>
        {gameState.ownedEquipment.map(item => <option key={item.id} value={item.id}>{item.name} · {item.condition.toFixed(1)}%</option>)}
      </select>
    </label>
    {selected && <div className="space-y-2" aria-label="Gear inspection">
      <p>{selected.name} · {conditionBand(selected.condition)} · {selected.condition.toFixed(1)}%</p>
      <p className="text-xs">{reliabilityDescription(selected, gameState.currentDay)}</p>
      <p className="text-xs text-gray-400">{selected.sellerLore ?? 'Your studio equipment.'} Resale {money(resaleValue(selected))}.</p>
      <p className="text-xs">{selected.traits?.map(trait => trait.description).concat(selected.quirks?.map(quirk => quirk.description) ?? []).join(' ')}</p>
      {gameState.hiredStaff.filter(staff => staff.equipmentFamiliarity?.[selected.id]).map(staff => <p className="text-xs" key={staff.id}>{staff.name} familiarity {staff.equipmentFamiliarity![selected.id]}/5 · up to 20% less wear</p>)}
      <Button size="sm" className="min-h-11" variant="outline" onClick={() => act({ type: 'inspect', equipmentId: selected.id })}>{selected.inspected ? 'Inspected' : 'Inspect'}</Button>
      {isMaintainable(selected) && !job && <div className="space-y-2">
        {(['service', 'repair'] as const).map(kind => {
          const quote = maintenanceQuote(selected, kind);
          const noWork = quote.improvement === 0 && !selected.quirks?.length && !selected.fault;
          return <div key={kind} className="text-xs space-y-1">
            <p className="capitalize">{kind}: {money(quote.cost)} · +{quote.improvement.toFixed(1)} condition → {quote.conditionAfter.toFixed(1)}% · {quote.downtimeDays} day(s) unavailable · clears dirty contacts</p>
            <Button size="sm" className="min-h-11 capitalize" disabled={noWork || gameState.money < quote.cost} onClick={() => act({ type: 'maintain', equipmentId: selected.id, kind })}>{kind}</Button>
          </div>;
        })}
        {(() => { const quote = maintenanceQuote(selected, 'service', 'hands-on'); return <div className="text-xs space-y-1">
          <p>Hands-on service: {money(quote.cost)}, 1 energy. All 3 dials must pass for +{quote.improvement.toFixed(1)} condition and +35 producer / tracking XP, then 1 day unavailable. Failure spends parts with no gain.</p>
          <Button size="sm" variant="outline" className="min-h-11" disabled={gameState.money < quote.cost || gameState.playerData.dailyWorkCapacity < 1 || (quote.improvement === 0 && !selected.quirks?.length && !selected.fault)} onClick={() => { act({ type: 'maintain', equipmentId: selected.id, kind: 'service', mode: 'hands-on' }); setShowCalibration(true); }}>Hands-on service</Button>
        </div>; })()}
      </div>}
      {job?.status === 'calibrating' && <Button size="sm" className="min-h-11" onClick={() => setShowCalibration(true)}>Resume calibration</Button>}
      {job?.status === 'calibrating' && showCalibration && <GearMaintenanceGame key={job.id} equipment={selected} seed={job.id} minigameId="gearMaintenance" onClose={() => setShowCalibration(false)} onComplete={success => { act({ type: 'calibrate', equipmentId: selected.id, jobId: job.id, success }); setShowCalibration(false); }} />}
      <div><Button size="sm" variant="destructive" className="min-h-11" disabled={!!job} onClick={() => act({ type: 'sell', equipmentId: selected.id })}>Sell / retire · {money(resaleValue(selected))}</Button></div>
    </div>}
    <p role="status" className="text-xs text-amber-200">{message}</p>
    {crate && reward && <CrateUnboxingModal key={crate.id} items={[toBoxEquipmentItem(reward, `${Math.floor(eraYear(crate.era, gameState.currentYear) / 10) * 10}s` as Era)]} onClose={() => setOpenCrateId(null)} onClaim={(_, action) => act({ type: 'claim', crateId: crate.id, disposition: action === 'sell' ? 'sell' : 'keep' })} />}
  </section>;
}
