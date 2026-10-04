import assert from 'node:assert/strict';
import type { ProjectReport, Project, PlayerData } from '../src/types/game';
import { generateProjectReview } from '../src/utils/projectReviewUtils';
import { sessionWrapSummary, sessionWrapFeedback } from '../src/components/session/SessionWrap';

const report: ProjectReport = {
  projectId: 'paid-session-1',
  projectTitle: 'Needle in the Red',
  genre: 'Soul',
  overallQualityScore: 84,
  moneyGained: 2375,
  reputationGained: 6,
  playerManagementXpGained: 14,
  knowHowGained: 2,
  skillBreakdown: [],
  reviewSnippet: 'A warm, confident room performance.',
  assignedPerson: { type: 'staff', id: 'eng-1', name: 'Mara Cole' },
};

const summary = sessionWrapSummary(report);
assert.equal(summary.title, report.projectTitle);
assert.equal(summary.genre, report.genre);
assert.equal(summary.producer, report.assignedPerson.name);
assert.equal(summary.quality, report.overallQualityScore);
assert.equal(summary.payout, report.moneyGained);
assert.equal(summary.reputation, report.reputationGained);
assert.equal(summary.managementXp, report.playerManagementXpGained);
assert.equal(summary.knowHow, report.knowHowGained);
assert.equal(summary.rank, 'A');

assert.equal(sessionWrapSummary({ ...report, overallQualityScore: 140 }).quality, 100);
assert.equal(sessionWrapSummary({ ...report, overallQualityScore: -5 }).quality, 0);
assert.equal(sessionWrapSummary({ ...report, genre: undefined, knowHowGained: undefined }).genre, 'Studio release');

const entry = (skillName: string, score: number) => ({ skillName, score, initialXp: 0, xpGained: 1, finalXp: 1, initialLevel: 1, finalLevel: 1, xpToNextLevelBefore: 100, xpToNextLevelAfter: 100, levelUps: 0 });
const contributions = [entry('rhythm', 28), entry('vocalComping', 76), entry('mixing', 51), entry('tracking', NaN)];
const feedback = sessionWrapFeedback({ ...report, skillBreakdown: contributions, qualityFactors: ['the crew lifted the takes', 'a great client match helped', 'sharp focus paid off'] });
assert.equal(feedback.strength, 'vocal Comping · 76/100');
assert.equal(feedback.nextFocus, 'rhythm · 28/100');
assert.deepEqual(feedback.factors, ['the crew lifted the takes', 'a great client match helped']);
assert.equal(contributions[0].skillName, 'rhythm', 'feedback must not reorder the canonical report');
assert.deepEqual(sessionWrapFeedback(report), { strength: null, nextFocus: null, factors: [] }, 'legacy empty reports invent no cause');
assert.equal(sessionWrapFeedback({ ...report, skillBreakdown: [entry('mixing', 50), entry('tracking', 50)] }).nextFocus, null, 'equal scores invent no weaker skill');
assert.equal(sessionWrapFeedback({ ...report, skillBreakdown: [entry('mixing', 50)] }).nextFocus, null, 'a single skill cannot be both strength and weakness');

const skill = { level: 2, xp: 0, xpToNextLevel: 100 };
const generated = generateProjectReview({ id: 'receipt-causes', title: 'Studio test', genre: 'Rock', difficulty: 1, payoutBase: 100, repGainBase: 1, matchRating: 'Good', stages: [], workSessionCount: 4, accumulatedCPoints: 20, accumulatedTPoints: 20 } as unknown as Project,
  { type: 'player', id: 'player', name: 'Player' }, 70,
  { skills: { songwriting: skill, rhythm: skill, tracking: skill, mixing: skill, mastering: skill, vocalComping: skill } } as unknown as PlayerData, [], { staffContribution: 8, equipmentQualityBonus: 8 });
assert.ok(generated.qualityFactors?.includes('the assigned crew lifted the takes'), 'receipt uses actual settlement attribution');
for (const cause of generated.qualityFactors ?? []) assert.ok(generated.reviewSnippet.includes(cause), 'structured causes agree with canonical prose');
assert.deepEqual(sessionWrapFeedback(generated).factors, generated.qualityFactors?.slice(0, 2));

console.log('session wrap check passed');
