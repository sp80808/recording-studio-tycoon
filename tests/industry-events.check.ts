/** Industry events and label commissions (#52): deterministic, bounded, expiring, and never about quality. */
import {
  INDUSTRY_EVENTS, EVENT_SHIFT_CAP, activeIndustryEvents, eventShift,
} from '../src/rpg/industryEvents';
import { genreDemand, industryPulse, MARKET_WEEK_DAYS } from '../src/rpg/marketDemand';
import { LABEL_ACCOUNTS } from '../src/rpg/labelInterest';
import { COMMISSION_HEAT, commissionedGenre, labelOffersFor } from '../src/rpg/labelAccounts';
import { createNewGameState } from '../src/utils/newGameState';

let n = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); n++; console.log(`PASS: ${m}`); };

// Determinism and neutrality.
const sig = (seed: number, w: number) => JSON.stringify(activeIndustryEvents(seed, w).map((e) => [e.def.id, e.startWeek]));
ok(sig(3, 40) === sig(3, 40), 'same save and week give the same events (reload safe)');
ok(activeIndustryEvents(undefined, 10).length === 0 && eventShift(undefined, 10, 'pop') === 0, 'a save with no seed has no events');
let busy = false, quiet = false, differs = false;
for (let w = 0; w < 200; w++) { if (activeIndustryEvents(7, w).length) busy = true; else quiet = true; if (sig(7, w) !== sig(8, w)) differs = true; }
ok(busy && quiet, 'events come and go; the market is not permanently eventful or empty');
ok(differs, 'a different save has different events');

// Bounds and expiry.
const MARKET = ['pop', 'rock', 'hip-hop', 'electronic', 'country', 'jazz'];
let bounded = true;
for (let w = 0; w < 400; w++) for (const g of MARKET) if (Math.abs(eventShift(11, w, g)) > EVENT_SHIFT_CAP + 1e-9) bounded = false;
ok(bounded, 'combined event push never exceeds the cap');
let expires = true, sawEvent = false;
for (let w = 0; w < 400; w++) for (const e of activeIndustryEvents(13, w)) {
  sawEvent = true;
  if (e.endWeek - e.startWeek + 1 !== e.def.durationWeeks) expires = false;
  if (activeIndustryEvents(13, e.endWeek + 1).some((x) => x.def.id === e.def.id && x.startWeek === e.startWeek)) expires = false;
}
ok(sawEvent && expires, 'an event is felt for exactly its duration and then expires');
ok(INDUSTRY_EVENTS.every((e) => Math.abs(e.shift) <= EVENT_SHIFT_CAP && e.durationWeeks >= 1 && e.genres.length > 0), 'event data is within bounds');

// Events feed demand, which stays bounded, weekly and quality-free.
let found: { seed: number; w: number; g: string } | undefined;
for (let seed = 1; seed < 40 && !found; seed++) for (let w = 0; w < 120 && !found; w++) {
  const g = MARKET.find((m) => eventShift(seed, w, m) !== 0);
  if (g) found = { seed, w, g };
}
ok(!!found, 'some save and week has an event touching a genre');
const day = found!.w * MARKET_WEEK_DAYS;
const label = (g: string) => ({ pop: 'Pop', rock: 'Rock', 'hip-hop': 'Hip-Hop', electronic: 'Electronic', country: 'Country', jazz: 'Jazz' } as Record<string, string>)[g];
ok(genreDemand(found!.seed, day, label(found!.g)) === genreDemand(found!.seed, day + MARKET_WEEK_DAYS - 1, label(found!.g)), 'event demand holds all week');
let demandBounded = true;
for (let w = 0; w < 300; w++) for (const g of MARKET) { const s = genreDemand(5, w * 7, label(g)); if (s < -1 || s > 1) demandBounded = false; }
ok(demandBounded, 'demand with events stays within -1..1');
const withReason = (() => { for (let w = 0; w < 200; w++) { const p = industryPulse(found!.seed, w * 7, 6).find((l) => l.reason); if (p) return p; } })();
ok(!!withReason && withReason.reason!.length > 0, 'the pulse names the event behind a move');

// Label commissions.
const base: any = { ...createNewGameState(), saveSeed: 'lbl', currentEra: 'streaming2020s', labelInterest: { indie_label_001: 60, electronic_label_001: 60 }, claimedOffers: [] };
let commissioned = 0, plain = 0, stable = true, flagged = true;
for (let d = 0; d < 400; d += 7) {
  const s = { ...base, currentDay: d };
  const a = labelOffersFor(s), b = labelOffersFor(s);
  if (JSON.stringify(a) !== JSON.stringify(b)) stable = false;
  for (const o of a) {
    const lab = LABEL_ACCOUNTS.find((l) => l.id === o.labelTerms!.labelId)!;
    const c = commissionedGenre(lab, 'streaming2020s', 'lbl', d);
    if (o.labelTerms!.commissionedGenre) {
      commissioned++;
      if (o.labelTerms!.commissionedGenre !== c || o.genre !== c || genreDemand('lbl', d, o.genre) < COMMISSION_HEAT) flagged = false;
    } else plain++;
  }
}
ok(stable, 'label offers with commissions are deterministic');
ok(commissioned > 0 && plain > 0, 'labels commission hot genres some weeks and send their usual mix others');
ok(flagged, 'a commission is always the label\'s hot genre and is flagged on the terms');
const noSeed = labelOffersFor({ ...base, saveSeed: undefined, currentDay: 21 });
ok(noSeed.every((o) => !o.labelTerms!.commissionedGenre), 'a save with no seed has no commissions');
ok(commissionedGenre(LABEL_ACCOUNTS[0], 'streaming2020s', undefined, 5) === undefined, 'no market, no commission');

console.log(`industry-events: all ${n} checks passed`);
