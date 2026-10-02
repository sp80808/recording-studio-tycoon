/**
 * Recruitment channels (#68, first slice): Staff Referral, College Placement and
 * Industry Board replace the pay-to-reroll refresh. A search is an explicit,
 * seeded action that resolves on a later day; the seed is fixed when it starts,
 * so save/reload can never reroll the shortlist. Pure + deterministic.
 */
import type { GameState, StaffMember } from '@/types/game';
import { spend } from '@/economy/ledger';
import { generateCandidates } from '@/utils/staffRecruitment';
import { premisesCandidateCount } from '@/rpg/premises';

export type RecruitmentChannelId = 'referral' | 'college' | 'board';

export interface RecruitmentSearch {
  id: string;
  channelId: RecruitmentChannelId;
  startedDay: number;
  resolvesDay: number;
  seed: string;
  candidateCount: number;
}

export interface RecruitmentChannel {
  id: RecruitmentChannelId;
  name: string;
  cost: number;
  days: number;
  /** Lowest premises tier that opens this channel. */
  minPremisesTier: 0 | 1;
  blurb: string;
  unlockHint: string;
}

export const RECRUITMENT_CHANNELS: Record<RecruitmentChannelId, RecruitmentChannel> = {
  referral: { id: 'referral', name: 'Staff Referral', cost: 60, days: 1, minPremisesTier: 0, blurb: 'Small pool, steady hands, often your current crew\'s kind of person', unlockHint: 'Always open' },
  college: { id: 'college', name: 'College Placement', cost: 120, days: 3, minPremisesTier: 1, blurb: 'Juniors on low pay who grow fast; weak specialist fit at first', unlockHint: 'Opens with a Project Studio' },
  board: { id: 'board', name: 'Industry Board', cost: 200, days: 2, minPremisesTier: 1, blurb: 'Broad mid-tier pool at predictable cost', unlockHint: 'Opens with a Project Studio' },
};
export const CHANNEL_ORDER: RecruitmentChannelId[] = ['referral', 'college', 'board'];

type RecruitState = GameState;

export const isChannelOpen = (s: { premisesTier?: number }, id: RecruitmentChannelId): boolean =>
  (s.premisesTier ?? 0) >= RECRUITMENT_CHANNELS[id].minPremisesTier;

export const getRecruitmentSearch = (s: { recruitmentSearch?: unknown }): RecruitmentSearch | null => {
  const r = s.recruitmentSearch as Partial<RecruitmentSearch> | null | undefined;
  if (!r || typeof r.seed !== 'string' || !(r.channelId && r.channelId in RECRUITMENT_CHANNELS)) return null;
  return r as RecruitmentSearch;
};

export const channelCandidateCount = (s: { premisesTier?: number }, id: RecruitmentChannelId): number =>
  id === 'referral' ? 2 : id === 'college' ? 3 : premisesCandidateCount(s);

/** Why the search can't start right now, or null if it can. */
export function searchBlocker(s: RecruitState, id: RecruitmentChannelId): string | null {
  if (getRecruitmentSearch(s)) return 'A search is already running';
  if (!isChannelOpen(s, id)) return RECRUITMENT_CHANNELS[id].unlockHint;
  if (s.money < RECRUITMENT_CHANNELS[id].cost) return `Need $${RECRUITMENT_CHANNELS[id].cost}`;
  return null;
}

export function startRecruitmentSearchInState<S extends RecruitState>(s: S, id: RecruitmentChannelId): S {
  if (searchBlocker(s, id)) return s;
  const ch = RECRUITMENT_CHANNELS[id];
  const search: RecruitmentSearch = {
    id: `search:${id}:${s.currentDay}`,
    channelId: id,
    startedDay: s.currentDay,
    resolvesDay: s.currentDay + ch.days,
    seed: `${s.saveSeed ?? 4242}:${id}:${s.currentDay}:${s.hiredStaff.length}`,
    candidateCount: channelCandidateCount(s, id),
  };
  return { ...spend(s, ch.cost, { category: 'marketing', memo: ch.name }), recruitmentSearch: search };
}

const majorityRole = (staff: StaffMember[]): StaffMember['role'] | undefined => {
  if (staff.length === 0) return undefined;
  const counts: Record<string, number> = {};
  for (const m of staff) counts[m.role] = (counts[m.role] ?? 0) + 1;
  return (Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0]) as StaffMember['role'];
};

/** Deterministic shortlist for a search. Same search + same state inputs, same people. */
export function buildSearchCandidates(s: RecruitState, search: RecruitmentSearch): StaffMember[] {
  const base = generateCandidates({
    count: search.candidateCount,
    saveSeed: s.saveSeed ?? 4242,
    day: search.resolvesDay,
    era: s.selectedEra || s.currentEra,
    year: s.currentYear,
    cityId: s.cityId,
    batchKey: search.seed,
  });
  const ch = RECRUITMENT_CHANNELS[search.channelId];
  const crewRole = majorityRole(s.hiredStaff);
  return base.map((c): StaffMember => {
    if (search.channelId === 'college') {
      const p = c.primaryStats;
      return {
        ...c,
        levelInRole: 1,
        salary: Math.min(110, Math.max(30, Math.round(c.salary * 0.55))),
        primaryStats: { creativity: Math.round(p.creativity * 0.8), technical: Math.round(p.technical * 0.8), speed: Math.round(p.speed * 0.8) },
        genreAffinity: null,
        apprentice: true,
        source: { channelId: ch.id, label: ch.name, why: 'Trainee placement: low pay, fast early growth' },
      };
    }
    if (search.channelId === 'referral') {
      return {
        ...c,
        role: crewRole ?? c.role,
        salary: Math.round(c.salary * 0.9),
        source: { channelId: ch.id, label: ch.name, why: crewRole ? `Recommended by your crew (${crewRole.toLowerCase()} work)` : 'Recommended by a friend of the studio' },
      };
    }
    return { ...c, source: { channelId: ch.id, label: ch.name, why: 'Answered your job-board listing' } };
  });
}

/** Day tick: a due search resolves into the shortlist exactly once and clears itself. */
export function resolveRecruitmentSearchInState<S extends RecruitState>(s: S, day: number): S {
  const search = getRecruitmentSearch(s);
  if (!search || day < search.resolvesDay) return s;
  return { ...s, availableCandidates: buildSearchCandidates(s, search), recruitmentSearch: null };
}
