/** Service quote and deposits (#51 first slice): readable quote, cash-timing-only deposit. */
import {
  quoteFor, depositFor, settlementAfterDeposit, marginBandFor, DEPOSIT_RATE, TRUSTED_AFTER_SESSIONS,
} from '../src/rpg/serviceQuote';
import { applyReportToState } from '../src/game-mechanics/ProjectService';
import { getProjectPnl, getTotalIncome, earn } from '../src/economy/ledger';
import { generateNewProjects } from '../src/utils/projectUtils';
import { createNewGameState } from '../src/utils/newGameState';
import { fillerJobsFor } from '../src/rpg/fillerJobs';
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
console.log(`service-quote: all ${n} checks passed`);
