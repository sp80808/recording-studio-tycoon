/** Streak Bank — combo cash-out with a hold-to-amplify release gamble (k6e.5).
 *
 * The work loop already grows `project.comboCount` for consecutive same-day
 * takes (see useStageWork: capped +50% output) but it had no player-facing
 * moment. This module owns the bank's math: a safe tap quote, the charge-sweep
 * release zones, and the zone payout multipliers.
 *
 * Pure functions only — no RNG, no dates, no React — so every zone boundary,
 * multiplier and cap is invariant-testable (tests/streak-bank.check.ts).
 */

/** Streak must reach this many same-day takes before the bank unlocks. */
export const MIN_BANK_COMBO = 3;

/** Below the unlock the control renders in its locked/preview state. */
export const PREVIEW_COMBO = 2;

/** Full charge sweep duration (ms) before auto-settle ("filled" floor). */
export const CHARGE_MS = 1600;

/** Gold release window as a fraction of the sweep: 68%–82%. */
export const GOLD_ZONE: readonly [number, number] = [0.68, 0.82];

/** Tactile tick steps along the sweep — gaps shrink at the end so the
 *  clicks accelerate into the gold window (ears-first feedback). */
export const TICK_STEPS: readonly number[] = [
  0.08, 0.18, 0.3, 0.42, 0.54, 0.66, 0.76, 0.85, 0.92, 0.97,
];

export type ReleaseZone = 'early' | 'gold' | 'late' | 'filled';

export interface BankQuote {
  /** Cash paid by a safe bank (tap or full sweep) at this combo & level. */
  cash: number;
  /** Flat XP granted on any successful bank. */
  xp: number;
  /** Combo tier multiplier applied to the level-scaled base. */
  tier: number;
}

export interface BankResult {
  zone: ReleaseZone;
  cash: number;
  xp: number;
  /** Only a gold release preserves the streak for future takes. */
  keepsCombo: boolean;
  /** Chip headline, e.g. "PERFECT RELEASE ×1.6". */
  label: string;
  /** Coach copy explaining the outcome. */
  sublabel: string;
  /** Applied payout multiplier (diagnostics / tests). */
  multiplier: number;
}

/** Combo tier curve — capped so banking never outpaces settlement rewards. */
const tierFor = (combo: number): number => {
  const c = Math.max(0, Math.floor(combo));
  if (c >= 6) return 1.25;
  if (c >= 4) return 1.0;
  return 0.75;
};

/** XP is flat across zones but softly capped so long sessions can't farm it. */
export const MAX_BANK_XP = 30;

export const quoteBank = (combo: number, level: number): BankQuote => {
  const l = Math.max(1, Math.floor(level || 1));
  const base = 35 + l * 10;
  const tier = tierFor(combo);
  return {
    cash: Math.round(base * tier),
    xp: Math.min(MAX_BANK_XP, 6 + Math.max(0, Math.floor(combo)) * 2),
    tier,
  };
};

/** Zone payout multipliers. Timed-release EV (0.964) sits below the 1.0
 *  filled floor — patience is safe, precision is rewarded, carelessness costs. */
export const ZONE_MULTIPLIER: Record<ReleaseZone, number> = {
  early: 0.85,
  gold: 1.6,
  late: 0.9,
  filled: 1.0,
};

/** Map a 0–1 sweep position to a release zone (NaN/overshoot → filled floor). */
export const zoneForProgress = (progress: number): ReleaseZone => {
  if (!Number.isFinite(progress) || progress >= 1) return 'filled';
  if (progress < GOLD_ZONE[0]) return 'early';
  if (progress < GOLD_ZONE[1]) return 'gold';
  return 'late';
};

const COPY: Record<ReleaseZone, { label: (mult: number) => string; sub: string }> = {
  early: { label: (m) => `SPENT EARLY ×${m.toFixed(2)}`, sub: 'Released before the gold window — streak spent.' },
  gold: { label: (m) => `PERFECT RELEASE ×${m.toFixed(1)}`, sub: 'Nailed the gold window — streak kept alive!' },
  late: { label: (m) => `JUST MISSED ×${m.toFixed(2)}`, sub: 'The sweep had left the gold window.' },
  filled: { label: (m) => `STEADY HAND ×${m.toFixed(1)}`, sub: 'Let it run to the end — safe payout.' },
};

/** Evaluate a release at `progress` (0–1) into the final payout. */
export const evaluateRelease = (
  combo: number,
  level: number,
  progress: number
): BankResult => {
  const zone = zoneForProgress(progress);
  const quote = quoteBank(combo, level);
  const multiplier = ZONE_MULTIPLIER[zone];
  const keepsCombo = zone === 'gold';
  return {
    zone,
    cash: Math.max(1, Math.round(quote.cash * multiplier)),
    xp: quote.xp,
    keepsCombo,
    label: COPY[zone].label(multiplier),
    sublabel: COPY[zone].sub,
    multiplier,
  };
};

/** Highest achievable payout at this combo/level (gold window) — HUD copy. */
export const goldMaxCash = (combo: number, level: number): number =>
  evaluateRelease(combo, level, (GOLD_ZONE[0] + GOLD_ZONE[1]) / 2).cash;
