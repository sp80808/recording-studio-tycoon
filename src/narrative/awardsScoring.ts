/** Golden Reels awards scoring — pure, seeded. Annual ceremony (max 1x / 365 days).
 * Winner roll MUST use createSeededRandom(`reels-${year}-${studioId}`), never Math.random.
 */
import { createSeededRandom } from '@/simulation/seededRandom';

export interface Nominee {
  projectId: string;
  title: string;
  quality: number;
  charted: boolean;
}

export const eligibleNominees = (reports: Nominee[]): Nominee[] =>
  reports.filter((r) => r.quality >= 70).sort((a, b) => b.quality - a.quality).slice(0, 3);

/** Win chance for the player's submission (0-1). Attend > skip; charted helps. */
export const winChance = (
  quality: number,
  opts?: { attend?: boolean; charted?: boolean }
): number => {
  const base = Math.max(0, Math.min(100, quality)) / 100;
  let chance = base * 0.7;
  if (opts?.attend) chance += 0.15;
  if (opts?.charted) chance += 0.1;
  return Math.max(0.05, Math.min(0.95, chance));
};

export const pickWinnerSeeded = (
  nominees: Nominee[],
  seed: string,
  playerChance: number
): { winnerId: string; playerWon: boolean } => {
  if (nominees.length === 0) throw new Error('pickWinnerSeeded needs nominees');
  const rng = createSeededRandom(seed);
  const roll = rng();
  if (roll < playerChance) {
    return { winnerId: nominees[0].projectId, playerWon: true };
  }
  const idx = Math.floor(rng() * nominees.length);
  return { winnerId: nominees[idx].projectId, playerWon: idx === 0 };
};

export const daysUntilNextCeremony = (currentDay: number, lastCeremonyDay: number | null): number => {
  if (lastCeremonyDay === null) return 0;
  return Math.max(0, 365 - (currentDay - lastCeremonyDay));
};
