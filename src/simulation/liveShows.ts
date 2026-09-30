/**
 * Live shows: one-night gigs a player band can play between recording work.
 * Pure and deterministic — the outcome depends only on the inputs and a seed,
 * so the same booking on the same day always resolves identically.
 */
import { createSeededRandom } from './seededRandom';

export type MarketingTier = 'none' | 'flyers' | 'radio' | 'campaign';

export interface Venue {
  id: string;
  name: string;
  capacity: number;
  rentalCost: number;
  minFame: number;
  minReputation: number;
  /** Fraction of the gate the venue keeps. */
  houseCut: number;
}

export interface MarketingOption {
  id: MarketingTier;
  label: string;
  cost: number;
  /** Multiplier on expected turnout. */
  draw: number;
}

export const VENUES: readonly Venue[] = [
  { id: 'basement', name: 'Basement Bar', capacity: 60, rentalCost: 60, minFame: 0, minReputation: 0, houseCut: 0.2 },
  { id: 'club', name: 'Local Club', capacity: 200, rentalCost: 350, minFame: 25, minReputation: 15, houseCut: 0.25 },
  { id: 'theatre', name: 'Old Theatre', capacity: 600, rentalCost: 1600, minFame: 60, minReputation: 40, houseCut: 0.3 },
  { id: 'arena', name: 'City Arena', capacity: 2000, rentalCost: 7500, minFame: 120, minReputation: 90, houseCut: 0.35 },
];

export const MARKETING_OPTIONS: readonly MarketingOption[] = [
  { id: 'none', label: 'Word of mouth', cost: 0, draw: 0.8 },
  { id: 'flyers', label: 'Flyers & posters', cost: 40, draw: 1.0 },
  { id: 'radio', label: 'Radio spots', cost: 250, draw: 1.25 },
  { id: 'campaign', label: 'Full campaign', cost: 1200, draw: 1.5 },
];

/** Days a band needs to rest after a show before it can play again. */
export const SHOW_COOLDOWN_DAYS = 3;

export type SoundcheckTier = 'skip' | 'quick' | 'full';

export interface SoundcheckOption {
  id: SoundcheckTier;
  label: string;
  cost: number;
  /** Chance a technical mishap (feedback, dead mic) hits the night. */
  mishapChance: number;
}

export const SOUNDCHECK_OPTIONS: readonly SoundcheckOption[] = [
  { id: 'skip', label: 'Skip it', cost: 0, mishapChance: 0.4 },
  { id: 'quick', label: 'Quick line check', cost: 30, mishapChance: 0.2 },
  { id: 'full', label: 'Full soundcheck', cost: 120, mishapChance: 0.06 },
];

/** Era-flavoured venue names; venue ids and stats stay the same across eras. */
const ERA_VENUE_NAMES: Record<string, Partial<Record<string, string>>> = {
  analog60s: { basement: 'Coffeehouse', club: 'Dance Hall', theatre: 'Ballroom', arena: 'Civic Auditorium' },
  classic_rock: { basement: 'Garage Bar', club: 'Rock Club', theatre: 'Concert Hall', arena: 'Stadium' },
  golden_age: { basement: 'College Bar', club: 'MTV-era Club', theatre: 'Amphitheatre', arena: 'Mega Arena' },
  digital_age: { basement: 'Indie Bar', club: 'Festival Tent', theatre: 'Grand Theatre', arena: 'Festival Main Stage' },
  modern: { basement: 'Open-Mic Bar', club: 'Live House', theatre: 'Sold-Out Theatre', arena: 'Stadium Tour Stop' },
};

export const venueDisplayName = (venue: Venue, eraId?: string): string =>
  (eraId && ERA_VENUE_NAMES[eraId]?.[venue.id]) || venue.name;

export interface ShowPlan {
  venueId: string;
  marketing: MarketingTier;
  ticketPrice: number;
  /** Absent on plans built before soundchecks existed; treated as 'quick'. */
  soundcheck?: SoundcheckTier;
}

const getSoundcheck = (tier?: SoundcheckTier): SoundcheckOption =>
  SOUNDCHECK_OPTIONS.find(o => o.id === (tier ?? 'quick')) ?? SOUNDCHECK_OPTIONS[1];

export interface ShowBandInput {
  bandId: string;
  fame: number;
  /** Average 0-10 review score of the band's active releases; 5 when none. */
  hitQuality: number;
}

export interface ShowResult {
  ok: boolean;
  reason?: string;
  attendance: number;
  sellOut: boolean;
  grossRevenue: number;
  costs: number;
  net: number;
  fameGain: number;
  reputationGain: number;
  xpGain: number;
  /** True when a technical mishap cost the band a verdict tier and part of the gate. */
  mishap: boolean;
  /** 'flop' | 'ok' | 'hit' | 'legendary' — drives the toast copy. */
  verdict: 'flop' | 'ok' | 'hit' | 'legendary';
}

export const getVenue = (id: string): Venue | undefined => VENUES.find(v => v.id === id);

export const getAvailableVenues = (fame: number, reputation: number): Venue[] =>
  VENUES.filter(v => fame >= v.minFame && reputation >= v.minReputation);

/** Ticket price a venue can reasonably support before demand collapses. */
export const suggestedTicketPrice = (venue: Venue): number =>
  Math.round(4 + Math.log2(venue.capacity) * 1.2);

export const totalCost = (plan: ShowPlan): number => {
  const venue = getVenue(plan.venueId);
  const marketing = MARKETING_OPTIONS.find(m => m.id === plan.marketing);
  return (venue?.rentalCost ?? 0) + (marketing?.cost ?? 0) + getSoundcheck(plan.soundcheck).cost;
};

export const canPlayShow = (
  band: { fame: number; isOnTour: boolean; lastShowDay?: number },
  reputation: number,
  plan: ShowPlan,
  money: number,
  currentDay: number
): { ok: boolean; reason?: string } => {
  const venue = getVenue(plan.venueId);
  if (!venue) return { ok: false, reason: 'Unknown venue.' };
  if (band.isOnTour) return { ok: false, reason: 'The band is out on tour.' };
  if (band.fame < venue.minFame) return { ok: false, reason: `Needs ${venue.minFame} fame for ${venue.name}.` };
  if (reputation < venue.minReputation) return { ok: false, reason: `Needs ${venue.minReputation} studio reputation for ${venue.name}.` };
  if (plan.ticketPrice < 1) return { ok: false, reason: 'Ticket price must be at least $1.' };
  if (band.lastShowDay !== undefined && currentDay - band.lastShowDay < SHOW_COOLDOWN_DAYS) {
    return { ok: false, reason: 'The band is still resting from the last show.' };
  }
  if (money < totalCost(plan)) return { ok: false, reason: 'Not enough cash to cover venue and marketing.' };
  return { ok: true };
};

/**
 * Resolve one night. Turnout blends band fame, recent hit quality, marketing and
 * how far the ticket price sits from what the room supports; a seeded swing of
 * roughly ±20% is the night-of luck.
 */
export const resolveShow = (
  band: ShowBandInput,
  plan: ShowPlan,
  seed: string | number
): ShowResult => {
  const venue = getVenue(plan.venueId);
  const marketing = MARKETING_OPTIONS.find(m => m.id === plan.marketing);
  if (!venue || !marketing) {
    return { ok: false, reason: 'Invalid show plan.', attendance: 0, sellOut: false, grossRevenue: 0, costs: 0, net: 0, fameGain: 0, reputationGain: 0, xpGain: 0, mishap: false, verdict: 'flop' };
  }

  const rng = createSeededRandom(seed);
  const luck = 0.8 + rng() * 0.4;

  // Fame 0-~150 → base draw as a share of the room, convex so unknowns barely fill big rooms; quality nudges it ±25%.
  const baseDraw = Math.min(1.2, 0.03 + Math.pow(band.fame / 140, 1.3));
  const quality = 0.75 + (Math.max(0, Math.min(10, band.hitQuality)) / 10) * 0.5;
  const priceRatio = plan.ticketPrice / suggestedTicketPrice(venue);
  const priceFactor = Math.max(0.1, Math.min(1.4, 1.6 - 0.6 * priceRatio));

  const demand = venue.capacity * baseDraw * quality * marketing.draw * priceFactor * luck;
  const attendance = Math.max(0, Math.min(venue.capacity, Math.round(demand)));
  const sellOut = attendance >= venue.capacity;

  // Night-of mishap: drawn after luck so soundcheck choice never reshuffles turnout.
  const mishap = rng() < getSoundcheck(plan.soundcheck).mishapChance;
  const refundShare = mishap ? 0.1 : 0;
  const gate = attendance * plan.ticketPrice;
  const grossRevenue = Math.round(gate * (1 - venue.houseCut) * (1 - refundShare));
  const costs = totalCost(plan);
  const net = grossRevenue - costs;

  const fillRate = attendance / venue.capacity;
  const tierBonus = VENUES.indexOf(venue) + 1;
  const tiers: ShowResult['verdict'][] = ['flop', 'ok', 'hit', 'legendary'];
  const rawTier = sellOut && luck > 1.1 ? 3 : fillRate >= 0.75 ? 2 : fillRate >= 0.35 ? 1 : 0;
  const verdict = tiers[Math.max(0, rawTier - (mishap ? 1 : 0))];

  const verdictScale = { flop: 0, ok: 1, hit: 2, legendary: 3 }[verdict];
  return {
    ok: true,
    attendance,
    sellOut,
    grossRevenue,
    costs,
    net,
    fameGain: verdictScale * tierBonus,
    reputationGain: verdict === 'flop' ? 0 : Math.max(1, Math.round(verdictScale * tierBonus * 0.5)),
    xpGain: 10 * tierBonus + 10 * verdictScale,
    mishap,
    verdict,
  };
};
