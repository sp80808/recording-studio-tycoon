/**
 * Authored Studio Event Director content and the bound public API.
 *
 * Events describe text, typed `DomainEffect`s and memories only — they never touch game state themselves.
 * The flagship content is a three-beat recurring-client chain, carried entirely by memories:
 *
 *   1. client_rush_request   — a repeat client wants a faster turnaround (accept / decline / reduce scope)
 *   2. client_rush_payoff    — remembered rush success builds trust
 *      client_rush_fallout   — remembered rushed, poor result makes them cautious
 *      client_rush_respected — a declined rush stays neutral when the relationship is healthy
 *   3. client_referral_ask   — only after several sessions, a healthy tier and a remembered success
 *
 * No branch is a trap: bad memories fade (`ttlDays`) and every path keeps the relationship recoverable.
 */
import type { GameState } from '@/types/game';
import {
  delegateDirectorEvent,
  getDirector,
  resolveDirectorOption,
  takeDirectorOpportunity,
  canAffordEffects,
  type DirectorOption,
  type DirectorSubject,
  type StudioEventDefinition,
  type StudioEventFacts,
} from './eventDirector';
import { NARRATIVE_EVENTS } from './narrativeEventPool';
import { CITY_EVENTS, MORE_CITY_EVENTS } from './cityEvents';
import { CITY_SAGA_EVENTS } from './citySagas';
import { RECURRING_CLIENT_EVENTS } from './recurringClient';
import { GEAR_UPKEEP_EVENTS } from './gearUpkeep';

const HEALTHY = ['Friendly', 'Regular', 'Loyal', 'Advocate'];
const ESTABLISHED = ['Regular', 'Loyal', 'Advocate'];

/** Most-experienced client (ties by id) that satisfies the predicate. */
const clientWhere =
  (pred: (c: StudioEventFacts['clients'][number]) => boolean) =>
  (facts: StudioEventFacts): DirectorSubject | undefined => {
    const c = [...facts.clients].filter(pred).sort((a, b) => b.sessionsCompleted - a.sessionsCompleted || a.clientId.localeCompare(b.clientId))[0];
    return c ? { scope: 'client', id: c.clientId, label: c.clientName } : undefined;
  };

const clientOf = (facts: StudioEventFacts, s?: DirectorSubject) => facts.clients.find((c) => c.clientId === s?.id);

const opt = (o: DirectorOption): DirectorOption => o;

export const DIRECTOR_EVENTS: readonly StudioEventDefinition[] = [
  ...NARRATIVE_EVENTS,
  ...CITY_EVENTS,
  ...MORE_CITY_EVENTS,
  ...CITY_SAGA_EVENTS,
  ...RECURRING_CLIENT_EVENTS,
  ...GEAR_UPKEEP_EVENTS,
  // ───────── Recurring-client chain ─────────
  {
    id: 'client_rush_request',
    family: 'client-rush',
    baseWeight: 10,
    cooldownDays: 20,
    maxOccurrences: 1,
    pickSubject: clientWhere((c) => c.sessionsCompleted >= 2 && c.tier !== 'Unknown'),
    eligible: () => true,
    narrativeKey: 'client.rush.request',
    kicker: 'CLIENT // A FAVOUR ASKED',
    title: 'Can You Turn It Around Faster?',
    context: (s) => `${s?.label ?? 'A regular client'} is back with a deadline that has moved up. They are asking whether you can deliver in half the usual time.`,
    options: [
      opt({ id: 'rush_accept', label: 'Accept the rush job', flavorText: 'Long nights, rush fee on the invoice.', effects: [{ kind: 'money', amount: 600 }, { kind: 'clientXp', amount: 5 }], memories: [{ key: 'rush-accepted', ttlDays: 90 }], outcome: 'You shake on it. The diary gets tight.' }),
      opt({ id: 'rush_reduce', label: 'Offer a smaller scope', flavorText: 'Fewer tracks, done properly.', effects: [{ kind: 'money', amount: 250 }, { kind: 'clientXp', amount: 8 }], memories: [{ key: 'rush-accepted', ttlDays: 90 }], outcome: 'They grumble, then agree that less, done well, beats more, done badly.' }),
      opt({ id: 'rush_decline', label: 'Decline politely', flavorText: 'Quality needs its time.', effects: [], memories: [{ key: 'rush-declined', ttlDays: 90 }], outcome: 'They understand. Mostly.' }),
    ],
    delegable: true,
    defaultOptionId: 'rush_decline',
  },
  {
    id: 'client_rush_payoff',
    family: 'client-rush',
    baseWeight: 10,
    cooldownDays: 10,
    maxOccurrences: 1,
    requiredMemories: ['rush-accepted'],
    blockedMemories: ['rush-success', 'rush-poor'],
    pickSubject: clientWhere((c) => c.sessionsCompleted >= 3 && c.bestQualityScore >= 75),
    eligible: () => true,
    narrativeKey: 'client.rush.payoff',
    kicker: 'CLIENT // IT PAID OFF',
    title: 'The Rush Job Landed',
    context: (s) => `${s?.label ?? 'Your client'} just heard how the rushed release went. They are delighted, and they want you to know it.`,
    options: [
      opt({ id: 'payoff_thanks', label: 'Accept the thank-you', flavorText: 'A handshake and a bottle.', effects: [{ kind: 'clientXp', amount: 25 }, { kind: 'reputation', amount: 4 }], memories: [{ key: 'rush-success' }], outcome: 'They tell people the studio delivers when it counts.' }),
      opt({ id: 'payoff_discount', label: 'Offer a discount on their next booking', flavorText: 'Loyalty, repaid.', effects: [{ kind: 'money', amount: -150 }, { kind: 'clientXp', amount: 40 }], memories: [{ key: 'rush-success' }], outcome: 'They book the next session before leaving the room.' }),
    ],
    delegable: true,
    defaultOptionId: 'payoff_thanks',
  },
  {
    id: 'client_rush_fallout',
    family: 'client-rush',
    baseWeight: 10,
    cooldownDays: 10,
    maxOccurrences: 1,
    requiredMemories: ['rush-accepted'],
    blockedMemories: ['rush-success', 'rush-poor'],
    pickSubject: clientWhere((c) => c.sessionsCompleted >= 3 && c.bestQualityScore < 75),
    eligible: () => true,
    narrativeKey: 'client.rush.fallout',
    kicker: 'CLIENT // CORNERS WERE CUT',
    title: 'The Rush Job Stumbled',
    context: (s) => `The rushed release for ${s?.label ?? 'your client'} shows its seams. They are not angry, but they are being careful with you now.`,
    options: [
      opt({ id: 'fallout_rework', label: 'Rework it on the house', flavorText: 'Own the mistake.', effects: [{ kind: 'money', amount: -300 }, { kind: 'clientXp', amount: 10 }], memories: [{ key: 'rush-poor', ttlDays: 40 }], outcome: 'The reworked version is better. The trust comes back slowly.' }),
      opt({ id: 'fallout_explain', label: 'Explain the constraints and move on', flavorText: 'You did warn them.', effects: [{ kind: 'clientXp', amount: -10 }], memories: [{ key: 'rush-poor', ttlDays: 40 }], outcome: 'Fair, and cold. They book elsewhere for a while.' }),
    ],
    delegable: true,
    defaultOptionId: 'fallout_rework',
  },
  {
    id: 'client_rush_respected',
    family: 'client-rush',
    baseWeight: 6,
    cooldownDays: 10,
    maxOccurrences: 1,
    requiredMemories: ['rush-declined'],
    blockedMemories: ['rush-respected'],
    pickSubject: clientWhere((c) => HEALTHY.includes(c.tier) && c.sessionsCompleted >= 3),
    eligible: () => true,
    narrativeKey: 'client.rush.respected',
    kicker: 'CLIENT // NO HARD FEELINGS',
    title: 'They Understood',
    context: (s) => `${s?.label ?? 'Your client'} did not hold the declined rush against you. They would like to make sure it stays that way.`,
    options: [
      opt({ id: 'respected_note', label: 'Send a thank-you note', flavorText: 'Small and sincere.', effects: [{ kind: 'clientXp', amount: 10 }], memories: [{ key: 'rush-respected' }], outcome: 'The note goes up on their studio wall.' }),
      opt({ id: 'respected_slot', label: 'Offer a standing priority slot', flavorText: 'So the next rush is easier.', effects: [{ kind: 'money', amount: -100 }, { kind: 'clientXp', amount: 20 }], memories: [{ key: 'rush-respected' }], outcome: 'You have a regular, and they know it.' }),
    ],
    delegable: true,
    defaultOptionId: 'respected_note',
  },
  {
    id: 'client_referral_ask',
    family: 'client-referral',
    baseWeight: 12,
    cooldownDays: 30,
    maxOccurrences: 1,
    requiredMemories: ['rush-success'],
    blockedMemories: ['referral-made'],
    pickSubject: clientWhere((c) => ESTABLISHED.includes(c.tier) && c.sessionsCompleted >= 4),
    eligible: (facts, s) => (clientOf(facts, s)?.sessionsCompleted ?? 0) >= 4,
    narrativeKey: 'client.referral.ask',
    kicker: 'CLIENT // A NAME PASSED ON',
    title: 'A Friend of a Friend',
    context: (s) => `${s?.label ?? 'Your client'} has been singing your praises. They can introduce you to someone bigger, or put their name behind the studio in public.`,
    options: [
      opt({ id: 'referral_take', label: 'Take the introduction', flavorText: 'New faces, new money.', effects: [{ kind: 'referral' }, { kind: 'reputation', amount: 5 }], memories: [{ key: 'referral-made' }], outcome: 'A new name appears in the booking diary.' }),
      opt({ id: 'referral_credit', label: 'Ask for a public credit', flavorText: 'Put the studio’s name on the sleeve.', effects: [{ kind: 'reputation', amount: 10 }, { kind: 'xp', amount: 50 }], memories: [{ key: 'referral-made' }, { scope: 'studio', key: 'prestige-credit' }], outcome: 'The credit line is small, and it opens doors.' }),
    ],
  },

  // ───────── Studio, crew and gear ─────────
  {
    id: 'studio_label_scout',
    family: 'studio-industry',
    baseWeight: 8,
    cooldownDays: 60,
    maxOccurrences: 1,
    eligible: (f) => f.reputation >= 40,
    narrativeKey: 'studio.scout.visit',
    kicker: 'INDUSTRY // A QUIET VISIT',
    title: 'A Label Scout Stops By',
    context: () => 'A scout from a larger label is in the building “just for the coffee”. They are listening to everything.',
    options: [
      opt({ id: 'scout_tour', label: 'Give them the full tour', flavorText: 'Let the room make its case.', effects: [{ kind: 'reputation', amount: 8 }], memories: [{ scope: 'studio', key: 'scout-toured' }], outcome: 'The scout leaves with a notebook full of names, and yours is on the first page.' }),
      opt({ id: 'scout_private', label: 'Keep the sessions private', flavorText: 'Your clients come first.', effects: [{ kind: 'money', amount: 300 }], memories: [{ scope: 'studio', key: 'scout-declined' }], outcome: 'Word gets round that the studio protects its artists.' }),
    ],
    delegable: true,
    defaultOptionId: 'scout_private',
  },
  {
    id: 'studio_press_inquiry',
    family: 'studio-industry',
    baseWeight: 6,
    cooldownDays: 45,
    maxOccurrences: 2,
    memoryWeights: { 'studio/prestige-credit': 2 },
    eligible: (f) => f.reputation >= 25,
    narrativeKey: 'studio.press.inquiry',
    kicker: 'INDUSTRY // A PHONE CALL',
    title: 'The Press Wants a Word',
    context: () => 'A trade journalist wants ten minutes about how the studio works. It could be flattering. It could be long.',
    options: [
      opt({ id: 'press_talk', label: 'Give a proper interview', flavorText: 'Open the doors, put the kettle on.', effects: [{ kind: 'reputation', amount: 6 }, { kind: 'money', amount: -100 }], outcome: 'The piece runs with a good photograph of the console.' }),
      opt({ id: 'press_statement', label: 'Send a short statement', flavorText: 'Ten words, on the record.', effects: [{ kind: 'reputation', amount: 2 }], outcome: 'A brief mention, and a brief silence.' }),
    ],
    delegable: true,
    defaultOptionId: 'press_statement',
  },
  {
    id: 'staff_artist_conflict',
    family: 'crew',
    baseWeight: 7,
    cooldownDays: 30,
    maxOccurrences: 1,
    pickSubject: (f) => {
      const m = f.staff[0];
      return m ? { scope: 'staff', id: m.id, label: m.name } : undefined;
    },
    eligible: (f) => f.staffCount >= 1 && f.day >= 15,
    narrativeKey: 'staff.artist.conflict',
    kicker: 'CREW // TWO STRONG OPINIONS',
    title: 'An Argument in the Live Room',
    context: (s) => `${s?.label ?? 'One of your crew'} and a visiting artist disagree loudly about a take. Both think they are right.`,
    options: [
      opt({ id: 'conflict_back_crew', label: 'Back your crew member', flavorText: 'You hired them for a reason.', effects: [{ kind: 'reputation', amount: 2 }], memories: [{ key: 'backed-by-boss' }], outcome: 'The crew member stands a little taller. The artist sulks through lunch.' }),
      opt({ id: 'conflict_mediate', label: 'Step in and mediate', flavorText: 'A cup of tea, a fresh take.', effects: [{ kind: 'money', amount: -80 }, { kind: 'reputation', amount: 3 }], memories: [{ key: 'mediated-conflict' }], outcome: 'Both walk out with a better take than either planned.' }),
    ],
  },
  {
    id: 'gear_overheated',
    family: 'gear',
    baseWeight: 7,
    cooldownDays: 30,
    maxOccurrences: 1,
    pickSubject: (f) => {
      const g = f.gear[0];
      return g ? { scope: 'gear', id: g.id, label: g.name } : undefined;
    },
    eligible: (f) => f.equipmentCount >= 2 && f.day >= 20,
    narrativeKey: 'gear.overheated',
    kicker: 'GEAR // A BURNING SMELL',
    title: 'It Ran Hot',
    context: (s) => `The ${s?.label ?? 'desk'} has been running all week and something smells warm. It survived, but only just.`,
    options: [
      opt({ id: 'gear_service', label: 'Pay for a proper service', flavorText: 'Do it right.', effects: [{ kind: 'money', amount: -350 }, { kind: 'reputation', amount: 2 }], memories: [{ key: 'serviced-after-heat' }], outcome: 'The technician finds and fixes two other problems.' }),
      opt({ id: 'gear_fan', label: 'Put a fan on it and carry on', flavorText: 'It has got this far.', effects: [{ kind: 'money', amount: 60 }], memories: [{ key: 'ran-hot-ignored', ttlDays: 60 }], outcome: 'It works. For now.' }),
    ],
  },
];

// ───────────────────────────── Bound API ─────────────────────────────

export const getDirectorEventDefinition = (id: string): StudioEventDefinition | undefined =>
  DIRECTOR_EVENTS.find((d) => d.id === id);

export interface PendingDirectorView {
  def: StudioEventDefinition;
  subject?: DirectorSubject;
  context: string;
  options: Array<DirectorOption & { affordable: boolean }>;
}

export const getPendingDirectorEvent = (state: GameState): PendingDirectorView | null => {
  const pending = getDirector(state).pending;
  if (!pending) return null;
  const def = getDirectorEventDefinition(pending.eventId);
  if (!def) return null;
  return {
    def,
    subject: pending.subject,
    context: def.context(pending.subject),
    options: def.options.map((o) => ({ ...o, affordable: canAffordEffects(state, o.effects) })),
  };
};

/**
 * One director opportunity. Called by `advanceStory` after the subplot layer has had its turn; `busy` is true
 * when a subplot or campaign branch is waiting on the player, so only one decision is ever open.
 */
export const tickDirector = (state: GameState): GameState => {
  const story = state.storylineState;
  if (!story) return state;
  const busy = story.activeSubplots.length > 0 || typeof story.storyFlags['pending_branch_choice'] === 'string';
  return takeDirectorOpportunity(state, DIRECTOR_EVENTS, { busy, lastOtherBeatDay: story.lastSubplotEndDay });
};

export const resolveDirectorChoice = (state: GameState, optionId: string): GameState =>
  resolveDirectorOption(state, DIRECTOR_EVENTS, optionId);

export const delegateDirector = (state: GameState): GameState => delegateDirectorEvent(state, DIRECTOR_EVENTS);
