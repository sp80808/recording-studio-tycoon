/**
 * Producer-origin perks — turns the authored origin data into real game effects.
 *
 * Before this module the five origins (perks, attribute bonuses, playstyles) were
 * authored but never read by any mechanic, and no screen let the player pick one.
 * Every effect here is small, pure and applied at exactly one seam:
 *
 *   quality / payout / rep-on-A / skill XP → utils/settlementBonuses → generateProjectReview
 *   upkeep discount                        → hooks/useGameActions (daily expenses)
 *   relationship XP + repeat premium       → game-mechanics/relationship-management, projectUtils
 *   free gig refresh                       → hooks/useGameActions (refreshProjects)
 *   synergy multiplier                     → utils/settlementBonuses
 *
 * Nothing here mutates state.
 */
import type { GameState, PlayerAttributes } from '@/types/game';
import type { ProducerBackgroundId, ProducerOrigin } from '@/types/character';
import { PRODUCER_ORIGINS, applyOriginAttributes, getProducerOrigin } from './characterOrigins';

export const isProducerOriginId = (id: unknown): id is ProducerBackgroundId =>
  typeof id === 'string' && PRODUCER_ORIGINS.some((o) => o.id === id);

/** Loose genre comparison: "Hip-Hop", "hip hop" and "HipHop" are the same genre. */
export const normalizeGenre = (genre: string): string => genre.toLowerCase().replace(/[^a-z0-9]/g, '');

export interface OriginEffects {
  originId: ProducerBackgroundId | null;
  signatureGenres: string[];
  /** Flat quality points added on signature-genre sessions. */
  qualityBonus: number;
  /** Payout multiplier on signature-genre sessions. */
  payoutMultiplier: number;
  /** Extra payout fraction when the genre market is hot. */
  hotMarketPayoutBonus: number;
  /** Extra reputation fraction on A-rank (80+) sessions. */
  rankARepBonus: number;
  /** Multiplier on daily equipment upkeep (1 = no discount). */
  upkeepMultiplier: number;
  relationshipXpMultiplier: number;
  /** Returning-client fee premium (game default 1.1). */
  repeatClientPremium: number;
  freeGigRefresh: boolean;
  /** Multiplier on studio-synergy quality bonuses. */
  synergyMultiplier: number;
  /** Skill XP multipliers keyed by skill name. */
  skillXpMultipliers: Record<string, number>;
}

export const DEFAULT_REPEAT_CLIENT_PREMIUM = 1.1;

export const NEUTRAL_ORIGIN_EFFECTS: OriginEffects = {
  originId: null,
  signatureGenres: [],
  qualityBonus: 0,
  payoutMultiplier: 1,
  hotMarketPayoutBonus: 0,
  rankARepBonus: 0,
  upkeepMultiplier: 1,
  relationshipXpMultiplier: 1,
  repeatClientPremium: DEFAULT_REPEAT_CLIENT_PREMIUM,
  freeGigRefresh: false,
  synergyMultiplier: 1,
  skillXpMultipliers: {},
};

export const getOriginEffectsById = (originId: unknown): OriginEffects => {
  if (!isProducerOriginId(originId)) return NEUTRAL_ORIGIN_EFFECTS;
  const origin: ProducerOrigin = getProducerOrigin(originId);
  const perk = origin.passivePerk;
  const skillXpMultipliers: Record<string, number> = {};
  for (const skill of perk.xpSkills ?? []) skillXpMultipliers[skill] = perk.xpMultiplier ?? 1;
  return {
    originId,
    signatureGenres: [...origin.signatureGenres],
    qualityBonus: perk.qualityBonus ?? 0,
    payoutMultiplier: perk.payoutMultiplier ?? 1,
    hotMarketPayoutBonus: perk.hotMarketPayoutBonus ?? 0,
    rankARepBonus: perk.rankARepBonus ?? 0,
    upkeepMultiplier: 1 - Math.max(0, Math.min(0.9, perk.upkeepDiscount ?? 0)),
    relationshipXpMultiplier: perk.relationshipXpMultiplier ?? 1,
    repeatClientPremium: perk.repeatClientPremium ?? DEFAULT_REPEAT_CLIENT_PREMIUM,
    freeGigRefresh: Boolean(perk.freeGigRefresh),
    synergyMultiplier: perk.synergyMultiplier ?? 1,
    skillXpMultipliers,
  };
};

/** Effects for the current save. Legacy saves without an origin get neutral effects (no surprise nerfs). */
export const getOriginEffects = (state: Pick<GameState, 'playerData'>): OriginEffects =>
  getOriginEffectsById(state.playerData?.originId);

export const isSignatureGenre = (effects: OriginEffects, genre: string): boolean => {
  const g = normalizeGenre(genre);
  return effects.signatureGenres.some((s) => normalizeGenre(s) === g);
};

/** Flat quality points for this session's genre. */
export const originQualityBonus = (effects: OriginEffects, genre: string): number =>
  isSignatureGenre(effects, genre) ? effects.qualityBonus : 0;

/** Payout multiplier for this session (signature genre + optional hot-market bonus). */
export const originPayoutMultiplier = (effects: OriginEffects, genre: string, marketMultiplier = 1): number => {
  let m = isSignatureGenre(effects, genre) ? effects.payoutMultiplier : 1;
  if (effects.hotMarketPayoutBonus > 0 && marketMultiplier >= 1.05) m *= 1 + effects.hotMarketPayoutBonus;
  return m;
};

/** Daily upkeep after the origin discount (never below $1 per owned item, matching the base floor). */
export const applyUpkeepDiscount = (baseUpkeep: number, effects: OriginEffects): number =>
  baseUpkeep <= 0 ? 0 : Math.max(1, Math.round(baseUpkeep * effects.upkeepMultiplier));

/** Cost of chasing new gigs for this producer. */
export const gigRefreshCostFor = (baseCost: number, effects: OriginEffects): number =>
  effects.freeGigRefresh ? 0 : baseCost;

/** Attributes at career start, including the origin's bonus. */
export const startingAttributesFor = (
  base: PlayerAttributes,
  originId: ProducerBackgroundId,
): PlayerAttributes => applyOriginAttributes(base, originId);

/** One line per perk for UI cards — always describes something the game really does. */
export const describeOriginPerks = (originId: ProducerBackgroundId): string[] => {
  const origin = getProducerOrigin(originId);
  const b = origin.startingAttributeBonus;
  const attrLabels: Record<keyof PlayerAttributes, string> = {
    focusMastery: 'Focus',
    creativeIntuition: 'Creativity',
    technicalAptitude: 'Technical',
    businessAcumen: 'Business',
  };
  const attrs = (Object.keys(b) as Array<keyof PlayerAttributes>)
    .filter((k) => (b[k] ?? 0) > 0)
    .map((k) => `+${b[k]} ${attrLabels[k]}`)
    .join(' · ');
  return [origin.passivePerk.description, origin.passivePerk.specialTrait, attrs ? `Starts with ${attrs}` : ''].filter(Boolean);
};
