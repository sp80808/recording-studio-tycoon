/** Booth album-cover wall — settles from financials.reports; no star plaques. */
import assert from 'node:assert/strict';
import {
  getTrophyInput,
  getTrophyWall,
  trophyKey,
  TROPHY_SLOTS,
} from '../src/components/studio/studioDecorConfig';
import type { GameState, ProjectReport } from '../src/types/game';

const report = (over: Partial<ProjectReport> & Pick<ProjectReport, 'projectId'>): ProjectReport => ({
  projectTitle: over.projectTitle ?? `Session ${over.projectId}`,
  overallQualityScore: over.overallQualityScore ?? 70,
  moneyGained: 0,
  reputationGained: 0,
  playerManagementXpGained: 0,
  skillBreakdown: [],
  reviewSnippet: '',
  assignedPerson: over.assignedPerson ?? { type: 'player', id: 'p', name: 'You' },
  genre: over.genre ?? 'Rock',
  ...over,
});

const state = (reports: ProjectReport[]): Pick<GameState, 'financials'> => ({
  financials: { income: 0, expenses: 0, profit: 0, reports },
});

assert.deepEqual(getTrophyInput(state([])).covers, [], 'empty ledger → no covers');

const filled = getTrophyInput(
  state([
    report({ projectId: 'a', projectTitle: 'First Cut', overallQualityScore: 60 }),
    report({ projectId: 'b', projectTitle: 'Second Take', overallQualityScore: 88, genre: 'Jazz' }),
    report({ projectId: 'c', projectTitle: 'Hit Factory', overallQualityScore: 95 }),
  ]),
);
assert.equal(filled.covers.length, 3);
assert.equal(filled.covers[0].title, 'First Cut');
assert.equal(filled.covers[2].score, 95);

const wall = getTrophyWall(filled);
assert.equal(wall.length, TROPHY_SLOTS);
assert.equal(wall[0].kind, 'cover');
assert.equal(wall[0].cover?.projectId, 'c', 'most recent completion fills first slot');
assert.equal(wall[1].cover?.projectId, 'b');
assert.equal(wall[2].cover?.projectId, 'a');
assert.equal(wall[3].kind, 'empty');
assert.equal(wall[5].kind, 'empty');
assert.ok(!wall.some((s) => (s.kind as string) === 'award'), 'no star/award plaques');

const many = getTrophyInput(
  state(Array.from({ length: 10 }, (_, i) => report({ projectId: `p${i}`, overallQualityScore: 50 + i }))),
);
const capped = getTrophyWall(many);
assert.equal(capped.filter((s) => s.kind === 'cover').length, TROPHY_SLOTS);
assert.equal(capped[0].cover?.projectId, 'p9');
assert.equal(capped[5].cover?.projectId, 'p4');

assert.notEqual(trophyKey(filled), trophyKey({ covers: [] }));
assert.equal(trophyKey(filled), trophyKey(filled));

console.log('album-cover-wall.check.ts: ok');
