/** Pure helpers for reward juice (pop-ups, loot travel). No RNG: variance derives from ids. */
export type RewardKind = 'money' | 'xp';
export type RewardTier = 'small' | 'medium' | 'big' | 'jackpot';

const THRESHOLDS: Record<RewardKind, [number, number, number]> = {
  money: [150, 600, 2500],
  xp: [25, 80, 250],
};

export function rewardTier(kind: RewardKind, amount: number): RewardTier {
  const [medium, big, jackpot] = THRESHOLDS[kind];
  if (amount >= jackpot) return 'jackpot';
  if (amount >= big) return 'big';
  if (amount >= medium) return 'medium';
  return 'small';
}

const COIN_COUNT: Record<RewardTier, number> = { small: 1, medium: 3, big: 5, jackpot: 8 };
const POP_SCALE: Record<RewardTier, number> = { small: 1, medium: 1.15, big: 1.35, jackpot: 1.6 };

/** Loot dots launched per gain. `lite` (reduced motion / low preset) collapses to a single chip. */
export const rewardCoinCount = (tier: RewardTier, lite: boolean): number => (lite ? 1 : COIN_COUNT[tier]);
export const rewardPopScale = (tier: RewardTier): number => POP_SCALE[tier];

export interface Point { x: number; y: number }

/**
 * Keyframes for one loot dot on a quadratic-ish arc: burst up and sideways from the source,
 * then sweep into the HUD target. Index spreads siblings into a fan.
 */
export function lootArc(from: Point, to: Point, index: number, count: number, seed: number) {
  const fan = count > 1 ? index / (count - 1) - 0.5 : 0; // -0.5..0.5
  const jitter = ((seed * 31 + index * 17) % 13) / 13 - 0.5;
  const burstX = from.x + fan * 140 + jitter * 18;
  const burstY = from.y - 46 - Math.abs(fan) * 22 - ((seed * 7 + index * 5) % 14);
  const midX = (burstX + to.x) / 2;
  const midY = Math.min(burstY, to.y) - 24;
  return { x: [from.x, burstX, midX, to.x], y: [from.y, burstY, midY, to.y] };
}

export const lootDuration = (seed: number, index: number): number => 0.85 + ((seed * 53 + index * 11) % 25) / 100;
export const lootDelay = (index: number): number => index * 0.06;

export const formatGain = (kind: RewardKind, amount: number): string =>
  `+${kind === 'money' ? '$' : ''}${Math.round(amount).toLocaleString('en-US')}${kind === 'xp' ? ' XP' : ''}`;

export const isLevelUp = (beforeLevel: number, afterLevel: number): boolean =>
  Number.isFinite(beforeLevel) && Number.isFinite(afterLevel) && afterLevel > beforeLevel && afterLevel - beforeLevel <= 100;

/** Take grades that earn a bigger on-spot callout. */
export function takePopTier(grade: string): RewardTier {
  return grade === 'Platinum' ? 'jackpot' : grade === 'Gold' ? 'big' : grade === 'Silver' ? 'medium' : 'small';
}

export const REWARD_POP_EVENT = 'rst:reward-pop';
export interface RewardPopDetail { label: string; tier: RewardTier; tone?: 'gold' | 'silver' | 'plain' }
