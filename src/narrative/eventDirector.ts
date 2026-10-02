/**
 * Studio Event Director — the one authoritative path for "what story beat happens next".
 *
 * Simulation facts + a compact memory ledger go in; at most one authored event comes out. Selection is
 * deterministic (seeded by save seed, day, opportunity key and sequence number), suppresses repetition
 * (per-event cooldowns, occurrence caps, same-family anti-repeat) and prefers silence to filler.
 *
 * The director never owns settlement. Narrative content only *describes* effects as typed `DomainEffect`s; this
 * module validates them (whitelist + magnitude caps + affordability) and is the only place that applies them.
 * Selection is recorded before presentation and resolving is idempotent, so reload/double-click cannot pay twice.
 *
 * Pure functions over `GameState`; everything persists in `storylineState.director` (absent on old saves = empty).
 */
import { isMaintainable } from '@/features/usedGear/condition';
import { hashSeed, createSeededRandom } from '@/simulation/seededRandom';
import type { ClientRelationship, GameState } from '@/types/game';
import type { ChronicleEntry, StorylineState } from './branchingStorylineEngine';

// ───────────────────────────── Types ─────────────────────────────

export type StudioMemoryScope = 'studio' | 'client' | 'staff' | 'project' | 'gear' | 'band';

export interface StudioMemory {
  id: string;
  scope: StudioMemoryScope;
  entityId?: string;
  key: string;
  createdDay: number;
  expiresDay?: number;
  intensity?: number;
  sourceEventId: string;
}

/** Everything an event may ask the game to change. Anything else is rejected. */
export type DomainEffect =
  | { kind: 'money'; amount: number }
  | { kind: 'reputation'; amount: number }
  | { kind: 'xp'; amount: number }
  | { kind: 'clientXp'; amount: number }
  | { kind: 'staffXp'; amount: number }
  | { kind: 'gearCondition'; amount: number }
  | { kind: 'referral' };

/** Read-only band facts (real `GameState.bands` rows, flattened for eligibility checks). */
export interface StudioBandFacts {
  id: string;
  name: string;
  genre: string;
  fame: number;
  notoriety: number;
  onTour: boolean;
  isPlayerCreated: boolean;
  releases: number;
  daysSinceShow?: number;
}

export interface MemoryWrite {
  scope?: StudioMemoryScope;
  key: string;
  /** Days until it fades; absent = permanent. */
  ttlDays?: number;
  intensity?: number;
}

export interface DirectorOption {
  id: string;
  label: string;
  flavorText: string;
  effects: readonly DomainEffect[];
  memories?: readonly MemoryWrite[];
  outcome: string;
}

export interface DirectorSubject {
  scope: StudioMemoryScope;
  id: string;
  label: string;
}

export interface StudioEventFacts {
  day: number;
  era: string;
  /** Home city picked at career start; undefined on legacy saves. */
  cityId?: string;
  money: number;
  reputation: number;
  staffCount: number;
  equipmentCount: number;
  clients: readonly ClientRelationship[];
  staff: ReadonlyArray<{ id: string; name: string }>;
  gear: ReadonlyArray<{ id: string; name: string; condition?: number; faulted?: boolean; maintainable?: boolean }>;
  /** Bands on the studio's books (`GameState.bands`), for band-lifecycle events. */
  bands: readonly StudioBandFacts[];
  /** Does the ledger hold `key` for the scope/entity? Expired memories never match. */
  has: (scope: StudioMemoryScope, key: string, entityId?: string) => boolean;
  flag: (name: string) => boolean;
}

export interface StudioEventDefinition {
  id: string;
  family: string;
  baseWeight: number;
  cooldownDays: number;
  /** Per subject when the event has one, otherwise global. */
  maxOccurrences?: number;
  /** Memory keys that must exist (on the subject, or `studio/…`-prefixed for studio scope). */
  requiredMemories?: readonly string[];
  blockedMemories?: readonly string[];
  /** Multiply the weight when one of these memories exists. */
  memoryWeights?: Readonly<Record<string, number>>;
  /** Choose who the event is about; undefined = not eligible. */
  pickSubject?: (facts: StudioEventFacts) => DirectorSubject | undefined;
  eligible: (facts: StudioEventFacts, subject?: DirectorSubject) => boolean;
  /** Key a UI layer (or Ink) uses to find presentation text. */
  narrativeKey: string;
  kicker: string;
  title: string;
  context: (subject?: DirectorSubject) => string;
  options: readonly DirectorOption[];
  /** Focus Mode may resolve the event with `defaultOptionId` instead of interrupting. */
  delegable?: boolean;
  defaultOptionId?: string;
}

export interface DirectorRecord {
  eventId: string;
  family: string;
  day: number;
  subjectId?: string;
  optionId?: string;
}

export interface PendingDirectorEvent {
  eventId: string;
  openedDay: number;
  subject?: DirectorSubject;
}

export interface DirectorState {
  memories: StudioMemory[];
  history: DirectorRecord[];
  /** Bumped once per opportunity (including silent ones) so seeds never repeat. */
  opportunitySeq: number;
  lastOpportunityDay?: number;
  lastEventDay?: number;
  pending?: PendingDirectorEvent;
  /** End-of-day beat for the current day (see dayClose.ts). */
  dayClose?: { day: number; lineId: string; text: string; tone: 'good' | 'neutral' | 'warn' };
  /** Recent day-close line ids, so the same line is not repeated too soon. */
  dayCloseLog?: Array<{ day: number; lineId: string }>;
}

// ───────────────────────────── Constants ─────────────────────────────

/** Quiet days between one story beat (subplot or director) and the next director beat. */
export const DIRECTOR_GAP_DAYS = 3;
/** Same-family rule: at most this many of the recent records may share a family… */
export const FAMILY_MAX_IN_WINDOW = 2;
/** …where "recent" means the last N records within this many days. */
export const FAMILY_WINDOW_RECORDS = 5;
export const FAMILY_WINDOW_DAYS = 14;
const MEMORY_LIMIT = 200;
const HISTORY_LIMIT = 120;

/** Hard caps applied to any effect, whatever the narrative content asks for. */
export const EFFECT_LIMITS = { money: 5000, reputation: 25, xp: 500, clientXp: 100, staffXp: 60, gearCondition: 15 } as const;

const EMPTY: DirectorState = { memories: [], history: [], opportunitySeq: 0 };

// ───────────────────────────── State access ─────────────────────────────

export const getDirector = (state: GameState): DirectorState => state.storylineState?.director ?? EMPTY;

const withDirector = (state: GameState, director: DirectorState, chronicle?: ChronicleEntry): GameState => {
  const story = state.storylineState;
  if (!story) return state;
  const next: StorylineState = { ...story, director };
  if (chronicle) next.chronicle = [...(story.chronicle ?? []), chronicle].slice(-60);
  return { ...state, storylineState: next };
};

const memoryId = (scope: StudioMemoryScope, key: string, entityId?: string): string =>
  `${scope}:${entityId ?? '-'}/${key}`;

const isLive = (m: StudioMemory, day: number): boolean => m.expiresDay === undefined || m.expiresDay > day;

export const hasMemory = (state: GameState, scope: StudioMemoryScope, key: string, entityId?: string): boolean => {
  const id = memoryId(scope, key, entityId);
  const day = state.currentDay;
  return getDirector(state).memories.some((m) => m.id === id && isLive(m, day));
};

/** Write or refresh a memory (same scope/entity/key replaces the old one). */
export const addMemory = (
  state: GameState,
  write: MemoryWrite & { scope: StudioMemoryScope; entityId?: string; sourceEventId: string },
): GameState => {
  if (!state.storylineState) return state;
  const director = getDirector(state);
  const id = memoryId(write.scope, write.key, write.entityId);
  const memory: StudioMemory = {
    id,
    scope: write.scope,
    entityId: write.entityId,
    key: write.key,
    createdDay: state.currentDay,
    expiresDay: write.ttlDays !== undefined ? state.currentDay + write.ttlDays : undefined,
    intensity: write.intensity,
    sourceEventId: write.sourceEventId,
  };
  const memories = [...director.memories.filter((m) => m.id !== id && isLive(m, state.currentDay)), memory].slice(-MEMORY_LIMIT);
  return withDirector(state, { ...director, memories });
};

// ───────────────────────────── Facts ─────────────────────────────

export const buildFacts = (state: GameState): StudioEventFacts => ({
  day: state.currentDay,
  era: state.currentEra || state.selectedEra || '',
  cityId: state.cityId,
  money: state.money ?? 0,
  reputation: state.reputation ?? 0,
  staffCount: state.hiredStaff?.length ?? 0,
  equipmentCount: state.ownedEquipment?.length ?? 0,
  clients: Object.values(state.clientRelationships ?? {}).sort((a, b) => a.clientId.localeCompare(b.clientId)),
  staff: (state.hiredStaff ?? []).map((m) => ({ id: m.id, name: m.name })),
  gear: (state.ownedEquipment ?? []).map((e) => ({
    id: e.id,
    name: e.name,
    condition: e.condition,
    faulted: Boolean(e.fault && state.currentDay < e.fault.readyDay),
    maintainable: isMaintainable(e),
  })),
  bands: (state.bands ?? []).map((b) => ({
    id: b.id,
    name: b.bandName,
    genre: b.genre,
    fame: b.fame ?? 0,
    notoriety: b.notoriety ?? 0,
    onTour: Boolean(b.tourStatus?.isOnTour),
    isPlayerCreated: Boolean(b.isPlayerCreated),
    releases: b.pastReleases?.length ?? 0,
    daysSinceShow: typeof b.lastShowDay === 'number' ? state.currentDay - b.lastShowDay : undefined,
  })),
  has: (scope, key, entityId) => hasMemory(state, scope, key, entityId),
  flag: (name) => Boolean(state.storylineState?.storyFlags?.[name]),
});

// ───────────────────────────── Selection ─────────────────────────────

const directorSeed = (state: GameState, key: string, seq: number): string =>
  `${state.saveSeed ?? state.storylineState?.runSeed ?? 4242}:director:${state.currentDay}:${key}:${seq}`;

const requiredMemoryHolds = (facts: StudioEventFacts, key: string, subject?: DirectorSubject): boolean =>
  key.startsWith('studio/')
    ? facts.has('studio', key.slice(7))
    : subject
      ? facts.has(subject.scope, key, subject.id)
      : false;

export interface Candidate {
  id: string;
  family: string;
  weight: number;
}

/** Drop candidates whose family already filled the recent window. */
export const applyFamilyAntiRepeat = <T extends Candidate>(state: GameState, candidates: readonly T[]): T[] => {
  const recent = getDirector(state)
    .history.filter((h) => state.currentDay - h.day <= FAMILY_WINDOW_DAYS)
    .slice(-FAMILY_WINDOW_RECORDS);
  return candidates.filter((c) => recent.filter((h) => h.family === c.family).length < FAMILY_MAX_IN_WINDOW);
};

/** Seeded weighted pick among already-eligible candidates. */
export const pickWeighted = <T extends Candidate>(state: GameState, candidates: readonly T[], key: string): T | null => {
  const pool = candidates.filter((c) => c.weight > 0);
  if (pool.length === 0) return null;
  const rng = createSeededRandom(directorSeed(state, key, getDirector(state).opportunitySeq));
  const total = pool.reduce((sum, c) => sum + c.weight, 0);
  let roll = rng() * total;
  for (const c of pool) {
    roll -= c.weight;
    if (roll < 0) return c;
  }
  return pool[pool.length - 1];
};

/** Record that something (a subplot, a director event) was chosen, for cooldown and anti-repeat. */
export const recordSelection = (state: GameState, record: Omit<DirectorRecord, 'day'>): GameState => {
  if (!state.storylineState) return state;
  const director = getDirector(state);
  const history = [...director.history, { ...record, day: state.currentDay }].slice(-HISTORY_LIMIT);
  return withDirector(state, { ...director, history, lastEventDay: state.currentDay });
};

interface Eligible {
  def: StudioEventDefinition;
  subject?: DirectorSubject;
  weight: number;
}

/** Resolve which authored events are eligible right now, with weights. Pure. */
export const resolveEligibleEvents = (state: GameState, defs: readonly StudioEventDefinition[]): Eligible[] => {
  const facts = buildFacts(state);
  const director = getDirector(state);
  const out: Eligible[] = [];

  for (const def of defs) {
    const subject = def.pickSubject ? def.pickSubject(facts) : undefined;
    if (def.pickSubject && !subject) continue;
    if (!def.eligible(facts, subject)) continue;

    const mine = director.history.filter((h) => h.eventId === def.id && (!subject || h.subjectId === subject.id));
    if (def.maxOccurrences !== undefined && mine.length >= def.maxOccurrences) continue;
    const lastAny = director.history.filter((h) => h.eventId === def.id).slice(-1)[0];
    if (lastAny && state.currentDay - lastAny.day < def.cooldownDays) continue;

    if (def.requiredMemories && !def.requiredMemories.every((k) => requiredMemoryHolds(facts, k, subject))) continue;
    if (def.blockedMemories && def.blockedMemories.some((k) => requiredMemoryHolds(facts, k, subject))) continue;

    let weight = def.baseWeight;
    for (const [k, mult] of Object.entries(def.memoryWeights ?? {})) {
      if (requiredMemoryHolds(facts, k, subject)) weight *= mult;
    }
    out.push({ def, subject, weight });
  }
  return out;
};

export const selectDirectorEvent = (
  state: GameState,
  defs: readonly StudioEventDefinition[],
  opportunityKey: string,
): { def: StudioEventDefinition; subject?: DirectorSubject } | null => {
  const eligible = resolveEligibleEvents(state, defs);
  const allowed = applyFamilyAntiRepeat(
    state,
    eligible.map((e) => ({ ...e, id: e.def.id, family: e.def.family })),
  );
  const pick = pickWeighted(state, allowed, opportunityKey);
  return pick ? { def: pick.def, subject: pick.subject } : null;
};

// ───────────────────────────── Opening & resolving ─────────────────────────────

/**
 * Take one opportunity. At most one event is opened, and only when nothing else is waiting — so offline
 * catch-up (many days in one go) can never dump several modals at once. Silence is a valid outcome.
 */
export const takeDirectorOpportunity = (
  state: GameState,
  defs: readonly StudioEventDefinition[],
  opts: { busy?: boolean; lastOtherBeatDay?: number } = {},
): GameState => {
  const story = state.storylineState;
  if (!story || opts.busy) return state;
  const director = getDirector(state);
  if (director.pending) return state;
  if (director.lastOpportunityDay === state.currentDay) return state;

  const lastBeat = Math.max(director.lastEventDay ?? -999, opts.lastOtherBeatDay ?? -999);
  if (state.currentDay - lastBeat < DIRECTOR_GAP_DAYS) return state;

  const spent = withDirector(state, {
    ...director,
    opportunitySeq: director.opportunitySeq + 1,
    lastOpportunityDay: state.currentDay,
  });
  const pick = selectDirectorEvent(spent, defs, `day${state.currentDay}`);
  if (!pick) return spent;

  // Record the selection before presentation: a reload shows the same pending event, never a new roll.
  const recorded = recordSelection(spent, { eventId: pick.def.id, family: pick.def.family, subjectId: pick.subject?.id });
  const d = getDirector(recorded);
  return withDirector(recorded, { ...d, pending: { eventId: pick.def.id, openedDay: state.currentDay, subject: pick.subject } });
};

export interface ValidatedEffect {
  kind: DomainEffect['kind'];
  amount: number;
}

/** Clamp every effect to the whitelist and caps. Unknown kinds are dropped. */
export const validateEffects = (effects: readonly DomainEffect[]): ValidatedEffect[] =>
  effects.flatMap((e): ValidatedEffect[] => {
    switch (e.kind) {
      case 'money':
      case 'reputation':
      case 'xp':
      case 'clientXp':
      case 'staffXp':
      case 'gearCondition': {
        const cap = EFFECT_LIMITS[e.kind];
        const amount = Math.max(-cap, Math.min(cap, Math.round(Number(e.amount) || 0)));
        return amount === 0 ? [] : [{ kind: e.kind, amount }];
      }
      case 'referral':
        return [{ kind: 'referral', amount: 1 }];
      default:
        return [];
    }
  });

/** Options whose money cost can't be paid are disabled, never hidden. */
export const canAffordEffects = (state: GameState, effects: readonly DomainEffect[]): boolean =>
  validateEffects(effects)
    .filter((e) => e.kind === 'money' && e.amount < 0)
    .every((e) => (state.money ?? 0) + e.amount >= 0);

export const applyDomainEffects = (state: GameState, effects: readonly DomainEffect[], subjectId?: string): GameState => {
  let next = state;
  for (const e of validateEffects(effects)) {
    switch (e.kind) {
      case 'money':
        next = { ...next, money: Math.max(0, next.money + e.amount) };
        break;
      case 'reputation':
        next = { ...next, reputation: Math.max(0, next.reputation + e.amount) };
        break;
      case 'xp':
        next = { ...next, playerData: { ...next.playerData, xp: Math.max(0, (next.playerData?.xp ?? 0) + e.amount) } };
        break;
      case 'staffXp':
        // Crew-wide nudge: every hired member gets role XP, never below zero.
        next = {
          ...next,
          hiredStaff: (next.hiredStaff ?? []).map((m) => ({ ...m, xpInRole: Math.max(0, (m.xpInRole ?? 0) + e.amount) })),
        };
        break;
      case 'gearCondition': {
        // A gear subject (maintenance events) targets that one piece; otherwise the effect is studio-wide.
        const targeted = subjectId !== undefined && (next.ownedEquipment ?? []).some((eq) => eq.id === subjectId);
        next = {
          ...next,
          ownedEquipment: (next.ownedEquipment ?? []).map((eq) => targeted && eq.id !== subjectId ? eq : ({
            ...eq,
            condition: Math.max(0, Math.min(100, (eq.condition ?? 100) + e.amount)),
          })),
        };
        break;
      }
      case 'clientXp':
      case 'referral': {
        const rel = subjectId ? next.clientRelationships?.[subjectId] : undefined;
        if (!rel || !next.clientRelationships || !subjectId) break;
        next = {
          ...next,
          clientRelationships: {
            ...next.clientRelationships,
            [subjectId]:
              e.kind === 'clientXp'
                ? { ...rel, relationshipXp: Math.max(0, rel.relationshipXp + e.amount) }
                : { ...rel, referralCount: rel.referralCount + 1 },
          },
        };
        break;
      }
    }
  }
  return next;
};

/**
 * Resolve the pending event with an option. No pending event (already resolved, or a stale click) is a no-op,
 * which is what makes save/reload and double-submits safe.
 */
export const resolveDirectorOption = (
  state: GameState,
  defs: readonly StudioEventDefinition[],
  optionId: string,
): GameState => {
  const pending = getDirector(state).pending;
  if (!pending) return state;
  const def = defs.find((d) => d.id === pending.eventId);
  if (!def) return withDirector(state, { ...getDirector(state), pending: undefined });
  const option = def.options.find((o) => o.id === optionId);
  if (!option || !canAffordEffects(state, option.effects)) return state;

  let next = applyDomainEffects(state, option.effects, pending.subject?.id);
  for (const m of option.memories ?? []) {
    next = addMemory(next, {
      ...m,
      scope: m.scope ?? (pending.subject ? pending.subject.scope : 'studio'),
      entityId: (m.scope ?? (pending.subject ? pending.subject.scope : 'studio')) === 'studio' ? undefined : pending.subject?.id,
      sourceEventId: def.id,
    });
  }
  const d = getDirector(next);
  const history = d.history.map((h, i, all) =>
    i === findLastIndex(all, (r) => r.eventId === def.id && !r.optionId) ? { ...h, optionId } : h,
  );
  return withDirector(
    next,
    { ...d, history, pending: undefined, lastEventDay: state.currentDay },
    {
      day: state.currentDay,
      kind: 'event',
      title: pending.subject ? `${def.title} — ${pending.subject.label}` : def.title,
      outcome: option.outcome,
    },
  );
};

const findLastIndex = <T>(arr: readonly T[], pred: (t: T) => boolean): number => {
  for (let i = arr.length - 1; i >= 0; i--) if (pred(arr[i])) return i;
  return -1;
};

/** Focus Mode: settle an ordinary event with its authored default instead of interrupting. */
export const delegateDirectorEvent = (state: GameState, defs: readonly StudioEventDefinition[]): GameState => {
  const pending = getDirector(state).pending;
  const def = pending && defs.find((d) => d.id === pending.eventId);
  if (!def || !def.delegable || !def.defaultOptionId) return state;
  return resolveDirectorOption(state, defs, def.defaultOptionId);
};

/** Compact event log for a client (or the whole studio when no id is given), newest last. */
export const getEventLog = (state: GameState, subjectId?: string): DirectorRecord[] =>
  getDirector(state).history.filter((h) => h.optionId && (!subjectId || h.subjectId === subjectId));
