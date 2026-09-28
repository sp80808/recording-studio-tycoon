/** Comeback detector — slump rescue offers. Pure predicate, no state writes.
 * Re-arms after 21 days; offers expire in 7. Cannot be farmed by rejecting
 * good contracts (requires genuine slump signals).
 */

export type ComebackKind = 'loyal-regular' | 'redemption-rush' | 'ghost-produce';

export interface SlumpInput {
  reputation: number;
  peakReputation: number;
  daysSinceProject: number;
  consecutiveLowScores: number; // projects < 40 quality in a row
  currentDay: number;
  lastOfferDay: number | null;
}

export interface ComebackOffer {
  kind: ComebackKind;
  expiresInDays: number;
  reason: string;
}

const REARM_DAYS = 21;
const EXPIRY_DAYS = 7;

export const detectSlump = (input: SlumpInput): ComebackOffer | null => {
  if (input.lastOfferDay !== null && input.currentDay - input.lastOfferDay < REARM_DAYS) {
    return null;
  }
  const repCrashed = input.peakReputation > 50 && input.reputation < 30;
  const idleTooLong = input.daysSinceProject >= 14;
  const flopStreak = input.consecutiveLowScores >= 2;

  if (repCrashed) {
    return { kind: 'redemption-rush', expiresInDays: EXPIRY_DAYS, reason: 'reputation crashed from peak' };
  }
  if (flopStreak) {
    return { kind: 'loyal-regular', expiresInDays: EXPIRY_DAYS, reason: 'consecutive low scores' };
  }
  if (idleTooLong) {
    return { kind: 'ghost-produce', expiresInDays: EXPIRY_DAYS, reason: 'no completions for 14+ days' };
  }
  return null;
};
