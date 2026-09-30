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

export type StudioFocus = 'craft' | 'relationships' | 'growth' | 'efficiency' | 'discovery';
export const STUDIO_FOCUSES: StudioFocus[] = ['craft', 'relationships', 'growth', 'efficiency', 'discovery'];

export interface SeasonDelivery {
  seasonNumber: number;
  day: number;
  projectId: string;
  title: string;
  clientKey?: string;
  clientName?: string;
  genre?: string;
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
  /** Synergies known when the season began (Discovery baseline). Absent on season-1 legacy state. */
  startSynergies?: number;
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
  efficiency: { name: 'Efficiency', tagline: 'Run a tight operation.', title: 'Tight-ship plaque' },
  discovery: { name: 'Discovery', tagline: 'Explore new sounds and workflows.', title: 'Explorer plaque' },
};

const SOLID_QUALITY = 70;
const STANDOUT_QUALITY = 85;
const GROWTH_REVENUE = 3000;
const EFFICIENT_PAYOUT = 800;
const TIER_ORDER: ClientRelationshipTier[] = ['Unknown', 'Acquaintance', 'Friendly', 'Regular', 'Loyal', 'Advocate'];
const tierRank = (t?: ClientRelationshipTier): number => Math.max(0, TIER_ORDER.indexOf(t ?? 'Unknown'));

const ORDINALS = ['zeroth', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
const ordinal = (n: number): string => ORDINALS[n] ?? `${n}th`;
const who = (d: SeasonDelivery): string => d.clientName ?? 'The studio';

// ── State helpers ─────────────────────────────────────────────────────────

export function createSeasonState(startDay: number, startRooms = 0, startSynergies = 0): StudioSeasonState {
  return {
    seasonNumber: 1,
    startDay: Math.max(1, Math.floor(startDay)),
    focus: null,
    startRooms,
    startSynergies,
    deliveries: [],
    history: [],
    titles: [],
    resolved: [],
  };
}

const knownSynergies = (s: GameState): number => s.discoveredSynergies?.length ?? 0;
const unlockedRooms = (s: GameState): number => (s.studioRooms ?? []).filter(r => r.unlocked).length;

/** Lazily adds season state to legacy saves. */
export function ensureSeasons(state: GameState): GameState {
  if (state.studioSeasons) return state;
  return { ...state, studioSeasons: createSeasonState(state.currentDay, unlockedRooms(state), knownSynergies(state)) };
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
  genre?: string;
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
    genre: input.genre,
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
  synergies = seasons.startSynergies ?? 0,
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
  if (focus === 'efficiency') {
    const lastDone = ds[ds.length - 1];
    const worthwhile = ds.filter(d => d.quality >= SOLID_QUALITY && d.revenue >= EFFICIENT_PAYOUT);
    const lastWorth = worthwhile[worthwhile.length - 1];
    return [
      mk('eff-throughput', 'Deliver 4 sessions', ds.length, 4,
        lastDone ? `"${lastDone.title}" shipped on day ${lastDone.day}.` : 'Every finished delivery counts.'),
      mk('eff-paid', `Deliver 2 solid sessions paying $${EFFICIENT_PAYOUT}+`, worthwhile.length, 2,
        lastWorth ? `"${lastWorth.title}" scored ${lastWorth.quality} and paid $${lastWorth.revenue.toLocaleString()}.` : `Quality ${SOLID_QUALITY}+ with a $${EFFICIENT_PAYOUT}+ payout counts.`),
    ];
  }
  if (focus === 'discovery') {
    const genres = [...new Set(ds.map(d => d.genre).filter((g): g is string => !!g))];
    const lastNew = genres[genres.length - 1];
    const found = Math.max(0, synergies - (seasons.startSynergies ?? synergies));
    return [
      mk('disc-genres', 'Deliver work in 3 different genres', genres.length, 3,
        lastNew ? `${lastNew} is a new genre for this season (${genres.join(', ')}).` : 'Each new genre delivered this season counts once.'),
      mk('disc-synergy', 'Discover a new studio synergy', found, 1,
        found ? 'A new synergy entered the codex.' : 'Try a new gear and room combination.'),
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
  return evaluateObjectives(seasons.focus, seasons, unlockedRooms(state), knownSynergies(state));
}

// ── Annual awards ─────────────────────────────────────────────────────────

export const AWARD_CRITERIA = [
  { id: 'recording', name: 'Recording of the Year', criteria: 'Highest-quality delivery of the year. Winner 80+, nominated 65+.' },
  { id: 'relationships', name: 'Best Client Relationships', criteria: 'Most sessions with one client. Winner 3+, nominated 2.' },
  { id: 'engineer', name: 'Engineer Development', criteria: 'Most sessions delivered by one staff engineer. Winner 3+ at an average of 70+, nominated 2+.' },
  { id: 'growth', name: 'Studio Growth', criteria: 'Delivery revenue across the year. Winner $10,000+, nominated $6,000+.' },
  { id: 'reliable', name: 'Reliable Operator', criteria: 'Steady work: Winner 4+ deliveries with none under 60, nominated 3+ with at most one under 60.' },
  { id: 'breakthrough', name: 'Breakthrough Session', criteria: "A client's session that beat their previous one. Winner +15 and 75+, nominated +8." },
] as const;

const byId = (id: (typeof AWARD_CRITERIA)[number]['id']) => AWARD_CRITERIA.find(c => c.id === id)!;

/** Judges a year's worth of deliveries. Also used live so criteria + standing are visible all year. */
export function evaluateAwards(deliveries: SeasonDelivery[]): AwardResult[] {
  const out: AwardResult[] = [];
  const sorted = [...deliveries].sort((a, b) => a.day - b.day);

  const best = sorted.reduce<SeasonDelivery | null>((b, d) => (!b || d.quality > b.quality ? d : b), null);
  out.push({
    ...byId('recording'),
    status: !best ? 'not_nominated' : best.quality >= 80 ? 'winner' : best.quality >= 65 ? 'nominated' : 'not_nominated',
    why: best ? `"${best.title}" scored ${best.quality}${best.clientName ? ` for ${best.clientName}` : ''}.` : 'No deliveries yet this year.',
    projectIds: best ? [best.projectId] : [],
  });

  const perClient = new Map<string, SeasonDelivery[]>();
  for (const d of sorted) {
    if (!d.clientKey) continue;
    perClient.set(d.clientKey, [...(perClient.get(d.clientKey) ?? []), d]);
  }
  let topClient: SeasonDelivery[] = [];
  for (const list of perClient.values()) if (list.length > topClient.length) topClient = list;
  out.push({
    ...byId('relationships'),
    status: topClient.length >= 3 ? 'winner' : topClient.length >= 2 ? 'nominated' : 'not_nominated',
    why: topClient.length
      ? `${topClient.length} session${topClient.length === 1 ? '' : 's'} with ${topClient[0].clientName ?? 'one client'} this year.`
      : 'No client sessions yet this year.',
    projectIds: topClient.map(d => d.projectId),
  });

  const perStaff = new Map<string, SeasonDelivery[]>();
  for (const d of sorted) {
    if (!d.staffName) continue;
    perStaff.set(d.staffName, [...(perStaff.get(d.staffName) ?? []), d]);
  }
  let topStaff: SeasonDelivery[] = [];
  for (const list of perStaff.values()) if (list.length > topStaff.length) topStaff = list;
  const staffAvg = topStaff.length ? Math.round(topStaff.reduce((sum, d) => sum + d.quality, 0) / topStaff.length) : 0;
  out.push({
    ...byId('engineer'),
    status: topStaff.length >= 3 && staffAvg >= 70 ? 'winner' : topStaff.length >= 2 ? 'nominated' : 'not_nominated',
    why: topStaff.length
      ? `${topStaff[0].staffName} delivered ${topStaff.length} session${topStaff.length === 1 ? '' : 's'} averaging ${staffAvg}.`
      : 'No staff-led sessions yet this year.',
    projectIds: topStaff.map(d => d.projectId),
  });

  const revenue = sorted.reduce((s, d) => s + d.revenue, 0);
  out.push({
    ...byId('growth'),
    status: revenue >= 10000 ? 'winner' : revenue >= 6000 ? 'nominated' : 'not_nominated',
    why: `$${revenue.toLocaleString()} from ${sorted.length} deliver${sorted.length === 1 ? 'y' : 'ies'} this year.`,
    projectIds: [...sorted].sort((a, b) => b.revenue - a.revenue).slice(0, 3).map(d => d.projectId),
  });

  const weak = sorted.filter(d => d.quality < 60).length;
  out.push({
    ...byId('reliable'),
    status: sorted.length >= 4 && weak === 0 ? 'winner' : sorted.length >= 3 && weak <= 1 ? 'nominated' : 'not_nominated',
    why: `${sorted.length} deliver${sorted.length === 1 ? 'y' : 'ies'}, ${weak} under 60.`,
    projectIds: sorted.map(d => d.projectId).slice(0, 6),
  });

  let jump: { d: SeasonDelivery; gain: number } | null = null;
  const lastByClient = new Map<string, SeasonDelivery>();
  for (const d of sorted) {
    if (!d.clientKey) continue;
    const prev = lastByClient.get(d.clientKey);
    if (prev && (!jump || d.quality - prev.quality > jump.gain)) jump = { d, gain: d.quality - prev.quality };
    lastByClient.set(d.clientKey, d);
  }
  out.push({
    ...byId('breakthrough'),
    status: jump && jump.gain >= 15 && jump.d.quality >= 75 ? 'winner' : jump && jump.gain >= 8 ? 'nominated' : 'not_nominated',
    why: jump && jump.gain > 0
      ? `"${jump.d.title}" beat ${jump.d.clientName ?? 'the client'}'s previous session by ${jump.gain} points.`
      : 'No client session has beaten the one before it yet.',
    projectIds: jump && jump.gain > 0 ? [jump.d.projectId] : [],
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
  const objectives = s.focus ? evaluateObjectives(s.focus, s, rooms, knownSynergies(base)) : [];
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
    startSynergies: knownSynergies(base),
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
  delivery: { quality: number; isRepeat: boolean; clientName?: string; genre?: string },
): string | null {
  const s = state.studioSeasons;
  if (!s?.focus) return null;
  const objs = evaluateObjectives(s.focus, s, unlockedRooms(state), knownSynergies(state));
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
  if (s.focus === 'efficiency') {
    return show('eff-throughput', 'this delivery counts toward your throughput');
  }
  if (s.focus === 'discovery' && delivery.genre) {
    const seen = seasonDeliveries(s).some(d => d.genre === delivery.genre);
    return seen ? null : show('disc-genres', `${delivery.genre} is a new genre this season`);
  }
  if (s.focus === 'growth') return `${name} season: this payout counts toward $${GROWTH_REVENUE.toLocaleString()} in delivery revenue`;
  return null;
}
