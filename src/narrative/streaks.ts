/** Daily streaks — "one more day" retention on top of deterministic challenges.
 * Pure helpers; no RNG, no dates. Missed day resets to 0 (never negative);
 * one banked shield (earned at 7d) auto-consumes to preserve the streak.
 */

export interface StreakState {
  streakCount?: number | null;
  lastStreakDay?: number | null;
  streakShield?: number | null;
  challengeDoneId?: string | null;
  day?: number | null;
}

export interface StreakRollover {
  streakCount: number;
  lastStreakDay: number | null;
  streakShield: number;
}

/** Ladder bonuses paid atomically on the completing tick (money only). */
export const STREAK_BONUSES: Record<number, number> = {
  3: 500,
  7: 1000,
  14: 2000,
};

export const streakOf = (s: StreakState): StreakRollover => ({
  streakCount: s.streakCount ?? 0,
  lastStreakDay: s.lastStreakDay ?? null,
  streakShield: Math.min(1, Math.max(0, s.streakShield ?? 0)),
});

/** Day rollover: carry streak forward; a missed yesterday resets (or burns shield). */
export const rolloverStreak = (
  prev: StreakState | undefined,
  newDay: number
): StreakRollover => {
  const base = streakOf(prev ?? {});
  if (!prev || prev.day === newDay) return base;
  const missedYesterday = prev.day === newDay - 1 && !prev.challengeDoneId;
  // Multi-day catch-up gaps count as a miss too (prev.day < newDay - 1 with
  // last completion older than yesterday → streak already broken).
  const gapMiss =
    prev.day !== null &&
    prev.day !== undefined &&
    prev.day < newDay - 1 &&
    (base.lastStreakDay === null || base.lastStreakDay < newDay - 1);
  if ((missedYesterday || gapMiss) && base.streakCount > 0) {
    if (base.streakShield > 0) {
      return { ...base, streakShield: 0 };
    }
    return { ...base, streakCount: 0 };
  }
  return base;
};

/** Streak after today's challenge completes (called once — challengeDoneId guards). */
export const completeStreak = (
  current: StreakRollover,
  day: number
): StreakRollover & { bonus: number; bankedShield: boolean } => {
  const continued = current.lastStreakDay === day - 1;
  const streakCount = continued ? current.streakCount + 1 : 1;
  const bonus = STREAK_BONUSES[streakCount] ?? 0;
  const bankedShield = streakCount === 7 && current.streakShield === 0;
  return {
    streakCount,
    lastStreakDay: day,
    streakShield: bankedShield ? 1 : current.streakShield,
    bonus,
    bankedShield,
  };
};
