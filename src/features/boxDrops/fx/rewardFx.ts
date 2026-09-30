/**
 * Renderer-independent reward FX policy (#80). Presentation only: never rolls rewards,
 * changes rarity or touches inventory.
 */
import type { Rarity } from '@/features/boxDrops/lootGenerator';
import { createSeededRandom } from '@/simulation/seededRandom';

export type RewardFxIntensity = 'low' | 'medium' | 'high';
export type RewardFxPreset = 'foam' | 'sparks' | 'tape' | 'motes' | 'vintage-warm' | 'rare-cyan' | 'legendary-gold';

export interface RewardFxRequest {
  preset: RewardFxPreset;
  seed?: number;
  intensity: RewardFxIntensity;
  durationMs: number;
}

/** Hard ceiling: no routine reward effect runs longer than this after the reveal. */
export const REWARD_FX_MAX_MS = 4000;

export interface RarityFxPolicy {
  sweep: boolean;
  burst: { preset: RewardFxPreset; count: number; durationMs: number } | null;
  familyFlourish: boolean;
}

/** Per-rarity effect budget. Duration/intensity never implies better odds. */
export const RARITY_FX_POLICY: Readonly<Record<Rarity, RarityFxPolicy>> = {
  common: { sweep: false, burst: null, familyFlourish: false },
  uncommon: { sweep: true, burst: null, familyFlourish: false },
  rare: { sweep: true, burst: { preset: 'rare-cyan', count: 18, durationMs: 700 }, familyFlourish: false },
  vintage: { sweep: true, burst: { preset: 'vintage-warm', count: 24, durationMs: 900 }, familyFlourish: true },
  legendary: { sweep: true, burst: { preset: 'legendary-gold', count: 42, durationMs: 1200 }, familyFlourish: true },
};

export type GearFamily =
  | 'tape-reel' | 'tube' | 'solid-state-rack' | 'digital' | 'microphone' | 'synth' | 'console' | 'monitor';

export interface GearFamilyAccent {
  family: GearFamily;
  accent: 'reels' | 'filament' | 'led-bar' | 'pulse-ring';
  cycles: number; // bounded loop count before settling static
}

export const GEAR_FAMILY_ACCENTS: Readonly<Record<GearFamily, GearFamilyAccent>> = {
  'tape-reel': { family: 'tape-reel', accent: 'reels', cycles: 3 },
  tube: { family: 'tube', accent: 'filament', cycles: 3 },
  'solid-state-rack': { family: 'solid-state-rack', accent: 'led-bar', cycles: 3 },
  digital: { family: 'digital', accent: 'led-bar', cycles: 2 },
  microphone: { family: 'microphone', accent: 'pulse-ring', cycles: 2 },
  synth: { family: 'synth', accent: 'led-bar', cycles: 3 },
  console: { family: 'console', accent: 'led-bar', cycles: 3 },
  monitor: { family: 'monitor', accent: 'pulse-ring', cycles: 2 },
};

const NAME_HINTS: ReadonlyArray<[RegExp, GearFamily]> = [
  [/tape|reel/i, 'tape-reel'],
  [/tube|valve/i, 'tube'],
  [/mic|ribbon|condenser/i, 'microphone'],
  [/synth|keys|organ/i, 'synth'],
  [/console|desk|mixer/i, 'console'],
  [/monitor|speaker|auratone/i, 'monitor'],
  [/digital|adc|interface|converter/i, 'digital'],
];

/** Prefer an explicit family on the item; fall back to name hints, then era/rarity. */
export const resolveGearFamily = (item: { family?: GearFamily; name: string; era?: string; rarity?: Rarity }): GearFamily => {
  if (item.family) return item.family;
  for (const [re, fam] of NAME_HINTS) if (re.test(item.name)) return fam;
  if (item.rarity === 'vintage' || /196|197/.test(item.era ?? '')) return 'tube';
  return 'solid-state-rack';
};

export const clampFxDuration = (ms: number): number => Math.max(0, Math.min(REWARD_FX_MAX_MS, ms));

/** Deterministic random source for FX; same seed reproduces layout/direction. */
export const createFxRandom = (seed: number | undefined, salt: string): (() => number) =>
  createSeededRandom(`fx:${salt}:${seed ?? 0}`);
