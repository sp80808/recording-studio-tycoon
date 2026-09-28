/** Genre x Mood combo codex — Kairosoft-style discovery chase.
 * Deterministic evaluation; flavor-text variant picked by caller with seeded RNG.
 */

export const CANONICAL_MOODS = [
  'Upbeat',
  'Melancholic',
  'Aggressive',
  'Chill',
  'Anthemic',
  'Intimate',
] as const;

export type ComboMood = (typeof CANONICAL_MOODS)[number];
export type ComboTier = 'Amazing' | 'Promising' | 'Standard' | 'Risky' | 'Terrible';

export interface ComboResult {
  tier: ComboTier;
  qualityBonus: number;
  skillXpMult: number;
  /** Studio Points bonus (first discovery only — caller checks codex). */
  spBonus: number;
  label: string;
}

const norm = (s: string): string => s.trim().toLowerCase().replace(/[_]+/g, '-').replace(/\s+/g, ' ');

/** Signature combos — extend, never shrink (save compat). Key: "genre|mood". */
const SIGNATURES: Record<string, { label: string; qualityBonus: number }> = {
  'hip-hop|aggressive': { label: 'Trap Forge', qualityBonus: 8 },
  'jazz|intimate': { label: 'Midnight Session', qualityBonus: 5 },
  'rock|anthemic': { label: 'Wall of Sound', qualityBonus: 6 },
  'pop|upbeat': { label: 'Radio Polish', qualityBonus: 6 },
  'electronic|chill': { label: 'Ambient Lab', qualityBonus: 5 },
  'metal|lullaby': { label: 'Clash', qualityBonus: -6 },
  'lo-fi|rainy night': { label: 'Rainy Tape', qualityBonus: 8 },
  'hip-hop|documentary': { label: 'Hustle Tape', qualityBonus: 4 },
  'folk|intimate': { label: 'Front Porch', qualityBonus: 5 },
  'r&b|melancholic': { label: 'Slow Burn', qualityBonus: 5 },
  'country|anthemic': { label: 'Stadium Barn', qualityBonus: 4 },
  'classical|chill': { label: 'Glass Hall', qualityBonus: 5 },
};

const TERRIBLE_PAIRS: ReadonlySet<string> = new Set([
  'metal|lullaby',
  'electronic|anthemic',
  'classical|aggressive',
]);

export const evaluateCombo = (
  genre: string,
  mood: string,
  opts?: { mastery?: number; isFirstDiscovery?: boolean }
): ComboResult => {
  const g = norm(genre);
  const m = norm(mood);
  const key = `${g}|${m}`;
  const mastery = opts?.mastery ?? 0;
  const first = opts?.isFirstDiscovery ?? false;
  const sig = SIGNATURES[key];

  if (TERRIBLE_PAIRS.has(key)) {
    return { tier: 'Terrible', qualityBonus: -6, skillXpMult: 0.75, spBonus: 0, label: sig?.label ?? 'Clash' };
  }
  if (sig) {
    return {
      tier: 'Amazing',
      qualityBonus: sig.qualityBonus + (first ? 8 : mastery >= 3 ? 2 : 0),
      skillXpMult: first ? 1.5 : 1.15,
      spBonus: first ? 2 : 0,
      label: sig.label,
    };
  }
  // Heuristic: same-energy pairings promise well, mismatches stay standard.
  const energetic = new Set(['upbeat', 'aggressive', 'anthemic']);
  const mellow = new Set(['melancholic', 'chill', 'intimate']);
  const canonical = (CANONICAL_MOODS as readonly string[]).includes(m);
  if (canonical && ((energetic.has(m) && /rock|pop|hip-hop|electronic/.test(g)) || (mellow.has(m) && /jazz|folk|lo-fi|r&b|classical|acoustic/.test(g)))) {
    return {
      tier: 'Promising',
      qualityBonus: 3 + (first ? 8 : mastery >= 3 ? 2 : 0),
      skillXpMult: first ? 1.5 : 1.1,
      spBonus: first ? 2 : 0,
      label: 'Promising Blend',
    };
  }
  return {
    tier: 'Standard',
    qualityBonus: first ? 8 : 0,
    skillXpMult: first ? 1.5 : 1.0,
    spBonus: first ? 2 : 0,
    label: 'Standard Cut',
  };
};

export const comboKey = (genre: string, mood: string): string =>
  `${norm(genre)}|${norm(mood)}`;
