/**
 * City-flavoured Studio Event Director rows (home city, career start).
 *
 * One local beat per city, each gated on `facts.cityId`, so they only ever appear in that city and
 * never on legacy saves. Same contract as the rest of the pool: typed, capped `DomainEffect`s only,
 * cooldowns, occurrence caps and a delegable safe default. Amounts are studio dollars.
 */
import type { StudioEventDefinition } from './eventDirector';

const opt = (o: StudioEventDefinition['options'][number]): StudioEventDefinition['options'][number] => o;

export const CITY_EVENTS: readonly StudioEventDefinition[] = [
  {
    id: 'la_label_dropin',
    family: 'city-local',
    baseWeight: 9,
    cooldownDays: 60,
    maxOccurrences: 3,
    eligible: (f) => f.cityId === 'los-angeles' && f.reputation >= 15,
    narrativeKey: 'city.la.label-dropin',
    kicker: 'LOS ANGELES // A&R IN THE LOBBY',
    title: 'An A&R Walks In Off Sunset',
    context: () => 'A label scout was in the building for another room and heard your monitors through the wall. They have twenty minutes and a business card.',
    options: [
      opt({ id: 'la_play_reel', label: 'Play them your best reel', flavorText: 'Twenty minutes, no second take.', effects: [{ kind: 'reputation', amount: 5 }, { kind: 'money', amount: 200 }], outcome: 'They leave a finder fee on the desk and a promise to call.' }),
      opt({ id: 'la_hold_slot', label: 'Keep the booking, offer a rain check', flavorText: 'Clients first.', effects: [{ kind: 'clientXp', amount: 12 }], outcome: 'Your client notices. The scout writes down the studio name anyway.' }),
    ],
    delegable: true,
    defaultOptionId: 'la_hold_slot',
  },
  {
    id: 'nashville_songwriter_round',
    family: 'city-local',
    baseWeight: 9,
    cooldownDays: 55,
    maxOccurrences: 3,
    eligible: (f) => f.cityId === 'nashville',
    narrativeKey: 'city.nashville.round',
    kicker: 'NASHVILLE // WRITERS IN THE ROUND',
    title: 'A Songwriters’ Round Needs a Room',
    context: () => 'Four writers want to demo a whole night of songs on a handshake and a tip jar. Whatever you charge, the songs will be good.',
    options: [
      opt({ id: 'nash_host', label: 'Host the round at cost', flavorText: 'Coffee, a few mics, no invoice.', effects: [{ kind: 'money', amount: -120 }, { kind: 'xp', amount: 40 }, { kind: 'reputation', amount: 4 }], outcome: 'By midnight there are three songs worth finishing and one you will hum for a week.' }),
      opt({ id: 'nash_book_paid', label: 'Book it as a paid half-day', flavorText: 'Fair rate, fair songs.', effects: [{ kind: 'money', amount: 260 }], outcome: 'They pay on the spot and promise to bring friends.' }),
    ],
    delegable: true,
    defaultOptionId: 'nash_book_paid',
  },
  {
    id: 'london_pirate_radio',
    family: 'city-local',
    baseWeight: 9,
    cooldownDays: 55,
    maxOccurrences: 3,
    eligible: (f) => f.cityId === 'london',
    narrativeKey: 'city.london.pirate-radio',
    kicker: 'LONDON // THE AERIAL ON THE ROOF',
    title: 'Pirate Radio Wants an Exclusive',
    context: () => 'A pirate station on the twelfth floor next door wants to play your latest session before anyone else has heard it. Quietly, of course.',
    options: [
      opt({ id: 'lon_give_it', label: 'Hand over the rough mix', flavorText: 'Buzz is currency.', effects: [{ kind: 'reputation', amount: 6 }, { kind: 'clientXp', amount: -6 }], outcome: 'The phones light up. Your client is flattered and a little annoyed.' }),
      opt({ id: 'lon_ask_client', label: 'Ask the client first', flavorText: 'Permission, then volume.', effects: [{ kind: 'clientXp', amount: 10 }, { kind: 'reputation', amount: 2 }], outcome: 'They say yes with a grin. A smaller splash, a bigger thank-you.' }),
    ],
    delegable: true,
    defaultOptionId: 'lon_ask_client',
  },
  {
    id: 'berlin_curfew_night',
    family: 'city-local',
    baseWeight: 9,
    cooldownDays: 55,
    maxOccurrences: 3,
    eligible: (f) => f.cityId === 'berlin',
    narrativeKey: 'city.berlin.curfew',
    kicker: 'BERLIN // THE NIGHT THAT DID NOT END',
    title: 'The Club Next Door Never Closed',
    context: () => 'The bass from the club next door has been leaking through your live room since midnight. A promoter pokes his head in: want to record the afterparty?',
    options: [
      opt({ id: 'ber_record_it', label: 'Roll tape on the afterparty', flavorText: 'Raw, loud, unrepeatable.', effects: [{ kind: 'money', amount: 220 }, { kind: 'gearCondition', amount: -4 }, { kind: 'xp', amount: 30 }], outcome: 'You get a hundred minutes of something nobody will ever be able to recreate.' }),
      opt({ id: 'ber_soundproof', label: 'Insist on a quiet night', flavorText: 'Pay the promoter in good faith.', effects: [{ kind: 'money', amount: -80 }, { kind: 'clientXp', amount: 8 }], outcome: 'The promoter respects it. The bass drops two floors down.' }),
    ],
    delegable: true,
    defaultOptionId: 'ber_soundproof',
  },
  {
    id: 'tokyo_city_pop_revival',
    family: 'city-local',
    baseWeight: 9,
    cooldownDays: 55,
    maxOccurrences: 3,
    eligible: (f) => f.cityId === 'tokyo',
    narrativeKey: 'city.tokyo.city-pop',
    kicker: 'TOKYO // THE VINYL BAR DOWNSTAIRS',
    title: 'A Reissue Label Wants Your Room',
    context: () => 'The owner of the vinyl bar downstairs is reissuing a forgotten record and wants it remastered through your gear. The tapes are in a shoebox.',
    options: [
      opt({ id: 'tok_remaster', label: 'Take the remaster job', flavorText: 'Patience, steady hands, no clipping.', effects: [{ kind: 'money', amount: 240 }, { kind: 'xp', amount: 35 }], outcome: 'The tapes sing. The owner bows lower than you expected.' }),
      opt({ id: 'tok_trade', label: 'Trade it for a rare fader set', flavorText: 'Gear for goodwill.', effects: [{ kind: 'gearCondition', amount: 8 }, { kind: 'reputation', amount: 3 }], outcome: 'Your console feels newer than it has in a decade.' }),
    ],
    delegable: true,
    defaultOptionId: 'tok_remaster',
  },
  {
    id: 'rio_carnival_rehearsal',
    family: 'city-local',
    baseWeight: 9,
    cooldownDays: 55,
    maxOccurrences: 3,
    eligible: (f) => f.cityId === 'rio',
    narrativeKey: 'city.rio.carnival',
    kicker: 'RIO // A HUNDRED DRUMS AT THE DOOR',
    title: 'A Samba School Brings the Whole Bateria',
    context: () => 'A samba school wants to record its carnival rehearsal in your room. It does not fit. They intend to make it fit.',
    options: [
      opt({ id: 'rio_full_band', label: 'Open every door and record it all', flavorText: 'Mic the street, mic the stairs.', effects: [{ kind: 'reputation', amount: 6 }, { kind: 'money', amount: 120 }, { kind: 'gearCondition', amount: -3 }], outcome: 'It is the loudest and best thing you have ever put to tape.' }),
      opt({ id: 'rio_small_group', label: 'Take the percussion section only', flavorText: 'Quality over crowd.', effects: [{ kind: 'money', amount: 180 }, { kind: 'xp', amount: 25 }], outcome: 'Clean, tight, danceable, and the drums still shake the glass.' }),
    ],
    delegable: true,
    defaultOptionId: 'rio_small_group',
  },
];
