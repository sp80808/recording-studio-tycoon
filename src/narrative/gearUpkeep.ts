/**
 * Gear upkeep chain (#62): narrative downstream of the maintenance facts, never the other way round.
 *
 * Beat 1 opens only when a maintainable piece is genuinely in trouble (poor condition or a live fault).
 * The choice writes a memory on that one piece; beats 2 and 3 read it. Effects target that piece only,
 * nothing is destroyed, and the free option is always the delegable default. Same contract as the other
 * director chains: capped typed effects, bounded, no trap choices.
 */
import type { DirectorSubject, StudioEventDefinition, StudioEventFacts } from './eventDirector';

export const TROUBLE_CONDITION = 40;

const troubled = (facts: StudioEventFacts): DirectorSubject | undefined => {
  const g = [...facts.gear]
    .filter((x) => x.maintainable && ((x.condition ?? 100) < TROUBLE_CONDITION || x.faulted))
    .sort((a, b) => (a.condition ?? 100) - (b.condition ?? 100) || a.id.localeCompare(b.id))[0];
  return g ? { scope: 'gear', id: g.id, label: g.name } : undefined;
};

export const GEAR_UPKEEP_EVENTS: readonly StudioEventDefinition[] = [
  {
    id: 'gear_trouble',
    family: 'gear-upkeep',
    baseWeight: 12,
    cooldownDays: 15,
    maxOccurrences: 1,
    pickSubject: troubled,
    eligible: () => true,
    narrativeKey: 'gear.trouble',
    kicker: 'THE RACK // SOMETHING IS OFF',
    title: 'A Piece of Gear Is Sulking',
    context: (s) => `${s?.label ?? 'A piece of gear'} has started crackling and cutting out. Nothing is broken for good, but it will keep getting in the way of sessions until someone deals with it.`,
    options: [
      { id: 'gear_trouble_a', label: 'Pay for a proper service now', flavorText: 'Parts and a careful afternoon.', effects: [{ kind: 'money', amount: -60 }, { kind: 'gearCondition', amount: 12 }], memories: [{ key: 'serviced-early', ttlDays: 120 }], outcome: 'The contacts are cleaned and the pots reseated. It sounds like new.' },
      { id: 'gear_trouble_b', label: 'Work around it for now', flavorText: 'Plenty of life left, if you are careful.', effects: [], memories: [{ key: 'run-rough', ttlDays: 60 }], outcome: 'You tape a note to the front and book around it.' },
    ],
    delegable: true,
    defaultOptionId: 'gear_trouble_b',
  },
  {
    id: 'gear_trouble_payoff',
    family: 'gear-upkeep',
    baseWeight: 12,
    cooldownDays: 10,
    maxOccurrences: 1,
    requiredMemories: ['serviced-early'],
    pickSubject: (facts) => {
      const g = facts.gear.find((x) => facts.has('gear', 'serviced-early', x.id));
      return g ? { scope: 'gear', id: g.id, label: g.name } : undefined;
    },
    eligible: () => true,
    narrativeKey: 'gear.payoff',
    kicker: 'THE RACK // WORTH THE AFTERNOON',
    title: 'It Has Never Sounded Better',
    context: (s) => `A visiting engineer plugs into ${s?.label ?? 'the serviced piece'} and asks what you did to it. The service paid off, and word gets around.`,
    options: [
      { id: 'gear_payoff_a', label: 'Share the trick', flavorText: 'Good gear talk is good business.', effects: [{ kind: 'reputation', amount: 2 }, { kind: 'xp', amount: 25 }], memories: [], outcome: 'They write the settings on their hand and tell two friends.' },
      { id: 'gear_payoff_b', label: 'Keep it to yourself', flavorText: 'A studio secret.', effects: [{ kind: 'xp', amount: 15 }], memories: [], outcome: 'You smile and say it is all in the cables.' },
    ],
    delegable: true,
    defaultOptionId: 'gear_payoff_b',
  },
  {
    id: 'gear_trouble_fallout',
    family: 'gear-upkeep',
    baseWeight: 12,
    cooldownDays: 10,
    maxOccurrences: 1,
    requiredMemories: ['run-rough'],
    pickSubject: (facts) => {
      const g = facts.gear.find((x) => facts.has('gear', 'run-rough', x.id) && x.maintainable && ((x.condition ?? 100) < TROUBLE_CONDITION + 10 || x.faulted));
      return g ? { scope: 'gear', id: g.id, label: g.name } : undefined;
    },
    eligible: () => true,
    narrativeKey: 'gear.fallout',
    kicker: 'THE RACK // A CLIENT NOTICED',
    title: 'The Crackle Made the Tape',
    context: (s) => `A client heard ${s?.label ?? 'the tired piece'} cutting out on a playback and asked politely about it. It is still fixable, and they are not angry, just curious.`,
    options: [
      { id: 'gear_fallout_a', label: 'Own up and service it now', flavorText: 'Be honest about it.', effects: [{ kind: 'money', amount: -60 }, { kind: 'gearCondition', amount: 12 }, { kind: 'reputation', amount: 1 }], memories: [{ key: 'serviced-early', ttlDays: 120 }], outcome: 'They appreciate the honesty. It is fixed by the weekend.' },
      { id: 'gear_fallout_b', label: 'Laugh it off', flavorText: 'Every room has its character.', effects: [], memories: [], outcome: 'They laugh too. You put a service on the list.' },
    ],
    delegable: true,
    defaultOptionId: 'gear_fallout_b',
  },
];
