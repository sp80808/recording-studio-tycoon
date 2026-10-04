/**
 * Industry events (#52): data-driven, deterministic market nudges.
 *
 * An event is derived from the save seed and the week, never stored, so a reload cannot reroll it and old saves
 * need no migration. Each event pushes a few market genres up or down for a fixed number of weeks, then expires
 * and the underlying seeded market is all that is left. The push is bounded; it only ever feeds demand signals
 * (enquiry weighting, release outcome, label commissions, Industry Pulse) and never recording quality.
 */
import { createSeededRandom } from '@/simulation/seededRandom';

export interface IndustryEventDef {
  id: string;
  name: string;
  /** Plain-words reason shown on the Industry Pulse. */
  reason: string;
  /** Market genre ids (pop, rock, hip-hop, electronic, country, jazz). */
  genres: readonly string[];
  /** Signed push on the -1..1 demand score. */
  shift: number;
  durationWeeks: number;
}

export const INDUSTRY_EVENTS: readonly IndustryEventDef[] = [
  { id: 'synth-revival', name: 'Synth revival', reason: 'A synth revival is on the radio', genres: ['electronic', 'pop'], shift: 0.35, durationWeeks: 3 },
  { id: 'festival-season', name: 'Festival season', reason: 'Festival season is booking guitar acts', genres: ['rock', 'country'], shift: 0.3, durationWeeks: 3 },
  { id: 'streaming-playlist-push', name: 'Playlist push', reason: 'Streaming playlists are pushing rap', genres: ['hip-hop'], shift: 0.4, durationWeeks: 2 },
  { id: 'jazz-club-boom', name: 'Jazz club boom', reason: 'Jazz clubs are filling up again', genres: ['jazz'], shift: 0.4, durationWeeks: 4 },
  { id: 'radio-shakeup', name: 'Radio shake-up', reason: 'Radio is cutting back on pop', genres: ['pop'], shift: -0.35, durationWeeks: 2 },
  { id: 'dance-licence-crackdown', name: 'Venue licence squeeze', reason: 'Venue licences are squeezing club nights', genres: ['electronic'], shift: -0.3, durationWeeks: 3 },
  { id: 'country-crossover', name: 'Country crossover', reason: 'A country crossover single is everywhere', genres: ['country', 'pop'], shift: 0.3, durationWeeks: 3 },
];

/** Chance a new event starts in any given week. */
export const EVENT_START_CHANCE = 0.25;
/** Total event push on one genre never exceeds this, however many overlap. */
export const EVENT_SHIFT_CAP = 0.5;

export interface ActiveIndustryEvent {
  def: IndustryEventDef;
  startWeek: number;
  /** Last week the event is felt. */
  endWeek: number;
}

const startedIn = (seed: string | number, week: number): IndustryEventDef | undefined => {
  if (week < 0) return undefined;
  const rng = createSeededRandom(`industry-event:${seed}:${week}`);
  if (rng() >= EVENT_START_CHANCE) return undefined;
  return INDUSTRY_EVENTS[Math.floor(rng() * INDUSTRY_EVENTS.length)];
};

const MAX_DURATION = Math.max(...INDUSTRY_EVENTS.map((e) => e.durationWeeks));

/** Events being felt in this week (an event runs from its start week for `durationWeeks`, then is gone). */
export const activeIndustryEvents = (seed: string | number | undefined, week: number): ActiveIndustryEvent[] => {
  if (seed === undefined) return [];
  const out: ActiveIndustryEvent[] = [];
  for (let w = Math.max(0, week - MAX_DURATION + 1); w <= week; w++) {
    const def = startedIn(seed, w);
    if (def && week < w + def.durationWeeks) out.push({ def, startWeek: w, endWeek: w + def.durationWeeks - 1 });
  }
  return out;
};

/** Bounded combined push on a market genre this week; 0 when no event touches it. */
export const eventShift = (seed: string | number | undefined, week: number, marketGenre: string): number => {
  let total = 0;
  for (const e of activeIndustryEvents(seed, week)) if (e.def.genres.includes(marketGenre)) total += e.def.shift;
  return Math.max(-EVENT_SHIFT_CAP, Math.min(EVENT_SHIFT_CAP, total));
};

/** The strongest active event on a genre, for the Pulse reason. */
export const eventReason = (seed: string | number | undefined, week: number, marketGenre: string): string | undefined => {
  const hits = activeIndustryEvents(seed, week).filter((e) => e.def.genres.includes(marketGenre));
  if (!hits.length) return undefined;
  return hits.sort((a, b) => Math.abs(b.def.shift) - Math.abs(a.def.shift) || a.def.id.localeCompare(b.def.id))[0].def.reason;
};
