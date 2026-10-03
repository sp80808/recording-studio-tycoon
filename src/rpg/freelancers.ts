/**
 * Specialist freelancer network (#69, first slice).
 *
 * Freelancers are lightweight contacts, not a second roster. At a stage whose work they specialise in, the player
 * may bring one in for a fee instead of using the crew. Offers are derived from (save seed, day, contact), so a
 * reload cannot reroll them, and an arranged stage locks its terms. Familiarity shortens lead time and trims the
 * rate; it never raises quality. Heavy booking shows as "limited availability" (longer lead), never as hidden quality.
 * Pure and deterministic.
 */
import type { GameState, Project } from '@/types/game';
import { createSeededRandom } from '@/simulation/seededRandom';
import { spend } from '@/economy/ledger';

export type Specialty = 'mix' | 'master' | 'session';
export type RateBand = 'low' | 'standard' | 'premium';

export type ContactUnlock =
  | { kind: 'start' }
  | { kind: 'premises'; tier: 1 | 2 | 3 }
  | { kind: 'client'; tier: 'Regular' | 'Loyal' }
  | { kind: 'staff'; count: number }
  | { kind: 'referral'; from: string; familiarity: number };

export interface FreelancerContact {
  id: string;
  name: string;
  specialties: Specialty[];
  tagline: string;
  /** Empty = works across genres without a preference. */
  genreAffinity: string[];
  rateBand: RateBand;
  /** 0-100. Lower means a delay is more likely to land on the arrival day. Never touches quality. */
  reliability: number;
  unlock: ContactUnlock;
}

export const FREELANCERS: readonly FreelancerContact[] = [
  { id: 'dev-rao', name: 'Dev Rao', specialties: ['mix'], tagline: 'Fast, punchy mixes out of a bedroom rig', genreAffinity: ['Rock', 'Hip-hop', 'Pop'], rateBand: 'low', reliability: 70, unlock: { kind: 'start' } },
  { id: 'hollis-bright', name: 'Hollis Bright', specialties: ['master'], tagline: 'Honest masters at a fair price', genreAffinity: [], rateBand: 'low', reliability: 85, unlock: { kind: 'start' } },
  { id: 'jo-marek', name: 'Jo Marek', specialties: ['session'], tagline: 'Session drummer who plays to the click and the room', genreAffinity: ['Rock', 'Country', 'Pop'], rateBand: 'standard', reliability: 80, unlock: { kind: 'start' } },
  { id: 'nia-chen', name: 'Nia Chen', specialties: ['mix'], tagline: 'Specialist mix engineer with a long client list', genreAffinity: ['Pop', 'Electronic', 'R&B'], rateBand: 'premium', reliability: 90, unlock: { kind: 'premises', tier: 1 } },
  { id: 'priya-nair', name: 'Priya Nair', specialties: ['master'], tagline: 'Streaming-ready masters, quick turnaround', genreAffinity: ['Pop', 'Electronic', 'Hip-hop'], rateBand: 'standard', reliability: 75, unlock: { kind: 'client', tier: 'Regular' } },
  { id: 'wendell-cray', name: 'Wendell Cray', specialties: ['master'], tagline: 'Vinyl-era ears, booked months ahead', genreAffinity: ['Rock', 'Jazz', 'Soul'], rateBand: 'premium', reliability: 92, unlock: { kind: 'premises', tier: 2 } },
  { id: 'tobi-adeyemi', name: 'Tobi Adeyemi', specialties: ['session'], tagline: 'Bass and keys, plays what the song needs', genreAffinity: ['Hip-hop', 'Electronic', 'Soul'], rateBand: 'low', reliability: 65, unlock: { kind: 'staff', count: 2 } },
  { id: 'ray-kowalski', name: 'Ray Kowalski', specialties: ['session'], tagline: 'Pedal steel and slide guitar', genreAffinity: ['Country', 'Folk', 'Rock'], rateBand: 'low', reliability: 78, unlock: { kind: 'client', tier: 'Loyal' } },
  { id: 'marta-lindqvist', name: 'Marta Lindqvist', specialties: ['mix'], tagline: 'Warm, wide acoustic mixes', genreAffinity: ['Jazz', 'Folk', 'Acoustic'], rateBand: 'standard', reliability: 82, unlock: { kind: 'referral', from: 'hollis-bright', familiarity: 2 } },
  { id: 'lucia-bellamy', name: 'Lucia Bellamy', specialties: ['session'], tagline: 'Strings and horn arrangements, booked as a section', genreAffinity: ['Soul', 'Jazz', 'Folk'], rateBand: 'standard', reliability: 72, unlock: { kind: 'referral', from: 'jo-marek', familiarity: 2 } },
  { id: 'kenji-watanabe', name: 'Kenji Watanabe', specialties: ['mix', 'master'], tagline: 'Mixes and masters in one sitting', genreAffinity: ['Electronic', 'Hip-hop'], rateBand: 'standard', reliability: 77, unlock: { kind: 'referral', from: 'dev-rao', familiarity: 2 } },
  { id: 'isa-moreau', name: 'Isa Moreau', specialties: ['session'], tagline: 'Vocal producer and session singer', genreAffinity: ['Pop', 'Soul', 'R&B'], rateBand: 'premium', reliability: 88, unlock: { kind: 'referral', from: 'nia-chen', familiarity: 2 } },
];
export const CONTACT_BY_ID: Record<string, FreelancerContact> = Object.fromEntries(FREELANCERS.map((c) => [c.id, c]));

export const SPECIALTY_LABEL: Record<Specialty, string> = { mix: 'Mix engineer', master: 'Mastering engineer', session: 'Session musician' };
export const RATE_LABEL: Record<RateBand, string> = { low: '£', standard: '££', premium: '£££' };

// ───────────── Tuning ─────────────
export const BASE_FEE: Record<RateBand, number> = { low: 40, standard: 75, premium: 150 };
export const BASE_LEAD: Record<RateBand, number> = { low: 0, standard: 1, premium: 2 };
/** Stage quality uplift by rate band; genre match adds or removes a little. Applied to that stage's gains only. */
export const BAND_UPLIFT: Record<RateBand, number> = { low: 0.04, standard: 0.08, premium: 0.12 };
export const GENRE_MATCH_BONUS = 0.03;
export const GENRE_MISMATCH_PENALTY = 0.03;
/** Familiarity needed for a preferred rate and for easier scheduling. */
export const PREFERRED_RATE_AT = 2;
export const REGULAR_RATE_AT = 4;
export const EASY_SCHEDULING_AT = 3;
export const BOOKING_WINDOW_DAYS = 7;
/** Bookings inside the window beyond this many push lead time out ("limited availability"). */
export const FREE_BOOKINGS_IN_WINDOW = 1;
/** Quality at or above which an outsourced stage counts as a successful collaboration. */
export const SUCCESS_QUALITY = 55;
export const LOG_CAP = 40;

// ───────────── State ─────────────
export interface FreelancerBooking { contactId: string; day: number; projectId: string }
export interface FreelancerState {
  known: string[];
  familiarity: Record<string, number>;
  log: FreelancerBooking[];
}
export interface OutsourcedStage {
  stageIndex: number;
  contactId: string;
  fee: number;
  arrangedDay: number;
  /** First day the specialist is in the room. Before it, the stage runs on the crew alone. */
  readyDay: number;
  /** Stage uplift locked at arrangement, so a later change to the tables cannot move a booked stage. */
  uplift: number;
}

type NetState = Pick<GameState, 'saveSeed' | 'currentDay' | 'money'> & Partial<Pick<GameState, 'freelancers' | 'premisesTier' | 'clientRelationships' | 'hiredStaff' | 'ledger'>>;

const EMPTY: FreelancerState = { known: [], familiarity: {}, log: [] };
export const getFreelancers = (s: { freelancers?: FreelancerState }): FreelancerState => s.freelancers ?? EMPTY;
export const familiarityWith = (s: { freelancers?: FreelancerState }, id: string): number => getFreelancers(s).familiarity[id] ?? 0;

const TIER_ORDER = ['Unknown', 'Acquaintance', 'Friendly', 'Regular', 'Loyal', 'Advocate'];

export function unlockMet(s: NetState, c: FreelancerContact): boolean {
  const u = c.unlock;
  switch (u.kind) {
    case 'start': return true;
    case 'premises': return (s.premisesTier ?? 0) >= u.tier;
    case 'client': return Object.values(s.clientRelationships ?? {}).some((r) => TIER_ORDER.indexOf(r.tier) >= TIER_ORDER.indexOf(u.tier));
    case 'staff': return (s.hiredStaff?.length ?? 0) >= u.count;
    case 'referral': return familiarityWith(s, u.from) >= u.familiarity;
  }
}

/** Every contact the player can call now. Once known, a contact stays known. */
export const knownContacts = (s: NetState): FreelancerContact[] => {
  const kept = new Set(getFreelancers(s).known);
  return FREELANCERS.filter((c) => kept.has(c.id) || unlockMet(s, c));
};

export const unlockHint = (c: FreelancerContact): string => {
  const u = c.unlock;
  switch (u.kind) {
    case 'start': return 'Already in your contacts';
    case 'premises': return u.tier === 1 ? 'Opens with a Project Studio' : u.tier === 2 ? 'Opens with a Commercial Studio' : 'Opens with a Multi-room Facility';
    case 'client': return `Introduced by a ${u.tier} client`;
    case 'staff': return `Introduced by your crew once you have ${u.count} staff`;
    case 'referral': return `Referred by ${CONTACT_BY_ID[u.from]?.name ?? 'a contact'} after ${u.familiarity} good jobs together`;
  }
};

// ───────────── Stage matching ─────────────
/** Which specialties could take a stage over. Empty = nothing worth outsourcing. */
export function specialtiesForStage(stageName: string): Specialty[] {
  const n = stageName.toLowerCase();
  const out: Specialty[] = [];
  if (/mix/.test(n)) out.push('mix');
  if (/master/.test(n)) out.push('master');
  if (/overdub|rhythm section|horn|string|pedal steel|live take|live session|full band|band tracking|harmony guitar|wall-of-guitars|power-chord|bed track|one-take|live recording|live-to-two|gang/.test(n)) out.push('session');
  return out;
}

// ───────────── Offers ─────────────
export interface FreelancerOffer {
  contact: FreelancerContact;
  stageIndex: number;
  fee: number;
  leadDays: number;
  readyDay: number;
  /** True when heavy recent booking lengthened the lead time. */
  limited: boolean;
  uplift: number;
  genreNote: string;
  /** Rough expected value of the uplift in cash, less the fee. Shown as a hint, never hidden from the player. */
  expectedNet: number;
  /** Fee as a share of the project's payout. */
  feeShare: number;
  familiarity: number;
  discount: number;
}

const round5 = (n: number) => Math.round(n / 5) * 5;
const weekOf = (day: number) => Math.floor(day / 7);

export const rateDiscount = (familiarity: number): number => (familiarity >= REGULAR_RATE_AT ? 0.18 : familiarity >= PREFERRED_RATE_AT ? 0.1 : 0);

export function upliftFor(c: FreelancerContact, genre: string): { uplift: number; note: string } {
  let u = BAND_UPLIFT[c.rateBand];
  let note = 'Works across genres';
  if (c.genreAffinity.length) {
    const hit = c.genreAffinity.some((g) => g.toLowerCase() === genre.toLowerCase());
    u += hit ? GENRE_MATCH_BONUS : -GENRE_MISMATCH_PENALTY;
    note = hit ? `Knows ${genre}` : `Not a ${genre} specialist`;
  }
  return { uplift: Math.round(u * 100) / 100, note };
}

/**
 * Rough cash value of stage uplift, as a multiple of the stage's payout share. Stage quality compounds into the
 * review grade and rating bonuses, so it is worth more than its raw share. This only drives the hint on each offer
 * and the dominance test; it is tuned so a mid-level job is near break-even and the extremes fall either side.
 */
export const QUALITY_TO_PAYOUT = 2.5;

export function feeFor(c: FreelancerContact, stageWorkUnits: number, familiarity: number): number {
  const scale = Math.max(0.6, Math.min(1.6, stageWorkUnits / 12));
  return Math.max(10, round5(BASE_FEE[c.rateBand] * scale * (1 - rateDiscount(familiarity))));
}

export function leadDaysFor(s: NetState, c: FreelancerContact): { days: number; limited: boolean } {
  const recent = getFreelancers(s).log.filter((b) => b.contactId === c.id && s.currentDay - b.day < BOOKING_WINDOW_DAYS).length;
  const load = Math.max(0, recent - FREE_BOOKINGS_IN_WINDOW);
  const busy = createSeededRandom(`fl:${s.saveSeed ?? 0}:${c.id}:${weekOf(s.currentDay)}`)() < 0.35 ? 1 : 0;
  const ease = familiarityWith(s, c.id) >= EASY_SCHEDULING_AT ? 1 : 0;
  const days = Math.max(0, BASE_LEAD[c.rateBand] + busy + load - ease);
  return { days, limited: busy + load > 0 };
}

/** The offers for one stage of a project, cheapest first. Derived, so identical on every read of the same day. */
export function offersFor(s: NetState, project: Pick<Project, 'genre' | 'payoutBase' | 'stages'>, stageIndex: number): FreelancerOffer[] {
  const stage = project.stages[stageIndex];
  if (!stage || stage.completed) return [];
  const wanted = specialtiesForStage(stage.stageName);
  if (!wanted.length) return [];
  const totalUnits = project.stages.reduce((t, st) => t + st.workUnitsBase, 0) || 1;
  const share = stage.workUnitsBase / totalUnits;
  return knownContacts(s)
    .filter((c) => c.specialties.some((sp) => wanted.includes(sp)))
    .map((c): FreelancerOffer => {
      const fam = familiarityWith(s, c.id);
      const fee = feeFor(c, stage.workUnitsBase, fam);
      const lead = leadDaysFor(s, c);
      const { uplift, note } = upliftFor(c, project.genre);
      const payout = Math.max(0, project.payoutBase ?? 0);
      return {
        contact: c, stageIndex, fee, leadDays: lead.days, readyDay: s.currentDay + lead.days, limited: lead.limited,
        uplift, genreNote: note,
        expectedNet: Math.round(payout * share * uplift * QUALITY_TO_PAYOUT - fee),
        feeShare: payout > 0 ? fee / payout : 1,
        familiarity: fam, discount: rateDiscount(fam),
      };
    })
    .sort((a, b) => a.fee - b.fee || a.contact.id.localeCompare(b.contact.id));
}

// ───────────── Arranging ─────────────
export const outsourcedStages = (p: Pick<Project, 'outsourcing'>): OutsourcedStage[] => p.outsourcing ?? [];
export const outsourcedAt = (p: Pick<Project, 'outsourcing'>, stageIndex: number): OutsourcedStage | undefined => outsourcedStages(p).find((o) => o.stageIndex === stageIndex);
export const freelancerFees = (p: Pick<Project, 'outsourcing'>): number => outsourcedStages(p).reduce((t, o) => t + o.fee, 0);

/** Share of a project's stages the crew did itself, 0-1. Drives the staff-development credit at delivery. */
export const internalShare = (p: Pick<Project, 'outsourcing' | 'stages'>): number =>
  p.stages.length ? 1 - Math.min(p.stages.length, outsourcedStages(p).length) / p.stages.length : 1;

/** Stage uplift to apply to this session's gains: only once the specialist has arrived. */
export const activeUplift = (p: Pick<Project, 'outsourcing'>, stageIndex: number, day: number): number => {
  const o = outsourcedAt(p, stageIndex);
  return o && day >= o.readyDay ? o.uplift : 0;
};

export type ArrangeResult = { ok: true; state: GameState; offer: FreelancerOffer } | { ok: false; reason: string };

export function arrangeFreelancer(state: GameState, stageIndex: number, contactId: string): ArrangeResult {
  const project = state.activeProject;
  if (!project) return { ok: false, reason: 'No active session.' };
  const stage = project.stages[stageIndex];
  if (!stage) return { ok: false, reason: 'No such stage.' };
  if (stageIndex < project.currentStageIndex || stage.completed) return { ok: false, reason: 'That stage is already finished.' };
  if (outsourcedAt(project, stageIndex)) return { ok: false, reason: 'This stage already has outside help booked.' };
  const offer = offersFor(state, project, stageIndex).find((o) => o.contact.id === contactId);
  if (!offer) return { ok: false, reason: 'That contact is not available for this stage.' };
  if (state.money < offer.fee) return { ok: false, reason: `You need $${offer.fee} to book ${offer.contact.name}.` };
  // Reliability only ever delays arrival, decided once when the booking is made.
  const slip = createSeededRandom(`fl-slip:${state.saveSeed ?? 0}:${project.id}:${stageIndex}:${contactId}`)() * 100 > offer.contact.reliability ? 1 : 0;
  const entry: OutsourcedStage = { stageIndex, contactId, fee: offer.fee, arrangedDay: state.currentDay, readyDay: offer.readyDay + slip, uplift: offer.uplift };
  const paid = spend(state, offer.fee, { category: 'freelancer-fee', projectId: project.id, sourceId: `fl-${project.id}-${stageIndex}`, memo: `${offer.contact.name}: ${stage.stageName}` });
  const fl = getFreelancers(state);
  const next: GameState = {
    ...paid,
    activeProject: { ...project, outsourcing: [...outsourcedStages(project), entry] },
    freelancers: {
      ...fl,
      known: [...new Set([...fl.known, ...knownContacts(state).map((c) => c.id)])],
      log: [...fl.log, { contactId, day: state.currentDay, projectId: project.id }].slice(-LOG_CAP),
    },
  };
  return { ok: true, state: next, offer: { ...offer, readyDay: entry.readyDay, leadDays: entry.readyDay - state.currentDay } };
}

// ───────────── Delivery ─────────────
/**
 * Called once per settled report. A good delivery adds one point of familiarity per outsourced contact (once per
 * contact per project) and may unlock referrals. Returns the new state plus a line for the review, if anything opened.
 */
export function settleFreelancers(state: GameState, project: Project | undefined, quality: number): { state: GameState; note?: string } {
  const used = project ? [...new Set(outsourcedStages(project).map((o) => o.contactId))] : [];
  const fl = getFreelancers(state);
  if (!project || !used.length) return { state };
  const familiarity = { ...fl.familiarity };
  if (quality >= SUCCESS_QUALITY) for (const id of used) familiarity[id] = (familiarity[id] ?? 0) + 1;
  const probe = { ...state, freelancers: { ...fl, familiarity } };
  const before = new Set(knownContacts(state).map((c) => c.id));
  const now = knownContacts(probe);
  const opened = now.filter((c) => !before.has(c.id));
  const next: GameState = { ...state, freelancers: { known: now.map((c) => c.id), familiarity, log: fl.log } };
  const note = opened.length ? ` ${opened.map((c) => c.name).join(' and ')} ${opened.length > 1 ? 'are' : 'is'} now in your contacts.` : undefined;
  return { state: next, note };
}
