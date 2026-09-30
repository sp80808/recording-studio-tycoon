/** Contract stakes — the gamble chosen at booking: Safe / Ambitious / Moonshot.
 * Pure; `project.stake` stored at startProject, settled against final rank.
 */
import type { ProjectRank } from '@/rpg/rankChase';

export type ContractStake = 'safe' | 'ambitious' | 'moonshot';

export interface StakeTerms {
  payoutMult: number;
  /** Minimum rank to avoid the failure penalty. */
  needsRank: ProjectRank;
  /** Reputation hit when the rank bar is missed. */
  failRepHit: number;
}

export const STAKE_TERMS: Record<ContractStake, StakeTerms> = {
  safe: { payoutMult: 1.0, needsRank: 'C', failRepHit: 0 },
  ambitious: { payoutMult: 1.6, needsRank: 'A', failRepHit: 5 },
  moonshot: { payoutMult: 2.5, needsRank: 'S', failRepHit: 12 },
};

const RANK_ORDER: ProjectRank[] = ['D', 'C', 'B', 'A', 'S', 'S+'];

export const settleStake = (
  stake: ContractStake,
  finalRank: ProjectRank
): { payoutMult: number; repDelta: number; met: boolean } => {
  const terms = STAKE_TERMS[stake];
  const met =
    RANK_ORDER.indexOf(finalRank) >= RANK_ORDER.indexOf(terms.needsRank);
  return {
    payoutMult: met ? terms.payoutMult : 1.0,
    repDelta: met ? 0 : -terms.failRepHit,
    met,
  };
};

/** Producer level at which each stake opens on the booking board. */
export const STAKE_MIN_LEVEL: Record<ContractStake, number> = { safe: 1, ambitious: 3, moonshot: 6 };

export const STAKE_ORDER: readonly ContractStake[] = ['safe', 'ambitious', 'moonshot'];

export const STAKE_LABEL: Record<ContractStake, string> = {
  safe: 'Safe',
  ambitious: 'Ambitious',
  moonshot: 'Moonshot',
};

export const isStakeUnlocked = (stake: ContractStake, playerLevel: number): boolean =>
  playerLevel >= STAKE_MIN_LEVEL[stake];

/** One factual line for the booking card: what you must hit, what it pays, what a miss costs. */
export const describeStake = (stake: ContractStake): string => {
  const t = STAKE_TERMS[stake];
  if (stake === 'safe') return 'No gamble — standard fee, no penalty.';
  return `Hit ${t.needsRank}-rank for ×${t.payoutMult} fee · miss it and lose ${t.failRepHit} rep.`;
};
