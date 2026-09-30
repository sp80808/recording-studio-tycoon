/**
 * Studio Know-How (issue #66): one spendable pool + non-spendable domain
 * familiarity. Meaningful work earns it; it unlocks capability (advanced
 * training, studio workflows) — it never converts into free quality.
 *
 * Pure + deterministic: every award comes from an explicit gameplay event.
 * All functions are immutable and return a fresh state.
 */

export type KnowHowDomain =
  | 'tracking'
  | 'production'
  | 'editing'
  | 'mixing'
  | 'mastering'
  | 'acoustics'
  | 'business';

export const KNOW_HOW_DOMAINS: KnowHowDomain[] = [
  'tracking', 'production', 'editing', 'mixing', 'mastering', 'acoustics', 'business',
];

export interface StudioKnowHow {
  totalEarned: number;
  available: number;
  totalSpent: number;
  domains: Record<KnowHowDomain, number>;
  /** One-time award ids (brief/synergy discoveries, courses, mods, unlocked capabilities). */
  discoveries: string[];
  /** How often each repeatable action key has paid out (drives diminishing returns). */
  repeatCounts: Record<string, number>;
  /** Recent award ids — guards against save/reload or double-fire duplicates. */
  awardLog: string[];
}

export type KnowHowEvent =
  | { kind: 'session'; eventId: string; domain: KnowHowDomain; repeatKey: string; grade: string; service?: boolean }
  | { kind: 'discovery'; eventId: string; domain: KnowHowDomain; label: string }
  | { kind: 'training'; eventId: string; domain: KnowHowDomain; courseId: string }
  | { kind: 'research'; eventId: string; modId: string };

export interface KnowHowAward {
  knowHow: number;
  domain: KnowHowDomain;
  domainXp: number;
  reason: string;
}

const AWARD_LOG_CAP = 60;
/** Payout multiplier by how many times the same repeatKey has already paid. */
const REPEAT_CURVE = [1, 0.75, 0.5, 0.25];

export const createInitialKnowHow = (): StudioKnowHow => ({
  totalEarned: 0,
  available: 0,
  totalSpent: 0,
  domains: { tracking: 0, production: 0, editing: 0, mixing: 0, mastering: 0, acoustics: 0, business: 0 },
  discoveries: [],
  repeatCounts: {},
  awardLog: [],
});

/** Legacy saves (and corrupt blobs) become a valid empty state. */
export const migrateKnowHow = (raw: unknown): StudioKnowHow => {
  const base = createInitialKnowHow();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<StudioKnowHow>;
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);
  const domains = { ...base.domains };
  for (const d of KNOW_HOW_DOMAINS) domains[d] = num(r.domains?.[d]);
  const repeatCounts: Record<string, number> = {};
  if (r.repeatCounts && typeof r.repeatCounts === 'object') {
    for (const [k, v] of Object.entries(r.repeatCounts)) repeatCounts[k] = num(v);
  }
  const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  return {
    totalEarned: num(r.totalEarned),
    available: num(r.available),
    totalSpent: num(r.totalSpent),
    domains,
    discoveries: strs(r.discoveries),
    repeatCounts,
    awardLog: strs(r.awardLog).slice(-AWARD_LOG_CAP),
  };
};

/** Map a stage name (e.g. "Final Mix", "Vocal Tracking") to a knowledge domain. */
export const domainForStage = (stageName: string): KnowHowDomain => {
  const n = stageName.toLowerCase();
  if (n.includes('master')) return 'mastering';
  if (n.includes('mix')) return 'mixing';
  if (n.includes('edit')) return 'editing';
  if (n.includes('produc') || n.includes('arrang') || n.includes('overdub')) return 'production';
  return 'tracking';
};

const GRADE_BASE: Record<string, number> = { 'S+': 4, S: 4, A: 3, B: 2, C: 1 };

const sessionAward = (e: Extract<KnowHowEvent, { kind: 'session' }>, repeats: number): KnowHowAward => {
  // A poor session still teaches (C still pays) but always pays less than a good one.
  const base = GRADE_BASE[e.grade] ?? 2;
  const mult = REPEAT_CURVE[Math.min(repeats, REPEAT_CURVE.length)] ?? 0;
  // Lower-risk service work is a little more instructive than showboating.
  const knowHow = Math.floor(base * mult + (e.service ? 0.5 : 0));
  // Domain familiarity also dries up once the exact same action is exhausted.
  const domainXp = Math.round(base * 2 * mult);
  const learned = e.grade === 'C' ? 'You learned from a rough session.' : 'You learned from the session.';
  return { knowHow: repeats >= REPEAT_CURVE.length ? 0 : Math.max(knowHow, 0), domain: e.domain, domainXp, reason: learned };
};

export interface KnowHowAwardResult {
  state: StudioKnowHow;
  award: KnowHowAward | null;
}

/** Apply one explicit gameplay event. Duplicate event ids are ignored. */
export const awardKnowHow = (state: StudioKnowHow, event: KnowHowEvent): KnowHowAwardResult => {
  if (state.awardLog.includes(event.eventId)) return { state, award: null };

  let award: KnowHowAward;
  let repeatCounts = state.repeatCounts;
  let discoveries = state.discoveries;

  if (event.kind === 'session') {
    const repeats = state.repeatCounts[event.repeatKey] ?? 0;
    award = sessionAward(event, repeats);
    repeatCounts = { ...state.repeatCounts, [event.repeatKey]: repeats + 1 };
  } else {
    // First-time learning only: one-shot keys pay once, ever.
    const key = `${event.kind}:${event.kind === 'research' ? event.modId : event.kind === 'training' ? event.courseId : event.eventId}`;
    if (state.discoveries.includes(key)) return { state, award: null };
    discoveries = [...state.discoveries, key];
    if (event.kind === 'discovery') {
      award = { knowHow: 4, domain: event.domain, domainXp: 10, reason: `Discovered ${event.label}.` };
    } else if (event.kind === 'training') {
      award = { knowHow: 2, domain: event.domain, domainXp: 12, reason: 'Training sank in.' };
    } else {
      award = { knowHow: 3, domain: 'acoustics', domainXp: 10, reason: 'Research paid off.' };
    }
  }

  return {
    state: {
      ...state,
      totalEarned: state.totalEarned + award.knowHow,
      available: state.available + award.knowHow,
      domains: { ...state.domains, [award.domain]: state.domains[award.domain] + award.domainXp },
      discoveries,
      repeatCounts,
      awardLog: [...state.awardLog, event.eventId].slice(-AWARD_LOG_CAP),
    },
    award,
  };
};

export const canSpendKnowHow = (state: StudioKnowHow, cost: number): boolean => cost <= state.available;

/** Spend from the single pool. Returns null if unaffordable. */
export const spendKnowHow = (state: StudioKnowHow, cost: number): StudioKnowHow | null => {
  if (cost < 0 || !canSpendKnowHow(state, cost)) return null;
  return { ...state, available: state.available - cost, totalSpent: state.totalSpent + cost };
};

// ---------------------------------------------------------------------------
// Gates: Know-How cost + domain familiarity (used by advanced training).
// ---------------------------------------------------------------------------

export interface KnowHowGate {
  cost: number;
  domain?: KnowHowDomain;
  minDomain?: number;
}

export const meetsKnowHowGate = (state: StudioKnowHow, gate: KnowHowGate): boolean =>
  canSpendKnowHow(state, gate.cost) &&
  (!gate.domain || state.domains[gate.domain] >= (gate.minDomain ?? 0));

export const describeKnowHowGate = (state: StudioKnowHow, gate: KnowHowGate): string | null => {
  if (gate.domain && state.domains[gate.domain] < (gate.minDomain ?? 0)) {
    return `Needs ${gate.minDomain} ${gate.domain} familiarity (you have ${state.domains[gate.domain]})`;
  }
  if (!canSpendKnowHow(state, gate.cost)) return `Needs ${gate.cost} Know-How (you have ${state.available})`;
  return null;
};

// ---------------------------------------------------------------------------
// Studio capabilities: horizontal unlocks earned through play, not level.
// ---------------------------------------------------------------------------

export interface StudioCapability {
  id: string;
  name: string;
  blurb: string;
  domain: KnowHowDomain;
  minDomain: number;
  cost: number;
}

export const STUDIO_CAPABILITIES: StudioCapability[] = [
  { id: 'session-templates', name: 'Session Templates', blurb: 'Save a known chain and set it up faster.', domain: 'tracking', minDomain: 20, cost: 5 },
  { id: 'fit-breakdown', name: 'Booking Fit Breakdown', blurb: 'See why an artist will (or won’t) gel with your room.', domain: 'production', minDomain: 25, cost: 6 },
  { id: 'gear-inspection', name: 'Gear Inspection Detail', blurb: 'Reveal hidden quirks on any gear you examine.', domain: 'acoustics', minDomain: 20, cost: 6 },
  { id: 'delegation-policy', name: 'Delegation Policy', blurb: 'Hand routine stages to a trusted engineer.', domain: 'business', minDomain: 20, cost: 8 },
];

export const isCapabilityUnlocked = (state: StudioKnowHow, id: string): boolean =>
  state.discoveries.includes(`capability:${id}`);

export const canUnlockCapability = (state: StudioKnowHow, cap: StudioCapability): boolean =>
  !isCapabilityUnlocked(state, cap.id) && meetsKnowHowGate(state, cap);

export const unlockCapability = (state: StudioKnowHow, id: string): StudioKnowHow | null => {
  const cap = STUDIO_CAPABILITIES.find(c => c.id === id);
  if (!cap || !canUnlockCapability(state, cap)) return null;
  const spent = spendKnowHow(state, cap.cost);
  return spent && { ...spent, discoveries: [...spent.discoveries, `capability:${id}`] };
};

/** The next few capabilities worth showing on the Career surface. */
export const nextCapabilities = (state: StudioKnowHow, limit = 3): StudioCapability[] =>
  STUDIO_CAPABILITIES.filter(c => !isCapabilityUnlocked(state, c.id)).slice(0, limit);

// ---------------------------------------------------------------------------
// GameState glue
// ---------------------------------------------------------------------------

/** Fold events into a game state's Know-How, tolerant of legacy saves. */
export const applyKnowHowEvents = <S extends { studioKnowHow?: StudioKnowHow }>(
  game: S,
  events: KnowHowEvent[],
): { game: S; awards: KnowHowAward[] } => {
  let kh = game.studioKnowHow ?? createInitialKnowHow();
  const awards: KnowHowAward[] = [];
  for (const ev of events) {
    const r = awardKnowHow(kh, ev);
    kh = r.state;
    if (r.award) awards.push(r.award);
  }
  return { game: { ...game, studioKnowHow: kh }, awards };
};

// ---------------------------------------------------------------------------
// Capability effects — small horizontal gameplay changes, never raw quality.
// ---------------------------------------------------------------------------

/** Session Templates: the first take of a stage on a chain you've run before sets up one work unit faster. */
export const sessionTemplateBonus = (
  kh: StudioKnowHow | undefined,
  repeatKey: string,
  sessionsTakenOnStage: number,
): number =>
  kh && isCapabilityUnlocked(kh, 'session-templates') && sessionsTakenOnStage === 0 && (kh.repeatCounts[repeatKey] ?? 0) > 0
    ? 1
    : 0;

/** Booking Fit Breakdown: how many brief-fit reasons the booking card shows (2 → full list). */
export const briefReasonLimit = (kh: StudioKnowHow | undefined): number =>
  kh && isCapabilityUnlocked(kh, 'fit-breakdown') ? 6 : 2;

/** Gear Inspection Detail: reveals per-item condition and bonus breakdown. */
export const canInspectGear = (kh: StudioKnowHow | undefined): boolean =>
  !!kh && isCapabilityUnlocked(kh, 'gear-inspection');

/** Delegation Policy: earns the basic automation feature without the producer-level gate. */
export const grantsDelegation = (kh: StudioKnowHow | undefined): boolean =>
  !!kh && isCapabilityUnlocked(kh, 'delegation-policy');
