/**
 * Settlement bonuses that come from *who you are* and *how your studio is set up*,
 * shared by both settlement paths (the foreground review in pages/Index and the
 * background ProjectService).
 *
 * This also fixes a long-standing gap: studio synergies advertised "+N Quality" in the
 * UI, but `reviewQualityBonus` was never passed into scoring, so the promise was never kept.
 */
import type { GameState, Project } from '@/types/game';
import { getOriginEffects, originPayoutMultiplier, originQualityBonus } from '@/narrative/originPerks';
import { artistQualityBonus } from '@/simulation/artistContracts';
import { calculateSynergyBonuses, evaluateProjectSynergies } from '@/utils/synergyUtils';

export interface SettlementBonuses {
  /** Flat quality points (0-12) from active studio synergies, after any origin boost. */
  synergyQualityBonus: number;
  /** Flat quality points (0-12) from the producer's origin on this genre. */
  originQualityBonus: number;
  /** Flat quality points (0-8) from signed A&R artists working the session. */
  artistQualityBonus: number;
  /** Extra payout multiplier from the origin. */
  payoutMultiplier: number;
  /** Skill XP multipliers keyed by skill name. */
  skillXpMultipliers: Record<string, number>;
  /** Extra reputation fraction on A-rank (80+) sessions. */
  rankARepBonus: number;
}

export const getSettlementBonuses = (
  state: GameState,
  project: Project,
  marketMultiplier = 1,
): SettlementBonuses => {
  const effects = getOriginEffects(state);
  const synergies = evaluateProjectSynergies(project, state);
  const baseSynergy = calculateSynergyBonuses(synergies).reviewQualityBonus;
  return {
    synergyQualityBonus: Math.min(12, Math.round(baseSynergy * effects.synergyMultiplier)),
    originQualityBonus: originQualityBonus(effects, project.genre),
    artistQualityBonus: artistQualityBonus(state.signedArtists, project.genre),
    payoutMultiplier: originPayoutMultiplier(effects, project.genre, marketMultiplier),
    skillXpMultipliers: effects.skillXpMultipliers,
    rankARepBonus: effects.rankARepBonus,
  };
};
