import assert from 'node:assert/strict';
import {
  AUDIO_CONCEPT_IDS, MINIGAME_CONCEPTS, SESSION_EVENT_CONCEPTS, GEAR_CATEGORY_CONCEPTS,
  conceptsForMinigame, conceptsForSessionEvent, conceptsForGearCategory, isAudioConceptId,
} from '../src/rpg/audioConcepts';
import { SESSION_EVENTS } from '../src/rpg/sessionIssues';
import { createInitialKnowHow, migrateKnowHow, noteConceptsMet, hasMetConcept, type StudioKnowHow } from '../src/rpg/studioKnowHow';

// Every tag points at a known concept; ids are unique.
assert.equal(new Set(AUDIO_CONCEPT_IDS).size, AUDIO_CONCEPT_IDS.length);
for (const map of [MINIGAME_CONCEPTS, SESSION_EVENT_CONCEPTS, GEAR_CATEGORY_CONCEPTS]) {
  for (const list of Object.values(map)) for (const c of list) assert.ok(isAudioConceptId(c), c);
}
// Session event tags refer to real events.
for (const id of Object.keys(SESSION_EVENT_CONCEPTS)) assert.ok(SESSION_EVENTS.some(e => e.id === id), id);
// Every concept is exercised by at least one minigame.
for (const c of AUDIO_CONCEPT_IDS) assert.ok(Object.values(MINIGAME_CONCEPTS).some(l => l.includes(c)), `uncovered ${c}`);
assert.deepEqual(conceptsForMinigame('gain-stage'), ['gain-staging']);
assert.deepEqual(conceptsForMinigame('nope'), []);
assert.deepEqual(conceptsForMinigame(undefined), []);
assert.deepEqual(conceptsForSessionEvent('clipped-render'), ['gain-staging']);
assert.deepEqual(conceptsForGearCategory('microphone'), ['mic-placement']);

// Legacy saves migrate; corrupt entries are dropped.
assert.deepEqual(migrateKnowHow({ conceptsMet: ['eq', 'bogus', 'eq', 3] }).conceptsMet, ['eq']);
assert.deepEqual(migrateKnowHow(undefined), createInitialKnowHow());
assert.equal(migrateKnowHow({ totalEarned: 4 }).conceptsMet, undefined);
assert.equal(createInitialKnowHow().conceptsMet, undefined);

// Immutable, idempotent recording; legacy game without Know-How is tolerated.
const game = { studioKnowHow: createInitialKnowHow() };
const g1 = noteConceptsMet(game, ['eq', 'polarity']);
assert.deepEqual(g1.studioKnowHow.conceptsMet, ['eq', 'polarity']);
assert.equal(game.studioKnowHow.conceptsMet, undefined);
assert.equal(noteConceptsMet(g1, ['eq']), g1);
assert.equal(noteConceptsMet(g1, []), g1);
assert.deepEqual(noteConceptsMet(g1, ['eq', 'compression']).studioKnowHow.conceptsMet, ['eq', 'polarity', 'compression']);
assert.deepEqual(noteConceptsMet({} as { studioKnowHow?: StudioKnowHow }, ['eq']).studioKnowHow?.conceptsMet, ['eq']);
assert.ok(hasMetConcept(g1.studioKnowHow, 'eq'));
assert.ok(!hasMetConcept(undefined, 'eq'));

console.log('audio concepts checks passed');
