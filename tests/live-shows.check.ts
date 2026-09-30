/** Live shows: deterministic resolution, venue gating, cooldown, economy sanity. */
import assert from 'node:assert';
import {
  VENUES, MARKETING_OPTIONS, SHOW_COOLDOWN_DAYS, resolveShow, canPlayShow,
  getAvailableVenues, suggestedTicketPrice, totalCost,
} from '../src/simulation/liveShows';

let passed = 0;
const ok = (cond: boolean, msg: string): void => {
  assert(cond, `FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

const band = { bandId: 'b1', fame: 60, hitQuality: 7 };
const club = VENUES[1];
const plan = { venueId: club.id, marketing: 'radio' as const, ticketPrice: suggestedTicketPrice(club) };

const a = resolveShow(band, plan, 'seed:1');
const b = resolveShow(band, plan, 'seed:1');
ok(JSON.stringify(a) === JSON.stringify(b), 'same seed gives identical outcome');
ok(a.attendance >= 0 && a.attendance <= club.capacity, 'attendance capped by capacity');
ok(a.net === a.grossRevenue - a.costs, 'net = gross - costs');
ok(a.costs === totalCost(plan), 'costs = venue + marketing');

const outcomes = Array.from({ length: 50 }, (_, i) => resolveShow(band, plan, `day:${i}`));
ok(new Set(outcomes.map(o => o.attendance)).size > 10, 'seed variation produces different nights');

// Marketing helps on average; gouging ticket prices hurts turnout.
const avg = (p: typeof plan) =>
  Array.from({ length: 100 }, (_, i) => resolveShow(band, p, `m:${i}`).attendance).reduce((s, n) => s + n, 0) / 100;
ok(avg({ ...plan, marketing: 'campaign' }) > avg({ ...plan, marketing: 'none' }), 'marketing raises attendance');
ok(avg({ ...plan, ticketPrice: plan.ticketPrice * 4 }) < avg(plan), 'overpriced tickets cut attendance');

// Unknown fame nobody can fill a theatre: an unknown band loses money there.
const nobody = { bandId: 'b2', fame: 0, hitQuality: 5 };
const theatre = { venueId: 'theatre', marketing: 'radio' as const, ticketPrice: suggestedTicketPrice(VENUES[2]) };
const losses = Array.from({ length: 30 }, (_, i) => resolveShow(nobody, theatre, `n:${i}`).net);
ok(losses.every(n => n < 0), 'overreaching an unknown band loses money');

// A famous band should profit on average at a fitting venue.
const star = { bandId: 'b3', fame: 100, hitQuality: 8 };
const arena = { venueId: 'arena', marketing: 'campaign' as const, ticketPrice: suggestedTicketPrice(VENUES[3]) };
const starNet = Array.from({ length: 50 }, (_, i) => resolveShow(star, arena, `s:${i}`).net);
ok(starNet.reduce((s, n) => s + n, 0) / 50 > 0, 'a star profits in the arena on average');

// Flops never grant reputation; better verdicts grow fame.
const flop = Array.from({ length: 50 }, (_, i) => resolveShow(nobody, theatre, `f:${i}`)).find(r => r.verdict === 'flop');
ok(!!flop && flop.reputationGain === 0 && flop.fameGain === 0, 'flop grants no fame or rep');
ok(outcomes.every(o => o.fameGain >= 0), 'fame never drops');

// Gating
ok(getAvailableVenues(0, 0).length === 1, 'fresh band only unlocks basement');
ok(getAvailableVenues(200, 200).length === VENUES.length, 'high fame/rep unlocks every venue');
const gate = (fame: number, rep: number, money: number, day: number, last?: number, tour = false) =>
  canPlayShow({ fame, isOnTour: tour, lastShowDay: last }, rep, plan, money, day).ok;
ok(gate(60, 40, 5000, 10), 'eligible band can book');
ok(!gate(10, 40, 5000, 10), 'low fame blocked');
ok(!gate(60, 0, 5000, 10), 'low reputation blocked');
ok(!gate(60, 40, 10, 10), 'insufficient cash blocked');
ok(!gate(60, 40, 5000, 10, 10 + 0, false), 'same-day repeat blocked by cooldown');
ok(gate(60, 40, 5000, 10 + SHOW_COOLDOWN_DAYS, 10), 'cooldown expires');
ok(!gate(60, 40, 5000, 10, undefined, true), 'touring band cannot play shows');
ok(MARKETING_OPTIONS.length === 4, 'four marketing tiers');

console.log(`live-shows: ${passed} checks passed`);
