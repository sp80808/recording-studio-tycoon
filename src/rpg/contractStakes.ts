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
