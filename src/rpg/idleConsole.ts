/** Idle console summary: what to show at the console when no session is running. Pure and derived, never stored. */
import type { GameState, Project } from '@/types/game';
import type { StudioRelease } from '@/rpg/artistCareer';

export const IDLE_ENQUIRY_LIMIT = 2;
const TIRED_ENERGY = 30;

export interface IdleConsoleSummary {
  /** Best enquiries first: stronger match, then higher payout. Bounded. */
  enquiries: Project[];
  enquiryCount: number;
  /** Booked sessions waiting while no session is on the desk (multi-project saves). */
  waiting: Project[];
  lastRelease: StudioRelease | null;
  crew: { total: number; ready: number; tired: number };
  roomsReady: number;
  energy: number;
}

const MATCH_RANK: Record<Project['matchRating'], number> = { Excellent: 2, Good: 1, Poor: 0 };

export function buildIdleConsoleSummary(state: GameState): IdleConsoleSummary {
  const enquiries = [...(state.availableProjects ?? [])]
    .sort((a, b) => (MATCH_RANK[b.matchRating] ?? 0) - (MATCH_RANK[a.matchRating] ?? 0) || b.payoutBase - a.payoutBase)
    .slice(0, IDLE_ENQUIRY_LIMIT);
  const waiting = (state.activeProjects ?? []).filter((p) => !p.awaitingReview || p.completedStages.length < p.stages.length);
  let lastRelease: StudioRelease | null = null;
  for (const rel of Object.values(state.clientRelationships ?? {}).flatMap((c) => c.releases ?? [])) {
    if (!lastRelease || rel.releaseDay > lastRelease.releaseDay) lastRelease = rel;
  }
  const staff = state.hiredStaff ?? [];
  const tired = staff.filter((s) => s.energy < TIRED_ENERGY || s.status === 'Resting').length;
  const ready = staff.filter((s) => s.status === 'Idle' && s.energy >= TIRED_ENERGY).length;
  return {
    enquiries,
    enquiryCount: state.availableProjects?.length ?? 0,
    waiting,
    lastRelease,
    crew: { total: staff.length, ready, tired },
    roomsReady: (state.studioRooms ?? []).filter((r) => r.unlocked).length,
    energy: Math.max(0, state.playerData?.dailyWorkCapacity ?? 0),
  };
}
