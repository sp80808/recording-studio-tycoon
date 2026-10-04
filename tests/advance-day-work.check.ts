import assert from 'node:assert/strict';
import { shouldPerformWorkBeforeAdvance } from '../src/hooks/useGameLogic';
import { createNewGameState } from '../src/utils/newGameState';

const initial = createNewGameState({ cityId: 'london', selectedEra: 'classic_rock' });
const project = initial.availableProjects[0];

assert.equal(
  shouldPerformWorkBeforeAdvance({ activeProject: null, playerData: { dailyWorkCapacity: 3 } }),
  false,
  'an empty studio has no work to spend before day close',
);
assert.equal(
  shouldPerformWorkBeforeAdvance({ activeProject: project, playerData: { dailyWorkCapacity: 0 } }),
  false,
  'intentional zero-energy rest bypasses the failed take path',
);
assert.equal(
  shouldPerformWorkBeforeAdvance({ activeProject: project, playerData: { dailyWorkCapacity: 1 } }),
  true,
  'day close preserves automatic project work when capacity remains',
);

console.log('advance day work check passed');
