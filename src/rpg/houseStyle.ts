/**
 * Studio house style (issue #71): bounded expertise the studio earns by doing
 * relevant work repeatedly. Three separate concepts stay separate:
 * market demand (#52), project fit (#48) and this studio expertise.
 *
 * Pure + deterministic. Nothing here reads market popularity, and expertise
 * never grants a quality bonus: level 1-2 shortens the setup estimate and
 * level 5 marks a signature. Awards are idempotent per project id.
 */
export type ExpertiseLevel = 0 | 1 | 2 | 3 | 4 | 5;
export type ExpertiseKind = 'genres' | 'services' | 'approaches';

export interface ExpertiseTrack {
  xp: number;
  level: ExpertiseLevel;
  completedCount: number;
  notableProjectIds: string[];
}

export interface StudioExpertise {
  genres: Record<string, ExpertiseTrack>;
  services: Record<string, ExpertiseTrack>;
  approaches: Record<string, ExpertiseTrack>;
  /** Recently settled project ids: guards against reload / double-fire duplicates. */
  awarded: string[];
}

/** XP needed to reach each level (index = level). */
export const LEVEL_XP: readonly number[] = [0, 20, 55, 110, 190, 300];
export const LEVEL_NAMES = ['Newcomer', 'Developing', 'Experienced', 'Expert', 'Master', 'Signature'] as const;
export const MAX_NOTABLE = 3;
const AWARD_LOG_CAP = 60;
/** Repeat weighting by how often this track has already paid; easy repeats fade fast. */
const REPEAT_CURVE = [1, 0.8, 0.6, 0.45, 0.3, 0.2];
/** Setup time shaved per level, capped. Information/time only: never quality. */
export const SETUP_REDUCTION_PER_LEVEL = 0.03;
export const SETUP_REDUCTION_CAP = 0.12;

const emptyTrack = (): ExpertiseTrack => ({ xp: 0, level: 0, completedCount: 0, notableProjectIds: [] });

export const createInitialExpertise = (): StudioExpertise => ({ genres: {}, services: {}, approaches: {}, awarded: [] });

export const levelForXp = (xp: number): ExpertiseLevel => {
  let level = 0;
  for (let i = 1; i < LEVEL_XP.length; i++) if (xp >= LEVEL_XP[i]) level = i;
  return level as ExpertiseLevel;
};

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);

const migrateTrack = (raw: unknown): ExpertiseTrack => {
  if (!raw || typeof raw !== 'object') return emptyTrack();
  const r = raw as Partial<ExpertiseTrack>;
  const xp = num(r.xp);
  return {
    xp,
    level: levelForXp(xp),
    completedCount: num(r.completedCount),
    notableProjectIds: Array.isArray(r.notableProjectIds) ? r.notableProjectIds.filter((x): x is string => typeof x === 'string').slice(0, MAX_NOTABLE) : [],
  };
};

/** Legacy saves (and corrupt blobs) become a valid empty state. */
export const migrateExpertise = (raw: unknown): StudioExpertise => {
  const base = createInitialExpertise();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<StudioExpertise>;
  for (const kind of ['genres', 'services', 'approaches'] as const) {
    const src = r[kind];
    if (src && typeof src === 'object') for (const [k, v] of Object.entries(src)) base[kind][k] = migrateTrack(v);
  }
  if (Array.isArray(r.awarded)) base.awarded = r.awarded.filter((x): x is string => typeof x === 'string').slice(-AWARD_LOG_CAP);
  return base;
};

export interface ExpertiseEvent {
  projectId: string;
  genre: string;
  serviceType?: string;
  approachId?: string;
  /** Final quality 0-100. Weak projects still teach something. */
  quality: number;
  /** Project difficulty 1-5. */
  difficulty: number;
}

/** Base XP: familiarity from any finished job, more for strong and for difficult work. */
export const baseXp = (quality: number, difficulty: number): number => {
  const q = Math.max(0, Math.min(100, quality));
  const d = Math.max(1, Math.min(5, difficulty));
  return Math.round((4 + (q / 100) * 6) * (0.6 + d * 0.2));
};

const bump = (track: ExpertiseTrack | undefined, ev: ExpertiseEvent, xp: number): ExpertiseTrack => {
  const t = track ?? emptyTrack();
  const weighted = Math.max(1, Math.round(xp * REPEAT_CURVE[Math.min(t.completedCount, REPEAT_CURVE.length - 1)]));
  const total = t.xp + weighted;
  const notable = ev.quality >= 75 && !t.notableProjectIds.includes(ev.projectId)
    ? [...t.notableProjectIds, ev.projectId].slice(-MAX_NOTABLE)
    : t.notableProjectIds;
  return { xp: total, level: levelForXp(total), completedCount: t.completedCount + 1, notableProjectIds: notable };
};

export const awardExpertise = (state: StudioExpertise | undefined, ev: ExpertiseEvent): StudioExpertise => {
  const cur = state ?? createInitialExpertise();
  if (cur.awarded.includes(ev.projectId)) return cur;
  const xp = baseXp(ev.quality, ev.difficulty);
  const next: StudioExpertise = {
    genres: { ...cur.genres },
    services: { ...cur.services },
    approaches: { ...cur.approaches },
    awarded: [...cur.awarded, ev.projectId].slice(-AWARD_LOG_CAP),
  };
  if (ev.genre) next.genres[ev.genre] = bump(cur.genres[ev.genre], ev, xp);
  if (ev.serviceType) next.services[ev.serviceType] = bump(cur.services[ev.serviceType], ev, xp);
  if (ev.approachId) next.approaches[ev.approachId] = bump(cur.approaches[ev.approachId], ev, xp);
  return next;
};

export const trackLevel = (state: StudioExpertise | undefined, kind: ExpertiseKind, key: string | undefined): ExpertiseLevel =>
  (key && state?.[kind][key]?.level) || 0;

/** Fraction of remaining work the studio can skip because the setup is familiar (0-0.12). */
export const setupTimeReduction = (state: StudioExpertise | undefined, genre: string, serviceType?: string): number => {
  const best = Math.max(trackLevel(state, 'genres', genre), trackLevel(state, 'services', serviceType));
  return Math.min(SETUP_REDUCTION_CAP, best * SETUP_REDUCTION_PER_LEVEL);
};

export interface HouseStyleLine {
  kind: ExpertiseKind;
  key: string;
  level: ExpertiseLevel;
  name: string;
  xp: number;
  /** XP still needed for the next level, or null at the top. */
  toNext: number | null;
  notable: string[];
}

/** The strongest tracks first, for the Career profile. */
export const houseStyleProfile = (state: StudioExpertise | undefined, limit = 4): HouseStyleLine[] => {
  if (!state) return [];
  const lines: HouseStyleLine[] = [];
  for (const kind of ['genres', 'services', 'approaches'] as const) {
    for (const [key, t] of Object.entries(state[kind])) {
      if (t.xp <= 0) continue;
      lines.push({ kind, key, level: t.level, name: LEVEL_NAMES[t.level], xp: t.xp, toNext: t.level >= 5 ? null : LEVEL_XP[t.level + 1] - t.xp, notable: t.notableProjectIds });
    }
  }
  return lines.sort((a, b) => b.xp - a.xp || a.key.localeCompare(b.key)).slice(0, limit);
};

/** What the next level of a track unlocks, in words (no hidden spreadsheet). */
export const levelPerk = (level: ExpertiseLevel): string =>
  level <= 0 ? 'Keep working to build familiarity.'
    : level < 3 ? 'Shorter setup estimates on familiar work.'
      : level === 3 ? 'Authored house recipe to unlock (coming).'
        : level === 4 ? 'Setup overhead stays low; repeat enquiries are likelier.'
          : 'Signature: prestige briefs and a plaque on the wall.';

/** One line on an enquiry explaining why the studio's track record helps (or that it is new ground). */
export const enquiryStyleNote = (state: StudioExpertise | undefined, genre: string, serviceType?: string): string => {
  const g = trackLevel(state, 'genres', genre);
  const sv = trackLevel(state, 'services', serviceType);
  if (g <= 0 && sv <= 0) return `New ground: ${genre} is not part of your house style yet.`;
  const reduction = Math.round(setupTimeReduction(state, genre, serviceType) * 100);
  const lead = g >= sv ? `${genre} (${LEVEL_NAMES[g]})` : `${serviceType} (${LEVEL_NAMES[sv]})`;
  return reduction > 0 ? `House style: ${lead}, setup about ${reduction}% shorter.` : `House style: ${lead}.`;
};
