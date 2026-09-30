/**
 * A&R layer: scout prospects, negotiate contract terms, collect a share of the
 * signed artist's catalog income until the deal expires. Pure and seeded so the
 * same scouting day always offers the same prospects.
 */
import { createSeededRandom, pickWithRandom, randomInt, RandomSource } from './seededRandom';

export interface ContractTerms {
  /** Up-front payment to the artist. */
  advance: number;
  /** Fraction of catalog income the artist keeps (0.1-0.6). */
  artistSplit: number;
  durationDays: number;
  /** Exclusive artists earn more for the studio but demand more. */
  exclusive: boolean;
}

export interface ArtistProspect {
  id: string;
  name: string;
  genre: string;
  /** 0-100 */
  fame: number;
  /** 1-10 */
  skill: number;
  /** 0-1, how hard they bargain. */
  stubbornness: number;
  ask: ContractTerms;
}

export interface SignedArtist {
  id: string;
  name: string;
  genre: string;
  fame: number;
  skill: number;
  terms: ContractTerms;
  signedDay: number;
  expiresDay: number;
  totalEarned: number;
}

export type NegotiationOutcome =
  | { result: 'accepted' }
  | { result: 'counter'; counter: ContractTerms }
  | { result: 'rejected'; insulted: boolean };

export const PROSPECT_REFRESH_DAYS = 7;
export const PROSPECT_COUNT = 3;
export const MAX_ROSTER = 4;
/** Per-artist ceiling so one megastar can't outrun touring income. */
export const MAX_DAILY_CATALOG = 600;
export const MIN_DURATION_DAYS = 30;
export const MAX_DURATION_DAYS = 180;

const FIRST = ['Mara', 'Jesse', 'Dion', 'Coco', 'Ravi', 'Lena', 'Otis', 'Nia', 'Felix', 'Juno', 'Sade', 'Theo'];
const LAST = ['Vale', 'Okafor', 'Reyes', 'Lindqvist', 'Hart', 'Moreau', 'Bell', 'Castillo', 'Ito', 'Wren', 'Duarte', 'Stone'];
const GENRES = ['Rock', 'Pop', 'Hip-Hop', 'Electronic', 'Jazz', 'Folk', 'R&B'];

/** Day the current scouting batch was generated. */
export const scoutingBatchDay = (currentDay: number): number =>
  Math.floor(currentDay / PROSPECT_REFRESH_DAYS) * PROSPECT_REFRESH_DAYS;

/** Catalog income the artist generates per day, before the split. */
export const dailyCatalogIncome = (artist: Pick<SignedArtist, 'fame' | 'skill' | 'terms'>): number =>
  Math.min(
    MAX_DAILY_CATALOG,
    Math.round(artist.fame * 3 * (0.6 + artist.skill / 10) * (artist.terms.exclusive ? 1.25 : 1))
  );

/** What the studio actually banks per day. */
export const dailyStudioShare = (artist: Pick<SignedArtist, 'fame' | 'skill' | 'terms'>): number =>
  Math.round(dailyCatalogIncome(artist) * (1 - artist.terms.artistSplit));

const askFor = (fame: number, skill: number, rng: RandomSource): ContractTerms => {
  const exclusive = rng() < 0.3;
  return {
    advance: Math.round((100 + fame * fame * 0.6 + skill * 40) * (exclusive ? 1.2 : 1) / 10) * 10,
    artistSplit: Math.round((0.15 + Math.min(0.35, fame / 250) + rng() * 0.1) * 100) / 100,
    durationDays: randomInt(rng, 3, 9) * 15,
    exclusive,
  };
};

/**
 * Prospects for the scouting batch containing `currentDay`. Better reputation
 * surfaces better talent; fame is capped so the pool grows with the studio.
 */
export const generateProspects = (
  seed: string | number,
  currentDay: number,
  reputation: number
): ArtistProspect[] => {
  const batch = scoutingBatchDay(currentDay);
  const rng = createSeededRandom(`${seed}:prospects:${batch}`);
  const fameCeiling = Math.min(90, 15 + reputation * 0.8);
  return Array.from({ length: PROSPECT_COUNT }, (_, i) => {
    const fame = randomInt(rng, 3, Math.max(5, Math.round(fameCeiling)));
    const skill = Math.max(1, Math.min(10, Math.round(2 + fame / 14 + (rng() - 0.5) * 4)));
    return {
      id: `prospect:${batch}:${i}`,
      name: `${pickWithRandom(rng, FIRST)} ${pickWithRandom(rng, LAST)}`,
      genre: pickWithRandom(rng, GENRES),
      fame,
      skill,
      stubbornness: Math.round((0.2 + rng() * 0.6) * 100) / 100,
      ask: askFor(fame, skill, rng),
    };
  });
};

export const validateTerms = (terms: ContractTerms): string | null => {
  if (!(terms.advance >= 0)) return 'Advance cannot be negative.';
  if (terms.artistSplit < 0.05 || terms.artistSplit > 0.7) return 'Royalty split must be between 5% and 70%.';
  if (terms.durationDays < MIN_DURATION_DAYS || terms.durationDays > MAX_DURATION_DAYS) {
    return `Contract length must be ${MIN_DURATION_DAYS}-${MAX_DURATION_DAYS} days.`;
  }
  return null;
};

/** How happy the artist is with an offer versus their ask; 1.0 = exactly the ask. */
export const offerValue = (offer: ContractTerms, ask: ContractTerms): number => {
  const advance = ask.advance > 0 ? Math.min(1.6, offer.advance / ask.advance) : 1;
  const split = ask.artistSplit > 0 ? Math.min(1.6, offer.artistSplit / ask.artistSplit) : 1;
  const duration = offer.durationDays / ask.durationDays;
  // Artists dislike long lock-ins a little and exclusivity a lot unless paid for it.
  const lockIn = duration > 1 ? -0.1 * (duration - 1) : 0.05 * (1 - duration);
  const exclusivity = offer.exclusive && !ask.exclusive ? -0.15 : 0;
  return advance * 0.45 + split * 0.55 + lockIn + exclusivity;
};

/**
 * Bargaining: business acumen (0-10) and reputation soften a stubborn artist.
 * Close misses get a counter-offer at the artist's terms shaded toward yours.
 */
export const evaluateOffer = (
  prospect: Pick<ArtistProspect, 'ask' | 'stubbornness'>,
  offer: ContractTerms,
  businessAcumen: number,
  reputation: number
): NegotiationOutcome => {
  const value = offerValue(offer, prospect.ask);
  const leverage = Math.min(0.2, businessAcumen * 0.015) + Math.min(0.1, reputation / 1000);
  const needed = 0.85 + prospect.stubbornness * 0.3 - leverage;
  if (value >= needed) return { result: 'accepted' };
  if (value >= needed - 0.25) {
    return {
      result: 'counter',
      counter: {
        advance: Math.round((prospect.ask.advance + offer.advance) / 2 / 10) * 10,
        artistSplit: Math.round(((prospect.ask.artistSplit + offer.artistSplit) / 2) * 100) / 100,
        durationDays: prospect.ask.durationDays,
        exclusive: prospect.ask.exclusive,
      },
    };
  }
  return { result: 'rejected', insulted: value < needed - 0.5 };
};

export const signArtist = (
  prospect: ArtistProspect,
  terms: ContractTerms,
  currentDay: number
): SignedArtist => ({
  id: prospect.id,
  name: prospect.name,
  genre: prospect.genre,
  fame: prospect.fame,
  skill: prospect.skill,
  terms,
  signedDay: currentDay,
  expiresDay: currentDay + terms.durationDays,
  totalEarned: 0,
});

export interface DailyContractResult {
  roster: SignedArtist[];
  income: number;
  expired: SignedArtist[];
}

/** One day of royalties; artists whose contract ends today are returned as expired. */
export const processContractsDay = (roster: SignedArtist[], currentDay: number): DailyContractResult => {
  let income = 0;
  const expired: SignedArtist[] = [];
  const kept: SignedArtist[] = [];
  for (const artist of roster) {
    const share = dailyStudioShare(artist);
    income += share;
    const updated = {
      ...artist,
      totalEarned: artist.totalEarned + share,
      // Working with the studio slowly builds an artist's name.
      fame: Math.min(100, Math.round((artist.fame + artist.skill * 0.01) * 100) / 100),
    };
    if (currentDay >= artist.expiresDay) expired.push(updated);
    else kept.push(updated);
  }
  return { roster: kept, income, expired };
};

export const canSign = (
  roster: SignedArtist[],
  money: number,
  terms: ContractTerms
): { ok: boolean; reason?: string } => {
  const invalid = validateTerms(terms);
  if (invalid) return { ok: false, reason: invalid };
  if (roster.length >= MAX_ROSTER) return { ok: false, reason: `Roster is full (${MAX_ROSTER} artists).` };
  if (money < terms.advance) return { ok: false, reason: 'Not enough cash for the advance.' };
  return { ok: true };
};
