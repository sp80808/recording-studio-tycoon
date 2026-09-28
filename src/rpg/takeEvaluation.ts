export type TakeGrade = 'Gold' | 'Silver' | 'Solid';

export interface TakeEvaluationResult {
  grade: TakeGrade;
  multiplier: number;
  qualityBonus: number;
  label: string;
}

/**
 * Evaluates needle position (0.0 to 1.0) against "The Pocket" target zone.
 * - 0.70 to 0.85: Gold Take (In The Pocket)
 * - 0.50 to 0.69 or 0.86 to 0.95: Silver Take (Near Miss)
 * - Otherwise: Solid Take (Standard Take)
 */
export function evaluateTakeAccuracy(needlePosition: number): TakeEvaluationResult {
  const pos = Math.max(0, Math.min(1, needlePosition));

  if (pos >= 0.70 && pos <= 0.85) {
    return {
      grade: 'Gold',
      multiplier: 1.3,
      qualityBonus: 4,
      label: 'Gold Take'
    };
  }

  if ((pos >= 0.50 && pos < 0.70) || (pos > 0.85 && pos <= 0.95)) {
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
 * - If overdrive armed: +1 energy if available
 */
export function calculateTakeEnergyCost(availableEnergy: number, overdriveArmed: boolean): number {
  if (availableEnergy <= 0) return 0;
  if (availableEnergy === 1) return 1;

  if (overdriveArmed) {
    return availableEnergy >= 3 ? 3 : availableEnergy;
  }

  return 2;
}

/**
 * Base work units before genre, staff, synergy, and grade multipliers.
 */
export function calculateTakeBaseUnits(energyCost: number): number {
  return energyCost * 2;
}
