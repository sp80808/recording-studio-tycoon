/**
 * Flavour copy: wholesome, industry-insider one-liners for tips, loading, empty states and idle chatter.
 * House rules: allusion only (no real people, brands, songs or quotes), warm not snarky, one joke per line,
 * and a layperson should still smile even if they miss the nod. Guarded by tests/flavour-copy.check.ts.
 */
import { createSeededRandom } from '@/simulation/seededRandom';

/** Footer tips and loading lines. Each doubles as a nudge about how the game works or how studios work. */
export const INDUSTRY_TIPS: readonly string[] = [
  "Every great record started as a bad demo with one good idea. Yours is in there somewhere.",
  "\"Fix it in the mix\" is a lovely thing to say and a terrible thing to plan around.",
  "Take 37 is usually where the magic happens, right after take 36 where everyone swore it was done.",
  "The tea is part of the signal chain. Nobody can prove otherwise.",
  "Clients remember how the room felt long after they forget the snare sound. Keep the room happy.",
  "The quietest person in the control room often has the best idea. Ask them.",
  "Drummers are timekeepers. Singers are weather. Plan the day accordingly.",
  "A rider with one bowl of only-the-blue-sweets is a test of your attention to detail. You passed it.",
  "Every cable in the drawer is tangled. This is a law of nature, not a management failure.",
  "A good engineer sounds like they did nothing. That's the craft.",
  "The song is the boss. Sometimes the boss wants a cowbell. Sometimes the boss is wrong, but you play the cowbell anyway.",
  "Tuning the room beats buying the gear. Your neighbour's vacuum cleaner is a mastering engineer of sorts.",
  "Charts move fast, but a great tune finds its people eventually. Patience is a plugin.",
  "Nobody ever said \"I wish that session were shorter\" about the good one.",
  "A happy accident is only an accident if you didn't hit record. You always hit record.",
  "Loud is a choice, and so is quiet. The best records know which one they're making.",
  "Everyone in the business started by carrying someone else's amp. Be kind to the new kid.",
  "Streaks are lovely, but rest is also a creative decision. The faders will wait.",
  "A studio is just a room where people agree to be brave for a few hours.",
  "The hit single and the B-side you love more are often the same band on different days.",
];

/** Short "loading" strings for the boot fallback. */
export const LOADING_LINES: readonly string[] = [
  "Warming up the tubes…",
  "Tuning the room…",
  "Untangling cables…",
  "Putting the kettle on…",
  "Finding the good pencil…",
  "Checking the talkback mic is, in fact, off…",
  "Rolling tape…",
];

export type EmptyStateKey = 'staff' | 'skills' | 'crew' | 'chronicle' | 'chart' | 'sessionRoom' | 'warehouse';

/** Empty-state lines: a title line and a hint line. Kept kind; an empty room is an opportunity. */
export const EMPTY_STATES: Record<EmptyStateKey, { title: string; hint: string }> = {
  staff: { title: 'The couch is unoccupied.', hint: 'Visit the Recruitment Center and find someone who loves this as much as you do.' },
  skills: { title: 'A blank tape, full of possibility.', hint: 'Finish a session and something will stick.' },
  crew: { title: 'Just you and the faders.', hint: 'Hire someone through the Staff panel while the studio is quiet. Somebody has to laugh at your jokes.' },
  chronicle: { title: 'The first page is still blank.', hint: 'A story beat will find you, they always do.' },
  chart: { title: 'The charts are waiting for their next favourite.', hint: 'Release a track with a band and they will find you the moment it lands.' },
  sessionRoom: { title: 'The live room is hushed.', hint: 'Book a session and the amps will hum.' },
  warehouse: { title: 'The warehouse remembers every purchase.', hint: 'Nothing is shelved here yet.' },
};

/** Crew room chatter shown when the control room is idle. */
export const IDLE_CHATTER: readonly string[] = [
  "Someone left a half-finished lyric on the whiteboard.",
  "The kettle clicks off. Nobody moves. Nobody ever moves.",
  "A guitarist is playing the same four bars. He thinks it's a new song.",
  "The intern is alphabetising the cables. Nobody asked.",
  "Through the wall, a drummer is playing the world's slowest fill.",
  "Someone asks whether it's too loud. It is never too loud. It is sometimes too loud.",
  "The couch has seen things. The couch has heard demos.",
  "A faint \"one more take?\" drifts in from the live room.",
  "The plant in the corner is thriving on a diet of second-hand bass.",
  "A tape op silently judges your label choices. Fondly.",
];

/** Deterministic pick so a screen shows the same line for a given seed and a new one when the seed changes. */
export function pickFlavour<T>(pool: readonly T[], seed: string | number): T {
  const rng = createSeededRandom(seed);
  return pool[Math.floor(rng() * pool.length)];
}
