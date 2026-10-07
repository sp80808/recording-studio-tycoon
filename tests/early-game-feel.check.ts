import assert from 'node:assert/strict';
import { advanceInterventionCheckpoint } from '../src/session/interventionCheckpoint';
import { createNewGameState } from '../src/utils/newGameState';
import { generateProjectReview, FIRST_SESSION_QUALITY_FLOOR } from '../src/utils/projectReviewUtils';
import { isDebugLogging } from '../src/utils/debugLog';
import type { Project } from '../src/types/game';

const state = createNewGameState({ cityId: 'london', selectedEra: 'classic_rock' });
assert.equal(state.playerData.level, 1);
const base = state.availableProjects.find(p => p.difficulty <= 1)!;
const run = (id: string) => {
  let p: Project = { ...base, id, interventionCheckpoint: undefined, resolvedInterventionStageKeys: [] };
  const seen: string[] = [];
  for (let b = 1; b <= 8; b++) {
    p = { ...p, workSessionCount: b };
    p = advanceInterventionCheckpoint(p, state, 1000);
    if (p.interventionCheckpoint?.pending) { seen.push(`${b}:${p.interventionCheckpoint.pending.type}`); break; }
  }
  return seen;
};
for (const id of ['a', 'b', 'c', 'd', 'e', 'f', 'g']) {
  const seen = run(`easy-${id}`);
  assert.equal(seen.length, 1, `Easy first session gets an intervention opportunity (${id})`);
  assert.deepEqual(run(`easy-${id}`), seen, 'deterministic by project seed');
}
// Once something has been offered and resolved, the safety net never fires again.
let p: Project = { ...base, id: 'once', resolvedInterventionStageKeys: ['once-0'], workSessionCount: 3 };
p = advanceInterventionCheckpoint(p, state, 1000);
assert.equal(p.interventionCheckpoint?.pending ?? null, null, 'no repeat prompts after the first');
// Harder projects are not affected by the net at take 3.
const hard: Project = { ...base, id: 'hard', difficulty: 4, workSessionCount: 3 };
assert.equal(advanceInterventionCheckpoint(hard, state, 1000).interventionCheckpoint?.pending ?? null, null);

const person = { type: 'player' as const, id: 'player', name: 'You' };
const rep = (first: boolean) => generateProjectReview({ ...base, accumulatedCPoints: 0, accumulatedTPoints: 0 }, person, 0, state.playerData, [], { firstSession: first });
const kind = rep(true);
assert.ok(kind.overallQualityScore >= FIRST_SESSION_QUALITY_FLOOR, 'first session floor');
assert.ok(!/drawing board|hit the mark/.test(kind.reviewSnippet), 'no hostile first-session critique');
assert.ok(rep(false).overallQualityScore <= kind.overallQualityScore, 'floor only applies to the first session');
assert.equal(isDebugLogging(), false, 'debug logging is off by default');
console.log('early-game feel: first-session intervention, kind first review, debug gate passed');
