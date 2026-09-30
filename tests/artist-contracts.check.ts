/** A&R contracts: seeded prospects, negotiation, royalties, expiry, roster limits. */
import assert from 'node:assert';
import {
  generateProspects, evaluateOffer, offerValue, signArtist, processContractsDay, canSign, validateTerms,
  dailyCatalogIncome, dailyStudioShare, scoutingBatchDay, MAX_ROSTER, PROSPECT_COUNT, PROSPECT_REFRESH_DAYS,
  artistQualityBonus, artistChartBoost, MAX_ARTIST_QUALITY_BONUS, MAX_ARTIST_CHART_BOOST,
  ContractTerms, SignedArtist,
} from '../src/simulation/artistContracts';
import { generateProjectReview } from '../src/utils/projectReviewUtils';
import { getSettlementBonuses } from '../src/utils/settlementBonuses';
import { initializeSkillsPlayer } from '../src/utils/skillUtils';
import type { GameState, PlayerData, Project } from '../src/types/game';

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

// Artist effects on sessions and charts
const pop = { skill: 8, fame: 50, genre: 'Pop' };
const jazz = { skill: 8, fame: 50, genre: 'Jazz' };
ok(artistQualityBonus(undefined, 'Pop') === 0 && artistQualityBonus([], 'Pop') === 0, 'no roster means no bonus');
ok(artistQualityBonus([pop], 'Pop') > artistQualityBonus([jazz], 'Pop'), 'matching genre beats off-genre quality');
ok(artistQualityBonus([jazz], 'Pop') > 0, 'off-genre guest spot still helps a little');
ok(artistQualityBonus([pop], 'pop') === artistQualityBonus([pop], 'Pop'), 'genre match ignores case');
ok(artistQualityBonus(Array(4).fill(pop), 'Pop') === MAX_ARTIST_QUALITY_BONUS, 'quality bonus is capped');
ok(artistChartBoost([pop], 'Pop') > artistChartBoost([jazz], 'Pop'), 'matching genre beats off-genre chart boost');
ok(artistChartBoost([{ skill: 1, fame: 0, genre: 'Pop' }], 'Pop') === 0, 'unknown artist adds no chart boost');
ok(artistChartBoost(Array(4).fill({ skill: 9, fame: 100, genre: 'Pop' }), 'Pop') === MAX_ARTIST_CHART_BOOST, 'chart boost is capped');

// End to end: a signed artist lifts the real session review score
const project = {
  id: 'proj-art', title: 'Test Session', genre: 'Pop', clientType: 'Indie Band', difficulty: 3, durationDaysTotal: 4,
  payoutBase: 1000, repGainBase: 20, requiredSkills: {}, stages: [], matchRating: 'Good', accumulatedCPoints: 10,
  accumulatedTPoints: 10, currentStageIndex: 0, completedStages: [], workSessionCount: 4,
  focusAllocation: { performance: 33, soundCapture: 33, layering: 34 },
} as unknown as Project;
const player = {
  xp: 0, level: 3, xpToNextLevel: 100, perkPoints: 0, dailyWorkCapacity: 5, reputation: 10,
  attributes: { focusMastery: 1, creativeIntuition: 1, technicalAptitude: 1, businessAcumen: 1 },
  skills: initializeSkillsPlayer(),
} as unknown as PlayerData;
const stateFor = (signedArtists: SignedArtist[]) => ({
  playerData: player, studioRooms: [], hiredStaff: [], ownedEquipment: [], clientRelationships: {}, signedArtists,
}) as unknown as GameState;
const popArtist: SignedArtist = { ...s, genre: 'Pop', skill: 9 };
const withArtist = getSettlementBonuses(stateFor([popArtist]), project);
const without = getSettlementBonuses(stateFor([]), project);
ok(without.artistQualityBonus === 0 && withArtist.artistQualityBonus > 0, 'settlement bonuses include the artist bonus');
const run = (b: typeof withArtist) =>
  generateProjectReview(project, { type: 'player', id: 'player', name: 'You' }, 60, player, [], b);
ok(run(withArtist).overallQualityScore > run(without).overallQualityScore, 'signed artist raises the real review score');
ok(run(withArtist).reviewSnippet.includes('signed artist') || withArtist.artistQualityBonus < 4, 'big artist bonus is credited in the review');

console.log(`artist-contracts: ${passed} checks passed`);
