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
import { eventReason, eventShift } from '@/rpg/industryEvents';
import { createSeededRandom } from '@/simulation/seededRandom';

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

const clampScore = (n: number): number => Math.max(-1, Math.min(1, n));

/** A release the studio put out, as far as the market cares (a subset of StudioRelease). */
export interface ReleaseSignal { projectId: string; genre: string; qualityScore: number; releaseDay: number }
/** Releases count towards the market for this many days, fading out linearly. */
export const PLAYER_RELEASE_WINDOW_DAYS = 28;
/** Most one release moves its genre on the -1..1 demand score (at full quality, brand new). */
export const PLAYER_RELEASE_NUDGE = 0.03;
/** Total studio influence on one genre never exceeds this, however many releases pile up. */
export const PLAYER_RELEASE_CAP = 0.1;

/** Every release recorded on the client relationships, flattened for the market. */
export const releaseSignals = (rel: Record<string, { releases?: ReleaseSignal[] }> | undefined): ReleaseSignal[] =>
  Object.values(rel ?? {}).flatMap((r) => r.releases ?? []);

/**
 * The studio's own recent releases nudge their genre a little (#52): a good record in a genre makes it a touch
 * hotter for a few weeks. Small, capped, fades out, and the per-release size gets a tiny seeded jitter so it is
 * reproducible from the save. Only releases before `day` count, so a release never boosts its own outcome.
 */
export const playerReleaseShift = (seed: string | number | undefined, day: number, marketGenre: string, releases: readonly ReleaseSignal[] | undefined): number => {
  if (seed === undefined || !releases?.length) return 0;
  let total = 0;
  for (const r of releases) {
    const age = day - r.releaseDay;
    if (age <= 0 || age >= PLAYER_RELEASE_WINDOW_DAYS) continue;
    if (MARKET_GENRE[(r.genre ?? '').trim().toLowerCase()] !== marketGenre) continue;
    const jitter = 0.75 + 0.5 * createSeededRandom(`player-trend:${seed}:${r.projectId}`)();
    const fade = 1 - age / PLAYER_RELEASE_WINDOW_DAYS;
    total += PLAYER_RELEASE_NUDGE * jitter * (Math.max(0, Math.min(100, r.qualityScore)) / 100) * fade;
  }
  return Math.min(PLAYER_RELEASE_CAP, total);
};
const scoreOf = (t: MarketTrend): number => clampScore((t.popularity - 50) / 50);
const weekOf = (day: number): number => Math.floor(weekStartDay(day) / MARKET_WEEK_DAYS);
/** Underlying seeded market plus any active industry event, still bounded to -1..1. */
const demandOf = (seed: string | number, day: number, t: MarketTrend, releases?: readonly ReleaseSignal[]): number =>
  clampScore(scoreOf(t) + eventShift(seed, weekOf(day), t.genreId) + playerReleaseShift(seed, weekStartDay(day), t.genreId, releases));

/** -1 (cold) to +1 (hot) for a genre this week; 0 for genres the market does not model. */
export const genreDemand = (seed: string | number | undefined, day: number, genre: string, releases?: readonly ReleaseSignal[]): number => {
  const market = MARKET_GENRE[genre.trim().toLowerCase()];
  if (!market || seed === undefined) return 0;
  const t = weeklyMarket(seed, day).find((x) => x.genreId === market);
  return t ? demandOf(seed, day, t, releases) : 0;
};

/** Multiplier for how often an enquiry of this genre turns up: 0.75 to 1.25, 1 when unknown. */
export const enquiryDemandWeight = (seed: string | number | undefined, day: number, releases?: readonly ReleaseSignal[]) =>
  (genre: string): number => 1 + ENQUIRY_DEMAND_SWING * genreDemand(seed, day, genre, releases);

/** Points added to a release's outcome score: hot demand helps a little, cold hurts a little, never more than the cap. */
export const releaseDemandPoints = (seed: string | number | undefined, day: number, genre: string, releases?: readonly ReleaseSignal[]): number =>
  Math.round(RELEASE_DEMAND_POINTS * genreDemand(seed, day, genre, releases));

export type PulseWord = 'Rising' | 'Stable' | 'Cooling';
export interface PulseLine {
  genre: string;
  word: PulseWord;
  arrow: '↑' | '→' | '↓';
  /** What it does to the work on offer, in plain words. */
  effect: string;
  /** Why it is moving, when an industry event is behind it. */
  reason?: string;
  /** Week index (0-based; shown as +1) this genre's word last changed to what it is now; absent when it has held for the whole lookback. */
  changedWeek?: number;
  /** Plain-words version of `changedWeek` for the UI. */
  since: string;
}

/** How many weeks back the Pulse looks for the last change. */
export const PULSE_LOOKBACK_WEEKS = 12;

const GENRE_NAME: Record<string, string> = { pop: 'Pop', rock: 'Rock', 'hip-hop': 'Hip-Hop', electronic: 'Electronic', country: 'Country', jazz: 'Jazz' };

const wordFor = (t: MarketTrend, s: number): PulseWord =>
  t.trendDirection === 'falling' || s < -0.3 ? 'Cooling' : t.trendDirection === 'rising' || t.trendDirection === 'emerging' || s > 0.3 ? 'Rising' : 'Stable';

/** Week (0-based) the genre's word last changed to its current value, or undefined if it has held through the lookback. */
const lastChangedWeek = (seed: string | number, day: number, genreId: string, current: PulseWord, releases?: readonly ReleaseSignal[]): number | undefined => {
  const now = weekOf(day);
  for (let k = 1; k <= PULSE_LOOKBACK_WEEKS && now - k >= 0; k++) {
    const d = (now - k) * MARKET_WEEK_DAYS;
    const t = weeklyMarket(seed, d).find((x) => x.genreId === genreId);
    if (!t || wordFor(t, demandOf(seed, d, t, releases)) !== current) return now - k + 1;
  }
  return undefined;
};

/** The few genres moving most this week, for the compact Industry Pulse. */
export const industryPulse = (seed: string | number | undefined, day: number, limit = 3, releases?: readonly ReleaseSignal[]): PulseLine[] => {
  if (seed === undefined) return [];
  return weeklyMarket(seed, day)
    .map((t) => ({ t, s: demandOf(seed, day, t, releases) }))
    .sort((a, b) => Math.abs(b.s) - Math.abs(a.s) || a.t.genreId.localeCompare(b.t.genreId))
    .slice(0, limit)
    .map(({ t, s }) => {
      const reason = eventReason(seed, weekOf(day), t.genreId);
      const word = wordFor(t, s);
      const changed = lastChangedWeek(seed, day, t.genreId, word, releases);
      return {
        genre: GENRE_NAME[t.genreId] ?? t.genreId,
        word,
        reason,
        arrow: word === 'Rising' ? '↑' : word === 'Cooling' ? '↓' : '→',
        effect: s > 0.3 ? 'More enquiries, releases land a little better' : s < -0.3 ? 'Fewer enquiries, releases land a little softer' : 'Typical enquiries',
        changedWeek: changed,
        since: changed === undefined ? `${word.toLowerCase()} for ${PULSE_LOOKBACK_WEEKS}+ weeks` : `${word.toLowerCase()} since week ${changed + 1}`,
      };
    });
};
