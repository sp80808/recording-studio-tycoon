// Flight case + gem economy. Pure and immutable: every function takes a
// GameState and returns a new one. Gems are an in-game soft currency; the
// real-money pack path is a disabled stub (see GEM_PACKS) — no payment code.
// Loot is rolled from the disclosed odds (getCaseOdds) and handed back as
// EquipmentItem[] for the existing unboxing flow. This module never touches
// ownedEquipment (the used-gear economy owns that).

import type { GameState } from '@/types/game';
import {
  FLIGHT_CASES,
  FLIGHT_CASE_TIER_ORDER,
  legacyTierToFlightCase,
  type FlightCaseTier,
} from '@/data/flightCases';
import {
  LOOT_TABLE,
  type Era,
  type EquipmentItem,
  type Rarity,
} from '@/features/boxDrops/lootGenerator';
import { createSeededRandom, randomInt, type RandomSource } from '@/simulation/seededRandom';

export type PendingCrate = NonNullable<GameState['pendingCrates']>[number];
export type CaseSource = PendingCrate['source'];
export type Currency = 'money' | 'gems';

/** Prices are per tier; a missing currency means the case is not sold for it. */
export const FLIGHT_CASE_PRICES: Record<FlightCaseTier, { money?: number; gems?: number }> = {
  cardboard_box: { money: 150, gems: 10 },
  road_case: { money: 600, gems: 30 },
  tour_trunk: { money: 2500, gems: 100 },
  vintage_flight_case: { money: 5000, gems: 160 },
  holy_grail_vault: { gems: 500 },
};

/** Stub only: no provider wired, never grants gems. */
export const GEM_PACKS = [
  { id: 'gems_small', gems: 60, available: false },
  { id: 'gems_medium', gems: 350, available: false },
  { id: 'gems_large', gems: 800, available: false },
] as const;

export interface RewardBundle {
  money?: number;
  gems?: number;
  cases?: Array<{ tier: FlightCaseTier; source?: CaseSource }>;
}

export const getGems = (state: GameState): number => state.gems ?? 0;

export function isCaseUnlocked(state: GameState, tier: FlightCaseTier): boolean {
  return state.currentDay >= FLIGHT_CASES[tier].unlockDay;
}

export function resolveCrateTier(crate: PendingCrate): FlightCaseTier {
  return crate.tier === 'standard' || crate.tier === 'vintage_flight_case'
    ? legacyTierToFlightCase(crate.tier)
    : crate.tier;
}

function nextCrateId(state: GameState, tag: string): string {
  const n = state.pendingCrates?.length ?? 0;
  return `crate-${tag}-d${state.currentDay}-${n}-${Math.floor((state.money + (state.gems ?? 0)) % 9973)}`;
}

export function awardCase(state: GameState, tier: FlightCaseTier, source: CaseSource): GameState {
  const crate: PendingCrate = {
    id: nextCrateId(state, source),
    era: state.selectedEra || '1970s',
    source,
    tier,
  };
  return { ...state, pendingCrates: [...(state.pendingCrates ?? []), crate] };
}

export function grantGems(state: GameState, amount: number): GameState {
  if (!Number.isFinite(amount) || amount <= 0) return state;
  return { ...state, gems: getGems(state) + Math.floor(amount) };
}

/**
 * Reward hook for chart placements, mini-games and other scenes: apply a
 * bundle atomically. Returns the new state plus what was actually granted.
 */
export function grantRewardBundle(
  state: GameState,
  bundle: RewardBundle,
): { state: GameState; granted: RewardBundle } {
  let next = state;
  const money = Math.max(0, Math.floor(bundle.money ?? 0));
  if (money > 0) next = { ...next, money: next.money + money };
  next = grantGems(next, bundle.gems ?? 0);
  for (const c of bundle.cases ?? []) next = awardCase(next, c.tier, c.source ?? 'reward');
  return { state: next, granted: { ...bundle, money, gems: Math.max(0, Math.floor(bundle.gems ?? 0)) } };
}

/** Default reward table: chart position 1 is the big payoff. */
export function rewardForChartPlacement(position: number): RewardBundle {
  if (position <= 1) return { gems: 25, cases: [{ tier: 'tour_trunk' }] };
  if (position <= 5) return { gems: 12, cases: [{ tier: 'road_case' }] };
  if (position <= 10) return { gems: 6 };
  if (position <= 40) return { gems: 2 };
  return {};
}

export function rewardForMinigame(grade: 'S' | 'A' | 'B' | 'C'): RewardBundle {
  if (grade === 'S') return { gems: 3, cases: [{ tier: 'road_case' }] };
  if (grade === 'A') return { gems: 2 };
  if (grade === 'B') return { gems: 1 };
  return {};
}

export type PurchaseResult =
  | { ok: true; state: GameState }
  | { ok: false; reason: 'locked' | 'not_sold' | 'insufficient_funds' };

export function buyFlightCase(state: GameState, tier: FlightCaseTier, currency: Currency): PurchaseResult {
  const price = FLIGHT_CASE_PRICES[tier][currency];
  if (price == null) return { ok: false, reason: 'not_sold' };
  if (!isCaseUnlocked(state, tier)) return { ok: false, reason: 'locked' };
  const balance = currency === 'money' ? state.money : getGems(state);
  if (balance < price) return { ok: false, reason: 'insufficient_funds' };
  const paid: GameState =
    currency === 'money' ? { ...state, money: state.money - price } : { ...state, gems: balance - price };
  return { ok: true, state: awardCase(paid, tier, currency === 'money' ? 'shop_money' : 'shop_gems') };
}

const RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'vintage', 'legendary'];
const RARITY_RANK = Object.fromEntries(RARITIES.map((r, i) => [r, i])) as Record<Rarity, number>;
/** Minimum rarity one item in the case is guaranteed to reach. */
const GUARANTEE: Partial<Record<FlightCaseTier, Rarity>> = { tour_trunk: 'rare', holy_grail_vault: 'vintage' };

function eraEntries(era: Era) {
  return LOOT_TABLE[era].map((e) => e.item);
}

function weightedPick(tier: FlightCaseTier, era: Era, rng: RandomSource, minRarity?: Rarity) {
  const mult = FLIGHT_CASES[tier].loot.rarityWeights;
  const pool = eraEntries(era)
    .filter((i) => !minRarity || RARITY_RANK[i.rarity] >= RARITY_RANK[minRarity])
    .map((i) => ({ i, w: i.weight * mult[i.rarity] }))
    .filter((p) => p.w > 0);
  // Some eras have no entry at the guaranteed rarity; fall back to the full table.
  if (pool.length === 0) return minRarity ? weightedPick(tier, era, rng) : eraEntries(era)[0];
  let t = rng() * pool.reduce((s, p) => s + p.w, 0);
  for (const p of pool) {
    t -= p.w;
    if (t <= 0) return p.i;
  }
  return pool[pool.length - 1].i;
}

/** Disclosed per-item odds (percent) for a case in an era, for display before buying/opening. */
export function getCaseOdds(tier: FlightCaseTier, era: Era) {
  const mult = FLIGHT_CASES[tier].loot.rarityWeights;
  const rows = eraEntries(era).map((i) => ({ name: i.name, rarity: i.rarity, w: i.weight * mult[i.rarity] }));
  const total = rows.reduce((s, r) => s + r.w, 0) || 1;
  return rows
    .filter((r) => r.w > 0)
    .map((r) => ({ name: r.name, rarity: r.rarity, pct: Math.round((r.w / total) * 1000) / 10 }))
    .sort((a, b) => b.pct - a.pct);
}

export function getCaseGuarantee(tier: FlightCaseTier): Rarity | undefined {
  return GUARANTEE[tier];
}

/** Deterministic roll for a crate; same save seed + crate id always opens the same. */
export function rollCaseContents(
  state: GameState,
  crate: PendingCrate,
): EquipmentItem[] {
  const tier = resolveCrateTier(crate);
  const def = FLIGHT_CASES[tier].loot;
  const rng = createSeededRandom(`${state.saveSeed ?? 'rst'}:${crate.id}`);
  const fallbackEra: Era = crate.era in LOOT_TABLE ? (crate.era as Era) : '1970s';
  const count = randomInt(rng, def.itemCount[0], def.itemCount[1]);
  const guarantee = GUARANTEE[tier];
  const items: EquipmentItem[] = [];
  for (let n = 0; n < count; n++) {
    const era: Era =
      def.eraBias && rng() < 0.6 ? def.eraBias[Math.floor(rng() * def.eraBias.length)] : fallbackEra;
    const needsGuarantee =
      guarantee && n === count - 1 && !items.some((it) => RARITY_RANK[it.rarity] >= RARITY_RANK[guarantee]);
    const pick = weightedPick(tier, era, rng, needsGuarantee ? guarantee : undefined);
    const condition = randomInt(rng, def.minCondition, def.maxCondition);
    items.push({
      id: `${crate.id}-${n}`,
      name: pick.name,
      era: pick.era,
      rarity: pick.rarity,
      condition,
      baseValue: Math.round(pick.baseValue * def.valueMultiplier),
    });
  }
  return items;
}

/** Remove a pending crate and return its contents. Unknown id is a no-op. */
export function openFlightCase(
  state: GameState,
  crateId: string,
): { state: GameState; items: EquipmentItem[] } {
  const crate = state.pendingCrates?.find((c) => c.id === crateId);
  if (!crate) return { state, items: [] };
  return {
    state: { ...state, pendingCrates: state.pendingCrates!.filter((c) => c.id !== crateId) },
    items: rollCaseContents(state, crate),
  };
}

export const SHOP_TIERS = FLIGHT_CASE_TIER_ORDER;
