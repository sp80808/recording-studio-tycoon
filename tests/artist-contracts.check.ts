/** A&R contracts: seeded prospects, negotiation, royalties, expiry, roster limits. */
import assert from 'node:assert';
import {
  generateProspects, evaluateOffer, offerValue, signArtist, processContractsDay, canSign, validateTerms,
  dailyCatalogIncome, dailyStudioShare, scoutingBatchDay, MAX_ROSTER, PROSPECT_COUNT, PROSPECT_REFRESH_DAYS,
  ContractTerms, SignedArtist,
} from '../src/simulation/artistContracts';

let passed = 0;
const ok = (cond: boolean, msg: string): void => {
  assert(cond, `FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

const a = generateProspects('seed', 10, 40);
const b = generateProspects('seed', 13, 40);
ok(a.length === PROSPECT_COUNT, 'fixed prospect count');
ok(JSON.stringify(a) === JSON.stringify(b), 'same scouting week gives same prospects');
ok(JSON.stringify(a) !== JSON.stringify(generateProspects('seed', 10 + PROSPECT_REFRESH_DAYS, 40)), 'next week refreshes prospects');
ok(scoutingBatchDay(13) === 7, 'batch day floors to week start');
ok(a.every(p => validateTerms(p.ask) === null), 'every ask is valid terms');
const lowRep = generateProspects('s2', 1, 0);
const highRep = generateProspects('s2', 1, 100);
ok(Math.max(...highRep.map(p => p.fame)) >= Math.max(...lowRep.map(p => p.fame)) - 0, 'reputation does not shrink the pool');
ok(lowRep.every(p => p.fame <= 15), 'fresh studio only scouts unknowns');

const p = a[0];
ok(offerValue(p.ask, p.ask) > 0.99 && offerValue(p.ask, p.ask) < 1.01, 'offer equal to ask values at 1.0');
ok(evaluateOffer({ ...p, stubbornness: 0.2 }, p.ask, 0, 0).result === 'accepted', 'meeting the ask is accepted');
const lowball: ContractTerms = { ...p.ask, advance: Math.round(p.ask.advance * 0.1), artistSplit: 0.05 };
const low = evaluateOffer(p, lowball, 0, 0);
ok(low.result === 'rejected' && low.insulted, 'extreme lowball is rejected and insulting');
const close: ContractTerms = { ...p.ask, advance: Math.round(p.ask.advance * 0.7), artistSplit: p.ask.artistSplit * 0.8 };
const stubborn = { ...p, stubbornness: 0.9 };
const res = evaluateOffer(stubborn, close, 0, 0);
ok(res.result === 'counter' || res.result === 'rejected', 'stubborn artist does not accept a discount');
if (res.result === 'counter') {
  ok(res.counter.advance >= close.advance && res.counter.advance <= p.ask.advance, 'counter sits between offer and ask');
}
const easy = { ...p, stubbornness: 0.2 };
const weak = evaluateOffer(easy, close, 0, 0);
const strong = evaluateOffer(easy, close, 10, 200);
const rank = { rejected: 0, counter: 1, accepted: 2 } as const;
ok(rank[strong.result] >= rank[weak.result], 'acumen and reputation never hurt a negotiation');

// Royalties and expiry
const terms: ContractTerms = { advance: 200, artistSplit: 0.3, durationDays: 30, exclusive: false };
const s: SignedArtist = signArtist({ ...p, fame: 40, skill: 6 }, terms, 100);
ok(s.expiresDay === 130, 'expiry = signed + duration');
ok(dailyStudioShare(s) === Math.round(dailyCatalogIncome(s) * 0.7), 'studio keeps 1 - split');
ok(dailyCatalogIncome({ ...s, terms: { ...terms, exclusive: true } }) > dailyCatalogIncome(s), 'exclusive earns more');
let roster = [s];
let total = 0;
for (let day = 101; day < 130; day++) {
  const r = processContractsDay(roster, day);
  roster = r.roster; total += r.income;
  assert(r.expired.length === 0);
}
ok(roster.length === 1 && total > 0, 'active contract pays daily until expiry');
const last = processContractsDay(roster, 130);
ok(last.roster.length === 0 && last.expired.length === 1 && last.income > 0, 'artist expires on final day after paying');
ok(last.expired[0].totalEarned === total + last.income, 'totalEarned tracks every payout');

// Roster / cash / term validation
const full = Array.from({ length: MAX_ROSTER }, () => s);
ok(!canSign(full, 9999, terms).ok, 'full roster blocks signing');
ok(!canSign([], 50, terms).ok, 'advance must be affordable');
ok(canSign([], 500, terms).ok, 'valid signing allowed');
ok(validateTerms({ ...terms, artistSplit: 0.9 }) !== null, 'split above 70% invalid');
ok(validateTerms({ ...terms, durationDays: 5 }) !== null, 'too-short contract invalid');

console.log(`artist-contracts: ${passed} checks passed`);
