/** Fan mail inbox — retention anchor. Pure generation; RNG threaded as arg.
 * 100% of letter RNG must flow through the injected RandomSource (seeded from
 * project.id). Capped queue (20, FIFO) enforced by caller.
 */
import type { RandomSource } from '@/simulation/seededRandom';
import { pickWithRandom, randomInt } from '@/simulation/seededRandom';

export interface FanLetter {
  id: string;
  kind: 'praise' | 'request' | 'hate';
  from: string;
  body: string;
  /** Game-day expiry. */
  expiresDay: number;
  genre: string;
}

export const MAX_INBOX = 20;

const FANS = ['Lo-fi kid', 'Bedroom producer', 'College radio DJ', 'Tour bus driver', 'Vinyl collector', 'Night-shift nurse', 'High-school band', 'Retired roadie'];
const PRAISE = [
  'That last cut is on repeat in my shop all day.',
  'I heard your mix on the radio and pulled over to listen.',
  'My band keeps arguing about how you got that drum sound.',
  'Played your track at my wedding. Floor went off.',
];
const REQUESTS = [
  'Any chance of a stripped-back version?',
  'Come record in our town hall? We will pack it.',
  'Can you master our demo? We have $200 and pizza.',
];
const HATE = [
  'That mix is muddy on my earbuds. Do better.',
  'Sold out. The old stuff was real.',
];

export const generateFanLetters = (
  input: { projectId: string; quality: number; genre: string; charted: boolean; currentDay: number },
  rng: RandomSource
): FanLetter[] => {
  const letters: FanLetter[] = [];
  const day = input.currentDay;
  if (input.quality >= 80) {
    const count = input.charted ? 3 : randomInt(rng, 1, 2);
    for (let i = 0; i < count; i++) {
      letters.push({
        id: `${input.projectId}-fan-${i}`,
        kind: rng() < 0.7 ? 'praise' : 'request',
        from: pickWithRandom(rng, FANS),
        body: pickWithRandom(rng, input.quality >= 90 ? PRAISE : [...PRAISE, ...REQUESTS]),
        expiresDay: day + 14,
        genre: input.genre,
      });
    }
  } else if (input.quality < 30 && rng() < 0.5) {
    letters.push({
      id: `${input.projectId}-hate-0`,
      kind: 'hate',
      from: pickWithRandom(rng, FANS),
      body: pickWithRandom(rng, HATE),
      expiresDay: day + 14,
      genre: input.genre,
    });
  }
  return letters;
};

/** Reply costs 1 session tick → +fans/rep; ignore always safe (expires). */
export const REPLY_COST_SESSIONS = 1;
export const INBOX_EXPIRY_DAYS = 14;
