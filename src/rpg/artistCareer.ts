/**
 * Artist career arcs and delayed release outcomes (issue #49, first slice).
 *
 * A settled client session leaves one release record on that client's existing
 * relationship record (no second discography store). The release resolves a few
 * days later into studio reputation and referrals only: it NEVER repays the
 * session fee. Career points only ever grow, so inactivity cannot demote a
 * client. Pure + deterministic: the outcome comes from the project seed.
 */
import { RELEASE_DEMAND_POINTS } from '@/rpg/marketDemand';
import type { ClientRelationship, GameNotification } from '@/types/game';
import type { BriefServiceType } from '@/rpg/projectBrief';
import { createSeededRandom, randomInt } from '@/simulation/seededRandom';

export type ArtistCareerTier = 'local' | 'emerging' | 'established' | 'breakout' | 'prestige';
export type ReleaseOutcomeBand = 'quiet' | 'solid' | 'breakthrough' | 'prestige';

export interface StudioRelease {
  id: string;
  projectId: string;
  title: string;
  genre: string;
  qualityScore: number;
  releaseDay: number;
  /** Day the outcome reveals itself. */
  resolveDay: number;
  outcomeBand: ReleaseOutcomeBand;
  resolved: boolean;
  /** Set when this release came from a follow-up enquiry for an earlier release. */
  followUpOf?: string;
}

export const CAREER_TIERS: ArtistCareerTier[] = ['local', 'emerging', 'established', 'breakout', 'prestige'];
/** Career points needed per tier. Points never decrease. */
export const CAREER_POINTS: Record<ArtistCareerTier, number> = { local: 0, emerging: 3, established: 8, breakout: 16, prestige: 28 };
const BAND_POINTS: Record<ReleaseOutcomeBand, number> = { quiet: 0, solid: 1, breakthrough: 3, prestige: 6 };
/** Studio reputation from a resolved release. Bounded; the fee is never touched. */
export const BAND_REPUTATION: Record<ReleaseOutcomeBand, number> = { quiet: 0, solid: 1, breakthrough: 3, prestige: 6 };
const RELEASE_CAP = 8;

export const FOLLOW_UP_KINDS = ['Second single', 'EP follow-up', 'Album mix', 'Deluxe track', 'Live session', 'Remaster'] as const;

const TIER_REQUESTS: Record<ArtistCareerTier, BriefServiceType[]> = {
  local: ['tracking', 'vocal-production'],
  emerging: ['vocal-production', 'mix'],
  established: ['full-production', 'mix'],
  breakout: ['full-production', 'master'],
  prestige: ['full-production'],
};

export const careerTierForPoints = (points: number): ArtistCareerTier => {
  let tier: ArtistCareerTier = 'local';
  for (const t of CAREER_TIERS) if (points >= CAREER_POINTS[t]) tier = t;
  return tier;
};

export const clientCareerTier = (rel: Pick<ClientRelationship, 'careerPoints'> | undefined): ArtistCareerTier =>
  careerTierForPoints(rel?.careerPoints ?? 0);

/** Deterministic outcome: quality dominates, a seeded swing keeps releases from being a pure lookup. */
export const outcomeBandFor = (projectId: string, quality: number, demandPoints = 0): ReleaseOutcomeBand => {
  const swing = randomInt(createSeededRandom(`release:${projectId}`), -8, 8);
  // Demand (#52) nudges the commercial outcome by a few points at most; quality still dominates.
  const score = Math.max(0, Math.min(100, quality)) + swing + Math.max(-RELEASE_DEMAND_POINTS, Math.min(RELEASE_DEMAND_POINTS, demandPoints));
  return score < 45 ? 'quiet' : score < 70 ? 'solid' : score < 88 ? 'breakthrough' : 'prestige';
};

export interface ReleaseInput {
  projectId: string;
  title: string;
  genre: string;
  qualityScore: number;
  day: number;
  followUpOf?: string;
  /** Market demand points for this genre when it released (#52). */
  demandPoints?: number;
}

/** Create the release record for a settled client project. Idempotent per project id. */
export function recordRelease(rel: ClientRelationship, input: ReleaseInput): ClientRelationship {
  const releases = rel.releases ?? [];
  if (releases.some((r) => r.projectId === input.projectId)) return rel;
  const delay = randomInt(createSeededRandom(`release-delay:${input.projectId}`), 2, 5);
  const release: StudioRelease = {
    id: `release:${input.projectId}`,
    projectId: input.projectId,
    title: input.title,
    genre: input.genre,
    qualityScore: Math.max(0, Math.min(100, Math.round(input.qualityScore))),
    releaseDay: input.day,
    resolveDay: input.day + delay,
    outcomeBand: outcomeBandFor(input.projectId, input.qualityScore, input.demandPoints ?? 0),
    resolved: false,
    ...(input.followUpOf ? { followUpOf: input.followUpOf } : {}),
  };
  return { ...rel, releases: [...releases, release].slice(-RELEASE_CAP) };
}

export interface ReleaseResolution {
  reputation: number;
  notifications: GameNotification[];
  /** Resolved releases that a record label could notice (#49 label interest). */
  labelSignals: Array<{ genre: string; band: ReleaseOutcomeBand; title: string; clientName: string }>;
}

/**
 * Resolve every release whose day has come. Returns the updated relationships,
 * the reputation to add, and concise notifications (quiet releases stay quiet).
 * Repeated calls are no-ops, so reload/double-fire cannot pay twice.
 */
export function resolveDueReleases(
  relationships: Record<string, ClientRelationship> | undefined,
  day: number,
): { relationships: Record<string, ClientRelationship> | undefined } & ReleaseResolution {
  if (!relationships) return { relationships, reputation: 0, notifications: [], labelSignals: [] };
  let reputation = 0;
  const notifications: GameNotification[] = [];
  const labelSignals: ReleaseResolution['labelSignals'] = [];
  let changed = false;
  const next: Record<string, ClientRelationship> = {};
  for (const [key, rel] of Object.entries(relationships)) {
    const due = (rel.releases ?? []).filter((r) => !r.resolved && r.resolveDay <= day);
    if (due.length === 0) { next[key] = rel; continue; }
    changed = true;
    let points = rel.careerPoints ?? 0;
    let referrals = rel.referralCount;
    const releases = (rel.releases ?? []).map((r) => {
      if (!due.includes(r)) return r;
      points += BAND_POINTS[r.outcomeBand];
      reputation += BAND_REPUTATION[r.outcomeBand];
      if (r.outcomeBand === 'breakthrough' || r.outcomeBand === 'prestige') referrals += 1;
      labelSignals.push({ genre: r.genre, band: r.outcomeBand, title: r.title, clientName: rel.clientName });
      if (r.outcomeBand !== 'quiet') {
        notifications.push({
          id: `release-${r.id}`,
          message: r.outcomeBand === 'solid'
            ? `${r.title} found a steady audience. ${rel.clientName} noticed the studio credit.`
            : `${r.title} is picking up. A strong release from ${rel.clientName} has brought in a referral.`,
          type: 'success',
          timestamp: 0,
          duration: 6000,
        });
      }
      return { ...r, resolved: true };
    });
    const before = clientCareerTier(rel);
    const nextRel: ClientRelationship = { ...rel, releases, careerPoints: points, referralCount: referrals, careerTier: careerTierForPoints(points) };
    if (CAREER_TIERS.indexOf(nextRel.careerTier!) > CAREER_TIERS.indexOf(before)) {
      notifications.push({ id: `career-${key}-${nextRel.careerTier}`, message: `${rel.clientName} is now ${nextRel.careerTier}. Expect bigger work from them.`, type: 'info', timestamp: 0, duration: 6000 });
    }
    next[key] = nextRel;
  }
  return changed ? { relationships: next, reputation, notifications, labelSignals } : { relationships, reputation: 0, notifications: [], labelSignals: [] };
}

/** What kind of work this client asks for at their career tier (deterministic per project id). */
export const requestedServiceFor = (rel: ClientRelationship | undefined, projectId: string): BriefServiceType => {
  const options = TIER_REQUESTS[clientCareerTier(rel)];
  return options[randomInt(createSeededRandom(`careerreq:${projectId}`), 0, options.length - 1)];
};

/** A strong, resolved release with no follow-up yet: the seed for a sequel enquiry. */
export const followUpCandidate = (rel: ClientRelationship | undefined): StudioRelease | undefined => {
  const releases = rel?.releases ?? [];
  const followed = new Set(releases.map((r) => r.followUpOf).filter(Boolean));
  return [...releases].reverse().find((r) => r.resolved && r.outcomeBand !== 'quiet' && !followed.has(r.id));
};

export const followUpKind = (projectId: string): string =>
  FOLLOW_UP_KINDS[randomInt(createSeededRandom(`followup:${projectId}`), 0, FOLLOW_UP_KINDS.length - 1)];

export interface ClientCareerLine {
  clientName: string;
  tier: ArtistCareerTier;
  releasesMade: number;
  best?: { title: string; band: ReleaseOutcomeBand };
  pending: number;
}

const BAND_RANK: Record<ReleaseOutcomeBand, number> = { quiet: 0, solid: 1, breakthrough: 2, prestige: 3 };

/** Compact client history for the Career surface: furthest-along careers first. */
export function clientCareerLines(relationships: Record<string, ClientRelationship> | undefined, limit = 3): ClientCareerLine[] {
  return Object.values(relationships ?? {})
    .filter((r) => (r.releases?.length ?? 0) > 0)
    .map((r) => {
      const resolved = (r.releases ?? []).filter((x) => x.resolved);
      const best = [...resolved].sort((a, b) => BAND_RANK[b.outcomeBand] - BAND_RANK[a.outcomeBand] || b.qualityScore - a.qualityScore)[0];
      return {
        clientName: r.clientName,
        tier: clientCareerTier(r),
        releasesMade: r.releases?.length ?? 0,
        ...(best ? { best: { title: best.title, band: best.outcomeBand } } : {}),
        pending: (r.releases ?? []).filter((x) => !x.resolved).length,
        points: r.careerPoints ?? 0,
      };
    })
    .sort((a, b) => b.points - a.points || a.clientName.localeCompare(b.clientName))
    .slice(0, limit)
    .map(({ points: _p, ...line }) => line);
}
