import assert from 'node:assert/strict';
import { advanceInterventionCheckpoint, claimInterventionReward, currentIntervention, mirrorInterventionState, resolveIntervention } from '../src/session/interventionCheckpoint';
import { createNewGameState } from '../src/utils/newGameState';
import { migrateAndInitializeGameState } from '../src/utils/gameStateUtils';
import type { Project } from '../src/types/game';

const state = createNewGameState({ cityId: 'london', selectedEra: 'classic_rock' });
state.playerData.level = 5;
let project: Project = { ...state.availableProjects[0], id: 'checkpoint-proof', genre: 'Rock', currentStageIndex: 0,
  stages: [0, 1, 2].map(() => ({ stageName: 'Recording performance', focusAreas: ['performance'], workUnitsBase: 100, workUnitsCompleted: 25, completed: false })),
  focusAllocation: { performance: 60, soundCapture: 25, layering: 15 },
};
for (let bucket = 1; bucket <= 40 && !project.interventionCheckpoint?.pending; bucket++) {
  project = advanceInterventionCheckpoint({ ...project, workSessionCount: bucket }, state, 1000);
}
const pending = project.interventionCheckpoint?.pending;
assert.ok(pending, 'existing seeded rules produce a real pending intervention');
const saved = JSON.parse(JSON.stringify(project)) as Project;
const resumed = advanceInterventionCheckpoint({ ...saved, workSessionCount: saved.workSessionCount + 4.5 }, state, 2000);
assert.deepEqual(resumed.interventionCheckpoint, project.interventionCheckpoint, 'offline work cannot redraw a pending choice');
assert.equal(currentIntervention(resumed, 2000)?.id, pending.id);
assert.equal(resumed.interventionCheckpoint?.pending?.expiresAt, pending.expiresAt, 'reload cannot renew the expiry');
assert.equal(resolveIntervention(resumed, 'another-choice'), resumed, 'stale callback cannot resolve another opportunity');
const claimed = claimInterventionReward(resumed, pending.id, 2000);
assert.ok(claimed);
assert.equal(claimInterventionReward(claimed, pending.id, 2000), null, 'reward can be claimed only once');
assert.equal(claimInterventionReward(resumed, pending.id, pending.expiresAt), null, 'expired choice cannot award a late result');
const resolved = resolveIntervention(resumed, pending.id);
assert.equal(resolved.interventionCheckpoint?.pending, null);
assert.equal(resolveIntervention(resolved, pending.id), resolved, 'duplicate resolution is a no-op');
assert.equal(advanceInterventionCheckpoint({ ...resolved, workSessionCount: 99 }, state, 2500).interventionCheckpoint?.pending, null, 'resolved stage does not repeat');
assert.equal(resolved.accumulatedCPoints, project.accumulatedCPoints, 'resolution never issues rewards');
const expired = advanceInterventionCheckpoint(saved, state, pending.expiresAt);
assert.equal(expired.interventionCheckpoint?.pending, null);
assert.ok(expired.resolvedInterventionStageKeys?.includes(`${project.id}-0`));
const moved = advanceInterventionCheckpoint({ ...saved, currentStageIndex: 1 }, state, 2000);
assert.equal(currentIntervention(moved, 2000), null, 'old stage choice does not carry into new stage');
assert.ok(moved.resolvedInterventionStageKeys?.includes(`${project.id}-0`));
const mirror = { ...saved, title: 'preserve mirror fields', interventionCheckpoint: undefined };
const synced = mirrorInterventionState(saved, mirror);
assert.equal(synced.title, mirror.title);
assert.deepEqual(synced.interventionCheckpoint, saved.interventionCheckpoint);
assert.equal(mirrorInterventionState(saved, synced), synced);
const migrated = migrateAndInitializeGameState(JSON.parse(JSON.stringify({ ...state, activeProject: saved, activeProjects: [mirror] })));
assert.deepEqual(migrated.activeProjects[0].interventionCheckpoint, migrated.activeProject?.interventionCheckpoint, 'load repairs checkpoint mirror before offline simulation');
const early = { ...project, interventionCheckpoint: undefined, workSessionCount: 1 };
const earlyState = { ...state, playerData: { ...state.playerData, level: 1 } };
const examined = advanceInterventionCheckpoint(early, earlyState, 1000);
assert.equal(examined.interventionCheckpoint?.pending, null);
assert.equal(advanceInterventionCheckpoint(examined, state, 2000), examined, 'examined empty bucket cannot reroll after reload or context change');
console.log('intervention checkpoint save/reload, expiry, resolution and mirror checks passed');
