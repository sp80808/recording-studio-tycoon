/** Service quote and deposits (#51 first slice): readable quote, cash-timing-only deposit. */
import {
  REVISION_ALLOWANCE, REVISION_ROUND_FEE, SYNERGY_DAYS, SERVICE_LOG_CAP, recordService, serviceSummary, setupSynergyHours, quoteFor, depositFor, settlementAfterDeposit, marginBandFor, DEPOSIT_RATE, TRUSTED_AFTER_SESSIONS,
} from '../src/rpg/serviceQuote';
import { applyReportToState } from '../src/game-mechanics/ProjectService';
import { getProjectPnl, getTotalIncome, earn } from '../src/economy/ledger';
import { generateNewProjects } from '../src/utils/projectUtils';
import { createNewGameState } from '../src/utils/newGameState';
import { fillerJobsFor } from '../src/rpg/fillerJobs';
import { applyDeliveryDecision, type UnresolvedIssue } from '../src/rpg/sessionIssues';
import type { ClientRelationship, Project, ProjectReport } from '../src/types/game';

let n = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); n++; console.log(`PASS: ${m}`); };

const base = { ...createNewGameState(), money: 1000, currentDay: 4 };
const offers = generateNewProjects(2, 6, 'modern', [], 1, 4);
ok(offers.length > 0, 'a new game has enquiries to quote');

// Every enquiry quotes hours, costs and a margin band the player can read.
const services = new Set<string>();
const bands = new Set<string>();
for (const p of offers) {
  const q = quoteFor(base, p);
  services.add(q.service);
  bands.add(q.marginBand);
  ok(q.roomHours > 0 && q.staffHours > 0 && q.staffHours <= q.roomHours, `${p.title}: staff hours never exceed room hours`);
  ok(q.fee === Math.round(p.payoutBase) && q.margin === q.fee - q.directCosts, `${p.title}: margin is fee less direct costs`);
}
for (let lvl = 1; lvl <= 13; lvl += 4) for (const p of generateNewProjects(6, lvl, 'modern', [], 1, 5)) services.add(quoteFor(base, p).service);
ok(services.size >= 2, 'enquiries map onto more than one service archetype');
ok(marginBandFor(100, 90) === 'thin' && marginBandFor(100, 60) === 'fair' && marginBandFor(100, 30) === 'strong' && marginBandFor(100, 10) === 'premium', 'margin bands run thin, fair, strong, premium');
ok(marginBandFor(0, 10) === 'thin', 'a zero fee is thin, not a crash');
ok(quoteFor(base, offers[0]).directCosts === quoteFor(base, offers[0]).directCosts, 'the quote is deterministic');

// No single band describes every enquiry: the quote has to help the player choose.
const spread = new Set<string>();
for (const era of ['modern', '90s'] as const) for (let lvl = 1; lvl <= 12; lvl += 3) {
  for (const p of generateNewProjects(6, lvl, era as never, [], 1, 5)) spread.add(quoteFor(base, p).marginBand);
}
ok(spread.size >= 3, `margin bands spread across enquiries (${[...spread].join(', ')})`);

// Longer jobs tie up more room time.
const short = { ...offers[0], stages: offers[0].stages.slice(0, 1), completedStages: [] } as Project;
const long = { ...offers[0], stages: [...offers[0].stages, ...offers[0].stages, ...offers[0].stages], completedStages: [] } as Project;
ok(quoteFor(base, long).roomHours > quoteFor(base, short).roomHours, 'more stages means more room hours');

// Deposit rules.
const newClient: Project = { ...offers[0], clientId: 'new-client', payoutBase: 1000, labelTerms: undefined };
const rel = (sessionsCompleted: number): Record<string, ClientRelationship> => ({
  'new-client': { clientId: 'new-client', clientName: 'N', primaryGenre: 'Pop', relationshipXp: 0, tier: 'Neutral', sessionsCompleted, lastSessionDay: 1, bestQualityScore: 60, referralCount: 0 } as ClientRelationship,
});
const d = depositFor({ clientRelationships: {} }, newClient);
ok(d.required && d.amount === 1000 * DEPOSIT_RATE, 'a new client puts down the deposit share of the fee');
ok(!depositFor({ clientRelationships: rel(TRUSTED_AFTER_SESSIONS) }, newClient).required, 'a regular client pays on delivery');
ok(depositFor({ clientRelationships: rel(TRUSTED_AFTER_SESSIONS - 1) }, newClient).required, 'one session in, the client still pays a deposit');
const filler = fillerJobsFor({ ...base, availableProjects: [] } as never)[0];
ok(!filler || !depositFor({ clientRelationships: {} }, filler).required, 'walk-in jobs never take a deposit');
ok(!depositFor({ clientRelationships: {} }, { ...newClient, labelTerms: {} as never }).required, 'label contracts use account terms, no deposit');

// Cash timing only: deposit now + remainder at settlement == the same total as no deposit.
ok(settlementAfterDeposit(1000, 400) === 600 && settlementAfterDeposit(1000, undefined) === 1000, 'settlement pays the fee less the deposit');
ok(settlementAfterDeposit(300, 400) === 0, 'a shrunken fee never claws the deposit back');

const report = (id: string, gained: number) => ({
  projectId: id, projectTitle: 'Demo', overallQualityScore: 60, moneyGained: gained, reputationGained: 1,
  playerManagementXpGained: 0, skillBreakdown: [], reviewSnippet: 'ok',
  assignedPerson: { type: 'player', id: 'player', name: 'You' },
}) as ProjectReport;
const booked = { ...newClient, id: 'dep-1', depositPaid: 400 } as Project;
const bankedState = earn({ ...base, activeProject: booked, activeProjects: [] }, 400, { category: 'deposit-income', projectId: 'dep-1', sourceId: 'deposit-dep-1' });
ok(bankedState.money === base.money + 400, 'the deposit is banked at booking');
const settled = applyReportToState(bankedState, report('dep-1', 1000));
ok(settled.money === base.money + 1000, 'deposit plus settlement equals the fee exactly');
ok(getTotalIncome(settled) === 1000 && getProjectPnl(settled, 'dep-1').revenue === 1000, 'the ledger books the whole fee once across both payments');
ok(applyReportToState(settled, report('dep-1', 1000)) === settled, 'settling the same project again changes nothing (reload safe)');
const plain = applyReportToState({ ...base, activeProject: { ...newClient, id: 'plain-1' } as Project, activeProjects: [] }, report('plain-1', 1000));
ok(plain.money === base.money + 1000, 'a project with no deposit still pays the full fee at settlement');

// Revision allowance: sold with mix/master/full production, none for tracking and vocals.
ok(REVISION_ALLOWANCE.mix === 2 && REVISION_ALLOWANCE.master === 1 && REVISION_ALLOWANCE.tracking === 0, 'revision rounds are bounded and service-specific');
ok(offers.every((p) => quoteFor(base, p).revisionAllowance === REVISION_ALLOWANCE[quoteFor(base, p).service]), 'the quote carries the service allowance');
const issues = [{ id: 'i1', label: 'Hum on the vocal chain', cause: 'ground loop', phase: 'recording', severity: 3 }] as unknown as UnresolvedIssue[];
const rep = { ...report('rv', 1000), reputationGained: 10 } as ProjectReport;
let sawRevision = false;
for (let i = 0; i < 40 && !sawRevision; i++) {
  const plainOut = applyDeliveryDecision(rep, issues, 'deliver', `seed${i}`, 0);
  if (!plainOut.reviewSnippet.includes('revision and trust took a small hit')) continue;
  sawRevision = true;
  const coveredOut = applyDeliveryDecision(rep, issues, 'deliver', `seed${i}`, 1);
  ok(plainOut.reputationGained < rep.reputationGained, 'an uncovered revision still costs reputation');
  ok(coveredOut.reputationGained === rep.reputationGained, 'a covered revision costs no reputation');
  ok(coveredOut.moneyGained === Math.round(plainOut.moneyGained * (1 - REVISION_ROUND_FEE)), 'a covered revision costs the round fee instead');
}
ok(sawRevision, 'a revision occurs for some seed with a serious open issue');
ok(JSON.stringify(applyDeliveryDecision(rep, issues, 'deliver', 's', 2)) === JSON.stringify(applyDeliveryDecision(rep, issues, 'deliver', 's', 2)), 'the covered outcome is deterministic');

// Setup synergy: same service within a couple of days saves setup hours; otherwise nothing.
const svc = quoteFor(base, offers[0]).service;
const logged = (service: string, day: number) => ({ ...base, currentDay: day, serviceLog: [{ projectId: 'x', service, roomHours: 10, revenue: 500, day: 4 }] }) as never;
ok(setupSynergyHours(logged(svc, 4 + SYNERGY_DAYS), svc) >= 1, 'a repeat of the same service within the window saves setup hours');
ok(setupSynergyHours(logged(svc, 4 + SYNERGY_DAYS + 1), svc) === 0, 'the saving expires after the window');
ok(setupSynergyHours(logged(svc === 'mix' ? 'master' : 'mix', 5), svc) === 0, 'a different service gets no saving');
const withSynergy = quoteFor(logged(svc, 5), offers[0]);
ok(withSynergy.roomHours === quoteFor(base, offers[0]).roomHours - withSynergy.setupSavedHours && withSynergy.setupSavedHours > 0, 'the quote shows the saved hours');

// Utilization log: once per project, capped, summarised.
const rec = (i: number) => ({ projectId: `p${i}`, service: 'mix' as const, roomHours: 10, revenue: 500, day: 4 });
let log = recordService(undefined, rec(0));
ok(recordService(log, rec(0)) === log, 'a project is logged once');
for (let i = 1; i < SERVICE_LOG_CAP + 5; i++) log = recordService(log, rec(i));
ok(log.length === SERVICE_LOG_CAP && log[log.length - 1].projectId === `p${SERVICE_LOG_CAP + 4}`, 'the log is capped, oldest rolling off');
const sum = serviceSummary({ ...base, serviceLog: log.slice(-3), activeProject: null, activeProjects: [] });
ok(sum.sessions === 3 && sum.bookedHours === 30 && sum.revenuePerHour === 50, 'the summary reports sessions, hours and revenue per booked hour');
ok(sum.topServices[0].service === 'mix' && sum.weekUtilization === 0 && sum.idleDays === 7, 'an empty week reads as idle days, top service named');
ok(serviceSummary({ ...base, serviceLog: undefined, activeProject: null, activeProjects: [] }).sessions === 0, 'legacy saves with no log are safe');
const settledLog = applyReportToState({ ...base, activeProject: { ...newClient, id: 'lg-1' } as Project, activeProjects: [] }, report('lg-1', 1000));
ok(settledLog.serviceLog?.length === 1 && settledLog.serviceLog[0].revenue === 1000 && settledLog.serviceLog[0].day === base.currentDay, 'settlement logs the session once');


// Seeded sweep (#51 balance question): the scarce resource is the session slot, so compare margin per slot by service.
const perSlot: Record<string, { n: number; margin: number }> = {};
for (const era of ['modern', '90s', '70s', '80s'] as const) for (let lvl = 1; lvl <= 15; lvl += 2) for (let r = 0; r < 4; r++) {
  for (const p of generateNewProjects(6, lvl, era as never, [], 1, 5 + r)) {
    const q = quoteFor(base, p);
    const a = (perSlot[q.service] ??= { n: 0, margin: 0 });
    a.n++; a.margin += q.margin / Math.max(1, p.stages.length);
  }
}
const means = Object.entries(perSlot).map(([k, a]) => [k, a.margin / a.n] as const).sort((x, y) => y[1] - x[1]);
ok(means.length === 5, 'the sweep sees all five service archetypes');
ok(means.every(([, m]) => m > 0), 'no service loses money per slot on average');
ok(means[0][1] / means[means.length - 1][1] < 2.5, `no service dominates: best/worst margin per slot is ${(means[0][1] / means[means.length - 1][1]).toFixed(2)}x (limit 2.5x)`);
ok(means[0][0] !== 'full-production', 'full production is not always the optimal service');
ok((perSlot.master.margin / perSlot.master.n) < 2 * (perSlot.tracking.margin / perSlot.tracking.n), 'mastering is not free money compared with tracking');

console.log(`service-quote: all ${n} checks passed`);
