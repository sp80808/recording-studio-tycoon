/** Specialist freelancer network (#69): contacts, deterministic offers, stage uplift, margin, delivery credit. */
import {
  FREELANCERS, CONTACT_BY_ID, specialtiesForStage, knownContacts, offersFor, arrangeFreelancer, settleFreelancers,
  lockedForStage, activeUplift, internalShare, freelancerFees, familiarityWith, feeFor, upliftFor, leadDaysFor, rateDiscount,
  BAND_UPLIFT, BASE_FEE, SUCCESS_QUALITY, EASY_SCHEDULING_AT, type FreelancerState,
} from '../src/rpg/freelancers';
import { quoteFor } from '../src/rpg/serviceQuote';
import { applyReportToState } from '../src/game-mechanics/ProjectService';
import { getLedger } from '../src/economy/ledger';
import { generateNewProjects } from '../src/utils/projectUtils';
import { createNewGameState } from '../src/utils/newGameState';
import type { GameState, Project, ProjectReport } from '../src/types/game';

let n = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); n++; console.log(`PASS: ${m}`); };

const stage = (stageName: string, workUnitsBase = 12) => ({ stageName, focusAreas: [], workUnitsBase, workUnitsCompleted: 0, completed: false });
const job = (genre = 'Pop', payoutBase = 1500, over: Partial<Project> = {}): Project => ({
  id: 'job-1', title: 'Demo', genre, clientType: 'Indie', difficulty: 3, durationDaysTotal: 6, payoutBase, repGainBase: 5,
  requiredSkills: {}, stages: [stage('Tracking'), stage('Mixing'), stage('Mastering & Polish')], matchRating: 'Good',
  accumulatedCPoints: 0, accumulatedTPoints: 0, currentStageIndex: 1, completedStages: [], workSessionCount: 0,
  focusAllocation: { performance: 33, soundCapture: 33, layering: 34 }, ...over,
}) as Project;
const base: GameState = { ...createNewGameState(), money: 2000, currentDay: 10, saveSeed: 4242 } as GameState;
const withJob = (p = job(), over: Partial<GameState> = {}): GameState => ({ ...base, activeProject: p, activeProjects: [], ...over } as GameState);

// ───── Content ─────
ok(FREELANCERS.length >= 8 && FREELANCERS.length <= 14, 'the network has 8-14 authored contacts');
ok(new Set(FREELANCERS.map((c) => c.id)).size === FREELANCERS.length, 'contact ids are unique');
for (const sp of ['mix', 'master', 'session'] as const) ok(FREELANCERS.some((c) => c.specialties.includes(sp) && c.unlock.kind === 'start'), `a ${sp} specialist is in the starting contacts`);
ok(FREELANCERS.every((c) => c.unlock.kind !== 'referral' || (CONTACT_BY_ID[c.unlock.from] && c.unlock.from !== c.id)), 'every referral names a real, different contact');
// Every contact is reachable from the start without a cycle.
const reach = new Set(FREELANCERS.filter((c) => c.unlock.kind !== 'referral').map((c) => c.id));
for (let i = 0; i < FREELANCERS.length; i++) for (const c of FREELANCERS) if (c.unlock.kind === 'referral' && reach.has(c.unlock.from)) reach.add(c.id);
ok(reach.size === FREELANCERS.length, 'every contact can be reached through starts, milestones or referrals');
ok(FREELANCERS.some((c) => c.rateBand === 'low') && FREELANCERS.some((c) => c.rateBand === 'premium'), 'rates run from low to premium');

// ───── Stage matching ─────
ok(specialtiesForStage('Mixing & Mastering').join() === 'mix,master', 'a combined mix and master stage can take either specialist');
ok(specialtiesForStage('Streaming Master').join() === 'master', 'a master stage wants a mastering engineer');
ok(specialtiesForStage('Horn Section Overdubs').includes('session'), 'overdub stages want session musicians');
ok(specialtiesForStage('Pre-Production').length === 0 && specialtiesForStage('Concept & Sound Design').length === 0, 'planning stages offer nothing to outsource');
let covered = new Set<string>();
for (let lvl = 1; lvl <= 13; lvl += 2) for (const p of generateNewProjects(8, lvl, 'modern', [], 1, 5)) for (const st of p.stages) specialtiesForStage(st.stageName).forEach((s) => covered.add(s));
ok(covered.has('mix') && covered.has('master') && covered.has('session'), 'real gig stages exercise all three specialties');

// ───── Known contacts and unlocks ─────
const startIds = knownContacts(base).map((c) => c.id);
ok(startIds.length === 3, 'a new studio knows the three starting contacts');
ok(knownContacts({ ...base, premisesTier: 1 } as GameState).some((c) => c.id === 'nia-chen'), 'a project studio opens a premium mixer');
ok(!knownContacts(base).some((c) => c.id === 'nia-chen'), 'she is not known before that');
const regular = { ...base, clientRelationships: { c: { clientId: 'c', clientName: 'C', primaryGenre: 'Pop', relationshipXp: 0, tier: 'Regular', sessionsCompleted: 3, lastSessionDay: 1, bestQualityScore: 70, referralCount: 0 } } } as GameState;
ok(knownContacts(regular).some((c) => c.id === 'priya-nair'), 'a regular client introduces a mastering engineer');
ok(knownContacts({ ...base, hiredStaff: [{ id: 'a' }, { id: 'b' }] } as unknown as GameState).some((c) => c.id === 'tobi-adeyemi'), 'two staff bring a referral from the crew');
const twice: FreelancerState = { known: [], familiarity: { 'jo-marek': 2 }, log: [] };
ok(knownContacts({ ...base, freelancers: twice } as GameState).some((c) => c.id === 'lucia-bellamy'), 'two good jobs with a contact earn a referral');
ok(knownContacts({ ...base, freelancers: { known: ['nia-chen'], familiarity: {}, log: [] } } as GameState).some((c) => c.id === 'nia-chen'), 'a contact once known stays known');

// ───── Offers: derived, deterministic, no reroll ─────
const s0 = withJob();
const o1 = offersFor(s0, s0.activeProject!, 1);
ok(o1.length >= 1 && o1.every((o) => o.contact.specialties.includes('mix')), 'the mix stage offers the known mix engineers only');
ok(JSON.stringify(offersFor(JSON.parse(JSON.stringify(s0)), s0.activeProject!, 1)) === JSON.stringify(o1), 'reloading the save gives the same offers');
ok(JSON.stringify(offersFor({ ...s0, money: 1 } as GameState, s0.activeProject!, 1).map((o) => o.fee)) === JSON.stringify(o1.map((o) => o.fee)), 'offers do not depend on spendable cash');
ok(offersFor(s0, s0.activeProject!, 0).length === 0, 'a plain tracking stage has no specialist to call');
ok(o1.every((o, i) => i === 0 || o.fee >= o1[i - 1].fee), 'offers are listed cheapest first');
const premiumState = withJob(job(), { premisesTier: 1 } as never);
const prem = offersFor(premiumState, premiumState.activeProject!, 1);
ok(prem.some((o) => o.contact.rateBand === 'premium') && prem.find((o) => o.contact.rateBand === 'premium')!.fee > prem.find((o) => o.contact.rateBand === 'low')!.fee, 'a premium specialist costs more than a low-rate one');
ok(prem.find((o) => o.contact.rateBand === 'premium')!.uplift > prem.find((o) => o.contact.rateBand === 'low')!.uplift, 'and lifts the stage more');

// Fees, discounts, uplift.
const dev = CONTACT_BY_ID['dev-rao'];
ok(feeFor(dev, 12, 0) === BASE_FEE.low && feeFor(dev, 24, 0) > feeFor(dev, 12, 0), 'longer stages cost more');
ok(rateDiscount(0) === 0 && rateDiscount(2) > 0 && rateDiscount(4) > rateDiscount(2), 'familiarity earns a preferred rate, then a regular rate');
ok(feeFor(dev, 12, 4) < feeFor(dev, 12, 0), 'a regular customer pays less');
ok(upliftFor(dev, 'Rock').uplift > upliftFor(dev, 'Jazz').uplift, 'knowing the genre lifts a stage more than not knowing it');
ok(upliftFor(CONTACT_BY_ID['hollis-bright'], 'Jazz').uplift === BAND_UPLIFT.low, 'a no-preference contact gets the plain band uplift');
ok(Object.values(BAND_UPLIFT).every((u) => u > 0 && u <= 0.15), 'uplift stays small and bounded');
// Familiarity never changes quality.
ok(upliftFor(dev, 'Rock').uplift === offersFor({ ...s0, freelancers: { known: [], familiarity: { 'dev-rao': 6 }, log: [] } } as GameState, s0.activeProject!, 1).find((o) => o.contact.id === 'dev-rao')!.uplift, 'familiarity never raises quality');

// Availability.
const lead0 = leadDaysFor(s0, dev);
ok(leadDaysFor(JSON.parse(JSON.stringify(s0)), dev).days === lead0.days, 'lead time is deterministic');
const busyLog = { known: [], familiarity: {}, log: [1, 2, 3].map((i) => ({ contactId: 'dev-rao', day: 9, projectId: `p${i}` })) } as FreelancerState;
const busy = leadDaysFor({ ...s0, freelancers: busyLog } as GameState, dev);
ok(busy.days > lead0.days && busy.limited, 'heavy booking lengthens the lead time and says so');
ok(offersFor({ ...s0, freelancers: busyLog } as GameState, s0.activeProject!, 1).find((o) => o.contact.id === 'dev-rao')!.uplift === upliftFor(dev, 'Pop').uplift, 'a busy contact is slower, never secretly worse');
const easy = leadDaysFor({ ...s0, freelancers: { known: [], familiarity: { 'dev-rao': EASY_SCHEDULING_AT }, log: [] } } as GameState, CONTACT_BY_ID['nia-chen']);
ok(easy.days <= leadDaysFor(s0, CONTACT_BY_ID['nia-chen']).days, 'familiarity eases scheduling');
ok(BASE_FEE.premium > BASE_FEE.standard && BASE_FEE.standard > BASE_FEE.low, 'rate bands are ordered');

// ───── Arranging ─────
const res = arrangeFreelancer(s0, 1, 'dev-rao');
ok(res.ok, 'a known contact can be booked for the current stage');
if (!res.ok) throw new Error('unreachable');
const after = res.state;
const fee = res.offer.fee;
ok(after.money === s0.money - fee, 'the fee leaves the bank');
ok(getLedger(after).entries.some((e) => e.category === 'freelancer-fee' && Math.abs(e.amount) === fee), 'the ledger books a freelancer fee');
ok(after.activeProject!.outsourcing!.length === 1 && freelancerFees(after.activeProject!) === fee, 'the project records the outsourced stage and its fee');
ok(after.freelancers!.log.length === 1 && after.freelancers!.log[0].contactId === 'dev-rao', 'the booking joins the contact log');
const again = arrangeFreelancer(after, 1, 'dev-rao');
ok(!again.ok, 'the same stage cannot be booked twice');
ok(!arrangeFreelancer({ ...s0, money: fee - 1 } as GameState, 1, 'dev-rao').ok, 'a booking needs the cash');
ok(!arrangeFreelancer(s0, 0, 'dev-rao').ok, 'a stage with no matching specialty cannot be booked');
ok(!arrangeFreelancer(s0, 1, 'nia-chen').ok, 'an unknown contact cannot be booked');
ok(!arrangeFreelancer(withJob(job('Pop', 1500, { currentStageIndex: 2 })), 1, 'dev-rao').ok, 'a stage already behind you cannot be booked');
ok(!arrangeFreelancer({ ...base, activeProject: null } as GameState, 1, 'dev-rao').ok, 'no session, no booking');
// Reload cannot reroll the terms.
const reloaded: GameState = JSON.parse(JSON.stringify(after));
ok(reloaded.activeProject!.outsourcing![0].readyDay === after.activeProject!.outsourcing![0].readyDay, 'the booked arrival day survives a reload');
// Uplift only after arrival.
const ent = after.activeProject!.outsourcing![0];
ok(activeUplift(after.activeProject!, 1, ent.readyDay - 1) === 0 && activeUplift(after.activeProject!, 1, ent.readyDay) === ent.uplift, 'the specialist only counts once they have arrived');
ok(activeUplift(after.activeProject!, 0, 99) === 0 && activeUplift(job(), 1, 99) === 0, 'other stages and unbooked projects get nothing');

// ───── Margin ─────
const plainQuote = quoteFor(s0 as never, job());
const bookedQuote = quoteFor(after as never, after.activeProject!);
ok(bookedQuote.freelancerFees === fee && bookedQuote.directCosts === plainQuote.directCosts + fee && bookedQuote.margin === plainQuote.margin - fee, 'the booked fee comes straight out of the quoted margin');
ok(plainQuote.freelancerFees === 0 && plainQuote.outsideHint !== undefined && plainQuote.outsideHint.from > 0, 'before booking, the quote hints at outside help without charging for it');
ok(quoteFor(base as never, { ...job(), stages: [stage('Pre-Production')] } as Project).outsideHint === undefined, 'no hint when nothing could be outsourced');

// ───── Delivery: staff keep an edge, familiarity grows, referral unlocks ─────
const crew = { id: 'st1', name: 'Sam', role: 'Engineer', salary: 40, xpInRole: 0, status: 'Working', assignedProjectId: 'job-1', energy: 80, skills: {}, primaryStats: { creativity: 30, technical: 30 } };
const rep = (q = 70): ProjectReport => ({ projectId: 'job-1', projectTitle: 'Demo', overallQualityScore: q, moneyGained: 1500, reputationGained: 1, playerManagementXpGained: 0, skillBreakdown: [], reviewSnippet: 'ok', assignedPerson: { type: 'staff', id: 'st1', name: 'Sam' } }) as ProjectReport;
const inHouse = applyReportToState({ ...withJob(), hiredStaff: [crew] } as unknown as GameState, rep());
const outsourced = applyReportToState({ ...after, hiredStaff: [crew] } as unknown as GameState, rep());
const xp = (s: GameState) => s.hiredStaff[0].xpInRole;
ok(xp(inHouse) > xp(outsourced), `in-house work trains the crew more (${xp(inHouse)} vs ${xp(outsourced)})`);
ok(familiarityWith(outsourced, 'dev-rao') === 1 && familiarityWith(inHouse, 'dev-rao') === 0, 'a good outsourced delivery adds one point of familiarity');
const poor = applyReportToState({ ...after, hiredStaff: [crew] } as unknown as GameState, rep(SUCCESS_QUALITY - 5));
ok(familiarityWith(poor, 'dev-rao') === 0, 'a poor delivery does not build the relationship');
ok(internalShare(after.activeProject!) < 1 && internalShare(job()) === 1, 'the crew share shrinks with outsourced stages');
// Referral line on the review.
const nearly = { ...after, freelancers: { ...after.freelancers!, familiarity: { 'dev-rao': 1 } }, hiredStaff: [crew] } as unknown as GameState;
const r2 = rep(); const out2 = applyReportToState(nearly, r2);
ok(familiarityWith(out2, 'dev-rao') === 2 && out2.freelancers!.known.includes('kenji-watanabe') && String(r2.reviewSnippet).includes('Kenji Watanabe'), 'the second good job opens a referral and the review says so');
ok(applyReportToState(out2, rep()) === out2, 'settling twice changes nothing');
ok(JSON.stringify(settleFreelancers(base, undefined, 90).state) === JSON.stringify(base), 'nothing outsourced leaves the network untouched');
// Legacy saves.
ok(knownContacts({ ...base, freelancers: undefined } as GameState).length === 3 && familiarityWith({}, 'x') === 0, 'saves without the field behave as a fresh network');

// ───── No contact always wins ─────
const payouts: number[] = [];
for (let lvl = 1; lvl <= 13; lvl += 2) for (const p of generateNewProjects(10, lvl, 'modern', [], 1, 5)) payouts.push(Math.round(p.payoutBase));
const lo = Math.min(...payouts), hi = Math.max(...payouts);
ok(hi > lo * 3, `real payouts span a wide range ($${lo} to $${hi})`);
let allKnown: GameState = { ...base, premisesTier: 3, labelInterest: { indie_label_001: 40 }, playerBands: [{ id: 'b', fame: 40 }], hiredStaff: [{ id: 'a' }, { id: 'b' }], clientRelationships: { c: { ...regular.clientRelationships!.c, tier: 'Loyal' } }, freelancers: { known: [], familiarity: Object.fromEntries(FREELANCERS.map((c) => [c.id, 2])), log: [] } } as unknown as GameState;
const stagesOf = ['Mixing', 'Streaming Master', 'Horn Section Overdubs'];
let dominated = 0, tested = 0;
for (const c of FREELANCERS) {
  const signs = new Set<boolean>();
  for (const name of stagesOf) {
    if (!specialtiesForStage(name).some((s) => c.specialties.includes(s))) continue;
    for (const genre of [...new Set(['Pop', 'Rock', 'Jazz', ...c.genreAffinity])]) for (const payout of [lo, Math.round((lo + hi) / 2), hi]) {
      const p = job(genre, payout, { stages: [stage('Tracking'), stage(name), stage('Final polish')], currentStageIndex: 1 });
      const o = offersFor(allKnown, p, 1).find((x) => x.contact.id === c.id);
      if (o) signs.add(o.expectedNet > 0);
    }
  }
  tested++;
  if (signs.size < 2) { dominated++; console.log('ONE-SIDED', c.id, [...signs]); }
}
ok(dominated === 0, `no contact is always worth it or never worth it across the payout range (${tested} checked)`);

// ───── Label and venue contact sources ─────
const odile = CONTACT_BY_ID['odile-brandt'], cass = CONTACT_BY_ID['cass-ferreira'];
ok(odile.unlock.kind === 'label' && cass.unlock.kind === 'venue' && odile.specialties.includes('master') && cass.specialties.includes('mix'), 'a label house engineer (master) and a venue engineer (mix) are authored');
ok(!knownContacts({ ...base, labelInterest: { major_label_001: 24 } } as GameState).some((c) => c.id === 'odile-brandt'), 'label interest below the line opens nobody');
ok(knownContacts({ ...base, labelInterest: { indie_label_001: 25 } } as GameState).some((c) => c.id === 'odile-brandt'), 'a label at 25 interest introduces its house engineer');
const bandWith = (fame: number) => ({ id: 'b', fame }) as unknown as GameState['playerBands'][number];
ok(!knownContacts({ ...base, playerBands: [bandWith(24)] } as GameState).some((c) => c.id === 'cass-ferreira'), 'a band below the fame line opens nobody');
ok(knownContacts({ ...base, playerBands: [bandWith(10), bandWith(25)] } as GameState).some((c) => c.id === 'cass-ferreira'), 'a band with 25 fame gets a venue introduction');
ok(knownContacts({ ...base, playerBands: undefined, labelInterest: undefined } as unknown as GameState).length === 3, 'saves without bands or label interest add no contacts');
const keep = knownContacts({ ...base, labelInterest: { indie_label_001: 30 } } as GameState).map((c) => c.id);
ok(knownContacts({ ...base, freelancers: { known: keep, familiarity: {}, log: [] } } as GameState).some((c) => c.id === 'odile-brandt'), 'once met, the label contact stays known if interest later falls');
// Next-contact hint.
const lockedMaster = lockedForStage(base, 'Streaming Master');
ok(lockedMaster.length > 0 && lockedMaster.every((l) => l.contact.specialties.includes('master')), 'the hint lists unmet mastering contacts only');
ok(lockedMaster[0].contact.unlock.kind !== 'referral', 'milestone contacts come before referral-gated ones');
ok(lockedMaster.some((l) => l.contact.id === 'odile-brandt' && /label/i.test(l.hint)), 'the label contact explains how to meet her');
ok(lockedForStage(base, 'Pre-Production').length === 0, 'a stage nobody could take over has no hint');
const everyone = { ...allKnown, labelInterest: { indie_label_001: 40 }, playerBands: [bandWith(40)] } as GameState;
ok(lockedForStage(everyone, 'Mixing').length === 0 && lockedForStage(everyone, 'Streaming Master').length === 0, 'nothing is left to meet once every contact is known');

console.log(`freelancers: ${n} checks passed`);
