/** sd3.2 wiring verification: grades carry, bronze caps, stakes settle. */
import { generateProjectReview } from '../src/utils/projectReviewUtils';
import { takeFromRawScore, bestTake, focusMatchFraction } from '../src/rpg/stageGrades';
import type { Project, PlayerData } from '../src/types/game';

let passed = 0;
const ok = (cond: boolean, msg: string): void => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

// Pure take helpers
ok(takeFromRawScore(900) === 'S', 'rawScore 900 -> S take');
ok(takeFromRawScore(500) === 'A', 'rawScore 500 -> A take');
ok(takeFromRawScore(300) === 'B', 'rawScore 300 -> B take');
ok(takeFromRawScore(100) === 'C', 'rawScore 100 -> C take');
ok(bestTake('B', 'S') === 'S' && bestTake(null, 'A') === 'A' && bestTake(undefined, undefined) === null, 'best take wins, null-safe');
ok(focusMatchFraction(true) === 1 && focusMatchFraction(false) === 0.4, 'focus fractions');

const skill = (level: number) => ({ xp: 0, level, xpToNextLevel: 1000 });
const player = {
  skills: {
    songwriting: skill(8), rhythm: skill(8), tracking: skill(8),
    mixing: skill(8), mastering: skill(8), vocalComping: skill(8), soundDesign: skill(8),
  },
} as unknown as PlayerData;

const project = (over: Record<string, unknown> = {}) =>
  ({
    id: 'wire-test-proj',
    title: 'Wire Test',
    genre: 'Rock',
    difficulty: 3,
    payoutBase: 10000,
    repGainBase: 10,
    matchRating: 'Good',
    stages: [],
    workSessionCount: 10,
    accumulatedCPoints: 60,
    accumulatedTPoints: 60,
    minigamePoints: 5,
    ...over,
  }) as unknown as Project;

const me = { type: 'player' as const, id: 'player', name: 'Player' };

// Baseline: no grades, safe stake — legacy behavior, no ledger lines
const base = generateProjectReview(project(), me, 70, player, []);
ok(!base.reviewSnippet.includes('Stage grades'), 'no grades -> no ledger line');
ok(!base.reviewSnippet.includes('gamble'), 'safe stake -> silent');

// Gold carry: two Golds add exactly +8 pre-clamp (identical seed -> identical rolls)
const gold = generateProjectReview(project({ stageGrades: ['Gold', 'Gold'] }), me, 70, player, []);
ok(gold.overallQualityScore - base.overallQualityScore === 8, `two Golds carry +8 (got ${gold.overallQualityScore - base.overallQualityScore})`);
ok(gold.reviewSnippet.includes('Stage grades: Gold, Gold'), 'grades ledger line');

// Bronze cap: maxed inputs still clamp at 89
const maxed = project({ stageGrades: ['Gold', 'Bronze'], difficulty: 5, accumulatedCPoints: 300, accumulatedTPoints: 300, minigamePoints: 10 });
const capped = generateProjectReview(maxed, me, 100, { skills: {
  songwriting: skill(15), rhythm: skill(15), tracking: skill(15),
  mixing: skill(15), mastering: skill(15), vocalComping: skill(15), soundDesign: skill(15),
} } as unknown as PlayerData, []);
ok(capped.overallQualityScore <= 89, `bronze caps at A (got ${capped.overallQualityScore})`);
ok(capped.reviewSnippet.includes('capped this project at A'), 'cap explained in snippet');

// Stakes: ambitious pays 1.6x on hit (same seed -> tight ratio).
// Maxed inputs guarantee clearing the A bar (min quality ~85).
const hiPro = {
  stageGrades: ['Gold', 'Gold'],
  difficulty: 5,
  accumulatedCPoints: 300,
  accumulatedTPoints: 300,
  minigamePoints: 10,
  matchRating: 'Excellent',
};
const hiPlayer = { skills: {
  songwriting: skill(15), rhythm: skill(15), tracking: skill(15),
  mixing: skill(15), mastering: skill(15), vocalComping: skill(15), soundDesign: skill(15),
} } as unknown as PlayerData;
const safe = generateProjectReview(project(hiPro), me, 100, hiPlayer, []);
const amb = generateProjectReview(project({ ...hiPro, stake: 'ambitious' }), me, 100, hiPlayer, []);
const ratio = amb.moneyGained / safe.moneyGained;
ok(ratio > 1.59 && ratio < 1.61, `ambitious pays ~1.6x (got ${ratio.toFixed(3)})`);
ok(amb.reviewSnippet.includes('gamble paid off'), 'stake win ledger line');

// Moonshot miss stings rep
const flop = project({ stageGrades: ['Bronze'], stake: 'moonshot' });
const flopSafe = generateProjectReview({ ...flop, stake: 'safe' } as unknown as Project, me, 70, player, []);
const flopMoon = generateProjectReview(flop, me, 70, player, []);
ok(flopMoon.reputationGained === Math.max(0, flopSafe.reputationGained - 12), 'missed moonshot -12 rep');
ok(flopMoon.reviewSnippet.includes('gamble missed'), 'stake miss ledger line');

console.log(`work-loop-wire: all ${passed} checks passed`);
