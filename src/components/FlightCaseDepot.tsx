import React, { useState } from 'react';
import { Gem, Package } from 'lucide-react';
import type { GameState } from '@/types/game';
import { FLIGHT_CASES } from '@/data/flightCases';
import type { Era } from '@/features/boxDrops/lootGenerator';
import { useBoxDropsStore } from '@/features/boxDrops/boxDropsStore';
import {
  FLIGHT_CASE_PRICES,
  GEM_PACKS,
  SHOP_TIERS,
  buyFlightCase,
  getCaseGuarantee,
  getCaseOdds,
  getGems,
  isCaseUnlocked,
  openFlightCase,
  resolveCrateTier,
  type Currency,
} from '@/economy/flightCaseEconomy';

interface Props {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

/** Earned cases to open, plus a shop that sells cases for money or gems with disclosed odds. */
export function FlightCaseDepot({ gameState, setGameState }: Props) {
  const showItems = useBoxDropsStore((s) => s.showItems);
  const [oddsTier, setOddsTier] = useState<(typeof SHOP_TIERS)[number] | null>(null);
  const era = (gameState.selectedEra in { '1960s': 1, '1970s': 1, '1980s': 1, '1990s': 1, '2000s': 1, '2010s': 1, '2020s': 1 }
    ? gameState.selectedEra
    : '1970s') as Era;
  const pending = gameState.pendingCrates ?? [];

  const open = (crateId: string) => {
    const { items } = openFlightCase(gameState, crateId);
    if (!items.length) return;
    setGameState((prev) => openFlightCase(prev, crateId).state);
    showItems(items, (item, action) =>
      setGameState((prev) =>
        action === 'sell'
          ? { ...prev, money: prev.money + item.baseValue }
          : { ...prev, caseFinds: [...(prev.caseFinds ?? []), { ...item }] },
      ),
    );
  };

  const buy = (tier: (typeof SHOP_TIERS)[number], currency: Currency) =>
    setGameState((prev) => {
      const res = buyFlightCase(prev, tier, currency);
      return res.ok ? res.state : prev;
    });

  return (
    <div className="flex flex-col gap-4 p-1 text-stone-100" data-testid="flight-case-depot">
      <div className="flex items-center justify-between rounded-md border border-stone-700 bg-stone-900/70 px-3 py-2">
        <span className="font-semibold">Flight Case Depot</span>
        <span className="flex items-center gap-1 text-cyan-300" aria-label={`${getGems(gameState)} gems`}>
          <Gem size={16} aria-hidden="true" />{getGems(gameState)}
        </span>
      </div>

      <section aria-label="Cases waiting to be opened">
        <h3 className="mb-2 text-sm uppercase tracking-wide text-stone-400">Waiting to open ({pending.length})</h3>
        {pending.length === 0 && <p className="text-sm text-stone-400">Earn cases from S-grade sessions, chore streaks and charts, or buy one below.</p>}
        <div className="grid gap-2">
          {pending.map((crate) => {
            const def = FLIGHT_CASES[resolveCrateTier(crate)];
            return (
              <button key={crate.id} className="rst-btn justify-between" onClick={() => open(crate.id)}>
                <span><span aria-hidden="true">{def.icon}</span> {def.name}</span>
                <span className="text-xs text-stone-400">Open</span>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-label="Flight case shop">
        <h3 className="mb-2 text-sm uppercase tracking-wide text-stone-400">Shop</h3>
        <div className="grid gap-2">
          {SHOP_TIERS.map((tier) => {
            const def = FLIGHT_CASES[tier];
            const price = FLIGHT_CASE_PRICES[tier];
            const unlocked = isCaseUnlocked(gameState, tier);
            return (
              <div key={tier} className="rounded-md border border-stone-700 bg-stone-900/60 p-2">
                <div className="flex items-center justify-between gap-2">
                  <span><span aria-hidden="true">{def.icon}</span> {def.name}</span>
                  <button className="text-xs underline text-stone-400" onClick={() => setOddsTier(oddsTier === tier ? null : tier)}>
                    {oddsTier === tier ? 'Hide odds' : 'Contents & odds'}
                  </button>
                </div>
                {!unlocked && <p className="text-xs text-amber-300">Unlocks on day {def.unlockDay}</p>}
                {oddsTier === tier && (
                  <div className="mt-2 text-xs text-stone-300">
                    <p>{def.loot.itemCount[0] === def.loot.itemCount[1] ? def.loot.itemCount[0] : `${def.loot.itemCount[0]}–${def.loot.itemCount[1]}`} item(s), condition {def.loot.minCondition}–{def.loot.maxCondition}%{getCaseGuarantee(tier) ? `, at least one ${getCaseGuarantee(tier)} or better` : ''}.</p>
                    <ul className="mt-1">
                      {getCaseOdds(tier, era).map((o) => (
                        <li key={o.name} className="flex justify-between"><span>{o.name} ({o.rarity})</span><span>{o.pct}%</span></li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-2 flex gap-2">
                  {price.money != null && (
                    <button className="rst-btn" disabled={!unlocked || gameState.money < price.money} onClick={() => buy(tier, 'money')}>
                      <Package size={15} aria-hidden="true" />${price.money.toLocaleString()}
                    </button>
                  )}
                  {price.gems != null && (
                    <button className="rst-btn" disabled={!unlocked || getGems(gameState) < price.gems} onClick={() => buy(tier, 'gems')}>
                      <Gem size={15} aria-hidden="true" />{price.gems}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section aria-label="Gem packs">
        <h3 className="mb-2 text-sm uppercase tracking-wide text-stone-400">Gem packs</h3>
        <div className="flex flex-wrap gap-2">
          {GEM_PACKS.map((p) => (
            <button key={p.id} className="rst-btn" disabled title="Coming soon">
              <Gem size={15} aria-hidden="true" />{p.gems}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-stone-500">Gem packs are not available yet. Gems are earned in play for now.</p>
      </section>
    </div>
  );
}

export default FlightCaseDepot;
