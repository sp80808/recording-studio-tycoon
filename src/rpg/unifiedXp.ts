/** Unified XP family — one curve shape per track, no more 3 divergent formulas.
 * Pure math; RNG bonus passed in by caller (seeded) so this stays deterministic.
 */

export type XpTrack = 'skill' | 'producer' | 'role';

export const xpNext = (track: XpTrack, level: number): number => {
  const l = Math.max(1, Math.floor(level));
  if (track === 'skill') return Math.floor(120 * Math.pow(l, 1.6));
  if (track === 'producer') return Math.floor(180 * Math.pow(l, 1.45));
  return Math.floor(100 * Math.pow(l, 1.5));
};

/** Focused skill XP per project (replaces 60-190 range with 50-130). */
export const skillXpForProject = (
  score: number,
  difficulty: number,
  rngBonus = 0
): number => {
  const s = Math.max(0, Math.min(100, score));
  const d = Math.max(1, Math.min(5, difficulty));
  return Math.round(15 + s * 0.6 + d * 10 + rngBonus); // rngBonus 0-12 from seeded rng
};

/** Producer XP per project + management XP when staff did the work. */
export const producerXpForProject = (quality: number): number =>
  Math.round(20 + Math.max(0, Math.min(100, quality)) / 8);

export const managementXpForProject = (quality: number, difficulty: number): number =>
  Math.round(30 + Math.max(0, Math.min(100, quality)) / 5 + Math.max(1, difficulty) * 10);

/** Over-level brake: grinding easy projects past your level yields less. */
export const overlevelMultiplier = (level: number, difficulty: number): number => {
  const gap = level - difficulty - 2;
  if (gap <= 0) return 1;
  return 1 / (1 + 0.15 * gap);
};

/** Talent points: +1/level forever + bonus at 5/10/15/20/25/30 (~36 over 20y). */
export const talentPointsEarned = (level: number): number => {
  const l = Math.max(0, Math.floor(level));
  const milestones = [5, 10, 15, 20, 25, 30].filter((m) => l >= m).length;
  return l + milestones;
};
