/**
 * Studio pressure + property opportunities (#250, first slice).
 *
 * Pure, deterministic view over existing authoritative state. Nothing here is
 * persisted: pressure is derived from rooms, bookings, crew and the enquiry
 * queue, and opportunities are re-derived from (saveSeed, game week, tier).
 * The authoritative transition stays `applyPremisesMove`; an opportunity is a
 * framing of the same capability band, so rent/capacity/recruitment are not
 * duplicated here.
 */
import type { GameState } from '@/types/game';
import { createSeededRandom } from '@/simulation/seededRandom';
import { getPremisesOffer, getPremisesTier, premisesStaffCap, premisesMoveDeposit, PREMISES_TIERS } from '@/rpg/premises';
import { ARCHETYPE_MODIFIERS, type PremisesArchetype } from '@/rpg/premisesTraits';

export type { PremisesArchetype };

export type PressureReasonId = 'rooms-full' | 'enquiries-waiting' | 'crew-crowded' | 'live-room-missing' | 'strong-demand';

export interface StudioPressureReason {
  id: PressureReasonId;
  /** Short player-facing observation. */
  label: string;
  /** 0..1 contribution. */
  weight: number;
}

export interface StudioPressure {
  /** Booked rooms / unlocked rooms, 0..1. */
  utilisation: number;
  /** Waiting enquiries beyond the rooms that are free right now. */
  roomContention: number;
  /** Hired staff / physical staff cap. */
  crewCrowding: number;
  /** Enquiries that want a live room while none is unlocked. */
  capabilityMisses: number;
  /** Size of the open enquiry queue (recent suitable demand). */
  demandMomentum: number;
  reasons: StudioPressureReason[];
  /** Small aggregate that only drives opportunity cadence; reasons carry the meaning. */
  score: number;
}

export type PressureState = Pick<GameState, 'studioRooms'> & Partial<Pick<GameState, 'activeProjects' | 'activeProject' | 'availableProjects' | 'hiredStaff' | 'premisesTier' | 'reputation' | 'currentDay' | 'saveSeed' | 'money' | 'financials' | 'clientRelationships'>>;

const LIVE_HINT = /band|live|rock|metal|punk|folk|jazz/i;
/** Leads are live for one game week; the next week derives a fresh set from the same pressure. */
export const LEAD_WINDOW_DAYS = 7;
/** Opportunity cadence: below this the studio is coping and nobody phones. */
export const PRESSURE_OPPORTUNITY_THRESHOLD = 0.5;

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

export const deriveStudioPressure = (s: PressureState): StudioPressure => {
  const unlocked = (s.studioRooms ?? []).filter(r => r.unlocked);
  const activeList = s.activeProjects ?? [];
  const active = s.activeProject && !activeList.some(p => p.id === s.activeProject!.id) ? [...activeList, s.activeProject] : activeList;
  const booked = Math.min(unlocked.length, active.filter(p => !p.awaitingReview).length);
  const free = Math.max(0, unlocked.length - booked);
  const queue = s.availableProjects ?? [];
  const utilisation = unlocked.length ? booked / unlocked.length : 0;
  const roomContention = Math.max(0, queue.length - free);
  const cap = premisesStaffCap(s) || 1;
  const staffCount = s.hiredStaff?.length ?? 0;
  const crewCrowding = staffCount / cap;
  const hasLive = unlocked.some(r => r.id === 'live-room');
  const capabilityMisses = hasLive ? 0 : queue.filter(p => p.associatedBandId || LIVE_HINT.test(`${p.clientType} ${p.genre}`)).length;
  const demandMomentum = queue.length;

  const reasons: StudioPressureReason[] = [];
  if (utilisation >= 0.99 && roomContention > 0) {
    reasons.push({ id: 'rooms-full', label: `Every room is booked and ${roomContention} more ${roomContention === 1 ? 'client is' : 'clients are'} waiting`, weight: clamp01(0.5 + roomContention * 0.15) });
  } else if (free === 0 && queue.length >= 2) {
    reasons.push({ id: 'enquiries-waiting', label: `${queue.length} enquiries are queued with no free room`, weight: clamp01(0.3 + queue.length * 0.1) });
  }
  if (crewCrowding >= 0.8) {
    reasons.push({ id: 'crew-crowded', label: `Crew is crowding the space (${staffCount} of ${cap})`, weight: clamp01(crewCrowding - 0.3) });
  }
  if (capabilityMisses > 0) {
    reasons.push({ id: 'live-room-missing', label: `${capabilityMisses} ${capabilityMisses === 1 ? 'enquiry wants' : 'enquiries want'} a live room you don't have`, weight: clamp01(0.4 + capabilityMisses * 0.2) });
  }
  if (queue.length >= 4) {
    reasons.push({ id: 'strong-demand', label: 'Enquiries keep coming in faster than you can take them', weight: clamp01(queue.length * 0.12) });
  }
  const score = clamp01(reasons.reduce((m, r) => Math.max(m, r.weight), 0) + Math.max(0, reasons.length - 1) * 0.1);
  return { utilisation, roomContention, crewCrowding, capabilityMisses, demandMomentum, reasons, score };
};

export type PremisesSource = 'landlord' | 'referral' | 'agent' | 'distressed-sale';

export interface PremisesOpportunity {
  id: string;
  archetype: PremisesArchetype;
  source: PremisesSource;
  /** Existing capability band this property maps onto (drives applyPremisesMove). */
  internalTier: 1 | 2 | 3;
  name: string;
  deposit: number;
  dailyRent: number;
  staffCap: number;
  roomAllowanceBonus: number;
  /** What the place solves, tied to pressure reasons. */
  solves: string;
  /** What it costs or complicates. */
  tradeoff: string;
  /** Voice line from the world source (phone/landlord/referral). */
  cue: string;
  answers: PressureReasonId[];
  eligible: boolean;
  /** Cost shape of this archetype versus the band standard (deposit, rent, crew). */
  terms: string;
  /** Game day the lead goes cold (exclusive). A fresh, deterministic lead replaces it next window. */
  expiresDay: number;
  /** Whole days left to act, at least 1 while the lead is live. */
  daysLeft: number;
}

interface ArchetypeDef {
  archetype: PremisesArchetype;
  source: PremisesSource;
  name: string;
  answers: PressureReasonId[];
  solves: string;
  tradeoff: string;
  cue: string;
}

const ARCHETYPES: Record<1 | 2 | 3, ArchetypeDef[]> = {
  1: [
    { archetype: 'project-room', source: 'landlord', name: 'The spare unit upstairs', answers: ['rooms-full', 'enquiries-waiting'], solves: 'A proper second room so bookings stop colliding.', tradeoff: 'Thin walls and no street presence, so it will never impress a label.', cue: 'Your landlord rings: the unit upstairs is coming free and he would rather rent it to you.' },
    { archetype: 'basement', source: 'referral', name: 'Basement room behind the rehearsal rooms', answers: ['crew-crowded', 'live-room-missing'], solves: 'Space for the crew and a room that suits loud bands.', tradeoff: 'Damp, needs treatment, and clients have to find it.', cue: 'A drummer you recorded mentions a basement behind his rehearsal rooms that is going cheap.' },
  ],
  2: [
    { archetype: 'commercial', source: 'agent', name: 'Small city-centre commercial studio', answers: ['strong-demand', 'rooms-full', 'live-room-missing'], solves: 'Walk-in clients, a live room and the footprint to take on bigger jobs.', tradeoff: 'Rent bites every single day whether or not the rooms are booked.', cue: 'An estate agent emails a listing: a licensed commercial studio unit, city centre, ready to move into.' },
    { archetype: 'warehouse', source: 'referral', name: 'Warehouse unit on the industrial estate', answers: ['crew-crowded', 'live-room-missing', 'enquiries-waiting'], solves: 'Loads of floor for a live room and a bigger crew.', tradeoff: 'Cold, unglamorous and a long way from the clients who pay best.', cue: 'A band manager says a warehouse unit on the estate is empty and the owner wants it let fast.' },
  ],
  3: [
    { archetype: 'existing-studio', source: 'distressed-sale', name: 'Struggling multi-room studio, being sold', answers: ['strong-demand', 'rooms-full', 'crew-crowded'], solves: 'Several control rooms already built, so staff can work in parallel.', tradeoff: 'Highest deposit and a lot of ageing infrastructure to keep alive.', cue: 'Word gets round: a multi-room studio across town is quietly being sold off.' },
    { archetype: 'commercial', source: 'agent', name: 'Purpose-built facility lease', answers: ['strong-demand', 'enquiries-waiting', 'live-room-missing'], solves: 'A clean, modern layout with room to grow.', tradeoff: 'Long lease, steep rent, and nothing in it is yours yet.', cue: 'An agent sends over a purpose-built facility lease: three rooms, reception, big rent.' },
  ],
};

/**
 * Deterministic 0-2 opportunities for the next premises move. Same state and
 * seed give the same set; they change at most weekly. Empty when the studio is
 * coping or no further move exists, so a calm studio is never spammed.
 */
export const generatePremisesOpportunities = (s: PressureState): PremisesOpportunity[] => {
  const offer = getPremisesOffer(s as Parameters<typeof getPremisesOffer>[0]);
  if (!offer) return [];
  const pressure = deriveStudioPressure(s);
  if (pressure.score < PRESSURE_OPPORTUNITY_THRESHOLD || pressure.reasons.length === 0) return [];
  const tier = offer.tier;
  const week = Math.floor((s.currentDay ?? 0) / 7);
  const seed = `${s.saveSeed ?? 'rst'}|premises|${getPremisesTier(s)}|${week}`;
  const rand = createSeededRandom(seed);
  const reasonIds = new Set(pressure.reasons.map(r => r.id));
  const def = PREMISES_TIERS[tier];
  const ranked = ARCHETYPES[tier]
    .map(a => ({ a, fit: a.answers.filter(r => reasonIds.has(r)).length + rand() * 0.5 }))
    .sort((x, y) => y.fit - x.fit)
    .map(x => x.a);
  const count = pressure.reasons.length >= 2 || rand() > 0.5 ? 2 : 1;
  const day = Math.floor(s.currentDay ?? 0);
  const expiresDay = (week + 1) * LEAD_WINDOW_DAYS;
  return ranked.slice(0, count).map(a => {
    const mod = ARCHETYPE_MODIFIERS[a.archetype];
    return {
    id: `${seed}|${a.archetype}`,
    archetype: a.archetype,
    source: a.source,
    internalTier: tier,
    name: a.name,
    deposit: premisesMoveDeposit(offer, a.archetype),
    dailyRent: Math.round(offer.dailyRent * mod.rentMult),
    staffCap: def.staffCap + mod.staffCapDelta,
    roomAllowanceBonus: def.roomAllowanceBonus,
    solves: a.solves,
    tradeoff: a.tradeoff,
    cue: a.cue,
    answers: a.answers,
    eligible: offer.eligible && (s.money ?? 0) >= premisesMoveDeposit(offer, a.archetype),
    terms: mod.terms,
    expiresDay,
    daysLeft: Math.max(1, expiresDay - day),
    };
  });
};

/** The single in-world line (phone / landlord / referral) that opens the opportunity, or null. */
export const getPremisesWorldCue = (s: PressureState): string | null =>
  generatePremisesOpportunities(s)[0]?.cue ?? null;
