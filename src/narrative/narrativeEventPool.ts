/**
 * Narrative event pool — 12 authored beats across bands, lore and the studio itself.
 *
 * Authored as `StudioEventDefinition`s so they run through the Studio Event Director: real cooldowns,
 * occurrence caps, same-family anti-repeat, deterministic seeding and idempotent resolution. Nothing here
 * touches game state directly — every change is a validated `DomainEffect`.
 *
 * Triggers read real `GameState` fields only (`bands`, `playerBands`, `hiredStaff`, `ownedEquipment`,
 * `clientRelationships`, `reputation`, `financials.reports`, `currentEra`, `storylineState.storyFlags`).
 * No new condition kinds, no new GameState fields.
 *
 * Event table (id | family | condition | effects | cooldown | choice)
 * ─────────────────────────────────────────────────────────────────────────────────────────────────────
 * Band
 *  1. garage_band_walkout        band-life   player band on the books          rep− / money− / staffXp  45d  3 options
 *  2. viral_cover                band-life   player band with a release        rep+ / money+             60d  2 options
 *  3. tour_bus_breakdown         band-life   any band on tour                  money−                    70d  2 options
 *  4. reunion_rumor              band-life   `band-broken-up` story flag       money− / rep+             90d  2 options (gated, see below)
 * Lore
 *  5. rival_diss_track           lore-weave  digital80s+                        rep ±                     45d  2 options · weave
 *  6. console_law_anecdote       lore-weave  any era, first session done    xp+ / money+             60d  2 options
 *  7. venue_anniversary          lore-weave  any era                            money+ / rep+             75d  2 options · weave
 *  8. award_nomination           lore-weave  rep ≥ 45 and 8+ finished jobs     rep+ / referral          365d 2 options
 * Studio
 *  9. tube_stash_find            studio-trouble  owns any gear                 gearCondition+ / money+  40d  2 options · weave
 * 10. power_surge                studio-trouble  any era                         gearCondition− / money−  50d  2 options
 * 11. intern_prodigy             studio-trouble  crew on the books               staffXp+                  60d  2 options
 * 12. sync_brief_lands           studio-trouble  rep ≥ 30                         money+ / rep+             30d  2 options · weave
 *
 * Historical weave — four rows name-check `HISTORICAL_EVENTS` and only fire in the matching era, so scripted
 * history and rolled events read as one world:
 *   5. rival_diss_track    → `mtv_launch` (digital80s)
 *   7. venue_anniversary   → `beatles_debut` (analog60s) / `spotify_dominance` (streaming2020s)
 *   9. tube_stash_find     → `multitrack_recording` (analog60s) / `ai_music_tools` (streaming2020s)
 *  12. sync_brief_lands    → `itunes_store_launch` (internet2000s) / `social_media_music` (internet2000s)
 *
 * Choice gating — the director already renders an option list (Index.tsx), so all 12 rows resolve through a
 * real decision. Two rows stay *narrative-first* because their outcome depends on band-lifecycle state this
 * layer cannot write yet (bead c5b):
 *   4. reunion_rumor   needs `band-broken-up`, written by the breakup slice — inert until then.
 *   8. award_nomination  `referral` needs a client subject; falls back to reputation when none qualifies.
 */
import type { StudioBandFacts, StudioEventDefinition, StudioEventFacts } from './eventDirector';

const ERAS = ['analog60s', 'digital80s', 'internet2000s', 'streaming2020s'] as const;

/** Era gate: the event only fires on these eras (defaults to every era). */
const inEras = (...eras: string[]) => (facts: StudioEventFacts) =>
  eras.length === 0 || eras.includes(facts.era);

/** Era gate with a threshold inside the allowed eras, e.g. "1980s onward". */
const fromEra = (startIndex: number) => (facts: StudioEventFacts) =>
  ERAS.indexOf(facts.era as (typeof ERAS)[number]) >= startIndex;

const hasBands = (facts: StudioEventFacts) => facts.bands.length > 0;
const playerBand = (facts: StudioEventFacts) => facts.bands.find((b) => b.isPlayerCreated);
const touringBand = (facts: StudioEventFacts) => facts.bands.find((b) => b.onTour);

/** Subject picker for a band: prefers the player's own band, then the most famous one. */
const bandSubject =
  (pick: (facts: StudioEventFacts) => StudioBandFacts | undefined) =>
  (facts: StudioEventFacts) => {
    const band = pick(facts);
    return band ? { scope: 'band' as const, id: band.id, label: band.name } : undefined;
  };

const opt = (o: StudioEventDefinition['options'][number]): StudioEventDefinition['options'][number] => o;

const hasFinishedJobs = (facts: StudioEventFacts) => facts.clients.some((c) => c.sessionsCompleted >= 1);

export const NARRATIVE_EVENTS: readonly StudioEventDefinition[] = [
  // ───────── Band ─────────
  {
    id: 'garage_band_walkout',
    family: 'band-life',
    baseWeight: 8,
    cooldownDays: 45,
    maxOccurrences: 2,
    pickSubject: bandSubject(playerBand),
    eligible: (facts) => hasBands(facts) && facts.staffCount > 0,
    narrativeKey: 'band.walkout',
    kicker: 'BAND // THE ROOM WENT QUIET',
    title: 'A Walkout',
    context: (s) => `${s?.label ?? 'One of your bands'} has had enough. Nobody said when, and nobody is answering the phone.`,
    options: [
      opt({ id: 'walkout_mediate', label: 'Pay for mediation', flavorText: 'A neutral room, everyone present.', effects: [{ kind: 'money', amount: -400 }, { kind: 'reputation', amount: 1 }], memories: [{ key: 'band-tension-eased', ttlDays: 120 }], outcome: 'They sit down, say the quiet part, and stay a band — for now.' }),
      opt({ id: 'walkout_overtime', label: 'Offer more studio hours', flavorText: 'Nothing but time.', effects: [{ kind: 'staffXp', amount: 25 }, { kind: 'money', amount: -120 }], memories: [{ key: 'band-overworked', ttlDays: 60 }], outcome: 'They take the deal. They are quieter in the room than before.' }),
      opt({ id: 'walkout_let_go', label: 'Let them walk', flavorText: 'Some bands end.', effects: [{ kind: 'reputation', amount: -4 }], memories: [{ key: 'band-member-quit' }], outcome: 'The last take belongs to whoever stayed.' }),
    ],
    delegable: true,
    defaultOptionId: 'walkout_mediate',
  },
  {
    id: 'viral_cover',
    family: 'band-life',
    baseWeight: 10,
    cooldownDays: 60,
    maxOccurrences: 3,
    pickSubject: bandSubject((facts) => facts.bands.find((b) => b.isPlayerCreated && b.releases > 0)),
    eligible: (facts) => facts.bands.some((b) => b.isPlayerCreated && b.releases > 0),
    narrativeKey: 'band.viral-cover',
    kicker: 'BAND // SOMEONE COVERED YOU',
    title: 'An Unsanctioned Cover',
    context: (s) => `Someone recorded ${s?.label ?? 'one of your bands'} in a bedroom studio and it is spreading faster than anything you made.`,
    options: [
      opt({ id: 'cover_take_credit', label: 'Claim the credit publicly', flavorText: 'Free reach.', effects: [{ kind: 'reputation', amount: 6 }, { kind: 'money', amount: 300 }], memories: [{ key: 'band-cover-credit' }], outcome: 'Your name rides it. So does the resentment.' }),
      opt({ id: 'cover_charge_fee', label: 'Invoice the label', flavorText: 'Paperwork as a weapon.', effects: [{ kind: 'money', amount: 1100 }, { kind: 'reputation', amount: -2 }], memories: [{ key: 'band-cover-fee' }], outcome: 'The money arrives. So does the story about you.' }),
    ],
  },
  {
    id: 'tour_bus_breakdown',
    family: 'band-life',
    baseWeight: 7,
    cooldownDays: 70,
    maxOccurrences: 3,
    pickSubject: bandSubject(touringBand),
    eligible: (facts) => facts.bands.some((b) => b.onTour),
    narrativeKey: 'band.bus-breakdown',
    kicker: 'BAND // STRANDED',
    title: 'The Bus Is Not Moving',
    context: (s) => `${s?.label ?? 'Your band'} is somewhere between towns with a broken bus and a promoter who does not appreciate excuses.`,
    options: [
      opt({ id: 'bus_emergency_repair', label: 'Pay the roadside bill', flavorText: 'Get them to the next date.', effects: [{ kind: 'money', amount: -700 }, { kind: 'reputation', amount: 2 }], memories: [{ key: 'tour-rescued' }], outcome: 'They play the date. They tell the promoter who paid.' }),
      opt({ id: 'bus_cancel_dates', label: 'Cancel the remaining dates', flavorText: 'Cut the losses.', effects: [{ kind: 'reputation', amount: -4 }], memories: [{ key: 'tour-cancelled' }], outcome: 'Three promoters remember. One of them is the one you need.' }),
    ],
  },
  {
    id: 'reunion_rumor',
    family: 'band-life',
    baseWeight: 5,
    cooldownDays: 90,
    maxOccurrences: 2,
    // Gated on bead c5b: the breakup slice has to write `band-broken-up` first.
    eligible: (facts) => hasFinishedJobs(facts) && facts.flag('band-broken-up'),
    narrativeKey: 'band.reunion-rumor',
    kicker: 'BAND // OLD NAMES IN A NEW STORY',
    title: 'They Are Saying The Name Again',
    context: (s) => `Someone saw ${s?.label ?? 'the old band'} at a show that was not billed as a reunion. The rumour has your studio on it.`,
    options: [
      opt({ id: 'rumor_pursue', label: 'Book the room and make it real', flavorText: 'Law of the Reunion: every breakup is a future payday.', effects: [{ kind: 'money', amount: -600 }, { kind: 'reputation', amount: 5 }], memories: [{ key: 'reunion-pursued' }], outcome: 'You pay for a room they may never fill. They fill it.' }),
      opt({ id: 'rumor_ignore', label: 'Let the rumour die', flavorText: 'Some things stay finished.', effects: [{ kind: 'reputation', amount: 1 }], memories: [{ key: 'reunion-declined' }], outcome: 'By next month nobody is asking.' }),
    ],
  },

  // ───────── Lore ─────────
  {
    id: 'rival_diss_track',
    family: 'lore-weave',
    baseWeight: 8,
    cooldownDays: 45,
    maxOccurrences: 3,
    eligible: fromEra(1),
    narrativeKey: 'lore.rival-diss',
    kicker: 'RIVAL // ON RECORD',
    title: 'Somebody Answered',
    context: () => 'A rival studio has put out a record with your name in the credits of the complaint. The trade press noticed before you did.',
    options: [
      opt({ id: 'diss_ignore', label: 'Say nothing at all', flavorText: 'Let them age.', effects: [{ kind: 'reputation', amount: -2 }], memories: [{ key: 'rival-diss-ignored' }], outcome: 'It is still being played on the radio in March.' }),
      opt({ id: 'diss_answer', label: 'Answer on tape', flavorText: 'Twelve inches of spine.', effects: [{ kind: 'reputation', amount: 6 }, { kind: 'money', amount: -250 }], memories: [{ key: 'rival-diss-answered' }], outcome: 'The trade press now has two records and one story.' }),
    ],
  },
  {
    id: 'console_law_anecdote',
    family: 'lore-weave',
    baseWeight: 9,
    cooldownDays: 60,
    maxOccurrences: 4,
    // Any era, but the room needs a history before it can have "the sentence everyone here lives by".
    eligible: (facts) => hasFinishedJobs(facts),
    narrativeKey: 'lore.console-law',
    kicker: 'CODEX // A LAW, RECALLED',
    title: 'Somebody Wrote Your Law Down',
    context: () => 'An old engineer drops by with the sentence everyone in this room has been living by, and an invoice-free favour to go with it.',
    options: [
      opt({ id: 'law_coffee', label: 'Buy the coffee and listen', flavorText: 'Nothing beats a story for free.', effects: [{ kind: 'xp', amount: 120 }, { kind: 'reputation', amount: 1 }], memories: [{ key: 'law-recalled' }], outcome: 'You leave with a better way to explain the room.' }),
      opt({ id: 'law_spares', label: 'Trade him the spare parts', flavorText: 'Barter, not charity.', effects: [{ kind: 'gearCondition', amount: 6 }, { kind: 'money', amount: -60 }], memories: [{ key: 'law-traded-spares' }], outcome: 'He leaves with a drawer of valves. The rack runs cleaner.' }),
    ],
  },
  {
    id: 'venue_anniversary',
    family: 'lore-weave',
    baseWeight: 7,
    cooldownDays: 75,
    maxOccurrences: 3,
    // Historical weave: the Marquee Cellar era, or the stream festival era.
    eligible: (facts) => (facts.era === 'analog60s' || facts.era === 'streaming2020s') && hasFinishedJobs(facts),
    narrativeKey: 'lore.venue-anniversary',
    kicker: 'HISTORY // THE ROOM REMEMBERS',
    title: 'An Anniversary Booking',
    context: () => 'The venue your era is built on is celebrating, and the only studio they called is yours.',
    options: [
      opt({ id: 'venue_take_slot', label: 'Take the anniversary slot', flavorText: 'The room will be full.', effects: [{ kind: 'money', amount: 1500 }, { kind: 'reputation', amount: 4 }], memories: [{ key: 'venue-anniversary-played' }], outcome: 'Everyone who ever queued on that street is in one room.' }),
      opt({ id: 'venue_send_rookie', label: 'Send the newest engineer', flavorText: 'Make it someone else’s night.', effects: [{ kind: 'staffXp', amount: 45 }, { kind: 'money', amount: 500 }], memories: [{ key: 'venue-rookie-sent' }], outcome: 'They come back talking about it for a year.' }),
    ],
  },
  {
    id: 'award_nomination',
    family: 'lore-weave',
    baseWeight: 4,
    cooldownDays: 365,
    maxOccurrences: 2,
    pickSubject: (facts) => {
      const best = [...facts.clients].filter((c) => c.sessionsCompleted >= 3).sort((a, b) => b.relationshipXp - a.relationshipXp || a.clientId.localeCompare(b.clientId))[0];
      return best ? { scope: 'client' as const, id: best.clientId, label: best.clientName } : undefined;
    },
    eligible: (facts) => facts.reputation >= 45 && facts.clients.some((c) => c.sessionsCompleted >= 3),
    narrativeKey: 'lore.award-nomination',
    kicker: 'AWARDS // THE SHORTLIST',
    title: 'You Have Been Nominated',
    context: (s) => `Your name is on the shortlist, and ${s?.label ?? 'the client you built it with'} is the one who put it there.`,
    options: [
      opt({ id: 'award_campaign', label: 'Work the campaign', flavorText: 'Spend money to be louder.', effects: [{ kind: 'money', amount: -500 }, { kind: 'reputation', amount: 8 }], memories: [{ key: 'award-campaigned' }], outcome: 'The trade notices you are playing the game. Then they vote.' }),
      opt({ id: 'award_thank_client', label: 'Thank them instead', flavorText: 'Credit where it is due.', effects: [{ kind: 'reputation', amount: 3 }, { kind: 'clientXp', amount: 30 }], memories: [{ key: 'award-thanked-client' }], outcome: 'The nomination goes nowhere. The relationship goes everywhere.' }),
    ],
    delegable: true,
    defaultOptionId: 'award_thank_client',
  },

  // ───────── Studio ─────────
  {
    id: 'tube_stash_find',
    family: 'studio-trouble',
    baseWeight: 8,
    cooldownDays: 40,
    maxOccurrences: 4,
    // Historical weave: the tube era, or the plug-in era.
    eligible: (facts) =>
      facts.equipmentCount > 0 && (facts.era === 'analog60s' || facts.era === 'streaming2020s'),
    narrativeKey: 'studio.tube-stash',
    kicker: 'STUDIO // THE BACK OF THE RACK',
    title: 'A Stash Nobody Claimed',
    context: () => 'Clearing out the back of the rack turned up a box that predates everyone currently working here.',
    options: [
      opt({ id: 'stash_refurb', label: 'Refurbish and keep it', flavorText: 'Valves, cloth, patience.', effects: [{ kind: 'gearCondition', amount: 8 }, { kind: 'money', amount: -180 }], memories: [{ key: 'stash-refurbished' }], outcome: 'It goes back into the chain and sounds like itself again.' }),
      opt({ id: 'stash_sell', label: 'Sell it on as found', flavorText: 'Someone else’s problem.', effects: [{ kind: 'money', amount: 700 }, { kind: 'gearCondition', amount: -3 }], memories: [{ key: 'stash-sold' }], outcome: 'It leaves the building before lunch.' }),
    ],
  },
  {
    id: 'power_surge',
    family: 'studio-trouble',
    baseWeight: 9,
    cooldownDays: 50,
    maxOccurrences: 4,
    eligible: (facts) => facts.equipmentCount > 0,
    narrativeKey: 'studio.power-surge',
    kicker: 'STUDIO // EVERYTHING AT ONCE',
    title: 'The Mains Blew',
    context: () => 'A surge came through the whole floor at once. Nothing is on fire. Several things are no longer working perfectly.',
    options: [
      opt({ id: 'surge_engineer', label: 'Call an engineer', flavorText: 'Slow, proper, expensive.', effects: [{ kind: 'money', amount: -550 }, { kind: 'gearCondition', amount: 7 }], memories: [{ key: 'surge-serviced' }], outcome: 'Everything comes back better isolated than it left.' }),
      opt({ id: 'surge_ride_it', label: 'Ride it out', flavorText: 'It usually stops.', effects: [{ kind: 'money', amount: 90 }, { kind: 'gearCondition', amount: -9 }], memories: [{ key: 'surge-ignored', ttlDays: 90 }], outcome: 'The desk hums at a slightly different note now.' }),
    ],
    delegable: true,
    defaultOptionId: 'surge_engineer',
  },
  {
    id: 'intern_prodigy',
    family: 'studio-trouble',
    baseWeight: 8,
    cooldownDays: 60,
    maxOccurrences: 3,
    eligible: (facts) => facts.staffCount > 0,
    narrativeKey: 'studio.intern-prodigy',
    kicker: 'STUDIO // SOMEONE IS LEARNING FAST',
    title: 'The One You Least Expected',
    context: () => 'The newest person on the roster has quietly stopped needing the session explained twice.',
    options: [
      opt({ id: 'prodigy_own_session', label: 'Give them their own session', flavorText: 'Trust, early.', effects: [{ kind: 'staffXp', amount: 50 }, { kind: 'money', amount: 350 }], memories: [{ key: 'prodigy-trusted' }], outcome: 'They run the session. It holds.' }),
      opt({ id: 'prodigy_shadow', label: 'Keep them shadowing', flavorText: 'Nothing goes wrong.', effects: [{ kind: 'staffXp', amount: 20 }, { kind: 'reputation', amount: 1 }], memories: [{ key: 'prodigy-shadowing' }], outcome: 'They keep watching. They keep getting better.' }),
    ],
    delegable: true,
    defaultOptionId: 'prodigy_shadow',
  },
  {
    id: 'sync_brief_lands',
    family: 'studio-trouble',
    baseWeight: 11,
    cooldownDays: 30,
    maxOccurrences: 4,
    // Historical weave: the download era (iTunes / social feeds).
    eligible: (facts) => facts.reputation >= 30 && facts.era === 'internet2000s',
    narrativeKey: 'studio.sync-brief',
    kicker: 'STUDIO // A SYNC, UNSOLICITED',
    title: 'A Brief With Your Name On It',
    context: () => 'A picture and an advert want a needle drop, they heard your room, and they want it this week.',
    options: [
      opt({ id: 'sync_take_it', label: 'Take the session', flavorText: 'Deadline money.', effects: [{ kind: 'money', amount: 900 }, { kind: 'reputation', amount: 3 }], memories: [{ key: 'sync-landed' }], outcome: 'It airs on schedule. Everyone asks who did the needle drop.' }),
      opt({ id: 'sync_decline', label: 'Decline politely', flavorText: 'The calendar is honest.', effects: [{ kind: 'reputation', amount: 2 }, { kind: 'money', amount: 0 }], memories: [{ key: 'sync-declined' }], outcome: 'They find someone else, and remember that you were busy.' }),
    ],
  },
];

/** Ids of the rows that are gated on state a later slice has to write. */
export const GATED_EVENT_IDS: readonly string[] = ['reunion_rumor'];

/** Rows whose context name-checks `HISTORICAL_EVENTS` so rolled and scripted history read as one world. */
export const HISTORICAL_WEAVE_IDS: readonly string[] = [
  'rival_diss_track',
  'venue_anniversary',
  'tube_stash_find',
  'sync_brief_lands',
];