export type TakeGrade = 'Gold' | 'Silver' | 'Solid';

export interface TakeEvaluationResult {
  grade: TakeGrade;
  multiplier: number;
  qualityBonus: number;
  label: string;
}

/**
 * Single source of truth for "The Pocket" (Gold window) on the 0–1 needle
 * scale. The PocketMeter faceplate, its lock feedback/confetti and the
 * authoritative grading all derive from this, so the drawn pocket can never
 * drift from the scored one.
 */
export const TAKE_POCKET_WINDOW = {
  /** Sweet-spot centre on the needle scale. */
  center: 0.775,
  /**
   * Total window width per PocketMeter assistance level
   * (Settings → PocketMeter Timing Window Assist):
   * strict 7% / normal 15% / generous 25% of the scale — total width, so
   * 'normal' keeps the historic 0.70–0.85 pocket.
   */
  assistanceWidth: {
    strict: 0.07,
    normal: 0.15,
    generous: 0.25,
  },
  /** Each full timing_bonus point widens the pocket by this much per edge. */
  bonusExpansionPerPoint: 0.15,
} as const;

export type PocketMeterAssistance = keyof typeof TAKE_POCKET_WINDOW.assistanceWidth;

export interface TakeGoldWindow {
  min: number;
  max: number;
}

/**
 * Resolves the Gold window for the active chore buff + assistance setting.
 * Chore timing_bonus widens both edges; assistance widens symmetrically.
 */
export function getTakeGoldWindow(
  timingBonus: number = 0,
  assistance: PocketMeterAssistance = 'normal'
): TakeGoldWindow {
  const halfWidth = TAKE_POCKET_WINDOW.assistanceWidth[assistance] / 2;
  const expansion = TAKE_POCKET_WINDOW.bonusExpansionPerPoint * Math.max(0, timingBonus);
  return {
    min: Math.max(0, TAKE_POCKET_WINDOW.center - halfWidth - expansion),
    max: Math.min(1, TAKE_POCKET_WINDOW.center + halfWidth + expansion),
  };
}

/**
 * Evaluates needle position (0.0 to 1.0) against "The Pocket" target zone.
 * - Gold: inside getTakeGoldWindow() — see there for the tolerance rules.
 * - Silver: Near miss adjacent to Gold zone.
 * - Otherwise: Solid Take.
 */
export function evaluateTakeAccuracy(
  needlePosition: number,
  timingBonus: number = 0,
  assistance: PocketMeterAssistance = 'normal'
): TakeEvaluationResult {
  const pos = Math.max(0, Math.min(1, needlePosition));
  const { min: goldMin, max: goldMax } = getTakeGoldWindow(timingBonus, assistance);

  if (pos >= goldMin && pos <= goldMax) {
    return {
      grade: 'Gold',
      multiplier: 1.3,
      qualityBonus: 4,
      label: 'Gold Take'
    };
  }

  const silverMin = Math.max(0, goldMin - 0.20);
  const silverMax = Math.min(1, goldMax + 0.10);

  if ((pos >= silverMin && pos < goldMin) || (pos > goldMax && pos <= silverMax)) {
    return {
      grade: 'Silver',
      multiplier: 1.1,
      qualityBonus: 2,
      label: 'Silver Take'
    };
  }

  return {
    grade: 'Solid',
    multiplier: 1.0,
    qualityBonus: 0,
    label: 'Solid Take'
  };
}

/**
 * Calculates adaptive energy cost:
 * - Default: 2 energy
 * - If 1 energy remaining: 1 energy
 * - If overdrive armed: +1 energy if available (discounted by 1⚡ if energySaver buff is active)
 */
export function calculateTakeEnergyCost(
  availableEnergy: number,
  overdriveArmed: boolean,
  energySaver: boolean = false
): number {
  if (availableEnergy <= 0) return 0;
  if (availableEnergy === 1) return 1;

  if (overdriveArmed) {
    const targetCost = energySaver ? 2 : 3;
    return Math.min(availableEnergy, targetCost);
  }

  return 2;
}

/**
 * Base work units before genre, staff, synergy, and grade multipliers.
 * Tuned so a typical early stage (8–12 units) clears in ~2 takes, not 3–4
 * full calibration cycles.
 */
export function calculateTakeBaseUnits(energyCost: number): number {
  return energyCost * 3;
}
