/** S-Rank chase: turns every 0-100 quality score into a rank with near-miss tension.
 * Pure — no imports, no RNG. Wire into ProjectReviewModal + settlement later.
 */

export type ProjectRank = 'D' | 'C' | 'B' | 'A' | 'S' | 'S+';

export interface RankResult {
  rank: ProjectRank;
  /** Points needed to reach the next rank (0 if S+). */
  pointsToNext: number;
  /** Payout multiplier applied to moneyGained. */
  payoutMult: number;
  /** True when within 3 pts below the next threshold — animate the count-up slow. */
  nearMiss: boolean;
  /** Next rank label, null at cap. */
  nextRank: ProjectRank | null;
}

const THRESHOLDS: Array<{ rank: ProjectRank; min: number; payoutMult: number }> = [
  { rank: 'D', min: 0, payoutMult: 0.6 },
  { rank: 'C', min: 30, payoutMult: 0.85 },
  { rank: 'B', min: 55, payoutMult: 1.0 },
  { rank: 'A', min: 80, payoutMult: 1.3 },
  { rank: 'S', min: 90, payoutMult: 1.8 },
  { rank: 'S+', min: 97, payoutMult: 2.5 },
];

export const gradeQuality = (quality: number): RankResult => {
  const q = Math.max(0, Math.min(100, Math.floor(quality)));
  let idx = 0;
  for (let i = 0; i < THRESHOLDS.length; i++) {
    if (q >= THRESHOLDS[i].min) idx = i;
  }
  const current = THRESHOLDS[idx];
  const next = THRESHOLDS[idx + 1] ?? null;
  const pointsToNext = next ? next.min - q : 0;
  return {
    rank: current.rank,
    pointsToNext,
    payoutMult: current.payoutMult,
    nearMiss: next !== null && pointsToNext > 0 && pointsToNext <= 3,
    nextRank: next ? next.rank : null,
  };
};

/** S+ unlocks label/album offers — the Hall-of-Fame chase gate. */
export const unlocksLabelOffer = (quality: number): boolean => quality >= 90;
