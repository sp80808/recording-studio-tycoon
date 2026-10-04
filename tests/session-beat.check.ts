import assert from 'node:assert/strict';
import type { Project, SessionIntervention } from '../src/types/game';
import { createNewGameState } from '../src/utils/newGameState';
import { deriveSessionBeat } from '../src/session/sessionBeat';

const initial = createNewGameState({ cityId: 'london', selectedEra: 'classic_rock' });
const seed = initial.availableProjects[0];

const projectAt = (stageName: string, workUnitsCompleted = 0): Project => ({
  ...seed,
  id: 'first-paid-session',
  currentStageIndex: 0,
  awaitingReview: false,
  stages: [{
    stageName,
    focusAreas: ['performance'],
    workUnitsBase: 10,
    workUnitsCompleted,
    completed: false,
  }],
});

const interventionFor = (project: Project, stageIndex = project.currentStageIndex): SessionIntervention => ({
  id: 'intervention:first-paid-session:0:1',
  projectId: project.id,
  stageIndex,
  type: 'vocal',
  reason: 'Move the singer closer to the mic.',
  priority: 10,
  expiresAt: 1_000_000,
});

const fresh = projectAt('Digging');
assert.equal(deriveSessionBeat(fresh).beat, 'setup', 'fresh non-recording work starts with setup');
assert.equal(deriveSessionBeat(projectAt('Tracking')).beat, 'soundcheck', 'fresh tracking starts at soundcheck');

for (const stageName of ['Digging', 'Sampling', 'Sound Design']) {
  const beat = deriveSessionBeat(projectAt(stageName, 2));
  assert.equal(beat.beat, 'recording', `${stageName} reflects actual work instead of remaining in setup`);
  assert.equal(beat.primaryAction, 'lock');
  assert.equal(beat.primaryTarget, 'console');
}

const pendingProject = projectAt('Sampling', 2);
const pending = deriveSessionBeat(pendingProject, interventionFor(pendingProject));
assert.equal(pending.beat, 'decision');
assert.equal(pending.primaryAction, 'resolve');
assert.equal(pending.primaryTarget, 'mic');
assert.equal(pending.detail, 'Move the singer closer to the mic.');

const stale = deriveSessionBeat(pendingProject, interventionFor(pendingProject, 1));
assert.equal(stale.beat, 'recording', 'an intervention from another stage does not hijack the current beat');

const awaiting = { ...projectAt('Mastering', 10), awaitingReview: true };
assert.equal(deriveSessionBeat(awaiting).beat, 'wrap');
assert.equal(deriveSessionBeat({
  ...projectAt('Sound Design', 10),
  stages: [{ ...projectAt('Sound Design', 10).stages[0], completed: true }],
}).beat, 'wrap', 'fully completed work wraps even before awaitingReview migration catches up');

assert.equal(deriveSessionBeat(projectAt('Mixing', 3)).beat, 'playback');
assert.equal(deriveSessionBeat(projectAt('Mastering', 3)).beat, 'playback');

console.log('session beat check passed');
