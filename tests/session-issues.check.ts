import {
  SESSION_EVENTS, phaseForStage, rollPhaseEvent, applySessionEvent, forecastDelivery, applyDeliveryDecision, issueChance,
  MAX_OPEN_ISSUES, MAX_KNOW_HOW_PER_PROJECT, type RollContext, type UnresolvedIssue,
} from '../src/rpg/sessionIssues';
import type { Project, ProjectReport } from '../src/types/game';

let passed = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); passed++; console.log(`PASS: ${m}`); };

const ctx: RollContext = { staff: [{ primaryStats: { creativity: 30, technical: 30, speed: 30 }, genreAffinity: null }], worstGearCondition: 80, fitScore: 60 };
const proj = (id: string, issues: UnresolvedIssue[] = []) => ({ id, unresolvedIssues: issues }) as unknown as Project;
const issue = (n: number, severity: 1 | 2 | 3 = 2): UnresolvedIssue => ({ id: `i${n}`, category: 'noise', severity, phase: 'tracking', cause: 'c', label: 'Noisy take' });
const report: ProjectReport = { projectId: 'p', projectTitle: 'T', overallQualityScore: 80, moneyGained: 1000, reputationGained: 10, playerManagementXpGained: 0, skillBreakdown: [], reviewSnippet: 'Good.', assignedPerson: { type: 'player', id: 'player', name: 'You' } };

for (const phase of ['tracking', 'mix', 'qc'] as const) {
  const pool = SESSION_EVENTS.filter((e) => e.phase === phase);
  ok(pool.length === 3 && pool.some((e) => e.issue) && pool.some((e) => e.clears), `${phase} has 3 distinct events incl. a bad and a good one`);
}
ok(phaseForStage('Final Mix & Mastering', 2, 3) === 'qc' && phaseForStage('Warm Mix', 1, 3) === 'mix' && phaseForStage('Vocal Tracking & Ad-libs', 0, 3) === 'tracking' && phaseForStage('Concept', 0, 3) === null, 'stage names map to phases');

const a = JSON.stringify(Array.from({ length: 20 }, (_, i) => rollPhaseEvent(proj('p1', [issue(1)]), 'tracking', i, ctx)));
const b = JSON.stringify(Array.from({ length: 20 }, (_, i) => rollPhaseEvent(proj('p1', [issue(1)]), 'tracking', i, ctx)));
ok(a === b, 'seeded replay produces identical events');

const full = Array.from({ length: MAX_OPEN_ISSUES }, (_, i) => issue(i));
let grew = false;
for (let i = 0; i < 200; i++) { const e = rollPhaseEvent(proj(`c${i}`, full), 'mix', 1, ctx); if (e?.issue) grew = true; }
ok(!grew, 'issues are capped');
ok(issueChance({ ...ctx, staff: [{ primaryStats: { creativity: 0, technical: 90, speed: 0 }, genreAffinity: null }] }) < issueChance({ ...ctx, staff: [{ primaryStats: { creativity: 0, technical: 10, speed: 0 }, genreAffinity: null }] }), 'skilled crew lowers issue chance');
ok(issueChance({ staff: [{ primaryStats: { creativity: 0, technical: 500, speed: 0 }, genreAffinity: null }], worstGearCondition: 100, fitScore: 100 }) >= 0.15, 'risk never reaches zero');

const bad = SESSION_EVENTS.find((e) => e.id === 'noisy-take')!;
const p2 = applySessionEvent(proj('p2'), bad, 0);
ok(p2.unresolvedIssues?.length === 1 && p2.unresolvedIssues[0].cause.length > 0, 'bad event leaves an explainable issue');
const good = SESSION_EVENTS.find((e) => e.id === 'great-take')!;
ok(SESSION_EVENTS.every((e) => (e.habit ?? '').length > 15), 'every session event teaches a professional habit');
ok(p2.unresolvedIssues?.[0].habit === bad.habit, 'issues carry the habit for the delivery dialog');
ok(applySessionEvent(p2, good, 1).unresolvedIssues?.length === 0, 'good event clears an issue');

const issues = [issue(1, 3), issue(2, 2)];
const f = forecastDelivery(issues, 1000);
ok(f.deliver.qualityPenalty <= 12 && f.deliver.revisionChance <= 60 && f.polish.knowHow <= MAX_KNOW_HOW_PER_PROJECT, 'forecast is bounded');
const rushed = applyDeliveryDecision(report, issues, 'deliver', 'p');
const polished = applyDeliveryDecision(report, issues, 'polish', 'p');
ok(rushed.overallQualityScore < report.overallQualityScore && rushed.moneyGained < report.moneyGained, 'delivering early costs quality and fee');
ok(polished.moneyGained < report.moneyGained && polished.moneyGained > rushed.moneyGained - 1 || polished.overallQualityScore > rushed.overallQualityScore, 'polishing costs studio time but protects quality');
ok((polished.knowHowGained ?? 0) >= 1 && (polished.knowHowGained ?? 0) <= MAX_KNOW_HOW_PER_PROJECT, 'polish grants bounded Know-How');
ok(rushed.knowHowGained === undefined, 'delivering early teaches nothing');
ok(JSON.stringify(applyDeliveryDecision(report, issues, 'deliver', 'p')) === JSON.stringify(rushed), 'delivery outcome is deterministic');
ok(applyDeliveryDecision(report, [], 'deliver', 'p') === report, 'no issues leaves report untouched');
ok(rushed.reviewSnippet.includes('main cause'), 'outcome names the main cause');
console.log(`\n${passed} checks passed`);
