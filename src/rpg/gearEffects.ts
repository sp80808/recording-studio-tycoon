/** Short, truthful effect summary for gear cards (issue #365). Pure; reads existing bonus stats only. */
export interface GearBonuses {
  genreBonus?: Record<string, number>;
  qualityBonus?: number;
  speedBonus?: number;
  creativityBonus?: number;
  technicalBonus?: number;
}

const signed = (n: number): string => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n)}`;

/** One entry per non-zero effect, e.g. "+10 quality", "−5 speed", "Rock +2". Empty when the gear changes no stat. */
export const gearEffectParts = (bonuses: GearBonuses | undefined): string[] => {
  if (!bonuses) return [];
  const parts: string[] = [];
  if (bonuses.qualityBonus) parts.push(`${signed(bonuses.qualityBonus)} quality`);
  if (bonuses.technicalBonus) parts.push(`${signed(bonuses.technicalBonus)} technical`);
  if (bonuses.creativityBonus) parts.push(`${signed(bonuses.creativityBonus)} creativity`);
  if (bonuses.speedBonus) parts.push(`${signed(bonuses.speedBonus)} speed`);
  for (const [genre, value] of Object.entries(bonuses.genreBonus ?? {})) {
    if (value) parts.push(`${genre} ${signed(value)}`);
  }
  return parts;
};

/** Honest line for gear with no stat effect (basic starter kit). */
export const GEAR_NO_EFFECT_TEXT = 'Starter kit: no quality or speed change, it just gets you recording.';
