import assert from 'node:assert/strict';
import { advanceInterventionCheckpoint } from '../src/session/interventionCheckpoint';
import { createNewGameState } from '../src/utils/newGameState';
import { generateProjectReview, FIRST_SESSION_QUALITY_FLOOR } from '../src/utils/projectReviewUtils';
import { isDebugLogging } from '../src/utils/debugLog';
import type { Project } from '../src/types/game';

const state = createNewGameState({ cityId: 'london', selectedEra: 'classic_rock' });
assert.equal(state.playerData.level, 1);
// Luck-independent: many fresh offers, every Easy project, every stage, many seeds.
const offers: Project[] = [];
for (let i = 0; i < 40; i++) offers.push(...createNewGameState({ cityId: 'london', selectedEra: 'classic_rock' }).availableProjects);
const easy = offers.filter(p => p.difficulty <= 2);
assert.ok(easy.length > 0, 'at least one Easy offer across fresh states');
const base = easy[0];
let checked = 0;
for (const proj of easy) {
  for (let si = 0; si < proj.stages.length; si++) {
    for (const seed of ['a', 'b', 'c', 'd', 'e']) {
      const id = `easy-${seed}-${proj.id}-${si}`;
      const first = advanceInterventionCheckpoint({ ...proj, id, currentStageIndex: si, interventionCheckpoint: undefined, resolvedInterventionStageKeys: [], workSessionCount: 3 }, state, 1000);
      const again = advanceInterventionCheckpoint({ ...proj, id, currentStageIndex: si, interventionCheckpoint: undefined, resolvedInterventionStageKeys: [], workSessionCount: 3 }, state, 1000);
      assert.ok(first.interventionCheckpoint?.pending, `Easy first session offers an intervention (${proj.genre}/${proj.stages[si].stageName})`);
      assert.deepEqual(first.interventionCheckpoint, again.interventionCheckpoint, 'deterministic by project seed');
      checked++;
    }
  }
}
assert.ok(checked > 50);
// Once something has been offered and resolved, the safety net never fires again.
let p: Project = { ...base, id: 'once', resolvedInterventionStageKeys: ['once-0'], workSessionCount: 3 };
p = advanceInterventionCheckpoint(p, state, 1000);
assert.equal(p.interventionCheckpoint?.pending ?? null, null, 'no repeat prompts after the first');
// Harder projects are not affected by the net at take 3.
const hard: Project = { ...base, id: 'hard', difficulty: 4, workSessionCount: 3 };
assert.equal(advanceInterventionCheckpoint(hard, state, 1000).interventionCheckpoint?.pending ?? null, null);

const person = { type: 'player' as const, id: 'player', name: 'You' };
const rep = (first: boolean) => generateProjectReview({ ...base, difficulty: 1, accumulatedCPoints: 0, accumulatedTPoints: 0 }, person, 0, state.playerData, [], { firstSession: first });
const kind = rep(true);
assert.ok(kind.overallQualityScore >= FIRST_SESSION_QUALITY_FLOOR, 'first session floor');
assert.ok(!/drawing board|hit the mark/.test(kind.reviewSnippet), 'no hostile first-session critique');
assert.ok(rep(false).overallQualityScore <= kind.overallQualityScore, 'floor only applies to the first session');
assert.equal(isDebugLogging(), false, 'debug logging is off by default');
console.log('early-game feel: first-session intervention, kind first review, debug gate passed');
