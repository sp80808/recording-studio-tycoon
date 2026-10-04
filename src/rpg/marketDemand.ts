/**
 * Market demand signals (#52). The market itself is the seeded, derived model in `services/marketService`
 * (same save seed and day always give the same trends, so a reload cannot reroll it). This module turns it
 * into small, bounded signals for the places the issue allows: which enquiries turn up, how a release lands,
 * and the Industry Pulse. It never touches recording quality, skill, room, minigame score or XP.
 *
 * Cadence is weekly: the market a save sees only changes when the week changes.
 */
import { marketTrendsAt } from '@/services/marketService';
import type { MarketTrend } from '@/types/charts';

export const MARKET_WEEK_DAYS = 7;
/** Enquiry weight swing at the hottest and coldest genre: 1 ± this. */
export const ENQUIRY_DEMAND_SWING = 0.25;
/** Most a release outcome roll can move from demand, in score points. */
export const RELEASE_DEMAND_POINTS = 6;

export const weekStartDay = (day: number): number => Math.max(0, Math.floor(day / MARKET_WEEK_DAYS) * MARKET_WEEK_DAYS);

/** Template genres that ride a market genre. Anything unlisted is neutral. */
const MARKET_GENRE: Record<string, string> = {
  pop: 'pop', 'synth pop': 'pop', 'dance pop': 'pop',
  rock: 'rock', punk: 'rock', 'pop-punk': 'rock', blues: 'rock', 'hair metal': 'rock', 'alt rock': 'rock',
  'hip-hop': 'hip-hop', trap: 'hip-hop',
  electronic: 'electronic', edm: 'electronic', house: 'electronic', techno: 'electronic',
  country: 'country',
  jazz: 'jazz',
};

const cache = new Map<string, MarketTrend[]>();
const weeklyMarket = (seed: string | number, day: number): MarketTrend[] => {
  const start = weekStartDay(day);
  const key = `${seed}:${start}`;
  let trends = cache.get(key);
  if (!trends) {
    trends = marketTrendsAt(seed, start);
    if (cache.size > 64) cache.clear();
    cache.set(key, trends);
  }
  return trends;
};

const scoreOf = (t: MarketTrend): number => Math.max(-1, Math.min(1, (t.popularity - 50) / 50));

/** -1 (cold) to +1 (hot) for a genre this week; 0 for genres the market does not model. */
export const genreDemand = (seed: string | number | undefined, day: number, genre: string): number => {
  const market = MARKET_GENRE[genre.trim().toLowerCase()];
  if (!market || seed === undefined) return 0;
  const t = weeklyMarket(seed, day).find((x) => x.genreId === market);
  return t ? scoreOf(t) : 0;
};

/** Multiplier for how often an enquiry of this genre turns up: 0.75 to 1.25, 1 when unknown. */
export const enquiryDemandWeight = (seed: string | number | undefined, day: number) =>
  (genre: string): number => 1 + ENQUIRY_DEMAND_SWING * genreDemand(seed, day, genre);

/** Points added to a release's outcome score: hot demand helps a little, cold hurts a little, never more than the cap. */
export const releaseDemandPoints = (seed: string | number | undefined, day: number, genre: string): number =>
  Math.round(RELEASE_DEMAND_POINTS * genreDemand(seed, day, genre));

export type PulseWord = 'Rising' | 'Stable' | 'Cooling';
export interface PulseLine {
  genre: string;
  word: PulseWord;
  arrow: '↑' | '→' | '↓';
  /** What it does to the work on offer, in plain words. */
  effect: string;
}

const GENRE_NAME: Record<string, string> = { pop: 'Pop', rock: 'Rock', 'hip-hop': 'Hip-Hop', electronic: 'Electronic', country: 'Country', jazz: 'Jazz' };

/** The few genres moving most this week, for the compact Industry Pulse. */
export const industryPulse = (seed: string | number | undefined, day: number, limit = 3): PulseLine[] => {
  if (seed === undefined) return [];
  return weeklyMarket(seed, day)
    .map((t) => ({ t, s: scoreOf(t) }))
    .sort((a, b) => Math.abs(b.s) - Math.abs(a.s) || a.t.genreId.localeCompare(b.t.genreId))
    .slice(0, limit)
    .map(({ t, s }) => {
      const word: PulseWord = t.trendDirection === 'falling' || s < -0.3 ? 'Cooling' : t.trendDirection === 'rising' || t.trendDirection === 'emerging' || s > 0.3 ? 'Rising' : 'Stable';
      return {
        genre: GENRE_NAME[t.genreId] ?? t.genreId,
        word,
        arrow: word === 'Rising' ? '↑' : word === 'Cooling' ? '↓' : '→',
        effect: s > 0.3 ? 'More enquiries, releases land a little better' : s < -0.3 ? 'Fewer enquiries, releases land a little softer' : 'Typical enquiries',
      };
    });
};
