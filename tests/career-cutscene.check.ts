import assert from 'node:assert/strict';
import { shouldTriggerRisingStudioCutscene } from '../src/components/cutscenes/careerCutscenes';

const save = (reputation: number, level: number) => JSON.stringify({
  timestamp: Date.now(),
  gameState: { reputation, playerData: { level } },
});

assert.equal(shouldTriggerRisingStudioCutscene(null, save(25, 1), false), true);
assert.equal(shouldTriggerRisingStudioCutscene(null, save(10, 3), false), true);
assert.equal(shouldTriggerRisingStudioCutscene(null, save(24, 2), false), false);
assert.equal(shouldTriggerRisingStudioCutscene('same', 'same', false), false);
assert.equal(shouldTriggerRisingStudioCutscene(null, save(99, 9), true), false);
assert.equal(shouldTriggerRisingStudioCutscene(null, '{broken', false), false);

console.log('career cutscene milestone checks passed');
