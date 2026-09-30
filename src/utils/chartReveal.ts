/**
 * chartReveal.ts — pure model for the chart-position reveal and payoff scene.
 * Later-game only; the scene component just plays what this produces.
 */
import { createSeededRandom } from '@/simulation/seededRandom';

/** Player level at which reveal scenes start replacing plain toasts. */
export const REVEAL_MIN_LEVEL = 5;
/** Minigame raw score (0-1000 scale) that counts as a celebrated success. */
export const MINIGAME_SUCCESS_SCORE = 700;

export type PayoffTier = 'top1' | 'top10' | 'top40' | 'chart';

export const isRevealUnlocked = (playerLevel: number): boolean => playerLevel >= REVEAL_MIN_LEVEL;

export const payoffTierForPosition = (position: number): PayoffTier =>
  position <= 1 ? 'top1' : position <= 10 ? 'top10' : position <= 40 ? 'top40' : 'chart';

/**
 * Positions the ticker flashes through before landing. Counts down from a
 * plausible "start" toward the final position, slowing near the end, with a
 * deterministic fake-out just below the landing spot for suspense.
 */
export function buildRevealSteps(finalPosition: number, seed: string, startPosition = 100): number[] {
  const rng = createSeededRandom(seed);
  const final = Math.max(1, Math.round(finalPosition));
  const start = Math.max(final, Math.round(startPosition));
  const steps: number[] = [];
  let pos = start;
  while (pos - final > 12) {
    pos -= Math.max(1, Math.floor((pos - final) * (0.25 + rng() * 0.2)));
    steps.push(pos);
  }
  if (final > 1 && rng() < 0.5) steps.push(Math.max(1, final - 1 - Math.floor(rng() * 2)));
  steps.push(final);
  return steps;
}

/** Delay (ms) before the next step: slows as it nears the end. */
export const stepDelayMs = (index: number, total: number): number =>
  index >= total - 1 ? 0 : 90 + Math.round(Math.pow(index / Math.max(1, total - 1), 2) * 520);

/** Extra items another system (e.g. flight cases, gems) can add to the payoff. */
export interface RewardMoment {
  source: 'chart' | 'minigame';
  tier: PayoffTier;
  position?: number;
  score?: number;
}
export interface RewardItem { id: string; label: string; icon?: string }
export type RewardProvider = (moment: RewardMoment) => RewardItem[];

const providers = new Set<RewardProvider>();
/** Plug-in point: the returned items render in the payoff scene. Returns unregister. */
export function registerRewardProvider(provider: RewardProvider): () => void {
  providers.add(provider);
  return () => { providers.delete(provider); };
}
export function collectRewardItems(moment: RewardMoment): RewardItem[] {
  const out: RewardItem[] = [];
  providers.forEach(p => { try { out.push(...p(moment)); } catch { /* a bad provider must not break the scene */ } });
  return out;
}
