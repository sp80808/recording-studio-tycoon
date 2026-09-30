/**
 * studioSeasons.ts — Studio Seasons (#63): a medium-term planning loop.
 *
 * One season is SEASON_LENGTH_DAYS of game time; four seasons make a studio year.
 * At season start the player may pick ONE focus (Craft, Relationships, Growth).
 * Each focus shows 2 objectives derived from ordinary deliveries. Progress is
 * causal ("Mara's second session counted as a repeat booking"), missing an
 * objective never takes anything away, and ignored focuses are not penalised.
 * At year end three transparent annual awards are judged from the same ledger.
 *
 * Everything here is pure + deterministic (no RNG, no clocks). The resolve guard
 * is the season number: a season can only be resolved while it is the current
 * one, so save/load (or a repeated day tick) can never resolve it twice.
 */
import type { ClientRelationshipTier, GameState } from '@/types/game';

export const SEASON_LENGTH_DAYS = 30;
export const SEASONS_PER_YEAR = 4;
/** Safety cap: a huge day skip resolves at most this many seasons per tick. */
const MAX_RESOLVES_PER_TICK = SEASONS_PER_YEAR;
/** Yearbook + ledger caps keep saves lightweight on very long runs. */
const MAX_LEDGER = 120;
const MAX_HISTORY = 40;

export type StudioFocus = 'craft' | 'relationships' | 'growth';
export const STUDIO_FOCUSES: StudioFocus[] = ['craft', 'relationships', 'growth'];

export interface SeasonDelivery {
  seasonNumber: number;
  day: number;
  projectId: string;
  title: string;
  clientKey?: string;
  clientName?: string;
  quality: number;
  revenue: number;
  /** The client had delivered before. */
  isRepeat: boolean;
  /** Completed sessions with this client including this one. */
  sessionNumber: number;
  tierBefore?: ClientRelationshipTier;
  tierAfter?: ClientRelationshipTier;
  staffName?: string;
}

export interface StudioSeasonRecord {
  seasonId: string;
  chosenFocus: StudioFocus | 'none';
  completedObjectives: string[];
  notableProjectIds: string[];
  awards: string[];
  endingCash: number;
  endingReputation: number;
}

export type AwardStatus = 'winner' | 'nominated' | 'not_nominated';
export interface AwardResult {
  id: string;
  name: string;
  criteria: string;
  status: AwardStatus;
  why: string;
  projectIds: string[];
}

export interface StudioSeasonState {
  seasonNumber: number;
  startDay: number;
  focus: StudioFocus | null;
  startRooms: number;
  deliveries: SeasonDelivery[];
  history: StudioSeasonRecord[];
  /** Plaques and titles earned (horizontal rewards, no multipliers). */
  titles: string[];
  /** Season numbers already resolved; the double-resolve guard. */
  resolved: number[];
}

export interface ObjectiveProgress {
  id: string;
  label: string;
  current: number;
  target: number;
  done: boolean;
  /** Causal explanation of the latest movement, or what counts. */
  reason: string;
}

// ── Static tables ─────────────────────────────────────────────────────────

export const FOCUS_INFO: Record<StudioFocus, { name: string; tagline: string; title: string }> = {
  craft: { name: 'Craft', tagline: 'Deliver consistently excellent work.', title: 'Craftsman plaque' },
  relationships: { name: 'Relationships', tagline: 'Become the studio artists come back to.', title: 'Open-door plaque' },
  growth: { name: 'Growth', tagline: 'Expand capacity responsibly.', title: 'Growth plaque' },
};

const SOLID_QUALITY = 70;
const STANDOUT_QUALITY = 85;
const GROWTH_REVENUE = 3000;
const TIER_ORDER: ClientRelationshipTier[] = ['Unknown', 'Acquaintance', 'Friendly', 'Regular', 'Loyal', 'Advocate'];
const tierRank = (t?: ClientRelationshipTier): number => Math.max(0, TIER_ORDER.indexOf(t ?? 'Unknown'));

const ORDINALS = ['zeroth', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
const ordinal = (n: number): string => ORDINALS[n] ?? `${n}th`;
const who = (d: SeasonDelivery): string => d.clientName ?? 'The studio';

// ── State helpers ─────────────────────────────────────────────────────────

export function createSeasonState(startDay: number, startRooms = 0): StudioSeasonState {
  return {
    seasonNumber: 1,
    startDay: Math.max(1, Math.floor(startDay)),
    focus: null,
    startRooms,
    deliveries: [],
    history: [],
    titles: [],
    resolved: [],
  };
}

const unlockedRooms = (s: GameState): number => (s.studioRooms ?? []).filter(r => r.unlocked).length;

/** Lazily adds season state to legacy saves. */
export function ensureSeasons(state: GameState): GameState {
  if (state.studioSeasons) return state;
  return { ...state, studioSeasons: createSeasonState(state.currentDay, unlockedRooms(state)) };
}

export const seasonId = (n: number): string => `S${n}`;
export const yearOfSeason = (n: number): number => Math.floor((n - 1) / SEASONS_PER_YEAR) + 1;
export const isYearEnd = (n: number): boolean => n % SEASONS_PER_YEAR === 0;
export const seasonEndDay = (s: StudioSeasonState): number => s.startDay + SEASON_LENGTH_DAYS;
export const seasonDaysLeft = (s: StudioSeasonState, day: number): number =>
  Math.max(0, seasonEndDay(s) - day);

export function chooseFocus(state: GameState, focus: StudioFocus): GameState {
  const seasons = ensureSeasons(state).studioSeasons!;
  if (!STUDIO_FOCUSES.includes(focus)) return state;
  // Switching is free: the ledger is shared, so nothing is lost or re-earned.
  return { ...ensureSeasons(state), studioSeasons: { ...seasons, focus } };
}

// ── Recording deliveries ──────────────────────────────────────────────────

export interface DeliveryInput {
  projectId: string;
  title: string;
  clientKey?: string;
  clientName?: string;
  quality: number;
  revenue: number;
  sessionsBefore: number;
  sessionsAfter: number;
  tierBefore?: ClientRelationshipTier;
  tierAfter?: ClientRelationshipTier;
  staffName?: string;
  day: number;
}

/** Appends one delivery to the ledger. Idempotent per project id within a season. */
export function recordSeasonDelivery(state: GameState, input: DeliveryInput): GameState {
  const base = ensureSeasons(state);
  const seasons = base.studioSeasons!;
  if (seasons.deliveries.some(d => d.projectId === input.projectId && d.seasonNumber === seasons.seasonNumber)) {
    return base;
  }
  const delivery: SeasonDelivery = {
    seasonNumber: seasons.seasonNumber,
    day: input.day,
    projectId: input.projectId,
    title: input.title,
    clientKey: input.clientKey,
    clientName: input.clientName,
    quality: Math.max(0, Math.min(100, Math.round(input.quality))),
    revenue: Math.max(0, Math.round(input.revenue)),
    isRepeat: input.sessionsBefore > 0,
    sessionNumber: input.sessionsAfter,
    tierBefore: input.tierBefore,
    tierAfter: input.tierAfter,
    staffName: input.staffName,
  };
  return {
    ...base,
    studioSeasons: { ...seasons, deliveries: [...seasons.deliveries, delivery].slice(-MAX_LEDGER) },
  };
}

// ── Objectives ────────────────────────────────────────────────────────────

const seasonDeliveries = (s: StudioSeasonState): SeasonDelivery[] =>
  s.deliveries.filter(d => d.seasonNumber === s.seasonNumber);

export function evaluateObjectives(
  focus: StudioFocus,
  seasons: StudioSeasonState,
  rooms: number,
): ObjectiveProgress[] {
  const ds = seasonDeliveries(seasons);
  const mk = (
    id: string,
    label: string,
    current: number,
    target: number,
    reason: string,
  ): ObjectiveProgress => ({ id, label, current: Math.min(current, target), target, done: current >= target, reason });

  if (focus === 'craft') {
    const solid = ds.filter(d => d.quality >= SOLID_QUALITY);
    const last = solid[solid.length - 1];
    const top = ds.filter(d => d.quality >= STANDOUT_QUALITY);
    const best = top[top.length - 1];
    return [
      mk('craft-solid', `Deliver 3 sessions at quality ${SOLID_QUALITY}+`, solid.length, 3,
        last ? `"${last.title}" scored ${last.quality}, which counts toward solid work.` : `Sessions scoring ${SOLID_QUALITY}+ count.`),
      mk('craft-standout', `Deliver one standout (${STANDOUT_QUALITY}+)`, top.length, 1,
        best ? `"${best.title}" scored ${best.quality}. That is a standout.` : `One session scoring ${STANDOUT_QUALITY}+ does it.`),
    ];
  }
  if (focus === 'relationships') {
    const repeats = ds.filter(d => d.isRepeat);
    const lastRepeat = repeats[repeats.length - 1];
    const gains = ds.filter(d => tierRank(d.tierAfter) > tierRank(d.tierBefore));
    const lastGain = gains[gains.length - 1];
    return [
      mk('rel-repeat', 'Complete 3 repeat-client sessions', repeats.length, 3,
        lastRepeat
          ? `${who(lastRepeat)}'s ${ordinal(lastRepeat.sessionNumber)} session counted as a repeat booking.`
          : 'A session with a client you have worked with before counts.'),
      mk('rel-tier', 'Move one client up a relationship tier', gains.length, 1,
        lastGain
          ? `${who(lastGain)} moved from ${lastGain.tierBefore ?? 'Unknown'} to ${lastGain.tierAfter}.`
          : 'Deliver well for a client until their tier rises.'),
    ];
  }
  const revenue = ds.reduce((sum, d) => sum + d.revenue, 0);
  const lastPaid = [...ds].reverse().find(d => d.revenue > 0);
  const roomsAdded = Math.max(0, rooms - seasons.startRooms);
  return [
    mk('growth-revenue', `Earn $${GROWTH_REVENUE.toLocaleString()} from deliveries`, revenue, GROWTH_REVENUE,
      lastPaid ? `"${lastPaid.title}" paid $${lastPaid.revenue.toLocaleString()}.` : 'Delivery revenue this season counts.'),
    mk('growth-room', 'Open a new studio room', roomsAdded, 1,
      roomsAdded ? 'A new room is open for bookings.' : 'Buy a room from the studio expansion panel.'),
  ];
}

export function currentObjectives(state: GameState): ObjectiveProgress[] {
  const seasons = state.studioSeasons;
  if (!seasons?.focus) return [];
  return evaluateObjectives(seasons.focus, seasons, unlockedRooms(state));
}

// ── Annual awards ─────────────────────────────────────────────────────────

export const AWARD_CRITERIA = [
  { id: 'recording', name: 'Recording of the Year', criteria: 'Highest-quality delivery of the year. Winner 80+, nominated 65+.' },
  { id: 'relationships', name: 'Best Client Relationships', criteria: 'Most sessions with one client. Winner 3+, nominated 2.' },
  { id: 'growth', name: 'Studio Growth', criteria: 'Delivery revenue across the year. Winner $10,000+, nominated $6,000+.' },
] as const;

/** Judges a year's worth of deliveries. Also used live so criteria + standing are visible all year. */
export function evaluateAwards(deliveries: SeasonDelivery[]): AwardResult[] {
  const out: AwardResult[] = [];
  const [rec, rel, gro] = AWARD_CRITERIA;

  const best = deliveries.reduce<SeasonDelivery | null>((b, d) => (!b || d.quality > b.quality ? d : b), null);
  const recStatus: AwardStatus = !best ? 'not_nominated' : best.quality >= 80 ? 'winner' : best.quality >= 65 ? 'nominated' : 'not_nominated';
  out.push({
    ...rec,
    status: recStatus,
    why: best ? `"${best.title}" scored ${best.quality}${best.clientName ? ` for ${best.clientName}` : ''}.` : 'No deliveries yet this year.',
    projectIds: best ? [best.projectId] : [],
  });

  const perClient = new Map<string, SeasonDelivery[]>();
  for (const d of deliveries) {
    if (!d.clientKey) continue;
    perClient.set(d.clientKey, [...(perClient.get(d.clientKey) ?? []), d]);
  }
  let topClient: SeasonDelivery[] = [];
  for (const list of perClient.values()) if (list.length > topClient.length) topClient = list;
  const relStatus: AwardStatus = topClient.length >= 3 ? 'winner' : topClient.length >= 2 ? 'nominated' : 'not_nominated';
  out.push({
    ...rel,
    status: relStatus,
    why: topClient.length
      ? `${topClient.length} session${topClient.length === 1 ? '' : 's'} with ${topClient[0].clientName ?? 'one client'} this year.`
      : 'No client sessions yet this year.',
    projectIds: topClient.map(d => d.projectId),
  });

  const revenue = deliveries.reduce((s, d) => s + d.revenue, 0);
  const groStatus: AwardStatus = revenue >= 10000 ? 'winner' : revenue >= 6000 ? 'nominated' : 'not_nominated';
  out.push({
    ...gro,
    status: groStatus,
    why: `$${revenue.toLocaleString()} from ${deliveries.length} deliver${deliveries.length === 1 ? 'y' : 'ies'} this year.`,
    projectIds: [...deliveries].sort((a, b) => b.revenue - a.revenue).slice(0, 3).map(d => d.projectId),
  });
  return out;
}

const yearDeliveries = (s: StudioSeasonState, year: number): SeasonDelivery[] =>
  s.deliveries.filter(d => yearOfSeason(d.seasonNumber) === year);

export const currentAwardStanding = (state: GameState): AwardResult[] => {
  const s = state.studioSeasons;
  return evaluateAwards(s ? yearDeliveries(s, yearOfSeason(s.seasonNumber)) : []);
};

// ── Resolving seasons ─────────────────────────────────────────────────────

export interface SeasonResolution {
  record: StudioSeasonRecord;
  awards: AwardResult[];
  newTitles: string[];
  reputationGained: number;
}

/**
 * Resolves the CURRENT season if its days have elapsed. Returns null when the
 * season is still running or was already resolved (the double-resolve guard).
 */
export function resolveSeasonIfDue(state: GameState): { state: GameState; resolution: SeasonResolution } | null {
  const base = ensureSeasons(state);
  const s = base.studioSeasons!;
  if (base.currentDay < seasonEndDay(s)) return null;
  if (s.resolved.includes(s.seasonNumber)) return null;

  const rooms = unlockedRooms(base);
  const objectives = s.focus ? evaluateObjectives(s.focus, s, rooms) : [];
  const completed = objectives.filter(o => o.done);
  const ds = seasonDeliveries(s);
  const notable = [...ds].sort((a, b) => b.quality - a.quality).slice(0, 3).map(d => d.projectId);

  const yearEnd = isYearEnd(s.seasonNumber);
  const awards = yearEnd ? evaluateAwards(yearDeliveries(s, yearOfSeason(s.seasonNumber))) : [];
  const won = awards.filter(a => a.status === 'winner');

  const newTitles: string[] = [];
  // Horizontal rewards: a plaque for finishing the focus, a plaque per award won.
  if (s.focus && objectives.length > 0 && completed.length === objectives.length) {
    newTitles.push(`${FOCUS_INFO[s.focus].title} (Season ${s.seasonNumber})`);
  }
  for (const a of won) newTitles.push(`${a.name} (Year ${yearOfSeason(s.seasonNumber)})`);
  // Small reputation reward only: +1 per completed objective, +2 per award won.
  const reputationGained = completed.length + won.length * 2;

  const record: StudioSeasonRecord = {
    seasonId: seasonId(s.seasonNumber),
    chosenFocus: s.focus ?? 'none',
    completedObjectives: completed.map(o => o.id),
    notableProjectIds: notable,
    awards: won.map(a => a.id),
    endingCash: Math.round(base.money),
    endingReputation: Math.round(base.reputation + reputationGained),
  };

  // Next season starts where this one ended so days never overlap or drift.
  const next: StudioSeasonState = {
    seasonNumber: s.seasonNumber + 1,
    startDay: seasonEndDay(s),
    focus: null,
    startRooms: rooms,
    // Keep the rest of the current year for awards; drop older years.
    deliveries: s.deliveries.filter(d => yearOfSeason(d.seasonNumber) >= yearOfSeason(s.seasonNumber + 1)),
    history: [...s.history, record].slice(-MAX_HISTORY),
    titles: [...s.titles, ...newTitles],
    resolved: [...s.resolved, s.seasonNumber].slice(-MAX_HISTORY),
  };

  return {
    state: { ...base, reputation: base.reputation + reputationGained, studioSeasons: next },
    resolution: { record, awards, newTitles, reputationGained },
  };
}

/** Day tick: resolves every elapsed season (capped), returning all resolutions in order. */
export function advanceSeasonClock(state: GameState): { state: GameState; resolutions: SeasonResolution[] } {
  let current = ensureSeasons(state);
  const resolutions: SeasonResolution[] = [];
  for (let i = 0; i < MAX_RESOLVES_PER_TICK; i++) {
    const r = resolveSeasonIfDue(current);
    if (!r) break;
    current = r.state;
    resolutions.push(r.resolution);
  }
  return { state: current, resolutions };
}

/** One-line summary for the notification feed. */
export function describeResolution(r: SeasonResolution): string {
  const focus = r.record.chosenFocus === 'none' ? 'Open season' : `${FOCUS_INFO[r.record.chosenFocus].name} season`;
  const done = r.record.completedObjectives.length;
  const parts = [`${focus} ${r.record.seasonId} wrapped: ${done} objective${done === 1 ? '' : 's'} met.`];
  if (r.newTitles.length) parts.push(`Earned: ${r.newTitles.join(', ')}.`);
  if (r.reputationGained) parts.push(`+${r.reputationGained} reputation.`);
  return parts.join(' ');
}

/**
 * Project Review link: what this delivery will add to the current season focus.
 * Returns null when no focus is chosen or the delivery moves nothing.
 */
export function seasonReviewNote(
  state: GameState,
  delivery: { quality: number; isRepeat: boolean; clientName?: string },
): string | null {
  const s = state.studioSeasons;
  if (!s?.focus) return null;
  const objs = evaluateObjectives(s.focus, s, unlockedRooms(state));
  const name = FOCUS_INFO[s.focus].name;
  const show = (id: string, verb: string): string | null => {
    const o = objs.find(x => x.id === id);
    return o && !o.done ? `${name} season: ${verb} (${o.current + 1}/${o.target})` : null;
  };
  if (s.focus === 'craft') {
    if (delivery.quality >= STANDOUT_QUALITY) return show('craft-standout', 'this standout counts') ?? show('craft-solid', 'this solid work counts');
    if (delivery.quality >= SOLID_QUALITY) return show('craft-solid', 'this solid work counts');
  }
  if (s.focus === 'relationships' && delivery.isRepeat) {
    return show('rel-repeat', `${delivery.clientName ?? 'this client'} counts as a repeat booking`);
  }
  if (s.focus === 'growth') return `${name} season: this payout counts toward $${GROWTH_REVENUE.toLocaleString()} in delivery revenue`;
  return null;
}
