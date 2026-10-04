/**
 * Label interest (#49): strong client releases get noticed by record labels.
 *
 * A breakthrough or prestige release raises the interest of labels whose roster fits its genre.
 * Interest is a small bounded 0-100 number per label, only ever grows from releases, and never
 * pays cash. It is the signal later label contracts can read; today it shows on Career and
 * fires a concise note when a label crosses an interest line.
 */
import type { GameNotification } from '@/types/game';
import type { ReleaseOutcomeBand } from '@/rpg/artistCareer';

export type LabelTier = 'indie' | 'regional' | 'national' | 'global';

export interface LabelAccount {
  id: string;
  name: string;
  tier: LabelTier;
  /** Lower-case fragments matched against a release's genre. */
  genres: string[];
}

export const LABEL_ACCOUNTS: readonly LabelAccount[] = [
  { id: 'major_label_001', name: 'Stellar Records', tier: 'global', genres: ['pop', 'rock', 'hip-hop', 'tiktok', 'soul', 'motown'] },
  { id: 'indie_label_001', name: 'Underground Sounds', tier: 'indie', genres: ['indie', 'punk', 'emo', 'folk', 'lo-fi', 'blues'] },
  { id: 'electronic_label_001', name: 'Digital Waves Music', tier: 'regional', genres: ['electronic', 'edm', 'disco', 'new wave', 'digital'] },
  { id: 'hiphop_label_001', name: 'Street Crown Entertainment', tier: 'national', genres: ['hip-hop', 'trap', 'drill'] },
];

export const INTEREST_CAP = 100;
export const INTEREST_LINES = [25, 50, 75] as const;
export const BAND_INTEREST: Record<ReleaseOutcomeBand, number> = { quiet: 0, solid: 0, breakthrough: 4, prestige: 8 };

export interface LabelSignal {
  genre: string;
  band: ReleaseOutcomeBand;
  title: string;
  clientName: string;
}

export const labelsForGenre = (genre: string): LabelAccount[] => {
  const g = genre.toLowerCase();
  return LABEL_ACCOUNTS.filter((l) => l.genres.some((frag) => g.includes(frag)));
};

export const interestOf = (interest: Record<string, number> | undefined, labelId: string): number => interest?.[labelId] ?? 0;

/** Apply resolved-release signals. Same input twice is fine because resolveDueReleases only emits each release once. */
export function applyLabelSignals(
  interest: Record<string, number> | undefined,
  signals: LabelSignal[],
): { interest: Record<string, number> | undefined; notifications: GameNotification[] } {
  const gains = signals.filter((s) => BAND_INTEREST[s.band] > 0);
  if (gains.length === 0) return { interest, notifications: [] };
  const next = { ...(interest ?? {}) };
  const notifications: GameNotification[] = [];
  for (const s of gains) {
    for (const label of labelsForGenre(s.genre)) {
      const before = next[label.id] ?? 0;
      const after = Math.min(INTEREST_CAP, before + BAND_INTEREST[s.band]);
      next[label.id] = after;
      const crossed = INTEREST_LINES.filter((line) => before < line && after >= line).pop();
      if (crossed) {
        notifications.push({
          id: `label-${label.id}-${crossed}`,
          message: `${label.name} is asking about ${s.clientName}'s ${s.title}. The studio's name is getting around.`,
          type: 'info',
          timestamp: 0,
          duration: 6000,
        });
      }
    }
  }
  return { interest: next, notifications };
}

export interface LabelInterestLine { id: string; name: string; interest: number }

/** Labels with any interest, warmest first. */
export const labelInterestLines = (interest: Record<string, number> | undefined, limit = 3): LabelInterestLine[] =>
  LABEL_ACCOUNTS
    .map((l) => ({ id: l.id, name: l.name, interest: interestOf(interest, l.id) }))
    .filter((l) => l.interest > 0)
    .sort((a, b) => b.interest - a.interest || a.name.localeCompare(b.name))
    .slice(0, limit);
