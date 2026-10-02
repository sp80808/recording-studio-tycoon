/**
 * Second saga layer: one recurring client, Wren Calloway, who follows the studio across eras and
 * cities (busker, synth-pop hopeful, web-era indie, veteran). Four director beats, one per era,
 * chained by studio memories that outlive era changes. Same contract as the city sagas: capped
 * typed effects, maxOccurrences 1, delegable safe default (option b), no trap choices.
 */
import type { StudioEventDefinition } from './eventDirector';

type Effects = StudioEventDefinition['options'][number]['effects'];
type Row = [string, number][];
type Opt = [string, string, Row, string, string];

const fx = (rows: Row): Effects => rows.map(([kind, amount]) => ({ kind, amount }) as Effects[number]);
const TTL = 5000;
const ERA_ORDER = ['analog60s', 'digital80s', 'internet2000s', 'streaming2020s'];
const eraIdx = (era: string) => Math.max(0, ERA_ORDER.indexOf(era));

const BEATS: { era: string; title: string; context: string; a: Opt; b: Opt; minRep: number }[] = [
  { era: 'analog60s', minRep: 15, title: 'The Girl with the Borrowed Guitar',
    context: 'A teenager called Wren Calloway turns up with a borrowed guitar and two songs she wrote on the bus. She says she is moving on to another city next month and wants something to take with her.',
    a: ['Give her a free afternoon', 'Tape rolling, no invoice.', [['xp', 35], ['reputation', 2]], 'Two songs in four takes. She leaves with an acetate and writes your address on her hand.', 'wren.generous'],
    b: ['Book her at the cheap rate', 'Fair is fair.', [['money', 60], ['xp', 15]], 'She pays in coins and thanks you twice.', 'wren.fair'] },
  { era: 'digital80s', minRep: 0, title: 'Wren Calloway, Now With Synthesisers',
    context: 'Years on and a different city on the postmark, Wren walks in with a drum machine under one arm. She says she has been recording in rooms all over, and wants to make something that sounds nothing like where she started.',
    a: ['Let her take over the room for a week', 'She wants to experiment, so let her.', [['xp', 40], ['reputation', 3], ['gearCondition', -3]], 'Seven days, one record, a lot of fingerprints on the desk. It sounds like the future.', 'wren.experiment'],
    b: ['Keep it to a tight three-day session', 'Focused and billable.', [['money', 200], ['reputation', 2]], 'Three days, four songs, a neat invoice and a happy artist.', 'wren.focused'] },
  { era: 'internet2000s', minRep: 0, title: 'Wren Puts the Record Online',
    context: 'Wren has self-released and the downloads are climbing. A label has noticed and wants the masters. She calls from yet another time zone to ask what you think.',
    a: ['Tell her to stay independent', 'Keep the masters, keep the story.', [['reputation', 5], ['xp', 30]], 'She turns the label down and credits your room in the thread. It trends for a weekend.', 'wren.independent'],
    b: ['Help her negotiate a fair deal', 'Read the contract with her.', [['money', 250], ['reputation', 3]], 'You mark up the contract together. The final version is the first one she is proud to sign.', 'wren.signed'] },
  { era: 'streaming2020s', minRep: 0, title: 'Wren Calloway, Last Chorus',
    context: 'Wren is a veteran now, with a catalogue and a quiet tour bus. Her farewell album is the last thing on her list, and she wants to cut it in the room where the first acetate was made.',
    a: ['Close the studio for her and tell the story', 'Let the room be part of the record.', [['reputation', 10], ['xp', 50], ['money', 150]], 'The album opens with the sound of your door closing. The reviews quote it.', 'wren.farewell'],
    b: ['Record it quietly and keep the credit small', 'A small credit, a long friendship.', [['money', 400], ['reputation', 4]], 'It is the best session of her career. Your name is in the notes, in small print, and she sends a card.', 'wren.quiet'] },
];

export const RECURRING_CLIENT_EVENTS: readonly StudioEventDefinition[] = BEATS.map((beat, i): StudioEventDefinition => {
  const n = i + 1;
  const key = `wren.${n}`;
  const optionFor = (letter: string, o: Opt) => ({
    id: `wren_${n}_${letter}`,
    label: o[0],
    flavorText: o[1],
    effects: fx(o[2]),
    memories: [{ scope: 'studio' as const, key, ttlDays: TTL }, { scope: 'studio' as const, key: o[4], ttlDays: TTL }],
    outcome: o[3],
  });
  return {
    id: `wren_${n}`,
    family: 'recurring-client-wren',
    baseWeight: 14,
    cooldownDays: 30,
    maxOccurrences: 1,
    // Entry from any era: a beat opens in its own era or later, once the earlier beat is done or its era has passed.
    // A later beat's memory blocks the earlier ones, so the order only ever moves forward.
    eligible: (f) => eraIdx(f.era) >= eraIdx(beat.era) && f.reputation >= beat.minRep
      && (n === 1 || f.has('studio', `wren.${n - 1}`) || eraIdx(f.era) > eraIdx(BEATS[i - 1].era)),
    blockedMemories: BEATS.slice(i + 1).map((_, j) => `studio/wren.${n + 1 + j}`),
    narrativeKey: `client.wren.${n}`,
    kicker: `WREN CALLOWAY // THE CLIENT WHO FOLLOWED (${n}/4)`,
    title: beat.title,
    context: () => beat.context,
    options: [optionFor('a', beat.a), optionFor('b', beat.b)],
    delegable: true,
    defaultOptionId: `wren_${n}_b`,
  };
});
