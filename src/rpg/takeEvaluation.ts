export type TakeGrade = 'Gold' | 'Silver' | 'Solid';

export interface TakeEvaluationResult {
  grade: TakeGrade;
  multiplier: number;
  qualityBonus: number;
  label: string;
}

/**
 * Evaluates needle position (0.0 to 1.0) against "The Pocket" target zone.
 * - Base Gold: 0.70 to 0.85
 * - timingBonus widens the Gold window tolerance (e.g. +10% width).
 * - Silver: Near miss adjacent to Gold zone.
 * - Otherwise: Solid Take.
 */
export function evaluateTakeAccuracy(
  needlePosition: number,
  timingBonus: number = 0
): TakeEvaluationResult {
  const pos = Math.max(0, Math.min(1, needlePosition));

  // Base gold window is [0.70, 0.85] (width 0.15).
  // timingBonus expands lower and upper boundaries.
  const expansion = 0.15 * Math.max(0, timingBonus);
  const goldMin = Math.max(0, 0.70 - expansion);
  const goldMax = Math.min(1, 0.85 + expansion);

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
