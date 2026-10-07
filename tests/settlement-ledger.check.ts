/** Review ledger (#336/#343, #338/#345): itemised lines sum to the real balance change; honest copy. */
import fs from 'node:fs';
import { buildSettlementLedger } from '../src/rpg/settlementLedger';
import { applyReportToState } from '../src/game-mechanics/ProjectService';
import { applyDeliveryDecision, type UnresolvedIssue } from '../src/rpg/sessionIssues';
import { earn } from '../src/economy/ledger';
import { createNewGameState } from '../src/utils/newGameState';
import { generateNewProjects } from '../src/utils/projectUtils';
import { generateProjectReview } from '../src/utils/projectReviewUtils';
import { applyLabelOutcome, labelSettlementAdjustment, labelOutcome, resolveTerms, NO_CHOICES } from '../src/rpg/labelAccounts';
import { pressQuote, humanizeSkill } from '../src/utils/reviewCopy';
import type { Project, ProjectReport } from '../src/types/game';

let n = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); n++; console.log(`PASS: ${m}`); };

const base = { ...createNewGameState(), money: 9000, currentDay: 3 };
const offer = generateNewProjects(1, 4, 'modern', [], 1, 4)[0];
const report = (id: string, gained: number): ProjectReport => ({
  projectId: id, projectTitle: 'Demo', overallQualityScore: 36, moneyGained: gained, reputationGained: 4,
  playerManagementXpGained: 0, skillBreakdown: [], reviewSnippet: 'ok',
  assignedPerson: { type: 'player', id: 'player', name: 'You' },
});
const issues = [{ id: 'i1', label: 'Hum', cause: 'ground loop', phase: 'recording', severity: 3 }, { id: 'i2', label: 'Click', cause: 'clock', phase: 'recording', severity: 1 }] as unknown as UnresolvedIssue[];

const scenarios: Array<[string, number | undefined, 'none' | 'polish' | 'deliver']> = [
  ['no deposit, no issues', undefined, 'none'],
  ['deposit, no issues', 422, 'none'],
  ['deposit and polish', 422, 'polish'],
  ['deposit and early delivery', 422, 'deliver'],
  ['no deposit, polish', undefined, 'polish'],
  ['deposit larger than the shrunken payout', 5000, 'deliver'],
];
for (const [name, deposit, decision] of scenarios) {
  const project = { ...offer, id: `p-${name}`, payoutBase: 1055, depositPaid: deposit } as Project;
  let rep = report(project.id, 1432);
  if (decision !== 'none') rep = applyDeliveryDecision(rep, issues, decision, project.id, 0);
  const open = { ...base, activeProject: project, activeProjects: [] as Project[] };
  const banked = deposit ? earn(open, deposit, { category: 'deposit-income', projectId: project.id, sourceId: `deposit-${project.id}` }) : open;
  const settled = applyReportToState(banked, rep);
  const ledger = buildSettlementLedger(rep, project.payoutBase, project.depositPaid);
  ok(ledger.bookedFee + ledger.performanceAdjustment + ledger.deliveryAdjustment === ledger.payout, `${name}: fee + adjustments = payout`);
  ok(ledger.payout - ledger.depositPaid === ledger.netCredit, `${name}: payout - deposit = credited now`);
  ok(ledger.netCredit === settled.money - banked.money, `${name}: credited now equals the real balance change`);
  ok(ledger.payout === rep.moneyGained, `${name}: payout matches the review Money`);
  if (decision === 'polish') ok(ledger.deliveryAdjustment < 0 && ledger.deliveryLabel === 'Polish before delivery', `${name}: polish is itemised as a debit`);
}

// Label contracts (#369): the on-time bonus / late cut appears as a ledger line and still sums to the balance delta.
for (const [name, quality, bookedDay] of [['on time and on target', 80, 3], ['late delivery', 80, -30], ['short of target', 10, 3]] as const) {
  const base0 = { baseFee: 1200, baseDeadlineDays: 10, baseTarget: 60, baseRevisions: 1 };
  const terms = { labelId: 'l1', labelName: 'Northside Records', tier: 'indie' as const, ...base0, choices: NO_CHOICES, ...resolveTerms(base0, NO_CHOICES) };
  const project = { ...offer, id: `lbl-${name}`, payoutBase: 1200, bookedDay, labelTerms: terms } as Project;
  const rep = report(project.id, 1200);
  rep.overallQualityScore = quality;
  const open = { ...base, activeProject: project, activeProjects: [] as Project[] };
  const adj = labelSettlementAdjustment(open, project, quality, rep.moneyGained);
  ok(!!adj && adj.amount === labelOutcome(terms, Math.max(1, open.currentDay - bookedDay + 1), quality, 1200).money, `${name}: ledger adjustment matches the label outcome`);
  const ledger = buildSettlementLedger(rep, 1200, undefined, adj);
  const settled = applyLabelOutcome(applyReportToState(open, rep), project, quality, rep.moneyGained);
  ok(ledger.netCredit === settled.money - open.money, `${name}: credited now (with label line) equals the real balance change`);
  ok(ledger.labelAdjustment !== 0 && ledger.labelLabel.includes('Northside Records'), `${name}: the label line is itemised and named`);
}
ok(labelSettlementAdjustment(base, { ...offer } as Project, 50, 100) === undefined, 'non-label projects get no label line');
ok(buildSettlementLedger(report('x', 500), 500).labelAdjustment === 0, 'no label line when there is no label contract');
ok(fs.readFileSync('src/components/modals/ProjectReviewModal.tsx', 'utf8').includes('ledger.labelAdjustment'), 'the review modal renders the label line');

// Copy: one quote mark pair, readable skill names, honest cap text.
ok(pressQuote('"Cut" turned out fine.') === '"Cut" turned out fine.', 'a snippet that opens with a quote is not wrapped again');
ok(pressQuote('Fine work.') === '“Fine work.”', 'plain snippets get one pair of quotes');
ok(humanizeSkill('soundDesign') === 'sound design', 'raw skill keys read as words');

const lowProject = { ...offer, stageGrades: ['Bronze', 'Bronze', 'Bronze'], accumulatedCPoints: 0, accumulatedTPoints: 0, minigamePoints: 0 } as Project;
const low = generateProjectReview(lowProject, { type: 'player', id: 'player', name: 'You' }, 10, base.playerData, [], undefined);
ok(low.overallQualityScore <= 89 && !low.reviewSnippet.includes('capped this project at A'), 'no cap line when the cap changed nothing');
ok(low.reviewSnippet.includes('Stage grades: Bronze, Bronze, Bronze'), 'the stage grades are still listed');
ok(!/led the session/.test(low.reviewSnippet) || !/[a-z][A-Z]\w* led the session/.test(low.reviewSnippet), 'the review prose has no raw camelCase skill keys');

// No remote calls from the review or band flows.
const svc = fs.readFileSync('src/services/pollinations.ts', 'utf8');
ok(!/fetch\(/.test(svc) && !/\/api\/pollinations/.test(svc), 'the art service makes no network request');
ok(!fs.readFileSync('src/components/modals/ProjectReviewModal.tsx', 'utf8').includes('generateReview'), 'the review modal does not request remote text');

console.log(`${n} settlement-ledger checks passed`);
